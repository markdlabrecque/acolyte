# TD-002 runtime contract evidence

Independent review rejected checkpoint `824494f` for unsafe usage settlement. Review round 2 later approved the bounded pre-dotenv correction, as recorded below. The subsequent protected dotenv loader and synthetic tests are locally tested but not independently re-reviewed. The `*-current.txt` outputs and `td002-candidate-files.sha256` are retained historical pre-dotenv snapshot evidence, not a manifest or approval of the published source. The owner authorized public publication and a draft PR into `develop`, not merging, live inference, or service installation. Live acceptance remains pending and TD-002 remains BLOCKED. No pipeline-final approval or Pi dependency stop condition is claimed.

## Authorization and worktree

Initial work started on clean branch `feat/td-002-todo-round-trip` at planning commit `91c7880`. The parent checkpointed that work at `d9e841d`. This continuation verified the same branch and a clean worktree at that checkpoint before editing. The owner explicitly authorized correction of the predecessor's test/API/type errors with every assertion retained, focused safety fixes, and deterministic local acceptance tests. This continuation made no commits, merges, pushes, subagents, external inference, production access, connector tests, secret retrieval, or service/global configuration changes. Only synthetic local authentication files were read by the tests. TD-003 through TD-005 remain drafts.

The bounded reviewer-fix continuation started on clean `feat/td-002-todo-round-trip` at `824494f`. The owner authorized new raw-wire regressions and fixture/type corrections with old assertions preserved. Only `src/inference/deepinfra.ts` and `tests/inference-acceptance.test.ts` change executable behavior in this continuation. Documentation and retained evidence are updated below. No commit, merge, push, delegation, live network, real secret access, account, or host change occurred.

The implementor profile references `~/.agents/skills/subagent-tdd-pipeline/SKILL.md`. That file was absent. The owner's request and the local tickets supplied the stage instructions. No separate red-test handoff was present, so the retained tests were authored here.

## Tested artifacts

The registry query during this execution reported `latest: 1.4.0`. That observation is separate from the historical research. The installed npm artifact, not an upstream source checkout, ran every test.

- Node `v24.20.0`, executable `/home/mark/.config/nvm/versions/node/v24.20.0/bin/node`.
- npm `11.19.0`.
- Built-in SQLite `3.53.4`.
- `@earendil-works/pi-durable`, Pi AI, and Chord exactly `1.4.0`.
- TypeBox `1.3.27`, TypeScript `5.9.3`, Node types `24.10.0`.
- `package-lock.json` pins transitive artifacts and their integrity values. SHA-256 `5f2996f87dad39dd788dbc7c5dc8b8219b555149a59d6312494337ee06d24e65`.
- Pi Durable integrity `sha512-EtIyXH1MBSXdJSkodmy+CYXuwfve3gPrD4GNCZ0XmuRWLPupwRlNQ7fdaXjRcLoKb6SWkT/yEzK+sMmrqvYK+Q==`.
- The dev dependency `@modelcontextprotocol/sdk@1.32.2` supplies the optional peer declaration imported by `@google/genai@2.21.0`. Initial typecheck could not resolve that declaration. No MCP implementation or connector test was added. `skipLibCheck` remains off.

[Artifact and PRAGMA output](evidence/td002-runtime-versions.json) records root exports, lockfile entries, and effective values. `openNodeSqliteDatabase()` initially returned WAL with synchronous `1`, NORMAL. Setting FULL through its public `exec()` before `SqliteStorage.open()` produced WAL with synchronous `2`, FULL. The document test sets and checks FULL on both opens. This does not prove power-loss safety.

Registry and runtime commands executed:

```sh
node --version
npm --version
npm view @earendil-works/pi-durable version dist-tags engines exports dependencies --json
npm view @earendil-works/pi-durable@1.4.0 dist --json
npm install --ignore-scripts --no-audit --no-fund
npm ls --depth=0
sha256sum package-lock.json
```

Reproduce the storage/version probe without credentials:

```sh
node --input-type=module <<'JS'
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as durable from '@earendil-works/pi-durable';
import { openNodeSqliteDatabase } from '@earendil-works/pi-durable/storage/sqlite/node';
import { SqliteStorage } from '@earendil-works/pi-durable/storage/sqlite';
const directory = await mkdtemp(join(tmpdir(), 'td002-probe-'));
const db = await openNodeSqliteDatabase(join(directory, 'probe.sqlite'));
try {
  console.log('node', process.version);
  console.log('sqlite', await db.get('SELECT sqlite_version() AS version'));
  console.log('defaults', await db.get('PRAGMA journal_mode'), await db.get('PRAGMA synchronous'));
  await db.exec('PRAGMA synchronous=FULL');
  await SqliteStorage.open(db);
  console.log('effective', await db.get('PRAGMA journal_mode'), await db.get('PRAGMA synchronous'));
  console.log('public exports', Object.keys(durable).sort());
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
  for (const name of ['pi-durable', 'pi-ai', 'chord']) console.log(name, lock.packages[`node_modules/@earendil-works/${name}`]);
} finally { await db.close(); await rm(directory, { recursive: true, force: true }); }
JS
```

An initial metadata probe tried Pi AI's unexported `package.json` subpath and failed with `ERR_PACKAGE_PATH_NOT_EXPORTED`. The successful probe reads the retained lockfile instead. This is not a transaction/replay failure.

## Public APIs exercised

| API | Executed evidence |
| --- | --- |
| `defineDoc`, `Harness.open`, `Harness.commit`, `tx.doc`, `snapshot`, `close` | Application document commit and reopen on actual SQLite. |
| `SqliteStorage.open`, `openNodeSqliteDatabase`, public database `exec`/`get` | FULL set before Pi storage open and read back. No Pi table edits. |
| `defineTool`, `defineExtension`, `createRegistry`, explicit conversation `extensions` and `tools` | Only the todo extension/tool are selected in the replay test; both todo tools plus the inference guard are selected in the process test. No coding tools installed. |
| `Conversation.submit`, stable `requestId`, `Submission.wait`, `Harness.submission` | Receipt retrieval and duplicate submission through the process path; reacquisition after reopen in the contract test. Application digest checking supplies changed-payload conflicts. |
| `AssistantEntry`, `tx.task`, `tx.entry`, tool `api.taskId`/`callId`/`commit`, `replay: 'safe'` | Contract test observes the persisted assistant decision before the application effect, closes after the effect, reopens, and observes the same execution identity with one application item. It uses cooperative close, not SIGKILL. |
| `GenerationTask`, `hook`, public `getTask`, Pi AI `createModels`, `createProvider`, provider streams | Before-request hook binds a durable generation task/attempt to the mandatory adapter. Adapter checks the binding again before reserving or dispatching. Normal fixture path executes it. Focused failure cases now pass in `tests/inference-acceptance.test.ts`. |
| Pi AI `fauxProvider`, `fauxAssistantMessage`, `fauxToolCall`, event stream | Deterministic fixture tool call followed by final answer. No external inference. |

`beforeRequest` is not itself a fail-closed authorization hook. The installed generation code reports ordinary hook errors and continues. Its public hook API provides reads and memos, not a transaction writer. The adapter therefore rejects missing/mismatched attempt binding and owns the pre-dispatch path. The installed `ToolTask` bypasses `beforeTool` on safe replay, so the tool implementation itself checks permissions and limits. Denied tools, accepted/current permissions, limits, unbound inference, persisted application attempt states, and conservative uncertainty now have focused tests. The full forced-crash and persisted race matrices remain TD-003/TD-004 work.

Primary references read include the installed Durable and Pi AI READMEs, Chord README, declarations and relevant installed JavaScript. The linked Durable normative specification was read at historical commit `ede2c9b468d8e061c557d16957513715e6d49cd6`. That source specification is not substituted for the installed artifact. Its local downloaded copy is ignored under `tmp/upstream/`.

## Retained first path

`tests/slice.test.ts` creates an isolated temporary configuration and owner-only synthetic authentication file. It starts a real runner and gateway as separate Node processes, then invokes the CLI in further processes. It executes add, polls the persisted answer, resubmits an identical request, rejects changed content, lists the todo, checks status, rejects unauthenticated input, and checks the child logs for fixture payload/token leakage.

The runner alone opens Pi's agent store. Gateway and CLI forward HTTP only. The host uses `/usr/bin/flock` keepers before writable open and a mode-0600 Unix socket. Application receipts, queue order, todo effects/results, and model intents/responses use supported Pi documents. The host spending ledger is a separate application-owned SQLite file with FULL. These mechanisms now also have focused safety coverage described below, not full crash/reboot acceptance.

The selected provider/model remains DeepInfra `deepseek-ai/DeepSeek-V4-Flash-0731`. Fixture mode is explicit in the test configuration and result metadata; it does not test that model's availability, quality, pricing, or usage reporting. The live adapter uses Pi AI's OpenAI-completions implementation at the direct DeepInfra endpoint, with hidden retries disabled. It has not run against DeepInfra. A literal `127.0.0.1` HTTP/SSE fixture now exercises this exact live-adapter implementation, including OpenAI request fields, streamed add/list tool-call conversion, usage, errors, missing usage, and connection/progress/active deadlines. This is not a real-model pass. The optional endpoint argument is an internal test seam only, absent from configuration and CLI; external test endpoints and redirects are refused.

`config/assistant.example.json` selects live mode, has no credential, and has unknown prices. It is intentionally unable to dispatch. Validation checks its JSON schema without reading a credential. Do not start live work from this example without separate owner authorization.

## Initial checkpoint checks and corrected failures

```sh
npm ci --ignore-scripts --no-audit --no-fund   # repeatable install command, not rerun after final lock update
node --test tests/pi-durable-contract.test.ts tests/pi-replay-contract.test.ts
node --test tests/slice.test.ts
npm test
npm run typecheck
node src/cli.ts --config config/assistant.example.json --json config validate
git diff --check
```

Historical results from the first implementation, retained rather than overwritten:

- `npm test`: 3 tests passed, 0 failed, 0 skipped. [Output](evidence/td002-focused-tests.txt).
- `node --test tests/slice.test.ts`: first ran red because `src/runner.ts` did not exist; after implementation, passed with the real process path.
- The document and replay contract tests also passed before the process implementation.
- `npm run typecheck`: exit 2, six diagnostics in `tests/pi-replay-contract.test.ts`. [Output](evidence/td002-typecheck.txt). Source and installed-dependency declarations now report no diagnostics. A first attempt timed out at 30 seconds; the longer invocation completed and reported the retained errors.
- Example `config validate`: exit 0, `{"valid":true,"fixture":false}`.
- `git diff --check`: exit 0.
- No pre-existing application test suite existed in this worktree. No expensive recovery, reboot, service, connector, or live-inference gate ran. No independent reviewer gate ran.

At the first checkpoint, approval was requested to correct the implementor-authored replay fixture setup:

1. Pass `{ id: 'batch-call-1' }` as the third `fauxToolCall` argument, matching the installed declaration, rather than a string.
2. Add JSON-object/number narrowing before reading the public task input and decode its stored assistant ID at that trusted boundary.
3. Narrow the stored model message to assistant before accessing content block types.

The owner subsequently authorized all three corrections. They are now applied, with all original assertions retained and additional boundary assertions. No test was weakened, deleted, skipped, or retired. This historical compile failure was in the fixture, not evidence that Pi Durable failed the dependency gate.

Two new acceptance-test setup errors were also corrected without dropping assertions: JSON fixtures now use the exported `JsonObject` type, and the application-state arrangement hook is explicitly selected on its conversation and returns `undefined` as Pi's declaration requires. The retained [JSON typecheck failure](evidence/td002-safety-typecheck-red.txt), [hook setup test failure](evidence/td002-hook-setup-red.txt), and [hook typecheck failure](evidence/td002-hook-typecheck-red.txt) precede the current green logs.

A real socket-safety failure was found by the new real-process shutdown test: Node unconditionally unlinks its bound Unix path when closing the server, even if another inode replaced it. The original inode check alone was insufficient. [Red reproduction](evidence/td002-safety-third.txt). The corrected runner binds inside a private mode-0700 directory, sets its socket to 0600, and exclusively publishes a hard link at the configured endpoint. Node only auto-unlinks the private bind path; application cleanup removes the public link only when its device/inode still match. The unchanged assertion now passes for both the ownership helper and real runner shutdown. [Corrected process output](evidence/td002-socket-corrected.txt).

One concurrent tool edit timed out acquiring the harness mutation guard. A later serialized invocation of the same guarded edit succeeded. No guard, lock configuration, or bypass was changed.

## Pre-review local candidate

The continuation fixes the listed ledger, queue, ownership, and startup gaps. Unsettled reservations are idempotent for the same ID and immutable estimate, including ledger reopen; changed amounts and settled IDs cannot authorize dispatch. The adapter rechecks `intent` in its dispatch transaction and refuses an existing `dispatched` attempt. Stored responses are reused. Known complete usage settles once; absent usage, truncated/error responses, and aborted dispatch retain the conservative reservation. Queue wakeups are remembered across worker completion, and a failed worker seals admission/lookup. Receipt/conversation lookups use own properties so valid IDs such as `toString` do not collide with object prototypes.

Socket startup locks the canonical endpoint before publication, refuses any existing socket/file/symlink instead of taking it over, and cleans resources on ledger/runtime/startup failure. Unknown or stale endpoints are intentionally refused, not auto-reclaimed. A crash can therefore require explicit stale-endpoint recovery; TD-003 must define and test that path. No crash-recovery acceptance is inferred from clean startup/shutdown tests. Dangling store aliases and hard links fail closed; existing symlink aliases resolve to the same store lock.

| Retained suite | Claims exercised |
| --- | --- |
| `tests/pi-durable-contract.test.ts`, `tests/pi-replay-contract.test.ts` | Actual pinned Pi artifact, FULL/reopen, persisted assistant batch before effect, stable public tool identity, atomic saved effect, cooperative replay without regeneration. |
| `tests/inference-acceptance.test.ts` | Real live adapter over loopback only; durable intent then reservation then dispatch before wire; add/list tool conversion; known usage settlement; ledger reopen/idempotency/conflicts/cap; persisted intent/answered/dispatched application states through real Pi hooks; missing/unsafe credentials, unknown prices, zero funds, context and model/time bounds; connection/progress deadlines; no hidden retry on 503/truncation/abort. The stored-state tests arrange only supported application documents, not Pi tables. |
| `tests/tools-acceptance.test.ts` | Explicit tool selection, unknown tools/schema rejection, accepted/current permissions, bounded cursor pages, finite tool batch, stable task/call/version action metadata, distinct same-title effects. |
| `tests/config-runtime-acceptance.test.ts` | Strict malformed/unknown/model/path/limit configuration rejection; duplicate before queue capacity; full-queue refusal; repeated admission near idle completion; unavailable application storage cannot acknowledge or become 404. |
| `tests/ownership-acceptance.test.ts` | Real-process duplicate identity/path alias/hard-link/shared-socket refusal; foreign path preservation; initialization failure cleanup; mismatched stored agent identity; replacement inode survives actual runner shutdown. |
| `tests/process-acceptance.test.ts`, `tests/slice.test.ts` | Real CLI/gateway/runner/Pi/SQLite add/list; same-title distinct receipts; CLI and HTTP disconnect after admission; duplicate/conflict; concurrent and idle queue work; denied routes/senders, malformed/oversized bodies; stored reads cause no new ledger attempts; failed outcomes give CLI exit 1; unavailable runner gives 503 and submission says acceptance unconfirmed. |

Pre-review commands and results, superseded by the reviewer correction below:

```sh
node --test tests/pi-durable-contract.test.ts tests/pi-replay-contract.test.ts tests/inference-acceptance.test.ts tests/ownership-acceptance.test.ts tests/config-runtime-acceptance.test.ts tests/tools-acceptance.test.ts tests/process-acceptance.test.ts
# exit 0, 61 passed, 0 failed/skipped
npm test
# exit 0, 62 passed, 0 failed/skipped
npm run typecheck
# exit 0, no diagnostics
node src/cli.ts --config config/assistant.example.json --json config validate
# exit 0, {"valid":true,"fixture":false}; schema validation only
git diff --check
# exit 0
```

These results preceded checkpoint `824494f` and its rejected independent review. The `*-current.txt` evidence paths and candidate manifest now describe the corrected candidate below, not that rejected checkpoint.

## Rejected review and bounded raw-usage correction

The independent reviewer reproduced three unsafe settlements in the installed Pi AI 1.4.0 adapter. Raw `{prompt_tokens:20,total_tokens:25}` settled 17,408 microdollars at 20; raw `{completion_tokens:5,total_tokens:25}` settled at 5; raw `{prompt_tokens:20,completion_tokens:5,total_tokens:2500}` settled at 25. Pi's `parseChunkUsage` defaults missing counts to zero and replaces the raw total with a computed sum. Equality checks on normalized usage therefore did not establish raw completeness or consistency. Retained reviewer outputs: [usage check](evidence/td002-independent-usage-check.txt), [raw and normalized adversarial cases](evidence/td002-independent-adversarial.txt). Review round 1 is REJECTED, not pending or approved.

The mandatory adapter now installs the public `onProviderStreamEvent` observer after the caller options. Installed `dist/types.d.ts` documents that callback as read-only and pre-normalization; `dist/api/simple-options.js` forwards it, and `dist/api/openai-completions.js` invokes it before `parseChunkUsage`. No dependency or private Pi table was patched. The adapter follows Pi's top-level usage or first-choice fallback selection and snapshots the latest selected raw counts before forwarding the caller's observer. Every selected usage record replaces the prior validation result, so an invalid final record cannot reuse an earlier valid record.

Settlement in live mode now requires explicit raw prompt, completion, and total counts, each a nonnegative safe integer, with raw total equal to prompt plus completion. Those raw counts must also match normalized input plus cache counts, output, and total. Existing normalized validity and non-error/non-aborted checks remain. Missing, malformed, or inconsistent raw usage leaves the original reservation unsettled, even if Pi returns a successful answer. Normal complete usage settles at 25 microdollars; explicit zero prompt or completion is accepted when consistent. Fixture-mode behavior is unchanged.

The new local wire regression adds missing prompt/completion/total, inconsistent total, negative/fractional/unsafe/string/null counts in each required field, valid usage, and explicit zero counts. All old assertions remain. Before the source fix, the focused regression exited 1 with 9 passing and 14 failing tests including the parent test. [Red output](evidence/td002-raw-usage-red.txt). After the fix:

```sh
node --test tests/inference-acceptance.test.ts
# exit 0, 48 passed, 0 failed/skipped
node --test tests/pi-durable-contract.test.ts tests/pi-replay-contract.test.ts tests/inference-acceptance.test.ts tests/ownership-acceptance.test.ts tests/config-runtime-acceptance.test.ts tests/tools-acceptance.test.ts tests/process-acceptance.test.ts
# exit 0, 84 passed, 0 failed/skipped
npm test
# exit 0, 85 passed, 0 failed/skipped
npm run typecheck
# exit 0, no diagnostics
node src/cli.ts --config config/assistant.example.json --json config validate
# exit 0, {"valid":true,"fixture":false}; no credential access
# Local document-link/status checks and git diff --check also pass.
```

Evidence: [adapter](evidence/td002-adapter-current.txt), [focused safety suite](evidence/td002-safety-focused-current.txt), [full cheap suite](evidence/td002-tests-current.txt), [typecheck](evidence/td002-typecheck-current.txt), [example](evidence/td002-config-current.txt), [document checks](evidence/td002-document-check.txt), [diff check](evidence/td002-diff-check-current.txt). Candidate revision is the uncommitted correction on `824494f`; the regenerated [SHA-256 manifest](evidence/td002-candidate-files.sha256) covers current source, tests, documents, and TD-002 evidence, including the two outputs whose trailing whitespace the parent normalized before checkpoint. [Hash verification](evidence/td002-candidate-hash-check.txt) must be read alongside it. The manifest excludes itself and its verification output to avoid self-reference.

The first final evidence check exited 2 because npm's successful typecheck output ended with an added blank line at EOF. Only that trailing blank line was removed from `td002-typecheck-current.txt`; no diagnostic or test output was removed. The subsequent diff check and regenerated manifest verification pass. The copied reviewer reproductions match their `/tmp` originals byte for byte.

Fresh independent review round 2 subsequently APPROVED the corrected code with no must-fix findings. The reviewer reran all 85 tests and typecheck, verified the candidate manifest, and passed 13 additional loopback adversarial checks. See the [review record](evidence/td002-review-round-2.md). This is code approval only, not ticket completion or authorization to merge with live acceptance missing. No configured pipeline-final gate is claimed.

## Remaining acceptance and parent decision

The live smoke must still use exactly `deepseek-ai/DeepSeek-V4-Flash-0731` through DeepInfra, complete add/list, and record real usage. It remains unapproved, with no real credential supplied or accessed. No substitute model/provider or credential lookup is permitted. TD-002 and the epic remain unpassed. The full ticket remains BLOCKED until a separately authorized live smoke passes. No partial merge authorization is assumed. Fresh-agent review round 2 approved the code, but did not waive live acceptance. The parent leaves develop unchanged. This implementation does not authorize a partial-code merge or mark the ticket done.

Not run: external inference, TD-003 full forced-crash matrix, TD-004 full persisted race suite, TD-005 services, normal reboot, power-loss, connectors, or an expensive final gate. Local queue/ownership tests are focused acceptance tests, not substitutes for those later tickets.

## Checkpoint paths and continuation changes

The checkpoint already contained the implementation paths below. This continuation changes `src/host/store.ts`, `src/inference/budget.ts`, `src/inference/deepinfra.ts`, `src/runner.ts`, `src/runtime/documents.ts`, `src/runtime/pi-durable.ts`, `src/tools/todos.ts`, and `tests/pi-replay-contract.test.ts`. It adds the five focused acceptance suites and shared `tests/support.ts` listed above, updates this document and the three ticket records, and retains current/historical evidence under `docs/evidence/`. Package pins, lockfile, CLI/gateway/config modules, example configuration, and the two other original tests remain unchanged.

Initial checkpoint paths:

- `.nvmrc`, `package.json`, `package-lock.json`, `tsconfig.json`.
- `config/assistant.example.json`.
- `src/config.ts`, `src/cli.ts`, `src/http.ts`, `src/gateway.ts`, `src/runner.ts`.
- `src/host/store.ts`, `src/runtime/documents.ts`, `src/runtime/pi-durable.ts`.
- `src/tools/todos.ts`, `src/inference/budget.ts`, `src/inference/deepinfra.ts`.
- `tests/pi-durable-contract.test.ts`, `tests/pi-replay-contract.test.ts`, `tests/slice.test.ts`.
- This document, `docs/evidence/td002-focused-tests.txt`, `docs/evidence/td002-typecheck.txt`, `docs/evidence/td002-runtime-versions.json`.
- `docs/tickets/001-crash-safe-todo-slice.md`, `docs/tickets/002-first-todo-round-trip.md`, `docs/tickets/README.md`.
