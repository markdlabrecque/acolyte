# Cairn

A small, self-hosted personal agent framework based on Pi Durable. Cairn is designed to retain acknowledged work across interruptions, enforce permissions and spending limits, and avoid blindly repeating actions.

The initial assistant's scope includes durable todos and reminders, calendar management with owner approval, and email reading and unsent drafts. Slack is the selected owner-facing interface; CLI and HTTP support administration and testing.

Repository: [markdlabrecque/acolyte](https://github.com/markdlabrecque/acolyte). TD-002 is implemented, live smoke pending. Full crash recovery and service acceptance remain unfinished.

## Project documents

- [Current status and open follow-ups](CURRENT.md)
- [Local implementation tracker](docs/tickets/README.md)
- [Product requirements](pi-durable-personal-agent-prd.md)
- [Domain glossary](GLOSSARY.md)
- [Implementation decision map](.scratch/personal-assistant/map.md)
- [Remaining specification and implementation work](docs/remaining-work.md)
- [Completed integration spike evidence](docs/evidence/integration-spike-ledger.md)

Cairn is the owner-selected project and product name. Pi Durable names the runtime dependency. The GitHub repository is named `acolyte`; the PRD filename and recorded product-name decision remain unchanged. The name does not imply completed implementation or acceptance.
