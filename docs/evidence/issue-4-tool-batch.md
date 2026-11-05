# Persisted tool-call batch decision and crash evidence

Date: 2026-11-03
Issue: [Acolyte #4](https://github.com/markdlabrecque/acolyte/issues/4)
Branch: `fix/4-persisted-tool-batch`
Base commit: `f0c7a7e`, after [PR #12](https://github.com/markdlabrecque/acolyte/pull/12) merged into `main`
Status: implemented locally as a tested dependency contract and written decision; GitHub issue remains open

## Decision

For the pinned TD-002 runtime, use Pi Durable's persisted assistant entry as the authoritative full tool-call batch. Do not duplicate it in an application document. This meets issue #4's alternative acceptance path: a written decision that Pi's stored records satisfy the requirement, backed here by actual process-kill tests.

The assistant entry stores all original call IDs, tool names and arguments. The generation checkpoint stores its assistant-entry ID, active tool-task IDs and pending call IDs. Together these records preserve the whole decision before the first call executes. Each model-issued tool task references its assistant entry and call ID.

Application `StateDoc.actions` continues to own per-call authorization, tool version, arguments, effect and saved result. Its action ID is `todo-v1:<Pi task ID>`. These records are created when a call starts, not as a duplicate batch before any call starts. In sequential mode, Pi has not yet assigned a task ID to the second call while the first runs. That call is already durable under its original assistant-entry/call-ID pair; Pi creates its task later from the stored checkpoint.

No production code, schema, dependency or runtime setting changed. Adding a second batch document would add a consistency boundary without preserving information missing from the existing records. This decision applies to the pinned sequential, non-compacting TD-002 path and the current `add_todo`/`list_todos` extension. Re-run the contract tests when upgrading Pi or changing scheduling, compaction, argument-rewriting hooks or retention. It is not permission to replay external writes.

## Dependency evidence

Inspected the installed Pi Durable and Chord 1.4.0 artifacts, not an upstream checkout:

- `@earendil-works/pi-durable/dist/harness/generation.js`, `startToolRound()`: one runtime commit appends the complete assistant message, creates the first sequential tool task, and records a waiting generation checkpoint containing the remaining call IDs.
- The generation's `tools` phase creates subsequent tasks using that stored assistant entry and pending call ID. It does not ask the model to generate another batch.
- `@earendil-works/pi-durable/dist/harness/tool.js`, `readCall()`: model-issued calls load their name and arguments from the referenced assistant entry. Before execution, the task stores its resolved arguments and replay policy. Recovery executes again only when the stored and current tool policies both say safe.
- `src/tools/todos.ts`: the production todo extension returns an existing action result rather than inserting a second todo for the same task. The todo and saved action result share one application document commit.

The new tests inspect these records through public APIs only: `Conversation.entries()`, `Tx.scanTasks()`, `Harness.snapshot()`, `Tx.submissionByRequest()` and `Harness.submission()`. They do not read or modify Pi's private SQLite tables or import private dependency modules.

## Executed crash checks

`tests/tool-batch-recovery.test.ts` controls `tests/fixtures/tool-batch-worker.ts`. The worker uses the production `ownStore()` and `todoExtension()`, real SQLite and Pi Durable, and a deterministic in-memory model provider. Test-only hooks report explicit barriers; the parent waits for complete JSON messages before sending SIGKILL. The killed worker never closes its runtime gracefully.

Both cases first observe the complete two-call assistant message while there are no application actions or todos. The generation is waiting on the first tool task with the original second call still pending.

1. **Before the first tool executes:** kill at the `beforeTool` barrier. No todo or action exists. Reopen in a separate process with scheduling paused and verify the stored message, pending call and original first task ID before allowing recovery.
2. **After the first todo and application result commit:** kill at the first `afterTool` barrier, before Pi commits its tool result or starts the second call. The first tool checkpoint remains in `execute`. A separate paused inspector verifies exactly one todo, its saved action result, the original two-call message and the still-pending second call.

For each case, a third process reacquires the original submission and resumes Pi. The assertions verify:

- The original assistant entry, both call IDs, tool names and arguments are unchanged after the kill and after recovery.
- Exactly two original todos exist, with distinct IDs, two application actions and two charged tool calls.
- The first action keeps its original Pi task ID. In the after-effect case, its todo ID, creation timestamp and saved action result remain byte-for-byte unchanged.
- The recovery provider is called once for the final answer, only after both original call IDs have tool results. It cannot regenerate a batch.

## Checks and retained output

- `node --test tests/tool-batch-recovery.test.ts`: [3 passed](issue-4-batch-tests.txt), comprising the parent test and its two crash-boundary subtests.
- `npm test`: [101 passed, zero failed/skipped](issue-4-tests.txt).
- `npm run typecheck`: [passed](issue-4-typecheck.txt).
- [Pinned versions, base revision and source hashes](issue-4-environment.txt).

The first test-authoring run failed because the test used the wrong public task-token property and had fixture typing/API errors. Those errors were corrected using the installed declarations. The earlier test candidate was not retained, so the independent review could assess only the final assertions, not their authoring history. The completed contract passes against unchanged production code. There is no claimed product red-to-green fix: the gap was missing proof and an explicit ownership decision.

## Independent review

The independent reviewer approved the bounded technical contract with no must-fix findings. It confirmed the persisted batch, actual SIGKILL boundaries, paused-process inspection, unchanged first effect and recovery without batch regeneration against Pi Durable 1.4.0's public declarations and implementation.

The reviewer reran the focused tests, five additional repetitions, the full 101-test suite and typecheck successfully. It also killed the inspector and recovery subprocesses independently. Both deliberate failures produced prompt assertion failures without hanging or leaving workers behind. The reviewed test hashes match `issue-4-environment.txt`.

The reviewer could not independently verify the earlier claim about unchanged assertions during test authoring because the earlier candidate was not retained. The authoring note above now states that limitation. This does not affect its approval of the final tests.

Status/ticket documentation changed during the review, so the whole working tree was not frozen. The technical approval covers the new tests, pinned dependency contract and ownership decision. It is not final workflow approval: the required workflow file, review round/cap and authoritative gate were unavailable. It does not close TD-002 acceptance.

## Scope and remaining work

The owner authorized this issue and merging PR #12. No real credentials, live inference, connectors, installed services, host reboot or production access were used. The owner subsequently authorized committing and pushing this branch and opening a PR into `main`. Merge is not authorized by that request. This evidence records the pre-publication candidate, and no GitHub issue was closed during verification.

This is a Pi-storage/production-todo contract test, not the full application recovery path. The worker seeds an active application receipt and calls Pi directly. It does not exercise the HTTP gateway, runner socket recovery, `openRuntime()` admission/submission mapping, inference reservations or final application-outcome recovery. Those remain TD-003/TD-004 work. The two process-kill checks do not prove power-loss safety, multi-agent behavior or live-model acceptance. TD-002 remains implemented, live smoke pending.
