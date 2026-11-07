import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { runTicket, type RunPorts, type RunRecord, type Review, type WorkItem } from './controller.ts';

const ticket: WorkItem = { number: 37, title: 'fixture', body: '**Model:** Terra-6.1' };
function fixture(initial?: RunRecord) {
  let stored = initial && structuredClone(initial), sha = 'a', clean = true;
  const events: string[] = [];
  const ports: RunPorts = {
    async load() { return stored && structuredClone(stored); },
    async save(r) { stored = structuredClone(r); events.push(`save:${r.stage}:${r.repairsUsed}`); },
    async implement({ repair, model }) { events.push(`implement:${repair}:${model}`); },
    async checks() { events.push('checks'); return { passed: true, details: 'ok' }; },
    async head() { return sha; }, async clean() { return clean; },
    async verify({ headSha, model }) { events.push(`verify:${model}`); return { verdict: 'APPROVE', headSha, findings: [] }; },
    async publish({ headSha }) { events.push(`publish:${headSha}`); return { number: 7 }; },
    async merge({ headSha }) { events.push(`merge:${headSha}`); return { merged: true, sha: 'merge-sha' }; },
  };
  return { ports, events, setHead: (s: string) => { sha = s; }, setClean: (s: boolean) => { clean = s; }, stored: () => stored };
}

test('complete lifecycle persists effect markers and exact approval', async () => {
  const f = fixture(); const r = await runTicket(ticket, f.ports);
  assert.equal(r.stage, 'merged'); assert.equal(r.mergeSha, 'merge-sha'); assert.equal(r.pr, 7);
  assert.deepEqual(r.reviews, [{ verdict: 'APPROVE', headSha: 'a', findings: [] }]);
  assert.deepEqual(f.events, ['save:implementing:0', 'implement:0:openai/gpt-6.1-terra', 'save:checking:0', 'checks', 'save:verifying:0', 'verify:openai/gpt-6.1-sol', 'save:verifying:0', 'save:publishing:0', 'publish:a', 'save:waiting-ci:0', 'save:merging:0', 'merge:a', 'save:merged:0']);
});

test('two repairs preserve rejection history and pass findings to next attempt', async () => {
  const f = fixture(); const supplied: string[][] = []; let n = 0;
  f.ports.implement = async ({ findings }) => { supplied.push(findings); };
  f.ports.verify = async ({ headSha }) => ++n < 3 ? { verdict: 'REJECT', headSha, findings: [`finding ${n}`] } : { verdict: 'APPROVE', headSha, findings: [] };
  const r = await runTicket(ticket, f.ports);
  assert.equal(r.stage, 'merged'); assert.equal(r.repairsUsed, 2); assert.equal(r.reviews.length, 3);
  assert.deepEqual(supplied, [[], ['finding 1'], ['finding 2']]);
  assert.ok(f.events.includes('save:repair-pending:2'));
});

test('failed checks consume repairs and stop after three attempts', async () => {
  const f = fixture(); let count = 0, verify = 0;
  f.ports.checks = async () => ({ passed: false, details: `failure ${++count}` });
  f.ports.verify = async () => { verify++; throw Error('unexpected'); };
  const r = await runTicket(ticket, f.ports);
  assert.equal(r.stage, 'needs-human'); assert.equal(r.repairsUsed, 2); assert.equal(count, 3); assert.equal(verify, 0);
  assert.deepEqual(r.checkFailures, ['failure 1', 'failure 2', 'failure 3']);
  assert.ok(!f.events.some(e => e.startsWith('publish')));
});

test('rejections stop after two repairs with all findings retained', async () => {
  const f = fixture(); let n = 0;
  f.ports.verify = async ({ headSha }) => ({ verdict: 'REJECT', headSha, findings: [`reject ${++n}`] });
  const r = await runTicket(ticket, f.ports);
  assert.equal(r.stage, 'needs-human'); assert.equal(r.repairsUsed, 2); assert.equal(r.reviews.length, 3);
});

test('stale review, moving HEAD, and dirty worktree never publish', async () => {
  for (const mode of ['stale', 'move', 'dirty']) {
    const f = fixture();
    f.ports.verify = async ({ headSha }): Promise<Review> => {
      if (mode === 'move') f.setHead('b');
      if (mode === 'dirty') f.setClean(false);
      return { verdict: 'APPROVE', headSha: mode === 'stale' ? 'old' : headSha, findings: [] };
    };
    const r = await runTicket(ticket, f.ports);
    assert.equal(r.stage, 'needs-human', mode); assert.equal(r.reviews.length, 1);
    assert.ok(!f.events.some(e => e.startsWith('publish')), mode);
  }
});

test('head movement after publish blocks merge', async () => {
  const f = fixture(); f.ports.publish = async () => { f.setHead('b'); return { number: 7 }; };
  const r = await runTicket(ticket, f.ports);
  assert.equal(r.stage, 'needs-human'); assert.equal(r.pr, 7); assert.ok(!f.events.some(e => e.startsWith('merge:')));
});

test('uncertain effects are not replayed on restart', async () => {
  for (const stage of ['implementing', 'checking', 'verifying', 'repair-pending', 'publishing', 'merging']) {
    const f = fixture({ issue: 37, stage, repairsUsed: 1, reviews: [] });
    assert.equal((await runTicket(ticket, f.ports)).stage, 'needs-human');
    assert.ok(!f.events.some(e => /^(implement|publish|merge):/.test(e)));
  }
  const f = fixture(); f.ports.publish = async () => { throw Error('timeout after possible PR'); };
  assert.equal((await runTicket(ticket, f.ports)).stage, 'needs-human');
  assert.equal((await runTicket(ticket, f.ports)).stage, 'needs-human');
});

test('waiting CI resumes only with exact recorded approval and clean HEAD', async () => {
  const initial: RunRecord = { issue: 37, stage: 'waiting-ci', repairsUsed: 1, reviews: [{ verdict: 'APPROVE', headSha: 'a', findings: [] }], headSha: 'a', pr: 7 };
  const f = fixture(initial); assert.equal((await runTicket(ticket, f.ports)).stage, 'merged');
  assert.ok(!f.events.some(e => /^(implement|publish):/.test(e)));
  const stale = fixture(initial); stale.setHead('b'); assert.equal((await runTicket(ticket, stale.ports)).stage, 'needs-human');
  const noReview = fixture({ ...initial, reviews: [] }); assert.equal((await runTicket(ticket, noReview.ports)).stage, 'needs-human');
});

test('exceptions preserve metadata and do not claim merge', async () => {
  const f = fixture();
  f.ports.implement = async () => { const r = (await f.ports.load())!; await f.ports.save({ ...r, branch: 'fixture' }); throw Error('uncertain'); };
  const r = await runTicket(ticket, f.ports); assert.equal(r.stage, 'needs-human'); assert.equal(r.branch, 'fixture'); assert.equal(r.error, 'uncertain');
  const g = fixture(); g.ports.merge = async () => { throw Error('uncertain merge'); };
  const x = await runTicket(ticket, g.ports); assert.equal(x.stage, 'needs-human'); assert.equal(x.mergeSha, undefined); assert.equal(x.pr, 7);
});

test('repairs refresh changed path metadata without resetting lifecycle evidence', async () => {
  const f = fixture(); let reviews = 0;
  f.ports.implement = async ({ repair }) => {
    await f.ports.save({ ...(await f.ports.load())!, actualPaths: [`revision-${repair}.ts`],
      branch: `branch-${repair}`, repairsUsed: 0, stage: 'merged', reviews: [] });
  };
  f.ports.verify = async ({ headSha }) => ({ verdict: ++reviews === 1 ? 'REJECT' : 'APPROVE', headSha, findings: [] });
  const result = await runTicket(ticket, f.ports);
  assert.equal(result.stage, 'merged');
  assert.equal(result.repairsUsed, 1);
  assert.equal(result.reviews.length, 2);
  assert.equal(result.branch, 'branch-1');
  assert.deepEqual(result.actualPaths, ['revision-1.ts']);
});

test('delivery lock starts after implementation, spans review/publication/merge and releases between repairs', async () => {
  const f = fixture(); let held = false, acquired = 0, released = 0, reviews = 0;
  f.ports.acquireDelivery = async () => { assert.equal(held, false); held = true; acquired++; return async () => { assert.equal(held, true); held = false; released++; }; };
  f.ports.implement = async () => { assert.equal(held, false); };
  f.ports.checks = async () => { assert.equal(held, true); return {passed: true, details: 'synthetic'}; };
  f.ports.verify = async ({headSha}) => { assert.equal(held, true); return {verdict: ++reviews === 1 ? 'REJECT' : 'APPROVE', headSha, findings: reviews === 1 ? ['repair'] : []}; };
  f.ports.publish = async () => { assert.equal(held, true); return {number: 7}; };
  f.ports.merge = async () => { assert.equal(held, true); return {merged: true, sha: 'merge'}; };
  assert.equal((await runTicket(ticket, f.ports)).stage, 'merged');
  assert.equal(held, false); assert.equal(acquired, 2); assert.equal(released, 2);
});

test('delivery lock releases when checks or merge throw', async () => {
  for (const effect of ['checks', 'merge'] as const) {
    const f = fixture(); let released = 0;
    f.ports.acquireDelivery = async () => async () => { released++; };
    f.ports[effect] = async () => { throw new Error('synthetic failure'); };
    assert.equal((await runTicket(ticket, f.ports)).stage, 'needs-human'); assert.equal(released, 1);
  }
});

test('missing or ambiguous model prevents implementation', async () => {
  for (const body of ['', '**Model:** Luna-6\n**Model:** Sol-6.1', '**Model:** unknown']) {
    const f = fixture(); assert.equal((await runTicket({ ...ticket, body }, f.ports)).stage, 'needs-human');
    assert.ok(!f.events.some(e => e.startsWith('implement:')));
  }
});
