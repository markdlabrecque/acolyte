import assert from 'node:assert/strict';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { createModels, fauxProvider, fauxAssistantMessage, fauxText, fauxToolCall } from '@earendil-works/pi-ai';
import { Harness, ToolTask, createRegistry, defineExtension, hook } from '@earendil-works/pi-durable';
import { loadConfig } from '../../src/config.ts';
import { ownStore } from '../../src/host/store.ts';
import { StateDoc } from '../../src/runtime/documents.ts';
import { todoExtension } from '../../src/tools/todos.ts';

// This is a disposable subprocess controller, not a production runner failpoint.
const mode = process.argv[2];
assert.ok(['before-first', 'after-first', 'inspect', 'resume'].includes(mode!));
const config = await loadConfig(process.argv[3]!);
const store = await ownStore(config);
const faux = fauxProvider();
const resuming = mode === 'resume';
faux.setResponses(resuming ? [transcript => {
  // A new model response is allowed only after both original calls have results.
  assert.deepEqual(transcript.messages.filter(m => m.role === 'toolResult').map(m => m.toolCallId), ['original-first', 'original-second']);
  return fauxAssistantMessage([fauxText('Both original todos stored')]);
}] : [fauxAssistantMessage([
  fauxToolCall('add_todo', { title: 'first original todo' }, { id: 'original-first' }),
  fauxToolCall('add_todo', { title: 'second original todo' }, { id: 'original-second' }),
], { stopReason: 'toolUse' })]);
const models = createModels();
models.setProvider(faux.provider);
const tools = todoExtension(config);
let harness: Harness;
async function report(event: string) {
  const root = await harness.root(context);
  const entries = await root.entries({ order: 'ascending' }, 10, undefined, context);
  const tasks = await harness.commit(tx => tx.scanTasks({}, 100), context);
  assert.equal(entries.next, undefined);
  assert.equal(tasks.next, undefined);
  const batch = entries.items.filter(e => e.model?.some(m => m.role === 'assistant' && m.content.some(c => c.type === 'toolCall')));
  const state = await harness.snapshot(StateDoc, context);
  const scheduling = (await harness.inspect(context)).scheduling;
  // The parent waits for a complete JSON line before killing this process.
  console.log(JSON.stringify({ event, batch, tasks: tasks.items, state, scheduling, providerCalls: faux.state.callCount }));
}
async function park() {
  const keepAlive = setInterval(() => {}, 1000);
  try { await new Promise<void>(() => {}); }
  finally { clearInterval(keepAlive); }
}
const barrier = defineExtension({ name: 'test-batch-barrier', hooks: [hook(ToolTask, {
  async beforeTool(call) {
    if ((mode === 'before-first' || mode === 'after-first') && call.id === 'original-first') {
      await report('before-first');
      if (mode === 'before-first') await park();
    }
    return undefined;
  },
  async afterTool(call) {
    if (mode === 'after-first' && call.id === 'original-first') {
      await report('after-first');
      await park();
    }
    return undefined;
  },
})] });
const registry = createRegistry();
registry.install(tools);
registry.install(barrier);
try {
  harness = await Harness.open(store.storage, { models, registry, settings: {
    extensions: [tools, barrier], toolExecution: 'sequential', compaction: { enabled: false },
    retry: { enabled: false }, stream: { maxRetries: 0 },
  } }, context);
  try {
    if (mode === 'inspect') {
      assert.equal((await harness.inspect(context)).scheduling, 'paused');
      await report('inspection');
    } else if (resuming) {
      const root = await harness.root(context);
      const saved = await root.commit(tx => tx.submissionByRequest(root.id, 'original-batch'), context);
      assert.ok(saved);
      const submission = await harness.submission(saved.id, context);
      assert.ok(submission);
      const settled = await submission.wait(context);
      assert.equal(settled.status, 'done');
      await report('completed');
    } else {
      // Supply the production todo extension's active receipt without claiming
      // to test runner admission, provider accounting, or HTTP recovery here.
      await harness.commit(async tx => {
        const state = await tx.doc(StateDoc);
        state.agentId = config.agentId;
        state.active = 'request';
        state.receipts.request = { receipt: 'receipt', requestId: 'request', conversationId: 'conversation',
          message: 'Add two todos', digest: 'fixture', order: 1, state: 'running', startedAt: Date.now(),
          modelCalls: 0, toolCalls: 0, config: structuredClone(config) };
      }, context);
      const model = faux.getModel();
      const root = await harness.root(context, { agent: {
        model: { provider: model.provider, modelId: model.id }, extensions: [tools, barrier], tools: tools.tools,
      } });
      const submission = await root.submit({ type: 'input', content: 'Add two todos', requestId: 'original-batch' }, context);
      await submission.wait(context);
      assert.fail('Crash barrier was not reached');
    }
  } finally { await harness.close(context); }
} finally {
  await store.storage.close(context);
  await store.unlock();
}
