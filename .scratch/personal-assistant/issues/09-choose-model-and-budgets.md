# Choose inference and operational budgets

ID: 09
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:grilling
Type: grilling
Status: resolved
Assignee: mark
Blocked by: none

## Question

Which external model/provider and finite call, step, time, queue, and spending limits fit personal use? Decide degraded-service behavior without silent model switching, transcript/action/deduplication retention, backup frequency and restore objectives, and diagnostic visibility. Record desired targets separately from any capability claims that need research. Credentials must remain outside configuration snapshots and ordinary logs.

## Answer

### Confirmed configurable defaults, 2026-10-25

The owner confirmed the budget limits and the previously proposed tool-call ceiling as initial defaults, with all limits easily configurable for later tuning. This resolves the budget decision. Earlier progress notes below record the discussion chronologically; their instructions to keep this ticket claimed are superseded by this resolution.

| Setting | Initial default |
| --- | --- |
| Monthly model-usage budget | US$10 per calendar month |
| Monthly spending warning | US$5 |
| Temporary model-failure retries | Two retries after the initial attempt |
| Interactive active-work budget | Five minutes |
| Interactive model-call budget | 20 calls |
| Per-request tool-call ceiling | 50 calls |
| Concurrent active requests | One per agent |
| Queued requests | 20 per agent |

- Make these limits named, documented settings that the owner can change without editing application code. Show the effective values and validate configuration values and relationships. Use the existing configuration/run-boundary rules when applying changes.
- Retain explicit owner authorization for larger finite budgets on long-running work. Exclude time waiting for owner approval or an external coding job from active-work time. Stop at the first applicable limit, save progress, and ask before continuing.
- Keep scheduled reminders running during a model-spending pause. Configuration flexibility does not authorize the assistant to raise its own limits, continue automatically, bypass permissions, or switch providers.
- The previously confirmed retention, backup, recovery, status, queueing, and fallback policies remain in force. Their tunable operational values should likewise be documented configuration rather than hard-coded constants.
- Exact connection/inactivity thresholds, retry-delay values, and safe cleanup rules for action records were not assigned numeric defaults in this exchange. Their technical design belongs in [Linux operational and storage design](10-choose-operational-and-storage-design.md), with configurable thresholds and explicit protection for unfinished work and duplicate-action prevention. The rejected blanket two-minute response cutoff remains rejected.
- DeepSeek V4 Flash through DeepInfra remains the V1 selection. [Claude subscription compatibility research](16-verify-pi-subscription-fallback.md) remains a separate open ticket, not a blocker to this budget decision.

These are planning requirements, not implemented controls.

## Confirmed preferences, 2026-10-25

- Prefer a hosted open-weight model from a reliable provider, with effective prompt caching and low total cost for personal email, calendar, todo, and reminder work.
- User-supplied candidates are DeepSeek V4 Flash and Qwen 3.8. Verify exact names and availability; do not silently substitute other models.
- The owner's Claude subscription through a Pi subscription extension is the fallback preference, subject to identifying the extension and verifying compatibility and documented subscription support.
- The monthly model-usage budget is now confirmed below. Automatic provider or model switching is not authorized.
- Research is authorized now. No purchases, credentials, production access, installations, or live schedules.

## Research dependencies for the inference decision

- [Verify DeepSeek V4 Flash hosting and caching](14-verify-deepseek-hosting.md)
- [Verify Qwen 3.8 identity and hosting](15-verify-qwen-hosting.md)
- [Verify Pi Claude subscription fallback](16-verify-pi-subscription-fallback.md)

Operational budget and retention discussion can continue independently. This ticket remains claimed until the owner settles its decisions.

## Research progress, 2026-10-25

[Inference comparison and monthly examples](../research/inference-cost-comparison.md) combines the provider evidence with explicit usage assumptions. It recommends DeepInfra's versioned V4 Flash 0731 as the first candidate for later implementation evaluation and QwenCloud Flash as a comparison candidate. No owner selection is implied.

The illustrative no-cache inference costs are USD $1.23–$2.57/month for DeepInfra and $3.09–$6.48/month for QwenCloud's published reference quote. These are two usage examples, not forecast bounds or a budget. They assume individual classification of 60 new emails daily, three daily digests, and either 10 owner requests with two model calls each or 30 with three. The linked note includes token assumptions, cache sensitivity, pricing caveats, and excluded operating costs. Unchanged connector checks and deterministic reminder delivery need not invoke a model.

The initial V1 provider/model is now selected below. Reasoning settings, acceptable quality and latency, finite execution limits, retention, backups, restore targets, and diagnostic visibility remain unresolved. This ticket stays claimed.

### Claude fallback evidence

[Subscription fallback research](../research/pi-subscription-fallback.md) identified a candidate coding-agent bridge and current official subscription support through Claude Code/Agent SDK. It did not establish a drop-in Pi Durable integration or identify the owner's intended extension. Subscription quotas, paid usage credits, and eligible Max-plan API credits are distinct; the owner's tier is unknown. The fallback research remains claimed. No automatic switching or additional billing was approved.

## Confirmed V1 selection and provider flexibility, 2026-10-25

The owner selected DeepSeek V4 Flash through DeepInfra as the V1 starting point and wants to evaluate its performance before changing models or providers. The selected researched endpoint is `deepseek-ai/DeepSeek-V4-Flash-0731`; V4.1 Flash is a distinct candidate and is not silently substituted. This is an initial model/provider decision, not a claim of tested suitability.

The owner also required direct, replaceable provider adapters with custom-provider support and configurable model/provider selection as capability and cost change. OpenRouter is excluded because the owner wants to avoid its perceived additional overhead. Keep provider differences explicit and keep speech integration and document workflows independent of the inference provider. Begin with one provider implementation; automatic switching remains unauthorized.

These requirements are incorporated in the [PRD](../../../pi-durable-personal-agent-prd.md#confirmed-inference-requirements-2026-10-25). The Claude subscription fallback remains a preference pending compatibility verification; the owner-confirmed activation rule is recorded below. The monthly model-usage budget and threshold behavior are now confirmed below. Finite execution limits, retention, backups, restore targets, and diagnostic visibility remain unresolved. Keep this ticket claimed.

## Confirmed model-usage spending limit, 2026-10-25

The owner approved the proposed spending policy in the live voice discussion:

- Budget US$10 per calendar month for model usage.
- Warn the owner when monthly model usage reaches US$5.
- Pause new model calls when monthly model usage reaches US$10.
- Already scheduled reminders continue while model calls are paused.
- The owner may explicitly raise the limit; do not raise it or switch providers automatically to bypass the pause.

These are planning requirements. No account funding, model calls, or live billing controls were enabled. Execution limits, fallback compatibility, retention, backups, restore targets, and diagnostic visibility remain open; keep this ticket claimed.

## Confirmed fallback behavior and budget scope, 2026-10-25

The owner approved brief retries followed by an explicit choice between waiting and switching when a provider outage, repeated timeouts, or rate limits prevent work from continuing. Explain the blocked work and obtain the owner's permission before changing provider or model, including a Claude subscription fallback. A difficult task does not trigger automatic escalation to another model. Reaching the monthly spending limit pauses model calls; fallback must not bypass it.

The retry count and per-request active-work limit are now confirmed below; detailed timeout and retry-delay behavior remains to be specified. Claude subscription compatibility remains unverified. This records the fallback policy, not authorization to activate another provider now.

The owner also retained the US$10 monthly starting budget after discussing supervision of external coding harnesses, with the option to change it later. The assistant's supervisory model usage counts toward its budget; external coding harnesses' own model spending does not. Whether supervision only observes and reports or also controls those harnesses remains unresolved.

Keep this ticket claimed for the remaining execution-limit, retention, backup, restore, and diagnostic decisions.

## Confirmed execution limits, 2026-10-25

The owner approved these V1 execution limits in the live voice discussion:

- Allow up to two retries for temporary model API failures.
- Limit each request to five minutes of active work or 20 model calls, whichever comes first.
- Exclude time waiting for owner approval or an external coding job from the active-work limit.
- When a limit is reached, save progress, explain what remains, and ask the owner whether to continue.

This confirmation does not authorize automatic continuation or provider switching. The existing monthly spending policy still applies. Detailed model-request timeouts, retry delays, tool-step and queue limits, retention, backups, restore targets, diagnostic visibility, and fallback compatibility remain unresolved. Keep this ticket claimed. These are planning requirements, not implemented controls.

## Confirmed history retention, 2026-10-25

The owner approved the proposed retention policy in the live voice discussion:

- Keep conversations, recorded decisions, and document revisions until the owner explicitly deletes them.
- Keep routine diagnostic logs for 30 days.
- Retrieve relevant historical records when needed instead of including all prior conversations in every model request.
- Keep durable records needed for unfinished work or preventing duplicate actions separate from routine diagnostic logs. Their safe cleanup rules still need definition.

This supports revisiting earlier PRD decisions and supervision history. It establishes retention and selective access to records, not an autonomous long-term memory or learning subsystem. Backup/restore requirements, detailed action/deduplication cleanup, diagnostic visibility, remaining execution details, and fallback compatibility remain open. Keep this ticket claimed. No live storage or deletion controls were changed.

## Confirmed backup and recovery objectives, 2026-10-25

The owner approved these V1 backup and recovery requirements in the live voice discussion:

- Create an automatic encrypted backup daily on another machine or storage service.
- Retain 30 daily backups.
- Target at most 24 hours of recent data loss after host or disk failure.
- Target restoration within one day once a replacement host is available.

These are desired recovery objectives, not measured guarantees. The storage-design decision must specify a backup destination, recoverable encryption keys, backup consistency and failure handling, and a restore procedure. Verify recovery during implementation. This approval does not select or purchase a storage service or enable live backups.

Detailed action/deduplication cleanup, diagnostic visibility, remaining execution details, and fallback compatibility remain open. Keep this ticket claimed.

## Confirmed operational visibility, 2026-10-25

The owner approved these V1 operational visibility requirements in the live voice discussion:

- Offer an on-demand status summary with current work, anything awaiting the owner, monthly model spend, and the last successful backup.
- Notify the owner when work fails after retries, needs an owner decision, or a backup fails.
- Keep successful routine checks quiet.

This governs operational status notifications. Existing reminders, email/calendar digests, urgent alerts, and spending warnings retain their agreed behavior. The status interface and delivery mechanism still need to fit the selected messaging integration.

Detailed action/deduplication cleanup, remaining execution details, and fallback compatibility remain open. Keep this ticket claimed. These requirements do not enable live alerts or monitoring.

## Confirmed queueing behavior, 2026-10-25

The owner approved these V1 queueing rules in the live voice discussion:

- Allow one actively executing request per agent and up to 20 queued requests.
- If the queue is full, explicitly tell the owner that the new request was not accepted.
- Combine repeated background checks for the same source into one pending check instead of building a backlog. Distinct owner requests and scheduled reminders are not duplicates to discard.
- Work waiting for owner input or an external coding harness releases the active execution slot so the owner can keep talking to the assistant. Preserve its durable waiting state for later continuation.

These are owner-visible requirements. The operational design still needs to define safe suspension, resumption, and queue accounting around waiting work while preserving the single active execution rule. Detailed action/deduplication cleanup, remaining execution details, and fallback compatibility remain open. Keep this ticket claimed. No runtime queue or concurrency behavior was changed.

## Revised interactive and long-running execution limits, 2026-10-25

The owner confirmed a revision after explaining that extended research and supervision requests may need longer execution:

- Keep five minutes of active work as the default for interactive requests. The previously agreed 20-model-call limit remains the default call budget.
- Let the owner explicitly authorize a larger finite time and call budget for long-running work before execution, without repeated five-minute approvals.
- Distinguish a stalled model connection from a response that is still progressing. The proposed two-minute blanket response timeout was not accepted and is not a requirement. Exact connection and inactivity thresholds remain to be designed.
- Continue excluding waits for owner approval or external coding jobs from active work. At the authorized budget limit, save progress and ask before continuing.
- Longer execution authorization does not itself raise the monthly spending cap, expand action permissions, or authorize provider switching.

This supersedes the earlier universal five-minute per-request limit. The separately proposed 50-tool-call ceiling has not been unambiguously confirmed and remains a proposal. Keep this ticket claimed for the remaining decisions. These are planning requirements, not changes to a running service.
