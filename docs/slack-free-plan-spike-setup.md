# Prepare two Slack bots for the free-plan interaction spike

## Completion notice, 27 October 2026

Slack, Google, and Proton spikes are complete and closed. The owner found the remaining evidence and explicitly confirms all previously unrecorded in-scope tests passed. No setup steps, retests, reboot windows, or human observations remain. See the [completion ledger](evidence/integration-spike-ledger.md) and [remaining specification/implementation work](remaining-work.md). The setup instructions and earlier result assessments below are historical reference, not a current to-do list or authorization to repeat tests. Excluded lock/suspend tests remain excluded. No cleanup or credential revocation is implied.


Checked against official Slack documentation on 2026-10-23. This is a setup guide for the owner, not a record of completed setup or a passing test.

You create each app and its bot identity in Slack's app settings. You do not need to create bots on a server. Later, a disposable program on your local development computer will connect to both apps through Socket Mode. That program supplies the responses and handles buttons. Slack stores the app identities and displays the conversations. [Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode/)

The setup gives each app two different credentials. A scope is a permission attached to a token, not a separate token you send to an agent. Keep all tokens out of chat.

## What you do now, and what happens later

| Owner setup in this guide | Later, separately authorized spike |
| --- | --- |
| Confirm the existing workspace is genuinely on Free and has two available app slots | Verify the recorded plan and app configuration before interpreting results |
| Register two apps with distinct bot names | Connect a local disposable runner to both apps |
| Configure permissions, events, Socket Mode, agent mode, and messaging | Handle events, canned replies, fake cancellable jobs, and fake approval buttons |
| Install the apps yourself and store credentials privately on your computer | Load credentials directly into the runner without printing or pasting them into chat |
| Create a test channel, invite both apps, and record nonsecret IDs | Observe shared threads, native Working/Stop, two-agent cancellation, and owner DMs |

No model provider, Pi Durable runtime, Gmail, Proton Bridge, or Google Calendar setup is needed. Calendar approval messages in this spike are fake fixtures with no calendar connection. Broader recovery tests belong to the first implementation. Do not log in to or write to a production server. This guide uses no 1Password access or tooling.

This document follows the [confirmed PRD scope](../pi-durable-personal-agent-prd.md#confirmed-scope-2026-10-23), [interaction decisions](../.scratch/personal-assistant/issues/05-define-slack-interactions.md), and [spike ticket](../.scratch/personal-assistant/issues/13-test-free-slack-agent-interactions.md). It does not settle the open Slack product questions.

## 1. Check the workspace and prepare a private local file

- [ ] In Firefox, sign in to your existing Slack workspace as its owner. Keep the workspace and [Your Apps](https://api.slack.com/apps) open in separate tabs.
- [ ] Check the workspace's plan or billing page. Record the plan name and date. It must say Free, with no active paid trial. Do not use a developer sandbox, even if it costs nothing; its extra features would invalidate this entitlement test.
- [ ] Open the workspace's app-management page and count installed apps. Free workspaces allow ten third-party or custom apps in total. Reserve two slots. If the limit is reached, stop setup until you have deliberately chosen which unused apps to remove. [Free workspace limits](https://slack.com/help/articles/115002422943-Usage-limits-for-free-workspaces)
- [ ] Confirm you can install custom apps. If Slack requires app approval, use the workspace's approval process. Do not turn off workspace restrictions to bypass it. [App installation and approval](https://slack.com/help/articles/202035138-Add-apps-to-your-Slack-workspace)
- [ ] Choose a local development computer for the later runner. It needs outbound HTTPS and secure WebSocket access to Slack. No inbound port, public Request URL, tunnel, or production host is needed.

Slack's [user help page](https://slack.com/help/articles/33076000248851-Work-with-AI-agents-in-Slack) lists agents as available on all plans. Its [developer guide](https://docs.slack.dev/ai/developing-agents/) says some AI features require payment even when their settings are visible. Neither establishes that the exact native controls work in this workspace. If a feature demands payment, record the wording and stop that feature's setup path. Do not start a trial, upgrade, or substitute a full-featured sandbox.

Prepare the credential file before generating tokens. Use a location outside this project and outside any synced or shared folder. The default below is on your local computer:

```text
~/.config/pi-durable-agents/slack-free-plan-spike/credentials.env
```

Run these commands yourself in a local terminal. They contain no credentials. If this file already exists, preserve its contents and edit only this spike's entries.

```sh
umask 077
mkdir -p "$HOME/.config/pi-durable-agents/slack-free-plan-spike"
chmod 700 "$HOME/.config/pi-durable-agents/slack-free-plan-spike"
touch "$HOME/.config/pi-durable-agents/slack-free-plan-spike/credentials.env"
chmod 600 "$HOME/.config/pi-durable-agents/slack-free-plan-spike/credentials.env"
nano "$HOME/.config/pi-durable-agents/slack-free-plan-spike/credentials.env"
```

Use a local plain-text editor with cloud sync and AI context sharing disabled. In nano, save with Control+O, Return, then exit with Control+X. Paste secrets only into this file, never into a terminal command, browser address bar, chat, ticket, screenshot, or project file. Clear copied tokens from the clipboard after use. File permissions restrict other local accounts; they do not encrypt the file. [Slack credential security guidance](https://docs.slack.dev/concepts/security/)

Start with this template, then replace values as you complete setup:

```dotenv
SLACK_TEAM_ID=REPLACE_WITH_WORKSPACE_ID
SLACK_OWNER_USER_ID=REPLACE_WITH_OWNER_MEMBER_ID
SLACK_TEST_CHANNEL_ID=REPLACE_WITH_TEST_CHANNEL_ID
SLACK_TEST_CHANNEL_KIND=private
SLACK_AGENT_A_APP_ID=REPLACE_WITH_APP_A_ID
SLACK_AGENT_A_BOT_USER_ID=
SLACK_AGENT_A_APP_TOKEN=xapp-REPLACE_LOCALLY
SLACK_AGENT_A_BOT_TOKEN=xoxb-REPLACE_LOCALLY
SLACK_AGENT_B_APP_ID=REPLACE_WITH_APP_B_ID
SLACK_AGENT_B_BOT_USER_ID=
SLACK_AGENT_B_APP_TOKEN=xapp-REPLACE_LOCALLY
SLACK_AGENT_B_BOT_TOKEN=xoxb-REPLACE_LOCALLY
```

This is the proposed handoff format for a runner that has not been built yet. Use UTF-8 text, one `KEY=value` per line, no quotes, `export`, inline comments, or spaces around `=`. Each token must stay on one line. Bot user IDs may remain blank until the runner verifies them; all other placeholders must be replaced before connection. The later implementor should parse this as data, reject missing or placeholder values in required entries, and never execute it as a shell script or dump its contents.

## 2. Register the first app

1. In Firefox, open [Your Apps](https://api.slack.com/apps), choose **Create New App**, then **From scratch**.
2. Name it `Wayfinder Spike A`. Select the existing free workspace as its development workspace, then create the app. This selection does not create a new workspace or enable a trial.
3. On **Basic Information**, record its App ID in `SLACK_AGENT_A_APP_ID`. App IDs are nonsecret and normally start with `A`.
4. In **App Home**, set or confirm the bot display name, using `wayfinder-spike-a`. Give it a short description such as `Disposable free-plan interaction test A`. If the bot settings appear only after adding a bot scope, complete section 3 and return here.

Slack documents this browser-based registration flow separately from its CLI templates. No CLI installation or sample-agent deployment is necessary. [Create an app through App Settings](https://docs.slack.dev/tools/bolt-js/building-an-app/)

Use a separate registration for B later. Renaming A or overriding its posted display name does not create the second app identity this experiment requires.

## 3. Configure A's bot permissions

Open **OAuth & Permissions**, find **Scopes → Bot Token Scopes**, and use **Add an OAuth Scope**. Leave **User Token Scopes** empty.

The default setup uses one private test channel. Configure the following scopes for each bot:

| Bot scope | Why this setup needs it |
| --- | --- |
| `app_mentions:read` | Receive the owner's channel mention that starts a conversation. [Scope reference](https://docs.slack.dev/reference/scopes/app_mentions.read/) |
| `chat:write` | Post bot replies and DMs, and manage thread session status. [Posting messages](https://docs.slack.dev/reference/methods/chat.postMessage/), [session status](https://docs.slack.dev/reference/methods/agents.sessions.setStatus/) |
| `groups:history` | Receive ordinary messages in private channels the bot has joined, including follow-ups without a fresh mention. [Private-channel event](https://docs.slack.dev/reference/events/message.groups/) |
| `im:history` | Receive messages in the bot's own one-to-one conversations. [DM event](https://docs.slack.dev/reference/events/message.im/) |
| `im:write` | Let the later runner explicitly open or resume each bot's DM with the owner. [Opening DMs](https://docs.slack.dev/reference/methods/conversations.open/) |
| `assistant:write` | Required by the app's agent declaration for the native session test. Enable Agents in section 4; Slack adds this scope when declaring an agent. [Agent sessions](https://docs.slack.dev/ai/agent-sessions/) |

`im:write` is included because this guide has the runner discover the owner DM through `conversations.open`. It is optional if a later runner instead uses an already established, verified DM channel ID. Keep it for this setup so you do not have to send a message or discover that ID now.

If you deliberately choose a public test channel, replace `groups:history` with `channels:history`, use `message.channels` instead of `message.groups` below, and change `SLACK_TEST_CHANNEL_KIND` to `public`. Add both pairs only if you intend to test both channel types. [Public-channel event](https://docs.slack.dev/reference/events/message.channels/)

Do not add admin scopes, user tokens, workspace search, `chat:write.public`, `chat:write.customize`, channel-management scopes, or `mpim:*`. Manually inviting the bots and supplying IDs avoids discovery and membership-management permissions. History scopes are not restricted to a single thread: keep these disposable apps out of unrelated channels, and have the runner allowlist the test channel.

## 4. Enable agent mode and the Messages tab

1. Find **Agents** in the app settings sidebar and turn its feature toggle on. This is the documented current label. Older instructions may call it **Agents & AI Apps** or refer to assistants. If your UI differs, check the saved manifest and record the label you actually see.
2. Use the current Agent messaging experience for these new apps. If Slack asks for an agent description, use `Disposable canned-response test; no external services connected`.
3. Confirm `assistant:write` appears under Bot Token Scopes. Adding that scope alone is not a substitute for declaring the app as an agent.
4. In **App Home → Show Tabs**, enable **Messages Tab**. Enable the option labelled **Allow users to send Slash commands and messages from the messages tab**, if shown. This allows typing into the DM composer; it does not require creating a slash command.

Sources: [Agents toggle and messaging experience](https://docs.slack.dev/surfaces/split-view/), [App Home Messages](https://docs.slack.dev/surfaces/app-home/), [documented DM composer setting](https://docs.slack.dev/tools/python-slack-sdk/socket-mode/index.html).

If the UI is unclear, inspect **App Manifest** without replacing its entire contents. The relevant current settings are `features.agent_view` with an `agent_description`, `features.app_home.messages_tab_enabled: true`, and `features.app_home.messages_tab_read_only_enabled: false`. New apps use `agent_view`; Slack's manifest reference still contains older `assistant_view` examples elsewhere on the page. Follow its current field reference. Home-tab publishing, suggested prompts, code channels, and search features are unnecessary here. [Manifest field reference](https://docs.slack.dev/reference/app-manifest/#features)

If agent mode or its scope is missing, rejected, or paywalled, record which step failed and any redacted error. Stop the native-control path. You may complete ordinary bot configuration, but mark native setup blocked. Do not treat working ordinary messages as proof that agent controls are available.

## 5. Enable Socket Mode and save A's app token

1. Open **Socket Mode** and switch **Enable Socket Mode** on.
2. Follow Slack's token prompt, or open **Basic Information → App-Level Tokens** and choose its token-generation action.
3. Name the token `spike-a-socket`. Give it only `connections:write`.
4. Copy the generated `xapp-…` value directly into `SLACK_AGENT_A_APP_TOKEN` in your private local file. Save the file and close the token display before taking any screenshots.

This app-level token opens the socket. It does not replace the bot OAuth token used for message API calls. [Socket setup](https://docs.slack.dev/tools/python-slack-sdk/socket-mode/index.html), [connections:write](https://docs.slack.dev/reference/scopes/connections.write/), [token types](https://docs.slack.dev/authentication/tokens/)

## 6. Subscribe to events and enable buttons

Open **Event Subscriptions**, turn **Enable Events** on, and expand **Subscribe to bot events**. Add these exact subscription names:

| Subscription | Required bot scope | Purpose |
| --- | --- | --- |
| `app_mention` | `app_mentions:read` | Start a channel conversation addressed to this bot |
| `message.groups` | `groups:history` | Receive private-channel messages and thread follow-ups |
| `message.im` | `im:history` | Receive owner DM messages |
| `agent_session_stopped` | `chat:write` | Receive the native Stop action |

The event is singular `app_mention`; its scope is plural `app_mentions:read`. Mentions alone cannot deliver all the unmentioned thread replies or another agent's contributions needed by this experiment. DMs use `message.im`, even when they contain a mention. [Mention delivery](https://docs.slack.dev/reference/events/app_mention/), [private-channel delivery](https://docs.slack.dev/reference/events/message.groups/), [DM delivery](https://docs.slack.dev/reference/events/message.im/)

Save the subscriptions. For the public-channel variant, replace the private-channel event as described in section 3. If `agent_session_stopped` is unavailable, record that blocker; do not replace it with an unrelated assistant event and claim native setup is complete. Slack documents `chat:write` for the stop event. [Stop event reference](https://docs.slack.dev/reference/events/agent_session_stopped/)

The general agent guide also recommends `app_context_changed` and `agent_session_title_changed`. Those support wider context and title synchronization. They are not needed for this narrow channel-thread and fake-DM spike. Record any events Slack automatically adds, but do not add unrelated features merely to match a broad template. [General agent subscriptions](https://docs.slack.dev/ai/developing-agents/)

Open **Interactivity & Shortcuts**, switch **Interactivity** on, and save. This enables the later fake Approve and Reject buttons. `block_actions` is an interaction payload, not an event to add to the bot-event list. No extra OAuth scope is needed just to receive those button actions. [Interaction setup](https://docs.slack.dev/interactivity/handling-user-interaction/)

With Socket Mode enabled, events and interactive actions arrive over the socket. Leave public Request URLs unset. If Slack insists on one, recheck Socket Mode on this exact app before proceeding. Do not create a tunnel to work around it. [Socket Mode transport](https://docs.slack.dev/apis/events-api/using-socket-mode/)

## 7. Install A and save its bot token

1. Recheck A's bot scopes, agent declaration, event list, and interactivity setting.
2. On **OAuth & Permissions**, choose **Install to Workspace** or **Install to Team**, depending on the label shown.
3. Confirm the selected workspace and review the requested permissions, then allow installation. If it requires approval, wait for that process to finish.
4. Back on **OAuth & Permissions**, find **Bot User OAuth Token** or **Bot User OAuth Access Token**. Copy its `xoxb-…` value directly into `SLACK_AGENT_A_BOT_TOKEN` in the local file.

The bot token acts as this app's bot in this workspace. Do not copy a user token, signing secret, client secret, configuration token, or browser cookie. A Socket Mode runner using these two tokens does not need an HTTP signing secret. [App installation](https://docs.slack.dev/tools/bolt-python/getting-started), [token types](https://docs.slack.dev/authentication/tokens/)

After any subsequent scope change, reinstall or reauthorize the app through **OAuth & Permissions** so the installation receives the new permissions. Recheck the displayed bot token and update the private file if necessary. Merely adding a scope to the settings does not update an existing grant. [Reinstallation after configuration](https://docs.slack.dev/surfaces/app-home/)

Leave token rotation at its default for these disposable registrations. If workspace policy requires rotation, report that requirement before the runner is written; a fixed-token file is insufficient for a refresh flow. Do not disable a required policy. [Token rotation](https://docs.slack.dev/authentication/tokens/)

## 8. Repeat for a separate B app

Return to [Your Apps](https://api.slack.com/apps) and repeat sections 2 through 7 with these names and file entries:

| Item | App A | App B |
| --- | --- | --- |
| App name | `Wayfinder Spike A` | `Wayfinder Spike B` |
| Bot display name | `wayfinder-spike-a` | `wayfinder-spike-b` |
| Socket token label | `spike-a-socket` | `spike-b-socket` |
| App ID entry | `SLACK_AGENT_A_APP_ID` | `SLACK_AGENT_B_APP_ID` |
| App token entry | `SLACK_AGENT_A_APP_TOKEN` | `SLACK_AGENT_B_APP_TOKEN` |
| Bot token entry | `SLACK_AGENT_A_BOT_TOKEN` | `SLACK_AGENT_B_BOT_TOKEN` |

Both apps belong to the same free workspace. Each has its own App ID, bot identity, app token, and bot token. Configure the same selected channel type, scopes, and subscriptions on both. Never put A's token in a B entry.

## 9. Create the test channel and collect IDs

1. In Slack in Firefox, create a private channel named `agent-spike`. Keep it internal to this workspace and use only synthetic test content. The public-channel variant can use the same name with public visibility.
2. Open the channel details and find its **Integrations** or **Apps** section, then **Add apps**. Add both `Wayfinder Spike A` and `Wayfinder Spike B`. If Slack instead offers an app-profile **Add to channel** action, use that while signed in as the owner. Confirm both apps appear in the channel's apps or membership details. Installing an app does not establish membership in this channel. [Adding apps to channels](https://slack.com/help/articles/360001537467)
3. Open your profile, choose **More → Copy member ID**, and put it in `SLACK_OWNER_USER_ID`. Use your own human member ID, not a bot's. [Copying a member ID](https://slack.com/help/articles/360003827751-Create-a-link-to-a-members-profile)
4. Copy the channel ID from channel details if shown. Alternatively, open that channel in Firefox and inspect its address. An address shaped like `https://app.slack.com/client/T…/C…` identifies the workspace with the first segment and the channel with the second. Record the actual IDs, not the example prefixes or channel name. Private-channel IDs may start with `C` or `G`; do not infer visibility from the prefix.
5. Put the workspace ID in `SLACK_TEAM_ID` and the channel ID in `SLACK_TEST_CHANNEL_ID`. If Slack's current URL does not expose an unambiguous ID, record the workspace/channel link as pending information instead of guessing. The later runner must verify IDs before messaging.
6. Find each app in Slack and open its **Messages** view. Check whether a composer is available. You do not need to send anything now. With agent mode enabled, the current Messages view may include a thread timeline.

App IDs, workspace IDs, channel IDs, and user IDs are identifiers, not credentials. Bot user IDs are different from App IDs and from `B…` bot IDs. If the bot profile exposes **Copy member ID**, record that in the matching `BOT_USER_ID` entry. Otherwise leave it blank. The authorized runner can use `auth.test` with each bot token to obtain and verify its `user_id`, `bot_id`, and `team_id` without extra scopes. [Authentication and identity check](https://docs.slack.dev/reference/methods/auth.test/)

The runner will open each owner DM with `conversations.open`, passing only the owner's member ID, then retain the returned `D…` channel ID. You do not need to supply DM IDs with this setup. [DM creation and reuse](https://docs.slack.dev/reference/methods/conversations.open/)

## 10. Report readiness without sharing credentials

Share only the following in the planning chat. Replace these placeholders with nonsecret information, and include any blocked step:

```text
Plan: Free, no trial; checked YYYY-MM-DD
Workspace ID: T...
Owner member ID: U...
Test channel ID and visibility: ... / private
App A name and App ID: Wayfinder Spike A / A...
App B name and App ID: Wayfinder Spike B / A...
Both apps installed and invited: yes / blocked at ...
Agents enabled on both: yes / blocked at ...
Stop event saved on both: yes / unavailable on ...
Socket Mode, interactivity, and Messages enabled: yes / differences ...
Credentials stored locally: yes
Credential file absolute path: /Users/mark/.config/pi-durable-agents/slack-free-plan-spike/credentials.env
Native Working/Stop: not tested
```

Adjust the path if you used another local account or computer. Share the path, never the file contents. Do not attach the file or screenshots of token panels. Later authorization should let the runner process read this file directly; it should not ask the coding agent to display it, run `cat` on it, or copy its contents into prompts. Never use shell tracing or log request authorization headers. If a credential is available only through 1Password, stop and arrange another explicitly authorized handoff; this guide grants no vault access.

### Setup completion checklist

- [ ] The workspace is genuinely Free with no paid trial.
- [ ] Two separate apps are installed in that workspace.
- [ ] Each has the intended bot scopes and saved event subscriptions.
- [ ] Each has Socket Mode, interactivity, and a usable Messages composer enabled.
- [ ] Each is declared as an agent and subscribes to `agent_session_stopped`, or its precise blocker is recorded.
- [ ] Both bots belong to the selected test channel; only the owner is the human test participant.
- [ ] Four tokens are stored under the correct A/B keys in the local file, with directory mode `700` and file mode `600`.
- [ ] Nonsecret routing IDs are recorded or clearly marked pending verification.
- [ ] No secret was shared in chat, documentation, screenshots, or source control.

Completing this list means the apps are prepared. It does not mean the spike passed. Before a runner exists, silent mentions, absent replies, no fake DM notification, no approval buttons, and no Working/Stop display are normal. App registration alone cannot execute a response. A bot's online dot is not evidence of a connected, functioning runner. Send fresh test messages after the authorized runner connects; do not rely on messages sent while it was absent being replayed.

## What the later runner must verify

These are implementation and observation requirements for the disposable spike, not steps for you to perform now:

- Verify the two bot identities and workspace, connect both Socket Mode clients, and acknowledge incoming envelopes. Reject traffic outside the selected workspace/channel and owner DMs. Accept human commands and button decisions only from the configured owner. [Socket handling](https://docs.slack.dev/apis/events-api/using-socket-mode/)
- Receive the owner's channel mention, respond beneath its root message, and receive ordinary replies in that thread. Allow the other invited bot to contribute and respond there. Filter self-echoes and duplicates without discarding all messages from the other test bot. SDK bot-message filtering must be checked.
- Enforce six combined conversational agent replies per thread between owner messages. The opening owner message supplies the budget; an owner reply in that thread resets it. Agent messages, other threads, unrelated channel messages, timers, and DMs never reset it. A remaining budget does not require a reply.
- Call `agents.sessions.setStatus` with the test `channel_id`, root `thread_ts`, and `status: processing` for a cancellable fake job. Observe the native Working display and Stop control in Firefox. A successful API response alone is insufficient. Record both `status` and `agent_status` when testing two working agents; Slack distinguishes session-level state from the calling agent's state. [Status method](https://docs.slack.dev/reference/methods/agents.sessions.setStatus/)
- Click native Stop during one job and then during two simultaneous jobs. Record which apps receive `agent_session_stopped`, the affected thread, whether fake work actually stops, and whether later output is suppressed. The runner must update status away from processing. Do not infer multi-agent cancellation scope from a single-agent test. [Stop behavior](https://docs.slack.dev/reference/events/agent_session_stopped/)
- Send each bot's synthetic notification and fake calendar proposal by owner DM. Verify Approve and Reject payloads and owner checks. These buttons must never call a calendar service. [Interaction handling](https://docs.slack.dev/interactivity/handling-user-interaction/)

Record each interaction as observed working, observed unavailable with an identified cause, or unresolved. Keep the plan evidence, API/SDK versions, redacted errors, and relevant UI observations. Optional streaming is a separate test; it is not required to create a session. Native controls remain unverified until this observable run occurs. [Session lifecycle](https://docs.slack.dev/ai/agent-sessions/)

## Troubleshooting

| Symptom | Check or action |
| --- | --- |
| App installation is refused | Confirm the correct workspace, remaining app slots, and approval requirements. Stop rather than upgrade or remove unrelated apps automatically. |
| Agent mode or native feature requests a paid plan | Record the wording and stop that feature path. Report the entitlement blocker. |
| Settings ask for a public Request URL | Confirm Socket Mode is enabled on the app you are editing. No public endpoint is part of this setup. |
| Mentions work later, but ordinary thread replies do not | Check the selected `message.groups` or `message.channels` subscription, matching history scope, bot membership, and runner routing. Mentions alone are insufficient. |
| The second bot never responds to the first | Check its channel-message subscription and the runner's SDK filters, self-echo handling, and shared reply budget. Do not add user impersonation or search scopes. |
| Messages composer is disabled | Check App Home Messages and its send-messages option, then reload the Slack tab in Firefox. Record any agent-mode UI difference. |
| A newly added scope still yields `missing_scope` later | Reauthorize that app and verify the runner loaded the token for the updated installation. |
| Runner reports authentication failure | Check the A/B mapping and token type locally, and whether the token was revoked or expired. Share only the error name and app label. |
| Working appears but Stop does not | Check `agent_session_stopped` on that app. Slack documents the warning `missing_agent_session_stopped_event_subscription`. Record the response and UI; correct subscription does not itself prove entitlement. |
| Stop arrives but work continues | This is a runner cancellation failure. Hiding a loading indicator is not proof the fake job stopped. |
| No replies before the runner is built | Expected. Finish setup and report readiness. |

If settings and grants are correct but a native feature remains absent, distinguish a plan restriction, client behavior, rollout uncertainty, and an API error in the report. Do not label every failure a free-plan limitation. A custom status/Cancel button can be proposed after the findings; it must not silently replace the native feature under test.

## Cleanup after the spike

1. Stop both local Socket Mode connections and fake jobs.
2. Keep only the redacted evidence needed for the connector decision.
3. In each app's **Basic Information → App-Level Tokens**, revoke its disposable socket token. Remove each app from the workspace through app management, and delete the disposable app registrations when no longer needed. Confirm you are selecting Spike A and Spike B. [Token management](https://docs.slack.dev/authentication/tokens/), [removing apps](https://slack.com/help/articles/360003125231-Remove-apps-and-custom-integrations-from-your-workspace)
4. Remove the local credential file and any editor backup copies containing tokens. Deleting a local file alone does not revoke a token; revoke credentials first. If a token was exposed, revoke it immediately and generate a replacement only if the experiment is continuing.
5. Archive or remove the disposable test channel when its evidence is no longer needed. Do not remove unrelated apps or conversations.

No Slack workspace inspection, app registration, installation, token access, message sending, runner execution, or production access was performed to write this guide. The checks behind it were project-document review and official-source research. Free-plan native-control entitlement and actual multi-agent Stop behavior remain unresolved.
