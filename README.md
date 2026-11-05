# Cairn

A small, self-hosted personal agent framework based on Pi Durable. Cairn is designed to retain acknowledged work across interruptions, enforce permissions and spending limits, and avoid blindly repeating actions.

The initial assistant's scope includes durable todos and reminders, calendar management with owner approval, and email reading and unsent drafts. Slack is the selected owner-facing interface; CLI and HTTP support administration and testing.

Repository: [markdlabrecque/acolyte](https://github.com/markdlabrecque/acolyte). TD-002 is implemented, live smoke pending. Full crash recovery and service acceptance remain unfinished.

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
