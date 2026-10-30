# Enforce admission, permissions, and limits after restart

ID: TD-004
Type: implementation
Status: draft
Assignee: none
Parent: [TD-001](001-crash-safe-todo-slice.md)
Depends on: TD-003

## Outcome

Restart, repeated requests, concurrency, or provider failure cannot grant extra work, spend unreserved funds, or restore revoked tool permissions.

## Implementation

1. Enforce one active request and 20 queued requests across all conversations of the agent. Atomically apply capacity and admission order. Look up an existing receipt before rejecting for queue capacity.
2. Persist finite active-time, model-call, tool-call, retry, and reservation counters. A crash cannot reset them. Record a conservative charge for an uncertain active interval rather than granting a fresh allowance.
3. Persist temporary-failure attempt counts and retry deadlines. Use two retries after the initial attempt, approximately 5 and 20 seconds apart. Honor provider delays within the remaining budget. Authentication/configuration failures stop without retries.
4. Apply 30-second connection and 90-second meaningful-progress limits. Keepalives do not reset progress. A progressing response may exceed two minutes while the active-work budget permits it.
5. Enforce the shared US$10 monthly ceiling and US$5 warning using atomic reservations, not post-response reporting. Use Vancouver calendar-month boundaries. Keep charges in the originating period and retain unresolved prior-period records. A new month does not replay paused requests.
6. Count every dispatched inference attempt, including recovery, through the provider adapter. Disable unaccounted auxiliary inference. Test two independent ledger clients contending for the same remaining funds without adding a second product agent.
7. On a finite limit or exhausted retry policy, save progress, show the reason and any completed tools, and stop new work. Owner-waiting requests release the active slot without discarding their counters. Automatic continuation and budget-increase commands are outside this slice.
8. Recheck accepted and current permissions before each tool invocation. Configuration changes apply at run boundaries; a revocation still blocks the next tool. Admission snapshots never contain credential values.
9. Add named, validated payload and sender/agent rate limits. Record the chosen conservative defaults and units in the example configuration and help output. Keep queue order independent of traffic-rate rejection.

Do not add the full scheduler, external-job waits, Slack controls, or a new multi-agent cancellation policy here.

## Proposed files

- Add `tests/limits.test.ts`.
- Extend existing configuration, gateway, runtime, inference, and store modules.
- Update the example configuration and `docs/runtime-contract.md`.

## Acceptance

- [ ] Two conversations share one active slot. Twenty further requests queue in durable order. The next distinct request is rejected and never executes.
- [ ] Concurrent admissions cannot overfill capacity. Repeated accepted requests return their receipt even when full.
- [ ] A paused request releases the slot but keeps its request/action identities and used counters.
- [ ] Kill during retry backoff and resume after its deadline. At most two retries occur after the initial attempt; counters never reset.
- [ ] Unknown pricing and insufficient or concurrently reserved funds block dispatch. Reservation retries are idempotent.
- [ ] Test the Vancouver month boundary, old uncertain charges, threshold warning persistence, and the absence of automatic paused-work replay.
- [ ] The US$5 warning is visible once through durable status/results. Slack warning delivery remains future work.
- [ ] Connection timeout, progress timeout, keepalive-only streams, and a progressing response over two minutes follow the configured rules.
- [ ] Exhausting any request limit saves a visible partial outcome and dispatches no further calls. Retry attempts and recovered execution use remaining limits.
- [ ] Revoking `add_todo` after acceptance but before dispatch prevents the write.
- [ ] Oversized payloads and rate-limited senders are rejected before admission. Secrets and full bodies remain absent from logs.
- [ ] All effective limits are visible without a code edit. Unsupported escalation reports an owner wait rather than resetting a request.

## Evidence

Pending. No limit or concurrency tests executed.
