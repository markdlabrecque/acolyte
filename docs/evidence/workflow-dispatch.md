# Dispatch workstream evidence

Candidate based on `7692605`; board template adapted from the shipped `sandcastle-helper/board/board.template.html` at `488899a938507e3fa60a7f40551a05da99afe719`, not the design proposals. Preview is a manual loopback server and does not serve evidence files. It renders recorded review counts and latest verdict, not arbitrary filesystem content.

Synthetic tests cover native blocked-by responses, inherited ready labels, containers, comment pagination and fingerprints, missing manifests, dry-run with no state directory, private writes, lock serialization, concurrent reservation and loopback board rendering. Offline dependency installation used `npm_config_userconfig=/dev/null npm_config_globalconfig=/nonexistent npm ci --offline --ignore-scripts --no-audit --no-fund`. `npm test` passed 162 tests and `npm run typecheck` passed after the final board/state edits; rerun on integration. `git diff --check` passed. No GitHub, credentials, model providers, or production systems were contacted.

## Tracker and dispatch continuation

Native parent lookups use typed 404 only for no parent; foreign, inconsistent or cyclic ancestry holds. Completed blocker ancestry is traversed independently and uncertain or cyclic chains hold. Dispatch paginates open PRs and their changed files, including renamed paths, before scheduling; unknown or capped diffs claim the whole tree. Local waiting and terminal records remain occupied unless a recorded PR is confirmed closed remotely. Reservations contain base SHA, fingerprint, predicted paths and an immutable execution token. `RunStore.withIssueLock` provides a separate owner-token lock for the lifecycle caller. Locks are never automatically stolen.

Synthetic tests exercise these cases, concurrent reservations, corrupt state and read-only dry-run. `npm ci`, `npm test` (190 passed), `npm run typecheck` and `git diff --check` passed after the final changes. No live GitHub, credential, provider or production access was performed.

## Integration limitations

This is not an end-to-end delivery approval. All worktrees and CLI invocations for the same repository **must use the same canonical absolute state root**; `RunStore` accepts a caller-supplied root and cannot enforce the CLI's selection. The lifecycle adapter must hold `withIssueLock` across execution and persist/check a one-time execution claim tied to the reservation token before starting. The dispatcher alone cannot prevent an independently invoked `run --issue` from replaying an unclaimed `reserved` record; the current checked-in CLI does not integrate the dispatcher or lifecycle. The shell wrapper now invokes the specified native command, but that CLI is not yet implemented here. These are blocking integration gaps, not completed acceptance.

Native GitHub behavior, exact provider model access, independent review, remote CI and TD-002 live acceptance remain unverified. The synthetic board preview is not a browser test.
