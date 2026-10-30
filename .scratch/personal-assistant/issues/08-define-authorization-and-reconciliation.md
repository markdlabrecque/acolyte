# Define authorization and uncertain-action reconciliation

ID: 08
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:grilling
Type: grilling
Status: closed
Disposition: decisions-recorded-research-deferred
Assignee: mark
Blocked by: none

## Integration completion update, 2026-10-27

Slack, Google, and Proton integration spikes are complete and closed. The owner found the remaining evidence and explicitly confirms all previously unrecorded in-scope tests passed. [Completion ledger](../../../docs/evidence/integration-spike-ledger.md). Earlier deferred/unverified language below is historical, not an outstanding test requirement. Existing confirmed policies remain unchanged; genuinely unresolved product choices belong to specification synthesis, and production acceptance belongs to implementation.

## Question

How do configured scopes, recorded approvals, current revocations, and remote effect contracts interact for the selected workflows? Define exact-action approval binding and expiry, OAuth/account separation, cancellation races, and owner reconciliation choices. Specify what evidence permits marking an action complete or retryable and how uncertain Slack delivery is handled. Identify the provider-specific facts still needed before closing this ticket.

## Confirmed email boundary

Email sending is prohibited, not approvable. Reading/search and draft creation are separate allowed capabilities. Keep credentials inside a trusted adapter and block generic bypass paths. Gmail's draft scope also grants sending; deny send operations in the adapter. Proton draft creation uses IMAP; deny SMTP access to the agent and mail adapter. Check uncertain draft creation before retrying to avoid duplicate drafts. Editing/deletion and other mailbox mutations remain ungranted. See [email draft permission evidence](../research/email-draft-permissions.md).

## Dependencies

- [Define Slack conversations and approval interactions](05-define-slack-interactions.md)
- [Define todo, calendar, and email behavior](06-define-workflow-behavior.md)

## Answer

### Confirmed decisions, 2026-10-25

The owner confirmed these rules in the voice discussion and subsequent text exchange. They are planning requirements, not implemented or tested behavior.

- After a calendar save, check for duplicates. The assistant may automatically remove a duplicate only when it can prove it created it from the same approved action. This is a narrow exception to per-action calendar approval. Similar event details alone are not proof.
- If a possible duplicate cannot be proven to come from that same approved action, leave the events untouched and ask the owner before removing either.
- If the event changes while approval is pending, show the updated proposal and obtain fresh approval. Existing approval requests have no time-based expiry, as recorded in the Slack interaction ticket.
- If the owner cancels a request after its calendar change has completed, explain what happened and obtain approval before undoing it.
- If a calendar save remains uncertain after checking, pause and ask the owner before trying again. Uncertainty is not evidence that the save failed.
- If the provider confirms that nothing was saved, automatically retry the exact approved change only while the target event and proposal preconditions remain unchanged.
- If an email draft save remains uncertain after checking, pause and tell the owner rather than risk creating another draft. Draft deletion remains outside the assistant's permissions; the calendar duplicate-cleanup exception does not extend to drafts.
- If cancellation arrives while a save is already underway, check the outcome and report whether it completed, failed, or remains uncertain. Do not claim cancellation succeeded without evidence. Completed calendar changes still require approval to undo.
- All retries for the operations and outcome checks above are limited to two retries after the initial attempt, at most three attempts total per operation. This cap does not authorize retrying an uncertain write or bypassing a required owner decision. When retries are exhausted, stop and report the failure or uncertainty.

### Skipped proposal

The owner explicitly skipped the proposed rule to cancel all pending actions upon permission revocation and require fresh approval after access is restored. Do not treat that proposal as accepted. Existing configured-permission requirements remain in force.

### Closure and deferred exploration, 2026-10-25

Closed for current mapping at the owner's request. The confirmed decisions above are retained. Remaining exploration is open in separate tickets labelled `spike`, excluded from the current mapping frontier:

- [Slack feasibility, interactions, and uncertain delivery](13-test-free-slack-agent-interactions.md).
- [Gmail and Google Calendar integration and reconciliation](17-spike-google-integration-and-reconciliation.md).
- [Proton Bridge integration and draft reconciliation](18-spike-proton-bridge-and-reconciliation.md).

Closure does not establish integration guarantees or passing experiments. Current mapping may proceed using the confirmed policies while keeping these technical assumptions explicit. [DeepSeek V4 Flash through DeepInfra is already selected for V1](09-choose-model-and-budgets.md#confirmed-v1-selection-and-provider-flexibility-2026-10-25); inference-provider selection is not part of these spikes.
