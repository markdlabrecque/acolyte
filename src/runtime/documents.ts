import { defineDoc, type ConversationId, type SubmissionId } from '@earendil-works/pi-durable';
import type { Config } from '../config.ts';

export type Receipt = {
  receipt: string; requestId: string; conversationId: string; message: string; digest: string;
  order: number; state: 'queued' | 'running' | 'completed' | 'failed'; config: Config;
  startedAt: number; modelCalls: number; toolCalls: number;
  submission?: SubmissionId; answer?: string; failure?: string;
};
export type State = {
  agentId: string; next: number; active: string | null;
  conversations: Record<string, ConversationId>; receipts: Record<string, Receipt>;
  todos: { id: string; title: string; state: 'open'; createdAt: number }[];
  actions: Record<string, { name: string; args: string; taskId?: number; callId?: string; toolVersion?: number; result?: string }>;
  calls: Record<string, { state: 'intent' | 'dispatched' | 'answered'; response?: string }>;
};
export const StateDoc = defineDoc<State>({
  kind: 'app.assistant', version: 1, scope: 'session', checkpointWhen: () => true,
  initial: () => ({ agentId: '', next: 1, active: null, conversations: {}, receipts: {}, todos: [], actions: {}, calls: {} }),
});
export function active(state: State): Receipt {
  const receipt = state.active === null ? undefined : state.receipts[state.active];
  if (!receipt) throw new Error('No active request');
  if (Date.now() - receipt.startedAt >= receipt.config.limits.activeMs) throw new Error('Active work limit exhausted');
  return receipt;
}
