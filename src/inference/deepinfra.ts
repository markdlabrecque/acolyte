import { createHash } from 'node:crypto';
import { createModels, createProvider, fauxProvider, fauxAssistantMessage, fauxText, fauxToolCall,
  type AssistantMessage, type ProviderStreams, type Model, type Api } from '@earendil-works/pi-ai';
import { createAssistantMessageEventStream } from '@earendil-works/pi-ai/utils/event-stream';
import { openAICompletionsApi } from '@earendil-works/pi-ai/api/openai-completions.lazy';
import { GenerationTask, defineExtension, hook, type Harness } from '@earendil-works/pi-durable';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { type Config } from '../config.ts';
import { deepInfraCredential } from './credentials.ts';
import { StateDoc, active } from '../runtime/documents.ts';
import type { Reservations } from './budget.ts';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const tokenCount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
function completeRawUsage(value: unknown) {
  if (!value || typeof value !== 'object') return undefined;
  if (!('prompt_tokens' in value) || !('completion_tokens' in value) || !('total_tokens' in value)) return undefined;
  const { prompt_tokens: input, completion_tokens: output, total_tokens: totalTokens } = value;
  if (!tokenCount(input) || !tokenCount(output) || !tokenCount(totalTokens) || totalTokens !== input + output) return undefined;
  return { input, output, totalTokens };
}

// This is a test-only injection seam, never a configuration or CLI option.
export function inference(config: Config, ledger: Reservations, getHarness: () => Harness, testEndpoint?: string) {
  if (testEndpoint !== undefined) {
    const url = new URL(testEndpoint);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password || url.search || url.hash) {
      throw new Error('Test endpoint must be literal loopback HTTP');
    }
  }
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
  const faux = fauxProvider({ provider: config.inference.provider, api: 'td002-fixture',
    models: [{ id: config.inference.model, contextWindow: config.limits.inputTokens, maxTokens: config.limits.outputTokens }] });
  const fixtureModel = faux.getModel();
  const model: Model<Api> = config.inference.mode === 'fixture' ? fixtureModel : {
    ...fixtureModel, api: 'openai-completions', baseUrl: testEndpoint ?? 'https://api.deepinfra.com/v1/openai',
    compat: { maxTokensField: 'max_tokens' as const, supportsStore: false, supportsDeveloperRole: false },
  };
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
          if (request.modelCalls >= Math.min(config.limits.modelCalls, request.config.limits.modelCalls)) throw new Error('Model call limit exhausted');
          request.modelCalls++;
          state.calls[attempt.id] = { state: 'intent' };
        }
        return undefined;
      }, context);
      if (prior) {
        const response: AssistantMessage = JSON.parse(prior);
        if (response.stopReason === 'error' || response.stopReason === 'aborted') events.push({ type: 'error', reason: response.stopReason, error: response });
        else events.push({ type: 'done', reason: response.stopReason === 'toolUse' ? 'toolUse' : 'stop', message: response });
        events.end(response);
        return;
      }
      const estimate = Math.ceil(config.limits.inputTokens * rates.inputUsdPerMillion + config.limits.outputTokens * rates.outputUsdPerMillion);
      ledger.reserve(attempt.id, estimate);
      const remaining = await harness.commit(async tx => {
        const state = await tx.doc(StateDoc);
        const request = active(state);
        const remaining = Math.min(request.config.limits.activeMs, config.limits.activeMs) - (Date.now() - request.startedAt);
        if (remaining <= 0) throw new Error('Active work limit exhausted');
        if (state.calls[attempt.id]?.state !== 'intent') throw new Error('Attempt is not dispatchable');
        state.calls[attempt.id]!.state = 'dispatched';
        return remaining;
      }, context);
      const controller = new AbortController();
      const signal = options?.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
      const deadline = setTimeout(() => controller.abort(), Math.max(1, remaining));
      let progress = setTimeout(() => controller.abort(), config.limits.progressMs);
      const network: typeof fetch = async (url, init) => {
        const connection = setTimeout(() => controller.abort(), config.limits.connectMs);
        try {
          if (testEndpoint !== undefined && new URL(String(url)).origin !== new URL(testEndpoint).origin) {
            throw new Error('Test transport cannot leave loopback endpoint');
          }
          return await fetch(url, { ...init, signal, redirect: 'error' });
        } finally { clearTimeout(connection); }
      };
      try {
        let rawUsage: ReturnType<typeof completeRawUsage>;
        const sentOptions = { ...options, signal, maxRetries: 0, maxTokens: config.limits.outputTokens, timeoutMs: undefined,
          apiKey: credential, fetch: network,
          onProviderStreamEvent: async (event: unknown, selected: Model<Api>) => {
            if (event && typeof event === 'object') {
              const choice: unknown = 'choices' in event && Array.isArray(event.choices) ? event.choices[0] : undefined;
              // Match Pi's top-level/first-choice usage selection, before it defaults missing counts and replaces the total.
              const usage = ('usage' in event && event.usage)
                || (choice && typeof choice === 'object' && 'usage' in choice && choice.usage);
              if (usage) rawUsage = completeRawUsage(usage);
            }
            await options?.onProviderStreamEvent?.(event, selected);
          } };
        if (config.inference.mode === 'fixture') {
          const last = input.messages.at(-1);
          if (last?.role === 'toolResult') {
            faux.appendResponses([fauxAssistantMessage([fauxText(JSON.stringify(last.content))])]);
          } else {
            const user = input.messages.findLast(message => message.role === 'user');
            const text = user?.role === 'user' && typeof user.content === 'string' ? user.content : '';
            const title = /^Add "([^"]+)"$/i.exec(text)?.[1];
            faux.appendResponses([fauxAssistantMessage([title ? fauxToolCall('add_todo', { title }) : fauxToolCall('list_todos', {})], { stopReason: 'toolUse' })]);
          }
        }
        const upstream = config.inference.mode === 'fixture'
          ? faux.provider.streamSimple(selected, input, sentOptions)
          : openAICompletionsApi().streamSimple(selected, input, sentOptions);
        for await (const event of upstream) {
          if ((event.type === 'text_delta' || event.type === 'thinking_delta' || event.type === 'toolcall_delta') && event.delta.length > 0) {
            clearTimeout(progress);
            progress = setTimeout(() => controller.abort(), config.limits.progressMs);
          }
          if (event.type !== 'done' && event.type !== 'error') events.push(event);
        }
        const response = await upstream.result();
        await harness.commit(async tx => {
          const state = await tx.doc(StateDoc);
          state.calls[attempt.id] = { state: 'answered', response: JSON.stringify(response) };
        }, context);
        const usage = response.usage;
        const knownUsage = [usage.input, usage.output, usage.cacheRead, usage.cacheWrite, usage.totalTokens]
          .every(value => Number.isSafeInteger(value) && value >= 0)
          && usage.totalTokens > 0 && usage.totalTokens === usage.input + usage.output + usage.cacheRead + usage.cacheWrite
          && (config.inference.mode === 'fixture' || (rawUsage !== undefined
            && rawUsage.input === usage.input + usage.cacheRead + usage.cacheWrite
            && rawUsage.output === usage.output && rawUsage.totalTokens === usage.totalTokens));
        if (knownUsage && response.stopReason !== 'error' && response.stopReason !== 'aborted') {
          ledger.settle(attempt.id, Math.ceil((response.usage.input + response.usage.cacheRead + response.usage.cacheWrite) * rates.inputUsdPerMillion + response.usage.output * rates.outputUsdPerMillion));
        }
        if (response.stopReason === 'error' || response.stopReason === 'aborted') events.push({ type: 'error', reason: response.stopReason, error: response });
        else events.push({ type: 'done', reason: response.stopReason === 'toolUse' ? 'toolUse' : 'stop', message: response });
        events.end(response);
      } finally { clearTimeout(deadline); clearTimeout(progress); }
    })().catch(error => {
      const response = { ...fauxAssistantMessage(''), provider: config.inference.provider, model: config.inference.model,
        api: model.api, stopReason: 'error' as const, errorMessage: error instanceof Error ? error.message : 'Inference blocked' };
      events.push({ type: 'error', reason: 'error', error: response });
      events.end(response);
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
