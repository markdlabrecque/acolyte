# Hermes user-facing capability evidence

## Scope and evidence standard

- Research date: 2026-10-27.
- Hermes snapshot: NousResearch/hermes-agent, `508d6ec24ed293e46e5d7d1b88a6d67285243d97`, checked locally at `tmp/hermes-agent-source`. All upstream links below pin that SHA.
- Comparison baseline: `pi-durable-personal-agent-prd.md`, version 0.5, at local project revision `176e67ffd95e47b1b891de62722b7447bb471a69`. The project has no configured Git remote, so the PRD has no public permalink supplied here.
- Scope: owner-facing Slack, mail, Calendar, todos, scheduling, inference selection, memory, and useful extras. Transactional recovery, budgets, isolation, approval-record durability, backup/restore, and upgrades belong to the parent's separate review.
- Method: read official documentation and implementation in the supplied snapshot. No Hermes execution, dependency installation, runtime tests, account access, or external-service calls. A documented feature or inspected code path is not a tested guarantee. Negative findings identify the inspected component, not every possible third-party extension.
- Classification: **shipped code** includes bundled platform/provider plugins; **configuration** means enabling or selecting that code; **bundled skill** means instructions/helpers with their own dependencies, not a core permission boundary; **optional MCP/plugin** means an extra integration; **custom** means the PRD behavior is not supplied by the examined path.

## 1. Slack conversations and identities

### Thread-first conversations: shipped plugin plus configuration

Hermes ships a Slack Socket Mode platform plugin, requiring bot and app tokens. Its documented default is mention-to-start in a channel, reply under that message, then follow the active thread without another mention. The implementation keys channel conversations by the actual thread root, or by the opening message timestamp when `reply_in_thread` is enabled. This is a close fit for the PRD's conversation boundary. Thread context retrieval also exists when joining or resuming a thread; it is not restricted to only messages previously delivered directly to that agent. [Plugin declaration][slack-plugin], [interaction contract][slack-conversation], [thread selection and hydration][slack-route].

Customization: configure the owner's allowlist and curated channels; decide the still-open context/relevance policy rather than assuming Hermes' thread hydration is the desired policy. The documented channel allowlist does not restrict 1:1 DMs. [Channel allowlist][slack-allowlist].

### Working indication: present; native Stop: not established

Hermes calls Slack's native thread/session status API, selecting `agents.sessions.setStatus` when the installed SDK supports it and the older Assistant API otherwise. Status is thread-scoped; failures are debug-logged rather than surfaced as a hard capability failure. The documentation calls for `assistant:write`. Native reply streaming and optional task-progress cards are separate features; streaming can fall back to edit-based delivery. [Status docs][slack-status-doc], [API selection][slack-status-api], [status implementation][slack-status-code], [streaming and cards][slack-stream-doc], [stream start implementation][slack-stream-code].

The stop mechanism explicitly documented for threads is `!stop`, an alternative to slash commands. The inspected shipped event/action registrations include lifecycle events, approval/clarification/model-picker buttons, and slash commands, but no native Slack Stop action/event handler. **Do not count `/stop`, `!stop`, or `chat.stopStream` as evidence that the PRD's native Stop control cancels agent work.** This remains a likely adapter extension, not a reason to reopen the already-closed Slack feasibility spike or substitute custom controls. No live Free-workspace UI behavior was checked. [Thread commands][slack-stop-doc], [registered handlers][slack-handlers].

### Multiple bot identities: supported building blocks, not the collaboration policy

Profiles can bring up their own enabled platforms and credentials through a multiplexing gateway. Delivery selection distinguishes the owning profile's adapters and avoids substituting the default bot when a dedicated profile adapter is unavailable. Separate profiles with separate Slack apps/tokens are therefore the relevant configuration for distinct mentionable agents. This is different from the Slack adapter's multi-workspace token list, whose clients and bot IDs are indexed by workspace, not a declared roster of agents in one workspace. [Profile configuration][profile-platforms], [delivery adapter selection][profile-delivery], [multi-workspace documentation][slack-multiworkspace].

Peer-bot messages default to ignored. `allow_bots: mentions` requires a fresh mention in each peer message; `all` accepts other bots but the docs warn about loops. These are routing switches, not a relevance evaluator or the PRD's shared six-message allowance between owner replies. Unmentioned, useful contributions and shared thread accounting remain custom policy. The parent owns the allowance review. [Peer-bot configuration][slack-bots-doc], [actual bot gate][slack-bots-code].

### DM notifications and buttons: reusable plumbing

Cron delivery supports `slack:U…` to resolve the owner's DM, and `send_message` accepts user IDs, DM IDs, or channel IDs. Notifications can therefore target DMs without changing conversational channels. Built-in Block Kit approvals are execution approvals, with once/session/always/deny actions, not Calendar proposal cards. Plugins can register Slack actions or native platform handlers. The exact Calendar proposal DM and Approve/Reject interaction would need domain-specific integration using those hooks. This finding does not assess approval persistence or authorization safety. [Delivery targets][slack-delivery], [execution approval renderer][slack-exec-approval], [plugin interaction hooks][slack-plugin-hooks].

## 2. Google Calendar and Gmail

### Google integration is a bundled skill, not a constrained personal-mail adapter

The `google-workspace` skill supplies OAuth setup and a Python wrapper that prefers the separately installed `gws` CLI, otherwise using Google's Python clients. Both paths use the Hermes-home token file. Gmail calls use `userId="me"`; Calendar takes a calendar ID, defaulting to `primary`. This makes one authenticated account usable across both services, but does not itself prove the account is the owner's personal account or enforce an allowed-calendar list. [Skill/backend declaration][google-skill], [token/backend implementation][google-backend], [Gmail reads][google-read], [Calendar command schema][google-commands-calendar].

### Read/search and create/delete exist; the examined wrapper lacks drafts and rescheduling

The wrapper implements Gmail search and full-message body retrieval. Its Gmail command set is `search`, `get`, `send`, `reply`, `labels`, and `modify`; no draft-create operation is exposed. Calendar exposes `list`, `create`, and `delete`, but no update/reschedule command. Create/delete invoke the provider directly. These are bounded findings about the wrapper, not claims that Google's APIs or arbitrary `gws` commands lack those operations. [Gmail implementation][google-read], [Gmail command schema][google-commands-mail], [Calendar command schema][google-commands-calendar], [Calendar writes][google-calendar-write].

The skill instructs the agent to ask before sends and Calendar mutations. That is instruction text, not the PRD's permanent send prohibition. The helper really has a send implementation and requests send/modify scopes in its declared scope set. The PRD's trusted read/search/draft-only interface, separate Calendar authority, folder/calendar restrictions, and no mailbox-flag changes are custom integration requirements; removing a sentence or telling the model not to send is not equivalent. [Skill rules][google-rules], [declared scopes][google-backend], [actual send implementation][google-send].

### Inbox intelligence and daily briefs: useful instructions, not a completed monitoring workflow

Bundled `email-inbox-triage` instructions prioritize threads and draft replies, default to read/draft, and require approval for other mutations. They still permit sending within approval, which conflicts with this PRD. The Google daily-brief reference describes schedule/conflict/meeting-prep/urgent-mail synthesis. Neither instruction file implements the PRD's five-minute watchers or exact digest/urgency policy. [Triage procedure][mail-triage], [daily-brief procedure][google-brief].

There is a concrete coverage limit: `gmail_search` and `calendar_list` each process one list response without following a next-page token. The Calendar wrapper returns a reduced event projection rather than attendee/organizer detail. Thus the brief's instruction to retrieve all relevant calendars, finish pagination, and reason about invitations is broader than these helper outputs. A richer connector or direct controlled API operations would be needed. [Gmail list implementation][google-search-page], [Calendar list implementation][google-calendar-read], [brief requirements][google-brief].

## 3. Proton read/draft/no-send

Hermes explicitly documents Proton Mail Bridge transport settings for its bundled Email gateway, including loopback STARTTLS and certificate-verification configuration. **Proton is not wholly unsupported.** However, that gateway is for receiving email addressed to the agent and sending email replies, not silently managing the owner's mailbox. Its connect path requires SMTP configuration and probes SMTP login; replies call SMTP `send_message`. It is unsuitable unchanged for the PRD's SMTP-denied personal-mail adapter. [Bridge setup][proton-doc], [gateway purpose][email-purpose], [connect requirements][email-connect], [send path][email-send].

The gateway searches INBOX for unseen messages and fetches admitted messages with `RFC822`; it does not expose a read/search/folder/draft-saving owner tool interface. At initial connection it adds existing UIDs to an internal skip set. The docs describe this as marking existing mail "seen", but the inspected startup code does not issue a server-side flag-store operation there. Keep that distinction rather than repeating the documentation literally. [Startup baseline][email-baseline], [inbox fetch][email-fetch], [documented startup description][email-start-doc].

The bundled Himalaya skill is another option for general mailbox operations, but it requires the external `himalaya` CLI, describes IMAP/SMTP configuration, and exposes sending, moving, deleting, and flag changes through terminal commands. It is not a shipped trusted no-send Bridge adapter. No provider-confirmed Proton draft-create path was established in either inspected integration. Custom IMAP read/search plus draft APPEND, with no SMTP access, remains the PRD integration point. This is not a request to repeat the completed Proton spike. [Himalaya dependency and configuration][himalaya-setup], [mailbox mutation commands][himalaya-mutations].

## 4. Owner todos versus execution plans

The core `todo_list` is an agent work checklist. Its items are `id`, `content`, `status`, and optional `parent`; statuses include pending/in-progress/completed/cancelled. It supports replacing the entire list and describes itself as tracking multi-step work. It is not accurate to dismiss it as entirely nonpersistent: the session database has a latest-valid-todo-result retrieval path used for resume. But neither the item schema nor that resume behavior supplies an owner-wide todo domain with separate title, notes, due date, completion history, and explicit reminder linkage. [Checklist store/schema][todo-store], [agent-facing purpose][todo-purpose], [resume retrieval][todo-resume].

Hermes also has a SQLite-backed Kanban board for assigning work to profiles and dispatching agents, plus an optional external Todoist MCP catalog entry. Neither should be counted as the PRD's simple built-in personal todo list. A separate owner-todo tool/store is the clearest customization; do not conflate a personal obligation with a runnable agent task. [Kanban purpose][kanban], [task fields][kanban-fields], [Todoist MCP manifest][todoist].

## 5. Reminders, recurring checks, and catch-up

### Scheduling and model-free delivery exist

Core cron supports one-shots, recurring intervals/cron expressions, editing, pausing, resuming, triggering, and delivery targets. The documented gateway ticker runs every 60 seconds. That is scheduler cadence, not proof of end-to-end delivery within a minute. [Cron capabilities][cron-capabilities], [lifecycle commands][cron-lifecycle], [ticker cadence][cron-ticker].

`no_agent` jobs run a script and deliver stdout without constructing an agent or making model calls; empty stdout is silent. This is useful for deterministic reminders and checks, but still requires an operator-controlled script. It is not a first-class typed reminder record or permission to let an unrestricted agent write arbitrary scripts. [Script-only contract][cron-noagent-doc], [implementation][cron-noagent-code].

### Recurring catch-up exists; ordinary overdue one-shots expire

The local recurring-job policy collapses missed occurrences into one run by default; `cron.catch_up_missed: false` can skip sufficiently late recurring work. The code re-anchors the next run and dispatches one catch-up. **Ordinary one-shot jobs have a 120-second grace window.** Beyond it the due scan retires an unclaimed one-shot with a diagnostic rather than firing it. There is a special exception for a tracked cron-store outage, which must not be generalized to arbitrary host downtime. [Recurring policy][cron-catchup-doc], [recurring implementation][cron-catchup-code], [grace constant][cron-grace], [one-shot retirement][cron-expiry].

This is a direct mismatch with retaining overdue personal reminders after downtime. Per-job catch-up also does not assemble one combined owner notification with original due times across different reminders. Custom reminder occurrence handling and catch-up aggregation are required, not just setting a cron expression. The cited due-scan behavior is the evidence for that distinction; transactional reliability is outside this note. [Due-scan behavior][cron-expiry], [recurring collapse][cron-catchup-code].

### Timezone configuration is available; the precise Vancouver rule is not verified

Hermes accepts an IANA timezone through `HERMES_TIMEZONE` or `timezone` in configuration and uses Python `ZoneInfo`. Cron matches the configured zone's local wall clock. That supports configuring `America/Vancouver`, but does not prove the deployed timezone database contains the PRD's approved year-round UTC-07:00 rule for November 2026. Invalid zones fall back to server-local time with a warning, so strict configuration validation may also need tightening. No timezone or schedule execution was performed. [Timezone resolution][timezone], [wall-clock recurrence][cron-wallclock].

### Digests, quiet hours, urgency, and "this occurrence": custom workflow

Cron provides schedules and delivery, while the bundled brief/triage skills provide reasoning procedures. Those inspected components do not implement the PRD's exact five-minute polling, 09:00/12:00/15:00 digests, 21:00–08:00 hold, 08:00 reassessment, explicit-reminder exception, or occurrence-only cancellation/rescheduling. These need domain state and policy above cron. Schedule/lifecycle configuration alone is not evidence of these behaviors. [Cron lifecycle][cron-lifecycle], [brief procedure][google-brief], [triage procedure][mail-triage].

## 6. DeepInfra, replaceable adapters, and Claude fallback

DeepInfra is a shipped provider plugin with direct endpoint `https://api.deepinfra.com/v1/openai`, API-key/base-URL configuration, live model discovery, and provider-specific reasoning-effort mapping. OpenRouter is not required for that path. The plugin's hardcoded auxiliary default is `deepseek-ai/DeepSeek-V4-Flash`, not the PRD's exact `deepseek-ai/DeepSeek-V4-Flash-0731`. Explicitly select the required model and inspect auxiliary routes; provider support alone does not prove exact-model availability, quality, or every request contract. No live catalog or inference was queried. [DeepInfra implementation][deepinfra], [official provider docs][deepinfra-doc].

Hermes supports out-of-tree provider plugins, custom endpoints, multiple wire API modes, and per-model capability declarations. This is a real extension point for direct replaceable adapters, not an OpenRouter-only architecture. It does not automatically establish the PRD's run-boundary semantics or capability guarantees for an untested custom adapter. [Plugin discovery][provider-plugins], [provider fields/capabilities][provider-fields].

Hermes' native Anthropic provider is not `pi-claude-subscription`. It uses the Anthropic Messages path and supports API-key/OAuth-related credentials. **Hermes' own documentation says its OAuth route requires Claude Max plus purchased extra usage credits, does not consume the base Max allowance, and is unavailable to Pro.** That is an upstream documented restriction, not billing verified here, and must not be applied to the owner's separately confirmed working Pi extension. No Hermes bridge to that extension was found in the inspected provider path. Adapting the owner's extension would be separate integration work. [Anthropic provider][anthropic-code], [documented OAuth restriction][anthropic-doc].

Configured `fallback_providers` is automatic cross-provider failover, including mid-session switches. Do not enable it as a substitute for the PRD's owner-approved fallback decision. Manual provider choice and an integration for the owner's subscription route are the relevant requirements. The parent separately examines budget enforcement. [Fallback behavior][fallback].

## 7. Memory and learning controls

Hermes' built-in memory stores and user profile are configurable. Setting both `memory.memory_enabled` and `memory.user_profile_enabled` false disables those stores; `agent.disabled_toolsets: [memory]` also hides external memory-provider tools. External memory is otherwise a separate selection and is not disabled by only turning off the two built-in stores. Session search is separate SQLite/FTS history retrieval, so no-long-term-memory need not mean no searchable transcript. [Memory switches][memory-switches], [initialization code][memory-init], [session search][session-search].

Learning has more than one switch. Automatic post-turn review defaults on and may write memories/skills; `auxiliary.background_review.enabled: false` disables automatic forks but leaves manual `/refine` available. A separate curator defaults to deterministic skill maintenance; its LLM consolidation is opt-in, and `curator.enabled: false` disables curator maintenance. `skills.write_approval` stages skill changes rather than disabling learning. A PRD-aligned configuration should turn off automatic memory/review/curator behavior and restrict skill writes while preserving explicitly selected read-only skills. These are configuration recommendations, not a claim that general file/shell access cannot bypass them. [Review writes][review-writes], [automatic review switch][review-doc], [review switch implementation][review-code], [curator defaults][curator], [skill write gate][skill-write-gate].

## 8. Voice, documents, and coding extras

- **Voice: shipped features with optional dependencies/configuration.** Slack documents incoming audio transcription and outgoing TTS audio attachments. CLI/TUI voice supports recording, silence detection, and spoken replies; the live voice-channel experience described in the guide is Discord, not evidence of a Slack call interface. Speech has its own STT/TTS provider resolution, separate from the chat provider. These are useful extras, not decisions about the PRD's still-undefined voice UX. [Slack voice][slack-voice], [voice modes/dependencies][voice-doc], [CLI/TUI interaction][voice-interaction], [separate voice resolution][voice-code].
- **Documents: core extraction plus bundled editing skills.** `read_file` has stdlib notebook/DOCX/XLSX extraction; PDF and other formats use an optional converter. PDF extraction reads the text layer, not guaranteed OCR. The DOCX skill adds creation/editing/revisions through scripts requiring `python-docx`; Google helpers also expose Docs creation/appending and Sheets operations. Do not treat those capabilities as an approved document-editing/revision-retention policy. [Extraction docs][document-doc], [extractor implementation][document-code], [DOCX skill/dependencies][docx-skill], [Google document commands][google-documents].
- **Coding: core delegation plus optional external harness workflows.** Hermes can spawn its own child agents through `delegate_task`; the bundled Claude Code skill instead instructs it to run the separately installed/authenticated Claude Code CLI through terminal or tmux. That is not the same as using a Claude subscription as Hermes' inference provider. External harness authority and dynamic delegation remain outside the settled PRD scope. [Delegation contract][delegation], [Claude Code skill][claude-skill].
- **MCP: extension mechanism, not proof of a finished integration.** Core MCP supports local/remote servers and per-server tool filtering; catalog integrations are disabled by default. A custom narrow mail/Calendar/todo service could use that interface, but a generic MCP label does not supply the required provider operations or no-send policy. [MCP contract][mcp].

## Bottom line

Hermes supplies substantial interaction and execution tooling: thread-first Slack, profile-owned bots, DM delivery, direct DeepInfra access, scheduled scripts, and configurable learning. It is not a configuration-only replacement for this PRD. The highest-impact customization points are the narrow Gmail/Proton adapters, Calendar workflows, a distinct owner-todo model, non-expiring reminder catch-up with the exact notification policy, the native Slack Stop integration, and the owner's specific Claude fallback. The supporting evidence and limits are itemized above; none is a new integration-spike gate.

## Document validation and handoff limits

Candidate: this evidence file on `research/hermes-comparison`, based on project revision `176e67ffd95e47b1b891de62722b7447bb471a69`; no commit created. Only this assigned file was written. No tests changed.

Validation route: source/document review, not code TDD. Check each reference's pinned SHA, tracked source path, and line bounds against the local snapshot; check that all reference labels resolve; check whitespace and the project/source worktrees. The local reference audit passed: 83 pinned references, all labels resolve, all source paths are tracked, and every line range is in bounds. `git diff --check` passed. `git status --short --untracked-files=normal` showed only this new evidence file; `git -C tmp/hermes-agent-source status --short --untracked-files=normal` was empty. Evidence is this file plus the tool transcript. This is cheap document validation, not reviewer approval or a final product gate. Runtime tests, builds, external permalink HTTP checks, account entitlement checks, and UI observations were deliberately not run.

Workflow limitation: the prescribed `~/.agents/skills/subagent-tdd-pipeline/SKILL.md` was absent, and no copy was found in the alternative agent skill directory. The explicit research-only task handoff governed this work. No implementation or closed spike was reopened.

## Pinned sources

[slack-plugin]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/slack/plugin.yaml#L1-L21
[slack-conversation]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/slack.md#L374-L387
[slack-route]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/slack/adapter.py#L4302-L4397
[slack-allowlist]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/slack.md#L836-L860
[slack-status-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/slack.md#L489-L511
[slack-status-api]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/slack/adapter.py#L271-L298
[slack-status-code]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/slack/adapter.py#L2722-L2773
[slack-stream-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/slack.md#L543-L577
[slack-stream-code]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/slack/adapter.py#L2550-L2574
[slack-stop-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/slack.md#L308-L329
[slack-handlers]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/slack/adapter.py#L1636-L1700
[profile-platforms]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/multi-profile-gateways.md#L175-L190
[profile-delivery]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/gateway/authz_mixin.py#L213-L237
[slack-multiworkspace]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/slack.md#L949-L999
[slack-bots-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/slack.md#L705-L735
[slack-bots-code]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/slack/adapter.py#L4447-L4471
[slack-delivery]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/slack.md#L931-L945
[slack-exec-approval]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/slack/adapter.py#L4963-L4991
[slack-plugin-hooks]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/developer-guide/plugins/index.md#L1983-L2018
[google-skill]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/SKILL.md#L20-L43
[google-backend]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/scripts/google_api.py#L39-L112
[google-read]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/scripts/google_api.py#L340-L377
[google-search-page]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/scripts/google_api.py#L279-L335
[google-commands-mail]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/scripts/google_api.py#L1152-L1188
[google-commands-calendar]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/scripts/google_api.py#L1190-L1214
[google-calendar-read]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/scripts/google_api.py#L526-L576
[google-calendar-write]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/scripts/google_api.py#L580-L626
[google-rules]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/SKILL.md#L319-L325
[google-send]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/scripts/google_api.py#L380-L419
[mail-triage]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/email/email-inbox-triage/SKILL.md#L28-L70
[google-brief]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/references/daily-brief.md#L7-L39
[proton-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/email.md#L50-L75
[email-purpose]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/email.md#L7-L26
[email-connect]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/email/adapter.py#L586-L621
[email-send]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/email/adapter.py#L870-L890
[email-baseline]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/email/adapter.py#L561-L577
[email-fetch]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/platforms/email/adapter.py#L678-L717
[email-start-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/email.md#L123-L143
[himalaya-setup]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/email/himalaya/SKILL.md#L16-L80
[himalaya-mutations]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/email/himalaya/SKILL.md#L187-L250
[todo-store]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/tools/todo_tool.py#L1-L54
[todo-purpose]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/tools/todo_tool.py#L227-L277
[todo-resume]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/hermes_state_todo.py#L1-L40
[kanban]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/kanban.md#L7-L36
[kanban-fields]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/kanban.md#L127-L136
[todoist]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/optional-mcps/todoist/manifest.yaml#L1-L21
[cron-capabilities]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/cron.md#L7-L23
[cron-lifecycle]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/cron.md#L216-L289
[cron-ticker]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/cron.md#L354-L367
[cron-noagent-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/cron.md#L912-L932
[cron-noagent-code]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/cron/scheduler.py#L1530-L1582
[cron-catchup-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/cron.md#L1080-L1102
[cron-catchup-code]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/cron/jobs.py#L3099-L3127
[cron-grace]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/cron/jobs.py#L111-L116
[cron-expiry]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/cron/jobs.py#L3130-L3151
[timezone]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/hermes_time.py#L83-L134
[cron-wallclock]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/cron/jobs.py#L1203-L1232
[deepinfra]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/model-providers/deepinfra/__init__.py#L11-L67
[deepinfra-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/integrations/providers.md#L380-L382
[provider-plugins]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/developer-guide/model-provider-plugin.md#L7-L26
[provider-fields]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/developer-guide/model-provider-plugin.md#L92-L155
[anthropic-code]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/plugins/model-providers/anthropic/__init__.py#L49-L55
[anthropic-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/integrations/providers.md#L159-L176
[fallback]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/fallback-providers.md#L10-L40
[memory-switches]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/memory.md#L283-L309
[memory-init]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/agent/agent_init.py#L1210-L1252
[session-search]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/memory.md#L235-L258
[review-writes]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/memory.md#L364-L386
[review-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/memory.md#L427-L439
[review-code]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/agent/background_review.py#L228-L250
[curator]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/curator.md#L35-L66
[skill-write-gate]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/skills.md#L668-L699
[slack-voice]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/messaging/slack.md#L1003-L1008
[voice-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/voice-mode.md#L31-L66
[voice-interaction]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/voice-mode.md#L123-L158
[voice-code]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/tools/voice_client_config.py#L1-L30
[document-doc]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/document-extraction.md#L9-L40
[document-code]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/tools/read_extract.py#L1-L35
[docx-skill]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/docx/SKILL.md#L15-L58
[google-documents]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/productivity/google-workspace/SKILL.md#L270-L295
[delegation]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/delegation.md#L7-L11
[claude-skill]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/skills/autonomous-ai-agents/claude-code/SKILL.md#L14-L78
[mcp]: https://github.com/NousResearch/hermes-agent/blob/508d6ec24ed293e46e5d7d1b88a6d67285243d97/website/docs/user-guide/features/mcp.md#L13-L64
