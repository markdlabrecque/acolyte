import { randomUUID } from 'node:crypto';
import type { GitHubClient } from './github.ts';
import type { LiveRun } from './graph.ts';
import { schedule, type Decision } from './graph.ts';
import { discoverTickets, type WorkItem } from './tracker.ts';
import type { RunStore } from './state.ts';

async function activePulls(client: GitHubClient, repo: string): Promise<LiveRun[]> {
  async function pages<T>(path: string): Promise<T[]> {
    const result: T[] = [];
    for (let page = 1; page <= 1000; page++) {
      const batch = await client.request<T[]>('GET', `${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      if (!Array.isArray(batch)) throw new Error('Invalid pull request list');
      result.push(...batch);
      if (batch.length < 100) return result;
    }
    throw new Error('Pull request pagination limit');
  }
  const pulls = await pages<{number: number; state: string}>(`repos/${repo}/pulls?state=open`);
  const runs: LiveRun[] = [];
  for (const pull of pulls) {
    if (!Number.isSafeInteger(pull.number) || pull.number < 1 || pull.state !== 'open') throw new Error('Invalid pull request');
    const files = await pages<{filename?: unknown; previous_filename?: unknown; status?: unknown}>(`repos/${repo}/pulls/${pull.number}/files`);
    const paths: string[] = [];
    for (const file of files) {
      if (typeof file.filename !== 'string' || !file.filename || (file.status === 'renamed' && (typeof file.previous_filename !== 'string' || !file.previous_filename))) { paths.push(''); continue; }
      paths.push(file.filename);
      if (typeof file.previous_filename === 'string') paths.push(file.previous_filename);
    }
    // GitHub caps the files endpoint at 3000 files; an exact cap is uncertain.
    runs.push({number: -pull.number, predictedPaths: paths.length && files.length < 3000 ? paths : ['']});
  }
  return runs;
}

export async function occupiedRuns(client: GitHubClient, repo: string, store: RunStore): Promise<LiveRun[]> {
  const remote = await activePulls(client, repo);
  const local = await store.live();
  const occupied: LiveRun[] = [];
  const accountedPrs = new Set<number>();
  for (const run of local) {
    const record = await store.load(run.number);
    if (!record) throw new Error('Run disappeared');
    if (Number.isSafeInteger(record.pr) && (record.pr as number) > 0) {
      const pr = await client.request<{number: number; state: string}>('GET', `repos/${repo}/pulls/${record.pr}`);
      if (pr.number !== record.pr || !['open', 'closed'].includes(pr.state)) throw new Error('Invalid PR evidence');
      if (pr.state === 'closed') continue;
      accountedPrs.add(pr.number);
      const remoteRun = remote.find(r => r.number === -pr.number);
      occupied.push({...run, actualPaths: remoteRun ? [...(run.actualPaths ?? run.predictedPaths), ...remoteRun.predictedPaths] : ['']});
      continue;
    }
    occupied.push(run);
  }
  return [...occupied, ...remote.filter(r => !accountedPrs.has(-r.number))];
}

export async function dispatchOnce(options: {dryRun: boolean; max?: number; issue?: number}, context: {client: GitHubClient; repo: string; base: string; store: RunStore; launch: (item: WorkItem) => Promise<unknown>}): Promise<Decision[]> {
  if (options.max !== undefined && (!Number.isInteger(options.max) || options.max < 0)) throw new Error('Invalid capacity');
  if (options.issue !== undefined && (!Number.isSafeInteger(options.issue) || options.issue < 1)) throw new Error('Invalid issue');
  const discover = async () => {
    const data = await discoverTickets(context.client, context.repo, context.base);
    for (const ticket of data.tickets) {
      ticket.manifest = await context.store.manifest(ticket.number, data.fingerprints[ticket.number]);
      const previous = await context.store.load(ticket.number);
      if (previous && (previous.executionToken || !['waiting', 'queued'].includes(previous.stage))) ticket.holdReason = 'Existing run requires owner inspection; reservation cannot be replayed';
    }
    const occupied = await occupiedRuns(context.client, context.repo, context.store);
    return {data, decisions: schedule(data.tickets, data.dependencies, occupied, options.max, options.issue)};
  };
  if (options.dryRun) return (await discover()).decisions;
  const {data, decisions} = await context.store.withLock(async () => {
    const result = await discover();
    for (const decision of result.decisions) {
      const old = await context.store.load(decision.number);
      const ticket = result.data.tickets.find(t => t.number === decision.number)!;
      if (decision.action === 'launch') {
        if (old && (old.executionToken || !['waiting', 'queued'].includes(old.stage))) throw new Error('Unsafe existing run');
        await context.store.save({issue: decision.number, stage: 'reserved', title: result.data.items.find(i => i.number === decision.number)?.title, repairsUsed: old?.repairsUsed ?? 0, reviews: old?.reviews ?? [], predictedPaths: ticket.manifest!.paths, baseSha: result.data.baseSha, fingerprint: result.data.fingerprints[decision.number], executionToken: randomUUID(), ticketSnapshot: result.data.items.find(i => i.number === decision.number)});
      }
    }
    return result;
  });
  await Promise.all(decisions.filter(d => d.action === 'launch').map(async d => {
    try { await context.launch(data.items.find(i => i.number === d.number)!); }
    catch (e) {
      await context.store.withLock(async () => {
        const record = await context.store.load(d.number);
        if (record && record.stage === 'reserved') await context.store.save({...record, stage: 'needs-human', error: 'Launch failed or outcome uncertain'});
      });
      throw e;
    }
  }));
  return decisions;
}
