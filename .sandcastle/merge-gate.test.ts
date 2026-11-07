import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { INITIAL_CI_BOOTSTRAP, mergeAfterCi, type MergeRequest } from './merge-gate.ts';
import { GitHubRequestError, type GitHubClient } from './github.ts';

const head = 'a'.repeat(40), base = 'b'.repeat(40), merge = 'c'.repeat(40);
const repo = 'owner/repo';
const request: MergeRequest = { repo, number: 7, expectedHeadSha: head, expectedBase: 'main', review: { verdict: 'APPROVE', headSha: head } };
function fixture(targetRepo = repo) {
  const repo = targetRepo;
  const pr = { number: 7, state: 'open', merged: false, draft: false, head: { sha: head, ref: 'feat/ticket', repo: { full_name: repo, id: 123 } }, base: { sha: base, ref: 'main', repo: { full_name: repo, id: 123 } }, mergeable: true, mergeable_state: 'clean' };
  const protection = { required_status_checks: { strict: true, contexts: ['tests', 'typecheck'], checks: [{ context: 'tests', app_id: 15368 }, { context: 'typecheck', app_id: 15368 }] }, enforce_admins: { enabled: true }, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } };
  const checkRuns = ['tests', 'typecheck'].map((name, i) => ({ id: i + 1, name, app: { id: 15368 }, head_sha: head, status: 'completed', conclusion: 'success' }));
  const checks = { total_count: 2, check_runs: checkRuns };
  const statuses = { sha: head, total_count: 0, statuses: [] as { context: string }[] };
  const run = { id: 10, workflow_id: 20, name: 'CI', path: '.github/workflows/ci.yml', head_sha: head, head_branch: 'feat/ticket', event: 'push', status: 'completed', conclusion: 'success', repository: { full_name: repo, id: 123 }, head_repository: { full_name: repo, id: 123 }, pull_requests: [{ number: 7, url: `https://api.github.com/repos/${repo}/pulls/7`, head: { sha: head, ref: 'feat/ticket', repo: {id: 123, url: `https://api.github.com/repos/${repo}`} }, base: {sha: base, ref: 'main', repo: {id: 123, url: `https://api.github.com/repos/${repo}`} } }] };
  const runs = { total_count: 1, workflow_runs: [run] };
  const workflow = { id: 20, name: 'CI', path: '.github/workflows/ci.yml', state: 'active' };
  const jobs = { total_count: 2, jobs: checkRuns.map(c => ({ id: c.id, name: c.name, run_id: 10, head_sha: head, status: 'completed', conclusion: 'success', check_run_url: `https://api.github.com/repos/${repo}/check-runs/${c.id}` })) };
  const branch = {commit: {sha: base}};
  const comparison = {status: 'ahead', base_commit: {sha: base}, merge_base_commit: {sha: base}, total_commits: 1, commits: [{sha: head}]};
  const f = { pr, protection, checks, statuses, run, runs, workflow, jobs, branch, comparison, workflowFile: { type: 'file', sha: 'd'.repeat(40) }, headWorkflowFile: { type: 'file', sha: 'd'.repeat(40) }, calls: [] as { method: string; path: string; body?: unknown }[], prReads: 0, change: undefined as undefined | (() => void), mergeResult: { merged: true, sha: merge } };
  const client: GitHubClient = { async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    f.calls.push({ method, path, body });
    if (method === 'PUT') return f.mergeResult as T;
    let value: unknown;
    if (path.endsWith('/pulls/7')) {
      f.prReads++;
      if (f.prReads === 2) f.change?.();
      value = f.prReads === 4 ? { ...f.pr, state: 'closed', merged: true, merged_at: '2026-01-01T00:00:00Z', merge_commit_sha: merge } : f.pr;
    } else if (path.includes('/contents/.github/workflows/ci.yml?ref=')) value = path.endsWith(head) ? f.headWorkflowFile : f.workflowFile;
    else if (path.endsWith('/branches/main')) value = f.branch;
    else if (path.includes('/compare/')) value = f.comparison;
    else if (path.endsWith('/protection')) value = f.protection;
    else if (path.includes('/check-runs?')) value = f.checks;
    else if (path.includes('/status?')) value = f.statuses;
    else if (path.includes('/actions/runs?')) value = f.runs;
    else if (path.includes('/actions/workflows/')) value = f.workflow;
    else if (path.includes('/jobs?')) value = f.jobs;
    else throw new Error(`unexpected ${path}`);
    return structuredClone(value) as T;
  } };
  return { f, client };
}

test('merges only current approved head with SHA guard and confirms actual result', async () => {
  const { f, client } = fixture();
  assert.deepEqual(await mergeAfterCi(client, request), { sha: merge, merged: true });
  assert.deepEqual(f.calls.filter(c => c.method === 'PUT').map(c => c.body), [{ sha: head }]);
  assert.equal(f.prReads, 4);
});

test('final trusted eligibility fence executes after CI and blocks the merge write', async () => {
  const {f, client} = fixture(); let fenced = false;
  await assert.rejects(mergeAfterCi(client, {...request, beforeMerge: async () => {
    fenced = true;
    assert.equal(f.calls.filter(c => c.path.includes('/actions/runs?')).length, 2);
    assert.equal(f.calls.some(c => c.method === 'PUT'), false);
    throw new Error('Synthetic owner cancellation');
  }}), /Synthetic owner cancellation/);
  assert.equal(fenced, true); assert.equal(f.calls.some(c => c.method === 'PUT'), false);
});

test('push CI can predate PR creation without mutable PR associations', async () => {
  const {f, client} = fixture(); f.run.pull_requests = [];
  assert.equal((await mergeAfterCi(client, request)).merged, true);
});

test('retargeted alternate-base PR success never substitutes for trusted push CI', async () => {
  const {f, client} = fixture();
  // All current PR/base associations, blobs and ancestry are trusted. The actual
  // execution still used the alternate base merge-ref definition before retarget.
  f.run.event = 'pull_request';
  await assert.rejects(mergeAfterCi(client, request));
  assert.equal(f.calls.some(c => c.method === 'PUT'), false);
});

test('trusted push CI remains unambiguous alongside a PR-triggered workflow run', async () => {
  const {f, client} = fixture();
  f.runs.workflow_runs.push({...structuredClone(f.run), id: 11, event: 'pull_request'});
  f.runs.total_count++;
  f.checks.check_runs.push(...['PR tests', 'PR typecheck'].map((name, i) => ({...f.checks.check_runs[i], id: 100+i, name})));
  f.checks.total_count += 2;
  assert.equal((await mergeAfterCi(client, request)).merged, true);
});

const bad: [string, (f: ReturnType<typeof fixture>['f']) => void][] = [
  ['missing check', f => { f.checks.check_runs.pop(); f.checks.total_count--; }],
  ...['skipped', 'failure', 'cancelled', 'neutral', 'timed_out', 'action_required'].map((v): [string, (f: ReturnType<typeof fixture>['f']) => void] => [v, f => { f.checks.check_runs[0].conclusion = v; }]),
  ['pending', f => { f.checks.check_runs[0].status = 'in_progress'; }],
  ['stale check', f => { f.checks.check_runs[0].head_sha = base; }],
  ['foreign app', f => { f.checks.check_runs[0].app.id = 123; }],
  ['duplicate check', f => { f.checks.check_runs.push({ ...f.checks.check_runs[0] }); f.checks.total_count++; }],
  ['status identity conflict', f => { f.statuses.statuses.push({ context: 'tests' }); f.statuses.total_count++; }],
  ['required app conflict', f => { f.protection.required_status_checks.checks[0].app_id = 123; }],
  ['required missing', f => { f.protection.required_status_checks.contexts.pop(); }],
  ['not strict', f => { f.protection.required_status_checks.strict = false; }],
  ['admin bypass', f => { f.protection.enforce_admins.enabled = false; }],
  ['force push allowed', f => { f.protection.allow_force_pushes.enabled = true; }],
  ['deletion allowed', f => { f.protection.allow_deletions.enabled = true; }],
  ['pagination incomplete', f => { f.checks.total_count++; }],
  ['modified workflow', f => { f.headWorkflowFile.sha = 'e'.repeat(40); }],
  ['foreign workflow', f => { f.run.path = '.github/workflows/other.yml'; }],
  ['foreign repository', f => { f.run.head_repository.full_name = 'evil/repo'; }],
  ['foreign PR', f => { f.run.pull_requests[0].number = 8; }],
  ['CI associated head SHA', f => { f.run.pull_requests[0].head.sha = base; }],
  ['CI associated base SHA', f => { f.run.pull_requests[0].base.sha = head; }],
  ['CI associated base ref', f => { f.run.pull_requests[0].base.ref = 'other'; }],
  ['CI associated head ref', f => { f.run.pull_requests[0].head.ref = 'other'; }],
  ['CI associated head repo', f => { f.run.pull_requests[0].head.repo.id = 999; }],
  ['CI associated base repo', f => { f.run.pull_requests[0].base.repo.id = 999; }],
  ['CI associated repo URL', f => { f.run.pull_requests[0].head.repo.url = 'https://api.github.com/repos/evil/repo'; }],
  ['CI associated PR URL', f => { f.run.pull_requests[0].url = 'https://api.github.com/repos/evil/repo/pulls/7'; }],
  ['CI duplicate association', f => { f.run.pull_requests.push(structuredClone(f.run.pull_requests[0])); }],
  ['current main changed', f => { f.branch.commit.sha = merge; }],
  ['head does not contain main', f => { f.comparison.merge_base_commit.sha = merge; }],
  ['comparison base mismatch', f => { f.comparison.base_commit.sha = merge; }],
  ['comparison tip mismatch', f => { f.comparison.commits[0].sha = merge; }],
  ['comparison truncated', f => { f.comparison.total_commits = 251; }],
  ['wrong event', f => { f.run.event = 'pull_request'; }],
  ['wrong push branch', f => { f.run.head_branch = 'other'; }],
  ['failed run', f => { f.run.conclusion = 'failure'; }],
  ['wrong job id', f => { f.jobs.jobs[0].id = 99; }],
  ['skipped job', f => { f.jobs.jobs[0].conclusion = 'skipped'; }],
  ['workflow inactive', f => { f.workflow.state = 'disabled_manually'; }],
  ['not mergeable', f => { f.pr.mergeable = false; }],
  ['behind', f => { f.pr.mergeable_state = 'behind'; }],
  ['head moved', f => { f.change = () => { f.pr.head.sha = base; }; }],
  ['base moved', f => { f.change = () => { f.pr.base.sha = merge; }; }],
  ['base branch changed', f => { f.change = () => { f.pr.base.ref = 'other'; }; }],
  ['head branch retargeted', f => { f.change = () => { f.pr.head.ref = 'other'; }; }],
];
for (const [name, mutate] of bad) test(`blocks ${name} before merge`, async () => {
  const { f, client } = fixture(); mutate(f);
  await assert.rejects(mergeAfterCi(client, request));
  assert.equal(f.calls.filter(c => c.method === 'PUT').length, 0);
});
test('blocks outdated approval', async () => {
  const { f, client } = fixture();
  await assert.rejects(mergeAfterCi(client, { ...request, review: { verdict: 'APPROVE', headSha: base } }));
  assert.equal(f.calls.length, 0);
});
test('transport errors block before merge', async () => {
  const { f, client } = fixture();
  const broken: GitHubClient = { async request<T>(m: string, p: string, b?: unknown): Promise<T> { if (p.includes('check-runs?')) throw new Error('timeout'); return client.request<T>(m, p, b); } };
  await assert.rejects(mergeAfterCi(broken, request));
  assert.equal(f.calls.filter(c => c.method === 'PUT').length, 0);
});
test('rechecks CI and blocks newly failing evidence', async () => {
  const { f, client } = fixture(); let reads = 0;
  const changing: GitHubClient = { async request<T>(m: string, p: string, b?: unknown): Promise<T> {
    if (p.includes('/check-runs?') && ++reads === 2) f.checks.check_runs[0].conclusion = 'failure';
    return client.request<T>(m, p, b);
  } };
  await assert.rejects(mergeAfterCi(changing, request));
  assert.equal(f.calls.filter(c => c.method === 'PUT').length, 0);
});
test('does not report success if merged PR cannot be confirmed', async () => {
  const { f, client } = fixture();
  const broken: GitHubClient = { async request<T>(m: string, p: string, b?: unknown): Promise<T> {
    const result = await client.request<T>(m, p, b);
    if (p.endsWith('/pulls/7') && f.prReads === 4) throw new Error('timeout');
    return result;
  } };
  await assert.rejects(mergeAfterCi(broken, request));
  assert.equal(f.calls.filter(c => c.method === 'PUT').length, 1);
});
test('does not report success on unconfirmed merge', async () => {
  const { f, client } = fixture(); f.mergeResult.merged = false;
  await assert.rejects(mergeAfterCi(client, request));
});

function bootstrapFixture() {
  const { f, client } = fixture(INITIAL_CI_BOOTSTRAP.repo);
  f.pr.base.sha = INITIAL_CI_BOOTSTRAP.baseSha;
  f.branch.commit.sha = INITIAL_CI_BOOTSTRAP.baseSha;
  f.comparison.base_commit.sha = INITIAL_CI_BOOTSTRAP.baseSha;
  f.comparison.merge_base_commit.sha = INITIAL_CI_BOOTSTRAP.baseSha;
  f.run.pull_requests[0].base.sha = INITIAL_CI_BOOTSTRAP.baseSha;
  f.headWorkflowFile.sha = INITIAL_CI_BOOTSTRAP.workflowBlobSha;
  const guarded: GitHubClient = { async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (path.includes('/contents/.github/workflows/ci.yml?ref=') && !path.endsWith(head)) throw new GitHubRequestError(404);
    return client.request<T>(method, path, body);
  } };
  return { f, client: guarded, request: { ...request, repo: INITIAL_CI_BOOTSTRAP.repo } };
}

test('initial CI trust anchor matches the exact committed workflow bytes', () => {
  const bytes = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url));
  const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(blob, INITIAL_CI_BOOTSTRAP.workflowBlobSha);
});

test('initial workflow installation still requires actual CI and exact reviewed head', async () => {
  const value = bootstrapFixture();
  assert.deepEqual(await mergeAfterCi(value.client, value.request), { sha: merge, merged: true });
  assert.deepEqual(value.f.calls.filter(c => c.method === 'PUT').map(c => c.body), [{ sha: head }]);
});

const unsafeBootstrap: [string, (f: ReturnType<typeof fixture>['f']) => void][] = [
  ['base advanced', f => { f.pr.base.sha = base; }],
  ['workflow bytes changed', f => { f.headWorkflowFile.sha = 'e'.repeat(40); }],
  ['CI missing', f => { f.checks.check_runs = []; f.checks.total_count = 0; }],
  ['CI skipped', f => { f.checks.check_runs[0].conclusion = 'skipped'; }],
  ['CI failing', f => { f.checks.check_runs[0].conclusion = 'failure'; }],
  ['CI pending', f => { f.checks.check_runs[0].status = 'in_progress'; }],
  ['admin protection disabled', f => { f.protection.enforce_admins.enabled = false; }],
];
for (const [name, mutate] of unsafeBootstrap) test(`initial workflow installation blocks ${name}`, async () => {
  const value = bootstrapFixture(); mutate(value.f);
  await assert.rejects(mergeAfterCi(value.client, value.request));
  assert.equal(value.f.calls.filter(c => c.method === 'PUT').length, 0);
});
test('missing base workflow in any other repository blocks even when CI is green', async () => {
  const { f, client } = fixture();
  const missing: GitHubClient = { async request<T>(m: string, p: string, b?: unknown): Promise<T> {
    if (p.includes('/contents/') && p.endsWith(base)) throw new GitHubRequestError(404);
    return client.request<T>(m, p, b);
  } };
  await assert.rejects(mergeAfterCi(missing, request));
  assert.equal(f.calls.filter(c => c.method === 'PUT').length, 0);
});
for (const malformed of [null, false, 0, '', undefined, [], {}]) test(`successful malformed base contents ${JSON.stringify(malformed)} cannot authorize bootstrap`, async () => {
  const value = bootstrapFixture();
  const malformedClient: GitHubClient = { async request<T>(m: string, p: string, b?: unknown): Promise<T> {
    if (p.includes('/contents/') && !p.endsWith(head)) return malformed as T;
    return value.client.request<T>(m, p, b);
  } };
  await assert.rejects(mergeAfterCi(malformedClient, value.request));
  assert.equal(value.f.calls.filter(c => c.method === 'PUT').length, 0);
});

test('unknown workflow-read failure cannot authorize initial installation', async () => {
  const value = bootstrapFixture();
  const broken: GitHubClient = { async request<T>(m: string, p: string, b?: unknown): Promise<T> {
    if (p.includes('/contents/') && !p.endsWith(head)) throw new GitHubRequestError();
    return value.client.request<T>(m, p, b);
  } };
  await assert.rejects(mergeAfterCi(broken, value.request));
  assert.equal(value.f.calls.filter(c => c.method === 'PUT').length, 0);
});
