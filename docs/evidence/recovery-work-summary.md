# Recovery work evidence summary

This records the separate, uncommitted candidate for [issue 25](https://github.com/markdlabrecque/acolyte/issues/25), part of [milestone 24](https://github.com/markdlabrecque/acolyte/issues/24). Its branch is `feat/25-recover-admitted-request`, based on `8672f4a90f5f8078882e92f17aba75d41b3db6ee`. The owner requested evidence only here, not integration or publication of the recovery source.

## Reported evidence

The source report describes production-runner subprocess tests with synthetic credentials, fixture inference, temporary stores and explicit SIGKILL barriers:

- After admission, before the HTTP response, identical resubmission returns the original receipt, a changed payload conflicts, and completion produces one todo.
- After the Pi submission commits but before application mapping, restart reuses the completed outcome. Repeated retrieval adds no new ledger reservations.
- After the todo/saved-result commit, restart retains the original todo/action result and produces one todo.
- A stale socket is recovered only with matching store/agent ownership, inode proof and a refused liveness probe. Live, unknown, foreign, replaced and wrong-store endpoints are refused and retained.

The report records 125 tests passing, typecheck and diff checks passing, plus negative mutation checks. Its first independent review rejected unbounded fixture waits/cleanup; the corrected hash-bound candidate received approval after 125 tests and four failing-fast mutants. This is the recovery report's result, not approval of the separate workflow or this combined delivery.

## Provenance and limitations

Source notes: `code/main/docs/evidence/v1-recovery-slice.md`. Before capture, all eight reviewed source/test SHA-256 values in that report matched the current files. The nine-file tracked patch, including its runtime-contract note, has SHA-256 `1a9ae2dfd5cbe10c0524ceeec5723a3cf7c045845d70c1b9a60c4e28910d6e3b` for `git diff --binary HEAD` restricted to those named recovery files.

The source report retains deferred socket-marker hardening: inode reuse after partial cleanup, no marker/directory fsync and possible orphan marker/private directories. Pi 1.4.0 already deduplicates submission keys, so the lookup repair is not independently distinguished by the existing tests. Inference retries and the full crash matrix remain later work. The report did not run Docker, systemd, reboot or power-loss acceptance.

Only this summary is committed here. No recovery implementation, recovery tests or original evidence file is included in this delivery, and no recovery checks were rerun for this summary. The original dirty checkout remains intact. Issue 25 stays open; this does not establish TD-002 live DeepInfra or milestone acceptance.
