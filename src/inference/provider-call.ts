import { fauxProvider, fauxAssistantMessage,
  type AssistantMessage, type ProviderStreams, type Model, type Api } from '@earendil-works/pi-ai';
import { liveDriver } from './live-stream.ts';
import type { Config } from '../config.ts';

type StreamOptions = Parameters<ProviderStreams['streamSimple']>[2];
export type ProviderDriver = (...args: Parameters<ProviderStreams['streamSimple']>) => {
  upstream: ReturnType<ProviderStreams['streamSimple']>;
  usageMatches: (response: AssistantMessage) => boolean;
};

export function inferenceProvider(config: Config, testEndpoint?: string) {
  if (testEndpoint !== undefined) {
    const url = new URL(testEndpoint);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password || url.search || url.hash) {
      throw new Error('Test endpoint must be literal loopback HTTP');
    }
  }
  const faux = fauxProvider({ provider: config.inference.provider, api: 'td002-fixture',
    models: [{ id: config.inference.model, contextWindow: config.limits.inputTokens, maxTokens: config.limits.outputTokens }] });
  const fixtureModel = faux.getModel();
  const model: Model<Api> = config.inference.mode === 'fixture' ? fixtureModel : {
    ...fixtureModel, api: 'openai-completions', baseUrl: testEndpoint ?? 'https://api.deepinfra.com/v1/openai',
    compat: { maxTokensField: 'max_tokens' as const, supportsStore: false, supportsDeveloperRole: false },
  };
  const driver = config.inference.mode === 'fixture'
    ? import('./fixture-stream.ts').then(({ fixtureDriver }) => fixtureDriver(faux))
    : Promise.resolve(liveDriver);

  async function call(selected: Model<Api>, input: Parameters<ProviderStreams['streamSimple']>[1],
    options: StreamOptions, credential: string | undefined, remaining: number, onProgress?: () => Promise<void>) {
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
      const sentOptions = { ...options, signal, maxRetries: 0, maxTokens: config.limits.outputTokens, timeoutMs: undefined,
        apiKey: credential, fetch: network };
      const { upstream, usageMatches } = (await driver)(selected, input, sentOptions);
      for await (const event of upstream) {
        if ((event.type === 'text_delta' || event.type === 'thinking_delta' || event.type === 'toolcall_delta') && event.delta.length > 0) {
          clearTimeout(progress);
          progress = setTimeout(() => controller.abort(), config.limits.progressMs);
          await onProgress?.();
        }
        // Pi persists partial events, so publish only the sanitized terminal result.
      }
      const upstreamResponse = await upstream.result();
      // Provider diagnostics can echo Authorization in content or metadata too.
      const response: AssistantMessage = upstreamResponse.stopReason === 'error' || upstreamResponse.stopReason === 'aborted'
        ? { ...fauxAssistantMessage([]), provider: config.inference.provider, model: config.inference.model,
            api: model.api, stopReason: upstreamResponse.stopReason, errorMessage: 'Inference provider failed' }
        : upstreamResponse;
      const usage = response.usage;
      const knownUsage = [usage.input, usage.output, usage.cacheRead, usage.cacheWrite, usage.totalTokens]
        .every(value => Number.isSafeInteger(value) && value >= 0)
        && usage.totalTokens > 0 && usage.totalTokens === usage.input + usage.output + usage.cacheRead + usage.cacheWrite
        && usageMatches(response);
      return { response, knownUsage };
    } finally { controller.abort(); clearTimeout(deadline); clearTimeout(progress); }
  }
  return { model, call };
}
