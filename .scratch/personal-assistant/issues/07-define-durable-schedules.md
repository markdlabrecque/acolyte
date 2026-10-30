# Define reminder and background-check semantics

ID: 07
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:grilling
Type: grilling
Status: resolved
Assignee: mark
Blocked by: none

## Question

What are the owner-visible rules for reminder times, timezone changes, daylight-saving transitions, recurring reminders, rescheduling/cancellation, missed reminders after downtime, and background-check cadence? Decide acceptable lateness and catch-up behavior for reminders and email/calendar checks. Choose semantics before selecting a scheduler; no reminder may silently disappear on restart.

## Answer

### Confirmed decisions, 2026-10-25

The owner approved these three proposals in the live voice discussion:

- After downtime, deliver overdue reminders together in one catch-up notification, showing their original due times.
- Reminder times use America/Vancouver. Support for other timezones and travel-based timezone changes is out of scope, per the final scope clarification below.
- Target email and calendar background checks every five minutes initially, subject to provider limits. This is a product target, not a verified provider capability.

Resolved through live owner confirmations and the personal-use scope clarification below. These are planning decisions, not live schedules.

### Recurrence, recovery, and quiet hours

The owner approved the next three proposals, correcting the assumption that Vancouver still has seasonal clock changes:

- Recurring reminders stay at their Vancouver local clock time. Summarize missed occurrences once, then resume the normal schedule.
- After downtime, run one fresh email/calendar check and send a single catch-up digest instead of replaying each missed digest. Existing quiet-hour and urgent-alert rules still apply.
- At 8 a.m. Vancouver time, reassess alerts held during quiet hours. Send anything still urgent and include the rest in the 9 a.m. digest.

### Vancouver timezone correction

The owner noted that B.C. no longer changes clocks seasonally. The provincial announcement confirms Vancouver remains at UTC-07:00 year-round, with no fall-back on November 1, 2026. Source: [B.C. government announcement](https://archive.news.gov.bc.ca/releases/news_releases_2024-2028/2026CITZ0009-001073.htm).

Retain America/Vancouver as the default timezone identity and require current timezone data reflecting this rule. Vancouver reminders, digests, and quiet hours must not shift in November. Other timezone support and seasonal clock-transition edge cases are out of scope. Verify the runtime timezone data during implementation; this note does not claim it has been tested.


### Delivery target and reminder changes

The owner approved these proposals in the live voice discussion:

- While the system is healthy, target reminder delivery within one minute of the due time. This is a desired service target, not a measured guarantee.
- Cancellation or rescheduling takes effect immediately.
- For recurring reminders, an explicit request to cancel this one affects only that occurrence. Ask for clarification when the intended scope is ambiguous.

### Final personal-use scope clarification

The owner confirmed this is a personal tool for their own use and declined further timezone edge-case design. Use Vancouver time throughout scheduling; other timezone selection, travel-based changes, and seasonal transition ambiguity handling are outside this planning scope. This supersedes the earlier proposal to support explicitly requested alternate timezones. No further reminder decisions remain open within this scope.
