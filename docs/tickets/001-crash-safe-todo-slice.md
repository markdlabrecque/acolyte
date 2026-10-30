# Crash-safe terminal todo assistant

ID: TD-001
Type: epic
Status: draft
Assignee: none
Depends on: TD-002, TD-003, TD-004, TD-005
Authority: PRD v0.5, plus owner approval of this slice
Implementation authorized: TD-002 only, in its worktree; no live inference

## Outcome

The owner submits a todo request through a CLI, closes the terminal, restarts the agent, and retrieves the same receipt and result. A crash after a local todo commit must not create another todo.

This is retained implementation code. It exercises the actual gateway, Pi Durable, SQLite, provider adapter, and Linux process topology. It is not another connector spike.

## Scope and approval

The owner asked to plan the terminal-first slice and use local tickets. No implementation or live inference is authorized by that planning request.

Proposed design, with the tool scope and JSON choice confirmed:

- TypeScript on an exact supported Node.js 24 release, with JSON configuration.
- One configured agent, one local gateway, one agent process, and separate shared spending storage.
- `add_todo` accepts a nonempty title. `list_todos` returns a bounded page with a continuation cursor. New todos are open.
- No completion, notes, due dates, reminders, or deletion tools yet. These remain eventual todo requirements, not rejected features.
- Authenticated loopback HTTP and a thin CLI. No MCP or Slack code in this slice.
- The selected direct DeepInfra model remains `deepseek-ai/DeepSeek-V4-Flash-0731`. No fallback or silent model change.
- Normal inference uses only the current conversation and explicit todo tool results. No automatic cross-conversation retrieval or long-term memory.

The owner confirmed add/list-only tools and JSON for this first slice. JSON keeps the slice simpler. YAML remains the final-product preference; add YAML support, testing, and linting later. Completion remains outside this slice. These decisions do not authorize implementation.

## Owner demonstration

Commands and output below are proposed, not available yet.

```sh
personal-agent submit --agent assistant --conversation demo \
  --request-id demo-001 'Add "Book a dentist appointment" to my todos.'
personal-agent status --agent assistant demo-001
personal-agent result --agent assistant demo-001

personal-agent submit --agent assistant --conversation demo \
  --request-id demo-002 'List my todos.'
personal-agent result --agent assistant demo-002
```

The test controller pauses the runner after the todo transaction commits but before the runtime records the tool result. It kills that child process, starts a fresh process with the same store, and retrieves `demo-001`. One todo and one logical tool action remain. A repeated inference attempt is possible and must appear in usage accounting.

Fault injection belongs only in the isolated test harness. Normal configuration must reject it.

## Contracts shared by the child tickets

### Ownership and storage

The agent runner alone opens its canonical agent store. The gateway has no second inbox database. It forwards through a permission-restricted Unix socket and waits for the runner's durable admission result.

Acquire process-lifetime OS ownership before writable open. Resolve canonical paths and protect stable agent identity against aliases. Set and read back effective SQLite `synchronous=FULL` on every writer before readiness.

Use supported Pi application documents and commit operations for application state where they fit. Do not modify Pi internal tables. Separate application transactions require explicit gap handling; sharing a database file does not prove atomicity with a runtime checkpoint.

Pi owns its execution checkpoints and transcripts. Application records add receipt identity, authorization, local tool effects, and budget coordination. They must not become a second execution engine.

The shared host spending ledger has its own SQLite file. No atomic transaction spans it and the agent store.

### HTTP and CLI

Proposed routes:

- `POST /v1/agents/:agentId/requests`
- `GET /v1/agents/:agentId/requests/:requestId`
- `GET /v1/agents/:agentId/requests/:requestId/result`

A request supplies `schemaVersion`, `conversationId`, `requestId`, and `message`. The gateway supplies authenticated sender identity, source identity, timestamp, and correlation ID. The body cannot impersonate the owner or change routing authority.

Deduplication uses source, source message ID, and destination agent. The canonical digest includes sender, conversation, and payload, but excludes transport timestamps and tracing IDs. Resubmitting the same key and content returns the existing receipt before any capacity test. Changed content or conversation returns 409.

First admission returns 202 only after the inbox and receipt commit. Identical resubmission returns 200 with the original receipt. The runner atomically checks capacity and assigns durable order. Queue or rate overflow returns 429 without admission. Invalid schema returns 400, authentication failure 401, denied routes 403, oversized payload 413.

An unavailable runner or failed storage returns 503, never an acceptance receipt. A transport timeout can follow a successful commit. The CLI then says acceptance is unconfirmed and tells the owner to retry the same ID. It must not say the request was rejected.

Status returns the persisted request state. Result retrieval returns 202 while unfinished and 200 with a stored terminal outcome when finished. A terminal failure returns a structured failure outcome, not a successful answer. Unknown receipts return 404 only after authorized lookup in an available store. Unavailable storage is not 404.

The CLI requires an explicit request ID for submission in this slice. It reads a local protected authentication file, never a token argument. It does not open SQLite, call the provider, or start a second runtime. It supports human output and `--json`. Exit codes are 0 for a successful command or known status, 1 for a terminal request failure, and 2 for invalid input, transport failure, or rejection. Pending result retrieval is exit 0 with `state`, not a false completed answer.

### Local action identity

Persist the runtime tool-call identity, stable application action ID, tool version, and canonical arguments before execution. Persist the model's returned tool-call batch before dispatching any member.

For `add_todo`, the application atomically commits the todo and the action's saved result. Replaying that action reads the saved result. It never inserts another todo. Changed arguments under the same action ID fail closed. Two separate owner requests to add identical titles remain two valid todos.

Recovery must reuse the original tool decision, not ask the model to invent a replacement action. If the pinned runtime cannot preserve that identity or support the required application transaction through public interfaces, stop for an owner dependency decision.

Persist a final response before exposing it. Polling or losing an HTTP reply cannot cause inference or tool execution.

### Safety before live inference

Only the two selected tools are registered for the agent. The executor enforces the accepted policy intersected with current permissions. The model cannot grant permissions, change limits, or request shell, arbitrary network, mail, or Calendar access.

Persist a model-call intent, obtain an idempotent reservation in the shared ledger, commit dispatch state, then call the provider. Each actual attempt uses its own attempt ID and reservation. Reopening the same attempt is not permission to send it twice. Reuse stored responses; conservatively retain the charge when dispatch or usage is uncertain.

Reject unknown prices, insufficient remaining funds, missing credentials, or an unavailable selected model. Use configured input/output bounds and a conservative cost estimate. No hidden model retries or auxiliary calls bypass this path.

Use the existing defaults: US$10 per Vancouver calendar month, warning at US$5, five minutes active work, 20 model calls, 50 tool calls, one active request and 20 queued per agent. Keep named validated settings. TD-002 implements the minimum guard before its live smoke; TD-004 completes restart and race coverage.

### Limits of this proof

Process-kill recovery does not establish power-loss safety. FULL mode is a required setting, not evidence of hardware behavior. A normal test-host reboot needs a separate authorized run. This slice has no arbitrary remote mutation, approval lifecycle, push delivery, backup, or restore acceptance.

## Delivery order

1. [TD-002](002-first-todo-round-trip.md) builds the real, bounded end-to-end path.
2. [TD-003](003-crash-safe-recovery.md) proves receipts, local actions, and final results survive forced restarts.
3. [TD-004](004-persisted-limits.md) proves admission, permissions, and inference limits across restart.
4. [TD-005](005-linux-service-demo.md) supplies service units, an isolated demo, and honest acceptance evidence.

## PRD coverage

- M0 contribution: tested dependency artifact, runtime/storage pins, and documented public-interface contracts.
- M1 contribution: authenticated HTTP, real inference, durable receipts/results, and a Linux runner. M1 is not complete without its separately authorized normal-reboot evidence.
- M2 contribution: deny-by-default tool execution and duplicate-owner refusal, not two-agent isolation.
- M3 contribution: replay-safe local todo writes, not arbitrary remote effects, approvals, or full cancellation.
- M4 contribution: status and a focused runbook, not backups, restore, upgrades, or operational completion.
- Covered or narrowed criteria: AC-02 through AC-08, AC-11, AC-13, AC-14, AC-17, AC-19, AC-20. Service restart contributes to AC-16; approvals and normal reboot remain outside this slice's completed claims.

Slack is still the selected owner interface. Terminal-first is implementation order, not a PRD amendment. [Specification task 19](../../.scratch/personal-assistant/issues/19-finalize-implementation-specification.md) remains open. The [completed integration ledger](../evidence/integration-spike-ledger.md) is unchanged.

## Evidence and stop rules

The [dependency research](../../.scratch/personal-assistant/research/pi-durable-contract.md) supplies candidate version 1.4.0, not an accepted runtime. Test the actual pinned artifact during TD-002. Stop if recovery requires a parallel execution engine, unsupported internal-table access, or a substantial replacement of Pi Durable.

If the selected provider/model is unavailable, report it. Do not switch providers or expand spending.

Record plan choices, implementation authorization, runtime evidence, and any remaining limits here before closing the epic. Do not reopen completed connector spikes.

## Approval record

The owner returned the plan response with both choices kept as proposed:

- Claim 1: add and list only, `add-list`.
- Claim 3.2: JSON configuration, `json`.

The owner then clarified:

> I want to do JSON because it’s simpler for the first slice. We can add YAML testing/linting later.

These choices are confirmed. The earlier YAML preference applies to the final product, not this slice. The planning request did not authorize implementation or live inference. The subsequent authorization below permits TD-002 only.

### TD-002 implementation authorization

The owner explicitly authorized implementation of TD-002 in `feat/td-002-todo-round-trip`, off develop with the planning commit cherry-picked. Verify the actual pinned artifact first. If its public transaction, replay, or pre-dispatch contract fails, retain a minimal executable reproduction and mark TD-002 blocked rather than building a replacement runtime. Only deterministic local inference fixtures are authorized. Live inference, credential access, connectors, host/service installation, commits, merges, pushes, and subagents are excluded. Fresh independent review and merge happen later through the parent. TD-003, TD-004, and TD-005 remain drafts and are not authorized.

## Acceptance record

Pending. Independent review REJECTED TD-002 checkpoint `824494f`: Pi AI's normalization erased missing raw token counts and inconsistent totals, allowing uncertain reservations to settle downward. The bounded correction validates complete and consistent raw usage through Pi's supported pre-normalization observer before allowing live settlement. New synthetic loopback regressions preserve every old assertion and ran red before the fix. `npm test` now passes 85 tests with none failed/skipped, typecheck passes, and the adapter suite passes 48 tests. [Runtime evidence](../runtime-contract.md) retains the rejected reproduction, correction, latest checks, and regenerated candidate hashes.

TD-002 remains BLOCKED, not done. The real DeepInfra smoke remains unauthorized and unperformed; loopback fixtures do not satisfy it. The full ticket stays blocked until a separately authorized live smoke passes. No partial merge authorization is assumed. Fresh independent review round 2 approved the corrected code, with 85 suite tests, typecheck, and 13 additional loopback checks passing. See the [review record](../evidence/td002-review-round-2.md). Code approval does not close live acceptance or authorize a partial merge. No Pi dependency failure has been demonstrated. This continuation made no commit or merge. TD-003 through TD-005 remain drafts; no full crash/persisted-race/service/reboot or power-loss proof is claimed.
