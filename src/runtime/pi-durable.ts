import { randomUUID, createHash } from 'node:crypto';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { Harness, createRegistry, configure, type Storage } from '@earendil-works/pi-durable';
import type { Config } from '../config.ts';
import { StateDoc, type Receipt } from './documents.ts';
import { todoExtension } from '../tools/todos.ts';
import { inference } from '../inference/deepinfra.ts';
import type { Reservations } from '../inference/budget.ts';

export class Rejection extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export type Input = { schemaVersion: 1; conversationId: string; requestId: string; message: string };

export async function openRuntime(storage: Storage, config: Config, ledger: Reservations) {
  let harness: Harness;
  const tools = todoExtension(config);
  const provider = inference(config, ledger, () => harness);
  const registry = createRegistry();
  registry.install(tools);
  registry.install(provider.guard);
  harness = await Harness.open(storage, {
    models: provider.models, registry, identity: { attribution: null },
    settings: { extensions: [tools, provider.guard], compaction: { enabled: false }, retry: { enabled: false },
      stream: { maxRetries: 0 }, toolExecution: 'sequential' },
  }, context);
  try {
    await harness.commit(async tx => {
      const state = await tx.doc(StateDoc);
      if (state.agentId && state.agentId !== config.agentId) throw new Error('Store belongs to another agent');
      state.agentId = config.agentId;
    }, context);
  } catch (error) { await harness.close(context); throw error; }
  let draining: Promise<void> | undefined;
  let closing = false;
  let sealed = false;
  let wake = false;
  function drain() {
    wake = true;
    if (draining || closing || sealed) return;
    wake = false;
    draining = (async () => {
      while (!closing) {
        const request = await harness.commit(async tx => {
          const state = await tx.doc(StateDoc);
          const next = state.active === null
            ? Object.values(state.receipts).filter(item => item.state === 'queued').sort((a, b) => a.order - b.order)[0]
            : state.receipts[state.active];
          if (!next) return undefined;
          state.active = next.requestId;
          next.state = 'running';
          if (next.startedAt === 0) next.startedAt = Date.now();
          return JSON.parse(JSON.stringify(next)) as Receipt;
        }, context);
        if (!request) return;
        try {
          const state = (await harness.snapshot(StateDoc, context))!;
          const conversation = (await harness.conversation(state.conversations[request.conversationId]!, context))!;
          await conversation.configure({ instructions: request.config.prompt,
            model: { provider: request.config.inference.provider, modelId: request.config.inference.model },
            extensions: [tools, provider.guard], tools: tools.tools,
          }, context);
          const submission = await conversation.submit({ type: 'input', content: request.message, requestId: `cli:${request.requestId}` }, context);
          await harness.commit(async tx => { (await tx.doc(StateDoc)).receipts[request.requestId]!.submission = submission.id; }, context);
          const settled = await submission.wait(context);
          const answer = settled.status === 'done' && settled.type === 'input'
            ? (await conversation.commit(tx => tx.entry(settled.answer), context))?.model?.[0] : undefined;
          await harness.commit(async tx => {
            const doc = await tx.doc(StateDoc);
            const saved = doc.receipts[request.requestId]!;
            if (answer?.role === 'assistant') {
              saved.state = 'completed';
              saved.answer = answer.content.filter(block => block.type === 'text').map(block => block.text).join('\n');
            } else {
              saved.state = 'failed';
              saved.failure = settled.status === 'unanswered' ? `${settled.reason}: ${String(settled.detail ?? '')}` : 'Missing terminal answer';
            }
            doc.active = null;
          }, context);
        } catch (error) {
          if (closing) return;
          await harness.commit(async tx => {
            const doc = await tx.doc(StateDoc);
            doc.receipts[request.requestId]!.state = 'failed';
            doc.receipts[request.requestId]!.failure = error instanceof Error ? error.message : 'Runtime failed';
            doc.active = null;
          }, context);
        }
      }
    })().catch(() => {
      // Storage failure seals the runtime. Never admit into a dead queue.
      sealed = true;
    }).finally(() => {
      draining = undefined;
      // An admission can commit after the empty read but before this finally.
      if (wake && !closing && !sealed) drain();
    });
  }
  drain();
  return {
    async submit(input: Input) {
      if (closing || sealed) throw new Rejection(503, 'Runner/storage unavailable');
      const digest = createHash('sha256').update(JSON.stringify({ sender: config.owner, source: 'cli', agent: config.agentId,
        conversation: input.conversationId, message: input.message })).digest('hex');
      const result = await harness.commit(async tx => {
        const doc = await tx.doc(StateDoc);
        const existing = Object.hasOwn(doc.receipts, input.requestId) ? doc.receipts[input.requestId] : undefined;
        if (existing) {
          if (existing.digest !== digest) throw new Rejection(409, 'Request identity conflict');
          return { status: 200, receipt: existing.receipt };
        }
        const pending = Object.values(doc.receipts).filter(item => item.state === 'queued' || item.state === 'running').length;
        if (pending >= config.limits.queued + 1) throw new Rejection(429, 'Agent queue full');
        if (!Object.hasOwn(doc.conversations, input.conversationId)) {
          const conversation = await tx.createConversation({ ownership: { kind: 'ownerless' } });
          await configure(tx, conversation.id, { extensions: [tools, provider.guard], tools: tools.tools });
          doc.conversations[input.conversationId] = conversation.id;
        }
        const receipt = randomUUID();
        doc.receipts[input.requestId] = { ...input, digest, receipt, config: JSON.parse(JSON.stringify(config)),
          order: doc.next++, state: 'queued', startedAt: 0, modelCalls: 0, toolCalls: 0 };
        return { status: 202, receipt };
      }, context);
      drain();
      return { ...result, requestId: input.requestId };
    },
    async inspect(requestId: string, result: boolean) {
      if (closing || sealed) throw new Rejection(503, 'Runner/storage unavailable');
      const state = await harness.snapshot(StateDoc, context);
      const item = state && Object.hasOwn(state.receipts, requestId) ? state.receipts[requestId] : undefined;
      if (!item) throw new Rejection(404, 'Unknown receipt');
      return { status: result && item.state !== 'completed' && item.state !== 'failed' ? 202 : 200,
        requestId: item.requestId, receipt: item.receipt, state: item.state,
        fixture: item.config.inference.mode === 'fixture',
        ...(result && item.answer !== undefined ? { answer: item.answer } : {}),
        ...(item.failure !== undefined ? { failure: item.failure } : {}),
      };
    },
    async close() { closing = true; await harness.close(context); await draining; },
  };
}
