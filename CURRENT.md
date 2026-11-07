# Acolyte repository status

## Workflow implementation candidate

The GitHub helper workflow is an implementation candidate, not a merged delivery. The owner waived further independent review for publication of this workflow delivery and authorized a feature-branch push, not a merge. Remote CI is pending at this pre-push snapshot; its actual result will be recorded on the linked tickets. GitHub API readback confirms that `main` protection is active: GitHub Actions app 15368 must supply `tests` and `typecheck`, strict up-to-date checks and administrator enforcement are enabled, and force pushes and deletion are disabled. Never bypass these protections. The owner's separate dirty recovery work remains untouched. Live dispatch, scheduler-scoped single-issue execution, isolated implementation/check/review sessions and read-only Luna analysis are now connected. At `6a79e0d`, protected-container validation passed all 256 tests with no failures/skips and typecheck. Independent whole-workflow approval was not obtained; the owner's publication waiver is recorded in [publication evidence](docs/evidence/workflow-publication.md). Remote CI must still run; [execution evidence](docs/evidence/workflow-execution.md) records the integration and reproduced failures.

CI/gate re-review rejected historical `52a109c` because PR retargeting could conceal the workflow definition used by an earlier run. The correction candidate requires push-triggered CI at the approved head, with the workflow blob pinned there. PR checks now have distinct names. At `fb6391c`, all 262 tests and typecheck passed in the protected offline container, together with image/catalog/isolation and diff checks. The [rejection and dispositions](docs/evidence/workflow-merge-gate.md) remain recorded; the owner subsequently waived further review for this publication only. Automated ticket runs still require exact-head review and genuine remote CI.

Whole-workflow review rejected `f0d5cae` for candidate-controlled system-prompt discovery, stale eligibility after CI waits and noncanonical persisted path claims. The correction candidate overrides both prompt sources, revalidates eligibility immediately before the merge write and canonicalizes comparison-time claims. [Whole-workflow review evidence](docs/evidence/workflow-independent-review.md) retains the rejection and regression design. At `43407b4`, all 274 tests, typecheck, diff checks and the actual Pi 1.5.0 resource-loader regression passed in the protected offline image. No approval of the later correction is claimed.

A second whole-workflow review rejected `e91d600` because implementation-requested shell checks could inherit the coding key and network access. Correction `f70962e` removes shell/code-execution tools from online implementation and repair, and reserves all candidate execution for the separate offline, credential-free worker. All 275 tests, typecheck and protected smoke checks passed, including a real Pi 1.5.0 agent-loop regression denying an explicit request to run candidate checks with a synthetic key present. The review confirmed the push-bound CI provenance correction but did not approve the whole delivery. Both whole-workflow rejection rounds remain in the linked evidence. The superseded `d6768cf` review was cancelled without a verdict; the next final-HEAD review attempt was blocked by the review service without a technical verdict. The owner then waived further review for this publication only. This is not technical approval and does not change future automated-run review gates or main protection.

Sandcastle is developer tooling, not the Cairn product. Its candidate development image uses Node 24.20.0 and Pi coding-agent 1.5.0; the application remains on Pi 1.4.0 and the selected DeepInfra model. Manual starts, GPT-only ticket routing, isolated runs and host-only GitHub authentication are described in [the workflow](docs/sandcastle-workflow.md). The owner-authorized OpenAI OAuth check returned HTTP 200 without inference. The selected GPT model IDs were not advertised by the models-list response, so selected-model inference and a real coding workflow run remain unverified. See [authentication evidence](docs/evidence/workflow-auth-check.md). TD-002 remains blocked on separately authorized live acceptance.

## Publication packaging

The owner requested three commits: [image evidence summary](docs/evidence/image-work-summary.md), [recovery evidence summary](docs/evidence/recovery-work-summary.md), then the workflow and CI as one combined commit. Workflow source is captured from `9b10b748b84bb34e368294a66c9de70bbf47741e`, whose 275 tests, typecheck, protected smoke and actual Pi probes passed. The original integration history and dirty recovery/image checkouts remain intact. Recovery source/tests are excluded; the image updates are included in the workflow. Issues [25](https://github.com/markdlabrecque/acolyte/issues/25) and [37](https://github.com/markdlabrecque/acolyte/issues/37) through [40](https://github.com/markdlabrecque/acolyte/issues/40) remain open until their outstanding acceptance/delivery work is actually completed. No PR or merge is authorized by this push request.

## Historical delivery update, 2026-11-05

This update records the state at that delivery; its CI, issue and checkout statements are not current.

[PR #21](https://github.com/markdlabrecque/acolyte/pull/21) merged at `947c3a8`; [issue #5](https://github.com/markdlabrecque/acolyte/issues/5) is verified closed. The owner chose request status for metadata-only model progress. JSON status includes cumulative delta count and last-activity milliseconds; plain status shows count and an ISO timestamp, or zero/none before activity. No partial model content is exposed.

Fresh independent review approved integration `05bbda0` against `abb9320`, after the earlier rejected transport-cleanup finding was fixed. Parent and reviewer passed all 114 tests and typecheck. The parent repeated both checks successfully on merged `main`. [Evidence](docs/evidence/issue-5-progress.md) preserves all review rounds and limitations. No remote CI checks are configured.

GitHub now reports zero open issues and zero open PRs. Local `main` was fast-forwarded to `origin/main` at `947c3a8`; this status-only commit follows the merge. The main checkout was clean before this update. Other feature/review worktrees exist, so the older single-worktree statement below is historical.

TD-002 remains blocked on separately authorized live DeepInfra add/list acceptance. Tests used synthetic credentials and local providers only. Running progress is covered at adapter/state level rather than through a polling CLI process; per-delta durable-write overhead remains unbenchmarked. No real credentials, live inference, production operations or 1Password access were used.

## Historical snapshot, 2026-11-05

The sections below retain earlier snapshots. Their checkout, issue and CI statements are historical.

The public repository is [markdlabrecque/acolyte](https://github.com/markdlabrecque/acolyte). The PRD and glossary retain the owner-selected product name Cairn; this status update does not rename the product. This is a checked snapshot, not an automatically maintained feed.

## Checkout and GitHub

- A fresh fetch and fast-forward brought local `main` to remote merge commit `cd14306`, after [PR #17](https://github.com/markdlabrecque/acolyte/pull/17) (issue #10 test trim). Before it, [PR #16](https://github.com/markdlabrecque/acolyte/pull/16) merged reviewed implementation `7908716`. This separate status-only commit follows that merge. Earlier merges: [PR #15](https://github.com/markdlabrecque/acolyte/pull/15) (`3b1b012`), [PR #14](https://github.com/markdlabrecque/acolyte/pull/14) (`7a61dc1`), [PR #13](https://github.com/markdlabrecque/acolyte/pull/13) (`4f56801`, issue #4 evidence), [status PR #12](https://github.com/markdlabrecque/acolyte/pull/12) (`f0c7a7e`) and [PR #11](https://github.com/markdlabrecque/acolyte/pull/11) (SQLite FULL fix `c59e172`). The original TD-002 implementation is `53f7860`, following baseline `62d8b2e`.
- Issues [#1](https://github.com/markdlabrecque/acolyte/issues/1), [#4](https://github.com/markdlabrecque/acolyte/issues/4), [#6](https://github.com/markdlabrecque/acolyte/issues/6), [#7](https://github.com/markdlabrecque/acolyte/issues/7) and [#9](https://github.com/markdlabrecque/acolyte/issues/9) are closed. Issue #7 closure and PR #16 merge were verified on GitHub. Issue #1 was closed by hand after PR #14 merged.
- GitHub reports **4 open issues and no open PRs**. No CI checks are configured. The owner authorized merging on passing local tests and typecheck.
- The saved remote now uses `ssh://git@github.com/markdlabrecque/acolyte`; fetching succeeds. The earlier `github-mark` alias failure is no longer the current remote configuration.
- The checkout is clean on `main`. There is one local worktree. No remote `develop` branch existed when checked; the owner selected `main` as the PR target instead.

## Issue #10: test trim merged

[PR #17](https://github.com/markdlabrecque/acolyte/pull/17) (`f2e4f8f`, merged at `cd14306`) closed issue #10. It retired the two Pi library contract tests, merged or removed three overlapping adapter tests and trimmed three redundant usage values. The Pi decision applied the owner's standing rule against tests of third-party code; the tests can be restored from `83f4449`. One fresh independent review approved with no must-fix findings. The suite now has 109 tests, all passing, and typecheck is clean (it was 119 tests before). No CI is configured. [Evidence](docs/evidence/issue-10-test-trim.md) records review nits and limitations.

## Issue #7: model-call refactor approved, merged

[PR #16](https://github.com/markdlabrecque/acolyte/pull/16) merged `7908716` into `main` at `d2e6764` and closed issue #7. Fixture and live drivers now use a shared interface; common code owns transport deadlines and sanitized responses. Effective limits, todo authorization, route validation, terminal events and missing-file checks each have shared implementations. Plain configuration uses `structuredClone`; Pi transaction proxies retain their required JSON copy.

Independent review rejected the first split, then a fresh review approved the corrected candidate. All 13 reviewed source/test hashes match the merged files. Parent and reviewer each passed 119 tests and typecheck with no existing assertions changed. Parent reran both checks before publication and again on merged `main`; all 119 tests passed with no failures or skips. `git diff --check` passed. GitHub reported no CI checks configured, so the merge used the project's accepted local checks and independent review. [Review rounds, finding dispositions, exact hashes and retained outputs](docs/evidence/issue-7-model-call-refactor.md) remain available.

The owner explicitly authorized commit, push, PR merge, local synchronization and this separate `CURRENT.md` commit on `main`. Earlier candidate-only statements in the runtime and ticket evidence describe the pre-publication stage. No real credentials or live inference were used; TD-002 remains blocked on its separately authorized live acceptance. Issues #8 and #10 remain open.

## Issue #9: credential loader independently approved, merged

[PR #15](https://github.com/markdlabrecque/acolyte/pull/15) fixes the independent review's credential-disclosure and file-check race findings. The helper checks and reads one descriptor with an actual byte limit. Raw and dotenv keys receive the same validation before dispatch. Failed provider responses contain only safe fields; partial streaming messages are no longer published or persisted. Progress deadlines still refresh on incoming deltas.

Fresh independent technical review approved `932b7ba`, with no remaining must-fix findings. Parent and reviewer each passed all 117 tests and typecheck. [Review history, finding dispositions, outputs and limitations](docs/evidence/issue-9-credential-review.md) are retained. The owner authorized the PR merge and this separate status update on `main`. No real credentials, live inference or production systems were used. TD-002 still needs separately authorized live acceptance.

## Earlier completed work

- Refreshed this snapshot and nine related documents, corrected stale Cairn repository/PR/worktree pointers, removed the personal credential-file path, and separated historical test evidence from current acceptance claims. The recorded Cairn product name remains unchanged. Documentation issue #8 remains open.
- Implemented issue #6 through the supported Pi database API. The pinned runtime retains the supplied connection; the missing guard was a readback after storage initialization, not a check on a second connection. `ownStore()` now requires FULL both before and after initialization, before the runner can become ready.
- Added regression tests that first reproduced unsafe readiness after injected OFF/NORMAL settings, then passed with the fix. Tests read FULL inside real Pi storage transactions, including new request commits before and after reopening, and verify failed startup releases ownership for a clean restart.
- Passed all 98 tests with no failures/skips and typecheck, including a rerun before commit. Independent review found no must-fix implementation findings; its reopened-commit coverage observation was corrected and tests rerun. The reviewer could not issue authoritative workflow approval because its workflow/gate configuration was unavailable. This is not final TD-002 approval.
- Committed, pushed, opened PR #11 into `main`, and merged it after explicit owner confirmation that local green checks were sufficient without remote CI. Retained [implementation, test and review evidence](docs/evidence/issue-6-storage-durability.md) describes the pre-publication work; this snapshot records the later merge and issue closure.

## Issue #1: todo page size bounded by input limits (merged)

[PR #14](https://github.com/markdlabrecque/acolyte/pull/14) (`f48c7d2`) makes startup config validation require `limits.inputTokens` to cover a full `limits.listPage` of worst-case escaped 500-character titles (see `src/tools/todo-limits.ts`). `list_todos` also sets a Pi output limit so a full page's JSON is not truncated. The example config now uses 98,304 input tokens for 20 items. Old configs with 20 items and 8,192 tokens fail validation until raised. Raising the limit raises the per-call reservation; the monthly cap is unchanged. Tests cover full pages with escaped titles and the config check; details are in the README section "Todo list size limits". Long conversation histories or multiple pages can still hit the overall input limit. I did not rerun the suite for this update, and no evidence file records PR #14's test counts.

## Issue #4: persisted batch contract verified (merged, closed)

The pinned Pi runtime already commits the full assistant tool-call message and a generation checkpoint before dispatching any call. The [written decision and evidence](docs/evidence/issue-4-tool-batch.md) accept those records as the authoritative batch, rather than adding an application copy. Per-call application actions still own authorization and the atomic todo/result write.

New tests send SIGKILL before the first tool executes and after its todo/result commit. A separate paused process reads the original batch and pending second call from SQLite before another process resumes the submission. Both original calls complete with exactly two todos; the first saved effect and action identity survive unchanged. No production code or schema changed. Independent technical review found no must-fix findings and reproduced the passing tests and typecheck. Final workflow approval remains unavailable. This proves the bounded Pi/production-todo contract, not full runner admission, socket, budget or final-outcome recovery. Merged in [PR #13](https://github.com/markdlabrecque/acolyte/pull/13); issue #4 is closed.

## TD-002: implemented, live smoke pending

The CLI, authenticated gateway, separate runner, Pi Durable and SQLite add/list path is committed. It uses schema-validated JSON and exposes `add_todo` and `list_todos`. The selected model remains DeepInfra `deepseek-ai/DeepSeek-V4-Flash-0731`.

The issue #4 merge candidate passed 101 tests with no failures/skips and typecheck (before PR #14, which added tests and was not recorded in evidence); [batch-contract evidence](docs/evidence/issue-4-tool-batch.md) retains the outputs. The merged issue #6 source passed 98 tests; its [evidence](docs/evidence/issue-6-storage-durability.md) includes the earlier failing regression. The prior 94-test report and retained 85-test outputs describe older candidates. Review round 2 is pre-dotenv evidence, not current-candidate approval. The protected credential loader and adapter fixes have independent approval at `932b7ba`. The subsequent issue #7 refactor has fresh independent approval, and the merged current suite passes 119 tests and typecheck.

No retained evidence establishes a real DeepInfra add/list pass. The commit title does not close that acceptance gate. The [TD-002 ticket](docs/tickets/002-first-todo-round-trip.md) therefore keeps formal status `blocked`: implemented, live smoke pending. No live inference or credential access is authorized by this update.

Issue #6 is merged and closed. The store checks FULL again after Pi storage initialization, and tests read `synchronous=2` inside actual runtime transactions on fresh and reopened stores. OFF/NORMAL initialization fault tests reject runner startup before readiness and verify resource release. This is not a power-loss proof. Full tool-call-batch persistence now has a written ownership decision and local SIGKILL contract coverage under issue #4. `limits.warningUsd` is validated but unused; warning behavior belongs to TD-004.

Use the [local implementation tracker](docs/tickets/README.md), [TD-002 ticket](docs/tickets/002-first-todo-round-trip.md), [runtime evidence](docs/runtime-contract.md), and [portable credential-file instructions](docs/credentials.md).

## Current GitHub follow-ups

These four issues remain open after issues #1, #4, #6, #7, #9 and #10 closed. These numbers belong to Acolyte, not the old Cairn planning hierarchy.

- [#2: Status errors say "rejected" when the service is down](https://github.com/markdlabrecque/acolyte/issues/2)
- [#3: Make command-line answers readable by default](https://github.com/markdlabrecque/acolyte/issues/3)
- [#5: Decide whether users see progress while the assistant works](https://github.com/markdlabrecque/acolyte/issues/5)
- [#8: Bring TD-002 records in line with what was built](https://github.com/markdlabrecque/acolyte/issues/8)

Credential-loader review and the model-call refactor are complete and merged. TD-002 still requires a separately authorized live smoke. The documentation reconciliation in [#8](https://github.com/markdlabrecque/acolyte/issues/8) remains open; this update does not authorize another issue or live inference.

## Later implementation

The local dependency order remains:

1. [TD-003: crash-safe recovery](docs/tickets/003-crash-safe-recovery.md), after TD-002 acceptance.
2. [TD-004: persisted limits](docs/tickets/004-persisted-limits.md), after TD-003.
3. [TD-005: Linux services and recorded demo](docs/tickets/005-linux-service-demo.md), after TD-004.

These remain draft plans, not implementation authorization. The former snapshot recorded an owner-confirmed recovery policy: uncertain inference may create a fresh attempt only within the shared initial-attempt-plus-two-retries cap and remaining funds, time and model-call limits. Preserve the prior possible charge; use a new durable identity and reservation; reuse completed responses. Exhausted limits produce a visible blocked/partial outcome. This historical decision does not authorize tool or external-write replay or reset budgets on restart, and is not Acolyte issue #7.

## Broader scope and boundaries

[Specification task 19](.scratch/personal-assistant/issues/19-finalize-implementation-specification.md) remains open. Full M0–M4 implementation, acceptance and owner sign-off are incomplete. Slack remains the final user interface; CLI/HTTP are internal interfaces for this slice. See the [PRD](pi-durable-personal-agent-prd.md) and [remaining work](docs/remaining-work.md).

Slack, Google and Proton spikes remain complete and closed. Preserve their [completion ledger](docs/evidence/integration-spike-ledger.md), retained evidence and exclusions, including lock/suspend exclusions and the deliberately uncertain Proton no-write action. Do not rerun them for this slice. Historical artifact paths and review hashes are retained as provenance, not current runnable instructions.

Before claiming TD-002 acceptance, resolve the remaining documented acceptance gaps and obtain separate owner authorization for a bounded live add/list smoke with sanitized evidence. This update installs no services, changes no host settings, reads no credentials, and authorizes no deployment.
