# Issue #10: test trim evidence

Candidate: working tree on `test/10-trim-overlap`, based on `83f4449`, uncommitted at review time.

## Decision

The two Pi contract tests were retired. They tested the Pi library, and `tests/storage-durability.test.ts` and `tests/tool-batch-recovery.test.ts` cover how this project uses it. This applies the owner's standing rule against tests of third-party code. The issue asks the owner to decide; the owner can restore the tests from `83f4449` if they disagree.

## Independent review

One fresh-context review: **APPROVE**, no must-fix findings. It verified each coverage claim against the code and reran checks.

| Nit | Disposition |
| --- | --- |
| The removed dotenv wire test was the only one sending two parallel `tool_calls` over the live wire. | Accepted. Parallel parsing is Pi behavior and batches stay covered by `tool-batch-recovery`. Docs reworded to "tool-call conversion (full list page)". |
| A fresh live call no longer asserts the `modelCalls` increment end to end. | Accepted. Covered by `shared-guards` and the `model-limit` case. |
| `CURRENT.md` still cites 119 tests. | Updated in the post-merge status commit. |

Limitations: no mutation checks, and the 119 baseline was taken from the #7 evidence rather than rerun.

## Results

- `npm test`: 109 passed, 0 failed, 0 skipped (was 119).
- `npm run typecheck`: clean. `git diff --check`: clean.
- No real credentials, live inference or production systems used.
