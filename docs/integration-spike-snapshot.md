# Integration spike evidence snapshot

Updated 27 October 2026. **Slack, Google, and Proton spikes are complete and closed, with all in-scope tests passed.** The owner reports recovering the remaining evidence and explicitly confirms that previously unrecorded tests passed. No further spike evidence collection or owner observations are required.

The [completion ledger](evidence/integration-spike-ledger.md) records the closure statement, per-connector disposition, and evidence provenance. Earlier assessments that missing local records meant an outstanding evidence-collection task are superseded. Raw records and historical source copies remain unchanged.

## Evidence provenance

- Retained runner output, handoffs, and session excerpts establish the observations they actually contain.
- Additional passes are **owner-confirmed from recovered evidence**, not new agent-run tests. Recovered artifact locations, exact versions, durations, and detailed results were not supplied with the closure statement and are not invented.
- The 27 October offline regression passed all 68 tests, 18 Google and 50 Proton. Offline tests remain distinct from live results.
- The [source index](evidence/README.md) links retained records. No credentials, tokens, private keys, or mailbox bodies are included.

## Slack

[Ticket](../.scratch/personal-assistant/issues/13-test-free-slack-agent-interactions.md): closed, passed.

Retained [initial](evidence/slack-initial-handoff.md) and [closing](evidence/slack-closing-handoff.md) handoffs establish both bot identities replying and DMing, the shared six-reply cap, A Approve, B Reject/thread delivery/native Stop, distinct Socket Mode tokens after correction, and runner shutdown. [Selected raw events](evidence/session-and-slack-excerpts.txt) corroborate B's successful retests.

Genuine Free/no-trial status, clean simultaneous-agent routing after token correction, and the remaining in-scope evidence requirements are passed/complete by owner confirmation. The initial simultaneous-job observation still carries its historical duplicate-token caveat; the owner's recovered evidence supplies the later pass.

Slack remains the selected connector. No paid upgrade, custom-control fallback, or alternative connector is required by the spike findings. Product policies that tests cannot choose remain specification work.

## Google

[Ticket](../.scratch/personal-assistant/issues/17-spike-google-integration-and-reconciliation.md): closed, passed.

[Retained live checks](evidence/live-checks-2026-10-27.md) establish same-personal-account service refresh/identity verification, three Gmail fixture reads, a recipient-free unsent synthetic draft, an exactly approved test-calendar event, and fresh-process reconciliation. The owner confirmed the Gmail draft visible/editable/unsent and the Calendar event visible.

The remaining recovery/uncertain-write, duplicate identification/cleanup, polling/quota, unattended-authorization, and other in-scope tests are passed by owner confirmation from recovered evidence. The earlier zero-row action-journal query was a pre-write historical observation, not the current journal state or evidence against these passes.

Work accounts and sending remain excluded. No additional Calendar mutation, cleanup, or scope expansion is authorized by closure.

## Proton

[Ticket](../.scratch/personal-assistant/issues/18-spike-proton-bridge-and-reconciliation.md): closed, passed.

Retained evidence establishes TLS/login, fixture reads, editable unsent drafts, process-crash reconciliation, complete-transfer response-loss recovery, delivery detection, Bridge restart recovery, and replay refusal. The [post-desktop-login reboot check](evidence/proton-post-reboot-2026-10-27.md) passed fixture access and all three saved-draft reconciliations without a manual Bridge restart.

The remaining in-scope startup/keyring, longer-monitoring, UIDVALIDITY-reset, in-transfer interruption, and other unrecorded checks are passed by owner confirmation from recovered evidence. Required installation/configuration and contract evidence is complete by owner confirmation; no exact values are fabricated here.

Lock/unlock and suspend/resume remain explicitly excluded, not passed. Preserve the intentionally uncertain no-write action without replay; its blocked state is the expected safe result.

## What remains outside the spikes

The [remaining-work document](remaining-work.md) now tracks specification and implementation work only. There are no outstanding integration-spike tests or human evidence gates.

Production credential isolation, draft-only/SMTP enforcement, durable outbound delivery, Pi Durable runtime recovery, scheduling, backup/restore, and M0–M4 acceptance must still be verified on the implemented system. No framework implementation or production deployment is claimed. Cleanup is separate housekeeping; this documentation update did not delete fixtures, revoke grants, or remove apps.
