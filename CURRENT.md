# Acolyte repository status

## Snapshot, 2026-11-03

The public repository is [markdlabrecque/acolyte](https://github.com/markdlabrecque/acolyte). The PRD and glossary retain the owner-selected product name Cairn; this status update does not rename the product. This is a checked snapshot, not an automatically maintained feed.

## Checkout and GitHub

- A fresh fetch confirms remote `main` at merge commit `1dcd78d`, which includes documentation refresh `343bdf5` and SQLite FULL fix `c59e172`. The original TD-002 implementation is `53f7860`, following baseline `62d8b2e`.
- [PR #11](https://github.com/markdlabrecque/acolyte/pull/11) merged into `main` at `2026-11-04T06:42:10Z`, November 3 in Vancouver. [Issue #6](https://github.com/markdlabrecque/acolyte/issues/6) is closed.
- GitHub reports **9 open issues and no open PRs**. No CI checks are configured for PR #11. The owner explicitly authorized merging on the passing local tests and typecheck.
- The saved remote now uses `ssh://git@github.com/markdlabrecque/acolyte`; fetching succeeds. The earlier `github-mark` alias failure is no longer the current remote configuration.
- The checkout was clean before this status-only update on `docs/session-sqlite-full-status`, based on fetched `origin/main` at `1dcd78d`. There is one local worktree. No remote `develop` branch existed when checked; the owner selected `main` as the PR target instead.

## Completed this session

- Refreshed this snapshot and nine related documents, corrected stale Cairn repository/PR/worktree pointers, removed the personal credential-file path, and separated historical test evidence from current acceptance claims. The recorded Cairn product name remains unchanged. Documentation issue #8 remains open.
- Implemented issue #6 through the supported Pi database API. The pinned runtime retains the supplied connection; the missing guard was a readback after storage initialization, not a check on a second connection. `ownStore()` now requires FULL both before and after initialization, before the runner can become ready.
- Added regression tests that first reproduced unsafe readiness after injected OFF/NORMAL settings, then passed with the fix. Tests read FULL inside real Pi storage transactions, including new request commits before and after reopening, and verify failed startup releases ownership for a clean restart.
- Passed all 98 tests with no failures/skips and typecheck, including a rerun before commit. Independent review found no must-fix implementation findings; its reopened-commit coverage observation was corrected and tests rerun. The reviewer could not issue authoritative workflow approval because its workflow/gate configuration was unavailable. This is not final TD-002 approval.
- Committed, pushed, opened PR #11 into `main`, and merged it after explicit owner confirmation that local green checks were sufficient without remote CI. Retained [implementation, test and review evidence](docs/evidence/issue-6-storage-durability.md) describes the pre-publication work; this snapshot records the later merge and issue closure.

## TD-002: implemented, live smoke pending

The CLI, authenticated gateway, separate runner, Pi Durable and SQLite add/list path is committed. It uses schema-validated JSON and exposes `add_todo` and `list_todos`. The selected model remains DeepInfra `deepseek-ai/DeepSeek-V4-Flash-0731`.

The merged issue #6 source passed 98 tests with no failures/skips and typecheck before commit; [retained evidence](docs/evidence/issue-6-storage-durability.md) includes the failing regression before the fix. Tests were not rerun for this status-only update. The prior 94-test report and retained 85-test outputs describe earlier candidates. Review round 2 is older pre-dotenv evidence, not current-candidate approval. The protected credential loader still needs independent review.

No retained evidence establishes a real DeepInfra add/list pass. The commit title does not close that acceptance gate. The [TD-002 ticket](docs/tickets/002-first-todo-round-trip.md) therefore keeps formal status `blocked`: implemented, live smoke pending. No live inference or credential access is authorized by this update.

Issue #6 is merged and closed. The store checks FULL again after Pi storage initialization, and tests read `synchronous=2` inside actual runtime transactions on fresh and reopened stores. OFF/NORMAL initialization fault tests reject runner startup before readiness and verify resource release. This is not a power-loss proof. Full tool-call-batch persistence remains unresolved. `limits.warningUsd` is validated but unused; warning behavior belongs to TD-004.

Use the [local implementation tracker](docs/tickets/README.md), [TD-002 ticket](docs/tickets/002-first-todo-round-trip.md), [runtime evidence](docs/runtime-contract.md), and [portable credential-file instructions](docs/credentials.md).

## Current GitHub follow-ups

These nine issues remain open after issue #6 closed. These numbers belong to Acolyte, not the old Cairn planning hierarchy.

- [#1: Long todo lists can make the assistant fail](https://github.com/markdlabrecque/acolyte/issues/1)
- [#2: Status errors say "rejected" when the service is down](https://github.com/markdlabrecque/acolyte/issues/2)
- [#3: Make command-line answers readable by default](https://github.com/markdlabrecque/acolyte/issues/3)
- [#4: Save the full list of tool calls before running any](https://github.com/markdlabrecque/acolyte/issues/4)
- [#5: Decide whether users see progress while the assistant works](https://github.com/markdlabrecque/acolyte/issues/5)
- [#7: Split the model-call code and remove copied code](https://github.com/markdlabrecque/acolyte/issues/7)
- [#8: Bring TD-002 records in line with what was built](https://github.com/markdlabrecque/acolyte/issues/8)
- [#9: Get an independent review of the credential file loader](https://github.com/markdlabrecque/acolyte/issues/9)
- [#10: Trim overlapping tests and decide on the Pi library tests](https://github.com/markdlabrecque/acolyte/issues/10)

The next recommended implementation task is [#4](https://github.com/markdlabrecque/acolyte/issues/4), resolving whether Pi's persisted tool-call batch meets the recovery contract before adding another record. The full-page listing fix in [#1](https://github.com/markdlabrecque/acolyte/issues/1), credential-loader review in [#9](https://github.com/markdlabrecque/acolyte/issues/9), and separately authorized live smoke still precede TD-002 acceptance. This ordering is a recommendation, not authorization to start another issue.

## Later implementation

The local dependency order remains:

1. [TD-003: crash-safe recovery](docs/tickets/003-crash-safe-recovery.md), after TD-002 acceptance.
2. [TD-004: persisted limits](docs/tickets/004-persisted-limits.md), after TD-003.
3. [TD-005: Linux services and recorded demo](docs/tickets/005-linux-service-demo.md), after TD-004.

These remain draft plans, not implementation authorization. The former snapshot recorded an owner-confirmed recovery policy: uncertain inference may create a fresh attempt only within the shared initial-attempt-plus-two-retries cap and remaining funds, time and model-call limits. Preserve the prior possible charge; use a new durable identity and reservation; reuse completed responses. Exhausted limits produce a visible blocked/partial outcome. This historical decision does not authorize tool or external-write replay or reset budgets on restart, and is not Acolyte issue #7.

## Broader scope and boundaries

[Specification task 19](.scratch/personal-assistant/issues/19-finalize-implementation-specification.md) remains open. Full M0–M4 implementation, acceptance and owner sign-off are incomplete. Slack remains the final user interface; CLI/HTTP are internal interfaces for this slice. See the [PRD](pi-durable-personal-agent-prd.md) and [remaining work](docs/remaining-work.md).

Slack, Google and Proton spikes remain complete and closed. Preserve their [completion ledger](docs/evidence/integration-spike-ledger.md), retained evidence and exclusions, including lock/suspend exclusions and the deliberately uncertain Proton no-write action. Do not rerun them for this slice. Historical artifact paths and review hashes are retained as provenance, not current runnable instructions.

Before claiming TD-002 acceptance, resolve the documented acceptance gaps, obtain independent credential-loader review, and obtain separate owner authorization for a bounded live add/list smoke with sanitized evidence. This update installs no services, changes no host settings, reads no credentials, and authorizes no deployment.
