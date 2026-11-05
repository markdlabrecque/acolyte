# Issue 7 model-call refactor

Issue: [#7](https://github.com/markdlabrecque/acolyte/issues/7).
Reviewed candidate: changes on `refactor/7-model-call`, based on `eb4f3fe`, uncommitted at review time. The [candidate manifest](issue-7-candidate.sha256) identifies all 13 reviewed source/test files. The owner subsequently authorized commit, push, PR merge, local synchronization and a separate `CURRENT.md` update. Before publication, all manifest hashes matched and the parent reran all 119 tests, typecheck and `git diff --check` successfully.

## Changes

- `deepinfra.ts` retains durable binding, intent, reservation, dispatch, answer persistence and settlement. Its single `finish()` handles terminal replay, success and error events.
- `provider-call.ts` owns shared transport deadlines, stream consumption, response sanitization and normalized usage checks. `fixture-stream.ts` and `live-stream.ts` implement the same small driver interface. The live driver owns raw wire usage validation; fixture scripting loads dynamically only in fixture mode. Fixture mode remains in the configuration schema.
- `runtime/limits.ts` owns accepted/current effective bounds, active-time checks and call counting. Todo authorization is shared between both transactions. Both transactions still recheck authorization.
- `http.ts` owns the route pattern and method validation for gateway and runner. Authentication and runner sender checks remain at their previous boundaries.
- `host/store.ts` shares ENOENT handling without weakening ownership checks.
- Plain configuration copying uses `structuredClone`. The transaction receipt copy must remain JSON serialization because Pi transaction documents are proxies.

No existing test file, assertion, dependency, schema, credential-loading rule or recovery policy changed. Two added tests cover shared route boundaries and accepted/current time/call limits.

## Validation

Node `v24.20.0`. Parent and fresh independent reviewer each ran:

- `npm test`: **119 passed, 0 failed, 0 skipped**. [Parent output](issue-7-tests.txt).
- `npm run typecheck`: passed with no diagnostics. [Output](issue-7-typecheck.txt).

Parent also ran `git diff --check` successfully. The first extraction passed all 117 existing tests before the two new tests were added. There was no separate pre-edit baseline run in this session; earlier 117-test evidence remains under issue 9.

Trying `structuredClone(next)` for the transaction receipt caused five existing tests to fail. No assertions were weakened. A separate synthetic `Harness.commit` check confirmed `structuredClone(await tx.doc(StateDoc))` throws `DataCloneError`, while JSON copying succeeds. Restoring the transaction copy made all 119 tests pass. This is a required compatibility exception to the issue comment's proposed blanket replacement, not deferred broken behavior. An initial standalone probe omitted the required registry and failed during setup; the corrected probe supplied a registry and models and demonstrated the clone failure.

## Independent review history

### Round 1: REJECT

Reviewed [first-candidate hashes](issue-7-round-1.sha256). Reviewer independently passed 119 tests and typecheck, but rejected the split because fixture and live drivers still occupied one file and the common usage check still branched on mode.

Disposition: moved the drivers into separate modules and moved wire-usage matching into the live driver behind `ProviderDriver`. The common transport no longer branches by mode for usage. Also completed the issue comment's effective-limit helper, list-page bound, ENOENT cleanup and plain-config clone replacement.

### Round 2: APPROVE

A fresh review verified every hash in [the corrected candidate](issue-7-candidate.sha256), reran 119 tests and typecheck, and found no must-fix issues. It explicitly accepted the transaction-proxy JSON-copy exception and confirmed the first rejection was resolved.

The reviewer checked preserved route/error ordering, accepted/current limits, list-page cap, terminal event mapping, per-call raw usage state, fixture-only dynamic loading and unchanged existing assertions. The first review additionally checked binding and replay refusal, reserve/dispatch/persist/settle ordering, sanitization, conservative settlement, deadlines and loopback confinement.

Non-blocking observations: the fixture import begins at provider construction, so a missing local module could reject before a call awaits it; `structuredClone` preserves undefined properties that JSON drops, although validated JSON configuration has none. Neither observation was a rejected requirement or a deferred must-fix finding.

## Boundaries

Tests used temporary synthetic credentials, local SQLite stores and loopback HTTP/SSE. No real credentials, live inference, production access or service installation occurred. Publication and merge had not occurred at review time; the subsequent delivery status is recorded in `CURRENT.md`. Review of the actual remote provider remains outside this evidence. TD-002 is still **implemented, live smoke pending**, with formal status blocked. This refactor does not establish TD-003 recovery acceptance or decide whether to retire Pi contract tests under issue 10.
