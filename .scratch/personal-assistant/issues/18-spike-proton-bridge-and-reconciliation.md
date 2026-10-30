# Spike: Verify Proton Bridge integration and draft reconciliation

ID: 18
Parent: [Verify Proton Mail Bridge integration on the Linux agent host](12-verify-proton-bridge-integration.md)
Related: [Authorization and uncertain-action reconciliation](08-define-authorization-and-reconciliation.md)
Labels: wayfinder:research, spike
Type: research
Status: closed
Disposition: completed; all in-scope tests passed, including owner-confirmed recovered evidence
Assignee: none
Blocked by: none

## Mapping status

Completed and closed on 2026-10-27. The owner reports finding the remaining spike evidence and explicitly confirms all previously unrecorded in-scope tests passed. This supersedes earlier missing-evidence/open-status assessments. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md) records owner-confirmed passes separately from retained runner evidence. No further Proton spike tests or human observations are required.

Historical results below remain unchanged in substance. Missing artifact paths, exact version values, durations, and detailed observations are not invented. Previously excluded lock/suspend tests remain excluded. Production framework acceptance and unresolved product-policy choices remain specification/implementation work. No new live tests, cleanup, credential revocation, or permissions are implied by closure.

## Post-desktop-login reboot result, 2026-10-27

The owner rebooted normally and reports not restarting Bridge. Host boot time was 12:07:28 -07:00; a subsequent read-only probe and all three saved-draft reconciliations passed. [Retained reboot evidence](../../../docs/evidence/proton-post-reboot-2026-10-27.md). This establishes availability after desktop login without a manual Bridge restart, not before-login availability. The subsequent owner confirmation closes the remaining startup/keyring evidence requirements; no further observation is needed.

## Current recheck, 2026-10-27

After owner authorization, three resumed read-only watch cycles passed with three fixtures, zero newly observed UIDs, and unchanged UIDVALIDITY. Fresh read-only reconciliation verified all three saved draft actions without replay or cleanup. [Retained live results](../../../docs/evidence/live-checks-2026-10-27.md). This short check does not establish reboot or longevity behavior.

## Observed progress

Evidence reconciled on 2026-10-27. The [snapshot](../../../docs/integration-spike-snapshot.md#proton) distinguishes raw results, owner observations, and untested cases. Durable evidence copies are in `docs/evidence/`.

- Verified TLS/login, synthetic fixture reads, and draft creation passed in the recorded live run. The owner confirmed the original draft visible and editable. [Runner results](../../../docs/evidence/proton-runner-results-2026-10-26.md).
- Bridge omitted the custom tracking header. Reconciliation using exact unique subject, Message-ID, and draft flags verified the original draft without replay.
- [Process-crash results](../../../docs/evidence/proton-process-recovery-results.jsonl): after APPEND, one write, two verified reconciliations, and local replay refusal. Before APPEND, zero writes, two uncertain lookups, and local replay refusal. The deliberately uncertain no-write action must not be replayed.
- [Wire-loss results](../../../docs/evidence/proton-wire-results.jsonl): injection passed, draft verified, replay refused. Complete-literal transfer followed by lost inbound bytes was tested, not in-transfer truncation.
- [Watch results](../../../docs/evidence/proton-watch-results.jsonl): cycle 11 detected one new fixture; subsequent successful cycles did not repeat it. Cycles 25–29 failed during the owner-driven Bridge outage/reconnection; 30–32 recovered. UIDVALIDITY did not change. This was about six minutes, not a longevity test.
- [Follow-up results](../../../docs/evidence/proton-followup-results-2026-10-26.md) record all three saved drafts verified after restart and an initial reconciliation-command error whose cause was not established.
- All 50 Proton offline tests passed on 2026-10-27 within the [68-test combined run](../../../docs/evidence/offline-regression-2026-10-27.txt). This is not additional live integration evidence.

The owner has now explicitly confirmed that the wire-test draft `9c5a7318a97e466e8a4643d5ea1ea2ff` is editable and remains unsent, reporting this check was completed yesterday. This is owner-reported UI evidence in the current conversation, not a new live run. No repeat check is needed.

All remaining in-scope startup/keyring, longer monitoring, UIDVALIDITY-reset, in-transfer interruption, installation/configuration, and other spike evidence requirements are passed/complete by the owner's recovered-evidence confirmation. No further spike collection is needed. Production credential isolation and SMTP denial remain implementation verification. Lock and suspend were explicitly excluded and remain excluded, not passed. Cleanup is separate housekeeping, not a spike gate.

## Question

Can the Linux assistant reliably read, search, monitor, and create drafts in Proton Mail through Proton Mail Bridge running on the same host? The owner reports Bridge is installed and confirms this topology. Verify primary documentation for Linux and unattended operation, local mail protocols, TLS and authentication requirements, account eligibility, service startup and recovery, message identity and synchronization, and notification or polling options. Separate documented support from behavior needing an isolated test. Do not assume Bridge is an HTTPS API or that installation proves runtime compatibility. Email sending is prohibited; the selected design uses IMAP for drafts and denies SMTP access to the agent and mail adapter. Verify saved drafts are editable in the owner's Proton client and check duplicate-draft handling after uncertain writes. Initial source evidence is in [email draft permissions](../research/email-draft-permissions.md); the wider research remains open. Do not access production, accounts, credentials, or 1Password, and do not change the installed Bridge.

## Reconciliation questions transferred from authorization planning

- What IMAP responses and subsequent mailbox lookups establish whether a draft was saved, definitely failed, or remains uncertain after a timeout or cancellation?
- How do message identity and synchronization affect finding a draft after an interrupted write and avoiding duplicate creation?
- How can the adapter enforce read/search and draft creation while denying SMTP and ungranted mailbox mutations?

Follow the [confirmed authorization rules](08-define-authorization-and-reconciliation.md#answer), including at most two retries and pausing when a draft save remains uncertain. Draft editing/deletion remains unauthorized; the calendar duplicate-cleanup exception does not apply to drafts.

## Completion evidence

Record primary-source findings and identify isolated tests still needed, including whether saved drafts are editable in the owner's Proton client. Do not treat the reported Bridge installation as proof of integration compatibility.
