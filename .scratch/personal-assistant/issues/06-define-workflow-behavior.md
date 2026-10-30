# Define todo, calendar, and email behavior

ID: 06
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:grilling
Type: grilling
Status: resolved
Assignee: mark
Blocked by: 01

## Question

What concrete behaviors make each required workflow useful at launch? Set task fields and completion behavior, calendar watch conditions and supported mutations, email importance criteria, information retrieval scope, and draft creation behavior. Decide notification frequency, quiet hours, context exclusions, and handling of ambiguous instructions. Reads/searches/local task updates/reminders are permitted within configured scopes; calendar mutations require approval. Email reading and draft creation are selected capabilities, with sending prohibited. The owner sends manually. Define draft creation triggers and any approval requirements without implicitly granting draft editing/deletion or other mailbox mutations.

## Dependencies

- [Choose email, calendar, and todo services](01-choose-connected-services.md)

## Answer

### Confirmed decisions, 2026-10-23

The owner confirmed these todo behaviors in the live voice conversation:

- A todo has a title, optional notes, an optional due date, and an open or completed status.
- Completing a todo retains it in history.
- A due date does not itself trigger a notification. A notification requires an explicitly requested reminder.

This was a partial resolution; subsequent confirmations are recorded below.


### Confirmed decisions, 2026-10-24

The owner approved all seven workflow proposals, changing the digest schedule to three times daily:

- Watch selected calendars for new invitations, changed or cancelled events, and scheduling conflicts.
- Support creating, rescheduling, and cancelling calendar events. Each mutation requires approval of the exact proposed change.
- Flag email requesting the owner's action, containing deadlines, or coming from senders the owner explicitly prioritizes. Flagging means identifying findings for notification, not changing mailbox flags or labels.
- Search all folders in personal Gmail and Proton except spam and trash. Read relevant message bodies when answering.
- Create email drafts only on the owner's request, without a second approval step. Sending remains prohibited; draft editing/deletion and other mailbox mutations remain unauthorized.
- Batch background findings into digests at 9 a.m., noon, and 3 p.m. in America/Vancouver, daily. Explicitly requested reminders are delivered at their requested times. These are product requirements, not live schedules created during planning.
- Exclude work email and unselected calendars from context. Ask for clarification when ambiguity could change an action's target, timing, or meaning.

Background findings include non-immediate requests for email replies, upcoming bills or renewals, meeting changes, scheduling conflicts, and messages from prioritized senders.

### Urgent alerts and quiet hours

The owner approved immediate alerts for calendar changes affecting the next hour or email deadlines before the next digest. These alerts bypass the digest except during quiet hours from 9 p.m. to 8 a.m. in America/Vancouver. Explicitly requested reminders still arrive at their requested times.

Resolved through the owner's live confirmations. Reminder timing, catch-up behavior, handling findings deferred during quiet hours, and background-check cadence belong to [Define reminder and background-check semantics](07-define-durable-schedules.md).
