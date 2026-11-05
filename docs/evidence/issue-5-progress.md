# Issue #5: request status progress

The owner chose status output over logs. Status now returns `progress.deltaCount` and `progress.lastActivityAt`, a Unix timestamp in milliseconds. Before the first delta, including old receipts without progress, status returns zero and null. Counts accumulate across model calls for the request; they are activity indicators, not token counts or completion percentages. Repeat `status` to see changes. Result output and CLI formatting are unchanged.

Only nonempty text, thinking and tool-call deltas count. The adapter persists metadata, never partial model text, and keeps the existing progress timeout refresh. Each delta adds one durable commit. This overhead has not been benchmarked.

## Integration with readable CLI

After main gained readable CLI output, merge candidate `05bbda0995fc6c5f107ff5e04a7c41002806970f` preserved both runtime evidence sections and added a status-only progress line. Plain status shows the count and ISO last-activity timestamp, or `0`/`none` before activity. JSON output and unrelated CLI behavior remain unchanged. This supersedes the original no-formatting-change statement above.

Fresh independent review against `abb9320`: **APPROVE**, no must-fix findings. Parent and reviewer each passed all 114 tests, typecheck and whitespace checks. The prior transport-abort correction remains intact. Existing readable CLI cases now verify progress for queued, running, completed and failed status. Running real-stream updates remain covered at the adapter/state layer, not through a polling CLI process. Per-delta storage overhead remains unbenchmarked; TD-002 live acceptance remains blocked.

## Independent review

- First candidate `86ab008`: **REJECT**. The reviewer reproduced a loopback connection remaining open after a progress callback threw because cleanup cleared deadlines without aborting transport.
- Correction `905892e`: abort the controller in cleanup and add a throwing-callback connection-close regression. The test initially failed typecheck due to an unnormalized transcript; `7453049` fixes the test using the supported normalizer.
- Fresh review of `7453049` against `7f466a5`: **APPROVE**, no must-fix findings. The reviewer confirmed metadata-only progress and the transport cleanup regression. No findings were deferred.

## Verification

Parent and final reviewer each ran:

- `npm ci`: installed dependencies successfully.
- `npm test`: 111 passed, zero failed or skipped.
- `npm run typecheck`: passed.
- `git diff --check`: passed; reviewer checked the base-to-candidate diff.

The running-request test sends two separate SSE deltas, observes successive persisted counts before completion, and checks partial text is absent from application state. CLI integration checks completed status contains only the two progress fields. The failure regression checks the loopback connection closes before the configured deadline and the original storage error is preserved.

Running progress is tested at the adapter/state layer, not through a polling CLI process. All inference used local fixtures or loopback with synthetic credentials. No live DeepInfra acceptance, real credential access, production operations or 1Password access occurred. TD-002 remains blocked on separately authorized live acceptance.
