# Deliver the first bounded CLI-to-todo round trip

ID: TD-002
Type: implementation
Status: blocked
Delivery: implemented, live smoke pending
Assignee: unassigned for remaining acceptance and review
Parent: [TD-001](001-crash-safe-todo-slice.md)
Depends on: none
Start gate: recorded slice approval and explicit implementation authorization

## Outcome

One request crosses the real CLI, gateway, agent runner, Pi Durable, provider adapter, and SQLite store. It creates a todo and returns a stored result. A second request lists that todo.

## Before work

Read the parent's contracts, the [PRD dependency requirements](../../pi-durable-personal-agent-prd.md#dependency-evidence-and-verification-boundary), and the [existing source research](../../.scratch/personal-assistant/research/pi-durable-contract.md). No connector research or account tests are needed.

The existing research names Pi Durable and Pi AI 1.4.0 as candidates. Pin the actual tested package artifact and transitive lockfile. Record the exact Node 24 build and its SQLite version. Do not label historical metadata as a current release check.

## Implementation

1. Add the smallest TypeScript package, tests, and JSON configuration with schema validation. Pin runtime/package versions. Keep secrets in protected host files referenced by configuration. Defer YAML support, testing, and linting.
2. Exercise the public Pi APIs in a retained adapter contract test. Establish supported document transactions, durable submission identity, explicit extension selection, stable tool identity, model interception, and FULL SQLite settings before building around them.
3. Start one gateway and one runner as separate processes. The runner owns the store and a restricted Unix socket. Require loopback authentication and reauthorize the route at the runner. Take the canonical ownership lock before writable open.
4. Implement the three HTTP routes and `submit`, `status`, `result`, and `config validate` CLI commands from TD-001. Admit and acknowledge only after durable commit. Store payload digests and configuration snapshots without credential values.
5. Register `add_todo` and `list_todos` explicitly. Enforce schemas and permissions outside model code. Store title, open state, creation time, and stable todo ID. Bound list pages and model context. Atomically store each add result with its todo.
6. Connect the selected DeepInfra model through Pi AI and a replaceable provider adapter. Own credentials, usage extraction, price configuration, streaming progress, and tool-call conversion there.
7. Before any live request, implement finite call/tool/time limits and the separate shared ledger reservation path. Require known pricing and a configured output bound. Disable hidden provider retries. Persist the exact tool-call batch before invoking a tool.
8. Run the same path with a deterministic local provider fixture. Once the owner authorizes a bounded live smoke and supplies credentials through an approved local file, run add/list against the exact selected model. Never fetch credentials from 1Password.

Each step ends in runnable code or a focused passing test. Do not build unused multi-agent, connector, scheduler, plugin, or portability frameworks.

## Implemented files

- `package.json`, `package-lock.json`, `tsconfig.json`
- `config/assistant.example.json`, using the confirmed JSON format
- `src/config.ts`, `src/cli.ts`, `src/gateway.ts`, `src/runner.ts`
- `src/runtime/pi-durable.ts`, `src/host/store.ts`
- `src/tools/todos.ts`
- `src/inference/deepinfra.ts`, `src/inference/budget.ts`
- `tests/slice.test.ts`, `docs/runtime-contract.md`

These files exist in committed implementation `53f7860`. Keep the public module interface small: submit, inspect status, retrieve result, resume, and close. The deterministic provider and DeepInfra adapter share the same inference checks.

## Acceptance

- [x] Record exact artifacts, integrity/lockfile, runtime/storage versions, public exports used, and effective PRAGMAs. [Issue #6 evidence](../evidence/issue-6-storage-durability.md) now verifies FULL inside actual runtime commit transactions and rejects initialization downgrades before readiness. This is not power-loss proof.
- [x] A normal add/list pair crosses both real processes and Pi Durable, not a replacement loop or direct CLI database write. Deterministic fixture only; see retained test output.
- [x] CLI disconnect does not cancel the admitted request. Its original receipt returns the stored answer.
- [x] Reusing an identical request returns the original receipt. Changed content returns 409. Two distinct requests with the same todo title create two todos.
- [x] Unauthenticated input, a denied route/tool, and malformed configuration create no run or todo. Credentials and request bodies stay out of ordinary logs.
- [x] Unknown prices, absent credentials, exhausted funds, and finite request limits block dispatch before a network call.
- [x] A reservation and durable dispatch intent precede every provider attempt. Recorded usage settles known results; uncertainty retains a conservative charge.
- [x] The exact full tool-call batch is stored before execution. [Issue #4's tested decision](../evidence/issue-4-tool-batch.md) uses Pi's assistant entry and generation checkpoint, with SIGKILL proof before the first tool and after its saved effect. Full runner recovery remains TD-003 work.
- [ ] The authorized live smoke uses `deepseek-ai/DeepSeek-V4-Flash-0731`, records usage, and completes add/list. If it is not authorized or available, record the blockage rather than claiming a real-model pass.
- [x] Configuration uses schema-validated JSON and the tool allowlist contains only `add_todo` and `list_todos`. YAML support, testing, and linting remain outside this slice.

## Stop condition

If the public Pi interfaces cannot provide the required transaction, replay, or pre-dispatch checks, stop with the exact failed contract and a small reproduction. Do not add a second execution engine or edit upstream tables.

## Implementation authorization

The owner explicitly authorized TD-002 implementation in the clean worktree on `feat/td-002-todo-round-trip`, off develop with the planning commit cherry-picked. Test the actual dependency first and stop with a retained executable reproduction if its public contract fails. Deterministic local fixtures only. No live inference, credentials, connector tests, or host/service installation. The parent coordinates local commits and fresh review. The owner authorized a local merge only after completion and passing review. No push is authorized.

## Publication and current checkout

The authorization above describes the original implementation session. Later publication to Cairn and a draft PR into `develop` were authorized historically. The current repository is [markdlabrecque/acolyte](https://github.com/markdlabrecque/acolyte), with implementation committed at `53f7860`, titled `TD-002 complete.`. GitHub reported no open PRs on 2026-11-03. The old draft PR is not the current delivery pointer; see [CURRENT.md](../../CURRENT.md).

TD-002 is implemented, live smoke pending. The commit title does not establish acceptance. The protected dotenv loader and synthetic tests were added after independent review round 2. [Issue #9 review](../evidence/issue-9-credential-review.md) now approves the corrected loader and adapter at `932b7ba` after two rejected candidates. The review record, `*-current.txt` outputs, and `td002-candidate-files.sha256` are historical pre-dotenv evidence, not hashes or approval for `53f7860`.

## Evidence

Independent review REJECTED checkpoint `824494f` on `feat/td-002-todo-round-trip`. The reviewer showed that Pi AI normalizes missing raw counts to zero and recomputes the total, allowing incomplete or inconsistent usage to settle the 17,408-microdollar reservation at 20, 5, or 25. [Reviewer usage checks](../evidence/td002-independent-usage-check.txt) and [adversarial records](../evidence/td002-independent-adversarial.txt) retain the failure.

The raw-usage correction, now included in `53f7860`, uses Pi's supported pre-normalization `onProviderStreamEvent` observer in the mandatory adapter. Live settlement requires complete nonnegative safe-integer raw prompt/completion/total counts, a consistent raw sum, and agreement with normalized usage. Otherwise the reservation stays conservative and unsettled. No dependency or private Pi tables changed. New loopback regressions retain all old assertions and cover missing fields, inconsistent totals, negative/fractional/unsafe/string/null counts, valid usage, and explicit zeros. The new regression ran red before the fix. The owner explicitly authorized these test additions and fixture/type corrections; no test was weakened, retired, or skipped.

Current integrated checks on the issue #4 candidate: 101 tests passed, zero failed/skipped, and typecheck passed. [Batch-contract evidence](../evidence/issue-4-tool-batch.md) records the owner-authorized decision and SIGKILL tests against unchanged production code. The merged issue #6's [98-test evidence](../evidence/issue-6-storage-durability.md) retains its separate FULL-mode regression. Neither issue authorizes live inference or full TD-003 implementation. The older 94-test report and retained pre-dotenv 85-test suite remain historical evidence.

The new deterministic loopback HTTP/SSE fixture runs the actual live DeepInfra adapter implementation and Pi's OpenAI-completions implementation, using synthetic authorization only. It proves local wire conversion and guards, not DeepInfra/model availability, current pricing, real usage, or answer quality. No external inference occurred.

This is not a Pi dependency stop: the executed document/FULL and stable replay contracts passed. No public-contract failure justifies replacing the dependency. The requested transaction/replay reproduction remains executable in `tests/pi-durable-contract.test.ts` and `tests/pi-replay-contract.test.ts`.

[Runtime contract evidence](../runtime-contract.md) records package/runtime/storage pins, public APIs, commands/results, changed paths, limitations, and corrected history. Historical [focused safety output](../evidence/td002-safety-focused-current.txt), [full cheap suite](../evidence/td002-tests-current.txt), [green typecheck](../evidence/td002-typecheck-current.txt), and [candidate source/document hashes](../evidence/td002-candidate-files.sha256). Historical [three-test pass](../evidence/td002-focused-tests.txt), [original red typecheck](../evidence/td002-typecheck.txt), and [artifact/PRAGMA output](../evidence/td002-runtime-versions.json) remain intact. The new real-process socket replacement failure and its correction are retained in the runtime evidence.

Open acceptance and review gaps:

- Live smoke remains pending, with no retained authorization or real-model pass. The exact selected model is unchanged. No credential file was inspected for this update.
- [#9](https://github.com/markdlabrecque/acolyte/issues/9) has [independent approval](../evidence/issue-9-credential-review.md) of the credential loader, adapter fixes and tests at `932b7ba`. All findings were fixed; 117 tests and typecheck pass. Live acceptance is still pending. [Review round 2](../evidence/td002-review-round-2.md) approved the pre-dotenv correction after 85 suite tests, typecheck and 13 additional loopback checks, not the later loader or ticket completion.
- [#4](https://github.com/markdlabrecque/acolyte/issues/4) has a [written decision and SIGKILL tests](../evidence/issue-4-tool-batch.md) accepting Pi's assistant entry and generation checkpoint as the authoritative full batch. No duplicate application batch is needed on the pinned path. The issue remains open pending publication; full runner recovery is not claimed.
- [#6](https://github.com/markdlabrecque/acolyte/issues/6) is merged and closed, with [post-initialization readback and actual runtime-transaction evidence](../evidence/issue-6-storage-durability.md). The old standalone probe is not the basis of this acceptance check.
- `limits.warningUsd` is schema-validated but unused by the runtime. Its warning behavior belongs to [TD-004](004-persisted-limits.md), not a completed TD-002 feature.

The remaining follow-ups are listed in [CURRENT.md](../../CURRENT.md). Formal ticket status stays `blocked`, with delivery described as implemented, live smoke pending. This documentation update closes no issue and grants no execution or merge authorization.

Unknown/stale sockets intentionally fail closed rather than being automatically reclaimed. TD-003 must define and test crash restart/stale-endpoint recovery. The full crash matrix, persisted race suite, service/reboot and power-loss proofs remain outside this candidate. TD-003 through TD-005 remain drafts.
