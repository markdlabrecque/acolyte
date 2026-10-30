# Deliver the first bounded CLI-to-todo round trip

ID: TD-002
Type: implementation
Status: blocked
Assignee: implementation agent, TD-002 worktree
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

## Proposed files

- `package.json`, `package-lock.json`, `tsconfig.json`
- `config/assistant.example.json`, using the confirmed JSON format
- `src/config.ts`, `src/cli.ts`, `src/gateway.ts`, `src/runner.ts`
- `src/runtime/pi-durable.ts`, `src/host/store.ts`
- `src/tools/todos.ts`
- `src/inference/deepinfra.ts`, `src/inference/budget.ts`
- `tests/slice.test.ts`, `docs/runtime-contract.md`

These are proposed locations, not existing exports or files. Keep the public module interface small: submit, inspect status, retrieve result, resume, and close. The deterministic provider and DeepInfra adapter share the same inference checks.

## Acceptance

- [x] Record exact artifacts, integrity/lockfile, runtime/storage versions, public exports used, and effective PRAGMAs.
- [x] A normal add/list pair crosses both real processes and Pi Durable, not a replacement loop or direct CLI database write. Deterministic fixture only; see retained test output.
- [x] CLI disconnect does not cancel the admitted request. Its original receipt returns the stored answer.
- [x] Reusing an identical request returns the original receipt. Changed content returns 409. Two distinct requests with the same todo title create two todos.
- [x] Unauthenticated input, a denied route/tool, and malformed configuration create no run or todo. Credentials and request bodies stay out of ordinary logs.
- [x] Unknown prices, absent credentials, exhausted funds, and finite request limits block dispatch before a network call.
- [x] A reservation and durable dispatch intent precede every provider attempt. Recorded usage settles known results; uncertainty retains a conservative charge.
- [ ] The authorized live smoke uses `deepseek-ai/DeepSeek-V4-Flash-0731`, records usage, and completes add/list. If it is not authorized or available, record the blockage rather than claiming a real-model pass.
- [x] Configuration uses schema-validated JSON and the tool allowlist contains only `add_todo` and `list_todos`. YAML support, testing, and linting remain outside this slice.

## Stop condition

If the public Pi interfaces cannot provide the required transaction, replay, or pre-dispatch checks, stop with the exact failed contract and a small reproduction. Do not add a second execution engine or edit upstream tables.

## Implementation authorization

The owner explicitly authorized TD-002 implementation in the clean worktree on `feat/td-002-todo-round-trip`, off develop with the planning commit cherry-picked. Test the actual dependency first and stop with a retained executable reproduction if its public contract fails. Deterministic local fixtures only. No live inference, credentials, connector tests, or host/service installation. The parent coordinates local commits and fresh review. The owner authorized a local merge only after completion and passing review. No push is authorized.

## Publication update

The owner subsequently authorized committing all authored work, publishing to the public `markdlabrecque/cairn` repository, and opening a draft PR into `develop`. This supersedes the earlier no-push restriction, not the live-acceptance gate or merge restriction. TD-002 remains blocked pending a separately authorized live DeepInfra smoke. No live inference or service installation is part of publication.

The protected dotenv credential loader and its synthetic tests were added after independent review round 2. They are locally tested but have not been independently re-reviewed. The review record, `*-current.txt` outputs, and `td002-candidate-files.sha256` below are historical pre-dotenv snapshot evidence, not hashes or approval for the published source. Publication checks are reported on the draft PR.

## Evidence

Independent review REJECTED checkpoint `824494f` on `feat/td-002-todo-round-trip`. The reviewer showed that Pi AI normalizes missing raw counts to zero and recomputes the total, allowing incomplete or inconsistent usage to settle the 17,408-microdollar reservation at 20, 5, or 25. [Reviewer usage checks](../evidence/td002-independent-usage-check.txt) and [adversarial records](../evidence/td002-independent-adversarial.txt) retain the failure.

The current uncommitted correction on `824494f` uses Pi's supported pre-normalization `onProviderStreamEvent` observer in the mandatory adapter. Live settlement requires complete nonnegative safe-integer raw prompt/completion/total counts, a consistent raw sum, and agreement with normalized usage. Otherwise the reservation stays conservative and unsettled. No dependency or private Pi tables changed. New loopback regressions retain all old assertions and cover missing fields, inconsistent totals, negative/fractional/unsafe/string/null counts, valid usage, and explicit zeros. The new regression ran red before the fix. The owner explicitly authorized these test additions and fixture/type corrections; no test was weakened, retired, or skipped.

Latest local checks: `npm test` exits 0 with 85 passed and 0 failed/skipped; `npm run typecheck` exits 0 with no diagnostics. The adapter suite passes 48 tests and the focused safety command passes 84. Example schema validation, local document checks, manifest verification, and `git diff --check` pass. These are cheap green checks, not fresh reviewer or authoritative-gate approval.

The new deterministic loopback HTTP/SSE fixture runs the actual live DeepInfra adapter implementation and Pi's OpenAI-completions implementation, using synthetic authorization only. It proves local wire conversion and guards, not DeepInfra/model availability, current pricing, real usage, or answer quality. No external inference occurred.

This is not a Pi dependency stop: the executed document/FULL and stable replay contracts passed. No public-contract failure justifies replacing the dependency. The requested transaction/replay reproduction remains executable in `tests/pi-durable-contract.test.ts` and `tests/pi-replay-contract.test.ts`.

[Runtime contract evidence](../runtime-contract.md) records package/runtime/storage pins, public APIs, commands/results, changed paths, limitations, and corrected history. Current [focused safety output](../evidence/td002-safety-focused-current.txt), [full cheap suite](../evidence/td002-tests-current.txt), [green typecheck](../evidence/td002-typecheck-current.txt), and [candidate source/document hashes](../evidence/td002-candidate-files.sha256). Historical [three-test pass](../evidence/td002-focused-tests.txt), [original red typecheck](../evidence/td002-typecheck.txt), and [artifact/PRAGMA output](../evidence/td002-runtime-versions.json) remain intact. The new real-process socket replacement failure and its correction are retained in the runtime evidence.

Blocked conditions:

- Live smoke remains unauthorized and real credentials were not supplied or accessed. The exact selected model is unchanged. Its acceptance checkbox stays open and the ticket stays blocked, not done.
- Review round 1 REJECTED the checkpoint. Fresh independent review round 2 APPROVED the corrected code with no must-fix findings. It reran all 85 tests, typecheck, and 13 additional loopback checks. See the [review record](../evidence/td002-review-round-2.md). This is code approval, not completion or merge approval.
- The full ticket remains BLOCKED until the separately authorized live smoke passes. No partial merge authorization is assumed.

The earlier test-correction approval blocker is resolved. The local correction passed fresh code review; the failed first review remains recorded. Unknown/stale sockets intentionally fail closed rather than being automatically reclaimed. TD-003 must define and test crash restart/stale-endpoint recovery. The full crash matrix, persisted race suite, service/reboot and power-loss proofs remain outside this TD-002 candidate.

This continuation made no commit, merge, push, subagent, service installation, connector test, or live-inference call. The parent checkpoint is prior history. TD-003 through TD-005 remain drafts.
