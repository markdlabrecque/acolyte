# Define Slack conversations and approval interactions

ID: 05
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:grilling
Type: grilling
Status: closed
Disposition: deferred-to-spike
Assignee: none
Blocked by: none

## Integration completion update, 2026-10-27

Slack, Google, and Proton integration spikes are complete and closed. The owner found the remaining evidence and explicitly confirms all previously unrecorded in-scope tests passed. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md). Earlier deferred/unverified language below is historical, not an outstanding test requirement. Existing confirmed policies remain unchanged; genuinely unresolved product choices belong to specification synthesis, and production acceptance belongs to implementation.

## Question

Closed for current mapping at the owner's request. Confirmed choices below remain recorded; all unfinished interaction questions now belong to the deferred Slack spike.

How should the owner address the assistant, start or continue conversations, see receipts and job status, approve an exact action, cancel work, and reconcile uncertain outcomes in Slack? Decide DM versus channel use, owner identity checks, approval expiry, notification destinations, and how unavailable or duplicate delivery is presented. Keep one bot per agent and do not use Slack history as the durable record.

## Dependencies

- [Verify Slack integration on a free workspace](03-verify-free-slack-integration.md)
- [Test agent interactions on Slack's free plan](13-test-free-slack-agent-interactions.md). This is a deferred spike and no longer blocks current mapping. Native interaction feasibility remains unverified.

## Confirmed interaction direction

The owner selected this behavior on 2026-10-23:

- Agents send notifications to the owner by DM.
- The owner wants visible indication when an agent begins preparing a response and the ability to cancel it. Prefer native working and Stop controls in conversation threads where supported. Availability in the free workspace remains unverified; a custom in-thread status and Cancel button is a fallback proposal, not yet selected.
- Calendar changes require a DM showing the exact proposed change with Approve and Reject buttons. Only the owner may decide. Approval requests have no time-based expiry: they remain pending until approved, rejected, cancelled, or superseded. Before executing an approved change, recheck the target event and the proposal's preconditions. If the event has changed or the proposal no longer applies, explain the conflict and obtain fresh approval for any revised action. Do not silently apply changed arguments under the old approval.
- The owner is the only human in the Slack workspace. Accept human commands and approvals only from the configured owner account; no multi-user authorization design is needed. Agent participation in channel discussion does not grant agents authority to approve actions.
- Conversational interactions happen in Slack channels.
- The owner explicitly revised the earlier main-channel preference: start a conversation by mentioning an agent in the channel, then continue in a thread under that message. Other invited channel-member agents may contribute in the same thread. Use the thread as the default conversation boundary. Notifications and calendar approvals remain DMs.
- Each agent has its own Slack identity that the owner can mention and invite into channels.
- The owner manually curates channel membership to control which agents participate and keep conversations focused. Agents do not choose or expand channel membership themselves.
- A conversation usually starts with a message directed to one specific agent.
- Other agents present in the channel may contribute without a direct mention when they have important information relevant to the conversation.
- The owner allows agents to respond to each other and delegated selection of a cap. With the switch to thread-based conversations, apply the discretionary cap to each conversation thread: six combined conversational agent messages between owner messages, shared across its participating agents. This counts messages, not agents. The opening owner message supplies the initial budget; an owner reply in that thread replenishes it. Other threads, unrelated top-level messages, agent messages, timers, DM notifications, and DM approvals do not reset it. After the limit, agents wait for another owner reply in that thread. Notifications remain separate DMs. A remaining budget is not a reason to speak without useful information.

This replaces the earlier DM-only proposal and the subsequently selected main-channel conversation default. Threaded conversations are now explicitly selected. Transferred to the Slack spike: context available beyond the current thread, relevance criteria for unaddressed contributions, visible request acceptance, exact status/cancellation UI and multi-agent cancellation scope, and missed or uncertain delivery behavior. Agent-to-agent discussion is permitted subject to the shared six-message cap.

Slack supports bot users and an app-mention event for a message that results in inviting the app into a channel. Ambient participation also requires the appropriate channel-message subscriptions and permissions; mentions alone are insufficient. Use distinct bot users rather than requiring human Slack accounts for agents. This is documentation evidence, not a live workspace test.

- [Slack app mentions and mention-triggered invitations](https://docs.slack.dev/reference/events/app_mention/)
- [Slack message events](https://docs.slack.dev/reference/events/message/)
- [Slack private-channel message events](https://docs.slack.dev/reference/events/message.groups)

## Working indicator and cancellation evidence

Checked official documentation on 2026-10-23. Slack agent sessions provide a Working indicator and a native Stop button when the app subscribes to the stop event. Sessions in ordinary channels and DMs are thread-scoped. The app must handle the event, cancel its work, and update the status; clicking Stop is not itself a complete runtime cancellation implementation. Eligibility and behavior in the owner's free workspace have not been verified.

The earlier compact main-channel Working message with a custom Cancel button was a fallback proposal, not an accepted design. Following the switch to threads, evaluate native thread controls first. A custom in-thread Working message with a Cancel button remains a possible fallback if native features are unavailable. Cancellation should target the identified current response/run, persist across restart, and prevent subsequent work/output once observed; it does not undo completed effects.

- [Official agent session documentation](https://docs.slack.dev/ai/agent-sessions/)
- [Official status method and ordinary-channel thread requirement](https://docs.slack.dev/reference/methods/agents.sessions.setStatus/)
- [Official interactive button documentation](https://docs.slack.dev/reference/block-kit/block-elements/button-element/)

## Closure, 2026-10-25

Closed for current mapping at the owner's request. Remaining exploration is transferred to the [deferred spike](13-test-free-slack-agent-interactions.md), labelled `spike` and excluded from the current mapping frontier. Existing decisions and evidence remain valid; closure does not mean the deferred questions were answered or experiments passed.
