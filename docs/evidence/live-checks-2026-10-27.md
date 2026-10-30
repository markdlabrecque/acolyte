# Authorized live checks, 27 October 2026

Final status: the owner subsequently reported recovering the remaining evidence and confirmed all previously unrecorded in-scope tests passed. All integration spikes are complete and closed. [Completion ledger](integration-spike-ledger.md). The observations and limitations below describe these particular recorded runs, not outstanding spike tasks. No further owner confirmation or retest is needed.

The owner authorized automated checks in the current conversation. Existing local runners were used with their configured personal account, synthetic fixture marker, dedicated test calendar, and verified Bridge TLS certificate. One exact owner-approved Calendar event was subsequently created. No sending, deletion, service changes, interruption, or 1Password access occurred. Credentials and message bodies were not displayed.

## Results

- [Google local validation and Gmail read](live-2026-10-27-google-mail-read.txt): exit 0; three matching synthetic messages read. The successful command path refreshes the Gmail token and verifies the configured account before mailbox access.
- [Calendar read](live-2026-10-27-google-calendar-read.txt): exit 0; zero upcoming events in the configured test calendar. The successful path refreshes the Calendar token and verifies account identity. An empty result is an access pass, not write evidence.
- [Gmail draft creation](live-2026-10-27-google-draft.txt): action `41674f3c12494615843591d1073b3c08`, verified after one apply. Recipient-free synthetic draft subject `AGENT-SPIKE-DRAFT-8fcd064f65f34a40924e60da3d7cb97b`. A separate read-only [fresh-process reconciliation](live-2026-10-27-google-draft-reconcile.txt) verified it again. The runner's draft lookup counts exact subject matches and verified means one observed matching draft. The owner subsequently confirmed the draft is visible, editable, and unsent in this conversation. No crash or dropped response was injected.
- [Proton resumed read-only watch](live-2026-10-27-proton-read-watch.txt): all three cycles succeeded with three fixtures, no newly observed UIDs, and no UIDVALIDITY reset. This brief check is not reboot or longevity evidence.
- Fresh read-only Proton reconciliation verified the [original draft](live-2026-10-27-proton-original-draft.txt), [process-crash draft](live-2026-10-27-proton-crash-draft.txt), and [wire-loss draft](live-2026-10-27-proton-wire-draft.txt). No apply/replay/cleanup occurred. The deliberately uncertain no-write action was not replayed or changed.

## Calendar creation completed after exact owner approval

Calendar action `03e76a9caa63433db90124a62c735912` was planned offline, then approved by the owner in chat and applied once to the configured Agent Spike calendar:

- Title: `AGENT SPIKE synthetic test`.
- Start: 28 October 2026, 12:00 America/Vancouver, UTC offset -07:00.
- End: 12:10 the same day.
- Description: `Disposable integration test. No attendees or notifications.`
- No attendees; default reminders disabled; write used `sendUpdates=none`.

The owner explicitly approved this test in chat. Before dispatch, the saved body was checked against the exact approved title, description, start/end, configured dedicated calendar, and reminders. Approval was relayed through the existing runner's interactive full-digest gate. [Apply evidence](live-2026-10-27-google-calendar-apply.txt) records exit 0 and verified status. A separate [fresh-process read-only reconciliation](live-2026-10-27-google-calendar-reconcile.txt) verified the same saved event ID and expected fields again. No retry, update, or cleanup was performed. Do not reapply this action. The journal retains the calendar and event IDs privately.

## Remaining human involvement now

Gmail UI confirmation and exact Calendar approval are complete. The owner subsequently replied, “Confirmed I can see the event,” in response to the request to check `AGENT SPIKE synthetic test` in Agent Spike on 28 October 2026, 12:00–12:10 Vancouver time. Record this as owner-reported Calendar UI visibility, paired with the API field verification and fresh-process reconciliation above. No further human check remains for this normal-operation batch; this is not evidence for the deferred recovery or longevity cases.

No repeat Proton editability check is needed; the owner has confirmed it already. Other historical limitations remain in the project checklist. These current successful checks do not establish Google crash/lost-response recovery, unattended OAuth longevity, production isolation, or Slack runtime behavior.
