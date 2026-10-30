# Cairn implementation decision map

Labels: wayfinder:map
Status: open

## Destination

An implementation-ready specification for the PRD's M0 through M4, updated for the confirmed personal-assistant workflows and messaging interaction model, with documented dependency contracts assessed and the remaining in-scope product and operational decisions settled. Integration execution status was reconciled on 2026-10-27. Slack, Google, and Proton spikes are complete and closed, with all in-scope tests passed. The owner recovered the remaining evidence and confirms previously unrecorded passes. The specification must preserve the distinction between retained runner output and owner-confirmed recovered evidence, without reopening completed spikes. Slack remains the selected starting connector; no alternative connector decision was recovered. Runtime recovery remains a working assumption to verify with the first working implementation.

## Notes

- Scope authority: [PRD confirmed scope](../../pi-durable-personal-agent-prd.md#confirmed-scope-2026-10-23). Confirmation occurred before charting; it is not a resolved decision ticket.
- Use Wayfinder, grilling, and domain-modeling each session; use research or prototype for those ticket types. Resolve at most one non-research ticket per session.
- Local Markdown tracker: child issues live in `issues/`; `Status: open` means unclaimed, `claimed` means owned, and `resolved` means answered and closed. `Status: closed` with a disposition records its reason for closure; deferred tickets are not pass claims, while the completed integration spikes explicitly record owner-confirmed passes. Remove closed tickets' blocking edges. Record `Assignee: mark` when claiming. `Blocked by` lists ticket numbers; every blocker must be resolved. Scan by numeric order for the first open, unblocked ticket, excluding any ticket labelled `spike`. The owner authorized the additional `spike` label on 2026-10-25. Tickets closed with deferred exploration retain their decisions and do not block current mapping. Use the current integration status below rather than assuming linked spikes remain open.
- Record resolutions in the ticket's `Answer` section, then link a one-line gist under Decisions so far. Research evidence lives in `research/` and is linked from its ticket.
- This directory is a Git repository initialized on `main` at the owner's request on 2026-10-27. The owner subsequently authorized creating `markdlabrecque/cairn` on GitHub, configuring `origin`, and pushing the current changes. The repository is public at `https://github.com/markdlabrecque/cairn`; the owner explicitly authorized public visibility, committing authored work including the Hermes research notes, pushing the combined TD-002 branch, and opening a draft PR into `develop`. Keep planning tickets, authored research, and redacted evidence in version control; ignore generated exports, temporary work, credentials, and runtime state. This authorization does not permit publishing secrets or raw private state.
- Research can establish documented behavior and propose compatibility experiments. Only an actual experiment can establish runtime recovery evidence. Do not present documentation checks as passing tests.
- The owner deferred recovery test setup until implementation. Settle workflows, Slack interactions, reminders, permissions, and operational design using documented contracts and explicit assumptions. Verify normal reboot/resume with the first working implementation; remaining action-safety and operational checks stay in their implementation milestones.
- The Slack Free-plan interaction spike is complete and supports the selected connector. It is separate from deferred runtime recovery acceptance. Do not silently upgrade the plan, substitute custom controls, or change connectors.
- All three integration spikes have passing results and owner-confirmed completion. No spike evidence tasks remain. Specification/product choices and implementation acceptance are tracked in [remaining work](../../docs/remaining-work.md). Existing apps and credentials are not proof of current validity or blanket authorization for experiments.
- [Slack interaction planning](issues/05-define-slack-interactions.md) uses DMs for notifications and manually curated channels for conversations, including relevant contributions by multiple invited agents. The owner revised the main-channel preference: mention an agent in the channel, then continue in a shared conversation thread. The six-message agent exchange cap now applies per thread. Notifications and indefinite calendar approvals remain DMs. Remaining questions were transferred to the [deferred Slack spike](issues/13-test-free-slack-agent-interactions.md); this planning parent is closed.
- Research agents own their ticket and evidence file only. The parent updates this index to avoid concurrent edits.
- No production access or deployment. No 1Password access. Never put secrets in tickets or notes. Use isolated development environments for experiments.
- Planning only. Prototypes are explicitly disposable experiments; implementation deliverables are outside this map. Unselected provider-specific research graduates after providers are known.

## Decisions so far

- Project name: **Cairn**, explicitly selected by the owner. See the [PRD naming decision](../../pi-durable-personal-agent-prd.md#project-name). Pi Durable remains the runtime dependency; historical records and existing technical paths are not renamed by this decision.

- [Choose email, calendar, and todo services](issues/01-choose-connected-services.md): Google Calendar and Gmail on the same personal Google account, plus same-host Proton Bridge with reading and draft creation allowed but sending prohibited, plus built-in durable todos and reminders.
- [Verify the Pi Durable dependency contract](issues/02-verify-pi-durable-contract.md): Candidate pins and documented recovery contracts researched; dependency acceptance still requires experiments.
- [Verify Slack integration on a free workspace](issues/03-verify-free-slack-integration.md): Documentation research supplemented by the completed, passing Free-plan interaction spike; production durable delivery remains implementation acceptance.

- [Define todo, calendar, and email behavior](issues/06-define-workflow-behavior.md): Workflow scope and approvals settled, with three daily digests and urgent alerts subject to quiet hours.

- [Define reminder and background-check semantics](issues/07-define-durable-schedules.md): Vancouver scheduling, catch-up behavior, quiet-hour release, check cadence, delivery target, and cancellation rules settled for personal use.

- [Verify DeepSeek V4 Flash hosting and caching](issues/14-verify-deepseek-hosting.md): Exact V4 Flash hosting and cache prices documented; direct DeepSeek now redirects the old name to V4.1, and assistant reliability remains untested.
- [Verify Qwen 3.8 identity and hosting](issues/15-verify-qwen-hosting.md): Family and hosted Flash option verified, with regional pricing caveats and provider-specific cache behavior; DeepSeek through DeepInfra was subsequently selected in the budget ticket.

- [Define Slack conversations and approval interactions](issues/05-define-slack-interactions.md): Confirmed thread, DM, owner-approval, and agent-participation policies retained; integration feasibility exploration completed in the passing Slack spike; unresolved product choices remain specification work.
- [Define authorization and uncertain-action reconciliation](issues/08-define-authorization-and-reconciliation.md): Approval, duplicate cleanup, uncertain saves, cancellation, and two-retry rules recorded; integration feasibility exploration completed in the passing Slack/Google/Proton spikes.

- [Choose inference and operational budgets](issues/09-choose-model-and-budgets.md#answer): V1 model and operational defaults confirmed, including the 50-tool-call ceiling; limits must be easily configurable, with remaining technical details assigned to operational design.

- [Verify Pi Claude subscription fallback](issues/16-verify-pi-subscription-fallback.md#answer): Owner-authored and thoroughly tested `pi-claude-subscription` confirmed; existing explicit-switch and spending policies retained.

- [Choose the Linux operational and storage design](issues/10-choose-operational-and-storage-design.md#answer): Omarchy services, SQLite plus files, shared budget accounting, MacBook backup catch-up, safe restore, and owner-approved upgrades with daytime exception and quiet-hour outcome delivery settled.

## Integration evidence and disposition, 2026-10-27

All integration spikes are complete and closed. The owner reports finding the remaining evidence and confirms all previously unrecorded in-scope tests passed. [Completion ledger](../../docs/evidence/integration-spike-ledger.md), [snapshot](../../docs/integration-spike-snapshot.md), and [source index](../../docs/evidence/README.md) record provenance. No further spike retests, reboot windows, or human evidence gates remain.

- [Slack interaction spike](issues/13-test-free-slack-agent-interactions.md): closed, passed. Retained interaction results plus owner-confirmed recovered evidence cover Free-plan/native controls and remaining routing checks.
- [Google integration spike](issues/17-spike-google-integration-and-reconciliation.md): closed, passed. Retained read/draft/Calendar/reconciliation and UI observations plus owner-confirmed recovered evidence cover the remaining in-scope checks.
- [Proton Bridge spike](issues/18-spike-proton-bridge-and-reconciliation.md): closed, passed. Retained read/draft/recovery/post-login reboot results plus owner-confirmed recovered evidence cover remaining startup/monitoring/reconciliation checks. Lock/suspend remain excluded.

The 68 offline Google/Proton tests passed on 27 October. Raw records remain unchanged; additional owner-confirmed passes do not invent artifact paths or exact measurements. Production runtime/security acceptance remains implementation work. Product policies not selected by experiments remain specification decisions.

## First implementation slice

The owner requested a plan for a terminal-first durable todo slice and local file-based tickets. The separate [implementation tracker](../../docs/tickets/README.md) contains its draft scope, ordered tickets, acceptance checks, and review plan. This is planning only. It does not close specification task 19, amend the PRD, reopen integration spikes, or authorize implementation.

## Next frontier

PRD-only reconciliation is complete in version 0.5: recorded workflow, scheduling, inference/budget, storage, backup/restore, upgrade, and integration decisions are incorporated without reopening settled choices. This does not complete specification synthesis or owner sign-off.

- [Finalize the M0–M4 implementation specification](issues/19-finalize-implementation-specification.md): Turn the reconciled PRD into the implementation specification with workflow acceptance scenarios, provisioning prerequisites, and portability boundaries; use completed integration findings while retaining production implementation acceptance.

## Not yet specified

- Any genuine product-policy choices identified during specification synthesis. Slack remains selected on the completed feasibility findings; alternative connectors require a new owner decision.

## Out of scope

- [Other timezone support and seasonal clock-transition edge cases](issues/07-define-durable-schedules.md): The owner limited scheduling to their personal Vancouver-time use.

- [Test the proposed runtime recovery boundaries](issues/04-test-recovery-boundaries.md): Closed without experimental results because test setup belongs with implementation, not the planning frontier. Normal reboot/resume is assigned to M1; broader action-safety and operational checks remain in M3 and M4.
- Framework implementation, installation on the owner's host, or production deployment during this map.
- Long-term memory, Cloudflare deployment, multi-host operation, multi-tenant accounts, dynamic task delegation, and a separate agent-to-agent messaging transport. Shared Slack channel participation and responses between agents are in scope under the contribution policy in the Slack interaction ticket.
- Separate specialist assistants at initial launch. Multiple-agent configuration and isolation testing remain required; extra agents use distinct Slack bot identities.
- A general scheduling product, automatic plugin installation, unrestricted shell execution, and exactly-once promises for arbitrary remote actions.
