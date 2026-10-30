# Verify Pi Claude subscription fallback

ID: 16
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:research
Type: research
Status: resolved
Assignee: mark
Blocked by: none

## Question

Identify the actual Pi subscription extension and verify whether the owner's Claude subscription has documented support for this Pi Durable stack. Check package identity, compatibility, authentication mechanism, subscription terms and restrictions, and operational limits without credentials or installation.

Planning research only. Use primary sources, save evidence under `research/`, and record the answer here. No credentials, installations, production access, or live tests.

## Answer

### Owner confirmation, 2026-10-25

The owner confirmed: “I have already confirmed that pi-claude-subscription will work. I wrote it myself and have tested in thoroughly.”

The selected fallback is the owner's `pi-claude-subscription`, maintained at `markdlabrecque/pi-claude-subscription` and available locally at `/Users/mark/Projects/pi-claude-subscription`. Accept the owner's authorship and thorough testing as confirmation that it works for the intended fallback. No further compatibility research is required to close this planning ticket. This session did not run those tests.

The earlier research investigated a different candidate, `pi-claude-bridge`; its unresolved identity and compatibility findings do not describe the owner's selected extension. See the corrected [evidence note](../research/pi-subscription-fallback.md).

Activation remains governed by the [confirmed fallback policy](09-choose-model-and-budgets.md): retry temporary failures within the configured limits, then ask the owner whether to wait or switch. Never switch automatically or bypass the monthly spending pause. This resolution does not activate the fallback, authorize paid overages, or change the selected V1 provider.
