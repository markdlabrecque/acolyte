import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSandbox } from '@ai-hero/sandcastle';
import { analyzeTicket } from './analyze.ts';
import { type AdapterRuntime } from './adapter.ts';
import { stateRoot } from './config.ts';
import { checked, protectedDocker } from './execution.ts';
import { GitHubRequestError } from './github.ts';
import { RunStore } from './state.ts';
import { discoverTickets } from './tracker.ts';
import { ownedGit } from './workspace.ts';

for (const stale of [false, true]) test(`read-only Luna analysis ${stale ? 'rejects changed context without saving a manifest' : 'saves current conservative claims without creating a run'}`, async () => {
  const root = await mkdtemp(join(tmpdir(), 'analysis-run-')), source = join(root, 'source');
  const repo = 'markdlabrecque/acolyte';
  try {
    await mkdir(source);
    await checked('git', ['init', '--initial-branch=main', source]);
    await writeFile(join(source, 'README.md'), 'Synthetic analysis fixture');
    await ownedGit(source, ['add', '.']);
    await ownedGit(source, ['commit', '-m', 'fixture'], {name: 'Workflow fixture', email: 'fixture@localhost'});
    const baseSha = await ownedGit(source, ['rev-parse', 'HEAD']);
    const item = {number: 7, title: 'Analysis fixture', body: '**Model:** Terra-6.1', state: 'open'};
    let models = 0, closes = 0;
    const io: AdapterRuntime = {
      env: {OPENAI_API_KEY: 'synthetic-analysis-key'}, image: async () => 'sha256:' + 'd'.repeat(64),
      client: {async request<T>(method: string, path: string): Promise<T> {
        assert.equal(method, 'GET');
        if (path.endsWith('/branches/main')) return {commit: {sha: baseSha}} as T;
        if (path.includes('/issues?')) return [item] as T;
        if (path.endsWith('/parent')) throw new GitHubRequestError(404);
        if (path.includes('/labels?')) return [{name: 'ready-for-agent'}] as T;
        return [] as T;
      }},
      prepare: async (_source, clone) => { await ownedGit(source, ['clone', '--no-local', '--no-checkout', source, clone]); await ownedGit(clone, ['remote', 'remove', 'origin']); },
      open: async spec => {
        assert.equal(spec.readonly, true); assert.equal(spec.online, true);
        assert.deepEqual(spec.env, {OPENAI_API_KEY: 'synthetic-analysis-key'});
        const session = await createSandbox({cwd: spec.clone, branch: spec.branch, baseBranch: spec.baseSha, sandbox: protectedDocker(spec, async () => ({exitCode: 0, stdout: '', stderr: ''}))});
        const close = session.close.bind(session);
        session.close = async () => { closes++; return close(); };
        return session;
      },
      model: async (_sandbox, model, prompt, readonly) => {
        models++; assert.equal(model, 'openai/gpt-6-luna'); assert.equal(readonly, true);
        assert.match(prompt, /Analysis fixture/);
        if (stale) item.body += '\nOwner changed acceptance criteria';
        return '{"paths":["README.md","docs/**"]}';
      },
      git: ownedGit, identity: async () => { throw new Error('Analysis must not commit'); }, fetch: async () => { throw new Error('Unexpected fetch'); }, wait: async () => { throw new Error('Unexpected polling'); },
    };
    const store = new RunStore(stateRoot(source)), data = await discoverTickets(io.client, repo, 'main');
    const action = () => analyzeTicket({issue: 7, repoRoot: source, repo, base: 'main', store}, io);
    if (stale) { await assert.rejects(action(), /changed during analysis/); assert.equal(await store.manifest(7, data.fingerprints[7]), undefined); }
    else { assert.deepEqual(await action(), ['README.md', 'docs/**']); assert.equal((await store.manifest(7, data.fingerprints[7]))?.current, true); }
    assert.equal(await store.load(7), undefined); assert.equal(models, 1); assert.equal(closes, 1);
  } finally { await rm(root, {recursive: true, force: true}); }
});
