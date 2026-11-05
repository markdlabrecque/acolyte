# Issue #3: readable CLI output

Candidate based on `7f466a5`, including the merged issue #2 error handling.
Reviewed file SHA-256 hashes:

```text
6f41367545eaf57fa5eace58b33488f1bbebb0f84c48fb0121b7aaa02c56f693  src/cli.ts
b9b8483cd68be106a596399611a46c9692de4b8f4af08caa662a2be3579805d3  tests/cli-output.test.ts
```

Default submit output now gives the request ID and receipt and explicitly separates acceptance from completion. Status/result label queued and running requests as pending. Completed results print the answer; failures print the reason. `--json`, error wording and exit codes are unchanged. No inference files changed.

Three focused CLI subprocess tests use a loopback HTTP server and temporary synthetic authentication. They cover new/duplicate submissions and queued, running, completed and failed status/result responses, checking exact default and JSON output and exit codes.

Parent and fresh independent reviewer both ran:

- `npm test`: 112 passed, none failed or skipped.
- `npm run typecheck`: passed.
- `git diff --check`: passed.

Review round 1: APPROVE, no must-fix findings or deferrals. Reviewer inspected the working candidate against `7f466a5`, verified the acceptance criteria and preservation of issue #2 behavior, and made no edits.

Only synthetic/local verification was performed. No real credentials, live inference or production access. This does not establish TD-002 live acceptance.
