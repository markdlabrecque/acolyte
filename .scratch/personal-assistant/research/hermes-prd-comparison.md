# Hermes compared with the personal-agent PRD

Research date: 2026-10-27. This compares **Nous Research's Hermes Agent** with [PRD v0.5](../../../pi-durable-personal-agent-prd.md). It does not change the PRD, select a replacement dependency, or authorize implementation.

## Conclusion

**Hermes would save substantial general-agent development. It would not deliver this PRD through configuration alone.** It already has Slack conversations, profiles, direct DeepInfra access, searchable history, scheduling, durable input admission, and operational tooling. Those are real advantages over a framework that has not been built yet.

The custom work would still include the personal-assistant workflows and several of the PRD's strongest guarantees. A Google skill that can send email is not a draft-only adapter. A configurable approval timeout is not a durable, indefinitely pending Calendar proposal. Usage reporting is not a shared, pre-dispatch spending limit.

For the **unchanged PRD**, I lean toward retaining the small Pi Durable design rather than making Hermes the authority for execution and safety. That is an architectural judgment, not a measured cost advantage. Pi Durable recovery is still a planning assumption, and the proposed framework has not passed implementation acceptance. Hermes is the stronger starting point if the priority changes to getting a broad personal agent running quickly and accepting its behavior where it differs.

A Hermes implementation remains plausible. It would be a custom assistant built on Hermes, with separately enforced domain services and changes around execution, delivery, and operations. Calling that an out-of-the-box solution would hide the work.

## Evidence and version boundary

- PRD baseline: version 0.5 at project commit `176e67ffd95e47b1b891de62722b7447bb471a69`. The repository has no public remote.
- Main source inspected: Hermes commit [`508d6ec`](https://github.com/NousResearch/hermes-agent/tree/508d6ec24ed293e46e5d7d1b88a6d67285243d97), timestamp `2026-10-27T16:04:15-07:00`.
- The official latest-release API returned [v0.22.5](https://github.com/NousResearch/hermes-agent/releases/tag/v0.22.5), published `2026-10-23T05:28:45Z`, at commit `bf0203a794a07aac3ff764972ab9087baa4e4f4e`.
- This is a source-level comparison, with main as the detailed reference. It is not a claim that every main feature is in the released package. A literal comparison found 78 of the 83 excerpts in the [feature evidence](hermes-feature-evidence.md) unchanged in v0.22.5. The five changed excerpts concern profile delivery, todo resume, timezone handling, provider capability fields, and background-review documentation. Their detailed findings retain the main-snapshot qualification.
- The inspected delivery ledger, session-storage documentation, SQLite durability configuration implementation, pending-control implementation, Google helper, Proton email adapter, and DeepInfra provider files are identical between these two commits. The one-shot expiry logic and cited update backup/rollback rules are also unchanged in the inspected diff.
- No Hermes runtime, installed dependencies, credentials, accounts, or live integrations were exercised. Upstream test descriptions are evidence about upstream coverage, not tests run here. Negative findings apply to the examined paths; an unexamined plugin may offer additional behavior.

Here, **built in** means code included in the inspected repository, sometimes requiring configuration or optional dependencies. A **bundled skill** is instructions and helpers, not an enforced permission boundary. An **optional integration** requires another plugin, MCP server, or service. **Custom work** means the PRD behavior was not supplied by the examined implementation.

## Capability comparison

| PRD requirement | Hermes supplies | What remains for this PRD |
| --- | --- | --- |
| Slack threads, DMs, one identity per agent | Bundled Slack plugin, thread routing, native working status, profile-specific bot credentials. | Configure owner/channel access. Native Stop cancellation was not established; textual `!stop` is not equivalent. Add relevance/context rules and the shared six-message thread allowance. [Feature evidence, section 1](hermes-feature-evidence.md#1-slack-conversations-and-identities). |
| Direct DeepInfra and replaceable providers | Direct DeepInfra plugin, custom endpoints and provider plugins. | Pin `deepseek-ai/DeepSeek-V4-Flash-0731`, including auxiliary routes. Connect the owner's specific `pi-claude-subscription` fallback and require permission before switching. [Feature evidence, section 6](hermes-feature-evidence.md#6-deepinfra-replaceable-adapters-and-claude-fallback). |
| Gmail reading, search, owner-requested drafts, never sending | Bundled Google skill with reads, search, sending and mailbox mutations. | Trusted draft-only adapter and owner-request authority. The examined helper has no draft-create command and exposes send/reply. Disable bypass paths, not just a send tool name. [Feature evidence, section 2](hermes-feature-evidence.md#2-google-calendar-and-gmail). |
| Proton Bridge reading and drafts, SMTP denied | Bundled email gateway documents Bridge and uses IMAP plus SMTP. Optional Himalaya skill offers broader mail operations. | A narrow owner-mail adapter. The shipped email gateway is an email conversation channel that requires SMTP and sends replies, not the required read/draft service. [Feature evidence, section 3](hermes-feature-evidence.md#3-proton-readdraftno-send). |
| Calendar changes with exact, indefinite approval | Google skill exposes event list/create/delete. Slack has execution-approval buttons and extension hooks. | Update/reschedule support, durable proposal identity, indefinite pending state, revalidation, exact owner approval and remote-effect reconciliation. [Feature evidence, section 2](hermes-feature-evidence.md#2-google-calendar-and-gmail), [approval policy][approval-policy]. |
| Built-in personal todos | Agent work checklists with resume support; agent-work Kanban; optional Todoist MCP. | Owner-wide todo records with title, notes, due date, open/completed state and completion history. None of those alternatives is the specified domain unchanged. [Feature evidence, section 4](hermes-feature-evidence.md#4-owner-todos-versus-execution-plans). |
| Durable reminders and overdue catch-up | One-shot and recurring cron, recurring catch-up, script-only jobs that need no model. | First-class reminder occurrences, combined overdue delivery, occurrence/series control, and timing acceptance. Ordinary one-shots expire after 120 seconds overdue. [Feature evidence, section 5](hermes-feature-evidence.md#5-reminders-recurring-checks-and-catch-up), [expiry code][one-shot]. |
| Five-minute checks, digests, urgent alerts, quiet hours | Cron plus bundled inbox-triage and daily-brief instructions. | Finding/checkpoint state, deduplication, exact urgency rules, 08:00 reassessment, quiet-hour exceptions and catch-up aggregation. Instructions and scheduled prompts do not supply these contracts. [Feature evidence, section 5](hermes-feature-evidence.md#5-reminders-recurring-checks-and-catch-up). |
| Retained history without autonomous long-term memory | SQLite transcripts, search, profiles; configurable memory, learning and review. | Disable memory, user-profile learning, automatic review and curator behavior as appropriate. Preserve history search. Add the PRD's document/action retention rules and 30-day diagnostic policy. [Feature evidence, section 7](hermes-feature-evidence.md#7-memory-and-learning-controls), [storage][session-storage]. |
| Durable acceptance and safe restart | Canonical gateway ownership, durable input FIFO, execution generations and unknown-state fencing. | Domain-specific effect reconciliation and resumable assistant workflows. Interrupted started work becomes unknown rather than automatically continuing from an application checkpoint. [Storage/runtime contract][runtime-ledger]. |
| Durable replies, notifications and approval delivery | SQLite reply-delivery ledger, reconnection recovery and visible duplicate warnings. | Fail-closed recording and a domain outbox covering all required message types. Current ledger is explicitly best-effort, capped and expiring. Owner policy for uncertain delivery still needs resolution. [Ledger][delivery-policy]. |
| Shared US$10 monthly model cap and finite request budgets | Token/cost reports, configurable iteration limits, concurrency controls, separate Nous billing and MCP-tool spending features. | Durable shared pre-dispatch reservations, US$5 warning, unknown-price refusal, uncertain-charge accounting and all-provider/auxiliary coverage. Exact 5-minute/20-model/50-tool and 1-active/20-queued semantics also remain custom. [Usage accounting][usage-accounting], [iteration limits][iteration], [concurrency][concurrency]. |
| Credential and agent isolation | Allowlists, profile directories, tool selection, container backends and approval controls. | Enforce separate credential-owning services and OS/network restrictions. Profiles and shell deny rules alone do not establish the PRD's no-bypass boundary. [Security boundary][shell-boundary], [profile storage][session-storage]. |
| Linux storage and service topology | Linux/systemd gateways, per-profile SQLite and exclusive canonical-session ownership; configurable SQLite synchronous mode. | Explicitly set and verify FULL on Omarchy. Match one gateway plus separately supervised agent services, rather than assuming profiles inside one process satisfy it. [SQLite policy][sqlite-policy], [profiles][profiles]. |
| Encrypted, verified off-host backups and safe restore | SQLite-safe backup/export, restore validation and update snapshots. | Public-key encryption, consistent multi-store set/manifest, 03:00 schedule, verified MacBook delivery over Tailscale, hourly durable retry, pending-aware retention and writes-disabled reconciliation on restore. [Backup command][backup-cli], [archive implementation][backup-zip]. |
| Owner-approved upgrades within the maintenance window | Update commands, pre-update snapshots, draining, restart and incompatible-runtime rollback restrictions. | Per-upgrade approval, strict backup/drain preconditions, 00:00–08:00 admission and deferred outcome notifications. The updater can continue after snapshot or gateway-pause failure. [Update behavior][updating], [rollback/draining][rollback]. |
| Voice, document tools and coding delegation | Voice/transcription, document extraction/editing skills, internal delegation and external coding-tool skills. | Useful extras if approved later. They do not settle V1 interfaces, authority or retention, and are not presently reasons to expand scope. [Feature evidence, section 8](hermes-feature-evidence.md#8-voice-documents-and-coding-extras). |

## The differences that determine the decision

### 1. Hermes has real durability, but it is not the entire assistant transaction model

The profile gateway owns canonical sessions. It persists admitted inputs, tracks execution generations and fences inputs interrupted after starting as `unknown`. Later inputs wait until that uncertainty is resolved. This is substantially stronger than simply saving a chat transcript. [Storage and runtime tables][runtime-ledger].

Its reply ledger also distinguishes pending, attempting, delivered and failed sends. After an ambiguous send it can redeliver with a visible warning that the reply may be a duplicate. This is honest recovery behavior, not an exactly-once promise. [Delivery policy][delivery-policy].

There are important differences from the PRD:

- The delivery module explicitly permits sends to proceed when ledger operations fail. Its constants allow three attempts, mark stale work abandoned after 24 hours, retain terminal records for seven days and cap the table at 500 rows. That cannot be accepted unchanged as indefinite compact action/deduplication retention or as a guarantee that every owed approval/notification survives. [Ledger policy][delivery-policy], [expiry][delivery-retention], [pruning][delivery-pruning].
- The generic unknown-turn fence does not inspect Gmail drafts, Calendar events or Proton IMAP state to establish what actually happened. Those domain adapters still need stable action IDs and evidence-based reconciliation.
- Client reconnection to a live approval is not a process-restart guarantee. The inspected control projection keeps pending prompts in memory and binds responses to a running execution generation. Calendar proposals need their own persistent lifecycle independent of a live tool waiter. [Pending controls][pending-controls], [generation checks][approval-generation].

Both implementations would still need the PRD's recovery acceptance tests. The completed connector spikes are not evidence that either production runtime already passes them.

### 2. Mail safety requires an enforced integration, whichever runtime is chosen

Hermes' Google helper actually implements sends. Its Proton-compatible email gateway actually uses SMTP. Instructions such as "ask before sending" cannot satisfy "sending is prohibited even with approval." [Google send code][google-send], [Proton gateway connection][proton-connect].

Hermes documents this general distinction itself: shell deny rules are not an OS capability sandbox, and containment requires restricted permissions, mounts, credentials and networking. [Security threat model][shell-boundary].

A Hermes-based version could expose separate, narrow mail and Calendar services through MCP or custom tools. Credentials would stay in those services. The agent must lack generic execution, network or alternate tools that bypass them. The trusted service must also distinguish an authenticated owner request for a draft from instructions found in an email. That is implementation work, not a skill installation.

### 3. Similar configuration knobs do not give the same budget semantics

Hermes records response token usage and estimated costs. The inspected accounting runs after the response, adds per-session totals and queues persistence. Its default iteration limit is unlimited, although a finite limit is configurable. [Usage path][usage-accounting], [iteration configuration][iteration].

Hermes also has two superficially similar spending features:

- Nous Portal billing exposes a provider-account monthly cap. That is not a host-wide ledger for direct DeepInfra plus the owner's approved fallback. [Billing lifecycle][billing].
- MCP cost policies can demand approval when a chat exceeds a declared server-tool spend limit. They govern those tools, not all model dispatches across agents. [MCP cost policy][mcp-cost].

I did not find the PRD's shared monthly, fail-closed reservation contract in the inspected accounting/configuration paths. It needs a mandatory gateway for every billable model call, including auxiliary calls, plus durable reservations and reconciliation. A UI cost warning or post-call hook is insufficient.

The active-session cap is also not the PRD's one-active-request/twenty-queued scheduler. Hermes documents a best-effort lease registry that fails open on registry failure. Setting the cap to one does not establish queue capacity, release while waiting, persisted request counters or reminder priority. [Concurrency contract][concurrency].

### 4. Scheduling exists; the reminder product still has to be built

For example, a reminder due while the host is off must remain owed on restart. Hermes' ordinary one-shot due scan instead retires a job more than 120 seconds late. Recurring jobs have catch-up support, but that does not recover this one-shot case or combine several overdue reminders into one owner notification. [Grace constant][one-shot-grace], [due scan][one-shot].

Script-only cron is useful because deterministic reminders can avoid model calls. The custom work is the reminder/finding state and its policy, not inventing a timer. It must preserve explicit reminder occurrences, reconcile changes and cancellations, and keep delivering while the model budget is exhausted. See [feature evidence, section 5](hermes-feature-evidence.md#5-reminders-recurring-checks-and-catch-up).

### 5. Backups and upgrades need a stricter controller

Hermes offers a useful SQLite-safe backup command. The implementation writes an ordinary ZIP and includes selected secret-bearing files such as `.env` and `auth.json`; the quick snapshot also includes them. File permissions do not turn that archive into the PRD's encrypted recovery material. [Backup options][backup-cli], [secret file handling][backup-secrets], [ZIP writer][backup-zip].

A per-database consistent snapshot is also not by itself a consistent set across agent stores, the shared spending ledger and referenced files. The selected PRD backup protocol, transfer journal, pending-aware retention and restore safety remain custom.

The updater already has draining and a restriction against rolling an older runtime onto incompatible session state. That should be credited. However, its documented pre-update snapshot is best-effort, and its gateway pause can fail without blocking the update. Those defaults differ from the required preconditions. The maintenance window and quiet-hour outcome delivery also need policy outside the stock command. [Update phases and failure behavior][updating], [rollback and drain][rollback].

## Build, adapt, or combine

| Direction | Benefit | Cost and condition |
| --- | --- | --- |
| Build the current Pi Durable design | Keeps the small tool set, domain authority, request budgets and recovery model explicit. Preserves the owner's chosen runtime and working fallback. | We own connector productionization, Slack UI, scheduling, delivery, operations and all acceptance tests. The recovery assumption still needs to hold in real implementation. |
| Adapt Hermes | Reuses its running product, providers, Slack plugin, session ownership, history, scheduler and admin tools. Extras are already available. | Write the same constrained personal-assistant services, integrate shared policy, and strengthen or replace behavior that conflicts with the PRD. Core changes create upstream maintenance cost. This requires an explicit dependency decision. |
| Keep a custom durable assistant core and use Hermes as an optional client/worker | Can reuse selected Hermes interaction or reasoning capabilities without giving its generic tools authority over mail and Calendar. | Adds a second runtime and ownership boundaries. Delivery, budgets, queues and credentials must have one clear authority. This is not automatically simpler or cheaper. |

My recommendation for the existing requirements is **keep the small custom design, while using Hermes as a reference and a credible alternative rather than rebuilding its whole feature set**. If broad voice, documents, browsing and coding become central, the balance shifts toward Hermes because it already supplies that surrounding product.

There is no defensible percentage-complete or effort-saving estimate from this audit. Several difficult requirements cut across the runtime. Counting Slack, mail and cron as three checkmarks would overstate compatibility; ignoring Hermes' durable admission and operational tooling would understate it.

## Unresolved PRD choices remain unresolved

This comparison does not choose cross-thread context/disclosure, unsolicited participation, native Stop scope, accepted/rejected/uncertain delivery UX, or Calendar attendee/recurrence policy. Hermes defaults must not silently answer those questions. Real workflow acceptance and the final M0–M4 specification still need completion.

No closed integration spike was reopened. No ticket, PRD policy, runtime or account was changed. The comparison and supporting evidence are research artifacts only.

## Research validation

The two research notes contain 108 pinned source references. Checks passed for source paths and line bounds, reference labels, local Markdown links/anchors, HTML IDs/links and inline JavaScript syntax. Chromium smoke checks passed for filtering, empty results, resetting the table, detail expansion and mobile page overflow. Desktop and mobile first-view screenshots were inspected. These checks validate the comparison artifact, not Hermes behavior or PRD acceptance.

The generated HTML is `tmp/hermes-prd-comparison.html`, under the repository's ignored temporary-output directory. The two Markdown research notes remain uncommitted on `research/hermes-comparison`. Existing tracked requirements and planning records are unchanged.

## Primary sources for the reliability and operations review

The [feature evidence](hermes-feature-evidence.md#pinned-sources) contains 83 additional pinned references for the workflow rows. The links below pin the inspected main snapshot.

[session-storage]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/developer-guide/session-storage.md#L1-L42
[runtime-ledger]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/developer-guide/session-storage.md#L126-L171
[delivery-policy]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/gateway/delivery_ledger.py#L1-L42
[delivery-retention]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/gateway/delivery_ledger.py#L374-L406
[delivery-pruning]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/gateway/delivery_ledger.py#L535-L552
[pending-controls]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/gateway/session_pending_controls.py#L1-L65
[approval-generation]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/gateway/session_authority.py#L1010-L1062
[approval-policy]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/security.md#L24-L60
[google-send]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/scripts/google_api.py#L380-L419
[proton-connect]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/email/adapter.py#L586-L621
[shell-boundary]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/security.md#L175-L196
[usage-accounting]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/agent/turn_usage.py#L229-L280
[iteration]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/configuration.md#L1280-L1301
[concurrency]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/configuration.md#L2644-L2677
[billing]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/developer-guide/billing-lifecycle.md#L7-L43
[mcp-cost]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/tools/mcp_tool_costs.py#L1-L24
[one-shot-grace]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/cron/jobs.py#L111-L116
[one-shot]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/cron/jobs.py#L3099-L3151
[sqlite-policy]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/hermes_state_wal.py#L601-L669
[profiles]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/multi-profile-gateways.md#L29-L69
[backup-cli]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/reference/cli-commands.md#L1112-L1142
[backup-secrets]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/hermes_cli/backup.py#L164-L177
[backup-zip]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/hermes_cli/backup.py#L630-L659
[updating]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/getting-started/updating.md#L124-L149
[rollback]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/getting-started/updating.md#L168-L218
