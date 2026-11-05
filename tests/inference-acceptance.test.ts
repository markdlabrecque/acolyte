import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import { dirname, join } from 'node:path';
import { writeFile, chmod } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { Harness, MemoryStorage, LiveDoc, ROOT_CONVERSATION_ID, createRegistry, defineExtension, hook, GenerationTask, type TaskId } from '@earendil-works/pi-durable';
import { fauxAssistantMessage } from '@earendil-works/pi-ai';
import { inference } from '../src/inference/deepinfra.ts';
import { spendingLedger, type Reservations } from '../src/inference/budget.ts';
import { StateDoc } from '../src/runtime/documents.ts';
import { todoExtension } from '../src/tools/todos.ts';
import { fixture } from './support.ts';
import { loadConfig, type Config } from '../src/config.ts';
import { minimumListInputTokens, TODO_TITLE_LENGTH } from '../src/tools/todo-limits.ts';
import { randomUUID } from 'node:crypto';

async function wire(handler: (body: Record<string, unknown>, res: ServerResponse, req: IncomingMessage) => Promise<void> | void) {
  const failures: unknown[] = [];
  let calls = 0;
  const server = createServer((req, res) => {
    void (async () => {
      assert.equal(req.url, '/v1/openai/chat/completions');
      assert.equal(req.headers.authorization, 'Bearer synthetic-model-token');
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      calls++;
      await handler(JSON.parse(Buffer.concat(chunks).toString()), res, req);
    })().catch(error => { failures.push(error); res.destroy(); });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return { endpoint: `http://127.0.0.1:${address.port}/v1/openai`, calls: () => calls,
    async close() { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); assert.deepEqual(failures, []); } };
}
function answer(res: ServerResponse, content: string, usage: boolean | Record<string, unknown> = true) {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  const chunk = { id: 'local-1', object: 'chat.completion.chunk', created: 1, model: 'deepseek-ai/DeepSeek-V4-Flash-0731' };
  res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }] })}\n\n`);
  res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    ...(usage ? { usage: usage === true ? { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 } : usage } : {}) })}\n\n`);
  res.end('data: [DONE]\n\n');
}
async function adapter(config: Config, ledger: Reservations, endpoint: string, startedAt = Date.now(),
  beforeGeneration?: (harness: Harness, taskId: TaskId) => Promise<void>) {
  let harness: Harness;
  const provider = inference(config, ledger, () => harness, endpoint);
  const tools = todoExtension(config);
  const registry = createRegistry();
  const arrange = defineExtension({ name: 'test-arrange-attempt', hooks: beforeGeneration ? [hook(GenerationTask, {
    beforeRequest: async (_request, api) => { await beforeGeneration(harness, api.taskId); return undefined; },
  })] : [] });
  registry.install(provider.guard); registry.install(tools); registry.install(arrange);
  harness = await Harness.open(new MemoryStorage(), { models: provider.models, registry,
    settings: { extensions: [provider.guard, tools, arrange], toolExecution: 'sequential', retry: { enabled: false }, stream: { maxRetries: 0 }, compaction: { enabled: false } } }, context);
  await harness.commit(async tx => {
    const doc = await tx.doc(StateDoc);
    doc.active = 'request';
    doc.receipts.request = { requestId: 'request', receipt: 'receipt', conversationId: 'demo', message: 'test', digest: 'digest',
      order: 1, state: 'running', startedAt, modelCalls: 0, toolCalls: 0, config };
  }, context);
  const conversation = await harness.root(context, { agent: { model: { provider: config.inference.provider, modelId: config.inference.model },
    extensions: [provider.guard, tools, arrange], tools: tools.tools } });
  return { harness, async run() {
    const submission = await conversation.submit({ type: 'input', content: 'test', requestId: 'test' }, context);
    return submission.wait(context);
  }, state: () => harness.snapshot(StateDoc, context), close: () => harness.close(context) };
}

test('a full page of maximum-length escaped titles reaches the model and gets an answer', { timeout: 15000 }, async t => {
  for (const page of [1, 20, 100]) await t.test(`page size ${page}`, async () => {
    const f = await fixture();
    f.config.limits.listPage = page;
    f.config.limits.inputTokens = minimumListInputTokens(page, f.config.prompt);
    f.config.inference.mode = 'live';
    f.config.inference.credentialFile = f.config.authFile;
    await writeFile(f.config.authFile, 'synthetic-model-token');
    await writeFile(f.file, JSON.stringify(f.config));
    const config = await loadConfig(f.file);
    const ledger = spendingLedger(config.ledger, config);
    let app: Awaited<ReturnType<typeof adapter>> | undefined;
    let count = 0;
    // Include worst-case nested JSON escaping, multibyte text and surrogate pairs.
    const titles = ['\u0000'.repeat(TODO_TITLE_LENGTH), String.fromCharCode(0xd800).repeat(TODO_TITLE_LENGTH),
      '界'.repeat(TODO_TITLE_LENGTH), '😀'.repeat(TODO_TITLE_LENGTH / 2),
      String.fromCharCode(34).repeat(TODO_TITLE_LENGTH)];
    const todos = Array.from({ length: page + 1 }, (_, i) => ({ id: randomUUID(),
      title: titles[i % titles.length]!, state: 'open' as const, createdAt: Date.now() }));
    const local = await wire((body, res) => {
      if (++count === 1) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const chunk = { id: 'full-page', object: 'chat.completion.chunk', created: 1, model: config.inference.model };
        res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: { role: 'assistant',
          tool_calls: [{ index: 0, id: 'list-page', type: 'function', function: { name: 'list_todos', arguments: '{}' } }] }, finish_reason: null }] })}\n\n`);
        res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }],
          usage: { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 } })}\n\n`);
        res.end('data: [DONE]\n\n');
      } else {
        assert.equal(count, 2);
        const messages = body.messages as { role: string; content: string }[];
        const result = JSON.parse(messages.find(m => m.role === 'tool')!.content);
        assert.deepEqual(result, { items: todos.slice(0, page), next: page });
        answer(res, 'Here is your full page of todos.');
      }
    });
    try {
      app = await adapter(config, ledger, local.endpoint);
      await app.harness.commit(async tx => { (await tx.doc(StateDoc)).todos = todos; }, context);
      assert.equal((await app.run()).status, 'done');
      assert.equal(local.calls(), 2);
      const calls = Object.values((await app.state())!.calls);
      assert.equal(calls.length, 2);
      assert.ok(calls.every(call => call.state === 'answered'));
      assert.match(calls[1]!.response!, /Here is your full page/);
    } finally { await app?.close(); await local.close(); ledger.close(); await f.cleanup(); }
  });
});

test('ledger retries the intent/reservation gap idempotently, preserves conflicts and monthly cap', async () => {
  const f = await fixture();
  f.config.limits.monthlyUsd = 0.001;
  let ledger = spendingLedger(f.config.ledger, f.config);
  try {
    ledger.reserve('same', 800);
    ledger.close();
    ledger = spendingLedger(f.config.ledger, f.config);
    ledger.reserve('same', 800);
    assert.throws(() => ledger.reserve('same', 801), /conflict/);
    assert.throws(() => ledger.reserve('other', 201), /exhausted/);
    ledger.settle('same', 20); ledger.settle('same', 20);
    assert.throws(() => ledger.settle('same', 21), /conflict/);
    assert.throws(() => ledger.settle('unknown', 1), /conflict/);
    assert.throws(() => ledger.reserve('same', 800), /conflict/);
    ledger.reserve('other', 980);
    assert.throws(() => ledger.reserve('third', 1), /exhausted/);
  } finally { ledger.close(); await f.cleanup(); }
});

test('actual live adapter authenticates from dotenv, orders durable intent/reservation/dispatch before loopback wire, then stores response and settles usage', { timeout: 10000 }, async () => {
  const f = await fixture();
  f.config.inference.mode = 'live';
  // Isolated synthetic dotenv file, never the owner's worktree credentials.
  f.config.inference.credentialFile = join(dirname(f.config.authFile), '.env');
  await writeFile(f.config.inference.credentialFile, 'DEEPINFRA_API_KEY="synthetic-model-token"\n', { mode: 0o600 });
  const real = spendingLedger(f.config.ledger, f.config);
  let app: Awaited<ReturnType<typeof adapter>>;
  let atReserve: ReturnType<typeof app.state> | undefined;
  const ordered: string[] = [];
  const ledger: Reservations = { reserve(id, amount) { atReserve = app.state(); ordered.push('reserve'); real.reserve(id, amount); real.reserve(id, amount); },
    settle(id, amount) { ordered.push('settle'); real.settle(id, amount); }, close() {} };
  const local = await wire(async (body, res) => {
    const intent = await atReserve;
    assert.equal(Object.values(intent!.calls)[0]?.state, 'intent');
    assert.equal(Object.values((await app.state())!.calls)[0]?.state, 'dispatched');
    const db = new DatabaseSync(f.config.ledger);
    try { assert.equal(db.prepare('SELECT COUNT(*) AS n FROM reservations WHERE settled=0').get()?.n, 1); } finally { db.close(); }
    assert.equal(body.model, f.config.inference.model);
    assert.equal(body.max_tokens, f.config.limits.outputTokens);
    assert.equal(body.stream, true);
    assert.deepEqual((body.tools as { function: { name: string } }[]).map(t => t.function.name).sort(), ['add_todo', 'list_todos']);
    ordered.push('wire'); answer(res, 'Stored local answer');
  });
  try {
    app = await adapter(f.config, ledger, local.endpoint);
    const result = await app.run();
    assert.equal(result.status, 'done');
    assert.equal(local.calls(), 1);
    assert.deepEqual(ordered, ['reserve', 'wire', 'settle']);
    const state = (await app.state())!;
    const call = Object.values(state.calls)[0]!;
    assert.equal(call.state, 'answered');
    assert.match(call.response!, /Stored local answer/);
    const db = new DatabaseSync(f.config.ledger);
    try { assert.deepEqual({ ...db.prepare('SELECT micro_usd,settled FROM reservations').get() }, { micro_usd: 25, settled: 1 }); } finally { db.close(); }
  } finally { await app!?.close(); await local.close(); real.close(); await f.cleanup(); }
});

test('unknown usage and failed dispatch retain conservative charges without hidden wire retries', { timeout: 10000 }, async t => {
  for (const mode of ['missing-usage', 'http-error', 'truncated-stream', 'connect-timeout', 'progress-timeout', 'active-timeout'] as const) await t.test(mode, async () => {
    const f = await fixture();
    f.config.inference.mode = 'live'; f.config.inference.credentialFile = f.config.authFile;
    if (mode === 'connect-timeout') f.config.limits.connectMs = 30;
    if (mode === 'progress-timeout') f.config.limits.progressMs = 30;
    if (mode === 'active-timeout') f.config.limits.activeMs = 100;
    await writeFile(f.config.authFile, 'synthetic-model-token');
    const real = spendingLedger(f.config.ledger, f.config);
    const local = await wire((_body, res) => {
      if (mode === 'missing-usage') answer(res, 'No usage supplied', false);
      else if (mode === 'http-error') { res.writeHead(503); res.end('{"error":"local unavailable"}'); }
      else if (mode === 'truncated-stream') { res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end('data: {"choices":[]}\n\n'); }
      // Other modes deliberately never send headers. Abort must stop the request.
    });
    let app: Awaited<ReturnType<typeof adapter>> | undefined;
    try {
      app = await adapter(f.config, real, local.endpoint);
      const result = await app.run();
      assert.equal(result.status, mode === 'missing-usage' ? 'done' : 'unanswered');
      assert.equal(local.calls(), 1);
      const db = new DatabaseSync(f.config.ledger);
      try { assert.deepEqual({ ...db.prepare('SELECT micro_usd,settled FROM reservations').get() },
        { micro_usd: f.config.limits.inputTokens + f.config.limits.outputTokens, settled: 0 }); } finally { db.close(); }
    } finally { await app?.close(); await local.close(); real.close(); await f.cleanup(); }
  });
});

test('raw wire usage must be complete and consistent before normalized usage can settle', { timeout: 15000 }, async t => {
  const cases: [string, Record<string, unknown>, boolean][] = [
    ['missing prompt', { completion_tokens: 5, total_tokens: 25 }, false],
    ['missing completion', { prompt_tokens: 20, total_tokens: 25 }, false],
    ['missing total', { prompt_tokens: 20, completion_tokens: 5 }, false],
    ['inconsistent total', { prompt_tokens: 20, completion_tokens: 5, total_tokens: 2500 }, false],
    ['valid usage', { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 }, true],
    ['explicit zero completion', { prompt_tokens: 20, completion_tokens: 0, total_tokens: 20 }, true],
    ['explicit zero prompt', { prompt_tokens: 0, completion_tokens: 5, total_tokens: 5 }, true],
  ];
  for (const field of ['prompt_tokens', 'completion_tokens', 'total_tokens']) {
    for (const value of [-1, 0.5, '5']) {
      cases.push([`${field}=${value}`, { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25, [field]: value }, false]);
    }
  }
  for (const [name, usage, known] of cases) await t.test(name, async () => {
    const f = await fixture();
    f.config.inference.mode = 'live'; f.config.inference.credentialFile = f.config.authFile;
    await writeFile(f.config.authFile, 'synthetic-model-token');
    const ledger = spendingLedger(f.config.ledger, f.config);
    const local = await wire((_body, res) => answer(res, 'Raw usage answer', usage));
    let app: Awaited<ReturnType<typeof adapter>> | undefined;
    try {
      app = await adapter(f.config, ledger, local.endpoint);
      assert.equal((await app.run()).status, 'done');
      assert.equal(local.calls(), 1);
      assert.equal(Object.values((await app.state())!.calls)[0]!.state, 'answered');
      const reservation = f.config.limits.inputTokens + f.config.limits.outputTokens;
      const db = new DatabaseSync(f.config.ledger);
      try {
        assert.deepEqual({ ...db.prepare('SELECT micro_usd,reserved_micro_usd,settled FROM reservations').get() },
          { micro_usd: known ? Number(usage.total_tokens) : reservation, reserved_micro_usd: reservation, settled: known ? 1 : 0 });
      } finally { db.close(); }
    } finally { await app?.close(); await local.close(); ledger.close(); await f.cleanup(); }
  });
});

test('missing credentials, pricing, funds, model/time/context limits fail before any wire call', { timeout: 15000 }, async t => {
  for (const mode of ['credentials', 'missing-file', 'unsafe-file', 'malformed-raw', 'malformed-env', 'prices', 'funds', 'model-limit', 'time', 'context'] as const) await t.test(mode, async () => {
    const f = await fixture();
    f.config.inference.mode = 'live'; f.config.inference.credentialFile = f.config.authFile;
    await writeFile(f.config.authFile, 'synthetic-model-token');
    if (mode === 'credentials') f.config.inference.credentialFile = null;
    if (mode === 'missing-file') f.config.inference.credentialFile = f.config.authFile + '-absent';
    if (mode === 'unsafe-file') await chmod(f.config.authFile, 0o644);
    if (mode === 'malformed-raw') await writeFile(f.config.authFile, 'synthetic\nsecret');
    if (mode === 'malformed-env') {
      f.config.inference.credentialFile = join(dirname(f.config.authFile), '.env');
      await writeFile(f.config.inference.credentialFile, 'OTHER=synthetic-secret', { mode: 0o600 });
    }
    if (mode === 'prices') f.config.inference.outputUsdPerMillion = null;
    if (mode === 'funds') f.config.limits.monthlyUsd = 0;
    if (mode === 'context') f.config.limits.inputTokens = 1;
    const real = spendingLedger(f.config.ledger, f.config);
    const local = await wire((_body, res) => answer(res, 'Unexpected'));
    const app = await adapter(f.config, real, local.endpoint, mode === 'time' ? Date.now() - 300001 : Date.now());
    if (mode === 'model-limit') await app.harness.commit(async tx => { (await tx.doc(StateDoc)).receipts.request!.modelCalls = f.config.limits.modelCalls; }, context);
    try {
      assert.equal((await app.run()).status, 'unanswered');
      assert.equal(local.calls(), 0);
      assert.deepEqual((await app.state())!.todos, []);
      if (mode === 'malformed-raw' || mode === 'malformed-env') assert.deepEqual((await app.state())!.calls, {});
      const db = new DatabaseSync(f.config.ledger);
      try { assert.equal(db.prepare('SELECT COUNT(*) AS n FROM reservations').get()?.n, 0); } finally { db.close(); }
    } finally { await app.close(); await local.close(); real.close(); await f.cleanup(); }
  });
});

test('provider errors reflecting authorization are sanitized before persistence', async () => {
  const f = await fixture();
  f.config.inference.mode = 'live'; f.config.inference.credentialFile = f.config.authFile;
  await writeFile(f.config.authFile, 'synthetic-model-token');
  const ledger = spendingLedger(f.config.ledger, f.config);
  const local = await wire((_body, res) => {
    res.writeHead(401, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Rejected Bearer synthetic-model-token', type: 'invalid_api_key' } }));
  });
  const app = await adapter(f.config, ledger, local.endpoint);
  try {
    const result = await app.run();
    assert.equal(result.status, 'unanswered');
    assert.equal(local.calls(), 1);
    const state = (await app.state())!;
    const calls = Object.values(state.calls);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.state, 'answered');
    const response = JSON.parse(calls[0]!.response!);
    assert.equal(response.errorMessage, 'Inference provider failed');
    assert.deepEqual(response.content, []);
    assert.ok(!JSON.stringify([state, result]).includes('synthetic-model-token'));
  } finally { await app.close(); await local.close(); ledger.close(); await f.cleanup(); }
});

test('failed streams never publish partial secrets or retain provider metadata', { timeout: 15000 }, async () => {
  const f = await fixture();
  f.config.inference.mode = 'live'; f.config.inference.credentialFile = f.config.authFile;
  await writeFile(f.config.authFile, 'synthetic-model-token');
  const ledger = spendingLedger(f.config.ledger, f.config);
  const sent = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const local = await wire(async (_body, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    const chunk = { id: 'synthetic', object: 'chat.completion.chunk', created: 1, model: f.config.inference.model };
    res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: { role: 'assistant', content: 'Rejected Bearer synthetic-model-token' }, finish_reason: null }] })}\n\n`);
    sent.resolve();
    await release.promise;
    res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: {}, finish_reason: 'Rejected Bearer synthetic-model-token' }] })}\n\n`);
    res.end('data: [DONE]\n\n');
  });
  const app = await adapter(f.config, ledger, local.endpoint);
  try {
    const result = app.run();
    await sent.promise;
    // Allow the client to consume the chunk while the server withholds failure.
    await new Promise(resolve => setTimeout(resolve, 100));
    const live = await app.harness.snapshot(LiveDoc, ROOT_CONVERSATION_ID, context);
    assert.ok(live, 'generation has created its live document');
    assert.ok(!JSON.stringify(live).includes('synthetic-model-token'));
    release.resolve();
    assert.equal((await result).status, 'unanswered');
    const state = (await app.state())!;
    assert.ok(!JSON.stringify(state).includes('synthetic-model-token'));
    const response = JSON.parse(Object.values(state.calls)[0]!.response!);
    assert.equal(response.errorMessage, 'Inference provider failed');
    assert.equal(response.rawStopReason, undefined);
    assert.deepEqual(response.content, []);
  } finally { release.resolve(); await app.close(); await local.close(); ledger.close(); await f.cleanup(); }
});

test('persisted application attempt states reuse reservations/responses but never resend uncertain dispatch', async t => {
  for (const mode of ['intent-gap', 'answered', 'dispatched'] as const) await t.test(mode, async () => {
    const f = await fixture();
    f.config.inference.mode = 'live'; f.config.inference.credentialFile = f.config.authFile;
    await writeFile(f.config.authFile, 'synthetic-model-token');
    const ledger = spendingLedger(f.config.ledger, f.config);
    const local = await wire((_body, res) => answer(res, 'Wire answer'));
    const app = await adapter(f.config, ledger, local.endpoint, Date.now(), async (harness, taskId) => {
      const task = await harness.getTask(taskId, context);
      assert.ok(task && 'checkpoint' in task.state);
      const checkpoint = task.state.checkpoint;
      assert.ok(checkpoint && typeof checkpoint === 'object' && !Array.isArray(checkpoint) && typeof checkpoint.attempt === 'number');
      const id = `${f.config.agentId}:${taskId}:${checkpoint.attempt}`;
      const estimate = f.config.limits.inputTokens + f.config.limits.outputTokens;
      ledger.reserve(id, estimate);
      await harness.commit(async tx => {
        const state = await tx.doc(StateDoc);
        state.receipts.request!.modelCalls = 1;
        state.calls[id] = mode === 'answered' ? { state: 'answered', response: JSON.stringify(fauxAssistantMessage('Previously stored response')) }
          : { state: mode === 'intent-gap' ? 'intent' : 'dispatched' };
      }, context);
    });
    try {
      assert.equal((await app.run()).status, mode === 'dispatched' ? 'unanswered' : 'done');
      assert.equal(local.calls(), mode === 'intent-gap' ? 1 : 0);
      assert.equal((await app.state())!.receipts.request!.modelCalls, 1, 'reopening the same attempt does not create another call');
      const db = new DatabaseSync(f.config.ledger);
      try {
        assert.equal(db.prepare('SELECT COUNT(*) AS n FROM reservations').get()?.n, 1);
        assert.equal(db.prepare('SELECT settled FROM reservations').get()?.settled, mode === 'intent-gap' ? 1 : 0);
      } finally { db.close(); }
    } finally { await app.close(); await local.close(); ledger.close(); await f.cleanup(); }
  });
});

test('adapter refuses external test endpoints and unbound direct calls', async () => {
  const f = await fixture();
  const ledger: Reservations = { reserve() { assert.fail('unbound reservation'); }, settle() { assert.fail('unbound settlement'); }, close() {} };
  try {
    const noHarness = () => { throw new Error('Unbound harness'); };
    for (const endpoint of ['https://api.deepinfra.com/v1/openai', 'http://localhost:1234', 'http://127.0.0.1@evil.invalid']) {
      assert.throws(() => inference(f.config, ledger, noHarness, endpoint), /loopback/);
    }
    const provider = inference(f.config, ledger, noHarness);
    const model = provider.models.getModel(f.config.inference.provider, f.config.inference.model);
    assert.ok(model);
    const output = await provider.models.streamSimple(model, { messages: [] }).result();
    assert.equal(output.stopReason, 'error');
  } finally { await f.cleanup(); }
});
