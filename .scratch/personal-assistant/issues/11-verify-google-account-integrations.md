# Verify personal Gmail and Google Calendar integration

ID: 11
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:research
Type: research
Status: closed
Disposition: deferred-to-spike
Assignee: mark
Blocked by: none

## Question

What supported integration and authorization contracts allow this Linux assistant to read, search, monitor, and create drafts in personal Gmail while using the same personal Google account for Google Calendar? Establish minimum scopes, service-specific authorization, unattended authorization renewal, personal-account OAuth restrictions, polling or notification options, quotas, and recovery behavior from primary sources. Work email and work calendars are outside scope. Calendar mutations require owner approval initially; email sending is prohibited. Verify adapter enforcement of draft-only writes despite Gmail's broader OAuth scope, including blocked bypass paths. Identify facts requiring owner verification and isolated tests, without accessing accounts, obtaining credentials, or changing services. Initial scope evidence is in [email draft permissions](../research/email-draft-permissions.md); the wider research remains open.

## Current evidence, 2026-10-27

The linked [Google spike](17-spike-google-integration-and-reconciliation.md) is complete and closed, with all in-scope tests passed. Retained live read/draft/Calendar/reconciliation results and owner UI confirmations are supplemented by the owner's report of recovered evidence for the remaining tests. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md). No evidence-recapture task remains. The original deferral below is historical.

## Closure, 2026-10-25

Closed for current mapping at the owner's request. Remaining exploration is transferred to the [deferred spike](17-spike-google-integration-and-reconciliation.md), labelled `spike` and excluded from the current mapping frontier. Existing decisions and evidence remain valid; closure does not mean the deferred questions were answered or experiments passed.
