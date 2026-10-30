# Email draft permissions

## Subsequent spike completion, 27 October 2026

The documentation-only findings below predate the live spikes. Slack, Google, and Proton spikes are now complete and closed. Retained runner evidence and owner observations are supplemented by the owner's confirmation that recovered evidence establishes all previously unrecorded in-scope tests passed. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md). Older statements below about tests not run or open research describe the original research date, not current spike status. Production adapter/security/runtime acceptance remains implementation work; this update does not invent primary-source guarantees.

Checked 2026-10-23 against official documentation and Proton Bridge source. No account, credentials, installed Bridge, or mail data was accessed. No runtime test was performed.

## Confirmed decision

The owner approved separate permissions for email reading/search and draft creation, with sending prohibited. This applies to personal Gmail and Proton Mail. The owner reviews and sends manually. Draft editing/deletion and other mailbox mutations are not implicitly permitted.

## Gmail evidence

Google's `gmail.compose` OAuth scope permits draft management and sending. The draft-creation API accepts this scope or broader alternatives. Consequently a draft-capable provider token is not a draft-only security boundary. Keep it in a trusted adapter that exposes only permitted operations and denies both message-send and draft-send paths. The agent must not obtain the token or bypass the adapter through generic execution or network tools.

- [Official Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Official draft creation API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.drafts/create)
- [Official draft sending API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.drafts/send)

## Proton Bridge evidence

Proton documents local IMAP and SMTP servers. In the inspected upstream IMAP connector, importing into the Drafts folder takes a dedicated draft-creation path, calls Proton's CreateDraft API, and uploads attachments to that draft. This supports saving a real Proton draft without using SMTP. The inspected branch is moving upstream source, not a verified match to the owner's installed release.

- [Official protocol documentation](https://proton.me/support/imap-smtp-and-pop3-setup)
- [Official local server explanation](https://proton.me/support/why-you-need-bridge)
- [Proton Bridge IMAP connector source](https://github.com/ProtonMail/proton-bridge/blob/master/internal/services/imapservice/connector.go)
- [Official stable release notes](https://protonmail.com/download/bridge/stable_releases.html)

Design inference: use a trusted IMAP adapter for reading and draft creation; deny SMTP access to that adapter and the agent. Do not equate this protocol restriction with provider-issued draft-only credentials. Restrict IMAP mutations too, since mailbox access can otherwise permit edits, moves, and deletion. Preserve the owner's separate mail-client sending capability.

## Remaining verification

Use an isolated test account and selected Bridge version to check saved draft visibility and editability in the owner's Proton client, recipient/body/attachment fidelity, restart synchronization, and duplicate-draft reconciliation after an uncertain append. Verify disallowed sends and mailbox mutations cannot bypass the adapter. No such tests have run. The broader Google and Proton research tickets remain open.
