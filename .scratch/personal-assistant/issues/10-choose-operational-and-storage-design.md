# Choose the Linux operational and storage design

ID: 10
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:grilling
Type: grilling
Status: resolved
Assignee: mark
Blocked by: 07, 09

## Integration completion update, 2026-10-27

Slack, Google, and Proton integration spikes are complete and closed. The owner found the remaining evidence and explicitly confirms all previously unrecorded in-scope tests passed. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md). Earlier deferred/unverified language below is historical, not an outstanding test requirement. Existing confirmed policies remain unchanged; genuinely unresolved product choices belong to specification synthesis, and production acceptance belongs to implementation.

## Question

Given documented runtime contracts and agreed workflow behavior, which minimal storage boundaries, ownership locks, service topology, wakeup mechanism, credential loading, backup/restore procedure, and upgrade checks should satisfy them? Specify cross-store atomicity and scheduling recovery explicitly. Keep host dependencies behind narrow interfaces and list Cloudflare gaps without implementing Cloudflare. Link documentation evidence and distinguish it from runtime assumptions to verify during implementation. Recovery experiments are not a prerequisite to this design decision.

## Dependencies

- [Define reminder and background-check semantics](07-define-durable-schedules.md)
- [Define authorization and uncertain-action reconciliation](08-define-authorization-and-reconciliation.md)
- [Choose inference and operational budgets](09-choose-model-and-budgets.md)

## Deferred integration assumptions

The authorization ticket is closed for current mapping with its confirmed policies retained. Slack, Google, and Proton investigations are separate deferred `spike` tickets and do not block this design discussion. Record any assumptions that depend on their eventual results; closure is not verification.

## Technical details carried forward from the resolved budget decision

Use the [confirmed configurable budget defaults](09-choose-model-and-budgets.md#answer). Do not reopen those owner decisions. Specify how named, documented configuration settings are validated and applied at run boundaries, with effective values visible to the owner and no code edits needed for tuning.

- Choose connection and inactivity thresholds and retry-delay behavior while distinguishing stalled connections from progressing responses. No blanket two-minute response timeout was approved.
- Define safe cleanup of action and deduplication records without deleting records still needed for unfinished work or duplicate prevention. Keep this separate from routine diagnostic-log retention.
- Specify how concurrency, queue capacity, and finite time/model/tool budgets are enforced when work waits, resumes, or survives restart.

Keep these operational values configurable. The budget ticket is resolved, so it no longer blocks this ticket.

## Discussion — 2026-10-25 (in progress)

Confirmed by owner:

- Main agent host is the owner's Omarchy machine. Retain the Slack gateway plus one systemd service per agent; Proton Bridge stays a separate service on that host.
- Send encrypted daily backups to the owner's MacBook over its existing Tailscale connection. If unavailable, retry hourly. Continue creating daily backups locally while disconnected and transfer all missing backups when the MacBook reconnects, including after several days. Retain pending transfers durably across restart.
- Owner subsequently approved SQLite per agent for conversations, execution state, approvals, reminders, and action records, with large documents/attachments/audio stored as referenced files and future search indexes separately rebuildable. Keep storage access behind narrow interfaces. Revisit on measured write contention, retrieval performance, or backup/restore problems; backend migration remains explicit work, not an automatic consequence of adapter support.

Design consequences to settle:

- Offline MacBook periods necessarily extend the off-host recovery-point age beyond the earlier 24-hour objective. Show both latest local snapshot and latest verified MacBook backup.
- Preserve daily snapshots awaiting transfer; clarify interaction with the previously agreed 30-daily-backup retention policy before pruning any untransferred backup.
- Transfer consistent, encrypted snapshots, not a synchronized live database. Verify completed transfer before recording it as delivered. Encryption-key recovery and restore remain undecided.

Storage evidence: [SQLite appropriate uses](https://www.sqlite.org/whentouse.html) identifies concurrent writes and network filesystem access as reasons to prefer client/server storage. Current one-active-request-per-agent, single-host requirements suggest SQLite remains suitable, but this is a design assessment, not a benchmark. See the [existing Pi Durable contract research](../research/pi-durable-contract.md) for transaction and adapter assumptions requiring implementation verification.

### Follow-up confirmation — 2026-10-25

Owner: “Agree with all.” Confirms the refined SQLite-plus-files design and preservation of all untransferred daily backups even beyond the normal 30-day retention window. Alert on low disk space rather than silently deleting pending backups. Show latest local snapshot and latest verified MacBook transfer separately. MacBook-offline periods necessarily extend off-host recovery-point age beyond the 24-hour target. These are accepted planning decisions; no deployment or backup setup is claimed.

Remaining discussion includes durability settings, locks and wakeups, credential loading, encryption-key recovery, restore safety, retry thresholds, record cleanup, persisted budget enforcement, upgrades, and portability gaps. Ticket remains claimed and unresolved.

### Durability, credentials, and restore confirmation — 2026-10-25

Owner approved Q5–Q8, specifying 1Password as the third key location:

- Accepted work must survive sudden host power loss, not just process restart. Use SQLite synchronous=FULL with acknowledgements after durable commit; verify effective settings and recovery in implementation. Existing adapter defaults are not sufficient evidence.
- Linux services load credentials from protected host-managed files available only to the service needing them. Secrets do not enter agent configuration, transcripts, or model context; trusted adapters expose permitted operations.
- Omarchy holds only the backup encryption key. Keep the decryption key on the MacBook and an additional owner-managed recovery copy in the owner's 1Password account. This does not authorize agent or session access to 1Password. Exact provisioning remains implementation work.
- After restoring an older backup, initially pause external writes, reconcile actions that may have completed after the snapshot, and obtain owner confirmation before resuming normal operation. Uncertain outcomes remain subject to existing no-blind-retry rules. No claim that every remote effect can be discovered automatically.

Remaining frontier: ownership and wakeups, backup scheduling/restore mechanics, connection/inactivity thresholds and retry delays, record cleanup, durable budget/queue enforcement, upgrade policy, and portability gaps.

### V1 operating rules confirmed — 2026-10-25

Owner: “all fine for v1,” approving Q9–Q12:

- Exclusive host ownership lock per agent; a second process refuses the same store. systemd restarts failed services and starts them after reboot. Persist reminder deadlines and background-check schedules; recover due work on startup using confirmed catch-up rules.
- Configurable model connection establishment timeout: 30 seconds. Configurable response inactivity timeout: 90 seconds without progress. Progressing responses remain subject to the overall authorized active-work budget. Up to the previously agreed two retries, with approximate delays of 5 and 20 seconds; honor provider retry instructions within remaining budget. These delays do not authorize blind retries of uncertain external writes.
- Consumed active time, model/tool-call counts, queues, and spending reservations survive restart. Resume does not reset limits. Reserve estimated model cost before dispatch, reconcile actual usage afterward, and conservatively retain unresolved charge reservations.
- Retain compact action IDs, outcomes, and deduplication keys indefinitely for V1, separately from routine diagnostic logs (30-day retention). Explicit owner deletion requires handling any resulting duplicate-prevention implications.

Remaining choices: consistent backup/restore mechanics, upgrades, and cross-agent monthly budget coordination. Once settled, document narrow host interfaces, cross-store recovery, configuration application, verification requirements, and Cloudflare gaps as consequences of the approved design.

## Answer

Resolved through the live owner discussion on 2026-10-25. The confirmations above retain the detailed decisions; this section completes the design and defines their implementation consequences. Documentation is evidence of available mechanisms, not passing runtime tests.

### Final owner confirmation

- Back up consistent database snapshots, referenced files, configuration, and recovery credentials, encrypted as one recoverable backup set. Create daily at 03:00 America/Vancouver, catch up after host downtime, and retry missing MacBook transfers hourly. Verify integrity before marking delivery complete. Prove isolated restore with external actions disabled during implementation.
- Upgrades require explicit owner approval for the particular proposed upgrade. Perform after midnight Vancouver time and before morning notification hours: use 00:00–08:00 America/Vancouver as the eligible maintenance window. Approval is not blanket permission for future updates. If approval or preconditions are absent, defer; never run automatically during daytime to catch up. The owner subsequently authorized an explicit daytime exception: a direct owner request may schedule an upgrade at midday or another daytime time, but active work must drain before it starts. Approval for a routine overnight upgrade alone does not authorize daytime execution.
- Persist upgrade outcome and an explanation of what changed or why it failed. Deliver an explicit success/failure notification after quiet hours end at 08:00 Vancouver, or when messaging next becomes available. No overnight upgrade notifications, including failures. Pending outcomes survive restart and are not suppressed by the rule that routine successful checks stay quiet.
- Drain active work, preserve queues, make a pre-upgrade backup, check version compatibility, apply the approved update/migrations, then check startup and recovery. Stop on failure; never run an older binary against a potentially incompatible migrated store. A restore follows the approved reconciliation and owner-resumption procedure.
- All agents share the US$10 monthly model allowance and US$5 warning, using one host-level spending ledger. Atomically reserve estimated call cost before dispatch; retain unresolved reservations until reconciled. This is separate from each agent's workflow database.

### Ownership and transaction boundaries

- One gateway and one systemd service per agent on Omarchy; Bridge remains separate. Canonical store identity and an OS lock prevent aliases or duplicate launchers from acquiring the same agent. Do not allow the MacBook to run restored agents while Omarchy remains active.
- Keep workflow state in Pi-supported transactional application documents where possible; do not mutate Pi internal tables. Verify the chosen adapter can commit application state with the relevant execution checkpoint. If it requires substantial replacement machinery, return for a dependency decision.
- Gateway admission must not report owner-visible acceptance until the target agent durably records its input and capacity decision. A transport acknowledgement alone is not a durable acceptance receipt. Stable source/destination IDs and payload digests handle redelivery. Never silently retain rejected queue-full work for later execution.
- No distributed transaction is claimed between workflow databases, the spending ledger, files, or remote APIs. Use stable request/action/reservation IDs. Persist a call intent, acquire an idempotent ledger reservation, persist dispatch state, then invoke the provider. An interrupted or ambiguous dispatch is reconciled conservatively; no reservation is silently freed merely because a process died. Unknown pricing or insufficient reservation capacity blocks a call rather than bypassing the cap. Reconcile reported usage; unexpected provider charges remain visible and pause further calls if the budget is exhausted. Application accounting is not a provider-side hard billing guarantee.
- Publish referenced files durably before committing their references; orphan files may be collected only after confirming no live record or retained snapshot references them. Backup manifests pin referenced files so cleanup cannot race backup creation.
- Single-agent transactions protect local queue admission and continuation ownership. Waiting work keeps its durable identity and counters but releases the active slot. Continuations reacquire that slot without resetting limits. Coalesce background checks by source; never discard distinct owner requests or reminder occurrences. Deterministic due-notification work must remain eligible without model calls while model work waits or spending is paused.

### Scheduling, backup, and restore mechanics

- Pi persists task deadlines; a live runner wakes due tasks and systemd starts/restarts the runner after host failure. Reopen and resume then process overdue work according to the resolved scheduling ticket. Implementation must prove that recovery re-arms outstanding deadlines.
- A host backup job, independent of model inference and spending, persists daily snapshot and transfer status. On reboot, create a current catch-up snapshot; do not fabricate historical snapshots for days when the host was off. Preserve every actual daily snapshot made while the MacBook was unavailable.
- Use a consistent SQLite backup facility or quiesced snapshot, never raw copying of a live SQLite main file without its transactional state. Coordinate agent databases, the shared ledger, and immutable referenced files as a backup set, with a manifest of schema/config/runtime versions and integrity checks. Quiesce admissions/dispatch at a safe boundary for the set; record in-flight uncertainty rather than pretending remote APIs share the snapshot transaction.
- Encrypt before transfer. Omarchy has only the public encryption key; MacBook holds the private decryption key with an owner-managed recovery copy in 1Password. Dedicated restricted transfer credentials reach only the backup destination over Tailscale. No agent or session access to 1Password is authorized.
- Keep 30 daily delivered backups, plus every untransferred daily snapshot regardless of age. Verify complete transfers before recording delivery. Alert on disk pressure and failed backups without silently deleting pending snapshots. Avoid overlapping backup jobs. Expose latest local snapshot, latest verified MacBook transfer, outstanding transfers, and oldest pending date.
- Restore requires stopping or isolating the previous owner, selecting a verified backup, obtaining the recovery key, decrypting, checking manifest/schema/integrity, restoring files and restricted credential permissions, and starting in recovery mode with external writes disabled. Reconcile actions since the snapshot; uncertain effects require owner decisions. Reconcile spending conservatively because the restored ledger may omit newer charges. Require owner confirmation before normal external writes resume. Retain the one-day restoration objective; 24-hour off-host recovery-point age cannot be met during MacBook disconnection.

### Configuration and limits

Use named, documented, validated settings, including `model.connect_timeout_seconds=30`, `model.inactivity_timeout_seconds=90`, `model.retry_delays_seconds=[5,20]`, `backup.daily_time=03:00`, `backup.timezone=America/Vancouver`, `backup.transfer_retry_seconds=3600`, `backup.delivered_daily_retention=30`, `upgrade.window_start=00:00`, `upgrade.window_end=08:00`, and `upgrade.notification_release_time=08:00`. Retain the budget ticket's owner-approved defaults for retries, time/call budgets, queue capacity, concurrency, spending, and log retention; expose their effective values too. Settings do not authorize unattended upgrades, raising limits, automatic model switching, or weaker permissions.

Validate all values and relationships before activation. Apply ordinary configuration changes at run boundaries and retain accepted-work revisions. Previously consumed counters and reservations are durable. Current revocations still constrain the next operation. Persist active-work charges before irreversible dispatch; recovery must not award time already consumed, and a resumed run cannot gain a fresh budget. Progress resets inactivity only on meaningful provider progress, not connection keepalives. Every call and retry remains subject to the remaining active-work and spending allowance.

Retain compact action/deduplication records indefinitely for V1, and unfinished work until explicitly resolved. Diagnostic cleanup never removes these records. Store transcripts and documents for selective retrieval; large content is referenced rather than loaded wholesale. Backend migration is explicit work with verification; evaluate it on measured contention, retrieval, or restore/backup limitations.

### Host interfaces and Cloudflare gaps

Keep ownership locking, service lifecycle, durable storage transactions, wakeup scheduling, credential resolution, backup/restore, provider inference, and messaging behind narrow interfaces. Workflow rules must not invoke systemd or host filesystem APIs directly.

A later Cloudflare effort must replace systemd/process locks, local SQLite and file publication, timer/startup wakeups, host secret files, Tailscale backup transfer, and same-host Proton Bridge. Durable Object storage/alarms are candidates, not established equivalent transaction or recovery behavior. Cross-agent spending coordination needs a single authority there too. No Cloudflare implementation or multi-host failover is included.

### Implementation evidence required

Verify effective FULL durability and acknowledgement ordering; alias/duplicate-launcher exclusion; queue/counter/reservation persistence; deadline recovery after normal reboot; SQLite/application transaction participation; backup consistency and encrypted catch-up transfer; key recovery; isolated restore and reconciliation; maintenance-window enforcement, explicit owner-requested daytime exceptions with drain-before-upgrade, and morning outcome delivery; upgrade failure behavior. Retain the deferred Slack/Google/Proton spikes as explicit integration assumptions. No installation, live backup, upgrade, or runtime test occurred in this planning session.

Evidence: [pinned Pi Durable contract research](../research/pi-durable-contract.md), including SQLite adapter settings, application document commits, and persisted wakeups; [SQLite workload guidance](https://www.sqlite.org/whentouse.html). Requirements above still need implementation verification.

### Daytime upgrade clarification — 2026-10-25

The owner may explicitly call for a midday upgrade. Drain active work before starting, preserve queued/waiting state, and apply the same backup, compatibility, and recovery safeguards. This overrides the default overnight window only for the explicitly requested upgrade. Daytime outcomes may be reported immediately outside quiet hours; overnight outcomes remain held until morning.
