# Finalize the M0–M4 implementation specification

ID: 19
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:task
Type: task (AFK)
Status: open
Assignee: none
Blocked by: none

## Question

Reconcile the PRD with the resolved planning decisions so an implementer has consistent M0–M4 boundaries and concrete acceptance scenarios. Remove superseded proposals, identify unresolved integration assumptions without claiming verification, and determine whether any genuine decision still blocks implementation-ready handoff. This is specification synthesis, not framework implementation or repetition of completed integration spikes.

## Evidence reconciliation, 2026-10-27

Slack, Google, and Proton spikes are complete and closed with all in-scope tests passed. The owner reports recovering the remaining evidence and explicitly confirms previously unrecorded tests passed. Use the [completion ledger](../../../docs/evidence/integration-spike-ledger.md), [snapshot](../../../docs/integration-spike-snapshot.md), and [remaining work](../../../docs/remaining-work.md) during synthesis. Preserve provenance: owner-confirmed recovered evidence is distinct from locally retained runner output. No further spike tests or human evidence gates remain. Resolve any genuine product-policy choices without reopening completed feasibility work. Production runtime/security acceptance remains implementation work. This tracker update does not complete the implementation specification.

## PRD reconciliation progress, 2026-10-27

Completed the owner's requested PRD-only reconciliation in version 0.5. The PRD now includes the settled workflow/scheduling rules, exact default limits and timeouts, confirmed fallback, shared spending/reservation handling, SQLite/file durability, retention, MacBook backup/restore/key recovery, and approved upgrade policy. It removes superseded open-choice statements and reconciles Slack as the selected owner interface, indefinite Calendar approval, and retained-history retrieval. Completed spikes remain closed with evidence provenance intact.

This is step 1 only. The M0–M4 implementation-ready specification, additional workflow acceptance scenarios, final product-policy review, and owner sign-off are not complete. This ticket remains open; no implementation, live tests, or new mapping tickets were started.

## Required coverage

- Gateway acceptance, per-agent storage, shared budget ledger, atomicity gaps and conservative recovery.
- Todos, reminders, calendar approvals/reconciliation, email reads/drafts with sending prohibited, Slack interactions, observed feasibility, and remaining evidence limits.
- Persisted limits, queue release/resumption, schedules and catch-up, configurable defaults.
- Encrypted daily MacBook backups over Tailscale, hourly retry and missing-snapshot catch-up, retention exceptions, 1Password owner-managed key recovery, restore reconciliation.
- Explicitly approved overnight upgrades, owner-requested daytime exception, active-work draining, morning notification for overnight success/failure.
- Narrow host interfaces, Cloudflare portability gaps, credential provisioning prerequisites and implementation verification.

Use the resolved [operational and storage design](10-choose-operational-and-storage-design.md#answer) and other decision tickets as authorities. Existing docs are not passing runtime evidence. Surface genuinely new decisions for the owner rather than silently choosing new product policies.
