# Integration evidence index

Collected into this project on 27 October 2026. These files preserve evidence that previously lived outside the project or under `/tmp`. Historical handoffs/runner notes are unmodified copies and may contain stale next-action instructions, external paths, or open-status wording. They are evidence, not current authorization or the current tracker. Use [remaining work](../remaining-work.md) for current actions and [the snapshot](../integration-spike-snapshot.md) for interpretation.

## Final completion ledger

[Integration spike completion ledger](integration-spike-ledger.md): on 27 October the owner reported recovering the remaining evidence and explicitly confirmed all previously unrecorded in-scope tests passed. Slack, Google, and Proton are complete and closed. No evidence-recapture or human observation tasks remain. Retained copies below are historical sources; their old open/untested wording is superseded by this owner-confirmed completion, not silently rewritten.

## Evidence rules

- Owner-reported observation, raw runner result, offline test, closure disposition, and documented API contract are different evidence types.
- Closure alone does not establish test outcomes. Here the owner explicitly confirms the previously unrecorded tests passed, which is recorded as owner-confirmed recovered evidence. Missing local raw records are not outstanding tests or permission to rerun them.
- Historical passes do not establish current token validity, continuous operation since testing, production isolation, or Pi Durable runtime recovery.
- Do not archive credentials, private keys, token values, mailbox bodies, or raw Slack account/channel/user identifiers here. No such credential files were read during this reconciliation.

## Post-desktop-login reboot evidence

[27 October Proton reboot report](proton-post-reboot-2026-10-27.md): owner reports reboot without restarting Bridge; a subsequent fixture probe and all three saved-draft reconciliations passed. The owner's subsequent recovered-evidence confirmation supplies passing status for the remaining in-scope startup/keyring and longevity checks; this raw probe itself establishes only post-login availability.

## New authorized live results

[27 October live-check report](live-checks-2026-10-27.md) links the fresh Google read/draft/reconciliation and Proton read/reconciliation output. These subsequent checks supersede historical missing-evidence statements for normal Gmail fixture reads and draft creation. The owner has confirmed the Gmail draft UI check and approved the exact Calendar event. Calendar creation and fresh-process reconciliation passed; the owner subsequently confirmed seeing the event in the Calendar UI, completing this batch's human checks. The historical zero-row Google journal count below predates the new draft action.

## Sources retained

| Project file | Original source | What it establishes |
| --- | --- | --- |
| [Slack initial handoff](slack-initial-handoff.md) | `/tmp/slack-b-config-handoff.md` | Historical both-bot replies/DMs, six-reply cap, A Approve, and simultaneous-job observation with pre-token-fix caveat |
| [Slack closing handoff](slack-closing-handoff.md) | `/tmp/slack-spike-closing-handoff.md` | Duplicate Socket Mode token cause, owner correction, B Reject/thread/Stop retests, shutdown |
| [Session and Slack excerpts](session-and-slack-excerpts.txt) | Named Pi session files and `/tmp/slack-b-reject.428wNg/events.log`, original paths/line numbers in extract | Owner Google read/consent/validation reports, explicit Slack/Google closure, selected nonsecret B retest events. Assistant claims are historical, not independent tests |
| [Google runner notes](google-runner-results-2026-10-26.md) | `~/Projects/pi-agent-spikes/GOOGLE-SPIKE.md` | Runner scope/limits and owner-reported results; no detailed live write pass |
| [Proton runner notes](proton-runner-results-2026-10-26.md) | `~/Projects/pi-agent-spikes/PROTON-SPIKE.md` | Live read/draft/recovery descriptions, owner original-draft editability, limitations |
| [Proton follow-up notes](proton-followup-results-2026-10-26.md) | `~/Projects/pi-agent-spikes/PROTON-FOLLOWUP.md` | Wire-loss, new-delivery and restart results, instrumentation limits, unrun operational checks |
| [Proton process recovery](proton-process-recovery-results.jsonl) | `~/.config/pi-durable-agents/spikes/proton/recovery-run-1b24151f161c40218193aca2903340a2/results.jsonl` | Write counts, two reconciliations per case, replay refusal, intentional uncertainty |
| [Proton wire results](proton-wire-results.jsonl) | `~/.config/pi-durable-agents/spikes/proton/wire-test-01/results.jsonl` | Fault injection, reconciliation, replay refusal for the recorded action |
| [Proton watch](proton-watch-results.jsonl) | `~/.config/pi-durable-agents/spikes/proton/delivery-watch-01/watch.jsonl` | All 32 cycles, one new UID, observed outage then recovery, unchanged UIDVALIDITY |
| [Offline regression](offline-regression-2026-10-27.txt) | Rerun of five test modules in `~/Projects/pi-agent-spikes` | 68 tests passed, 18 Google and 50 Proton. Fake/local TLS server evidence only, no live provider access |

The Google action-journal count was queried read-only on 27 October: zero rows in the discovered `actions` table. The database was not copied because it is account-bound and may contain private metadata. Read commands are not journalled. This limited observation cannot contradict owner-confirmed closure or exclude operations elsewhere.

## Reproducing offline verification

```bash
cd ~/Projects/pi-agent-spikes
python3 -m unittest -v test_google_oauth test_google_spike test_proton_spike test_proton_recovery_test test_proton_followup
```

The suite uses synthetic temporary credentials and fake adapters, including a local TLS fake IMAP server. It does not validate current Slack/Google/Bridge access. The spikes are complete; do not rerun live commands merely to fill historical documentation gaps. Any new experiments need a separate scope and authorization.
