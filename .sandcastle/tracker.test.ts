import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discoverTickets } from './tracker.ts';
import { GitHubRequestError, type GitHubClient } from './github.ts';

const sha = 'a'.repeat(40), repo = 'owner/repo';
export function fixture(): GitHubClient {
  const issues = [
    {number: 1, title: 'Parent', body: 'parent', state: 'open'},
    {number: 2, title: 'Child', body: 'child', state: 'open'},
    {number: 3, title: 'Blocker', body: '', state: 'closed', state_reason: 'not_planned', repository_url: 'https://api.github.com/repos/owner/repo'},
  ];
  return {async request<T>(_method: string, path: string): Promise<T> {
    const [p, query = ''] = path.split('?'); const page = Number(new URLSearchParams(query).get('page') ?? 1);
    let value: unknown;
    if (p.endsWith('/branches/main')) value = {commit: {sha}};
    else if (p.endsWith('/issues')) value = page === 1 ? issues : [];
    else if (p.endsWith('/pulls')) value = [];
    else {
      const m = /\/issues\/(\d+)\/(.*)/.exec(p); if (!m) throw new Error(path);
      const n = Number(m[1]);
      if (m[2] === 'parent') {
        if (n === 2) value = {...issues[0], repository_url: 'https://api.github.com/repos/owner/repo'};
        else throw new GitHubRequestError(404);
      }
      else if (m[2] === 'labels') value = n === 1 ? [{name: 'ready-for-agent'}] : [];
      else if (m[2] === 'comments') value = n === 2 && page === 1 ? Array.from({length: 100}, (_, i) => ({body: `owner ${i}`, user: {login: 'owner'}})) : n === 2 && page === 2 ? [{body: 'last owner comment'}] : [];
      else if (m[2] === 'sub_issues') value = n === 1 ? [issues[1]] : [];
      else if (m[2] === 'dependencies/blocked_by') value = n === 2 ? [issues[2]] : [];
      else throw new Error(path);
    }
    return value as T;
  }};
}
test('parent errors fail closed and foreign parents hold', async () => {
  const client = fixture(), original = client.request.bind(client);
  client.request = async <T>(method: string, path: string): Promise<T> => {
    if (path.endsWith('/2/parent')) throw new Error('network error');
    return original<T>(method, path);
  };
  await assert.rejects(discoverTickets(client, repo, 'main'), /network error/);
  client.request = async <T>(method: string, path: string): Promise<T> => path.endsWith('/2/parent')
    ? {number: 1, repository_url: 'https://api.github.com/repos/foreign/repo'} as T : original<T>(method, path);
  assert.equal((await discoverTickets(client, repo, 'main')).tickets.find(t => t.number === 2)?.container, true);
});

test('cycle through a completed blocker holds the dependent', async () => {
  const client = fixture(), original = client.request.bind(client);
  client.request = async <T>(method: string, path: string): Promise<T> => {
    if (path.includes('/3/dependencies/blocked_by')) return [{number: 2, state: 'closed', state_reason: 'completed', repository_url: 'https://api.github.com/repos/owner/repo'}] as T;
    const value = await original<T>(method, path);
    if (path.includes('/issues?') || path.includes('/2/dependencies/blocked_by')) return (value as {number: number}[]).map(x => x.number === 3 ? {...x, state_reason: 'completed'} : x) as T;
    return value;
  };
  const result = await discoverTickets(client, repo, 'main');
  assert.equal(result.dependencies.find(d => d.number === 3)?.state, 'unknown');
});

test('native parent, blockers and paginated comments are discovered', async () => {
  const client = fixture(); const result = await discoverTickets(client, repo, 'main');
  assert.equal(result.tickets.find(t => t.number === 1)?.container, true);
  assert.equal(result.tickets.find(t => t.number === 2)?.parentReady, true);
  assert.deepEqual(result.tickets.find(t => t.number === 2)?.dependencies, [3]);
  assert.equal(result.dependencies[0].state, 'not-planned');
  const original = client.request.bind(client);
  client.request = async <T>(method: string, path: string): Promise<T> => path.includes('/2/comments') && path.includes('page=2') ? [{body: 'changed'}] as T : original<T>(method, path);
  assert.notEqual((await discoverTickets(client, repo, 'main')).fingerprints[2], result.fingerprints[2]);
});
