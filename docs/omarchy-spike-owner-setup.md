# Integration spike setup on Omarchy

## Completion notice, 27 October 2026

Slack, Google, and Proton spikes are complete and closed. The owner found the remaining evidence and explicitly confirms all previously unrecorded in-scope tests passed. No setup steps, retests, reboot windows, or human observations remain. See the [completion ledger](evidence/integration-spike-ledger.md) and [remaining specification/implementation work](remaining-work.md). The setup instructions and earlier result assessments below are historical reference, not a current to-do list or authorization to repeat tests. Excluded lock/suspend tests remain excluded. No cleanup or credential revocation is implied.


Current evidence and disposition were reconciled on 27 October 2026. See [evidence snapshot](integration-spike-snapshot.md), [remaining work by owner](remaining-work.md), and [durable sources](evidence/README.md). This setup guide is not proof of current credential validity and does not authorize live writes or interruption tests.

Owner checklist for Mark. Updated 25 October 2026.

All three spikes run on your Omarchy computer. Use its terminal and browser throughout. The MacBook and Tailscale are unnecessary for this setup.

Complete the common setup, then Slack, Google, and Proton in that order. You can hand off each spike independently. This guide prepares accounts and test resources; the agent builds and runs the test programs afterward.

## 1. Prepare directories on Omarchy

Open a terminal on **Omarchy**, as your normal desktop user. Paste each command block separately. Do not run these on the MacBook or with `sudo`.

```bash
umask 077
mkdir -p "$HOME/.config/pi-durable-agents/spikes/slack"
mkdir -p "$HOME/.config/pi-durable-agents/spikes/google"
mkdir -p "$HOME/.config/pi-durable-agents/spikes/proton"
mkdir -p "$HOME/Projects/pi-agent-spikes"
chmod 700 "$HOME/.config/pi-durable-agents"
chmod 700 "$HOME/.config/pi-durable-agents/spikes"
chmod 700 "$HOME/.config/pi-durable-agents/spikes/"{slack,google,proton}
chmod 700 "$HOME/Projects/pi-agent-spikes"
```

These commands preserve existing files. The config directories contain credentials; `Projects/pi-agent-spikes` is the disposable runner workspace. Keep the credential directories outside Git and cloud sync.

Check the available tools:

```bash
command -v python3
command -v curl
command -v vim
command -v xdg-open
```

If a tool has no output, tell the agent which tool is missing. You do not need to install an SDK, Node, Google Cloud CLI, Slack CLI, or a system service yourself. If `vim` is absent, use an existing local text editor instead of the `vim` commands below. Do not open secret files with AI context sharing enabled.

Optional basic HTTPS checks, if `curl` is installed:

```bash
curl --head --connect-timeout 15 --max-time 30 https://slack.com
curl --head --connect-timeout 15 --max-time 30 https://accounts.google.com
```

An HTTP response confirms basic connectivity, even if it is a redirect. These commands do not prove Socket Mode/WebSocket access; the agent verifies that when connecting the runner. No router port forwarding, public endpoint, or tunnel is needed. Google's later desktop OAuth helper uses a temporary loopback listener on this computer.

Record your actual paths for the handoff:

```bash
printf 'Runner workspace: %s\nCredential directory: %s\n' \
  "$HOME/Projects/pi-agent-spikes" \
  "$HOME/.config/pi-durable-agents/spikes"
```

Paths and resource IDs can be shared with the agent. Tokens, passwords, OAuth JSON contents, and refresh tokens must stay in local files. Never use `cat` to send a credential file into chat.

## 2. Slack: prepare the credential file

Run:

```bash
umask 077
touch "$HOME/.config/pi-durable-agents/spikes/slack/credentials.env"
chmod 600 "$HOME/.config/pi-durable-agents/spikes/slack/credentials.env"
vim "$HOME/.config/pi-durable-agents/spikes/slack/credentials.env"
```

If the file already contains values, preserve them. Otherwise paste this template **into the editor**, not the terminal prompt:

```dotenv
SLACK_TEAM_ID=REPLACE_ME
SLACK_OWNER_USER_ID=REPLACE_ME
SLACK_TEST_CHANNEL_ID=REPLACE_ME
SLACK_TEST_CHANNEL_KIND=private
SLACK_AGENT_A_APP_ID=REPLACE_ME
SLACK_AGENT_A_BOT_USER_ID=
SLACK_AGENT_A_APP_TOKEN=REPLACE_ME
SLACK_AGENT_A_BOT_TOKEN=REPLACE_ME
SLACK_AGENT_B_APP_ID=REPLACE_ME
SLACK_AGENT_B_BOT_USER_ID=
SLACK_AGENT_B_APP_TOKEN=REPLACE_ME
SLACK_AGENT_B_BOT_TOKEN=REPLACE_ME
```

In Vim: press **i** to enter insert mode before pasting or editing. When finished, press **Esc**, type **:wq**, and press **Enter** to save and exit. To exit without saving, press **Esc**, type **:q!**, and press **Enter**. Use these steps for every Vim command in this guide. Reopen with the same command whenever you need to fill a value. Use one `KEY=value` per line, without quotes or spaces around `=`. The runner must parse this file as data; do not `source` it.

## 3. Slack: check the workspace

1. Open [Slack](https://app.slack.com) in your Omarchy browser and sign in to your existing workspace as its owner.
2. Open the workspace menu and find its plan/billing details, usually under **Tools & settings → Billing** or the workspace administration pages.
3. Confirm the plan is **Free**, without an active paid trial. Record the plan and date in your handoff notes.
4. Open workspace app management and confirm two custom apps can be installed. If capacity or policy blocks installation, record the blocker.
5. Open [Your Apps](https://api.slack.com/apps) in another tab.

Use the actual free workspace. Do not start a paid trial or substitute a developer sandbox: the spike is testing free-workspace behavior.

## 4. Slack: create and configure app A

### 4.1 Create the app

1. In **Your Apps**, select **Create New App → From scratch**.
2. Enter **Wayfinder Spike A** and select your existing free workspace.
3. Create the app.
4. On **Basic Information**, copy the nonsecret App ID into `SLACK_AGENT_A_APP_ID` in your local file.
5. Under **App Home**, set the bot display name to `wayfinder-spike-a` if editable. If bot settings only appear after adding scopes, return after the next step.

### 4.2 Add bot permissions

Open **OAuth & Permissions → Scopes → Bot Token Scopes**. Use **Add an OAuth Scope** for each entry:

| Scope | Purpose |
| --- | --- |
| `app_mentions:read` | Receive your opening mention |
| `chat:write` | Post replies and session status |
| `groups:history` | Receive messages in the private test channel |
| `im:history` | Receive your direct messages |
| `im:write` | Open a DM with you |
| `assistant:write` | Native agent features; agent declaration may add it automatically |

Leave **User Token Scopes** empty. Use a private channel for this guide; no `channels:history` scope is needed. These history permissions are broader than one thread, so invite the apps only to the disposable test channel.

### 4.3 Enable native agent features and messaging

1. Open **Agents** in the app settings sidebar and enable it. Older interfaces may use **Agents & AI Apps**.
2. If prompted, enter the description: `Disposable interaction test using canned responses`.
3. Confirm `assistant:write` is present in bot scopes. The scope alone does not replace enabling the agent feature.
4. Open **App Home** and enable the **Messages** tab.
5. Enable **Allow users to send Slash commands and messages from the messages tab**, if shown. You do not need to register a slash command.

If the setting is missing or paywalled, record the exact message. You may finish ordinary-bot setup, but mark native features blocked. App settings do not prove native Working/Stop will work on Free; that remains the test.

### 4.4 Enable Socket Mode and save the app token

1. Open **Socket Mode** and enable it.
2. Follow the token-generation prompt. Alternatively, use **Basic Information → App-Level Tokens → Generate Token and Scopes**.
3. Name the token `spike-a-socket`.
4. Add only `connections:write` and generate it.
5. Copy the `xapp-...` value into `SLACK_AGENT_A_APP_TOKEN` in the local editor. Save the file.
6. Close the token panel before taking screenshots. Clear the clipboard after pasting.

### 4.5 Add events and interactivity

1. Open **Event Subscriptions** and turn **Enable Events** on.
2. Under **Subscribe to bot events**, add these exact names:

   - `app_mention`
   - `message.groups`
   - `message.im`
   - `agent_session_stopped`

3. Save changes. If the Stop event cannot be selected, record that blocker.
4. Open **Interactivity & Shortcuts**, enable **Interactivity**, and save.
5. With Socket Mode enabled, leave public Request URLs unset. If Slack insists on one, recheck Socket Mode on this app; do not create a tunnel.

`app_mention` is singular; its permission `app_mentions:read` is plural. Fake Approve/Reject buttons use interactivity, not an extra event named `block_actions` in this list.

### 4.6 Install and save the bot token

1. Open **OAuth & Permissions** and choose **Install to Workspace**.
2. Confirm the correct workspace and approve the listed permissions.
3. Copy **Bot User OAuth Token**, starting `xoxb-`, into `SLACK_AGENT_A_BOT_TOKEN` locally.
4. Save the file. Do not copy a signing secret, client secret, or user token.

If scopes change later, reinstall/reauthorize and check the token again. If workspace policy requires token rotation, report that fact so the agent can implement refresh handling.

## 5. Slack: repeat for app B

Create a **separate app**, repeating every step in section 4:

| Item | App B value |
| --- | --- |
| App name | `Wayfinder Spike B` |
| Bot display name | `wayfinder-spike-b` |
| App token label | `spike-b-socket` |
| App ID destination | `SLACK_AGENT_B_APP_ID` |
| `xapp-` token destination | `SLACK_AGENT_B_APP_TOKEN` |
| `xoxb-` token destination | `SLACK_AGENT_B_BOT_TOKEN` |

Use the same workspace, scopes, events, agent feature, Socket Mode, and interactivity settings. You should now have **two app registrations and four tokens**.

## 6. Slack: create the channel and record IDs

1. In Slack, create a **private** channel named `agent-spike`.
2. Open channel details → **Integrations/Apps → Add apps**, then add both spike apps. Confirm both appear as channel apps/members.
3. Open your human profile → **More → Copy member ID**. Save it as `SLACK_OWNER_USER_ID`.
4. Copy the channel ID from channel details and save it as `SLACK_TEST_CHANNEL_ID`.
5. Record the workspace ID as `SLACK_TEAM_ID`. A browser address shaped `https://app.slack.com/client/T.../C...` contains workspace and channel IDs. If the UI does not expose them clearly, share the workspace/channel link and mark IDs pending; do not guess.
6. Open each app's **Messages** view and check that a composer is available.
7. Leave the two `BOT_USER_ID` entries blank if you cannot find them; the runner can verify these through `auth.test`.

Verify file permissions without printing secrets:

```bash
stat -c '%a %n' "$HOME/.config/pi-durable-agents/spikes/slack"
stat -c '%a %n' "$HOME/.config/pi-durable-agents/spikes/slack/credentials.env"
```

Expected modes: directory `700`, file `600`.

**Slack handoff:** tell the agent the absolute credential-file path, Free-plan status, channel visibility, and any blocked settings. The agent can now prepare/connect the runner. Bots will not reply until it runs. When prompted later, send fresh messages, observe Working, click Stop during one and two fake jobs, and test fake approval buttons in DMs. No Google connection is involved in the Slack test.

## 7. Google: register the OAuth test app

### 7.1 Create a Cloud project and enable APIs

1. Open [Google Cloud Console](https://console.cloud.google.com) on Omarchy.
2. Sign in with your personal Google account, which will own the test project and provide both Gmail and Google Calendar access. Project ownership does not decide which mailbox/calendar a token accesses; verify the account during each consent flow.
3. Use the project selector → **New Project**. Name it `Pi Agent Spike`, create it, and select it.
4. Open **APIs & Services → Library**, search **Gmail API**, select it, and click **Enable**.
5. Return to Library, search **Google Calendar API**, and enable it too.

Use one desktop OAuth client for both services on the same personal account. Work Gmail and work Calendar are outside scope. Do not request domain-wide delegation or create a service-account key.

### 7.2 Configure consent

1. Open **Google Auth platform**; choose **Get started** if prompted.
2. Under **Branding**, name the app `Pi Agent Spike` and enter your support/contact email where required.
3. Under **Audience**, choose **External** for an app that must authorize personal Gmail.
4. Keep publishing status **Testing**.
5. Under **Test users**, add your personal Gmail address. This same account will authorize both services.
6. Under **Data Access → Add or remove scopes**, select the proposed scopes below and save.

| Account | Scope |
| --- | --- |
| Personal Gmail | `https://www.googleapis.com/auth/gmail.readonly` |
| Personal Gmail | `https://www.googleapis.com/auth/gmail.compose` |
| Personal Calendar | `https://www.googleapis.com/auth/calendar.events` |

The agent's authorization helper must use the **same personal Google account** for both services, request only the corresponding service's scopes in each flow, and store Gmail and Calendar tokens separately. `gmail.compose` also permits sending; the trusted runner must block send operations. Calendar scope is not confined by Google to the test calendar; the runner must allowlist its ID. Both are adapter requirements, not guarantees supplied by the consent screen.

### 7.3 Create and download a desktop client

1. Open **Google Auth platform → Clients → Create client**.
2. Select application type **Desktop app**.
3. Name it `Omarchy Spike Runner` and create it.
4. Download its JSON file.
5. Move it into the private directory using the commands below.

First list candidate downloads; this prints filenames, not their contents:

```bash
find "$HOME/Downloads" -maxdepth 1 -type f -name 'client_secret*.json' -print
```

Replace the example source path below with the exact file you just downloaded. Keep the quotes. `-i` asks before overwriting an existing client file.

```bash
mv -i "$HOME/Downloads/REPLACE_WITH_DOWNLOADED_FILENAME.json" \
  "$HOME/.config/pi-durable-agents/spikes/google/client.json"
chmod 600 "$HOME/.config/pi-durable-agents/spikes/google/client.json"
python3 -m json.tool "$HOME/.config/pi-durable-agents/spikes/google/client.json" >/dev/null
```

The last command should exit silently. If Python is unavailable, skip that validation and tell the agent. Do not paste the JSON into chat.

## 8. Google: prepare the test resources

### 8.1 Personal Gmail

1. Open [Gmail](https://mail.google.com) in a browser profile signed into your **personal** account.
2. Select two or three synthetic messages already in the account, or manually send yourself harmless test messages with a unique subject such as `AGENT-SPIKE-20261025`.
3. Write down the exact subject marker and account address for the handoff. The runner should resolve only those fixtures and avoid unrelated mailbox content.
4. Permit creation of clearly labelled **unsent** test drafts. Do not grant sending, deleting mail, or editing existing unrelated drafts.

### 8.2 Personal Google Calendar

1. Open [Google Calendar](https://calendar.google.com) signed into the **same personal account used for Gmail**. Confirm the profile avatar/account address.
2. Open **Settings → Add calendar → Create new calendar**.
3. Name it **Agent Spike** and create it. Use `America/Vancouver` as its timezone.
4. Select that calendar under **Settings for my calendars**.
5. Open **Integrate calendar**, copy **Calendar ID**, and record it. Do not copy a secret iCal URL.
6. If calendar creation or OAuth access is blocked, report the blocker. Do not substitute your real appointment calendar or your work account.

Create a local handoff note:

```bash
umask 077
touch "$HOME/.config/pi-durable-agents/spikes/google/resources.txt"
chmod 600 "$HOME/.config/pi-durable-agents/spikes/google/resources.txt"
vim "$HOME/.config/pi-durable-agents/spikes/google/resources.txt"
```

In Vim, press **i**, then record:

```text
Personal Gmail address:
Gmail fixture subject marker:
Personal Calendar account address (same as personal Gmail):
Agent Spike calendar ID:
Timezone: America/Vancouver
OAuth client path:
Personal Google account OAuth access: allowed / pending / blocked
```

**Google handoff:** the local desktop OAuth helper is `~/Projects/pi-agent-spikes/google_oauth.py`. It reads the client JSON and resources file above and writes separate `gmail-token.json` and `calendar-token.json` files in the same private Google directory. Both flows require the same personal account. In addition to the service scopes above, each flow requests `openid` and `https://www.googleapis.com/auth/userinfo.email` to verify the selected account. The helper performs consent and identity verification only, not mail or calendar operations. Sending restrictions and the test-calendar allowlist must still be enforced by the future runner.

Validate local files without starting consent:

```bash
uv run "$HOME/Projects/pi-agent-spikes/google_oauth.py" both --check
```

When ready to authorize, run:

```bash
uv run "$HOME/Projects/pi-agent-spikes/google_oauth.py" both
```

`uv` installs the helper's declared dependencies. The helper opens a temporary loopback listener for up to three minutes per flow. Existing tokens are not overwritten unless you pass `--replace` for fresh consent. If the second flow fails, the first flow's saved token remains; rerun with `calendar` instead of `both` to finish Calendar consent.

1. Run the authorization command in the Omarchy terminal.
2. In the browser it opens, verify the app and select your personal Google account.
3. Review permissions. Both Gmail and Calendar consent must be for that same personal account, with only the corresponding service's scopes in each flow.
4. Approve the matching flow, then repeat for the other service using the same account.
5. Confirm token files were written locally without displaying their contents.
6. Approve each exact test calendar operation before execution. Do not add attendees or notification recipients.

Testing-mode external OAuth refresh tokens for these scopes expire after seven days. Reauthorization may therefore be needed; unattended production renewal remains a spike finding.

### 8.3 Recorded Google spike results

The owner reports completing OAuth consent for both Gmail and Calendar on the same personal account. Local runner validation now passes after configuring the dedicated Agent Spike secondary-calendar ID.

The Calendar read check passed against that empty calendar. Zero events is a valid pass for access. The runner's successful read path includes token refresh and account identity verification before listing events in the configured test calendar. These are owner-reported results, not an independently observed live run.

The later live read/draft/Calendar/reconciliation checks and owner UI observations passed. The owner has now recovered the remaining evidence and confirms every previously unrecorded in-scope test passed, including remaining recovery and unattended-authorization checks. All three integration spikes are complete; no evidence recapture is required. The 18 Google offline tests remain a separate fake-based test result.

The local runner is `~/Projects/pi-agent-spikes/google_spike.py`; commands and limits are documented in `~/Projects/pi-agent-spikes/GOOGLE-SPIKE.md`.

## 9. Proton: open the installed Bridge on Omarchy

The project records that Bridge is already installed. Keep the working installation.

1. Open the Omarchy application launcher and search **Proton Mail Bridge**.
2. Open Bridge. If already running, use its existing window/tray entry; avoid starting a second copy.
3. Sign in yourself if required, including two-factor authentication.
4. Confirm the account is connected and synchronized.
5. Record the Bridge version from **About/Settings** and whether it currently starts automatically after login.

Optional read-only terminal checks:

```bash
command -v protonmail-bridge
pgrep -x protonmail-bridge
```

No executable path may mean a different installation format. It does not prove Bridge is absent. If you cannot find/open it, report that before installing another copy. The agent can prepare installation instructions using Proton's current Arch/PKGBUILD guide if necessary.

If Bridge reports a password-store/keyring error, record the exact redacted error. Linux Bridge needs a supported password store; do not reset your keyring or create a new GPG setup merely to get past this step. Getting Bridge to start without an unlocked desktop session is part of the unattended-startup spike.

## 10. Proton: save the IMAP connection details

Prepare the local file:

```bash
umask 077
touch "$HOME/.config/pi-durable-agents/spikes/proton/imap.env"
chmod 600 "$HOME/.config/pi-durable-agents/spikes/proton/imap.env"
vim "$HOME/.config/pi-durable-agents/spikes/proton/imap.env"
```

In Vim, press **i**, then paste this template:

```dotenv
PROTON_IMAP_HOST=REPLACE_ME
PROTON_IMAP_PORT=REPLACE_ME
PROTON_IMAP_TLS_MODE=REPLACE_ME
PROTON_IMAP_USERNAME=REPLACE_ME
PROTON_IMAP_PASSWORD=REPLACE_ME
```

Then:

1. In Bridge, select your account and open its mail-client configuration/connection settings.
2. Copy the **IMAP** host, port, security mode, username, and generated password into the file.
3. For TLS mode, record the displayed meaning, such as `STARTTLS` or `implicit TLS`. Do not assume a port or mode from another guide.
4. Use the **Bridge-generated password**, not your Proton login password.
5. Save and exit. Do not copy SMTP settings; sending is outside scope.
6. Record any certificate/trust information separately for the agent. Do not disable certificate verification as a workaround.

The local spike runner `~/Projects/pi-agent-spikes/proton_spike.py` reads this format as data and preserves literal password characters. Do not add shell quotes around values or `source` this file. Keep Bridge on loopback; do not expose its ports through Tailscale or your router. The runner requires verified TLS. If Bridge's certificate is not system-trusted, provide its owner-verified public PEM certificate with `--ca-file`; never disable verification.

Check permissions:

```bash
stat -c '%a %n' "$HOME/.config/pi-durable-agents/spikes/proton/imap.env"
```

Expected mode: `600`.

## 11. Proton: choose test mail and finish the handoff

1. Open your normal Proton Mail client or [Proton webmail](https://mail.proton.me).
2. Choose synthetic messages or manually send yourself harmless fixtures with subject marker `AGENT-SPIKE-PROTON-20261025`.
3. Tell the agent the marker and which Proton account/address it may use.
4. Authorize reading/searching those fixtures and creating distinctly named unsent drafts through IMAP. Exclude sending, moving mail, and deletion.
5. Give it the absolute `imap.env` path and Bridge version.
6. When the agent saves a draft, open it in Proton and verify that it appears and remains editable. Do not send it.

The local runner and offline tests are in `~/Projects/pi-agent-spikes`. Commands, certificate handling, draft authorization flags, reconciliation, and evidence limits are documented in `~/Projects/pi-agent-spikes/PROTON-SPIKE.md`. Run its offline tests with `python3 -m unittest discover -s ~/Projects/pi-agent-spikes -p 'test_proton_spike.py' -v`. No live Proton access was performed while writing these tests.

The owner-authorized live run passed verified TLS/login, reads of two synthetic fixtures, and three polling cycles. The owner confirmed the original unsent draft appears and is editable. Bridge omitted the custom tracking header, so reconciliation now uses the preserved Message-ID and exact unique subject plus draft flags. The original draft reconciles successfully without replay.

A controlled subprocess crash test created one additional unsent draft, exited after APPEND succeeded but before the runner received its return value, then verified that draft from two fresh processes. Reapply was refused before connecting, and only one matching draft was found. A second test exited after the uncertain journal commit but before APPEND; no matching draft was found, and the action correctly remains uncertain and non-replayable. These test runner-process recovery, not wire-level lost responses or Bridge outages. Results and action IDs are in `~/Projects/pi-agent-spikes/PROTON-SPIKE.md`.

The agent owns connection, polling, draft reconciliation, and duplicate-prevention checks. Arrange any Bridge restart, host reboot, or disconnect test with you first because it may interrupt your normal mail client. A successful desktop-session test does not establish unattended boot behavior.

## 12. Send the agent this readiness report

Copy the template below into your coding-agent session on **Omarchy**, replacing placeholders with nonsecret facts. If your agent session is elsewhere, Tailscale connectivity alone does not provide shell access; it needs an explicitly configured remote execution path.

```text
Run the integration spikes on Omarchy.

Runner workspace: /home/MY_USER/Projects/pi-agent-spikes
Slack credential file: /home/MY_USER/.config/pi-durable-agents/spikes/slack/credentials.env
Google client JSON: /home/MY_USER/.config/pi-durable-agents/spikes/google/client.json
Google resources note: /home/MY_USER/.config/pi-durable-agents/spikes/google/resources.txt
Proton IMAP file: /home/MY_USER/.config/pi-durable-agents/spikes/proton/imap.env

Slack plan/date checked:
Slack apps installed and invited: yes / blocker
Native agent settings and Stop event available: yes / blocker
Google app test users configured: yes / blocker
Personal Google account OAuth access: allowed / pending / blocked
Proton Bridge version and synchronization status:
Proton test subject marker:
Missing tools or other blockers:

Prepare the disposable runners and scoped OAuth helper.
Slack: I authorize synthetic messages in agent-spike and DMs to me,
fake cancellable jobs, and fake approval buttons.
Gmail/Proton: I authorize reading the named synthetic fixtures and
creating clearly labelled unsent test drafts; no sending or deletion.
Calendar: use only Agent Spike; ask for each exact test write approval.
Keep credentials in trusted adapters and out of model context/logs.
Do not access unrelated mail, calendars, channels, or 1Password.
Arrange restart/disconnect tests with me before running them.
Tell me when to observe the UI and supply the exact OAuth helper commands.
```

Replace `/home/MY_USER` with the actual home path printed in section 1. A partial handoff is fine: list a spike as blocked rather than waiting to finish all three.

## 13. What you do during and after the agent's tests

| Spike | Your remaining involvement |
| --- | --- |
| Slack | Send fresh mentions/replies, observe both bots in a shared thread, click native Stop with one/two jobs, and click fake Approve/Reject buttons |
| Google | Complete browser consent for each account, approve exact calendar changes, and inspect test drafts/events |
| Proton | Inspect saved drafts in Proton and agree on a suitable time for interruption/startup tests |

The agent returns a result matrix with **observed working**, **observed unavailable with cause**, or **unresolved**. It must distinguish native UI observations from successful API responses and record uncertain-write/retry behavior.

After results are captured:

1. Stop the test runners.
2. Revoke disposable Slack tokens and remove only the two spike apps when no longer needed.
3. Revoke Google test grants under your Google Account's third-party connections if the spike is finished.
4. Manually clean up test drafts/calendar fixtures unless you approved exact cleanup operations.
5. Remove disposable credential/token files after revoking access. Keep your normal Bridge installation.

## Official references

Setup checked against these sources on 25 October 2026. UI labels may vary; report differences instead of broadening permissions.

- [Slack app settings](https://api.slack.com/apps)
- [Slack Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode/)
- [Slack agent configuration and plan caveat](https://docs.slack.dev/ai/developing-agents/)
- [Slack agent sessions and Stop](https://docs.slack.dev/ai/agent-sessions/)
- [Slack app manifest reference](https://docs.slack.dev/reference/app-manifest/)
- [Google Gmail desktop setup](https://developers.google.com/workspace/gmail/api/quickstart/python)
- [Google Calendar desktop setup](https://developers.google.com/workspace/calendar/api/quickstart/python)
- [Gmail scope definitions](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Calendar scope definitions](https://developers.google.com/workspace/calendar/api/auth)
- [Google OAuth token expiry](https://developers.google.com/identity/protocols/oauth2#expiration)
- [Proton Bridge Linux support](https://proton.me/support/bridge-for-linux)
- [Proton Bridge Linux password-store troubleshooting](https://proton.me/support/bridge-linux-login-error)
- [Proton Bridge Arch/PKGBUILD installation, only if needed](https://proton.me/support/install-bridge-linux-pkgbuild-file)

No account configuration, credential access, message sending, or live spike execution was performed while writing this guide.
