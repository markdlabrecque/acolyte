# Slack Spike B app configuration handoff

## Focus

Finish the test Slack app B configuration, then rerun its missing Socket Mode checks. The disposable spike is at `/home/mark/.config/pi-durable-agents/spikes/slack/spike.mjs`; run it with `npm start` from that directory. The process is currently stopped. This directory is not a Git repository.

## What was verified

- Both bot identities matched the configured workspace; both Socket Mode connections opened.
- Both bots replied in the configured test channel and sent notification DMs to the owner.
- Both replied to a new top-level message mentioning both. One message requested eight canned replies; the shared counter posted six and suppressed two. This verified the shared six-reply cap.
- A's native Working/Stop worked after the spike routed a stop event received on B's socket to A's sole active job. A's Approve button updated its card.
- Two simultaneous jobs entered `processing`; stopping A left B in `processing`, as expected.

## B blockers observed

- `agents.sessions.setStatus(processing)` for B returned the warning `missing_agent_session_stopped_event_subscription`. Slack showed B as Working but explicitly said Stop was unavailable for this agent.
- B's Reject button showed Slack's error icon. No button action reached the spike; its card was manually updated to remove the unusable buttons. A's corresponding button worked.
- B received a top-level mention but missed messages mentioning it inside an existing channel thread. A received those thread messages. Check B's event subscriptions and thread delivery.
- A's Stop event sometimes arrived on B's Socket Mode connection. The spike has a fallback for exactly one active job in the thread. Do not assume B's own Stop works from that observation.

## Next actions

1. Inspect B's Slack app settings. Enable **Interactivity & Shortcuts** for its Block Kit buttons, and subscribe its bot to `agent_session_stopped`. Compare B's event subscriptions with A's for channel thread messages and mentions. Socket Mode is already enabled.
2. Reinstall or reauthorize B if Slack says the changed scopes or event subscriptions require it. The current credentials file has app and bot tokens; never print its values or put them in logs/model context. Do not use 1Password.
3. Restart the spike. Limit live interactions to the configured test channel and owner DMs. Ask the owner to click a fresh B Reject card and B's native Stop during a fake B job. Confirm the action/event arrives, the card changes, the timer cancels, and B returns to `active`.
4. In a shared channel thread, ask the owner to mention B and verify B replies there. Repeat the shared six-reply check only if event handling changes affect it.
5. Stop the process cleanly so no fake job or `processing` status remains. Report the observed results and any remaining blockers.

Slack references: [Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode/), [agent sessions](https://docs.slack.dev/ai/agent-sessions/), [interactive components](https://docs.slack.dev/tools/java-slack-sdk/guides/interactive-components/).

## Suggested skills

- `diagnosing-bugs`: trace B's missing event and button delivery through app settings, Socket Mode, and the spike's logs.
- `wizard`: use only if configuration requires user-only steps in Slack's app dashboard.
