import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSandbox } from '@ai-hero/sandcastle';
import { executeReserved, type AdapterRuntime } from './adapter.ts';
import { stateRoot } from './config.ts';
import { dispatchOnce } from './dispatch.ts';
import { checked, protectedDocker } from './execution.ts';
import { GitHubRequestError, type GitHubClient } from './github.ts';
import { RunStore } from './state.ts';
import { main } from './main.ts';
import { discoverTickets } from './tracker.ts';
import { ownedGit } from './workspace.ts';

const repo = 'markdlabrecque/acolyte', api = `https://api.github.com/repos/${repo}`;
const human = {name: 'Workflow fixture', email: 'fixture@localhost'};
async function fixture(options: {rejects?: number; noCi?: boolean; prOnly?: boolean; withPr?: boolean; changeDuringCi?: 'context' | 'blocker' | 'cancel' | 'paths' | 'readiness'; uncertainPublish?: boolean; changeContext?: boolean; actualConflict?: boolean; advanceBase?: boolean; single?: boolean} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'workflow-adapter-')), source = join(root, 'source');
  await mkdir(source);
  await checked('git', ['init', '--initial-branch=main', source]);
  await writeFile(join(source, 'README.md'), 'fixture');
  await ownedGit(source, ['add', '.']);
  await ownedGit(source, ['commit', '-m', 'fixture'], human);
  const originalBase = await ownedGit(source, ['rev-parse', 'HEAD']);
  let laterBase = originalBase;
  if (options.advanceBase) {
    await writeFile(join(source, 'new-main.txt'), 'independent main change');
    await ownedGit(source, ['add', '.']); await ownedGit(source, ['commit', '-m', 'advance main'], human);
    laterBase = await ownedGit(source, ['rev-parse', 'HEAD']);
  }
  let base = originalBase, head = '', branch = '', published = false, merged = false, implementations = 0, verifications = 0, pushes = 0, posts = 0, puts = 0, waits = 0, contextChanged = false, ciChanged = false;
  let checkpoint: Awaited<ReturnType<RunStore['load']>>;
  const item = {number: 7, title: 'Synthetic feature', body: '**Model:** Terra-6.1', state: 'open'};
  const repository = {id: 123, full_name: repo};
  const client: GitHubClient = {async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let result: unknown;
    if (method === 'POST') {
      assert.equal(path, `repos/${repo}/pulls`); posts++; published = true;
      assert.match((body as {title: string}).title, /^#7: /);
      if (options.uncertainPublish) throw new Error('synthetic uncertain publication');
      result = {number: 101, head: {sha: head}, base: {ref: 'main'}};
    } else if (method === 'PUT') {
      assert.equal(path, `repos/${repo}/pulls/101/merge`); assert.deepEqual(body, {sha: head}); puts++; merged = true;
      result = {merged: true, sha: 'c'.repeat(40)};
    } else {
      assert.equal(method, 'GET');
      if (path.endsWith('/branches/main')) result = {commit: {sha: base}};
      else if (path.includes('/issues?')) result = [{...item, state: ciChanged && options.changeDuringCi === 'cancel' ? 'closed' : 'open'}];
      else if (path.endsWith('/issues/7')) result = {...item, state: merged ? 'closed' : 'open', state_reason: merged ? 'completed' : null};
      else if (path.includes('/issues/7/parent')) throw new GitHubRequestError(404);
      else if (path.includes('/issues/7/labels')) result = ciChanged && options.changeDuringCi === 'readiness' ? [] : [{name: 'ready-for-agent'}];
      else if (path.includes('/issues/7/comments')) result = contextChanged || ciChanged && options.changeDuringCi === 'context' ? [{body: 'Changed acceptance criteria'}] : [];
      else if (path.includes('/issues/7/dependencies/blocked_by')) result = ciChanged && options.changeDuringCi === 'blocker' ? [{number: 8, state: 'open', repository_url: api}] : [];
      else if (path.includes('/issues/7/')) result = [];
      else if (path.includes('/pulls?')) result = published && !merged ? [{number: 101, state: 'open'}, ...(ciChanged && options.changeDuringCi === 'paths' ? [{number: 102, state: 'open'}] : [])] : [];
      else if (path.includes('/pulls/102/files')) result = [{filename: 'feature.ts'}];
      else if (path.includes('/pulls/101/files')) result = [{filename: 'feature.ts'}];
      else if (path.endsWith('/pulls/101')) result = {number: 101, state: merged ? 'closed' : 'open', merged, draft: false, mergeable: true, mergeable_state: 'clean', head: {sha: head, ref: branch, repo: repository}, base: {sha: base, ref: 'main', repo: repository}, merged_at: merged ? '2026-11-07T00:00:00Z' : null, merge_commit_sha: merged ? 'c'.repeat(40) : null};
      else if (path.includes('/compare/')) result = {base_commit: {sha: base}, merge_base_commit: {sha: base}, status: 'ahead', total_commits: 1, commits: [{sha: head}]};
      else if (path.includes('/contents/.github/workflows/ci.yml')) result = {type: 'file', sha: 'b'.repeat(40)};
      else if (path.endsWith('/branches/main/protection')) result = {required_status_checks: {strict: true, contexts: ['tests', 'typecheck'], checks: ['tests', 'typecheck'].map(context => ({context, app_id: 15368}))}, enforce_admins: {enabled: true}, allow_force_pushes: {enabled: false}, allow_deletions: {enabled: false}};
      else if (path.includes('/check-runs?')) result = {total_count: 2, check_runs: ['tests', 'typecheck'].map((name, i) => ({id: i + 1, name, app: {id: 15368}, head_sha: head, status: 'completed', conclusion: 'success'}))};
      else if (path.includes('/status?')) result = {sha: head, total_count: 0, statuses: []};
      else if (path.includes('/actions/runs?')) {
        const run = {id: 21, workflow_id: 31, name: 'CI', path: '.github/workflows/ci.yml', head_sha: head, head_branch: branch, event: options.prOnly ? 'pull_request' : 'push', status: 'completed', conclusion: 'success', repository, head_repository: repository, pull_requests: [{number: 101, url: `${api}/pulls/101`, head: {sha: head, ref: branch, repo: {id: 123, url: api}}, base: {sha: base, ref: 'main', repo: {id: 123, url: api}}}]};
        if (options.changeDuringCi && !ciChanged) run.status = 'in_progress';
        const workflow_runs = options.noCi ? [] : options.withPr ? [run, {...run, id: 22, event: 'pull_request'}] : [run];
        result = {total_count: workflow_runs.length, workflow_runs};
      }
      else if (path.endsWith('/actions/workflows/31')) result = {id: 31, name: 'CI', path: '.github/workflows/ci.yml', state: 'active'};
      else if (path.includes('/actions/runs/21/jobs')) result = {total_count: 2, jobs: ['tests', 'typecheck'].map((name, i) => ({id: i + 1, name, run_id: 21, head_sha: head, status: 'completed', conclusion: 'success', check_run_url: `${api}/check-runs/${i + 1}`}))};
      else throw new Error(`Unexpected synthetic request: ${path}`);
    }
    return result as T;
  }};
  const store = new RunStore(stateRoot(source));
  const save = store.save.bind(store);
  store.save = async record => { if (record.stage === 'waiting-ci') checkpoint = structuredClone(record); await save(record); };
  const io: AdapterRuntime = {
    client, env: {OPENAI_API_KEY: 'synthetic-runtime-coding-credential'}, identity: async () => human, image: async () => 'sha256:' + 'd'.repeat(64),
    prepare: async (_source, clone) => { await ownedGit(source, ['clone', '--no-local', '--no-checkout', source, clone]); await ownedGit(clone, ['remote', 'remove', 'origin']); },
    fetch: async () => base,
    git: async (directory, args, identity) => {
      if (args[0] === 'push') { pushes++; branch = args.at(-1)!.split(':')[0].slice('refs/heads/'.length); head = await ownedGit(directory, ['rev-parse', `refs/heads/${branch}`]); return 'synthetic push'; }
      return ownedGit(directory, args, identity);
    },
    open: async spec => createSandbox({cwd: spec.clone, branch: spec.branch, baseBranch: spec.baseSha, sandbox: protectedDocker(spec, async () => ({exitCode: 0, stdout: 'synthetic command success', stderr: ''}))}),
    model: async (sandbox, model, _prompt, readonly) => {
      if (!readonly) {
        assert.equal(model, 'openai/gpt-6.1-terra'); implementations++;
        await writeFile(join((sandbox as typeof sandbox & {worktreePath: string}).worktreePath, options.actualConflict ? 'other.ts' : 'feature.ts'), `export const attempt = ${implementations};\n`);
        base = laterBase;
        return 'Synthetic implementation, no model call';
      }
      assert.equal(model, 'openai/gpt-6.1-sol'); verifications++;
      const directory = (sandbox as typeof sandbox & {worktreePath: string}).worktreePath;
      const candidate = await ownedGit(directory, ['rev-parse', 'HEAD']);
      assert.equal(await ownedGit(directory, ['merge-base', 'HEAD', base]), base);
      if (options.changeContext) contextChanged = true;
      return JSON.stringify({verdict: verifications <= (options.rejects ?? 0) ? 'REJECT' : 'APPROVE', headSha: candidate, findings: verifications <= (options.rejects ?? 0) ? [`finding ${verifications}`] : []});
    },
    wait: async () => { waits++; ciChanged = true; },
  };
  const data = await discoverTickets(client, repo, 'main');
  await store.saveManifest(7, data.fingerprints[7], ['feature.ts']);
  if (options.actualConflict) await store.save({issue: 8, stage: 'implementing', repairsUsed: 0, reviews: [], predictedPaths: ['other.ts']});
  const run = async () => {
    await main(options.single ? ['run', '--issue', '7', '--live'] : ['dispatch', '--live'], {repoRoot: source, client, store, preflight: async () => {}, output: () => {}, launch: ticket => executeReserved({ticket, repoRoot: source, repo, base: 'main', store}, io)});
    return (await store.load(7))!;
  };
  return {root, store, data, io, source, run, resume: async () => {
    assert.ok(checkpoint); await save(checkpoint); options.noCi = false;
    return executeReserved({ticket: data.items[0], repoRoot: source, repo, base: 'main', store}, io);
  }, counts: () => ({implementations, verifications, pushes, posts, puts, waits}), cleanup: () => rm(root, {recursive: true, force: true})};
}

test('synthetic CLI workflow reaches the real merge gate and exact-head issue closure', async () => {
  const f = await fixture();
  try {
    const r = await f.run();
    assert.equal(r.stage, 'merged', r.error); assert.equal(r.executionClaimed, true); assert.equal(r.pr, 101);
    assert.deepEqual(r.actualPaths, ['feature.ts']);
    assert.equal(r.reviews[0].headSha, r.headSha);
    assert.deepEqual(f.counts(), {implementations: 1, verifications: 1, pushes: 1, posts: 1, puts: 1, waits: 0});
    assert.match(await readFile(join(r.runRoot as string, 'checks-0.log'), 'utf8'), /synthetic command/);
  } finally { await f.cleanup(); }
});

test('single-issue live CLI uses the same scheduler, reservation and complete injected delivery', async () => {
  const f = await fixture({single: true});
  try { const r = await f.run(); assert.equal(r.stage, 'merged', r.error); assert.equal(r.executionClaimed, true); assert.equal(f.counts().puts, 1); }
  finally { await f.cleanup(); }
});

test('each repair has a fresh Sol session and persisted rejected review', async () => {
  const f = await fixture({rejects: 2});
  try {
    const r = await f.run(); assert.equal(r.stage, 'merged', r.error); assert.equal(r.repairsUsed, 2);
    assert.deepEqual(r.reviews.map(r => r.verdict), ['REJECT', 'REJECT', 'APPROVE']);
    assert.equal(new Set(r.reviews.map(r => r.headSha)).size, 3);
    assert.equal(f.counts().implementations, 3); assert.equal(f.counts().verifications, 3);
  } finally { await f.cleanup(); }
});

test('CI polling selects trusted push evidence when PR CI also exists', async () => {
  const f = await fixture({withPr: true});
  try { const r = await f.run(); assert.equal(r.stage, 'merged', r.error); assert.equal(f.counts().puts, 1); }
  finally { await f.cleanup(); }
});

for (const mode of ['noCi', 'prOnly', 'uncertainPublish', 'changeContext', 'actualConflict'] as const) test(`${mode} holds publication/merge and never replays an uncertain effect`, async () => {
  const f = await fixture({[mode]: true});
  try {
    const r = await f.run(); assert.equal(r.stage, 'needs-human'); assert.equal(f.counts().puts, 0);
    if (mode === 'noCi' || mode === 'prOnly') assert.equal(f.counts().waits, 60);
    if (mode === 'actualConflict') assert.deepEqual(r.actualPaths, ['other.ts']);
    const before = f.counts();
    await executeReserved({ticket: f.data.items[0], repoRoot: f.source, repo, base: 'main', store: f.store}, f.io);
    assert.deepEqual(f.counts(), before);
  } finally { await f.cleanup(); }
});

for (const changeDuringCi of ['context', 'blocker', 'cancel', 'paths', 'readiness'] as const) {
  for (const resume of [false, true]) test(`final eligibility fence holds ${changeDuringCi} during CI${resume ? ' recovery' : ''}`, async () => {
    const f = await fixture({changeDuringCi, noCi: resume});
    try {
      let r = await f.run();
      const before = f.counts();
      if (resume) { r = await f.resume(); assert.equal(f.counts().posts, before.posts); assert.equal(f.counts().pushes, before.pushes); assert.equal(f.counts().implementations, before.implementations); }
      assert.equal(r.stage, 'needs-human'); assert.equal(f.counts().puts, 0);
      assert.match(String(r.error), /context changed|Delivery held|Actual changed paths conflict/);
    } finally { await f.cleanup(); }
  });
}

test('stale and noncanonical reservations cannot reach model execution or consume a token', async () => {
  const f = await fixture();
  try {
    await dispatchOnce({dryRun: false, issue: 7}, {client: f.io.client, repo, base: 'main', store: f.store, launch: async () => {}});
    const record = (await f.store.load(7))!;
    await assert.rejects(executeReserved({ticket: f.data.items[0], repoRoot: f.source, repo: 'foreign/repo', base: 'main', store: f.store}, f.io), /Noncanonical/);
    assert.equal((await f.store.load(7))!.executionClaimed, undefined);
    await f.store.saveManifest(7, 'stale-fingerprint', ['feature.ts']);
    await assert.rejects(executeReserved({ticket: f.data.items[0], repoRoot: f.source, repo, base: 'main', store: f.store}, f.io), /context or manifest changed/);
    assert.equal((await f.store.load(7))!.executionToken, record.executionToken);
    assert.equal((await f.store.load(7))!.executionClaimed, undefined); assert.equal(f.counts().implementations, 0);
  } finally { await f.cleanup(); }
});

test('unreviewed candidate rebases under delivery lock before checks and fresh review', async () => {
  const f = await fixture({advanceBase: true});
  try { const r = await f.run(); assert.equal(r.stage, 'merged', r.error); assert.notEqual(r.currentBaseSha, r.baseSha); assert.equal(f.counts().verifications, 1); }
  finally { await f.cleanup(); }
});
