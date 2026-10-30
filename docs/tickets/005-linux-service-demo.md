# Run and demonstrate the slice as isolated Linux services

ID: TD-005
Type: implementation
Status: draft
Assignee: none
Parent: [TD-001](001-crash-safe-todo-slice.md)
Depends on: TD-004

## Outcome

The owner can start the local gateway and agent with documented service units, submit a request, restart the agent, and retrieve the same result. A recorded isolated crash demo proves the agreed local todo behavior.

## Implementation

1. Supply a gateway unit and parameterized agent unit. Use unprivileged execution, explicit writable state paths, protected credential files, and a permission-restricted runner socket. Keep provider credentials out of the gateway.
2. Make startup validate configuration, acquire canonical-store ownership, open and inspect storage, and restore eligible work before readiness. Refuse incompatible/corrupt state without replacing it.
3. Distinguish liveness from readiness and blocked work. Expose receipt state, queue depth, current work, remaining request budgets, spending, uncertain reservations, and last failure through CLI status. Mark backup freshness as not configured, not healthy.
4. Stop admissions during orderly shutdown and preserve queued/pending work. Persist outcomes before exit where possible. Show that forced termination does not depend on orderly shutdown.
5. Write a short demo runbook using a dedicated development state directory and synthetic todos. Give the owner a clear stop command and describe retained data. Cleanup is manual and separately authorized.
6. Record deterministic crash-test results and a bounded, explicitly authorized real-model smoke. Report provider/model, actual versions, test commands, request/action IDs, effect counts, and charged or uncertain usage. Keep credentials and private content out.
7. Run service-start/restart checks only in an authorized isolated Linux environment. Do not install units or reboot the owner's machine as part of writing this ticket or preparing the demo.

## Proposed files

- `deploy/systemd/personal-agent-gateway.service`
- `deploy/systemd/personal-agent@.service`
- `tests/services.test.ts`
- `docs/todo-demo.md`
- Extend existing runtime, host, and CLI modules only as needed.

## Acceptance

- [ ] Service units pass syntax validation and run in the isolated test environment. Syntax validation alone is not service acceptance.
- [ ] Gateway restart preserves request identity. Runner downtime returns retryable unavailability rather than false acceptance or not-found.
- [ ] Runner restart reopens the same store and resumes eligible work. The CLI retrieves an already committed result without model activity.
- [ ] A second writer, including an alternate path/symlink or configuration alias, fails before processing.
- [ ] Unavailable, corrupt, or incompatible storage fails readiness and preserves evidence. It never creates an empty replacement.
- [ ] Status explains queued, running, retrying, owner-waiting, completed, and failed requests. No unimplemented approval or backup feature reports success.
- [ ] A deterministic crash after the todo commit leaves one todo, one action result, and the original request identity.
- [ ] The real-model add/list smoke has explicit authorization, recorded bounded usage, and no provider substitution.
- [ ] The runbook labels process-kill, service restart, and normal reboot as distinct tests. Normal reboot and power-loss claims remain unproved unless separately authorized and executed.
- [ ] No Slack, Google, Proton, production server, 1Password, backup destination, or existing spike journal was accessed or changed.

## Follow-on boundary

This ticket ends the proposed terminal slice. It does not close M1, M2, M3, M4, or specification task 19. Slack admission/delivery is the proposed next slice, subject to its unresolved owner-facing behavior and separate approval. Full todo completion, reminders, approvals, and remote effects remain later work.

## Evidence

Pending. No units installed, host changes made, or runtime demonstration executed.
