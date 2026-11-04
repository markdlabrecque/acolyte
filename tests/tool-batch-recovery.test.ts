import assert from 'node:assert/strict';
import { basename } from 'node:path';
import { test } from 'node:test';
import type { JsonValue } from '@earendil-works/chord';
import { GenerationTask, ToolTask, type EntryRecord, type TaskRecord } from '@earendil-works/pi-durable';
import type { State } from '../src/runtime/documents.ts';
import { child, fixture, stop, until } from './support.ts';

type Report = {
  event: string; batch: EntryRecord[]; tasks: TaskRecord<JsonValue, JsonValue, JsonValue>[];
  state: State; scheduling: string; providerCalls: number;
};
const worker = 'tests/fixtures/tool-batch-worker.ts';
const expectedCalls = [
  { type: 'toolCall', id: 'original-first', name: 'add_todo', arguments: { title: 'first original todo' } },
  { type: 'toolCall', id: 'original-second', name: 'add_todo', arguments: { title: 'second original todo' } },
];
function reports(output: string): Report[] {
  return output.split('\n').filter(line => line.startsWith('{') && line.endsWith('}')).map(line => JSON.parse(line));
}
function batch(report: Report) {
  assert.equal(report.batch.length, 1, 'exactly one persisted tool-calling assistant entry');
  const entry = report.batch[0]!;
  const message = entry.model?.[0];
  assert.ok(message?.role === 'assistant');
  assert.deepEqual(message.content.filter(c => c.type === 'toolCall'), expectedCalls);
  return entry;
}
function waitingBatch(report: Report) {
  const entry = batch(report);
  const generation = report.tasks.find(t => t.kind === GenerationTask.definition.name);
  assert.ok(generation);
  assert.equal(generation.state.status, 'waiting');
  const checkpoint = generation.state.checkpoint;
  assert.ok(checkpoint && typeof checkpoint === 'object' && !Array.isArray(checkpoint));
  assert.equal(checkpoint.phase, 'tools');
  assert.equal(checkpoint.assistant, entry.id);
  assert.deepEqual(checkpoint.pending, ['original-second']);
  const tools = report.tasks.filter(t => t.kind === ToolTask.definition.name);
  assert.equal(tools.length, 1, 'sequential mode has not created the second tool task yet');
  assert.deepEqual(tools[0]!.input, { kind: 'model', assistant: entry.id, callId: 'original-first' });
  assert.deepEqual(checkpoint.tools, [tools[0]!.id]);
  return tools[0]!;
}

test('the full Pi tool-call batch survives SIGKILL before execution and between todo effects', { timeout: 20000 }, async t => {
  for (const boundary of ['before-first', 'after-first'] as const) await t.test(boundary, async t => {
    const f = await fixture();
    f.config.agentId = basename(f.directory).toLowerCase();
    await f.save();
    const running = child(worker, [boundary, f.file]);
    try {
      await until(() => {
        if (running.process.exitCode !== null) throw new Error(running.output());
        return reports(running.output()).some(r => r.event === boundary);
      });
      const before = reports(running.output()).find(r => r.event === 'before-first')!;
      const firstTask = waitingBatch(before);
      assert.deepEqual(before.state.todos, []);
      assert.deepEqual(before.state.actions, {});
      assert.equal(before.providerCalls, 1);
      const atKill = reports(running.output()).find(r => r.event === boundary)!;
      waitingBatch(atKill);
      assert.equal(atKill.state.todos.length, boundary === 'after-first' ? 1 : 0);
      assert.equal(Object.keys(atKill.state.actions).length, boundary === 'after-first' ? 1 : 0);
      const toolState = atKill.tasks.find(task => task.id === firstTask.id)!.state;
      assert.equal(toolState.status, 'running');
      const intent = toolState.checkpoint;
      assert.ok(intent && typeof intent === 'object' && !Array.isArray(intent));
      assert.equal(intent.phase, boundary === 'after-first' ? 'execute' : 'call');
      if (boundary === 'after-first') {
        const first = atKill.state.actions[`todo-v1:${firstTask.id}`]!;
        assert.equal(first.callId, 'original-first');
        assert.deepEqual(JSON.parse(first.result!), atKill.state.todos[0]);
      }
      assert.equal(running.process.kill('SIGKILL'), true);
      assert.equal((await running.exited).code, null, 'worker was killed, not gracefully closed');
      assert.equal(running.process.signalCode, 'SIGKILL');

      // Inspect with scheduling still paused in another process. The proof is
      // recovered SQLite state, not the pre-kill stdout snapshot.
      const inspector = child(worker, ['inspect', f.file]);
      t.after(async () => { await stop(inspector); });
      const inspection = await inspector.exited;
      assert.equal(inspection.code, 0, inspection.output);
      const saved = reports(inspection.output).find(r => r.event === 'inspection')!;
      assert.equal(saved.scheduling, 'paused');
      assert.equal(saved.providerCalls, 0);
      assert.deepEqual(saved.batch, atKill.batch);
      assert.deepEqual(saved.state, atKill.state);
      assert.equal(waitingBatch(saved).id, firstTask.id);

      const recovering = child(worker, ['resume', f.file]);
      t.after(async () => { await stop(recovering); });
      const recovery = await recovering.exited;
      assert.equal(recovery.code, 0, recovery.output);
      const resumed = reports(recovery.output).find(r => r.event === 'completed')!;
      assert.deepEqual(resumed.batch, saved.batch, 'original assistant entry and both calls retained');
      batch(resumed);
      assert.equal(resumed.providerCalls, 1, 'only the final answer was generated after both saved calls completed');
      assert.deepEqual(resumed.state.todos.map(todo => todo.title), ['first original todo', 'second original todo']);
      assert.equal(new Set(resumed.state.todos.map(todo => todo.id)).size, 2);
      const actions = Object.values(resumed.state.actions);
      assert.equal(actions.length, 2);
      assert.deepEqual(actions.map(action => action.callId), ['original-first', 'original-second']);
      assert.equal(actions[0]!.taskId, firstTask.id);
      assert.equal(resumed.state.receipts.request!.toolCalls, 2, 'replay did not consume another tool allowance');
      for (const action of actions) {
        assert.equal(action.toolVersion, 1);
        assert.ok(action.result);
        assert.ok(resumed.state.todos.some(todo => JSON.stringify(todo) === action.result));
      }
      if (boundary === 'after-first') {
        assert.deepEqual(resumed.state.todos[0], saved.state.todos[0]);
        assert.deepEqual(resumed.state.actions[`todo-v1:${firstTask.id}`], saved.state.actions[`todo-v1:${firstTask.id}`]);
      }
      t.diagnostic(`${boundary}: SIGKILL retained both original calls and the pending second call; recovery created exactly two todos without regenerating the batch`);
    } finally { await stop(running); await f.cleanup(); }
  });
});
