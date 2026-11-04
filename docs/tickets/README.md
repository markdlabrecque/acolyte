# Local implementation tickets

This is the file-based tracker for the implementation sequence and acceptance gates. Current follow-up defects and review work are tracked in [Acolyte's GitHub issues](https://github.com/markdlabrecque/acolyte/issues). See [CURRENT.md](../../CURRENT.md) for the checked repository snapshot; old Cairn issue numbers are not Acolyte issue numbers.

Start with [TD-001: crash-safe todo slice](001-crash-safe-todo-slice.md). Review the [interactive plan](../plans/durable-todo-slice.html) before implementation. The plan source needs the local html-plan skill runtime. The portable export is `tmp/plans/durable-todo-slice.packed.html`.

## Current queue

| Ticket | Deliverable | Status | Depends on |
| --- | --- | --- | --- |
| [TD-001](001-crash-safe-todo-slice.md) | Crash-safe terminal todo assistant | draft | TD-002 through TD-005 |
| [TD-002](002-first-todo-round-trip.md) | First bounded CLI-to-todo round trip | blocked | Implemented, live smoke pending; credential review and acceptance gaps remain |
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

The [approval record](001-crash-safe-todo-slice.md#approval-record) preserves the response and clarification. TD-002 implementation and subsequent publication were authorized historically; the code is now committed at `53f7860`. This does not authorize live inference, credential access, further publication, or TD-003 through TD-005 implementation.

TD-002 is implemented, live smoke pending. The prior snapshot reported 94 passing tests and a passing typecheck for pre-import candidate `7cc1b25`; these were not rerun for this documentation update. [Runtime evidence](../runtime-contract.md) retains earlier 85-test outputs, the rejected usage-settlement review and the correction. [Review round 2](../evidence/td002-review-round-2.md) approved only the pre-dotenv candidate, not the current source or ticket completion.

The credential loader still needs independent review, and current issues question full tool-call-batch persistence and FULL-mode verification on the runtime connection. See the [TD-002 evidence and open gaps](002-first-todo-round-trip.md#evidence). The live gate remains unchecked, so formal status stays `blocked`. Full crash/race/service/reboot evidence remains later work. `limits.warningUsd` is validated but unused; implementing its warning behavior belongs to TD-004.

## Export the plan

From the repository root:

```sh
node docs/plans/export-durable-todo-plan.mjs
```

The export script uses the installed html-plan skill, packs its runtime, and gives the feedback controls neutral labels. It needs only Node.js and does not install packages or access the network.

The source and export script belong in Git. The generated portable page stays in the ignored `tmp/` directory.
