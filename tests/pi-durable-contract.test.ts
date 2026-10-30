import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { createModels } from '@earendil-works/pi-ai/models';
import { defineDoc, defineTool, defineExtension, createRegistry, Harness, AssistantEntry } from '@earendil-works/pi-durable';
import { Type, fauxProvider, fauxAssistantMessage, fauxToolCall, fauxText } from '@earendil-works/pi-ai';
import { SqliteStorage } from '@earendil-works/pi-durable/storage/sqlite';
import { openNodeSqliteDatabase } from '@earendil-works/pi-durable/storage/sqlite/node';

const Todos = defineDoc<{ items: string[] }>({
  kind: 'app.todos', version: 1, scope: 'session',
  initial: () => ({ items: [] }), checkpointWhen: () => true,
});

test('public application document commit survives SQLite reopen in FULL mode', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'td-002-contract-'));
  let harness: Awaited<ReturnType<typeof Harness.open>> | undefined;
  try {
    for (const reopen of [false, true]) {
      const database = await openNodeSqliteDatabase(join(directory, 'agent.sqlite'));
      await database.exec('PRAGMA synchronous = FULL');
      assert.equal((await database.get<{ synchronous: number }>('PRAGMA synchronous'))?.synchronous, 2);
      harness = await Harness.open(await SqliteStorage.open(database), {
        models: createModels(), registry: createRegistry(),
      }, context);
      if (!reopen) {
        await harness.commit(async tx => {
          (await tx.doc(Todos)).items.push('retained fixture');
        }, context);
      }
      assert.deepEqual(await harness.snapshot(Todos, context), { items: ['retained fixture'] });
      await harness.close(context);
      harness = undefined;
    }
  } finally {
    await harness?.close(context);
    await rm(directory, { recursive: true, force: true });
  }
});
