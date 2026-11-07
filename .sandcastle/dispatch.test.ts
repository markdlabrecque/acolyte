import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fixture } from './tracker.test.ts';
import { discoverTickets } from './tracker.ts';
import { dispatchOnce } from './dispatch.ts';
import { RunStore } from './state.ts';
import { renderBoard } from './board.ts';
import { serveBoard } from './board-server.ts';

test('manual active PR paths block dispatch; remote uncertainty fails closed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dispatch-pr-')); const store = new RunStore(root);
  const client = fixture(), original = client.request.bind(client);
  client.request = async <T>(method: string, path: string): Promise<T> => {
    if (path.includes('/pulls?')) return [{number: 99, state: 'open'}] as T;
    if (path.includes('/pulls/99/files')) return (new URLSearchParams(path.split('?')[1]).get('page') === '1' ? Array.from({length: 100}, (_, i) => ({filename: `other/${i}`})) : [{filename: 'src/new.ts', previous_filename: 'src/one.ts', status: 'renamed'}]) as T;
    const value = await original<T>(method, path);
    return path.includes('/dependencies/blocked_by') || path.includes('/issues?') ? (value as {number: number}[]).map(x => x.number === 3 ? {...x, state_reason: 'completed'} : x) as T : value;
  };
  try {
    const data = await discoverTickets(client, 'owner/repo', 'main');
    await store.saveManifest(2, data.fingerprints[2], ['src/one.ts']);
    const context = {client, repo: 'owner/repo', base: 'main', store, launch: async () => { throw new Error('unexpected launch'); }};
    assert.equal((await dispatchOnce({dryRun: false}, context)).find(d => d.number === 2)?.reason, 'path conflict');
    const previous = client.request.bind(client);
    client.request = async <T>(method: string, path: string): Promise<T> => { if (path.includes('/pulls/99/files')) throw new Error('offline'); return previous<T>(method, path); };
    await assert.rejects(dispatchOnce({dryRun: false}, context), /offline/);
    assert.equal(await store.load(2), undefined);
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('dry-run is read only, concurrent dispatch reserves only once, board shows real state', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dispatch-')); const root = join(dir, 'state'); const store = new RunStore(root);
  const client = fixture(); const original = client.request.bind(client);
  client.request = async <T>(method: string, path: string): Promise<T> => {
    const value = await original<T>(method, path);
    return path.includes('/dependencies/blocked_by') || path.includes('/issues?') ? (value as {number: number; state_reason: string}[]).map(x => x.number === 3 ? {...x, state_reason: 'completed'} : x) as T : value;
  };
  let launches = 0;
  const context = {client, repo: 'owner/repo', base: 'main', store, launch: async () => { launches++; await new Promise(r => setTimeout(r, 80)); }};
  try {
    assert.equal((await dispatchOnce({dryRun: true}, context)).find(x => x.number === 2)?.reason, 'missing or stale manifest');
    await assert.rejects(stat(root)); assert.equal(launches, 0);
    const data = await discoverTickets(client, 'owner/repo', 'main'); await store.saveManifest(2, data.fingerprints[2], ['src/one.ts']);
    await Promise.all([dispatchOnce({dryRun: false}, context), dispatchOnce({dryRun: false}, context)]);
    assert.equal(launches, 1);
    const reserved = await store.load(2); assert.equal(reserved?.stage, 'reserved');
    assert.equal(reserved?.baseSha, data.baseSha); assert.equal(reserved?.fingerprint, data.fingerprints[2]);
    assert.deepEqual(reserved?.predictedPaths, ['src/one.ts']); assert.equal(typeof reserved?.executionToken, 'string');
    await assert.rejects(store.save({...reserved!, executionToken: 'replacement'}), /immutable/);
    const html = await renderBoard(store, 'owner/repo'); assert.match(html, /owner\/repo\/issues\/2/); assert.match(html, /Recorded stage: reserved/); assert.match(html, /Ship.s Log/);
    const server = await serveBoard(store, 'owner/repo');
    try { const address = server.address(); assert.ok(address && typeof address !== 'string'); const response = await fetch(`http://127.0.0.1:${address.port}/`); assert.equal(response.status, 200); assert.match(await response.text(), /Recorded stage: reserved/); assert.equal((await fetch(`http://127.0.0.1:${address.port}/evidence/2/`)).status, 404); }
    finally { await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); }
  } finally { await rm(dir, {recursive: true, force: true}); }
});
