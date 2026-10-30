# Slack on the owner's free workspace

## Subsequent spike completion, 27 October 2026

The documentation-only findings below predate the live spikes. Slack, Google, and Proton spikes are now complete and closed. Retained runner evidence and owner observations are supplemented by the owner's confirmation that recovered evidence establishes all previously unrecorded in-scope tests passed. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md). Older statements below about tests not run or open research describe the original research date, not current spike status. Production adapter/security/runtime acceptance remains implementation work; this update does not invent primary-source guarantees.

Checked 2026-10-23 against official Slack documentation. This is documentation research, not a workspace test. No apps were installed, credentials inspected, or Slack messages sent. The folder has no Git repository or remote, so this evidence is retained locally.

The required integration is supported in principle. I recommend a custom Slack app using Socket Mode, one bot identity per configured agent, and owner-only direct messages. This is a proposed design for the next decision ticket, not a newly accepted product decision.

## Free-plan limits and installation

Free workspaces permit ten third-party or custom apps in total. Messages and files are visible/searchable for 90 days; owners can choose deletion after 90 days or retention up to one year. Data older than a year is deleted. Slack also restricts high-volume messaging without publishing a fixed free-workspace spam threshold. The assistant's durable records therefore need their own retention and backup policy. [Free workspace limits](https://slack.com/help/articles/115002422943-Usage-limits-for-free-workspaces)

By default, members can install apps. Workspace Owners can require app approval or restrict apps, so membership alone does not establish installation authority. Changes to requested scopes can require reauthorization. Check the owner's actual workspace role and app policy before provisioning. [Installing apps](https://slack.com/help/articles/202035138-Add-apps-to-your-Slack-workspace)

Slack's manifest configures a single `features.bot_user` object, including its display name. Separate app definitions/installations are the straightforward supported design for distinct agent bot identities. This is an inference from the manifest model, not a claim that changing a message's display name creates another bot account. Reserve two available app slots for the required two-agent acceptance test. [App manifest](https://docs.slack.dev/reference/app-manifest/)

## Ingress and credentials

Socket Mode carries Events API and interactive payloads over a preauthenticated WebSocket. It replaces the public request URL, uses an app-level token, requires acknowledging each `envelope_id`, and needs connection refresh/reconnection handling. Socket acknowledgement is transport receipt, not proof the agent finished. [Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode/)

The app token needs `connections:write` to open the socket. Keep it distinct from the bot token used for Web API calls. [Connection scope](https://docs.slack.dev/reference/scopes/connections.write/), [token types](https://docs.slack.dev/authentication/tokens/)

HTTP delivery instead needs a public endpoint. Slack describes short-lived HTTP connections as inherently more reliable than long-lived sockets. Socket Mode is still the simpler proposed starting point for one Linux host without public ingress. [Transport comparison](https://docs.slack.dev/apis/events-api/comparing-http-socket-mode/)

If HTTP is selected, verify Slack's signature against the raw request body using the signing secret and reject stale timestamps to resist replay. Transport authentication never replaces the application's owner and route authorization. [Request verification](https://docs.slack.dev/authentication/verifying-requests-from-slack/)

## Minimal proposed permissions and interaction

- Subscribe to `message.im` with bot scope `im:history`. Payloads include workspace, app, sender, channel, message timestamp, and event ID. Accept only the configured owner in that bot's DM; filter bot messages and decide how edits/deletions are handled. The owner filter is an application requirement, not a Slack scope. [DM event](https://docs.slack.dev/reference/events/message.im/)
- Use `chat:write` for durable messages, replies, and notifications. `chat.postMessage` supports the user's App Home/DM and returns the posted message's channel and timestamp. This supports proactive delivery without waiting for a new user interaction. [Posting messages](https://docs.slack.dev/reference/methods/chat.postMessage/)
- If explicitly opening/resuming the DM, add `im:write` and call `conversations.open` with the owner's user ID; subsequent calls with the same participants reuse the conversation. This is optional if an established DM ID is provisioned. [Opening DMs](https://docs.slack.dev/reference/methods/conversations.open/)
- Enable message interactions for approval buttons. `block_actions` identifies the user, workspace, app, container, and selected action. Validate all against a stored pending approval. A button value should reference the exact persisted action digest; duplicate clicks and expired or replaced approvals must be harmless. These checks are proposed application behavior. [Interaction payload](https://docs.slack.dev/reference/interaction-payloads/block_actions-payload/)

Use ordinary bot DMs for pending approvals and reminder notices. Ephemeral delivery requires an active user and does not persist across sessions or reloads, making it unsuitable for required reminders or recoverable approvals. [Ephemeral messages](https://docs.slack.dev/reference/methods/chat.postEphemeral/)

Interactive requests need acknowledgement within three seconds. A `response_url` allows five responses within 30 minutes; later replies need the normal publishing API. It can bypass channel posting permissions, so it should not become an arbitrary durable outbound route. Persist the approval decision before acknowledging its acceptance, and continue execution asynchronously. [Handling interactions](https://docs.slack.dev/interactivity/handling-user-interaction/)

DM delivery does not decide how much email/calendar content is appropriate to send to Slack. Redaction, notification previews, and approval expiry remain owner decisions. No premium Slack AI feature is needed by this proposed ordinary bot-message design.

## Durable admission and outages

HTTP Events API delivery expects a 2xx within three seconds and retries failures up to three times, approximately immediately, after one minute, and after five minutes. Current docs also describe an optional Delayed Events setting adding hourly retries for 24 hours. Slack explicitly calls delivery best-effort; default delivery can omit events over two hours late. Do not infer a durable queue for arbitrary host downtime, or assume the documented HTTP retry timetable is a Socket Mode contract. [Events API](https://docs.slack.dev/apis/events-api/)

Proposed admission contract: authenticate and authorize, atomically store the normalized input and deduplication record, then acknowledge the envelope. Deduplicate Events API payloads using event ID with workspace/app/agent routing identity. Keep separate identities for repeated approval actions and use an atomic pending-to-decided transition. Prove the chosen SDK does not auto-ack before durable admission. The documented envelope acknowledgement is not an application transaction. [Socket Mode acknowledgement](https://docs.slack.dev/apis/events-api/using-socket-mode/), [Events API envelope](https://docs.slack.dev/apis/events-api/)

A visible Slack message is not an assistant acceptance receipt. Decide how the owner recognizes an accepted request and how missed input after downtime is recovered. Recent DM history may help backfill, but history access is limited by scopes and membership and cannot prove that every event was received. [Conversation history](https://docs.slack.dev/reference/methods/conversations.history/)

## Outbound uncertainty and rate limits

`chat.postMessage` documents `internal_error` and `fatal_error` outcomes where part of the operation may already have succeeded. Its reference mentions `client_msg_id` in duplicate-related errors but provides no complete durable idempotency contract or retention window on which to base exactly-once delivery. A timeout or crash after dispatch can therefore leave delivery uncertain. [Posting messages](https://docs.slack.dev/reference/methods/chat.postMessage/)

Proposed behavior: persist a local delivery ID and message before dispatch, record the returned channel/timestamp, and distinguish definite rejection from ambiguous outcome. Search/reconciliation may establish positive delivery evidence; failure to find a message does not prove non-delivery. Keep uncertain delivery visible and require a specified reconciliation policy. Do not silently inherit SDK retries for ambiguous posting errors. These are consequences of the PRD recovery requirement, not extra Slack guarantees.

Slack generally permits one posted message per second per channel, plus workspace limits; bursts are not a stable contract. Web API throttling returns HTTP 429 with `Retry-After`. Persist retry timing and queue state, coalesce notification bursts, and avoid token-by-token message posting. [Rate limits](https://docs.slack.dev/apis/web-api/rate-limits/)

The tighter history/replies limits for commercially distributed apps outside the Marketplace do not apply to internal customer-built applications. The personal app should be classified as internal; recheck if distribution changes. This exemption does not remove ordinary API limits or free-plan history limits. [Rate-limit change clarification](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/)

## Follow-up decisions and evidence

These questions remain unresolved; closing the factual research ticket does not close them.

1. Approve Socket Mode, owner-only DMs, and one custom app per agent? Specify allowed channels if DMs are insufficient.
2. What content may email/calendar notifications expose in Slack, including previews, and how long may approvals remain actionable?
3. How should a missed reminder or uncertain outbound message behave: owner reconciliation, a labelled possible duplicate, or another explicitly accepted policy? Which outages must automatic input recovery cover?
4. Can the owner install custom apps, and are two slots available? Confirm workspace ID, owner user ID, app-management policy, retention settings, and outbound WebSocket access without assuming admin privileges.
5. In an authorized development workspace test, prove DM receipt, unauthorized-user rejection, two distinct bot identities, approval persistence across restart, duplicate-click rejection, reconnection, and durable admission before acknowledgement. Check whether Delayed Events is available and what it does for the chosen Socket Mode setup.
6. Inject crashes before acknowledgement and after remote message acceptance but before local result commit. Capture the SDK's actual retry behavior, 429 handling, and limits of history-based reconciliation. Confirm desktop/mobile notification behavior under the owner's settings; posting success is not evidence the owner saw a notification.

No live tests, provisioning, or unresolved preference decisions were performed in this research session.
