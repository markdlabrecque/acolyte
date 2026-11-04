# Acolyte repository status

## Snapshot, 2026-11-03

The public repository is [markdlabrecque/acolyte](https://github.com/markdlabrecque/acolyte). The PRD and glossary retain the owner-selected product name Cairn; this status update does not rename the product. This is a checked snapshot, not an automatically maintained feed.

## Checkout and GitHub

- Implementation is committed at `53f7860`, titled `TD-002 complete.`, following baseline `62d8b2e`.
- The checkout was clean on `feat/td-002-todo-round-trip` before this documentation update. The update uses `docs/refresh-project-status`, based on the same implementation commit. There is one local worktree, not a separate TD-002 worktree.
- Local `origin/main` points to `53f7860`; local `main` remains at `62d8b2e`. A fresh remote-head check failed because the SSH alias `github-mark` did not resolve, so the cached remote-tracking ref is not fresh remote verification.
- GitHub CLI queries against the explicit repository returned default branch `main`, public visibility, **10 open issues and no open PRs**. The old Cairn draft-PR and child-issue pointers are not this repository's queue.

## TD-002: implemented, live smoke pending

The CLI, authenticated gateway, separate runner, Pi Durable and SQLite add/list path is committed. It uses schema-validated JSON and exposes `add_todo` and `list_todos`. The selected model remains DeepInfra `deepseek-ai/DeepSeek-V4-Flash-0731`.

The prior status snapshot reported 94 passing tests, no failures/skips, and a passing typecheck for pre-import candidate `7cc1b25`. These checks were not rerun for this documentation update. The retained 85-test outputs and review round 2 are older pre-dotenv evidence, not current-candidate approval. The protected credential loader still needs independent review.

No retained evidence establishes a real DeepInfra add/list pass. The commit title does not close that acceptance gate. The [TD-002 ticket](docs/tickets/002-first-todo-round-trip.md) therefore keeps formal status `blocked`: implemented, live smoke pending. No live inference or credential access is authorized by this update.

Current issues also identify gaps beyond the live smoke: full tool-call-batch persistence and proof of FULL synchronous mode on the runtime's actual SQLite connection remain unresolved. `limits.warningUsd` is validated but unused; warning behavior belongs to TD-004. Local fixture passes do not settle these claims.

Use the [local implementation tracker](docs/tickets/README.md), [TD-002 ticket](docs/tickets/002-first-todo-round-trip.md), [runtime evidence](docs/runtime-contract.md), and [portable credential-file instructions](docs/credentials.md).

## Current GitHub follow-ups

All ten issues were open when checked. These numbers belong to Acolyte, not the old Cairn planning hierarchy.

- [#1: Long todo lists can make the assistant fail](https://github.com/markdlabrecque/acolyte/issues/1)
- [#2: Status errors say "rejected" when the service is down](https://github.com/markdlabrecque/acolyte/issues/2)
- [#3: Make command-line answers readable by default](https://github.com/markdlabrecque/acolyte/issues/3)
- [#4: Save the full list of tool calls before running any](https://github.com/markdlabrecque/acolyte/issues/4)
- [#5: Decide whether users see progress while the assistant works](https://github.com/markdlabrecque/acolyte/issues/5)
- [#6: Prove the database safe-write setting on the connection in use](https://github.com/markdlabrecque/acolyte/issues/6)
- [#7: Split the model-call code and remove copied code](https://github.com/markdlabrecque/acolyte/issues/7)
- [#8: Bring TD-002 records in line with what was built](https://github.com/markdlabrecque/acolyte/issues/8)
- [#9: Get an independent review of the credential file loader](https://github.com/markdlabrecque/acolyte/issues/9)
- [#10: Trim overlapping tests and decide on the Pi library tests](https://github.com/markdlabrecque/acolyte/issues/10)

This documentation update addresses stale records but does not close or modify GitHub issues.

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
