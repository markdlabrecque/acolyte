# Verify Proton Mail Bridge integration on the Linux agent host

ID: 12
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:research
Type: research
Status: closed
Disposition: deferred-to-spike
Assignee: none
Blocked by: none

## Question

Can the Linux assistant reliably read, search, monitor, and create drafts in Proton Mail through Proton Mail Bridge running on the same host? The owner reports Bridge is installed and confirms this topology. Verify primary documentation for Linux and unattended operation, local mail protocols, TLS and authentication requirements, account eligibility, service startup and recovery, message identity and synchronization, and notification or polling options. Separate documented support from behavior needing an isolated test. Do not assume Bridge is an HTTPS API or that installation proves runtime compatibility. Email sending is prohibited; the selected design uses IMAP for drafts and denies SMTP access to the agent and mail adapter. Verify saved drafts are editable in the owner's Proton client and check duplicate-draft handling after uncertain writes. Initial source evidence is in [email draft permissions](../research/email-draft-permissions.md); the wider research remains open. Do not access production, accounts, credentials, or 1Password, and do not change the installed Bridge.

## Current evidence, 2026-10-27

The linked [Proton spike](18-spike-proton-bridge-and-reconciliation.md) is complete and closed, with all in-scope tests passed. Retained read/draft/recovery and post-login reboot results are supplemented by the owner's report of recovered evidence for the remaining tests. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md). No operational evidence task remains. Production security acceptance remains implementation work; the original deferral below is historical.

## Closure, 2026-10-25

Closed for current mapping at the owner's request. Remaining exploration is transferred to the [deferred spike](18-spike-proton-bridge-and-reconciliation.md), labelled `spike` and excluded from the current mapping frontier. Existing decisions and evidence remain valid; closure does not mean the deferred questions were answered or experiments passed.
