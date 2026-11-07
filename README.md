# Cairn

A small, self-hosted personal agent framework based on Pi Durable. Cairn is designed to retain acknowledged work across interruptions, enforce permissions and spending limits, and avoid blindly repeating actions.

The initial assistant's scope includes durable todos and reminders, calendar management with owner approval, and email reading and unsent drafts. Slack is the selected owner-facing interface; CLI and HTTP support administration and testing.

Repository: [markdlabrecque/acolyte](https://github.com/markdlabrecque/acolyte). TD-002 is implemented, live smoke pending. Full crash recovery and service acceptance remain unfinished.

## Developer workflow

[Sandcastle](docs/sandcastle-workflow.md) is developer tooling, separate from Cairn. The implementation candidate uses the `sandcastle:acolyte` image with Node 24.20.0 and Pi coding-agent 1.5.0. The application still pins Pi 1.4.0 and uses the selected DeepInfra model.

Start the GitHub helper manually. It routes tickets to GPT models by their single `**Model:**` declaration, permits up to three isolated runs when dependencies and paths do not conflict, and allows two repairs after the initial implementation. GitHub authentication stays on the host. Independent review and the GitHub Actions `tests` and `typecheck` checks must pass on the exact PR head before merge. Missing or unsuccessful remote CI blocks merge; no bypass is allowed. See [current status](CURRENT.md) for candidate and acceptance limits.

## Docker tests

Run `./scripts/test-docker.sh` with Docker Engine running. No host Node install
is needed. It builds the current checkout, then runs `npm test` and
`npm run typecheck`, failing if either fails. The image pins Node 24.20.0
from `.nvmrc`, npm 11.19.0 and the Debian base digest; `npm ci` installs the
lockfile, including dev dependencies. Update the image pin when updating Node.

The build needs registry access on a cold cache. The test container runs as
an unprivileged user with `--network none`, no host mounts and no forwarded
credentials. Its loopback interface, temporary filesystem, Unix sockets and
child-process signals remain available for SQLite and recovery tests. No live
inference is needed. Each invocation uses its own built image ID so concurrent
Mill worktrees cannot overwrite one another's test image tag.

For an existing Sawmill setup, the following is historical configuration, not the current GitHub helper workflow. Set the uncommitted `.mill/config.yaml` entry:

```yaml
tests:
  command: ./scripts/test-docker.sh
  timeout: 30m
```

Mill 1.1.1 runs this command in the ticket worktree. Its `test_harness: docker`
setting separately selects browser-site testing; it does not build or run this
image. Mill requires `test_url` with that setting, even though this test runner
serves no browser site. A Docker config without `test_url` still fails Mill
validation. Browser cases need a separately prepared site and URL; for a
suite-only project, explicitly choose `test_harness: none` instead. This change
does not make that owner decision or supply a placeholder URL.

## Todo list size limits

`limits.listPage` and `limits.inputTokens` are validated together at startup.
The input guard conservatively counts serialized UTF-8 bytes as tokens. A full
page needs `3756 * listPage + JSON-encoded prompt bytes + 8192` input tokens,
including worst-case escaping of 500-character titles and space for tool schemas
and a short listing exchange. Pi's tool-output limit also accommodates that page
without truncating its JSON. Long conversation histories or multiple pages can
still hit the overall input limit.

The example uses 20 items and 98,304 input tokens. Existing configurations with
20 items and 8,192 input tokens must raise the input limit or lower the page size
and meet the minimum reported by config validation. Raising the input limit also
raises the conservative per-call spending reservation; the monthly cap remains
unchanged.

## Project documents

- [Current status and open follow-ups](CURRENT.md)
- [Local implementation tracker](docs/tickets/README.md)
- [Product requirements](pi-durable-personal-agent-prd.md)
- [Domain glossary](GLOSSARY.md)
- [Implementation decision map](.scratch/personal-assistant/map.md)
- [Remaining specification and implementation work](docs/remaining-work.md)
- [Completed integration spike evidence](docs/evidence/integration-spike-ledger.md)

Cairn is the owner-selected project and product name. Pi Durable names the runtime dependency. The GitHub repository is named `acolyte`; the PRD filename and recorded product-name decision remain unchanged. The name does not imply completed implementation or acceptance.
