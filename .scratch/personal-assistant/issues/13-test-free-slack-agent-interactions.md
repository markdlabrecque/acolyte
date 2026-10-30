# Test agent interactions on Slack's free plan

ID: 13
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:prototype, spike
Type: prototype
Status: closed
Disposition: completed; all in-scope tests passed, including owner-confirmed recovered evidence
Assignee: none
Blocked by: none

## Mapping status

Completed and closed on 2026-10-27. The owner reports finding the remaining spike evidence and explicitly confirms all previously unrecorded in-scope tests passed. This supersedes earlier missing-evidence/open-status assessments. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md) records owner-confirmed passes separately from retained runner evidence. No further Slack spike tests or human observations are required.

Historical results below remain unchanged in substance. Missing artifact paths, exact version values, durations, and detailed observations are not invented. Previously excluded lock/suspend tests remain excluded. Production framework acceptance and unresolved product-policy choices remain specification/implementation work. No new live tests, cleanup, credential revocation, or permissions are implied by closure.

## Question

Can a genuinely free Slack workspace support the owner's selected agent interaction model, including native Working and Stop controls, without requiring a paid upgrade? If not, which requirements are unsupported, and should the owner accept a custom Slack interaction or investigate another connector?

## Scope and authorization

The owner requested this feasibility spike ticket on 2026-10-23 because public documentation does not conclusively establish the exact feature entitlement. Creating this ticket does not claim the spike has run or authorize installing apps, changing workspace settings, or sending test messages now. Plan execution with the owner when taking the ticket. No production server access, 1Password, or real email/calendar actions. Do not use a paid trial or a full-featured developer sandbox as evidence about the free plan.

This is disposable connector research, not framework implementation or the deferred Pi Durable recovery experiment. Use canned responses and a cancellable fake job; Pi Durable, real inference, and email/calendar credentials are unnecessary.

## Experiment

1. Confirm actual free-plan status and available app capacity. Record the selected Slack API/SDK versions and relevant app settings/scopes without storing secrets.
2. Use two distinct bot identities in an owner-curated channel. Start with an owner mention, continue in its thread, and show that the second invited agent can contribute to that same thread. Check mention and ordinary thread-message delivery without creating an uncontrolled bot exchange.
3. Show native Working state and the native Stop control for a fake job. Click Stop, record which agent/session receives the event, stop the fake job, and clear its status. Check what happens when both agents are working. Demonstrate real cancellation rather than merely hiding the indicator. Optionally exercise a short canned stream to establish native streaming availability.
4. Verify owner DMs for a test notification and a fake calendar proposal with Approve and Reject buttons. No real calendar mutation occurs. Record whether interactions arrive through the selected transport.

If a native feature is rejected or absent, distinguish a plan restriction from incorrect scopes, app configuration, unsupported client behavior, or rollout uncertainty. Record exact API errors privately with secrets redacted and capture concise screenshots where useful. A successful API response alone does not prove the intended UI appears.

## Result and decision

Report each required interaction as observed working, observed unavailable with cause, or unresolved. Include native versus custom implementation needs, multi-agent Stop semantics, setup requirements, and cleanup of disposable resources. Record free-plan status so a later reviewer can assess the evidence.

Do not silently substitute a custom Cancel message for the native controls under test. If native controls fail, explain the possible custom in-thread fallback separately. Present the findings to the owner to decide whether to retain Slack, accept a specific fallback, or compare new connector candidates. Do not choose or build another connector automatically.

## Documentation boundary

Slack's current help page says agents are available on all plans. Its developer guide says some AI features require a paid plan. The agent-session reference describes native Working/Stop behavior but does not explicitly establish free-plan entitlement for these exact controls. These sources support testing; they are not live verification.

- [Agent availability across plans](https://slack.com/help/articles/33076000248851-Work-with-AI-agents-in-Slack)
- [Developer guide and paid-feature caveat](https://docs.slack.dev/ai/developing-agents/)
- [Native agent session controls](https://docs.slack.dev/ai/agent-sessions/)
- [Session status and multiple agents](https://docs.slack.dev/reference/methods/agents.sessions.setStatus/)
- [Native streaming](https://docs.slack.dev/reference/methods/chat.startStream/)

## Dependencies

- [Verify Slack integration on a free workspace](03-verify-free-slack-integration.md)

## Evidence

The closing handoff records that all outstanding Slack spike checks passed. These results came from the earlier owner-assisted local run, not from new testing during this ticket update.

### Root cause and successful retests

A and B had identical app-level Socket Mode tokens, despite distinct bot tokens and app IDs. A local comparison confirmed the duplicate without printing token values. The owner replaced B's app token locally, and a subsequent comparison confirmed distinct app tokens. No event-handling code changed.

- [x] B Reject: the owner clicked a fresh B approval card. `approval_decided` recorded `choice: rejected` for B, confirming action delivery and successful card update.
- [x] B thread delivery: the owner mentioned B using Slack's mention picker in an existing test-channel thread. B logged `owner_message` and `thread_reply` in that same thread, and the owner confirmed receiving the response.
- [x] B native Stop: a B-only fake job entered `processing` without warnings. The owner's native Stop click produced `stop_received` on B's own socket, a return to `active` without warnings, and `job_stopped`. The handler clears the timer and removes the job before returning to active. No cross-bot fallback was needed.
- [x] Local runner shutdown: the spike process was stopped with SIGINT and termination verified. No fake job remained running; B was already active before shutdown.

The initial handoff was recovered and retained as [initial Slack evidence](../../../docs/evidence/slack-initial-handoff.md), alongside the [closing handoff](../../../docs/evidence/slack-closing-handoff.md). It records both bots replying and sending DMs, six replies from eight requested, A Approve, and stopping A leaving B processing during simultaneous jobs. That last observation predates the duplicate-token correction; clean post-fix multi-agent routing is not established. Selected raw B retest events are retained in [session and Slack excerpts](../../../docs/evidence/session-and-slack-excerpts.txt).

No source changes were made during the closing test session. Only the owner changed the credential file. Raw logs, credentials, and Slack account/channel identifiers are intentionally omitted.

### Historical evidence gaps, superseded by completion confirmation

The three B blockers are resolved. B's retest confirms native Stop delivery and actual fake-job cancellation for B alone; it does not establish simultaneous-agent cancellation scope. Preserve the deferred interaction questions below until the owner resolves them. The initial run's simultaneous-job observation is now retained with its configuration caveat. Explicit dated Free-plan/no-trial verification and API/SDK versions still need evidence. Token revocation, app removal, and disposable credential cleanup are not confirmed by the closing handoff. No connector fallback or product decision is implied by these passing checks.

## Deferred interaction questions transferred from planning

The owner moved the remaining questions from [Slack interaction planning](05-define-slack-interactions.md) and [authorization planning](08-define-authorization-and-reconciliation.md) into this spike on 2026-10-25. Those parents are closed for current mapping. Preserve their confirmed decisions.

- What context should agents use beyond the current thread, and what relevance criteria govern contributions by agents that were not addressed?
- How are request acceptance, working status, and cancellation presented using controls actually supported on the free plan? What is the cancellation scope when multiple agents are working?
- How should missed, duplicate, or uncertain Slack delivery be detected, retried, and presented to the owner? What delivery evidence supports treating a notification or approval request as delivered?
- If native interactions cannot satisfy the requirements, which fallback should the owner choose? Do not silently accept a custom UI, paid upgrade, or alternative connector.

Resolve product choices with the owner after gathering feasibility evidence. No experiments or setup are authorized by this transfer alone.
