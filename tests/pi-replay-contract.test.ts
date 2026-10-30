import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { createModels, Type, fauxProvider, fauxAssistantMessage, fauxToolCall, fauxText } from '@earendil-works/pi-ai';
import { defineDoc, defineTool, defineExtension, createRegistry, Harness, AssistantEntry, type EntryId } from '@earendil-works/pi-durable';
import { SqliteStorage } from '@earendil-works/pi-durable/storage/sqlite';
import { openNodeSqliteDatabase } from '@earendil-works/pi-durable/storage/sqlite/node';

const Effects = defineDoc<{ items: string[]; results: Record<string, string> }>({
  kind: 'app.effects', version: 1, scope: 'session',
  initial: () => ({ items: [], results: {} }), checkpointWhen: () => true,
});

test('public safe replay retains the tool decision and atomic application result', { timeout: 5000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'td-002-replay-'));
  let harness: Awaited<ReturnType<typeof Harness.open>> | undefined;
  const committed = Promise.withResolvers<void>();
  const identities: string[] = [];
  const faux = fauxProvider();
  faux.setResponses([
    fauxAssistantMessage([fauxToolCall('add_todo', { title: 'fixture' }, { id: 'batch-call-1' })], { stopReason: 'toolUse' }),
    fauxAssistantMessage([fauxText('Stored fixture')]),
  ]);
  const models = createModels();
  models.setProvider(faux.provider);
  const tool = defineTool({
    name: 'add_todo', description: 'Contract fixture only',
    parameters: Type.Object({ title: Type.String({ minLength: 1 }) }), replay: 'safe',
    execute: async ({ title }, api, ctx) => {
      identities.push(`${api.taskId}/${api.callId}`);
      const replay = await api.commit(async tx => {
        const task = await tx.task(api.taskId);
        assert.ok(task);
        const input = task.input;
        assert.ok(input && typeof input === 'object' && !Array.isArray(input));
        assert.equal(input.kind, 'model');
        assert.equal(typeof input.assistant, 'number');
        assert.ok(typeof input.assistant === 'number' && Number.isSafeInteger(input.assistant));
        // Public task JSON stores branded IDs as numbers. Decode only after checking.
        const entry = await tx.entry(AssistantEntry, input.assistant as EntryId);
        const message = entry?.model?.[0];
        assert.equal(message?.role, 'assistant');
        assert.ok(message?.role === 'assistant');
        assert.equal(message.content[0]?.type, 'toolCall');
        const doc = await tx.doc(Effects);
        const key = String(api.taskId);
        if (doc.results[key] !== undefined) return true;
        doc.items.push(title);
        doc.results[key] = title;
        return false;
      }, ctx);
      if (!replay) {
        committed.resolve();
        await new Promise<void>(resolve => ctx.abortSignal!.addEventListener('abort', () => resolve(), { once: true }));
      }
      return { output: [{ type: 'text', text: title }] };
    },
  });
  const extension = defineExtension({ name: 'todos', tools: [tool] });
  const registry = createRegistry();
  registry.install(extension);
  try {
    const open = async () => {
      const db = await openNodeSqliteDatabase(join(directory, 'agent.sqlite'));
      await db.exec('PRAGMA synchronous = FULL');
      return Harness.open(await SqliteStorage.open(db), {
        models, registry, settings: { compaction: { enabled: false }, retry: { enabled: false }, stream: { maxRetries: 0 } },
      }, context);
    };
    harness = await open();
    const model = faux.getModel();
    const root = await harness.root(context, { agent: {
      model: { provider: model.provider, modelId: model.id }, extensions: [extension], tools: [tool],
    } });
    const submission = await root.submit({ type: 'input', content: 'Add fixture', requestId: 'fixture-1' }, context);
    await committed.promise;
    await harness.close(context);
    harness = await open();
    harness.resume();
    const settled = await (await harness.submission(submission.id, context))!.wait(context);
    assert.equal(settled.status, 'done');
    assert.deepEqual((await harness.snapshot(Effects, context))?.items, ['fixture']);
    assert.equal(identities.length, 2);
    assert.equal(identities[0], identities[1]);
    assert.equal(faux.state.callCount, 2, 'recovery did not regenerate the tool decision');
  } finally {
    await harness?.close(context);
    await rm(directory, { recursive: true, force: true });
  }
});
