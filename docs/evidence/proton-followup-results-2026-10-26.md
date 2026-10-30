# Remaining Proton spike tests

`proton_followup.py` prepares two opt-in experiments. Development tests use local fake servers, temporary credentials, and a disposable TLS certificate. No new live Bridge connections or drafts were created while preparing this script.

Owner actions and approvals are listed in `~/Projects/pi-durable-agents/docs/proton-spike-owner-checklist.md`.

## Offline verification

```bash
cd ~/Projects/pi-agent-spikes
python3 -m unittest -v test_proton_spike test_proton_recovery_test test_proton_followup
```

The new tests include an actual local TLS fake IMAP server. They verify that the proxy forwards the synthetic APPEND literal, drops the encrypted response before the client receives it, leaves the action uncertain, and blocks replay without another connection. The fake certificate is generated in a temporary directory with OpenSSL. If OpenSSL is absent, that integration test is skipped and the test output says so. No owner certificate or key is used by these tests.

## Recorded live network-drop result

The owner approved the additional unsent draft and the live experiment passed. Action `9c5a7318a97e466e8a4643d5ea1ea2ff` made one APPEND call. Instrumentation recorded that the literal was sent, inbound proxy bytes were dropped, and the client's APPEND failed with IMAP abort. No APPEND returned successfully to the runner. Fresh direct reconciliation verified exactly one matching draft, and another fresh-process reconciliation agreed. Reapply was refused locally without connecting. There was no proxy error, write retry, deletion, or Bridge restart.

Private evidence is in `~/.config/pi-durable-agents/spikes/proton/wire-test-01/`. The owner confirmed that `AGENT-SPIKE-PROTON-DRAFT-9c5a7318a97e466e8a4643d5ea1ea2ff` appeared in Proton. Editability of this particular draft was not explicitly confirmed. The encrypted dropped bytes were not inspected, so their exact contents are not claimed. The later owner-driven Bridge outage test is recorded below. In-transfer truncation and reboot behavior remain separate untested cases.

## Isolated network-response loss

Get approval for one additional synthetic unsent draft before executing this command. The example directory must not already exist; use a new descriptive directory for each separately approved experiment.

```bash
python3 proton_followup.py network-drop \
  --run-dir "$HOME/.config/pi-durable-agents/spikes/proton/wire-test-01" \
  --allow-live --allow-draft
```

What it does:

1. Creates a private evidence directory and an offline draft plan in the existing account-bound journal. Saves and fsyncs the action manifest before any write.
2. Starts a one-client proxy on a temporary IPv4 loopback port. Only this experiment's IMAP socket is redirected through it. Your normal mail client still connects directly to Bridge.
3. Relays protocol and TLS bytes without decrypting or recording traffic. The real configured hostname remains in the IMAP client, so the existing `cert.pem` chain and hostname verification stay enabled for STARTTLS or implicit TLS.
4. Starts exactly one APPEND. After the server's literal continuation has reached the client, arms the proxy immediately before the client sends the message literal. The proxy drops the next server-to-client bytes and closes that test connection. Bridge's listener stays running.
5. Opens fresh direct connections and reconciles the same action. It performs up to three read lookups with five-second delays for an absent draft. If verified, it checks again from another fresh process. It never retries the write.
6. In a separate process, probes reapply with networking forbidden. Only the known already-attempted local refusal counts as success.

The expected outcome is one matching draft, successful read-only reconciliation, and local replay refusal. Zero visible drafts may be a safe outcome of the interruption, but remains uncertain and is not reported as successful persistence/recovery. Duplicate hits require review; no cleanup is attempted. No deliberately duplicated live draft is inserted.

This loses real inbound bytes on the runner's private connection. It does not identify or decrypt the dropped bytes, so it does not independently establish that the lost bytes contained an OK response. That uncertainty is the reason for reconciliation. The fake-server integration test does know it sent OK before the proxy discarded it. Bridge's own process and the computer are not stopped.

### Resuming after an error

Keep the original directory. Do not rerun a new experiment to bypass uncertainty.

```bash
python3 proton_followup.py network-drop \
  --run-dir "$HOME/.config/pi-durable-agents/spikes/proton/wire-test-01" \
  --allow-live --resume
```

Resume performs only reconciliation and a network-forbidden replay probe. It does not plan or attempt a new write. It does not turn a previous failed fault-injection attempt into a claimed pass. The results retain whether fault injection succeeded in the original invocation.

The evidence directory contains `action.json`, `wire.jsonl`, and `results.jsonl`. These hold synthetic identifiers, operation counts, exception class names, and outcomes. No credentials, mail bodies, raw server errors, or TLS traffic are logged. Preserve the evidence when a child times out; the action manifest lets you reconcile later.

## Recorded new-delivery result

The owner confirmed arrival of the requested synthetic fixture after the live watch established its two-message baseline. Cycle 11 detected one new UID and three total fixtures. Cycles 12 and 13 each reported three fixtures and zero newly observed UIDs, with unchanged UIDVALIDITY. This passes delivery detection and repeated-poll deduplication for this fixture. Evidence is in `~/.config/pi-durable-agents/spikes/proton/delivery-watch-01/watch.jsonl`. It does not establish outage recovery or UIDVALIDITY-reset behavior.

## Read-only monitoring

The watch uses only the prepared marker `AGENT-SPIKE-PROTON-20261025` in INBOX. It selects read-only, checks fixture subject headers before fetching bounded bodies with BODY.PEEK, and makes no draft writes. It establishes the first successful read as a baseline. Later reads report only previously unseen UIDs for that UIDVALIDITY. A UIDVALIDITY change establishes another baseline and is not reported as a new delivery.

Start this before asking the owner to deliver a fresh synthetic fixture:

```bash
python3 proton_followup.py watch \
  --run-dir "$HOME/.config/pi-durable-agents/spikes/proton/delivery-watch-01" \
  --allow-live --cycles 30 --interval 10
```

Wait for a successful baseline, then have the owner send the fixture. A new message already present at the initial baseline is not a delivery-detection pass. The owner must confirm arrival in INBOX. Later reads should report the additional UID once, not every cycle.

The script records each failed read safely and continues to the next scheduled cycle, using a fresh verified connection each time. This allows it to observe an agreed Bridge outage and subsequent recovery. No write is retried. Failed reads do not replace the saved baseline.

The saved deduplication state survives restarting the watch:

```bash
python3 proton_followup.py watch \
  --run-dir "$HOME/.config/pi-durable-agents/spikes/proton/delivery-watch-01" \
  --allow-live --resume --cycles 3 --interval 10
```

An item that temporarily disappears and reappears is not counted again. UID identities are still IMAP identities, not a guarantee of provider-wide immutable message IDs. Body content and sender addresses are never printed.

### Recorded Bridge stop/start result

The owner quit Bridge and later reopened it during the agreed window. In `delivery-watch-01/watch.jsonl`, cycle 25 recorded an IMAP abort, cycles 26-28 recorded refused connections, and cycle 29 recorded an IMAP error during reconnection. Cycles 30-32 then succeeded with three fixtures, no new UID reports, and unchanged UIDVALIDITY. The watcher remained alive through the outage and was stopped normally by the agent before reconciliation to release the runner lock.

The first subsequent reconciliation command stopped with its error details suppressed; its cause was not established. The lock was then confirmed free, and fresh read-only reconciliation succeeded for all three saved draft actions: `7441566f7b674cd68781e02e4fa9b782`, `55838858e10845388c644bb89929cf7c`, and `9c5a7318a97e466e8a4643d5ea1ea2ff`. No APPEND, cleanup, or service-setting change was performed. This establishes recovery after this owner-driven restart, not unattended startup or a changed UIDVALIDITY.

### Bridge stop/start observation

Use a separate watch directory for this experiment, with enough cycles for the agreed window. Wait for a successful baseline, ask the owner to stop Bridge, observe a failed cycle, then ask them to reopen Bridge and wait for synchronization. Require a subsequent successful cycle. A run with no observed failure does not prove outage recovery. Finish with scoped reconciliation of the existing known draft actions using `proton_spike.py`, without apply.

### Reboot checks

The watch is a foreground process and will not survive reboot. No autostart service is installed. Before reboot, stop it normally with Ctrl+C. After the appropriate startup stage, use a one-cycle resumed read-only probe:

```bash
cd ~/Projects/pi-agent-spikes
python3 proton_followup.py watch \
  --run-dir "$HOME/.config/pi-durable-agents/spikes/proton/delivery-watch-01" \
  --allow-live --resume --cycles 1
```

To claim before-desktop-login startup, run that probe from an already agreed local console before the graphical login and before any manual Bridge/keyring unlock. Running it after desktop login proves only that later stage. If no such local execution path exists, leave pre-login startup unresolved. Do not enable SSH, install a service, change keyring settings, or weaken TLS to get a pass.

### Longer watch

An example with 960 reads and 30-second pauses runs for at least about eight hours, plus the time spent on each read:

```bash
python3 proton_followup.py watch \
  --run-dir "$HOME/.config/pi-durable-agents/spikes/proton/overnight-watch-01" \
  --allow-live --cycles 960 --interval 30
```

Use only an agreed duration. No daemon is installed and nothing locks, suspends, or reboots the host automatically. The watcher holds the existing Proton runner lock, so stop it before using another runner or reconciliation command. Ctrl+C releases that lock. File persistence permits resumption, but does not keep a terminated process running.

Review every record in `watch.jsonl`, not just the process exit status. Exit `0` means the final cycle succeeded; earlier failures remain in the evidence. Exit `2` means the final cycle failed. Timestamps can be matched to owner-reported stop/start, lock, or suspend events. A successful desktop-lock test does not prove that a keyring was locked, and neither establishes login-free boot.

## Limits and stop conditions

- Explicit `--allow-live` is required. A new wire experiment also requires `--allow-draft`.
- Each wire experiment attempts at most one APPEND. A fresh directory is not permission to bypass a previous uncertain action.
- No service changes, Bridge restart, host reboot, SMTP, move, edit, expunge, or deletion are exposed.
- No certificate verification bypass or access to the exported private key is used.
- Watches are bounded to 1-2880 cycles and 5-3600 seconds between cycles. Individual operations have the existing runner timeouts; this is not a strict wall-clock deadline or a production scheduler.
- The live network-drop case above passed. New-delivery detection also passed as recorded above. The owner-driven Bridge outage/restart case also passed as recorded above. Reboot recovery, suspend recovery, and unattended longevity remain unverified until those specific experiments are run and their evidence reviewed.
