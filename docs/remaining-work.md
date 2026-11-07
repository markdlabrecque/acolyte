# Remaining work after integration spike completion

Updated 27 October 2026. Slack, Google, and Proton spikes are **complete and closed**. The owner found the remaining evidence and confirms all previously unrecorded in-scope tests passed. The [completion ledger](evidence/integration-spike-ledger.md) and [snapshot](integration-spike-snapshot.md) supersede the earlier evidence-recapture checklist.

There are **no remaining spike tests, browser observations, reboot windows, monitoring approvals, or evidence-recovery tasks for the owner**. Lock/suspend tests remain excluded. Do not restart the old checklist just because raw artifacts for owner-confirmed passes are not copied locally.

## Current workflow and status

The developer workflow candidate is separate from the product milestones below. See [CURRENT.md](../CURRENT.md) and [the GitHub helper workflow](sandcastle-workflow.md) for its pending review and remote CI. TD-002 still needs separately authorized live DeepInfra acceptance.

## Historical implementation snapshot, 2026-11-03

TD-002 is implemented, live smoke pending, at commit `53f7860`. Its formal acceptance remains blocked by the live gate and documented review/evidence gaps. The issue #4 candidate now passes 101 tests and typecheck, including [persisted-batch SIGKILL contract coverage](evidence/issue-4-tool-batch.md). That issue remains open pending publication. [Runtime-connection FULL verification](evidence/issue-6-storage-durability.md) is merged and issue #6 is closed. See [CURRENT.md](../CURRENT.md), the [local implementation tracker](tickets/README.md), and [Acolyte's open issues](https://github.com/markdlabrecque/acolyte/issues).

The next local tickets remain TD-003 crash-safe recovery, TD-004 persisted limits including the unused `warningUsd` setting, and TD-005 Linux services/demo. Their dependencies and authorization gates still apply. This retained todo implementation is progress toward M0/M1, not completion of either milestone or the full specification.

## Agent work

- [ ] Complete [the M0–M4 implementation specification](../.scratch/personal-assistant/issues/19-finalize-implementation-specification.md), using the completed integration results and settled workflow, authorization, schedule, budget, and operational decisions.
- [x] Reconcile the PRD with recorded decisions and completed spikes. Version 0.5 incorporates settled workflows, schedules, budgets, retention, backup/restore, and upgrade rules, and labels remaining technical proposals. No new product policy or framework acceptance is implied.
- [ ] Include concrete workflow acceptance scenarios, per-agent isolation, shared budget accounting, gateway acceptance, action reconciliation, schedule catch-up, backup/restore, and upgrade behavior.
- [ ] Identify any genuinely unresolved product choices, present supported options, and obtain owner decisions before implementation-ready sign-off. Feasibility passes do not select context scope, contribution criteria, cancellation policy, or delivery presentation.
- [ ] Keep production enforcement and runtime acceptance in the implementation milestones. Spike runners are not the production credential or network boundary.

## Owner involvement later

- Decide only product-policy questions that remain unresolved after specification synthesis. Do not repeat already confirmed choices or spike observations.
- Review the completed specification and authorize framework implementation separately.
- Provision production resources/credentials and choose operational windows only when implementation requires them. No 1Password access is authorized for agents.
- Choose fixture/app/grant retention or cleanup when appropriate. No cleanup or revocation was performed or implied by closing the spikes; housekeeping is not a spike-completion gate.

## Framework implementation, after specification review

These are full-framework milestones, not unfinished spike work. TD-002 supplies part of the first path; unchecked milestones below describe the remaining acceptance, not an absence of code.

- [ ] M0: pin Pi Durable/Pi AI/runtime/storage versions and verify the selected APIs. Stop for an owner dependency decision if recovery needs substantial additional machinery.
- [ ] M1: build the retained end-to-end path through authenticated gateway, one configured agent, real inference, durable storage/reply, and Linux service. Verify restart/reboot on the implemented stack.
- [ ] M2: implement multi-agent configuration, routes, skills, permissions, canonical-store ownership, cross-agent isolation, and duplicate-launcher prevention.
- [ ] M3: implement durable action records, exact approvals, no sending, credential/SMTP bypass prevention, bounded retries, cancellation, reconciliation, and production connector adapters. Test durable delivery and uncertain effects on that implementation.
- [ ] M4: implement backup/restore and catch-up, status/logging, retention, upgrades/draining, installation/runbook, corruption/incompatibility handling, and explicit portability limits.
- [ ] Run the PRD's acceptance criteria on the pinned Linux stack. Connector spike success does not establish Pi Durable runtime recovery, production isolation, or restore safety.

## Execution boundaries

No new live test batch is needed for spike closure. Preserve raw evidence, secrets outside documentation, and the deliberately uncertain Proton no-write action. No sending, blind write retries, unapproved cleanup, service/keyring changes, production-server access, lock/suspend, or unattended reboots. Exact future Calendar mutations still require approval. Closing tickets does not expand account permissions or authorize deployment.
