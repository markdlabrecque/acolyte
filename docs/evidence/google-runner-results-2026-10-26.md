# Google integration spike runner

Run on the local Omarchy desktop. No live API calls were made while building the runner. Unit tests use fakes, including simulated lost write responses. They do not establish Google's actual recovery behavior.

## Configuration

The runner uses the existing private files in `~/.config/pi-durable-agents/spikes/google/`:

- `resources.txt`
- `gmail-token.json`
- `calendar-token.json`

Both tokens must belong to the personal account in the resource file. Every online command explicitly refreshes its service token, saves it privately, and verifies the account before service access. Requests have no automatic write retries.

`Agent Spike calendar ID` must identify a dedicated secondary calendar ending in `@group.calendar.google.com`. In Firefox, open Google Calendar, select **Agent Spike → Settings → Integrate calendar**, and copy **Calendar ID**, not an iCal URL or your account address. If your calendar uses another ID format, stop for verification rather than substituting your primary calendar.

The Gmail fixture marker must be 8-100 letters, digits, underscores or hyphens. Use a unique marker present only in synthetic messages.

## Read-only checks

```bash
cd ~/Projects/pi-agent-spikes
uv run google_spike.py check
uv run google_spike.py mail-read
uv run google_spike.py calendar-read
uv run google_spike.py refresh --service gmail
uv run google_spike.py refresh --service calendar
```

`check` is local only. `mail-read` searches outside spam and trash, validates subject metadata, then fetches up to five matching messages. It prints only a count, not message contents. `calendar-read` lists up to ten upcoming events from the configured test calendar and prints only a count.

## Unsent draft test

First create an offline plan:

```bash
uv run google_spike.py draft-plan
```

Copy the printed action ID into the next command:

```bash
uv run google_spike.py apply --action ACTION_ID
```

This creates one synthetic unsent draft with a unique subject and no recipients, then looks it up. It does not use your existing mail as draft content. Sending, updating and deleting mail are not exposed.

## Approved calendar creation test

Choose a real future timestamp with a timezone. This example computes tomorrow at the current UTC time:

```bash
START=$(python3 -c 'from datetime import datetime,timedelta,timezone; print((datetime.now(timezone.utc)+timedelta(days=1)).isoformat())')
uv run google_spike.py event-plan --start "$START"
```

The plan creates a ten-minute synthetic event with no attendees and no reminders. Copy its action ID:

```bash
uv run google_spike.py apply --action ACTION_ID
```

Review the exact calendar ID, title, start, end and other fields printed in the terminal. To approve, type the displayed `APPROVE` phrase and full SHA-256 digest. Approval requires an interactive terminal. The write requests `sendUpdates=none`. No calendar update or deletion command is implemented.

## Uncertain results

The private SQLite journal records the exact action and marks it uncertain before any write. Calendar inserts use a pre-recorded event ID. Draft inserts use a unique pre-recorded subject marker. Attempted actions cannot be applied again, even after a timeout or interrupted process.

```bash
uv run google_spike.py reconcile --action ACTION_ID
```

Reconciliation only reads. Calendar reconciliation checks the known event ID and fields. Draft reconciliation scans all pages matching the unique subject and reports verified, duplicates or uncertain. Absence does not prove failure. The runner never retries an uncertain write, deletes duplicates, or changes an existing remote item. Exit status is 2 for an unresolved or duplicate reconciliation result.

Do not deliberately interrupt real writes until an exact experiment has been reviewed. Lost-response recovery is currently tested with fakes only. Keep test drafts and events until their results are reviewed; cleanup must be done manually or implemented with separate exact-action approval.

## Tests and limits

```bash
python3 -m unittest -v test_google_oauth test_google_spike
```

Local account configuration and file permissions are checked. Tokens, message bodies and provider error bodies are not printed. Token and journal files must stay outside Git and cloud sync. Do not run the OAuth helper concurrently with the spike runner.

This is a local spike tool, not the production trusted-adapter boundary. A process that can read the token files still has Google's broader privileges, including Gmail sending. No agent runtime, model, generic execution tool, or network sandbox is connected here. Production credential isolation, polling, quotas, update/delete workflows, duplicate cleanup, reboot recovery, and unattended authorization longevity remain unverified.

## Recorded results

The initial local check refused an account-style Calendar ID. The owner subsequently configured the dedicated Agent Spike secondary-calendar ID and reports that `check` now passes.

The owner reports completing OAuth consent for both services on the same personal account and successfully running the Calendar read check against the newly created, empty test calendar. Zero events is a valid pass for this check. The successful command path includes token refresh, account verification and an event-list request to the configured calendar. These results are owner-reported; raw output was not captured and no independent live run was performed for this documentation update.

All 18 offline tests pass, including simulated lost write responses. Gmail fixture reads, draft creation, calendar writes, live uncertain-write reconciliation, duplicate cleanup and long-term unattended authorization remain unverified. No Gmail read pass is inferred from the Calendar result, and an empty-calendar read does not verify event contents or write permissions. The spike remains open.
