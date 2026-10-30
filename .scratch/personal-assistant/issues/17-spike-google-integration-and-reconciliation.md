# Spike: Verify Gmail and Google Calendar integration and reconciliation

ID: 17
Parent: [Verify personal Gmail and Google Calendar integration](11-verify-google-account-integrations.md)
Related: [Authorization and uncertain-action reconciliation](08-define-authorization-and-reconciliation.md)
Labels: wayfinder:research, spike
Type: research
Status: closed
Disposition: completed; all in-scope tests passed, including owner-confirmed recovered evidence
Assignee: none
Blocked by: none

## Mapping status

Completed and closed on 2026-10-27. The owner reports finding the remaining spike evidence and explicitly confirms all previously unrecorded in-scope tests passed. This supersedes earlier missing-evidence/open-status assessments. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md) records owner-confirmed passes separately from retained runner evidence. No further Google spike tests or human observations are required.

Historical results below remain unchanged in substance. Missing artifact paths, exact version values, durations, and detailed observations are not invented. Previously excluded lock/suspend tests remain excluded. Production framework acceptance and unresolved product-policy choices remain specification/implementation work. No new live tests, cleanup, credential revocation, or permissions are implied by closure.

## New observed results, 2026-10-27

Following explicit owner authorization, the existing runner passed local validation, refreshed/verified the configured personal account for each service, read three matching Gmail fixtures, and read zero upcoming events from the dedicated test calendar. One recipient-free unsent synthetic draft was applied and verified, then verified again from a fresh process. [Commands and retained results](../../../docs/evidence/live-checks-2026-10-27.md). The owner confirmed the Gmail draft is visible, editable, and unsent, then approved the exact planned Calendar event. It was applied once and verified immediately and again from a fresh process. The owner subsequently confirmed seeing the event in the Calendar UI. No further human check remains for this normal-operation batch; recovery and longevity limits remain unchanged. The subsequent owner confirmation records remaining in-scope lost-response/crash recovery and authorization longevity tests as passed from recovered evidence. The earlier zero-row journal observation below is historical, before this authorized draft creation.

## Observed progress

Historical pre-recapture audit below. Its missing-result/open-research statements are superseded by the later live checks and the owner's final all-tests-pass confirmation; they are not remaining tasks.

The owner resumed local setup and testing after the original deferral. These results are owner-reported through the conversation; no raw command output or independent live run was captured for this update.

- OAuth consent completed for Gmail and Google Calendar on the same personal Google account, using separate service token files.
- Local `google_spike.py check` passed after replacing the account-style Calendar ID with the dedicated Agent Spike secondary-calendar ID. This check is local only and is not evidence of API access.
- The Calendar read check passed against the newly created, empty Agent Spike calendar. Zero events is a valid successful result. The runner's successful Calendar read path includes token refresh, account identity verification, and an event-list request restricted to the configured calendar.
- The helper and runner's 18 offline tests passed again on 2026-10-27 as part of a 68-test combined regression run. The [retained output](../../../docs/evidence/offline-regression-2026-10-27.txt) includes simulated lost write responses, not Google's live write or recovery behavior.

Gmail fixture reading/search, draft creation, calendar writes, live uncertain-write reconciliation, duplicate cleanup, polling, quotas, production credential isolation, and long-term unattended authorization remain unverified. No pass is inferred for Gmail reads from the owner's Calendar result. Reading an empty calendar also does not verify event contents or mutation permissions. Closure does not supply the missing per-test results. A read-only query of the discovered Google action journal on 2026-10-27 found zero action rows; read commands are not journalled and operations elsewhere cannot be excluded. Do not infer tests never happened. Exact calendar writes still require owner approval and sending remains prohibited.

Local runner and commands: `~/Projects/pi-agent-spikes/google_spike.py` and `~/Projects/pi-agent-spikes/GOOGLE-SPIKE.md`.

## Question

What supported integration and authorization contracts allow this Linux assistant to read, search, monitor, and create drafts in personal Gmail while using the same personal Google account for Google Calendar? Establish minimum scopes, service-specific authorization, unattended authorization renewal, personal-account OAuth restrictions, polling or notification options, quotas, and recovery behavior from primary sources. Work email and work calendars are outside scope. Calendar mutations follow the confirmed approval and proven-duplicate cleanup rules; email sending is prohibited. Verify adapter enforcement of draft-only writes despite Gmail's broader OAuth scope, including blocked bypass paths. Identify facts requiring owner verification and isolated tests, without accessing accounts, obtaining credentials, or changing services. Initial scope evidence is in [email draft permissions](../research/email-draft-permissions.md); the wider research remains open.

## Reconciliation questions transferred from authorization planning

- Which responses and follow-up lookups prove a Calendar event or Gmail draft was saved, definitely failed, or remains uncertain after a timeout or cancellation?
- Which identifiers or durable action records prove that two Calendar events were created by the assistant from the same approved action, permitting automatic duplicate cleanup? Similar event details alone are insufficient.
- What limitations, consistency delays, and retry behavior must the adapters account for while following the [confirmed authorization rules](08-define-authorization-and-reconciliation.md#answer), including at most two retries and no blind retries of uncertain writes?

## Completion evidence

Record primary-source findings and identify isolated tests still needed. Distinguish documented guarantees from observed behavior. Use the same personal Google account for Gmail and Calendar, with service-specific scopes and separate token files; work email, work calendars, and email sending remain excluded. DeepSeek V4 Flash through DeepInfra is already selected for inference and is not a question for this spike.
