import assert from 'node:assert/strict';
import { test } from 'node:test';
import { basename } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { request } from 'node:http';
import { child, ready, stop, fixture, freePort, until } from './support.ts';
import { forward } from '../src/http.ts';

test('distinct same-title receipts, CLI disconnect, queue admission/completion, denied routes and stored retrieval across real processes', { timeout: 30000 }, async () => {
  const f = await fixture();
  f.config.agentId = basename(f.directory).toLowerCase(); f.config.port = await freePort();
  await f.save();
  const runner = child('src/runner.ts', [f.file]);
  let gateway: ReturnType<typeof child> | undefined;
  const root = `/v1/agents/${f.config.agentId}/requests`;
  const headers = { authorization: 'Bearer synthetic-local-auth-only', 'content-type': 'application/json' };
  const get = async (id: string) => {
    const response = await fetch(`http://127.0.0.1:${f.config.port}${root}/${id}/result`, { headers });
    assert.equal(response.status < 300, true);
    return response.json() as Promise<{ state: string; answer: string; receipt: string }>;
  };
  const result = (id: string) => until(() => get(id), value => value.state === 'completed' || value.state === 'failed');
  const submit = async (id: string, message = 'Add "same-title"') => {
    const response = await fetch(`http://127.0.0.1:${f.config.port}${root}`, { method: 'POST', headers,
      body: JSON.stringify({ schemaVersion: 1, requestId: id, conversationId: id, message }) });
    assert.equal(response.status, 202);
    return response.json() as Promise<{ receipt: string }>;
  };
  try {
    await ready(runner); gateway = child('src/gateway.ts', [f.file]); await ready(gateway);
    const cli = child('src/cli.ts', ['--config', f.file, '--json', 'submit', '--agent', f.config.agentId, '--conversation', 'first', '--request-id', 'first', 'Add "same-title"']);
    await until(() => cli.output().includes('"receipt"'));
    cli.process.kill('SIGTERM');
    await cli.exited;
    const first = await result('first');
    assert.equal(first.state, 'completed');
    const secondReceipt = await submit('second');
    const second = await result('second');
    assert.notEqual(first.receipt, secondReceipt.receipt);
    const todo = (answer: string) => JSON.parse(JSON.parse(answer)[0].text) as { id: string; title: string };
    assert.equal(todo(first.answer).title, 'same-title'); assert.equal(todo(second.answer).title, 'same-title');
    assert.notEqual(todo(first.answer).id, todo(second.answer).id);

    // Admit a burst while prior work completes, then repeatedly admit at idle.
    // This is focused drain/admission coverage, not TD-004's persisted race suite.
    await Promise.all(Array.from({ length: 10 }, (_, i) => submit(`burst-${i}`, 'List todos')));
    const burst = await Promise.all(Array.from({ length: 10 }, (_, i) => result(`burst-${i}`)));
    assert.ok(burst.every(r => r.state === 'completed'));
    for (let i = 0; i < 10; i++) { await submit(`idle-${i}`, 'List todos'); assert.equal((await result(`idle-${i}`)).state, 'completed'); }

    await submit('toString', 'List todos');
    assert.equal((await result('toString')).state, 'completed');
    const prototypeLookup = await fetch(`http://127.0.0.1:${f.config.port}${root}/constructor`, { headers });
    assert.equal(prototypeLookup.status, 404);

    const readLedger = () => {
      const db = new DatabaseSync(f.config.ledger, { readOnly: true });
      try { return db.prepare('SELECT id,micro_usd,settled FROM reservations ORDER BY id').all(); } finally { db.close(); }
    };
    const before = readLedger();
    for (let i = 0; i < 5; i++) assert.deepEqual(await get('first'), first);
    const duplicate = await fetch(`http://127.0.0.1:${f.config.port}${root}`, { method: 'POST', headers,
      body: JSON.stringify({ schemaVersion: 1, requestId: 'first', conversationId: 'first', message: 'Add "same-title"' }) });
    assert.equal(duplicate.status, 200); assert.equal((await duplicate.json()).receipt, first.receipt);
    assert.deepEqual(readLedger(), before, 'reads and idempotent resubmission cannot invoke inference');

    for (const path of ['/v1/agents/other/requests', '/shell', root + '/first/result/extra']) {
      assert.equal((await fetch(`http://127.0.0.1:${f.config.port}${path}`, { headers })).status, 403);
    }
    const direct = await forward({ socketPath: f.config.socket, path: root, method: 'POST', token: 'synthetic-local-auth-only', owner: 'intruder' },
      { schemaVersion: 1, requestId: 'denied', conversationId: 'denied', message: 'Add "not authorized"' });
    assert.equal(direct.status, 403);
    const invalid = await fetch(`http://127.0.0.1:${f.config.port}${root}`, { method: 'POST', headers, body: '{bad' });
    assert.equal(invalid.status, 400);
    const oversized = await fetch(`http://127.0.0.1:${f.config.port}${root}`, { method: 'POST', headers, body: 'x'.repeat(20000) });
    assert.equal(oversized.status, 413);
    const impersonate = await fetch(`http://127.0.0.1:${f.config.port}${root}`, { method: 'POST', headers,
      body: JSON.stringify({ schemaVersion: 1, requestId: 'denied', conversationId: 'denied', message: 'test', owner: 'owner' }) });
    assert.equal(impersonate.status, 400);
    const missing = await fetch(`http://127.0.0.1:${f.config.port}${root}/denied`, { headers });
    assert.equal(missing.status, 404);
    assert.deepEqual(readLedger(), before);
    assert.doesNotMatch(runner.output() + gateway.output(), /same-title|synthetic-local-auth-only/);
    await stop(runner);
    const unavailable = await fetch(`http://127.0.0.1:${f.config.port}${root}/first/result`, { headers });
    assert.equal(unavailable.status, 503, 'unavailable storage is never an empty 404');
    const submitUnavailable = await child('src/cli.ts', ['--config', f.file, '--json', 'submit', '--agent', f.config.agentId,
      '--conversation', 'uncertain', '--request-id', 'uncertain', 'test']).exited;
    assert.equal(submitUnavailable.code, 2); assert.match(submitUnavailable.output, /Acceptance unconfirmed.*same request ID/);
  } finally { await stop(gateway); await stop(runner); await f.cleanup(); }
});

test('terminal guard failure is persisted and CLI result exits 1 without a false answer', { timeout: 15000 }, async () => {
  const f = await fixture();
  f.config.agentId = basename(f.directory).toLowerCase(); f.config.port = await freePort();
  f.config.limits.monthlyUsd = 0; f.config.limits.warningUsd = 0; await f.save();
  const runner = child('src/runner.ts', [f.file]);
  let gateway: ReturnType<typeof child> | undefined;
  try {
    await ready(runner); gateway = child('src/gateway.ts', [f.file]); await ready(gateway);
    const invoke = (...args: string[]) => child('src/cli.ts', ['--config', f.file, '--json', ...args]).exited;
    assert.equal((await invoke('submit', '--agent', f.config.agentId, '--conversation', 'failed', '--request-id', 'failed', 'Add "blocked"')).code, 0);
    const result = await until(() => invoke('result', '--agent', f.config.agentId, 'failed'), r => r.code === 1);
    const outcome = JSON.parse(result.output);
    assert.equal(outcome.state, 'failed');
    assert.equal(typeof outcome.failure, 'string');
    assert.equal(outcome.answer, undefined);
    const again = await invoke('result', '--agent', f.config.agentId, 'failed');
    assert.equal(again.code, 1); assert.deepEqual(JSON.parse(again.output), outcome);
    const db = new DatabaseSync(f.config.ledger, { readOnly: true });
    try { assert.equal(db.prepare('SELECT COUNT(*) AS n FROM reservations').get()?.n, 0); } finally { db.close(); }
  } finally { await stop(gateway); await stop(runner); await f.cleanup(); }
});

test('gateway forwards durable admission even when the submitting HTTP client disconnects', { timeout: 15000 }, async () => {
  const f = await fixture();
  f.config.agentId = basename(f.directory).toLowerCase(); f.config.port = await freePort(); await f.save();
  const runner = child('src/runner.ts', [f.file]);
  let gateway: ReturnType<typeof child> | undefined;
  try {
    await ready(runner); gateway = child('src/gateway.ts', [f.file]); await ready(gateway);
    const path = `/v1/agents/${f.config.agentId}/requests`;
    const req = request({ host: '127.0.0.1', port: f.config.port, path, method: 'POST', headers: {
      authorization: 'Bearer synthetic-local-auth-only', 'content-type': 'application/json' } });
    req.on('error', () => {});
    // The accepted receipt proves commit; drop the transport before consuming its body.
    await new Promise<void>(resolve => {
      req.on('response', response => { assert.equal(response.statusCode, 202); req.destroy(); resolve(); });
      req.end(JSON.stringify({ schemaVersion: 1, conversationId: 'disconnected', requestId: 'disconnected', message: 'Add "survives disconnect"' }));
    });
    const value = await until(async () => {
      const res = await fetch(`http://127.0.0.1:${f.config.port}${path}/disconnected/result`, { headers: { authorization: 'Bearer synthetic-local-auth-only' } });
      return res.json() as Promise<{ state: string; answer: string }>;
    }, value => value.state === 'completed');
    assert.match(value.answer, /survives disconnect/);
  } finally { await stop(gateway); await stop(runner); await f.cleanup(); }
});
