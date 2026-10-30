# Local implementation tickets

This is the file-based tracker for implementation planning. No remote, tracker service, or new CLI is required.

Start with [TD-001: crash-safe todo slice](001-crash-safe-todo-slice.md). Review the [interactive plan](../plans/durable-todo-slice.html) before implementation. The plan source needs the local html-plan skill runtime. The portable export is `tmp/plans/durable-todo-slice.packed.html`.

## Current queue

| Ticket | Deliverable | Status | Depends on |
| --- | --- | --- | --- |
| [TD-001](001-crash-safe-todo-slice.md) | Crash-safe terminal todo assistant | draft | TD-002 through TD-005 |
| [TD-002](002-first-todo-round-trip.md) | First bounded CLI-to-todo round trip | blocked | Live smoke unauthorized; corrected code passed independent review 2 |
| [TD-003](003-crash-safe-recovery.md) | Same receipts, actions, and results after a crash | draft | TD-002 |
| [TD-004](004-persisted-limits.md) | Admission, permissions, and limits across restart | draft | TD-003 |
| [TD-005](005-linux-service-demo.md) | Isolated Linux services and recorded demo | draft | TD-004 |

Follow the dependency order. TD-002 is the first vertical implementation, not a separate scaffolding phase. Keep its code through the later tickets.

## Ticket workflow

- Each ticket file owns its status, dependencies, acceptance checks, and evidence. Keep this index consistent when a status changes.
- Use stable IDs of the form `TD-001`. Do not renumber or reuse IDs. Link directly to files.
- Statuses are `draft`, `ready`, `in-progress`, `blocked`, `done`, and `cancelled`.
- `draft` means the scope is proposed. Plan approval records the chosen options. It does not authorize execution unless the owner also says to start.
- `ready` requires recorded approval, implementation authorization, and completed dependencies. `blocked` records the unmet condition in the ticket.
- Before work, read the parent ticket and the applicable PRD sections. Check the branch and working tree. Set an assignee and mark only the selected ticket `in-progress`.
- At completion, record changed paths, commands, results, and any test limitations. A checkbox or documentation review is not runtime evidence.
- Mark `done` only when the acceptance checks pass. If a test is simplified or retired, record why and which claim remains unproved. Do not silently waive recovery or safety acceptance.
- Complete at most one non-research ticket per session, consistent with the retained planning convention.
- Keep code changes on feature branches. Commit or publish only when asked.

## Existing planning records

The [decision map](../../.scratch/personal-assistant/map.md) and its numbered files remain the record of product decisions and completed research. They are not renumbered or migrated here.

[Specification task 19](../../.scratch/personal-assistant/issues/19-finalize-implementation-specification.md) stays open. This tracker specifies one proposed slice, not the whole M0–M4 release. Slack, Google, and Proton spikes stay closed. Nothing here authorizes account access, live connector tests, host changes, production deployment, or 1Password access.

## Confirmed plan choices

The owner confirmed both choices for TD-002:

1. Use JSON for the first slice because it is simpler. YAML remains the final-product preference; YAML support, testing, and linting are deferred.
2. Ship `add_todo` and `list_todos` only. Completion with history remains later work.

The [approval record](001-crash-safe-todo-slice.md#approval-record) preserves the response and clarification. The owner subsequently authorized TD-002 only, in its existing feature worktree, with deterministic local fixtures and the dependency stop rule. No live inference or credentials are authorized. The parent coordinates local commits and fresh independent review. The owner authorized a local merge only after completion and passing review. No push is authorized. TD-003 through TD-005 remain drafts.

Independent review REJECTED TD-002 checkpoint `824494f` for unsafe settlement after Pi normalized incomplete or inconsistent raw usage. The bounded correction checks raw usage through the supported pre-normalization observer, then requires agreement with normalized counts. New local wire regressions preserve all old assertions. Latest cheap checks pass 85 tests and typecheck; the adapter suite passes 48. [Runtime evidence](../runtime-contract.md) retains the review failure, red regression, correction, latest outputs, and regenerated candidate hashes. No Pi dependency failure has been demonstrated.

Fresh independent review round 2 approved the code with no must-fix findings. Its 85-test run, typecheck, and 13 additional loopback checks passed. See the [review record](../evidence/td002-review-round-2.md). Live acceptance remains unauthorized, unchecked, and BLOCKED. No merge occurred and no partial merge authorization is assumed. Full crash/race/service/reboot evidence remains later work.

## Export the plan

From the repository root:

```sh
node docs/plans/export-durable-todo-plan.mjs
```

The export script uses the installed html-plan skill, packs its runtime, and gives the feedback controls neutral labels. It needs only Node.js and does not install packages or access the network.

The source and export script belong in Git. The generated portable page stays in the ignored `tmp/` directory.
