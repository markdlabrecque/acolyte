# Proton Mail Bridge spike

Disposable Python standard-library runner for the owner setup's Proton sections 9-11. Initial development and tests were offline. A subsequent owner-authorized live run is recorded below. Do not infer account eligibility, synchronization, or unattended startup from passing fake tests.

Files are in `~/Projects/pi-agent-spikes`:

- `proton_spike.py` is the runner.
- `test_proton_spike.py` contains offline runner tests.
- `proton_recovery_test.py` is the opt-in live subprocess crash harness.
- `test_proton_recovery_test.py` tests hook placement offline.
- `proton_followup.py` scripts the remaining isolated network-drop and read-only monitoring experiments. See `PROTON-FOLLOWUP.md` for commands and limits, and `~/Projects/pi-durable-agents/docs/proton-spike-owner-checklist.md` for owner actions. The live network-drop, new-delivery detection, and owner-driven Bridge stop/start experiments have passed. Reboot and long-running monitoring experiments remain unrun.

## Configuration and trust

Keep the working Bridge installation. Do not install another copy, change its service settings, restart it, or reset a keyring for these commands.

The runner reads `~/.config/pi-durable-agents/spikes/proton/imap.env` in the exact five-key format from the owner setup. The file must be owned by you, regular, nonsymlink, and mode `600`. Values are literal. Do not add shell quoting unless a quote is actually part of the password. Spaces, `#`, `$`, and extra `=` characters in the Bridge-generated password are preserved. Do not source the file or share its contents.

Only `localhost`, `127.0.0.1`, or `::1` hosts are accepted. Security mode must be `STARTTLS` or `implicit TLS`, case-insensitive. Use Bridge's displayed port, mode, and credentials, not a guessed port or your Proton login password. Login happens only after TLS verification succeeds.

If Bridge uses a certificate not trusted by your system, obtain its public certificate through the installed Bridge's supported certificate-export process. Verify it locally with the owner before use. Supply the verified PEM path with `--ca-file /absolute/path/to/bridge-cert.pem` on each command. Certificate chain and hostname verification stay enabled. If the certificate does not match the configured loopback hostname, stop and resolve the trust/hostname issue. There is no insecure-TLS switch.

The private Proton directory must be mode `700`. The runner saves a private SQLite journal there and locks out concurrent runner processes. Its journal is bound to the endpoint, username, fixture marker, and selected mailboxes. Do not change those between planning, applying, and reconciling an action. Password rotation alone does not change the journal binding.

## Offline checks and tests

```bash
cd ~/Projects/pi-agent-spikes
python3 -m unittest -v test_proton_spike test_proton_recovery_test
python3 proton_spike.py check --marker AGENT-SPIKE-PROTON-20261025
```

Tests use temporary synthetic credentials and fake IMAP connections only. `check` reads the owner's local configuration but makes no connection. It checks file permissions and settings, not Bridge version, synchronization, or TLS connectivity. Custom certificate files are validated if supplied.

## Fixture search, read, and polling

Get owner authorization for the account and unique synthetic fixture marker before live commands. Replace the example marker if the prepared fixtures use another one. The username is the Bridge login identity, not an independently verified Proton account address. Confirm the account in Bridge yourself.

```bash
python3 proton_spike.py read --marker AGENT-SPIKE-PROTON-20261025 --allow-live
python3 proton_spike.py poll --marker AGENT-SPIKE-PROTON-20261025 --allow-live --cycles 3 --interval 10
```

Add `--ca-file` when required. The default fixture mailbox is `INBOX`; use `--mailbox NAME` if the owner prepared fixtures elsewhere. Only simple ASCII mailbox names are supported. There is no mailbox enumeration command.

Each cycle selects the fixture mailbox read-only, searches only the subject marker, checks matching subject headers before reading bodies, and fetches at most 64 KiB per fixture using `BODY.PEEK`. It does not mark mail seen. Search results over 100 fixtures stop the command rather than treating an incomplete search as absence. Output contains counts only, not subjects, addresses, bodies, passwords, or raw server errors.

Polling reconnects with TLS each cycle. It reports newly observed UID identities using both UIDVALIDITY and UID. A UIDVALIDITY reset is reported, not interpreted as newly delivered mail. Polling is bounded to 1-10 cycles with 5-300 seconds between cycles. There is no IMAP IDLE implementation or automatic reconnect retry after failure. Zero matching messages means the scoped query completed, not that fixture retrieval was verified.

## One unsent draft

Get owner authorization for this test write. Planning is offline but reads the local configuration to bind the journal.

```bash
python3 proton_spike.py draft-plan --marker AGENT-SPIKE-PROTON-20261025
```

Copy the printed action ID. Keep the same marker, endpoint, username, and mailbox options for subsequent commands.

```bash
python3 proton_spike.py apply --marker AGENT-SPIKE-PROTON-20261025 --action ACTION_ID --allow-live --allow-draft
```

The default destination is `Drafts`. An alternative requires `--draft-mailbox NAME` on all commands, including planning. The runner requires that exact mailbox to be advertised with IMAP's `\Drafts` special-use attribute. If this Bridge version does not advertise that attribute, draft creation is blocked pending investigation. Do not fall back to INBOX or an arbitrary folder.

The runner uses one IMAP APPEND with the `\Draft` flag. The synthetic message has a unique subject, Message-ID, and X-Pi-Spike-ID, fixed harmless content, and no recipients. No SMTP library or send command is used. Editing existing drafts, moving messages, flag changes, deletion, and expunge are not exposed. Logout never uses IMAP CLOSE, which could expunge other deleted messages.

After APPEND succeeds, the runner looks the draft up again. `verified` means one matching draft was observed in Bridge with the expected identifiers and draft flag. It does not prove Proton's upstream synchronization or client editability. In Proton webmail in Firefox, open the uniquely named draft, confirm it is present and editable, and record that it remains unsent. Do not send it. Manually clean up only after reviewing the results.

## Lost response or interruption

```bash
python3 proton_spike.py reconcile --marker AGENT-SPIKE-PROTON-20261025 --action ACTION_ID --allow-live
```

The journal marks the action uncertain before APPEND. After any attempt, including a crash, cancellation, server rejection, or lost response, the same action cannot be applied again. Reconciliation performs reads only and searches the configured draft mailbox by both pre-recorded Message-ID and unique subject. It deduplicates the union of UID results and checks exact subject, Message-ID, and flags. Bridge omitted the custom X-Pi-Spike-ID header in the observed live draft, so that header is not a verification requirement. Multiple candidates from either search require review, even if only one has both exact identifiers. Reapplying an attempted action is refused before any connection.

- `verified` means exactly one matching, nondeleted draft was observed.
- `duplicates` means multiple search hits require review. No cleanup occurs.
- `uncertain` means absence, mismatched identifiers, missing draft flags, or an incomplete/failed lookup. Absence is not proof that APPEND failed. A lookup error exits with an error while leaving the journal uncertain.

Exit codes are `0` for a completed read/check/plan or verified reconciliation, `2` for uncertain/duplicates, `1` for a stopped command, and `130` for Ctrl+C. Provider error details are suppressed. Writes have zero automatic retries, below the planning limit of two. Do not create a new action to bypass an uncertain result. Wait for synchronization and reconcile the same action, then ask the owner if uncertainty remains.

## Recorded live run

After the owner exported Bridge's certificate locally, TLS verification and login succeeded using `cert.pem`. The private key was not read.

- Scoped fixture search and body reads succeeded for two matching synthetic messages.
- Three polling cycles each found those two fixtures. Later cycles reported zero newly observed UID identities and no UIDVALIDITY reset. Delivery of a new fixture during polling was not tested.
- One APPEND was attempted for action `7441566f7b674cd68781e02e4fa9b782`. APPEND returned success, but immediate reconciliation and another lookup after five seconds both reported `uncertain`.
- A read-only diagnostic found one draft with matching subject and Message-ID, a draft flag, and no deleted flag. A subsequent diagnostic confirmed the custom X-Pi-Spike-ID header was absent from the returned headers. Both Message-ID and subject searches independently found the draft.
- The owner confirmed this draft appears and is editable in Proton.
- After regression tests reproduced the reconciliation failure, the runner was changed to verify the preserved subject and Message-ID pair and flags. Reconciliation of the original action now reports `verified`, without another write.
- No write was replayed and no draft was deleted.

The original draft subject is `AGENT-SPIKE-PROTON-DRAFT-7441566f7b674cd68781e02e4fa9b782`.

## Controlled subprocess recovery results

The owner authorized one additional unsent synthetic draft. The live harness completed both cases successfully. All 40 offline tests also pass.

1. **Crash after APPEND, before the runner receives a return value.** Action `55838858e10845388c644bb89929cf7c` made one instrumented APPEND call and received OK inside the adapter, then exited immediately with code 86. No Python cleanup or post-write reconciliation ran in that child. Two new-process reconciliations each reported `verified`. Reapply was refused before connecting. An additional independent scoped lookup found exactly one UID from each identifier query and exactly one UID in their union.
2. **Crash before APPEND, after the uncertain journal commit.** Action `edf75dea56fb428c9fb0de4d0414ab72` exited with code 86 after the durable commit and made zero APPEND calls. Two new-process reconciliations each stayed `uncertain`. Reapply was refused before connecting. Independent subject and Message-ID lookups both found zero matches. This deliberate no-write action remains uncertain and must not be replayed.

Private action manifests, fsynced instrumentation events, and results are retained in `~/.config/pi-durable-agents/spikes/proton/recovery-run-1b24151f161c40218193aca2903340a2/`. The new draft's subject is `AGENT-SPIKE-PROTON-DRAFT-55838858e10845388c644bb89929cf7c`.

This tests abrupt runner-process loss and application-level lost acknowledgement. The adapter had already consumed the server's OK in the after-APPEND case. It does not test a dropped network response, a crash during transfer, host power loss, or Bridge restart. No duplicate was deliberately inserted into live mail. Duplicate detection is tested offline; the live experiment demonstrates replay refusal and that no duplicate appeared after this crash sequence.

For a separately authorized repeat, run:

```bash
python3 proton_recovery_test.py --allow-live --allow-draft
```

Each invocation creates one new draft and one intentionally unresolved no-write action. Do not rerun it to bypass a failed or uncertain experiment. Preserve its action manifests and reconcile those actions instead.

## Evidence still needed

Record each live observation separately as observed working, observed unavailable with cause, or unresolved:

| Check | Current evidence |
| --- | --- |
| Bridge version, account eligibility, connected/synchronized state | Unresolved; owner must confirm |
| TLS trust and login with Bridge-generated credentials | Observed working with owner-exported certificate |
| Scoped search and body reads | Observed working for two fixtures using read-only selection and BODY.PEEK; independent Seen-flag comparison not performed |
| Polling and UIDVALIDITY changes | New delivery observed once in watch cycle 11, with no repeated new-UID report in cycles 12 and 13; three total fixtures. Actual UIDVALIDITY reset remains untested. Evidence in `delivery-watch-01/watch.jsonl` |
| APPEND persistence and client editability | Original draft verified through Bridge; owner confirmed visibility and editability in Proton |
| Abrupt runner loss after APPEND | Observed working; one new draft, two successful reconciliations, replay refused locally |
| Abrupt runner loss before APPEND | Observed conservative behavior; no draft found, state stays uncertain, replay refused locally |
| Duplicate detection | Offline tests pass; no duplicate after live recovery; deliberate live duplicate insertion not tested |
| Wire-level lost response | Observed working through isolated TLS pass-through proxy; action `9c5a7318a97e466e8a4643d5ea1ea2ff` verified twice after APPEND abort; one matching draft, local replay refusal, no write retry. Evidence in `wire-test-01/` and `PROTON-FOLLOWUP.md` |
| In-transfer truncation | Unresolved; the live network-drop case sent the complete literal before losing inbound bytes |
| Disconnect/reconnect and Bridge restart | Owner-driven stop/start passed: failed watch cycles 25-29 followed by successful cycles 30-32 with three fixtures and no new UID reports. All three saved drafts verified afterward without writes. See `PROTON-FOLLOWUP.md` for the initial reconciliation-command error and subsequent successful read-only checks |
| Reboot, keyring unlock, login-free startup, long-term recovery | Unresolved; no desktop/service changes performed |

Never kill Bridge, block its ports, reboot the host, or deliberately interrupt a live write without an agreed experiment. A normal desktop-session pass does not establish unattended boot behavior. No primary-documentation review or runtime installation check is claimed here.

This runner is not a production security boundary. Its process can read credentials with broader IMAP privileges than the methods exposed here. Production credential isolation, OS-level SMTP restrictions, network sandboxing, durable scheduler integration, and production recovery remain separate work. Do not connect an agent runtime or model to the credential directory.
