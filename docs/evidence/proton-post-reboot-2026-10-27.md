# Proton post-desktop-login reboot check, 27 October 2026

Final status: the owner subsequently reported recovering the remaining evidence and confirmed all previously unrecorded in-scope tests passed. All integration spikes are complete and closed. [Completion ledger](integration-spike-ledger.md). The observations and limitations below describe these particular recorded runs, not outstanding spike tasks. No further owner confirmation or retest is needed.

The owner chose and performed a normal reboot, then reported: "ok, I've rebooted without restarting the bridge". The agreed stage was after desktop login, without manually opening Bridge. Host inspection at 12:11:30 -07:00 reported boot time 2026-10-27 12:07:28. Probes ran shortly afterward.

## Observed results

- [Resumed read-only watch](proton-post-reboot-2026-10-27-watch.txt): one cycle succeeded using the existing verified TLS/authentication path. Three fixtures, zero newly observed UIDs, and no UIDVALIDITY reset against saved state.
- Fresh read-only reconciliation verified each saved action: [original draft](proton-post-reboot-2026-10-27-original-draft.txt), [process-crash draft](proton-post-reboot-2026-10-27-crash-draft.txt), and [wire-loss draft](proton-post-reboot-2026-10-27-wire-draft.txt).
- All four commands exited 0. No apply/replay, sending, deletion, Bridge launch/restart, service changes, keyring changes, lock, or suspend occurred during these checks.

## Finding and limits

Post-desktop-login availability after this reboot passed. Combined with the owner's report, Bridge was accessible without a manual Bridge restart. All three existing test drafts remained discoverable and reconciled.

The owner has not yet explicitly stated whether any separate keyring/unlock prompt appeared during login. Do not infer absence of such prompts from successful API access. This check does not establish before-desktop-login availability, system-level autostart configuration, uninterrupted service through reboot, or long-term unattended operation. It also does not test the Pi Durable runtime.
