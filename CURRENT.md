# Cairn status

## Snapshot, 2026-10-29

Cairn is a personal durable agent framework built on Pi Durable. The repository is public at [markdlabrecque/cairn](https://github.com/markdlabrecque/cairn). This is a checked snapshot, not an automatically maintained status feed.

## Branches and publication

- This document is on `docs/cairn-project-name`, at `2fa678f` before this addition. Its working tree was clean before creating this file.
- Implementation is in the separate `../pi-durable-agents-td-002` worktree on `feat/td-002-todo-round-trip`, at `7cc1b25`. That worktree was also clean. The naming/docs branch is already integrated there.
- [PR #1](https://github.com/markdlabrecque/cairn/pull/1) is open and draft into `develop`, with 8 commits ahead. GitHub branch heads match the local heads above. `develop` and `main` share baseline `176e67f`.
- This status update does not switch branches, merge, commit, push, or change the PR.

## TD-002 is implemented locally but blocked

The real CLI, authenticated gateway, separate runner, Pi Durable and SQLite add/list path is implemented. The slice uses schema-validated JSON only and exposes `add_todo` and `list_todos`. DeepInfra is selected with exact model `deepseek-ai/DeepSeek-V4-Flash-0731`.

The last executed integrated checks reported `npm test` with 94 passed and 0 failed/skipped, and `npm run typecheck` passed, for candidate `7cc1b25`. They were not rerun for this docs-only update. Independent review round 2 approved the corrected pre-dotenv code; the subsequent dotenv loader changes have not received independent re-review. Neither that historical approval nor local green checks establish approval of the current candidate or completion of TD-002.

The required bounded live add/list smoke is pending, unauthorized and unexecuted. No real inference or credential access occurred in this update. The implementation worktree has an ignored, owner-only `.env`, verified by metadata only, with mode `600`. Its contents were not read. Live configuration must point `credentialFile` at that protected `.env`, using `DEEPINFRA_API_KEY`; no secret belongs in tracked configuration or evidence.

Canonical implementation records, **on the implementation branch**, are the [local tracker](https://github.com/markdlabrecque/cairn/blob/feat/td-002-todo-round-trip/docs/tickets/README.md), [TD-002 ticket](https://github.com/markdlabrecque/cairn/blob/feat/td-002-todo-round-trip/docs/tickets/002-first-todo-round-trip.md) and [runtime evidence](https://github.com/markdlabrecque/cairn/blob/feat/td-002-todo-round-trip/docs/runtime-contract.md). Older 85-test outputs and review manifests there are historical pre-dotenv evidence. The draft PR records the later 94-test publication checks.

## Planned work, not execution authorization

All parents and children below are open, unstarted plans with defined deliverables and linked native GitHub subissues.

- [TD-003, #2](https://github.com/markdlabrecque/cairn/issues/2): crash-safe recovery, children [#5](https://github.com/markdlabrecque/cairn/issues/5), [#6](https://github.com/markdlabrecque/cairn/issues/6), [#7](https://github.com/markdlabrecque/cairn/issues/7), [#8](https://github.com/markdlabrecque/cairn/issues/8). Recover admission/Pi identity, persisted todo batches, interrupted inference, and final outcomes/lost HTTP results.
- [TD-004, #3](https://github.com/markdlabrecque/cairn/issues/3): persisted limits, children [#9](https://github.com/markdlabrecque/cairn/issues/9), [#10](https://github.com/markdlabrecque/cairn/issues/10), [#11](https://github.com/markdlabrecque/cairn/issues/11), [#12](https://github.com/markdlabrecque/cairn/issues/12), [#13](https://github.com/markdlabrecque/cairn/issues/13). Cover queues, request allowances, retries/timeouts, monthly spending/warning, and permissions/ingress.
- [TD-005, #4](https://github.com/markdlabrecque/cairn/issues/4): Linux operation/demo, children [#14](https://github.com/markdlabrecque/cairn/issues/14), [#15](https://github.com/markdlabrecque/cairn/issues/15), [#16](https://github.com/markdlabrecque/cairn/issues/16), [#17](https://github.com/markdlabrecque/cairn/issues/17). Cover ownership/shutdown, truthful status, isolated services, and recorded demo/runbook.

The owner-confirmed [#7 recovery policy](https://github.com/markdlabrecque/cairn/issues/7) automatically creates a new inference attempt after uncertain dispatch only within the shared initial-attempt-plus-two-retries cap and remaining funds, time and model-call limits. Retain the prior possible charge conservatively; never resend its identity. A fresh attempt needs a new durable identity and reservation. Reuse stored completed responses. Exhausted limits produce a visible blocked/partial outcome. This does not permit tool or external-write replay, reset budgets on restart, or authorize implementation.

## Broader scope and preserved boundaries

[Specification task 19](.scratch/personal-assistant/issues/19-finalize-implementation-specification.md) remains open. Full M0–M4 implementation, acceptance and owner sign-off are not complete. Slack remains the final user interface; CLI/HTTP are internal interfaces for this slice. See the [PRD](pi-durable-personal-agent-prd.md) and [remaining work](docs/remaining-work.md).

Slack, Google and Proton spikes remain complete and closed. Preserve their [completion ledger](docs/evidence/integration-spike-ledger.md), retained evidence and exclusions, including lock/suspend exclusions and the deliberately uncertain Proton no-write action. Do not rerun them for this slice. No services were installed, host settings changed, or connectors run in this update. Planning and public issue publication do not authorize implementation, credential access, live inference, service work or deployment.

## Next actions

1. Obtain fresh independent review of the current TD-002 candidate, explicitly including dotenv changes.
2. Obtain owner authorization for a bounded DeepInfra add/list live smoke, then execute and retain sanitized evidence within the approved limits. These outstanding checks are not merge authorization.
3. Only after TD-002 gates and separate implementation authorization, follow TD-003 child planning/review order #5, #6, #7, #8, respecting each child's prerequisites. TD-004 follows TD-003; TD-005 follows TD-004. None is declared ready or done here.
