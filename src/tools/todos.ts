import { randomUUID } from 'node:crypto';
import { Type } from '@earendil-works/pi-ai';
import { defineTool, defineExtension, type ToolExecutionApi } from '@earendil-works/pi-durable';
import type { Context } from '@earendil-works/chord/context';
import { StateDoc, active } from '../runtime/documents.ts';
import type { Config } from '../config.ts';

export function todoExtension(config: Config) {
  async function execute(name: 'add_todo' | 'list_todos', args: { title?: string; cursor?: number }, api: ToolExecutionApi, context: Context) {
    const key = `todo-v1:${api.taskId}`;
    const encoded = JSON.stringify(args);
    await api.commit(async tx => {
      const state = await tx.doc(StateDoc);
      const request = active(state);
      if (!config.tools.includes(name) || !request.config.tools.includes(name)) throw new Error('Tool denied');
      if (Date.now() - request.startedAt >= config.limits.activeMs) throw new Error('Active work limit exhausted');
      const prior = state.actions[key];
      if (prior) {
        if (prior.name !== name || prior.args !== encoded || (prior.callId !== undefined && prior.callId !== api.callId)) throw new Error('Changed action arguments');
        return;
      }
      if (request.toolCalls >= Math.min(request.config.limits.toolCalls, config.limits.toolCalls)) throw new Error('Tool call limit exhausted');
      request.toolCalls++;
      state.actions[key] = { name, args: encoded, taskId: api.taskId, callId: api.callId, toolVersion: 1 };
    }, context);
    const result = await api.commit(async tx => {
      const state = await tx.doc(StateDoc);
      const request = active(state);
      if (!config.tools.includes(name) || !request.config.tools.includes(name)) throw new Error('Tool denied');
      if (Date.now() - request.startedAt >= config.limits.activeMs) throw new Error('Active work limit exhausted');
      const action = state.actions[key]!;
      if (action.result !== undefined) return action.result;
      if (name === 'add_todo') {
        const todo = { id: randomUUID(), title: args.title!.trim(), state: 'open' as const, createdAt: Date.now() };
        state.todos.push(todo);
        action.result = JSON.stringify(todo);
      } else {
        const start = args.cursor ?? 0;
        const end = start + Math.min(config.limits.listPage, request.config.limits.listPage, 100);
        action.result = JSON.stringify({ items: state.todos.slice(start, end), next: end < state.todos.length ? end : null });
      }
      return action.result!;
    }, context);
    return { output: [{ type: 'text' as const, text: result }] };
  }
  const add = defineTool({ name: 'add_todo', description: 'Add one open todo.', callers: ['model'], replay: 'safe',
    parameters: Type.Object({ title: Type.String({ minLength: 1, maxLength: 500, pattern: '\\S' }) }, { additionalProperties: false }),
    execute: (args, api, ctx) => execute('add_todo', args, api, ctx),
  });
  const list = defineTool({ name: 'list_todos', description: 'List a bounded page of todos.', callers: ['model'], replay: 'safe',
    parameters: Type.Object({ cursor: Type.Optional(Type.Integer({ minimum: 0, maximum: 1_000_000 })) }, { additionalProperties: false }),
    execute: (args, api, ctx) => execute('list_todos', args, api, ctx),
  });
  return defineExtension({ name: 'todos-v1', tools: [add, list] });
}
