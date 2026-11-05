import { fauxProvider, fauxAssistantMessage, fauxText, fauxToolCall } from '@earendil-works/pi-ai';
import type { ProviderDriver } from './provider-call.ts';

export function fixtureDriver(faux: ReturnType<typeof fauxProvider>): ProviderDriver {
  return (selected, input, options) => {
    const last = input.messages.at(-1);
    if (last?.role === 'toolResult') {
      faux.appendResponses([fauxAssistantMessage([fauxText(JSON.stringify(last.content))])]);
    } else {
      const user = input.messages.findLast(message => message.role === 'user');
      const text = user?.role === 'user' && typeof user.content === 'string' ? user.content : '';
      const title = /^Add "([^"]+)"$/i.exec(text)?.[1];
      faux.appendResponses([fauxAssistantMessage([title ? fauxToolCall('add_todo', { title }) : fauxToolCall('list_todos', {})], { stopReason: 'toolUse' })]);
    }
    // Fixture usage has no raw wire record; the common normalized checks still apply.
    return { upstream: faux.provider.streamSimple(selected, input, options), usageMatches: () => true };
  };
}
