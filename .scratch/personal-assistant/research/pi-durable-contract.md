# Pi Durable dependency contract

Researched 2026-10-23. Evidence is documentation, package metadata, and source inspection. No dependency was installed, executed, benchmarked, or fault-tested. This resolves factual discovery only; it does not approve the dependency or satisfy M0.

## Identity and candidate pins

The package is `@earendil-works/pi-durable`. The npm registry reports version `1.4.0` as latest, requiring Node `>=22.19.0`, and exact dependencies on `@earendil-works/pi-ai`, `@earendil-works/chord`, `@earendil-works/pi-codemode`, and `@earendil-works/pi-telemetry`, all `1.4.0`. These are candidate exact package pins, not an approved tested stack. [Published metadata](https://registry.npmjs.org/@earendil-works%2fpi-durable/1.4.0)

The published durable package integrity is `sha512-EtIyXH1MBSXdJSkodmy+CYXuwfve3gPrD4GNCZ0XmuRWLPupwRlNQ7fdaXjRcLoKb6SWkT/yEzK+sMmrqvYK+Q==`. Capture the full transitive lockfile during the isolated experiment. The upstream source snapshot inspected is `ede2c9b468d8e061c557d16957513715e6d49cd6`, dated 2026-10-23T15:02:41Z. Its manifest also says 1.4.0. Matching version strings do not prove the tarball contains every change on that commit. Test the actual package artifact, or explicitly select a source build with a documented build process. [Commit](https://github.com/earendil-works/pi/commit/ede2c9b468d8e061c557d16957513715e6d49cd6), [manifest](https://github.com/earendil-works/pi/blob/ede2c9b468d8e061c557d16957513715e6d49cd6/packages/durable/package.json)

## Documented runtime behavior

Upstream calls the API experimental. `Harness.open`, `root`, and `resume` reopen pending work; submit or wait also starts scheduling. Request IDs deduplicate submissions. Task phases restart from their beginning after interruption. Tool intent commits before execution; interrupted tools rerun only when declared `replay: "safe"`, otherwise returning an interrupted result. This is not external-effect reconciliation.

`runtime.sleepUntil` persists deadlines and checkpoints. Node timers resume due tasks while the process lives; `wake` and `onWake` support host-managed wakeups. The host still starts the process after reboot. Reminders therefore have an existing durable scheduling mechanism to evaluate.

Extensions provide tools, tasks, prompt sections, wrappers, and hooks. `beforeTool` can block or rewrite arguments; `afterTool` can replace results. Application documents can commit with entries and task state. The registry is process-owned, and conversations persist selected names. Conversations have their own inboxes; that alone does not establish one-run-at-a-time ordering across every conversation of an agent. Default extension selection includes all installed extensions, so explicit selection matters. [Pinned README](https://github.com/earendil-works/pi/blob/ede2c9b468d8e061c557d16957513715e6d49cd6/packages/durable/README.md)

## Source-supported gaps

The Node adapter uses built-in `node:sqlite`, opens transactions with `BEGIN IMMEDIATE`, serializes connection operations, and sets WAL plus `synchronous = NORMAL`. Its options expose busy timeout and checkpoint threshold, not synchronous mode. The implementation permits constructing `NodeSqliteDatabase` around a host-created connection; whether to use that path with stronger settings is an open design decision. SQLite version follows the selected Node build and must be recorded during testing. [Chord Node adapter](https://github.com/earendil-works/pi/blob/ede2c9b468d8e061c557d16957513715e6d49cd6/packages/chord/src/sqlite/node.ts), [Durable Node adapter](https://github.com/earendil-works/pi/blob/ede2c9b468d8e061c557d16957513715e6d49cd6/packages/durable/src/storage/sqlite/node.ts)

WAL with NORMAL can lose committed transactions after power failure or an operating-system crash. This matters to acknowledged inputs. Process-kill recovery and host-power-loss durability need separate acceptance statements. [SQLite synchronous semantics](https://www.sqlite.org/pragma.html#pragma_synchronous)

Submission lookup is scoped to conversation and request ID. Admission returns an existing record after checking its submission type; the inspected branch does not compare payload content. The application's required changed-payload conflict check therefore needs its own digest and routing identity. [Admission source](https://github.com/earendil-works/pi/blob/ede2c9b468d8e061c557d16957513715e6d49cd6/packages/durable/src/harness/submissions.ts)

Storage commits apply document changes and other record writes in one database transaction, then adopt committed state in memory. Application documents are a plausible way to avoid a separate journal database. Sharing a file by itself does not prove arbitrary host SQL participates in a Harness commit. [Storage implementation](https://github.com/earendil-works/pi/blob/ede2c9b468d8e061c557d16957513715e6d49cd6/packages/durable/src/storage/sqlite/storage.ts)

## Minimum application-owned state to evaluate

These are deductions from the PRD and inspected contracts, not upstream guarantees or a settled schema:

- Stable agent/store identity, recorded configuration revision, current permission policy, and an OS ownership lock.
- Authenticated source routing, original payload digest, receipt-to-submission mapping, capacity limits, and ordering across conversations.
- Stable action identity and arguments, approval binding, attempts, external result or uncertainty, and reconciliation status.
- Reply delivery identity and status; reminder/check configuration, timezone policy, cursor, and last processed occurrence.

The approval decision must survive restart independently of a transient hook invocation. An interrupted-tool error must not let the assistant bypass an unresolved effect by issuing the same action again under a new tool call. Neither capability was demonstrated by this research.

## Isolated experiment plan, not executed

Use a disposable Linux environment, exact package versions, a pinned Node build, local SQLite, deterministic fake model responses, and a controlled fake external API. No production data or credentials are required for this experiment.

1. Record package integrity, Node version, SQLite version, and effective PRAGMAs. Verify exports against the installed release rather than moving documentation.
2. Commit an input, kill before the caller receives its receipt, reopen, and resubmit the same ID. Repeat with changed content to verify the application's conflict guard.
3. Kill during model generation, before tool dispatch, after fake remote success but before local result, and after result commit. Count model attempts and remote effects independently of the transcript.
4. Exercise safe replay and unsafe interruption. Prove pending uncertainty blocks a fresh equivalent action until reconciled.
5. Persist an approval with exact arguments, restart, revoke permission, and verify dispatch is denied. Test changed arguments separately.
6. Persist a sleep, terminate the process, reopen after its deadline, and verify one logical occurrence reaches the outbox. Include clock changes and cancellation.
7. Open two conversations and two launchers to test agent-wide ordering and exclusive ownership. Test a consistent backup/restore with pending work.
8. Test process crashes separately from an isolated VM hard reset. Do not infer power-loss guarantees from SIGKILL tests.

## Decisions now precise

- Does the required acknowledgement contract include host/power-loss durability, and should the chosen SQLite connection use FULL synchronous mode before admission?
- Can application documents plus custom tasks represent approvals, uncertain effects, receipts, and outbox state without bypassing Pi's transaction model?
- How will one agent serialize work across Slack conversations while background checks and reminders remain eligible to run?
- Which exact release/runtime combination passes the isolated experiment, and what amount of application machinery is acceptable before reconsidering Pi Durable?

If the experiment needs a parallel execution engine or cannot preserve permission and effect boundaries, stop for the user's explicit dependency decision. This research establishes promising mechanisms and concrete gaps; it does not establish that such replacement machinery is necessary.
