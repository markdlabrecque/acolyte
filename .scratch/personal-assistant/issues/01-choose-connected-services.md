# Choose email, calendar, and todo services

ID: 01
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:grilling
Type: grilling
Status: resolved
Assignee: mark
Blocked by: none

## Question

Which email accounts and calendar services must the initial assistant support, and is there an existing todo app to preserve? Identify personal versus managed accounts and the owner-visible source of truth for tasks. Choose a local durable task list only if the owner has no existing service to retain. Do not request credentials in chat.

## Answer

Owner selections from the voice conversation on 2026-10-23:

- Google Calendar uses the same personal Google account as Gmail. Work calendars are outside scope.
- Gmail access is limited to the owner's personal Gmail account. Work email is outside the requested scope.
- Proton Mail is also required. The owner reports Proton Mail Bridge is installed and confirms it will run on the same Linux host as the agent. Integration feasibility has not been verified.
- Todos and reminders use a simple built-in system within the agent, with durable local storage as required by the PRD. No external todo service is requested.
- The owner subsequently confirmed email reading/search and draft creation for both personal Gmail and Proton Mail, with sending prohibited even with approval. The owner reviews and sends drafts manually. A trusted adapter keeps credentials away from the agent and enforces this boundary. Gmail requires adapter enforcement because its draft scope also permits sending; Proton uses IMAP for drafts with SMTP access denied. See [email draft permission evidence](../research/email-draft-permissions.md). Draft editing/deletion and other mailbox mutations were not authorized by this decision.

Resolved through the owner's live answers on 2026-10-23. Provider permissions, integration contracts, and runtime behavior remain research questions; no installation, authentication, or runtime test was performed.
