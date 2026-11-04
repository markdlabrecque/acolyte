import assert from 'node:assert/strict';
import { test } from 'node:test';
import { basename, join } from 'node:path';
import { lstat, writeFile } from 'node:fs/promises';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import type { SqliteExecutor } from '@earendil-works/chord/sqlite';
import { SqliteStorage } from '@earendil-works/pi-durable/storage/sqlite';
import { ownStore } from '../src/host/store.ts';
import { spendingLedger } from '../src/inference/budget.ts';
import { openRuntime } from '../src/runtime/pi-durable.ts';
import { child, fixture, ready, stop, until } from './support.ts';

test('runtime commits use the FULL connection supplied to Pi storage, including after reopen', { timeout: 15000 }, async t => {
  const f = await fixture();
  f.config.agentId = basename(f.directory).toLowerCase();
  const open = SqliteStorage.open;
  const observed: number[] = [];
  t.mock.method(SqliteStorage, 'open', async (...args: Parameters<typeof open>) => {
    const storage = await open(...args);
    const database = args[0];
    const transaction = database.transaction.bind(database);
    // Observe Pi's real commit transaction handle, not another connection to the file.
    t.mock.method(database, 'transaction', function<T>(callback: (tx: SqliteExecutor) => Promise<T>) {
      return transaction(async tx => {
        const synchronous = (await tx.get<{ synchronous: number }>('PRAGMA synchronous'))?.synchronous;
        assert.equal(synchronous, 2);
        observed.push(synchronous);
        return callback(tx);
      });
    });
    return storage;
  });
  try {
    for (const reopen of [false, true]) {
      observed.length = 0;
      const store = await ownStore(f.config);
      const ledger = spendingLedger(store.ledger, f.config);
      let runtime: Awaited<ReturnType<typeof openRuntime>> | undefined;
      try {
        runtime = await openRuntime(store.storage, f.config, ledger);
        if (reopen) assert.equal((await runtime.inspect('full-mode', true)).state, 'completed');
        const requestId = reopen ? 'full-mode-reopened' : 'full-mode';
        const receipt = await runtime.submit({ schemaVersion: 1, requestId, conversationId: 'full-mode',
          message: reopen ? 'List todos' : 'Add "FULL connection"' });
        assert.equal(receipt.status, 202);
        const result = await until(() => runtime!.inspect(requestId, true), r => r.state === 'completed' || r.state === 'failed');
        assert.equal(result.state, 'completed');
        assert.ok(observed.length > 0, 'Pi runtime commits must cross the observed database');
        t.diagnostic(`${reopen ? 'reopened' : 'fresh'} runtime: PRAGMA synchronous=2 (FULL) inside ${observed.length} Pi storage transactions, including request commits`);
      } finally {
        try {
          if (runtime) await runtime.close();
          else await store.storage.close(context);
        } finally { ledger.close(); await store.unlock(); }
      }
    }
  } finally { await f.cleanup(); }
});

test('runner fails before readiness if storage initialization downgrades FULL', { timeout: 15000 }, async t => {
  for (const mode of ['OFF', 'NORMAL'] as const) await t.test(mode, async t => {
    const f = await fixture();
    f.config.agentId = basename(f.directory).toLowerCase();
    await f.save();
    const preload = join(f.directory, 'downgrade.mjs');
    // Test-process injection only. Production configuration has no fault-injection option.
    await writeFile(preload, `
      import { SqliteStorage } from ${JSON.stringify(import.meta.resolve('@earendil-works/pi-durable/storage/sqlite'))};
      const open = SqliteStorage.open;
      SqliteStorage.open = async (database, options) => {
        const storage = await open(database, options);
        await database.exec('PRAGMA synchronous = ${mode}');
        console.log('injected storage synchronous=' + (await database.get('PRAGMA synchronous')).synchronous);
        return storage;
      };
    `);
    const failed = child('--import', [preload, 'src/runner.ts', f.file]);
    let corrected: ReturnType<typeof child> | undefined;
    try {
      await until(() => failed.process.exitCode !== null || failed.output().includes('runner ready'));
      assert.equal(failed.process.exitCode, 2, failed.output());
      assert.match(failed.output(), /runner startup failed/);
      assert.doesNotMatch(failed.output(), /runner ready/);
      await assert.rejects(lstat(f.config.socket), { code: 'ENOENT' });
      corrected = child('src/runner.ts', [f.file]);
      await ready(corrected);
      t.diagnostic(`${mode}: startup exited 2 without readiness/socket; clean restart acquired the same store and agent locks`);
    } finally { await stop(failed); await stop(corrected); await f.cleanup(); }
  });
});
