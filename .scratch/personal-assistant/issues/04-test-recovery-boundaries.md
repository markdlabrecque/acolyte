# Test the proposed runtime recovery boundaries

ID: 04
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:prototype
Type: prototype
Status: closed
Disposition: deferred to implementation; not experimentally resolved
Assignee: none
Blocked by: 02

## Question

Which pinned Pi Durable/runtime/storage combination and application boundaries survive controlled interruptions without losing acknowledged work or blindly repeating effects? Agree a disposable isolated experiment with the owner, then demonstrate reopen/resume, intent-versus-result crashes, persisted approval, and retry wakeups. Record observed evidence and get the owner's decision on proceeding or reopening the dependency choice. This is a prototype, not the M1 implementation.

## Dependencies

- [Verify the Pi Durable dependency contract](02-verify-pi-durable-contract.md)

## Disposition

On 2026-10-23 the owner confirmed that recovery test setup should move later, after higher-level product and design decisions. This ticket is closed out of the Wayfinder planning scope, not resolved by test evidence. No experiment was run.

Use Pi Durable's documented recovery as a working assumption while defining workflows, Slack interactions, reminders, permissions, and operational design. Verify normal reboot/resume through systemd and the same persistent store with the first working implementation in M1. Retain action-safety checks in M3 and operational recovery checks in M4. The earlier hard-shutdown spike proposal below is superseded and is not an approved immediate task.

## Earlier planning discussion, superseded

The owner explicitly requested planning this disposable recovery spike in the voice conversation on 2026-10-23. Execution has not been requested or performed.

Proposed setup: isolated Linux environment, pinned Pi Durable and runtime versions, scratch SQLite storage, deterministic model responses, and a fake external service with an independent effect log. No real accounts, production access, or credentials.

Proposed checks: accepted-input recovery and duplicate submission; interruption before and after an external effect and its stored result; uncertain effects blocking fresh equivalent actions; persisted approval and permission revocation; persisted retry/reminder wakeups. Record the smallest application-owned guards needed and stop for a dependency decision if a separate execution engine is required.

First open scope decision: test process interruption only, or also require evidence for abrupt host shutdown using a disposable VM. Recommend including the latter as a separate test tier. A process kill or VM reset alone cannot establish physical disk power-loss guarantees.
