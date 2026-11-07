import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderBoard } from './board.ts';
import { RunStore } from './state.ts';

test('board maps all persisted lifecycle phases without inventing stopped runs or resetting timing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'board-phases-')), store = new RunStore(root);
  try {
    const phases = {queued: 'queued', reserved: 'setup', implementing: 'implementing', 'repair-pending': 'implementing', checking: 'verifying', verifying: 'verifying', publishing: 'pushing', 'waiting-ci': 'ci', merging: 'ci', merged: 'done', 'needs-human': 'stopped'};
    let issue = 0;
    for (const [stage, expected] of Object.entries(phases)) {
      await store.save({issue: ++issue, stage, repairsUsed: 0, reviews: [], ...(stage === 'merged' ? {mergeSha: 'a'.repeat(40)} : {})});
      const html = await renderBoard(store, 'owner/repo');
      const data = JSON.parse(html.match(/<script id="data" type="application\/json">(.*?)<\/script>/s)![1]);
      const run = data.runs.find((r: {iid: string}) => r.iid === String(issue));
      assert.equal(run.stage, expected, stage);
      const record = await store.load(issue);
      assert.equal(run.startedAt, record!.startedAt); assert.equal(run.stageSince, record!.stageSince);
    }
    const before = (await store.load(1))!;
    await new Promise(r => setTimeout(r, 5));
    await store.save({...before, error: 'metadata update'});
    const same = (await store.load(1))!;
    assert.equal(same.startedAt, before.startedAt); assert.equal(same.stageSince, before.stageSince);
    assert.notEqual(same.updatedAt, before.updatedAt);
    await store.save({...same, stage: 'implementing'});
    const changed = (await store.load(1))!;
    assert.equal(changed.startedAt, before.startedAt); assert.notEqual(changed.stageSince, before.stageSince);
  } finally { await rm(root, {recursive: true, force: true}); }
});
