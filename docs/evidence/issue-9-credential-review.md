# Issue #9 credential loader review

## Result

Independent technical review approves the loader, helper, adapter fixes, tests and credential documentation at `932b7ba`, compared with baseline `49749b2`. No remaining must-fix findings under the documented threat model. This closes the credential-review gate only. TD-002 remains blocked pending separately authorized live add/list acceptance.

## Review history and fixes

1. Baseline review rejected `49749b2`. A malformed raw key reached HTTP header validation and appeared in a persisted error response. The separate `stat(path)` and `readFile(path)` allowed a replacement file to bypass permission and size checks. Coverage omitted these failures.
2. Commit `dd0b10f` validates both credential formats as visible ASCII before dispatch, opens and checks one descriptor, bounds actual reads, and replaces provider failure text. Tests cover raw control characters, unrelated environment variables, literal variable references, no parent search, size boundaries, non-regular files, supported symlinks, ownership rejection, replacement and growth, and reflected HTTP errors.
3. Re-review accepted the loader but rejected the adapter. Provider-controlled `rawStopReason` survived sanitization, and partial streaming events reached Pi's committed `LiveDoc` before a later failure.
4. Commit `932b7ba` publishes terminal responses only and constructs failed responses from safe defaults and local fields. It never forwards partial provider events. Nonempty deltas still refresh progress deadlines. The delayed-stream regression checks `LiveDoc` before releasing failure and the complete `StateDoc` afterward.
5. Fresh final review approved `932b7ba` and independently reran all 117 tests and typecheck successfully.

All findings were fixed; none were deferred. Initial reproductions used synthetic loopback requests and controlled filesystem replacement. Review sessions made no tracked changes.

## Verification

Parent and final reviewer independently ran:

```text
npm test
117 tests, 117 passed, 0 failed, 0 skipped
npm run typecheck
exit 0
```

Retained parent output: [suite](issue-9-tests.txt), [typecheck](issue-9-typecheck.txt). One intermediate test incorrectly returned a transaction document proxy; it was corrected to use the public snapshot API. No tests were retired or weakened.

## Boundaries

Symlinks are supported, with checks applied to the opened target. Same-user modification of an open file remains outside the protection. Ownership and race tests partly use mocks. The delayed-stream test uses a 100 ms wait, not a deterministic consumption acknowledgement. Successful provider content remains trusted model output, not subject to a malicious-provider secret filter.

The shared protected-file helper also reads local authentication files. Provider failures now use generic diagnostics, and callers no longer receive partial streaming messages. No schema or dependency changes were needed.

Only temporary synthetic credentials, local stores and loopback inference were used. No real credentials, external inference, production systems, 1Password, services or host settings were accessed. The owner authorized committing, pushing, opening and merging the issue PR into `main`, followed by a separate `CURRENT.md` update on `main`.
