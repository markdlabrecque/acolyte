import { createHash } from 'node:crypto';
import { createModels, createProvider, fauxAssistantMessage,
  type AssistantMessage, type ProviderStreams } from '@earendil-works/pi-ai';
import { createAssistantMessageEventStream } from '@earendil-works/pi-ai/utils/event-stream';
import { GenerationTask, defineExtension, hook, type Harness } from '@earendil-works/pi-durable';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { type Config } from '../config.ts';
import { deepInfraCredential } from './credentials.ts';
import { inferenceProvider } from './provider-call.ts';
import { StateDoc, active } from '../runtime/documents.ts';
import { remainingActiveMs, countCall } from '../runtime/limits.ts';
import type { Reservations } from './budget.ts';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function finish(events: ReturnType<typeof createAssistantMessageEventStream>, response: AssistantMessage) {
  if (response.stopReason === 'error' || response.stopReason === 'aborted') events.push({ type: 'error', reason: response.stopReason, error: response });
  else events.push({ type: 'done', reason: response.stopReason === 'toolUse' ? 'toolUse' : 'stop', message: response });
  events.end(response);
}

// This is a test-only injection seam, never a configuration or CLI option.
export function inference(config: Config, ledger: Reservations, getHarness: () => Harness, testEndpoint?: string) {
  const provider = inferenceProvider(config, testEndpoint);
  const { model } = provider;
  let binding: { id: string; digest: string } | undefined;
  const guard = defineExtension({ name: 'inference-guard-v1', hooks: [hook(GenerationTask, {
    beforeRequest: async (request, api, ctx) => {
      binding = undefined;
      const task = await getHarness().getTask(api.taskId, ctx);
      const checkpoint = task && 'checkpoint' in task.state ? task.state.checkpoint : null;
      if (!checkpoint || typeof checkpoint !== 'object' || Array.isArray(checkpoint) || typeof checkpoint.attempt !== 'number') {
        throw new Error('Missing durable model attempt');
      }
      binding = { id: `${config.agentId}:${api.taskId}:${checkpoint.attempt}`, digest: digest(request.messages) };
      return undefined;
    },
  })] });
  const stream: ProviderStreams['streamSimple'] = (selected, input, options) => {
    const events = createAssistantMessageEventStream();
    const attempt = binding;
    binding = undefined;
    void (async () => {
      const harness = getHarness();
      if (!attempt || attempt.digest !== digest(input.messages)) throw new Error('Model dispatch lacks durable attempt identity');
      const rates = config.inference;
      if (rates.inputUsdPerMillion === null || rates.outputUsdPerMillion === null) throw new Error('Unknown model pricing');
      if (Buffer.byteLength(JSON.stringify(input)) + 1024 > config.limits.inputTokens) throw new Error('Input context bound exceeded');
      const credential = config.inference.mode === 'live'
        ? await deepInfraCredential(rates.credentialFile ?? (() => { throw new Error('Missing model credentials'); })()) : undefined;
      const prior = await harness.commit(async tx => {
        const state = await tx.doc(StateDoc);
        const request = active(state);
        const call = state.calls[attempt.id];
        if (call?.state === 'dispatched') throw new Error('Provider dispatch uncertain; no automatic resend');
        if (call?.state === 'answered') return call.response;
        if (!call) {
          countCall(request, config, 'modelCalls');
          state.calls[attempt.id] = { state: 'intent' };
        }
        return undefined;
      }, context);
      if (prior) {
        finish(events, JSON.parse(prior));
        return;
      }
      const estimate = Math.ceil(config.limits.inputTokens * rates.inputUsdPerMillion + config.limits.outputTokens * rates.outputUsdPerMillion);
      ledger.reserve(attempt.id, estimate);
      const remaining = await harness.commit(async tx => {
        const state = await tx.doc(StateDoc);
        const request = active(state);
        const remaining = remainingActiveMs(request, config);
        if (state.calls[attempt.id]?.state !== 'intent') throw new Error('Attempt is not dispatchable');
        state.calls[attempt.id]!.state = 'dispatched';
        return remaining;
      }, context);
      const { response, knownUsage } = await provider.call(selected, input, options, credential, remaining);
      await harness.commit(async tx => {
        const state = await tx.doc(StateDoc);
        state.calls[attempt.id] = { state: 'answered', response: JSON.stringify(response) };
      }, context);
      if (knownUsage && response.stopReason !== 'error' && response.stopReason !== 'aborted') {
        ledger.settle(attempt.id, Math.ceil((response.usage.input + response.usage.cacheRead + response.usage.cacheWrite) * rates.inputUsdPerMillion + response.usage.output * rates.outputUsdPerMillion));
      }
      finish(events, response);
    })().catch(() => {
      const response = { ...fauxAssistantMessage(''), provider: config.inference.provider, model: config.inference.model,
        api: model.api, stopReason: 'error' as const, errorMessage: 'Inference blocked' };
      finish(events, response);
    });
    return events;
  };
  const models = createModels();
  models.setProvider(createProvider({ id: config.inference.provider, models: [model],
    auth: { apiKey: { name: 'Adapter-owned authorization', resolve: async () => ({ auth: {} }) } },
    api: { stream, streamSimple: stream },
  }));
  return { models, guard };
}
