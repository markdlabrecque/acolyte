import { createHash } from 'node:crypto';
import { GitHubRequestError, type GitHubClient } from './github.ts';
import type { Ticket, Dependency } from './graph.ts';

export interface WorkItem { number: number; title: string; body: string; context?: string }
type Issue = { number: number; title: string; body: string | null; state: string; state_reason?: string | null; repository_url?: string; pull_request?: unknown };
type Label = { name: string };
type Comment = { body?: string; user?: { login?: string; type?: string } };

// REST list endpoints return at most 100 entries; require the terminating short page.
async function pages<T>(client: GitHubClient, path: string): Promise<T[]> {
  const result: T[] = [];
  for (let page = 1; page <= 1000; page++) {
    const value = await client.request<T[]>('GET', `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    if (!Array.isArray(value)) throw new Error(`Invalid list: ${path}`);
    result.push(...value);
    if (value.length < 100) return result;
  }
  throw new Error(`Pagination limit: ${path}`);
}

export async function discoverTickets(client: GitHubClient, repo: string, base: string): Promise<{tickets: Ticket[]; dependencies: Dependency[]; items: WorkItem[]; baseSha: string; fingerprints: Record<number, string>}> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^[\w./-]+$/.test(base)) throw new Error('Invalid repository or base');
  const root = `repos/${repo}`;
  const ref = await client.request<{commit?: {sha?: string}}>('GET', `${root}/branches/${base}`);
  const baseSha = ref.commit?.sha;
  if (!baseSha || !/^[a-f0-9]{40}$/i.test(baseSha)) throw new Error('Invalid base SHA');
  const all = (await pages<Issue>(client, `${root}/issues?state=all`)).filter(i => !i.pull_request);
  const cache = new Map(all.map(i => [i.number, i]));
  const metadata = new Map<number, Promise<{issue: Issue; labels: Label[]; comments: Comment[]; parent?: Issue; children: Issue[]; blockers: Issue[]}>>();
  function details(number: number) {
    let result = metadata.get(number);
    if (!result) {
      result = (async () => {
        const issue = cache.get(number) ?? await client.request<Issue>('GET', `${root}/issues/${number}`);
        if (issue.number !== number || typeof issue.title !== 'string') throw new Error('Invalid issue');
        const [labels, comments, children, blockers, parent] = await Promise.all([
          pages<Label>(client, `${root}/issues/${number}/labels`), pages<Comment>(client, `${root}/issues/${number}/comments`),
          pages<Issue>(client, `${root}/issues/${number}/sub_issues`), pages<Issue>(client, `${root}/issues/${number}/dependencies/blocked_by`),
          client.request<Issue>('GET', `${root}/issues/${number}/parent`).catch(e => {
            if (e instanceof GitHubRequestError && e.status === 404) return undefined;
            throw e;
          }),
        ]);
        return { issue, labels, comments, children, blockers, parent };
      })();
      metadata.set(number, result);
    }
    return result;
  }
  // Build parent relationships from authoritative sub-issue lists, including closed parents.
  const parents = new Map<number, number[]>();
  for (const issue of all) {
    const d = await details(issue.number);
    for (const child of d.children) {
      if (!Number.isSafeInteger(child.number) || child.number < 1) throw new Error('Invalid sub-issue');
      parents.set(child.number, [...(parents.get(child.number) ?? []), issue.number]);
    }
  }
  const tickets: Ticket[] = [], items: WorkItem[] = [], fingerprints: Record<number, string> = {};
  const dependencyStates = new Map<number, Dependency['state']>();
  for (const issue of all) {
    const d = await details(issue.number);
    const ancestry: Awaited<ReturnType<typeof details>>[] = [];
    const visited = new Set([issue.number]);
    let cursor = issue.number, ambiguous = false;
    for (;;) {
      const current = await details(cursor);
      const parent = current.parent;
      const listed = parents.get(cursor) ?? [];
      if (!parent) { if (listed.length) ambiguous = true; break; }
      const sameRepo = parent.repository_url?.toLowerCase() === `https://api.github.com/repos/${repo}`.toLowerCase();
      if (!sameRepo || !Number.isSafeInteger(parent.number) || parent.number < 1 || visited.has(parent.number) || listed.length !== 1 || listed[0] !== parent.number || !cache.has(parent.number)) { ambiguous = true; break; }
      cursor = parent.number; visited.add(cursor); ancestry.push(await details(cursor));
    }
    const blockers = d.blockers;
    for (const blocker of blockers) {
      if (!Number.isSafeInteger(blocker.number) || blocker.number < 1) throw new Error('Invalid blocker');
      const sameRepo = blocker.repository_url?.toLowerCase() === `https://api.github.com/repos/${repo}`.toLowerCase();
      const state: Dependency['state'] = !sameRepo ? 'unknown' : blocker.state === 'open' ? 'open' : blocker.state === 'closed' && blocker.state_reason === 'completed' ? 'completed' : blocker.state === 'closed' && blocker.state_reason === 'not_planned' ? 'not-planned' : 'unknown';
      const previous = dependencyStates.get(blocker.number);
      dependencyStates.set(blocker.number, previous && previous !== state ? 'unknown' : state);
    }
    const comments = (x: typeof d) => x.comments.filter(c => !(c.user?.type === 'Bot' && c.body?.startsWith('<!-- sandcastle:')));
    fingerprints[issue.number] = createHash('sha256').update(JSON.stringify({baseSha, chain: [d, ...ancestry].map(x => ({number: x.issue.number, title: x.issue.title, body: x.issue.body, comments: comments(x)}))})).digest('hex');
    tickets.push({number: issue.number, open: issue.state === 'open', ready: !ambiguous && d.labels.some(l => l.name === 'ready-for-agent'), parentReady: !ambiguous && ancestry.some(x => x.labels.some(l => l.name === 'ready-for-agent')), container: ambiguous || d.children.length > 0, dependencies: blockers.map(b => b.number)});
    items.push({number: issue.number, title: issue.title, body: issue.body ?? '', context: JSON.stringify([d, ...ancestry].map(x => ({number: x.issue.number, title: x.issue.title, body: x.issue.body, comments: comments(x)})))});
  }
  // Follow native blocker edges even through completed issues. A cycle or any
  // uncertain transitive edge makes the immediate dependency unusable.
  const safe = async (number: number, stack: Set<number>): Promise<boolean> => {
    if (stack.has(number) || !cache.has(number)) return false;
    const next = new Set(stack).add(number);
    const d = await details(number);
    if (d.issue.state !== 'closed' || d.issue.state_reason !== 'completed') return false;
    for (const blocker of d.blockers) {
      if (blocker.repository_url?.toLowerCase() !== `https://api.github.com/repos/${repo}`.toLowerCase() ||
          blocker.state !== 'closed' || blocker.state_reason !== 'completed' ||
          !(await safe(blocker.number, next))) return false;
    }
    return true;
  };
  for (const ticket of tickets) for (const number of ticket.dependencies) {
    if (dependencyStates.get(number) === 'completed' && !(await safe(number, new Set([ticket.number])))) dependencyStates.set(number, 'unknown');
  }
  return {tickets, dependencies: [...dependencyStates].map(([number, state]) => ({number, state})), items, baseSha, fingerprints};
}
