import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { Harness, MemoryStorage, createRegistry, type JsonObject } from '@earendil-works/pi-durable';
import { createModels, fauxProvider, fauxAssistantMessage, fauxText, fauxToolCall } from '@earendil-works/pi-ai';
import { todoExtension } from '../src/tools/todos.ts';
import { StateDoc } from '../src/runtime/documents.ts';
import { fixture } from './support.ts';
import type { Config } from '../src/config.ts';

async function toolRun(config: Config, calls: { name: string; args: JsonObject }[], setup?: (harness: Harness) => Promise<void>) {
  const faux = fauxProvider();
  faux.setResponses([fauxAssistantMessage(calls.map((call, i) => fauxToolCall(call.name, call.args, { id: `batch-${i}` })), { stopReason: 'toolUse' }),
    fauxAssistantMessage([fauxText('finished')])]);
  const models = createModels(); models.setProvider(faux.provider);
  const tools = todoExtension(config);
  const registry = createRegistry(); registry.install(tools);
  const harness = await Harness.open(new MemoryStorage(), { models, registry,
    settings: { extensions: [tools], toolExecution: 'sequential', retry: { enabled: false }, compaction: { enabled: false } } }, context);
  try {
    await harness.commit(async tx => {
      const state = await tx.doc(StateDoc);
      state.active = 'request';
      state.receipts.request = { receipt: 'r', requestId: 'request', conversationId: 'c', message: 'test', digest: 'test', order: 1,
        state: 'running', startedAt: Date.now(), modelCalls: 0, toolCalls: 0, config: structuredClone(config) };
    }, context);
    await setup?.(harness);
    const model = faux.getModel();
    const conversation = await harness.root(context, { agent: { model: { provider: model.provider, modelId: model.id }, extensions: [tools], tools: tools.tools } });
    const submitted = await conversation.submit({ type: 'input', content: 'test' }, context);
    await submitted.wait(context);
    return (await harness.snapshot(StateDoc, context))!;
  } finally { await harness.close(context); }
}

test('tool batch records distinct action identities, identical titles, and bounded list cursor pages', async () => {
  const f = await fixture();
  try {
    const state = await toolRun(f.config, [{ name: 'add_todo', args: { title: 'same' } }, { name: 'add_todo', args: { title: 'same' } },
      { name: 'list_todos', args: {} }, { name: 'list_todos', args: { cursor: 1 } }, { name: 'list_todos', args: { cursor: 1000000 } }]);
    assert.deepEqual(state.todos.map(t => t.title), ['same', 'same']);
    assert.equal(new Set(state.todos.map(t => t.id)).size, 2);
    const actions = Object.values(state.actions);
    assert.equal(actions.length, 5);
    assert.equal(new Set(actions.map(a => a.taskId)).size, 5);
    assert.deepEqual(actions.map(a => a.callId), ['batch-0', 'batch-1', 'batch-2', 'batch-3', 'batch-4']);
    assert.ok(actions.every(a => a.toolVersion === 1));
    const pages = actions.filter(a => a.name === 'list_todos').map(a => JSON.parse(a.result!));
    assert.deepEqual(pages.map(p => p.items.map((t: { id: string }) => t.id)), [[state.todos[0]!.id], [state.todos[1]!.id], []]);
    assert.deepEqual(pages.map(p => p.next), [1, null, null]);
  } finally { await f.cleanup(); }
});

test('finite tool limit stops a returned batch after the allowed effect', async () => {
  const f = await fixture();
  f.config.limits.toolCalls = 1;
  try {
    const state = await toolRun(f.config, [{ name: 'add_todo', args: { title: 'allowed' } }, { name: 'add_todo', args: { title: 'over limit' } }]);
    assert.deepEqual(state.todos.map(t => t.title), ['allowed']);
    assert.equal(Object.keys(state.actions).length, 1);
    assert.equal(state.receipts.request!.toolCalls, 1);
  } finally { await f.cleanup(); }
});

test('denied/unregistered tools, invalid arguments, accepted/current permissions and finite limits create no unauthorized effect', async t => {
  for (const mode of ['shell', 'empty-title', 'extra-argument', 'negative-cursor', 'large-cursor', 'accepted-denial', 'current-denial', 'tool-limit', 'expired', 'current-time'] as const) await t.test(mode, async () => {
    const f = await fixture();
    try {
      const name = mode === 'shell' ? 'bash' : mode.includes('cursor') ? 'list_todos' : 'add_todo';
      const args: JsonObject = mode === 'shell' ? { command: 'touch never' } : mode === 'empty-title' ? { title: '   ' } : mode === 'extra-argument' ? { title: 'bad', shell: 'no' }
        : mode === 'negative-cursor' ? { cursor: -1 } : mode === 'large-cursor' ? { cursor: 1000001 } : { title: 'denied' };
      const state = await toolRun(f.config, [{ name, args }], async harness => {
        if (mode === 'current-denial') f.config.tools = ['list_todos'];
        if (mode === 'current-time') f.config.limits.activeMs = 1;
        await harness.commit(async tx => {
          const r = (await tx.doc(StateDoc)).receipts.request!;
          if (mode === 'accepted-denial') r.config.tools = ['list_todos'];
          if (mode === 'tool-limit') r.toolCalls = r.config.limits.toolCalls;
          if (mode === 'expired') r.startedAt = Date.now() - r.config.limits.activeMs - 1;
          if (mode === 'current-time') r.startedAt = Date.now() - 100;
        }, context);
      });
      assert.deepEqual(state.todos, []);
      assert.deepEqual(state.actions, {});
    } finally { await f.cleanup(); }
  });
});
