# Runtime SQLite FULL verification

Date: 2026-11-03
Issue: [Acolyte #6](https://github.com/markdlabrecque/acolyte/issues/6)
Branch: `fix/6-runtime-sqlite-full`
Base commit: `343bdf5`
Status: implemented locally; GitHub issue remains open

## Authorization and scope

The owner authorized verifying FULL mode on the connection Pi Durable actually uses, failing startup without it, adding regression coverage, and retaining evidence. This work uses temporary local stores and deterministic inference only. No real credentials, external inference, services, production access, or private Pi tables are involved. No commit, push, merge, or issue closure is part of this implementation update.

## Root cause and change

The pinned Pi Durable and Chord 1.4.0 implementations do not open a second connection when the application calls `SqliteStorage.open(db)`. Pi storage retains the supplied database facade. Its commits call that facade's `transaction()`; Chord's transaction executor uses the same underlying Node SQLite connection.

`ownStore()` already set FULL and read it back before `SqliteStorage.open(db)`. It did not check the effective setting after storage initialization. A simulated downgrade during initialization therefore allowed the runner to become ready with synchronous OFF or NORMAL. This is a missing verification boundary, not evidence that the pinned dependency normally downgrades the setting.

`src/host/store.ts` now reads `PRAGMA synchronous` again after `SqliteStorage.open(db)` and requires numeric value `2`. A missing value, query error, or other mode rejects startup through the existing database/lock cleanup path. The existing pre-initialization check remains. The runner receives storage only after both checks, before opening the runtime or publishing its socket.

The inspected dependency files were:

- `@earendil-works/pi-durable/dist/storage/sqlite/storage.js`: public `open(db)` retains the supplied facade; `commit()` calls its transaction method.
- `@earendil-works/chord/dist/sqlite/node.js`: public transaction implementation passes an executor backed by the same connection.

No private fields or tables are accessed by application code or the new tests.

## Executed checks

`tests/storage-durability.test.ts` covers:

1. The actual `ownStore()` and `openRuntime()` path. The test observes the public database transaction callback supplied to Pi storage and queries `PRAGMA synchronous` inside real runtime commit transactions. A fixture request completes and its result survives close/reopen. The focused run observed FULL in 28 fresh-runtime storage transactions and 32 reopened-runtime storage transactions, including commits for a new request in each session.
2. Real runner subprocesses with test-only preload injection after storage initialization. OFF and NORMAL both cause exit code 2, no readiness message, and no published socket. A normal restart acquires the same agent/store locks and becomes ready. There is no production fault-injection configuration.

Before the fix, the positive runtime test passed, but both downgrade cases failed because the runner announced readiness. After the fix, all four reported tests pass, including the parent test and its two subtests. No tests were weakened, simplified, retired, or skipped.

Commands and retained outputs:

- `npm ci --ignore-scripts --no-audit --no-fund` installed the locked dependencies without modifying the lockfile.
- `node --test tests/storage-durability.test.ts`: [red output](issue-6-storage-red.txt), then [green output](issue-6-storage-green.txt).
- `npm test`: [98 passed, zero failed/skipped](issue-6-tests.txt).
- `npm run typecheck`: [exit 0](issue-6-typecheck.txt).
- [Runtime versions and candidate source hashes](issue-6-environment.txt).

## Independent review

A read-only reviewer found no must-fix implementation findings, confirmed the pinned connection ownership contract, and independently passed the focused tests, 98-test suite and typecheck. Its additional missing-result, query-error, string `"2"`, and numeric `3` injections all rejected startup and allowed lock reacquisition. Those additional checks are reviewer-reported, not retained regression tests.

The reviewer noticed that the first version's reopen phase only retrieved the previous result, so its transaction diagnostic overstated reopened commit coverage. The test now also submits and completes a new request after reopening, and calls the observed operations storage transactions rather than treating every operation as a commit. The focused suite, full suite and typecheck were rerun after that correction; their current outputs are linked above. The retained red output predates this test strengthening; only trailing whitespace on blank lines was removed from that output.

The reviewer gave provisional code approval but could not issue authoritative workflow approval because its required workflow file and gate handoff were unavailable. This record does not claim final pipeline approval or TD-002 completion.

## Limits

These results establish the effective connection setting and startup rejection behavior on the pinned dependency. They do not prove host power-loss safety, hardware flush behavior, forced-crash recovery, or live-model acceptance. TD-002 remains implemented, live smoke pending. Tool-call-batch acceptance and independent credential-loader review remain separate work.
