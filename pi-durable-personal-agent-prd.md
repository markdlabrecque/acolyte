# Cairn

Personal agent framework based on Pi Durable.

Product requirements document, version 0.6\
Date: 2026-10-27  
Status: Reconciled with recorded owner decisions and completed integration spikes. Implementation specification and sign-off remain pending. No framework implementation is claimed.

## Integration spike completion, 2026-10-27

Slack, Google, and Proton integration spikes are complete and closed, with all in-scope tests passed. The owner reports finding the remaining evidence and explicitly confirms all previously unrecorded tests passed. No spike evidence collection, retests, or human observations remain. The [completion ledger](docs/evidence/integration-spike-ledger.md) is the authoritative disposition record and distinguishes retained runner output from owner-confirmed recovered evidence. Raw historical records remain unchanged; exact artifact paths, versions, durations, and observations not supplied are not fabricated.

## Proton desktop-login startup observation, 2026-10-27

After an owner-performed reboot without manually restarting Bridge, fixture reads and all three existing draft reconciliations passed. [Retained evidence](docs/evidence/proton-post-reboot-2026-10-27.md). Remaining in-scope startup/keyring and longevity checks are now passed by the owner's recovered-evidence confirmation. Lock/unlock and suspend/resume remain explicitly excluded.

## Evidence update, 2026-10-27

[Retained live checks](docs/evidence/live-checks-2026-10-27.md) establish same-personal-account Google refresh/identity verification, fixture reads, draft creation, exact-approved Calendar creation, and fresh-process reconciliation. The owner confirmed the draft visible/editable/unsent and the Calendar event visible. Proton fixture reads and all three saved drafts also reverified. All remaining in-scope spike tests, including recovery and unattended-operation checks, are owner-confirmed passed. Production credential isolation, durable runtime behavior, and M0–M4 acceptance must still be implemented and verified; spike completion is not framework acceptance.

## Confirmed scope, 2026-10-23

The owner confirmed these requirements during Wayfinder planning. They supersede conflicting proposals below. The [decision map](.scratch/personal-assistant/map.md) tracks specification work. The 2026-10-25 transfer of integration exploration into separate spike tickets is historical. All three spikes are now complete with passing results, including owner-confirmed recovered evidence. Their planning parents remain closed. See [remaining work](docs/remaining-work.md) for specification and implementation tasks, not further spike evidence collection.

- Plan an implementation-ready specification for M0 through M4. Assess documented dependency contracts and settle product and operational decisions before implementation; building the framework is outside this planning effort. Treat documented Pi Durable recovery as a working assumption. Defer recovery test setup until the first working implementation, after workflows, Slack interactions, reminders, permissions, and operational design are settled.
- Start with one personal assistant exposed as one Slack bot. Keep tools and permissions separate for todos, reminders, calendar, and email. Retain configurable multiple-agent support and the two-agent isolation acceptance test; each additional agent must have its own Slack bot identity.
- Required jobs are maintaining a todo list, setting reminders, watching and managing the calendar, notifying the owner of important emails, retrieving information from email, and creating email drafts for the owner to review and send manually.
- Use the owner's existing free Slack workspace as the selected messaging channel. The completed interaction spike establishes the required Free-plan feasibility, including native Working/Stop controls. No paid upgrade, custom-control fallback, or connector comparison is required by the findings. Any future connector change requires an owner decision. HTTP and CLI may support internal transport and administration, but are not a replacement messaging experience.
- Send agent notifications to the owner by DM; use Slack channels for conversational interactions. Each configured agent has its own mentionable bot identity. The owner manually curates channel membership. A conversation usually addresses one agent first, while other channel-member agents may contribute relevant important information without being directly mentioned. Start conversations by mentioning an agent in the channel, then continue in a thread under that message. Other invited channel-member agents may participate in that same thread. Use the thread as the default conversation boundary; this supersedes the earlier main-channel conversation preference. The owner is the only human in the workspace and the sole human command and approval authority. Agents cannot approve actions. Calendar changes require a DM showing the exact proposed change with Approve and Reject buttons. Calendar approval requests have no time-based expiry and remain pending until approved, rejected, cancelled, or superseded. Before execution, revalidate the target event and proposal preconditions; changed or inapplicable proposals require explanation and fresh approval for any revised action. Context available beyond the current thread and contribution relevance remain planning decisions.
- Durable reminders and background calendar/email checks are in scope and must survive restart. Use the settled Vancouver-time recurrence, catch-up, digest, quiet-hour, and delivery-target rules under [Personal assistant workflows](#personal-assistant-workflows). No reminder timing decisions remain open within the selected personal-use scope.
- Show when an agent begins preparing a Slack response and provide native Working/Stop controls in the selected conversation threads. The completed Free-plan spike confirms feasibility. Do not substitute a custom fallback without an owner decision. Feasibility includes multi-agent routing; the desired product cancellation scope remains a specification choice, not another spike test.
- Agents may respond to each other in curated Slack channels. Limit conversational output to six combined agent messages per conversation thread between owner messages, shared across participating agents. The opening owner message supplies the initial budget, and an owner reply in that thread resets it; unrelated channel messages, other threads, agent messages, timers, and DMs do not. After six replies, wait for the owner. Notifications remain separate DMs, and agents should only contribute useful information even when budget remains.
- Within configured permissions, reads, searches, local task updates, and reminders do not require per-action approval. Creating, changing, or cancelling calendar events require approval initially. Email reading/search and draft creation are separate permitted capabilities; email sending is prohibited, including behind an approval step. Draft editing/deletion and other mailbox mutations are not implicitly granted.
- The owner confirmed a narrow calendar approval exception and rules for uncertain saves, cancellation, and retries on 2026-10-25. Automatic cleanup may remove only a proven duplicate created by the assistant from the same approved action. The [authorization and reconciliation ticket](.scratch/personal-assistant/issues/08-define-authorization-and-reconciliation.md#answer) records the authoritative rules, including a maximum of two retries after the initial attempt for these operations and checks. Uncertain writes still require reconciliation and an owner decision before retrying.
- Enforce the email boundary in a trusted adapter that owns credentials and exposes only permitted operations. Gmail's draft-capable OAuth permission also allows sending, so provider scopes alone cannot enforce this policy. For Proton Mail Bridge, use IMAP for reading and saving drafts and deny the agent and its mail adapter access to SMTP. The agent must not have raw credentials or a generic execution/network path that bypasses these controls. The disposable Bridge runner has live read/draft/recovery evidence, but production credential isolation and OS-level SMTP denial have not been verified.
- Google Calendar and Gmail use the owner's same personal Google account. Work email and work calendars are outside scope. The [Google spike](.scratch/personal-assistant/issues/17-spike-google-integration-and-reconciliation.md) is complete with read/search, unsent drafts, approved Calendar creation, reconciliation, and owner UI evidence, supplemented by owner-confirmed passes for the remaining in-scope checks. Same-host Proton Bridge is required; the [Proton spike](.scratch/personal-assistant/issues/18-spike-proton-bridge-and-reconciliation.md) is complete with read/draft/recovery/reboot evidence and owner-confirmed remaining startup/monitoring/reconciliation passes. No further spike evidence gates remain. The [ledger](docs/evidence/integration-spike-ledger.md) records provenance and exclusions.
- Todos and reminders use a simple built-in system within the agent, backed by durable local storage. No external todo service is required.
- If Pi Durable cannot support the recovery requirements without substantial extra machinery, stop for an explicit dependency decision rather than silently building around it.
- Settle limits, retention, backups, credential handling, approval, and reconciliation before implementation. Linux-first, personal use, no long-term memory, and no Cloudflare deployment remain fixed.

## Confirmed inference requirements, 2026-10-25

The resolved [inference and operational-budget ticket](.scratch/personal-assistant/issues/09-choose-model-and-budgets.md#answer), [operational design](.scratch/personal-assistant/issues/10-choose-operational-and-storage-design.md#answer), and [fallback confirmation](.scratch/personal-assistant/issues/16-verify-pi-subscription-fallback.md#answer) supply the current decisions. Earlier proposals do not reopen them.

- Start V1 with DeepSeek V4 Flash through DeepInfra at `deepseek-ai/DeepSeek-V4-Flash-0731`. V4.1 Flash is a different model and must not be silently substituted. Evaluate quality on real workloads during implementation; selection is not a measured reliability claim.
- Use direct, replaceable provider adapters. OpenRouter is excluded. Support configured providers, endpoints, models, and custom adapters without rewriting workflows. Keep request formats, streaming, tool-call handling, usage reporting, reasoning options, and cache behavior inside adapters. Start with one provider implementation and expose capability differences rather than assuming compatibility. Apply ordinary changes at run boundaries and retain provider/model identity with accepted work.
- Keep speech integration and document-editing workflows independent of the inference provider. This does not define a voice interface, document-editing permissions, or external coding-harness control.
- All agents share US$10 per calendar month for model usage, with an owner warning at US$5 and a pause on new model calls at US$10. Scheduled reminders continue without model calls. Only the owner may raise the limit; fallback never bypasses the pause. Supervisory inference counts toward this allowance; external coding harnesses' own charges are separate.
- For temporary model failures, allow two retries after the initial attempt, with configurable delays of approximately 5 and 20 seconds. Honor provider retry instructions within remaining budgets. If failures persist, explain the blockage and ask whether to wait or switch. Difficulty is not a trigger for escalation.
- The owner's authored and thoroughly tested `pi-claude-subscription` is the confirmed working Claude fallback. No further compatibility research is required. Switching still needs explicit owner permission and must respect spending limits; fallback is not automatically activated.
- Default to five minutes of active work, 20 model calls, and 50 tool calls per request. Stop at the first applicable limit, save progress, explain what remains, and ask before continuing. The owner may authorize larger finite time/call budgets before long-running work; that does not expand action permissions or monthly spending.
- Exclude waiting for owner input or an external coding job from active-work time. Waiting work retains its durable identity and counters but releases the active execution slot; continuation reacquires the slot without resetting limits.
- Allow one actively executing request and 20 queued requests per agent. Reject excess work explicitly rather than retaining it for later. Coalesce repeated background checks for the same source, but never merge distinct owner requests or reminder occurrences.
- Initial model timeouts are 30 seconds to establish a connection and 90 seconds without meaningful response progress. Keepalives alone are not progress. There is no blanket two-minute total-response cutoff; progressing responses remain subject to the authorized overall work budget.
- Persist consumed active time, model/tool-call counts, queue state, attempt counts, retry deadlines, and spending reservations across restart. Atomically reserve estimated cost in the shared host ledger before dispatch; reconcile actual usage and conservatively retain uncertain charges. Unknown pricing or insufficient reservation capacity blocks a call. Accounting cannot guarantee provider-side billing behavior.
- Keep all these values named, documented, validated, and tunable without code edits. Show effective values and retain configuration/run-boundary and current-permission checks. Configuration flexibility does not authorize automatic continuation, provider changes, spending increases, or weaker approvals.
- Provide on-demand status showing current work, owner waits, monthly spending, and local/off-host backup freshness. Notify the owner on exhausted failures, required decisions, or backup failure. Routine successful checks stay quiet. Workflow digests, urgent alerts, reminders, spending warnings, and explicit upgrade outcomes retain their own delivery rules.

## Confirmed operational design, 2026-10-25

The resolved [Linux operational and storage design](.scratch/personal-assistant/issues/10-choose-operational-and-storage-design.md#answer) is authoritative. These are requirements for the eventual framework, not passing production recovery tests.

- Run one gateway and one systemd service per agent on Omarchy. Bridge remains separate on the same host. Use per-agent SQLite with effective `synchronous=FULL`, durable acknowledgements, and exclusive canonical-store ownership. Store large documents, attachments, and audio as referenced files; any future search index is rebuildable.
- Keep credentials in protected host-managed files available only to the service needing them. Trusted adapters expose permitted operations; secrets do not enter agent configuration snapshots, transcripts, logs, or model context.
- Retain conversations, recorded decisions, and document revisions until explicit owner deletion. Keep routine diagnostics for 30 days. Retain compact action IDs, outcomes, and deduplication keys indefinitely for V1, protecting unfinished work and duplicate prevention. Retrieve history selectively rather than loading it wholesale. Explicit deletion must account for duplicate-prevention implications.
- Create a consistent encrypted backup set daily at 03:00 America/Vancouver, independently of model inference or spending. Include agent/runtime state, the shared spending ledger, referenced files, configuration, recovery credentials, and a version/integrity manifest. Recovery credentials belong only inside encrypted backup material, not ordinary configuration snapshots.
- Transfer over Tailscale to the owner's MacBook and verify complete transfer before recording delivery. Retry hourly while unavailable. Persist pending transfers and transfer every actual missing snapshot when the MacBook returns. After host downtime create a current catch-up snapshot, not invented historical snapshots.
- Keep 30 delivered daily backups plus every untransferred daily snapshot regardless of age. Alert on disk pressure or failure instead of deleting pending backups. Avoid overlapping jobs. Expose local snapshot freshness, verified off-host freshness, outstanding transfers, and oldest pending date separately.
- Omarchy holds only the public backup encryption key. Keep the private decryption key on the MacBook plus an owner-managed recovery copy in 1Password. No agent access to 1Password is authorized. Restrict transfer credentials to the backup destination.
- Target at most 24 hours of data loss and restoration within one day after a replacement host is available. MacBook downtime can extend off-host recovery-point age beyond 24 hours; display that limitation rather than claiming the schedule guarantees the objective.
- Restore only after stopping or isolating the prior owner. Verify the manifest, schemas, integrity, files, and credential permissions, then start with external writes disabled. Reconcile post-snapshot remote effects and spending conservatively; uncertain effects need owner decisions. Require owner confirmation before normal writes resume.
- Every particular upgrade needs explicit owner approval. The default eligible window is 00:00–08:00 America/Vancouver. An explicit daytime request may override that window for that upgrade only. Absent approval or preconditions, defer rather than automatically catching up during daytime.
- Drain active work and preserve queued/waiting work before upgrading. Make a pre-upgrade backup, check compatibility, apply the approved update/migrations, and verify startup/recovery. Stop on failure; never start an older binary against a potentially incompatible migrated store.
- Persist every upgrade outcome and its explanation. Deliver explicit success/failure notification after quiet hours end at 08:00, or when delivery next becomes available. Never notify overnight, even on failure. Explicitly requested daytime-upgrade outcomes may be reported immediately outside quiet hours.

## Project name

The owner selected **Cairn** as the project and product name. Use Cairn in current documentation and product-facing descriptions. Pi Durable is the runtime dependency, not the product name. Existing repository paths, technical identifiers, and historical evidence retain their names unless separately migrated. This naming decision does not change scope, implementation authorization, or acceptance status.

## Purpose

Build Cairn as a small, self-hosted framework for personal agents based on Pi Durable. The owner defines each agent's instructions, permitted tools and skills, model, and messaging routes in configuration. Agents receive messages through a gateway, call externally hosted language models, and retain enough durable state to recover safely after interruption.

The first deployment runs on one Linux host under systemd. Keep platform dependencies behind narrow interfaces so a later project can evaluate Cloudflare Durable Objects without rewriting the agent's application logic.

Success means the owner can configure two distinct agents, send each a message, inspect their work, and restart the service without losing acknowledged inputs or blindly repeating external actions.

## Basis and delivery correction

This document follows the current request and the retrievable portion of [Designing PyDurable Agents](chatgpt-conversation://6adb7d5e-73e0-83e8-9cd1-2ac130c9e387). The conversation retrieval exposed five later turns and no attachments. It confirms Linux/systemd, configurable prompts and tools, durable recovery, portability, and a document intended for later planning through Wayfinder. Earlier discussion was not available in the retrieved record.

The earlier assistant incorrectly said a Markdown PRD was attached. This file is the actual deliverable. It does not rely on a previously created document.

The current request identifies the dependency as Pi Durable. The conversation title does not establish a requirement to use Python or a separate product named PyDurable. Recorded owner decisions and the completed spike ledger govern this revision. Only items explicitly labelled technical proposals remain proposals; older narrative must not override settled decisions.

## Decisions and remaining technical proposals

Unmarked rows record settled choices. The agent-file format and exact language/runtime release remain technical proposals pending dependency checks; they are not new owner decisions.

| Area | Requirement or decision | Selected approach or explicit proposal |
| --- | --- | --- |
| Ownership | Personal use by one trusted owner | No multi-tenant accounts or billing |
| Agent definition | Per-agent prompts, tool and skill permissions, messaging routes | Technical proposal: one versioned YAML file per agent |
| Identity | One logical instance per stable agent ID | One systemd service and durable store per agent |
| Execution | Pi Durable with persistent execution state | Technical proposal: TypeScript on supported Node.js; exact versions pinned after compatibility checks |
| Deployment | Linux and systemd first | One gateway service plus an agent service template |
| Storage | Per-agent durable state and shared host spending ledger | Local SQLite with FULL durability plus referenced files; migration requires an explicit decision and verification |
| Messaging | A gateway between channels and named agents | Slack bot in the existing free workspace; CLI for administration |
| Inference | Direct, replaceable provider adapters; no OpenRouter | V1: DeepInfra `deepseek-ai/DeepSeek-V4-Flash-0731` |
| Portability | Interfaces suitable for future Cloudflare work | Document the mapping and gaps; no Cloudflare deployment in the MVP |
| Memory | Long-term memory deferred | Persist transcripts and execution state needed for current conversations and recovery |

Slack is the selected starting channel. The completed Free-plan interaction spike supports retaining it; no connector reopening is required. Document free-workspace constraints, bot identity, ingress, and delivery contracts during wayfinding; verify runtime delivery behavior during implementation.

## Dependency evidence and verification boundary

Checked against primary documentation on 2026-10-23. These are documentation checks, not results from running the dependency.

- Pi Durable identifies itself as experimental. Its README documents committed conversation and task state, SQLite persistence, reopening and resuming work, submission deduplication by request ID, and per-conversation agent settings including instructions and tool selection. It uses Pi AI for model access. [Pi Durable README](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md)
- Cloudflare documents a beta `PiHarness` integration with Durable Object SQLite storage and lifecycle wakeups. That is upstream functionality, not support implemented in this proposed framework. [Cloudflare Pi integration](https://developers.cloudflare.com/agents/harnesses/pi/)

Everything below is a requirement for this framework or a proposed design. Do not assume Pi Durable supplies gateway authentication, host ownership locks, skill authorization, approval persistence, external-action deduplication, or the operational commands described here.

M0 records package pins, documented contracts, design decisions, and explicit untested assumptions. M1 verifies the chosen runtime and persistent storage through normal service restart and Linux reboot/resume; M3 and M4 verify action safety and operational recovery. Recovery test setup is not a prerequisite to completing planning. Documentation on a moving main branch is not a release contract or passing runtime evidence.

## User journeys

1. The owner creates an agent configuration, supplies its prompt and selected skills, validates it, and starts its service. Invalid configuration fails before accepting work.
2. The owner sends a message to a named agent. The gateway returns a durable receipt. The owner can disconnect and later retrieve the answer using that receipt.
3. An agent uses an allowed tool. If the action requires approval, the owner sees the exact intended action and approves or rejects it. A restart preserves the pending decision.
4. The host or process stops during work. After restart, the agent recovers its identity and work, retries only operations known to be safe, and exposes uncertain external outcomes for reconciliation.
5. The owner changes an agent's configuration. New work uses the new revision; already accepted work remains attributable to its recorded revision and cannot bypass newly revoked permissions.

## Functional requirements

### Agent configuration and identity

Each agent must have a unique, stable ID separate from its display name. Renaming the display name must preserve its state and message routing. Deleting or changing an ID must never silently attach it to another agent's data.

Configuration must include:

- Schema version, agent ID, display name, enabled state, and configuration revision.
- System prompt text or a local prompt-file reference.
- Provider and model identifiers, plus a credential reference resolved by the host.
- Explicit allowlists for tools, skills, incoming routes, and any permitted outbound destinations.
- Tool-specific resource scopes, such as permitted directories or remote destinations.
- Execution limits, including request timeout, retry policy, queue capacity, and maximum model/tool steps.

Unknown fields, unresolved references, duplicate IDs, unknown tools or skills, and invalid limits must fail validation. Validate every agent before starting a new configuration set. A failed update must preserve the last working revision.

Store the effective prompt, selected skill versions or hashes, model settings, and configuration digest with accepted work. Configuration activation occurs at a run boundary in the MVP. Hot reload during a running turn is unnecessary.

### Tools and skills

A tool is executable code with an input schema, permission requirements, resource scope, timeout, and declared retry behavior. A skill is a local instruction bundle that may refer to tools. Installing or loading a skill must not grant permissions by itself.

Only selected skills enter an agent's context. Required tools must be available and permitted before a skill can run. Validate tool calls and enforce permissions at the execution boundary, even if the model requests a hidden or disallowed tool.

Use deny-by-default permissions. During recovery, permissions must satisfy both the run's recorded policy and the current policy. A revocation takes effect before the next tool invocation; it cannot undo an action already sent to an external system.

The first thin implementation path may use a harmless read-only tool and a controlled test action to prove approval/recovery. They are fixtures, not substitutes for the required todo, reminder, Calendar, Gmail, and Proton workflows. General shell execution is disabled by default. Any later shell tool requires an explicit scope and a documented isolation model.

### Messaging gateway

The gateway authenticates the sender, authorizes the route, normalizes the message, and delivers it to the configured agent. It must not choose a different agent silently when a destination is unavailable.

The normalized message contains a schema version, source/channel identifier, source message ID, authenticated sender ID, agent ID, conversation ID, timestamp, payload, and correlation ID. A reply route must be validated against configured destinations rather than accepted as an arbitrary URL supplied in the payload.

Requirements:

- Persist an input in the target agent's inbox before acknowledging acceptance. If storage or the agent service is unavailable, return a retryable failure instead of a false receipt.
- Deduplicate by source, source message ID, and destination agent. Repeated identical input returns the original receipt. Reuse of the same key with a different payload returns a conflict.
- Give each conversation a durable admission sequence. Allow one active request per agent and 20 queued requests by default. Waiting work releases the active slot while retaining its continuation and counters; resumption reacquires the slot. Separate agents may run concurrently.
- Enforce configured sender/agent rate limits and payload limits. Explicitly reject queue-full inputs without retaining them for later execution. Coalesce repeated background checks by source, not distinct owner requests or reminders.
- Expose accepted, queued, running, waiting for approval or external work, needs reconciliation, completed, failed, and cancelled status through the receipt.
- Persist replies before delivery. Internal HTTP/CLI clients retrieve a stable response by receipt; Slack is the owner-facing messaging channel, not a later optional adapter. Delivery retries must not create new runs.
- Send Slack replies, notifications, and approval requests through a durable outbox with stable delivery IDs and adapter-specific retry/reconciliation rules. Production delivery uncertainty must remain visible. Detailed owner-facing handling remains a specification decision.

The gateway is an adapter and routing service, not another LLM agent. Multiple agents may participate and respond to each other in owner-curated Slack channel conversations under the shared six-message cap. Dynamic task delegation and a separate agent-to-agent messaging transport are outside the MVP.

### Personal assistant workflows

These requirements come from the resolved [workflow](.scratch/personal-assistant/issues/06-define-workflow-behavior.md#answer), [scheduling](.scratch/personal-assistant/issues/07-define-durable-schedules.md#answer), and [authorization](.scratch/personal-assistant/issues/08-define-authorization-and-reconciliation.md#answer) decisions.

- A built-in durable todo has a title, optional notes, optional due date, and open/completed status. Completion preserves history. A due date does not itself notify; reminders must be explicitly requested.
- Watch selected calendars for new invitations, changed/cancelled events, and scheduling conflicts. Support creating, rescheduling, and cancelling events, with owner approval of the exact proposal. Calendar approval requests remain pending without time expiry until approved, rejected, cancelled, or superseded. Revalidate target state and preconditions before execution; changed proposals require fresh approval.
- After Calendar saves, check for duplicates. Automatically remove only a duplicate proven to have been created by the assistant from that same approved action. Similar content is insufficient. Otherwise leave events untouched and ask. A completed change needs approval to undo, even if the original request is later cancelled.
- Search/read personal Gmail and Proton folders except spam and trash, including relevant bodies when answering. Exclude work accounts and unselected calendars. Identify actionable messages, deadlines, and explicitly prioritized senders for notification, without changing mailbox flags/labels.
- Create drafts only on the owner's request, without a second per-draft approval. The owner reviews and sends manually. Sending is prohibited even behind an approval step; editing/deletion and other mailbox mutations remain ungranted. Trusted adapters enforce this despite Gmail's broader scope and Bridge's SMTP capability.
- If a Calendar or draft save remains uncertain after outcome checks, pause and inform the owner rather than retry blindly. A provider-confirmed no-write result permits retry of the exact approved Calendar change only while preconditions remain unchanged. The relevant operations and checks allow at most two retries after the initial attempt; the cap is not permission to replay uncertain writes. No automatic draft cleanup exception exists.
- If cancellation arrives during dispatch, check and report completed, failed, or uncertain outcome. Do not claim an in-flight action was stopped without evidence or automatically undo a completed Calendar change.
- Use America/Vancouver with current timezone data reflecting the approved year-round UTC-07:00 rule. Recurring reminders retain Vancouver local clock time and must not shift in November 2026. Alternate/travel timezones and seasonal transition edge cases are outside scope.
- Target reminder delivery within one minute while healthy. Explicit reminders arrive at their requested times even during quiet hours. Cancellation/rescheduling takes effect immediately. For recurring reminders, an explicit "this one" affects only that occurrence; clarify ambiguous scope or any ambiguity changing an action's target, time, or meaning.
- Batch background findings into daily digests at 09:00, 12:00, and 15:00 Vancouver time. Target email/Calendar checks every five minutes subject to provider limits. Alert immediately for Calendar changes affecting the next hour or email deadlines before the next digest, except during quiet hours from 21:00 to 08:00.
- At 08:00 reassess alerts held overnight. Send still-urgent findings and put the rest in the 09:00 digest. After downtime, combine overdue reminders into one catch-up notification showing original due times, summarize missed recurring occurrences once, and resume the normal schedule. Run one fresh email/Calendar check and one catch-up digest rather than replaying missed digests; quiet-hour rules still apply.
- Persist reminder deadlines, background-check schedules, delivery state, and cancellation/rescheduling decisions. Re-arm due work on restart without silently dropping reminders. Deterministic notifications must remain eligible without model calls when model work waits or spending is paused.

### One logical instance per agent

An agent ID has one durable identity and at most one active execution owner on the Linux host. A restarted process is a continuation of that agent. Conversation IDs isolate transcripts within it.

Use a process-lifetime OS lock keyed to the canonical agent/store identity before opening a writable runtime. A second launcher must fail before processing messages. A systemd unit name alone is insufficient because a manually started process could bypass it.

The lock design must prevent aliases or separate configuration paths from opening the same store as different agents. Multi-host ownership and distributed failover are out of scope. A copied backup is an offline recovery artifact until the original owner is stopped or isolated.

### Durable execution and safe recovery

Persist the input receipt, run state, task checkpoints, tool decisions and results, approval records, and reply state. Use Pi Durable for execution persistence where its tested API fits. Add only the application records needed for routing, authorization, and external effects.

Every external action receives a stable action ID before execution. Retries of that logical action reuse the ID. The action record includes its input digest, tool version, authorization decision, attempt history, and outcome.

| Operation | Recovery requirement |
| --- | --- |
| Read-only tool | Retry within limits, accepting that a fresh read may return changed data |
| External API with a documented idempotency contract | Reuse the same key; respect its retention window and verify the original result where possible |
| External action with a reliable status lookup | Reconcile the original action before deciding whether a retry is safe |
| External action without either guarantee | If interruption leaves the outcome uncertain, block automatic retry and request owner reconciliation |
| Model request without a stored result | May be retried within budget; duplicate provider cost is possible |
| Stored final response | Return the stored response; do not ask the model to regenerate it on delivery retry |

The framework must not promise exactly-once external side effects. A remote service can finish an action immediately before the local process loses the result. A local checkpoint alone cannot resolve that ambiguity.

Required behavior at interruption points:

1. Before input commit, the client has no acceptance guarantee and can retry with the same key.
2. After commit but before acknowledgement, a retry finds the existing receipt.
3. After action intent is committed, a crash may leave dispatch uncertain. Recovery follows the tool's declared safety contract.
4. After a result is committed, recovery reuses that result rather than repeating the action.
5. After reply persistence but before delivery acknowledgement, recovery uses the same delivery ID. A push adapter without deduplication or reconciliation support must expose delivery uncertainty rather than claim exactly-once delivery.

Use bounded backoff for transient failures. Persist the attempt count and next retry time so restart does not reset limits. Authentication failures, invalid configuration, denied tools, and uncertain effects must not enter endless retry loops.

Cancellation must persist and stop new work after the runtime observes it. Cancellation does not reverse an already dispatched action. If dispatch was in progress, retain its result or uncertainty for reconciliation.

### Storage

Use per-agent SQLite on persistent local disk with effective `synchronous=FULL`; another backend requires explicit migration work and equivalent verification. Accepted work must survive sudden host power loss, subject to verified storage behavior, not merely process restart. Acknowledge only after durable commit. In-memory stores are for tests that make no restart-durability claim; temporary paths and network filesystems are not production state locations.

Keep agent identity/configuration revisions, transcripts, receipts, runs/checkpoints, actions/results, approvals, schedules, queues, counters, and outbox state in the agent's durable state. Use Pi-supported transactional application documents where possible, and verify participation with the relevant execution checkpoint. Never modify Pi's internal tables. If the selected dependency needs substantial replacement machinery, stop for an owner dependency decision.

The host-level shared spending ledger is separate from workflow databases. No distributed transaction is assumed across those stores, files, or remote APIs. Use stable request/action/reservation IDs: persist call intent, acquire an idempotent cost reservation, persist dispatch state, then invoke the provider. Reconcile interrupted dispatch conservatively; never release unknown charges just because the process died.

Durably publish large referenced files before committing references. Collect orphan files only after confirming no live record or retained backup references them; backup manifests pin referenced files. Rebuildable indexes do not replace durable source records.

Retain conversations, decisions, and document revisions until explicit owner deletion, compact action/deduplication records indefinitely for V1, and routine diagnostics for 30 days. Cleanup must not delete unfinished work, uncertain effects, needed retry keys, or untransferred snapshots. Explicit deletion needs duplicate-prevention consequences handled separately.

Create consistent, coordinated backup sets using a supported SQLite backup facility or quiesced snapshot, never a raw live main-file copy. Quiesce admissions/dispatch at a safe boundary across agent stores, the shared ledger, and referenced files. Record in-flight uncertainty rather than pretending remote services share that transaction. Verify versions and integrity on restore; never silently replace corruption with an empty store. Power-loss recovery and cross-store handling require implementation evidence.

### External LLM inference

The framework calls a configured external provider through an adapter. It does not host models or require a GPU. Keep provider credentials out of prompts, configuration committed to source control, transcripts, and ordinary logs.

Record provider/model identifiers, request status, latency, and usage when returned by the provider. Enforce finite model-call and tool-step limits even when exact cost information is unavailable. Do not silently switch providers or models after a failure.

Conversation and permitted tool content may leave the host as part of inference. The owner must be able to inspect sent context and configure exclusions. Bound each request's context and selectively retrieve relevant retained records; do not truncate the owner's retained conversation/decision/document history merely to fit a model request. Autonomous long-term memory remains outside scope.

### Linux operation

Supply installable systemd units for the gateway and parameterized agent runner. Services run as an unprivileged account with restricted access to configuration, credentials, workspaces, and state directories.

On startup, validate configuration and storage, acquire ownership, load durable state, and resume eligible work. Mark readiness only after those steps succeed. Persistent configuration errors must produce an actionable failure and avoid restart storms.

On shutdown, stop accepting new work, checkpoint or finish within a bounded grace period, close storage, and release ownership. Unexpected termination must still recover without requiring graceful shutdown.

Provide a small CLI for configuration validation, starting or addressing an agent, sending messages, retrieving results, inspecting status, approving or rejecting actions, cancelling work, and reconciling uncertain actions. The exact command names are an implementation detail.

No production-server access or deployment is part of preparing or validating this PRD. Implementation verification uses an isolated development Linux environment.

## Architecture and portability

```text
Owner via Slack / internal HTTP client
        |
Authenticated messaging gateway
        |
Agent runner for stable agent ID
        |-- configuration and permission checks
        |-- Pi Durable adapter
        |      |-- durable conversation and execution state
        |      `-- external LLM provider
        |-- guarded tool execution and action journal
        `-- durable replies / outbox

Linux host adapters: systemd, process lock, local SQLite, local credentials
```

Use the following boundaries, with the smallest interface needed by the MVP:

| Boundary | Linux responsibility | Future Cloudflare investigation |
| --- | --- | --- |
| Agent host | Open, own, resume, and close one agent | Map stable agent IDs to Durable Objects and verify concurrency behavior |
| Durable store | Atomic commits, reopen, backup, schema checks | Evaluate the supported Pi storage integration and migration format |
| Wakeups | Resume persisted reminders, background checks, retries, and catch-up work in a systemd-managed runner | Evaluate alarms/lifecycle wakeups and execution limits |
| Message transport | Authenticated HTTP and local agent dispatch | Evaluate HTTP/RPC routing and delivery guarantees |
| Tool executor | Enforce scope, approval, timeouts, and retry contract | Replace unsupported filesystem/process tools or use a separately secured service |
| Model client | Provider requests and credential references | Resolve provider credentials and transport through platform bindings |
| Diagnostics | Structured logs, status, and counters | Map to platform logging and metrics |

Agent logic must not directly depend on systemd, process signals, absolute host paths, or Cloudflare bindings. Tool manifests must identify host requirements. Unsupported tools must fail capability validation on a new host.

Portability means explicit boundaries and a documented migration plan. It does not mean every Linux tool is portable, that a SQLite file can be uploaded unchanged, or that Cloudflare deployment is implemented. A future Cloudflare milestone requires separate compatibility, storage migration, wakeup, tool, and recovery tests.

## Security

- Authenticate every gateway request. Bind to loopback by default; remote access requires an authenticated encrypted transport. Check authorization again when an agent receives a routed request.
- Treat messages, retrieved documents, tool output, and skill text as untrusted instructions. They cannot expand tool permissions, approve actions, or change routing policy.
- Scope credentials and tools per agent. Prevent one agent from reading another's state through filesystem paths or generic tools. A shared trusted process is not a sandbox for hostile executable plugins.
- Load only operator-installed, pinned skills and executable extensions. Automatic download or execution of suggested packages is outside the MVP.
- For actions requiring approval, persist the exact action digest, agent/run/action IDs, owner identity, and decision. Agents cannot approve actions. Calendar requests have no time-based expiry; changed arguments/preconditions require a new owner decision. Do not silently introduce approval expiry or the skipped blanket cancellation-on-revocation proposal.
- Limit file access and outbound destinations at the executor. Validate paths after resolving symlinks; guard network tools against access to unintended private services.
- Redact secrets from logs and diagnostics. Restrict transcript access and document retention and deletion behavior, including backups and provider data exposure.
- Support credential rotation without changing agent identity. Never store credential values in a configuration revision snapshot.

## Observability

Provide structured events with agent, conversation, receipt, run, action, and correlation IDs. Record state transitions, retries, denied calls, approvals, recovery decisions, and configuration revisions. Prompt and tool bodies stay out of ordinary logs by default.

The status command must distinguish idle, running, retrying, waiting for approval, needs reconciliation, and failed states. A running process with blocked work must not appear healthy solely because it has a PID.

Expose queue depth, age of oldest pending input, last successful run, recovery count, tool and provider failures, retry count, unresolved actions, and available usage data. Health checks distinguish liveness, readiness, and degraded external dependencies. Start with CLI status and structured systemd journal output; a dashboard is unnecessary.

## Out of scope

- Autonomous long-term memory, vector databases, semantic recall, knowledge graphs, and automatic profile learning. Durable history and selective retrieval of relevant conversations, decisions, and document revisions remain required.
- Cloudflare deployment, automatic Linux-to-Cloudflare migration, and platform feature parity.
- Multi-host clustering, distributed failover, load balancing, and multi-tenant hosting.
- Dynamic subagent spawning, autonomous delegation, agent marketplaces, and a general workflow designer.
- A rich web UI, mobile app, or every messaging platform.
- Local model hosting, training, or fine-tuning.
- Automatic plugin installation, self-modifying permissions, or automatic code upgrades.
- A general-purpose scheduling platform. Personal reminders, calendar management, background email/calendar checks, and persisted retry wakeups are required.
- Exactly-once guarantees for arbitrary external systems and automatic rollback of real-world actions.

Durable transcripts and operational state are required even though long-term memory is deferred. Their purpose is continuing a conversation and recovering work, not learning a persistent personal profile.

## MVP milestones

| Milestone | Deliverable | Exit evidence |
| --- | --- | --- |
| M0. Dependency and design check | Pin Pi Durable, Pi AI, runtime, and storage versions; record documented APIs, design decisions, gaps, and runtime assumptions | Written decisions on storage and effect handling plus implementation verification criteria; no recovery test setup required during planning |
| M1. First working path | One configured agent, authenticated HTTP message, external model call, persisted response, Linux systemd runner | Send a real message end to end, restart and normally reboot an isolated Linux environment, verify systemd reopens the same store, retrieve the same receipt and response, and resume pending work |
| M2. Configuration and isolation | Two agents with distinct prompts, skills, routes, and permissions; duplicate-owner prevention | Independent conversations; denied cross-agent access and duplicate launcher; invalid config fails before acceptance |
| M3. Action safety | Action journal, approval persistence, bounded retries, cancellation, and reconciliation | Inject failures before and after a test side effect and prove the expected recovery behavior |
| M4. Operational completion | Backup/restore, status, logs, retention rules, installation/runbook, portability notes | Restore into an isolated host, pass acceptance tests, and document platform gaps without claiming Cloudflare support |

M1 is real code retained through later milestones. It must cross the actual gateway, runtime, durable storage, inference, and service boundaries before additional channels or tools are added.

## Acceptance criteria

Use controlled fixtures and isolated services for destructive failure tests. A real external inference smoke test validates the provider adapter; deterministic fixtures cover repeatable recovery tests.

| ID | Test | Required result |
| --- | --- | --- |
| AC-01 | Configure two agents with different instructions and allowlists | Each uses its recorded prompt/configuration, sees only its selected skills, and cannot execute the other's restricted tools |
| AC-02 | Start with an invalid field, missing skill, missing credential reference, or duplicate agent ID | Validation fails with a useful error before new work is accepted |
| AC-03 | Send unauthenticated input and input to an unauthorized route | Reject it without admitting a run or exposing conversation contents |
| AC-04 | Send identical input repeatedly using one deduplication key, including after restart | Return one receipt and create one logical run; changed payload with the same key is rejected |
| AC-05 | Kill the service after inbox commit but before returning the receipt | Retried input finds the committed receipt and eventually completes or exposes an explicit failure |
| AC-06 | Kill the agent during model generation, then restart | Acknowledged input survives; execution resumes or safely retries; any repeated inference attempt is visible |
| AC-07 | Launch a second writer using the same agent or store through an alternate path | The second owner is rejected before it executes work |
| AC-08 | Queue multiple messages while one run is active | One run executes per agent in durable admission order; configured queue overflow returns a clear rejection |
| AC-09 | Crash after a test API applies an idempotent action but before the result commits | Recovery reuses the action key and produces only one remote effect within the tested API contract |
| AC-10 | Repeat AC-09 with an action lacking deduplication and status lookup | Run enters needs reconciliation; no blind automatic retry occurs |
| AC-11 | Crash after a tool result or final response commits | Recovery uses the stored result; response polling does not repeat the tool or regenerate the answer |
| AC-12 | Approve an action, restart, and attempt to change its arguments | The original decision survives; modified arguments cannot reuse that approval |
| AC-13 | Revoke a tool while work is paused, then resume it | Execution denies the revoked tool and records why, without silently granting new permissions |
| AC-14 | Simulate provider outage, authentication failure, and exhausted retry limits | Transient errors back off durably; permanent failures stop; status and logs identify the condition |
| AC-15 | Cancel queued work and work with an action in flight | Queued work does not start; active work stops scheduling new actions; any in-flight uncertainty remains visible |
| AC-16 | Stop and restart systemd services, then reboot the test Linux host | Agent identities, receipts, pending approvals, and eligible work survive without manual database editing |
| AC-17 | Make storage unavailable or present an incompatible/corrupt store | Readiness fails and new inputs are not acknowledged; the service preserves existing data for diagnosis |
| AC-18 | Back up and restore into an isolated environment | Conversations, deduplication records, approvals, and pending work remain consistent; effects are reviewed before enabling dispatch |
| AC-19 | Inspect normal logs and force a denied tool call | Correlation IDs explain the event; credentials and full prompt bodies are absent from ordinary logs |
| AC-20 | Review imports, adapters, configuration, and the portability note | Host-specific code is behind declared interfaces; unsupported Cloudflare capabilities are listed explicitly |

The MVP is complete when M0 through M4 and all applicable acceptance criteria pass on the pinned Linux stack. For Slack or any owner-approved replacement push adapter shipped in the MVP, additionally test a crash after remote delivery but before local acknowledgement and document how duplicates or uncertainty are handled. Slack remains selected on the completed feasibility findings. Its production durable-delivery guarantees must still be verified on the implemented stack. The decision map must add workflow acceptance criteria for reminders, calendar, and email before the specification is ready.

## Remaining specification and implementation details

The provider/model, limits, retention, schedules, backup destination/key recovery, upgrade policy, and connector feasibility are settled. Do not remap them as open M0 choices.

The implementation specification still needs exact dependency/runtime pins, the configuration-file format, verified adapter transaction boundaries, detailed command/schema contracts, and workflow acceptance scenarios. These are synthesis and implementation details, not unfinished integration spikes. No owner-approved universal queued-response-time target is recorded.

Slack context beyond the current thread, relevance criteria for unsolicited contributions, desired multi-agent cancellation policy, and owner-facing uncertain-delivery presentation remain product choices where no existing decision settles them. Speech/document interfaces and the authority of external coding-harness supervision are not defined by provider-independence or budget decisions. This reconciliation does not choose these policies, create new mapping tickets, or complete the implementation specification.

Use the [decision map](.scratch/personal-assistant/map.md), [specification task](.scratch/personal-assistant/issues/19-finalize-implementation-specification.md), and [remaining work](docs/remaining-work.md) for the next phase. Pi Durable runtime, production security, and backup/restore acceptance remain unexecuted framework tests, separate from completed connector spikes.
