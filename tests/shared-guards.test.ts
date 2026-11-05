import assert from 'node:assert/strict';
import test from 'node:test';
import { requestRoute } from '../src/http.ts';
import { Rejection } from '../src/runtime/pi-durable.ts';
import { remainingActiveMs, countCall } from '../src/runtime/limits.ts';
import type { Receipt } from '../src/runtime/documents.ts';
import { fixture } from './support.ts';

test('shared route parser preserves submit, status, result and rejection boundaries', () => {
  const root = '/v1/agents/acceptance/requests';
  assert.deepEqual(requestRoute({ method: 'POST', url: root }, 'acceptance'), { receipt: undefined, result: false });
  assert.deepEqual(requestRoute({ method: 'GET', url: `${root}/r1` }, 'acceptance'), { receipt: 'r1', result: false });
  assert.deepEqual(requestRoute({ method: 'GET', url: `${root}/r1/result` }, 'acceptance'), { receipt: 'r1', result: true });
  for (const [method, url, status] of [
    ['GET', root, 400], ['POST', `${root}/r1`, 400], ['POST', `${root}/r1/result`, 400],
    ['DELETE', `${root}/r1`, 400], ['GET', `${root}/`, 403], ['GET', `${root}/r1/result/`, 403],
    ['GET', `${root}/r1?x=1/result/extra`, 403], ['POST', '/v1/agents/other/requests', 403],
  ] as const) {
    assert.throws(() => requestRoute({ method, url }, 'acceptance'),
      (error: unknown) => error instanceof Rejection && error.status === status);
  }
});

test('shared limits retain the stricter snapshot/current bound and do not count rejected calls', async t => {
  const f = await fixture();
  t.after(f.cleanup);
  const snapshot = structuredClone(f.config);
  const request: Receipt = { receipt: 'r', requestId: 'r', conversationId: 'c', message: '', digest: '',
    order: 1, state: 'running', config: snapshot, startedAt: 1000, modelCalls: 0, toolCalls: 0 };
  t.mock.method(Date, 'now', () => 1500);
  snapshot.limits.activeMs = 1000;
  f.config.limits.activeMs = 2000;
  assert.equal(remainingActiveMs(request, f.config), 500);
  f.config.limits.activeMs = 750;
  assert.equal(remainingActiveMs(request, f.config), 250);
  f.config.limits.activeMs = 500;
  assert.throws(() => remainingActiveMs(request, f.config), /Active work limit exhausted/);
  f.config.limits.activeMs = 2000;
  snapshot.limits.activeMs = 500;
  assert.throws(() => remainingActiveMs(request, f.config), /Active work limit exhausted/);
  for (const kind of ['modelCalls', 'toolCalls'] as const) {
    for (const [accepted, current] of [[1, 2], [2, 1]]) {
      request[kind] = 0;
      snapshot.limits[kind] = accepted!;
      f.config.limits[kind] = current!;
      countCall(request, f.config, kind);
      assert.equal(request[kind], 1);
      assert.throws(() => countCall(request, f.config, kind), /call limit exhausted/);
      assert.equal(request[kind], 1);
    }
  }
});
