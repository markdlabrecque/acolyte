import { openAICompletionsApi } from '@earendil-works/pi-ai/api/openai-completions.lazy';
import type { ProviderDriver } from './provider-call.ts';

const tokenCount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
function completeRawUsage(value: unknown) {
  if (!value || typeof value !== 'object') return undefined;
  if (!('prompt_tokens' in value) || !('completion_tokens' in value) || !('total_tokens' in value)) return undefined;
  const { prompt_tokens: input, completion_tokens: output, total_tokens: totalTokens } = value;
  if (!tokenCount(input) || !tokenCount(output) || !tokenCount(totalTokens) || totalTokens !== input + output) return undefined;
  return { input, output, totalTokens };
}

export const liveDriver: ProviderDriver = (selected, input, options) => {
  let rawUsage: ReturnType<typeof completeRawUsage>;
  const upstream = openAICompletionsApi().streamSimple(selected, input, { ...options,
    onProviderStreamEvent: async (event, selected) => {
      if (event && typeof event === 'object') {
        const choice: unknown = 'choices' in event && Array.isArray(event.choices) ? event.choices[0] : undefined;
        // Match Pi's usage selection before it defaults missing counts and replaces the total.
        const usage = ('usage' in event && event.usage)
          || (choice && typeof choice === 'object' && 'usage' in choice && choice.usage);
        if (usage) rawUsage = completeRawUsage(usage);
      }
      await options?.onProviderStreamEvent?.(event, selected);
    },
  });
  return { upstream, usageMatches: ({ usage }) => rawUsage !== undefined
    && rawUsage.input === usage.input + usage.cacheRead + usage.cacheWrite
    && rawUsage.output === usage.output && rawUsage.totalTokens === usage.totalTokens };
};
