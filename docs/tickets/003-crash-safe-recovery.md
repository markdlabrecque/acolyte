# Preserve receipts, todos, and results through crashes

ID: TD-003
Type: implementation
Status: draft
Assignee: none
Parent: [TD-001](001-crash-safe-todo-slice.md)
Depends on: TD-002

## Outcome

A fresh process continues an admitted request with the same request and action identity. A committed todo is not inserted again. A committed final response is not regenerated.

## Implementation

1. Add an isolated subprocess test controller with named failpoints. Wait for explicit IPC barriers before SIGKILL. Use bounded waits and preserve failure diagnostics. Do not use timing sleeps as proof of the commit location.
2. Observe effect counts and provider attempts independently of transcript text. Reopen the same test store using a new OS process for each recovery.
3. Make each durable receipt map to one Pi submission. If application admission and Pi submission cannot share a supported transaction, resume pending admissions using the same Pi request ID. Document that gap and prove recovery.
4. Map each stored runtime tool decision to one application action. Reuse that action's saved result after a crash. For local todo mutations, commit the todo and action result in one supported application transaction.
5. Restore pending eligible work through Pi's resume mechanism. Persist model attempts and usage uncertainty. Repeated inference is permitted only within the remaining budgets; never represent it as exactly-once inference.
6. Persist the terminal response before exposing it to HTTP. Repeated result retrieval and transport retry must read that response without invoking the model.

Prefer supported application documents. Any local SQL illustration in the plan states an atomicity requirement, not permission to write Pi's private tables.

## Proposed files

- Add `tests/recovery.test.ts`.
- Extend `src/runtime/pi-durable.ts`, `src/host/store.ts`, `src/tools/todos.ts`, and `src/inference/budget.ts` only where a failed test needs it.
- Record actual transaction participation and crash evidence in `docs/runtime-contract.md`.

## Acceptance matrix

All tests use local synthetic todos and the deterministic provider. There is no live account or host reboot.

| Interruption | Required observation |
| --- | --- |
| Before admission commit | No false receipt; resubmission creates one logical request |
| After admission commit, before HTTP reply | Same key returns the committed receipt; changed content still conflicts |
| After receipt commit, before Pi submission | Restart creates or finds one Pi submission, never two logical runs |
| After Pi submission commit, before receipt mapping commit, if separate | Recovery finds the original submission by its stored request ID and repairs the mapping |
| During model generation, before stored result | Acknowledged request remains; retry has a new recorded attempt and reservation |
| After persisted tool intent, before todo commit | Recovery produces one todo under the original action ID |
| After todo/action-result commit, before runtime tool-result commit | One todo; saved action result reused; no new mutation |
| After runtime tool-result commit | Tool is not called again for that decision |
| After Pi completion commit, before application outcome commit, if separate | Recovery publishes Pi's stored outcome without new inference |
| After final-response commit, before HTTP result arrives | Same response bytes and IDs; no new inference or tool call |

For each conditional gap, either execute the failpoint or cite the tested supported transaction that makes the gap impossible.

Additional checks:

- [ ] Changing the arguments under an existing action ID fails closed.
- [ ] Separate owner requests with equal titles remain separate actions.
- [ ] A stored batch contains two add calls. Kill after the first todo/result commit. Recovery preserves both original action IDs and creates exactly two todos, without regenerating the batch.
- [ ] A crash at each reservation/dispatch transition conservatively retains possible charges.
- [ ] Lost dispatch outcomes never cause unreserved or uncounted provider attempts.
- [ ] Test failpoints cannot be enabled by normal agent configuration.
- [ ] Results state precisely which transaction committed before each kill.
- [ ] Any dependency contract failure triggers TD-001's stop rule.

## Evidence limits

These tests establish process-kill behavior on the pinned stack only. They do not establish sudden power-loss durability, remote-effect idempotence, push-delivery semantics, or full M3 completion.

## Evidence

Pending. No crash tests executed.
