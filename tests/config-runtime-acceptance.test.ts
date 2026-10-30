import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lstat, writeFile } from 'node:fs/promises';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { MemoryStorage, type StorageWrite } from '@earendil-works/pi-durable';
import { loadConfig } from '../src/config.ts';
import { openRuntime } from '../src/runtime/pi-durable.ts';
import { spendingLedger } from '../src/inference/budget.ts';
import { fixture, until, child } from './support.ts';

test('strict configuration rejects unknown keys, unsafe paths, unbounded limits and unavailable model selection without starting a run', async t => {
  const f = await fixture();
  try {
    for (const mode of ['malformed', 'unknown', 'tool', 'model', 'relative', 'infinite', 'zero', 'queue', 'price', 'fault-injection'] as const) await t.test(mode, async () => {
      const config = structuredClone(f.config);
      let text: string;
      switch (mode) {
        case 'tool': config.tools = ['add_todo']; break;
        case 'relative': config.store = 'relative.sqlite'; break;
        case 'zero': config.limits.modelCalls = 0; break;
        case 'queue': config.limits.queued = 21; break;
        case 'price': config.inference.inputUsdPerMillion = -1; break;
      }
      text = JSON.stringify(config);
      if (mode === 'malformed') text = '{';
      if (mode === 'unknown') text = text.replace('"schemaVersion":1', '"schemaVersion":1,"arbitrary":true');
      if (mode === 'infinite') text = text.replace('"modelCalls":20', '"modelCalls":1e999');
      if (mode === 'model') text = text.replace('deepseek-ai/DeepSeek-V4-Flash-0731', 'substitute-model');
      if (mode === 'fault-injection') text = text.replace('"schemaVersion":1', '"schemaVersion":1,"testEndpoint":"http://127.0.0.1:1234"');
      await writeFile(f.file, text);
      await assert.rejects(loadConfig(f.file));
      await assert.rejects(lstat(f.config.store), { code: 'ENOENT' });
    });
    await writeFile(f.file, '{');
    const cli = await child('src/cli.ts', ['--config', f.file, '--json', 'config', 'validate']).exited;
    assert.equal(cli.code, 2);
  } finally { await f.cleanup(); }
});

test('atomic queue capacity preserves duplicate receipt before fullness and drains requests admitted around idle completion', { timeout: 15000 }, async () => {
  const f = await fixture();
  f.config.limits.queued = 0;
  const ledger = spendingLedger(f.config.ledger, f.config);
  // Enqueue admission checks during the first reservation, before dispatch can
  // finish. This occupies the single slot without a replacement executor.
  let runtime: Awaited<ReturnType<typeof openRuntime>>;
  let duplicate: Promise<unknown> | undefined;
  let overflow: Promise<unknown> | undefined;
  let first = true;
  const guarded = { ...ledger, reserve(id: string, amount: number) {
    if (first) {
      first = false;
      duplicate = runtime.submit({ schemaVersion: 1, requestId: 'first', conversationId: 'first', message: 'Add "first"' });
      overflow = runtime.submit({ schemaVersion: 1, requestId: 'overflow', conversationId: 'overflow', message: 'test' })
        .then(() => assert.fail('full queue accepted'), error => assert.equal(error.status, 429));
    }
    ledger.reserve(id, amount);
  } };
  runtime = await openRuntime(new MemoryStorage(), f.config, guarded);
  try {
    const firstReceipt = await runtime.submit({ schemaVersion: 1, requestId: 'first', conversationId: 'first', message: 'Add "first"' });
    await until(() => first === false);
    const repeated = await duplicate;
    assert.deepEqual(repeated, { ...firstReceipt, status: 200 });
    await overflow;
    await until(() => runtime.inspect('first', true), r => r.state === 'completed');
    for (let i = 0; i < 25; i++) {
      const id = `idle-${i}`;
      await runtime.submit({ schemaVersion: 1, requestId: id, conversationId: id, message: 'List todos' });
      const result = await until(() => runtime.inspect(id, true), r => r.state === 'completed' || r.state === 'failed');
      assert.equal(result.state, 'completed');
    }
  } finally { await runtime.close(); ledger.close(); await f.cleanup(); }
});

test('failed application storage rejects admission and lookup rather than returning acceptance or 404', async () => {
  const f = await fixture();
  class Unavailable extends MemoryStorage {
    failed = false;
    override commit(writes: readonly StorageWrite[], ctx: typeof context) {
      if (this.failed) return Promise.reject(new Error('Local fixture storage unavailable'));
      return super.commit(writes, ctx);
    }
  }
  const storage = new Unavailable();
  const ledger = spendingLedger(f.config.ledger, f.config);
  const runtime = await openRuntime(storage, f.config, ledger);
  try {
    // Let the initial empty drain finish, then reject the next durable admission.
    await runtime.inspect('absent', false).catch(error => assert.equal(error.status, 404));
    storage.failed = true;
    await assert.rejects(runtime.submit({ schemaVersion: 1, requestId: 'unavailable', conversationId: 'c', message: 'test' }));
    await assert.rejects(runtime.inspect('absent', false), error => !(error && typeof error === 'object' && 'status' in error && error.status === 404));
    await runtime.close();
    await assert.rejects(runtime.inspect('absent', false), error => !!error && typeof error === 'object' && 'status' in error && error.status === 503);
  } finally { await runtime.close(); ledger.close(); await f.cleanup(); }
});
