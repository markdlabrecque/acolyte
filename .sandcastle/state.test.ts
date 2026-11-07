import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunStore } from './state.ts';

test('reads are non-mutating; writes private; live unknown paths claim entire tree', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'store-')); const root = join(dir, 'state'); const s = new RunStore(root);
  try {
    assert.equal(await s.load(1), undefined); assert.deepEqual(await s.live(), []); assert.equal(await s.manifest(1, 'x'), undefined);
    await assert.rejects(stat(root));
    await s.save({issue: 1, stage: 'needs-human', reviews: [], repairsUsed: 0, pr: 12});
    assert.equal((await stat(join(root, '1.json'))).mode & 0o777, 0o600);
    assert.deepEqual((await s.live())[0].actualPaths, ['']);
    await s.saveManifest(1, 'x', ['src/a']); assert.equal((await s.manifest(1, 'y'))?.current, false);
    await assert.rejects(s.load(-1));
  } finally { await rm(dir, {recursive: true, force: true}); }
});
test('waiting and caller-claimed terminal states remain occupied; corrupt state fails closed', async () => {
  const root = await mkdtemp(join(tmpdir(), 'store-')); const s = new RunStore(root);
  try {
    await s.save({issue: 1, stage: 'waiting', reviews: [], repairsUsed: 0});
    await s.save({issue: 2, stage: 'closed', closedConfirmed: true, reviews: [], repairsUsed: 0});
    assert.deepEqual((await s.live()).map(r => r.number), [1, 2]);
    await writeFile(join(root, '3.json'), '{');
    await assert.rejects(s.live());
  } finally { await rm(root, {recursive: true, force: true}); }
});
test('per issue lock excludes concurrent callers', async () => {
  const root = await mkdtemp(join(tmpdir(), 'issue-lock-')); const s = new RunStore(root); let count = 0;
  try {
    await Promise.all([1, 2].map(() => s.withIssueLock(1, async () => { const before = count; await new Promise(r => setTimeout(r, 30)); count = before + 1; })));
    assert.equal(count, 2);
  } finally { await rm(root, {recursive: true, force: true}); }
});
test('lock serializes and leaves no temporary files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'lock-')); const s = new RunStore(root); let count = 0;
  try {
    await Promise.all(Array.from({length: 5}, () => s.withLock(async () => { const old = count; await new Promise(r => setTimeout(r, 10)); count = old + 1; })));
    assert.equal(count, 5); assert.deepEqual(await readdir(root), []);
  } finally { await rm(root, {recursive: true, force: true}); }
});
