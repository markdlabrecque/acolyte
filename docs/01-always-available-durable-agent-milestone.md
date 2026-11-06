# Workplan: Always-available durable agent milestone

> System of record: **Filesystem**

## Objective

Plan one local, always-available Cairn agent service. The idle process waits without model calls. Include crash restart, Pi Durable recovery, background compaction, durable admission, bounded execution, cancellation, status and local snapshot/restore. Reuse existing CLI/gateway/runner, todo tools and evidence. Exclude connectors, monitoring other agents, schedules, multi-agent behavior, shell tools, automatic repair/upgrades and off-host backups. This is planning only, not authorization for implementation, publication, host service installation, real credentials, live inference or reboot. The companion interactive HTML plan contains proposed choices. Preserve background-agent work and historical evidence; TD-002 remains blocked on separately authorized live acceptance.

## Action Plan

1. [ ] Record the candidate revision and inventory current application tests and retained evidence. Separate measured behavior from documented dependency contracts and pending acceptance; do not overwrite historical records or claim a new test run.
2. [ ] Resolve the interactive plan choices for service startup and external-wait scope before implementation. Create a focused branch or isolated worktree from updated main after coordinating with the background agent; do not include its Sandcastle changes by accident.
3. [ ] Build a thin recovery path through the existing local CLI, gateway, runner, Pi Durable and production todo tool. Add explicit test barriers after durable admission and local effect commit, kill the runner, reopen the same store and retrieve the original result without a duplicate effect.
4. [ ] Resolve stale Unix endpoint recovery under exclusive ownership. Prove that automatic restart cannot remove a live or foreign endpoint, admit a second store owner, replace corrupt state or report readiness too early.
5. [ ] Prove native Pi Durable compaction through the application provider guard using synthetic loopback inference. Bind compaction to a durable maintenance identity, reserve cost before every dispatch and persist counters without borrowing the current request. Stop for a dependency decision if supported APIs require substantial replacement machinery.
6. [ ] Enable bounded native background compaction with validated thresholds. Test newer input during compaction, placement at a safe turn boundary, stale summaries, summary failure, context overflow, interruption and reopen. Preserve original transcripts and re-run the existing tool-batch recovery tests with compaction enabled.
7. [ ] Complete the full TD-003 admission/submission/action/outcome crash matrix and TD-004 persisted execution/retry/spending checks. Replace wall-clock-since-start accounting with persisted active intervals so idle time and downtime cannot silently reset or consume the wrong allowance; conservatively retain uncertain dispatch costs.
8. [ ] Add durable cancellation, graceful shutdown and service-level status. Define cancellation races, retain committed effects, prevent cancelled work from resuming, expose compaction/recovery/queue/budget failures and keep credentials and partial model content out of logs and status.
9. [ ] Add unprivileged systemd units with explicit state paths, readiness, restart backoff and start-rate limits. Run service restart, intentional stop, idle-no-inference and normal reboot checks only in an authorized isolated systemd environment; the existing Docker suite is not reboot or service acceptance.
10. [ ] Document and test consistent local snapshot/restore of the agent store, shared spending ledger, configuration and required files with the prior writer stopped. Refuse incompatible or corrupt restores; do not use a plain copy of a live SQLite database.
11. [ ] Run npm test, npm run typecheck and git diff --check, plus the existing Docker harness where available. Obtain fresh independent review, resolve rejections and record revision-specific results and limitations under docs/evidence. Keep the real DeepInfra smoke and live compaction quality check pending until separate owner authorization.

## Completion Checks

- [ ] Each action-plan item is complete or explicitly deferred.
- [ ] Targeted validation or tests have been run and recorded.
- [ ] Any remaining follow-up is linked to the system of record.
