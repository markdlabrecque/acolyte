import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main, parseArgs, publicClient } from './main.ts';
import { RunStore } from './state.ts';
import { GitHubRequestError, type GitHubClient } from './github.ts';
import { parseManifest } from './analyze.ts';

test('arguments reject unsafe and ambiguous invocations', () => {
  assert.deepEqual(parseArgs(['dispatch', '--dry-run', '--base', 'main']), {kind: 'dispatch', base: 'main', live: false});
  assert.deepEqual(parseArgs(['run', '--issue', '1', '--live']), {kind: 'run', base: 'main', live: true, issue: 1});
  assert.deepEqual(parseArgs(['analyze', '--issue', '1', '--live']), {kind: 'analyze', base: 'main', live: true, issue: 1});
  assert.deepEqual(parseArgs(['dispatch', '--live', '--max', '3']), {kind: 'dispatch', base: 'main', live: true, max: 3});
  for (const args of [[], ['dispatch'], ['dispatch', '--max', '4', '--live'], ['dispatch', '--dry-run', '--live'], ['dispatch', '--dry-run', '--base', 'main', '--base', 'other'], ['run', '--issue', '-1', '--live'], ['run', '--live'], ['analyze', '--issue', '1', '--dry-run'], ['board', 'serve', '--port', '65536']]) {
    assert.throws(() => parseArgs(args));
  }
});

test('preview uses only GET and an optional explicitly exported token without auth lookup', async () => {
  const fetch = globalThis.fetch, previous = process.env.GH_TOKEN;
  let calls = 0;
  try {
    process.env.GH_TOKEN = 'synthetic-preview-token';
    globalThis.fetch = (async (url, init) => {
      calls++; assert.equal(String(url), 'https://api.github.com/repos/markdlabrecque/acolyte/issues');
      assert.equal((init!.headers as Record<string, string>).authorization, 'Bearer synthetic-preview-token');
      assert.equal(init!.redirect, 'error'); return Response.json([]);
    }) as typeof globalThis.fetch;
    await publicClient.request('GET', 'repos/markdlabrecque/acolyte/issues');
    await assert.rejects(publicClient.request('POST', 'repos/markdlabrecque/acolyte/issues'));
    await assert.rejects(publicClient.request('GET', 'repos/foreign/repo/issues'));
    assert.equal(calls, 1);
  } finally { globalThis.fetch = fetch; if (previous === undefined) delete process.env.GH_TOKEN; else process.env.GH_TOKEN = previous; }
});

test('analysis accepts conservative path claims but never malformed or escaping paths', () => {
  assert.deepEqual(parseManifest('{"paths":["src/**","docs/","src/**"]}'), ['src/**', 'docs/']);
  assert.deepEqual(parseManifest('{"paths":["*"]}'), ['*']);
  for (const paths of [[], ['.'], ['src/./file'], ['src//file'], ['../outside'], ['/absolute'], ['src/../../outside'], [' leading'], ['bad\\nline'], [false], Array(257).fill('src/')]) assert.throws(() => parseManifest(JSON.stringify({paths})));
});

test('dispatch dry-run reads injected public data without creating state or launching', async () => {
  const root = await mkdtemp(join(tmpdir(), 'workflow-cli-test-'));
  try {
    const client: GitHubClient = {async request<T>(_method: string, path: string): Promise<T> {
      if (path.endsWith('/branches/main')) return {commit: {sha: 'a'.repeat(40)}} as T;
      if (path.includes('/issues?')) return [{number: 1, title: 'Example', body: '', state: 'open'}] as T;
      if (path.endsWith('/parent')) throw new GitHubRequestError(404);
      if (path.includes('/labels?')) return [{name: 'ready-for-agent'}] as T;
      return [] as T;
    }};
    const output: string[] = [];
    await main(['dispatch', '--dry-run'], {client, store: new RunStore(join(root, 'absent')), output: s => output.push(s), preflight: async () => { throw new Error('Dry-run probed credentials or Docker'); }, launch: async () => { throw new Error('Dry-run launched'); }, analyze: async () => { throw new Error('Dry-run analyzed'); }});
    assert.match(output[0], /missing or stale manifest/);
    assert.deepEqual(await readdir(root), []);
  } finally { await rm(root, {recursive: true, force: true}); }
});
