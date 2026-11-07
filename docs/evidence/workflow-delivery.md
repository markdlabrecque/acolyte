# GitHub Sandcastle workflow delivery evidence

Status: execution/CLI integration is implemented and offline-tested. Independent whole-workflow approval, remote CI and delivery remain pending. No selected-model inference or real ticket run is established.

## Authorized scope and source

The owner authorized adapting the full helper workflow to this Node/CLI repository, GPT coding agents and GitHub, with mandatory remote CI and automatic merge. Manual invocation, three non-conflicting isolated runs and two persisted repair rounds were selected. Documentation must be updated before publication. Host service installation, real product credentials and product live acceptance remain outside this authorization.

The adaptation source is `sandcastle-helper` revision `488899a938507e3fa60a7f40551a05da99afe719`, especially `orchestrator/ADAPTING.md` and the shipped orchestrator/board. Its no-merge policy is deliberately replaced by the owner's CI-gated automatic-merge requirement. This is developer tooling, not an expansion of Cairn's product architecture.

Delivery is tracked by [issue 37](https://github.com/markdlabrecque/acolyte/issues/37), with [CI](https://github.com/markdlabrecque/acolyte/issues/38), [merge gate](https://github.com/markdlabrecque/acolyte/issues/39) and [controller](https://github.com/markdlabrecque/acolyte/issues/40) children. Product milestone [24](https://github.com/markdlabrecque/acolyte/issues/24) is not closed by this developer-tooling work.

## Integration history

- `4ff8637` integrates the independently isolated Node 24.20.0/Pi coding-agent 1.5.0 image candidate. Application Pi dependencies remain 1.4.0 and the product's DeepInfra selection is unchanged.
- `f9ae7d2` requires GPT routing and non-bypassable remote CI in the project workflow. A final status-only update must use another protected, CI-gated PR rather than a direct main push.
- `f9a0ae2` removes GitHub authentication from the sandbox environment example.
- `6dacc9c` records the bounded owner-authorized OpenAI authentication check.
- `832e045` integrates genuine GitHub Actions jobs `tests` and `typecheck`.
- `c70c1e9` integrates the fail-closed merge gate and injected tests.
- `7692605` integrates scheduling primitives. Its contributor explicitly reported it as incomplete, not a runnable controller. Remaining work was split into lifecycle, tracker/dispatch/board and sandbox-adapter groups in isolated worktrees.
- `e48f0d6` adds the exact initial CI trust anchor, sanitized host HTTP errors and CI checkout without persisted credentials. See [gate evidence](workflow-merge-gate.md).
- `4a037bb` integrates the documentation audit and historical-plan supersession notices.
- `9f55202` integrates the injected lifecycle with persisted repairs, review history and exact-head guards.
- `743733a` integrates the tracker, state store, dispatcher and shipped board adaptation. Its contributor reported blocking gaps in parent inheritance and cycle traversal. These are not accepted deferrals.

The first adapter continuation produced no implementation. Once lifecycle and dispatch interfaces existed together, execution, CLI/analysis and dispatch corrections were assigned as separate bounded work. That foundation was not runnable. The later adapter and CLI integration is recorded below, without rewriting the partial contributions as finished work.

`52a109c` corrects all three first-round gate findings and updates the pinned workflow to explicit-head checkout. `93008ee` registers runner shutdown handlers before readiness, following the deterministic signal probe below. Both still require final whole-delivery review.

All integration occurs in a separate feature checkout. The owner's dirty recovery checkout and original dirty image checkout remain preserved. No subagent is authorized to push, modify repository settings, use real credentials or install services.

## Verified checks so far

The pre-controller baseline passed all 114 product tests and typecheck. The network-disabled, non-root image smoke at `6dacc9c25c5bef6cea8434dd171e09e3b71a2283` also passed those tests, typecheck, image versions, isolation and offline selected-model catalog discovery. It used synthetic credentials only; this does not establish live model access.

The integrated foundation at `e48f0d6` passed `npm test` with 168 tests, `npm run typecheck` and `git diff --check`. Logs are local to the development session under `/tmp/acolyte-workflow-foundation-{tests,typecheck}.log`. Both HTML plan source pages pass the packer's lint-only validation after `npm ci`; the product page retains two prose-length warnings. See [documentation audit](workflow-docs-audit.md).

GitHub API readback confirms strict required checks `tests` and `typecheck`, both pinned to GitHub Actions app 15368, administrator enforcement, no force pushes/deletions and required PRs. These settings must remain in place. Remote execution of the new workflow has not yet occurred. A read-only authenticated request through the actual host transport confirmed that the initial missing base workflow produces a typed HTTP 404, as the one-time bootstrap policy requires.

After lifecycle/board integration, `npm test` passed all 184 tests, typecheck and diff checks passed. A reproduced metadata-refresh defect was fixed: repairs now retain newly measured paths and branch metadata without permitting an adapter to reset lifecycle stages, counters or review history. The regression test exercises both metadata updates and attempted control-field resets. Logs are `/tmp/acolyte-workflow-lifecycle-integration-{tests,typecheck}.log`.

## Network-disabled integration smoke and readiness correction

The smoke at `52a109c` passed toolchain, isolation and exact offline model-catalog checks, but the full suite failed one existing runner restart test. No test was retired or skipped.

A separate deterministic container probe sent SIGTERM synchronously at the readiness log boundary. At `52a109c`, the process terminated by SIGTERM instead of running shutdown cleanup. The runner installed its signal handlers after printing readiness. Moving registration before that announcement fixes the reproduced ordering defect. A dedicated regression sends the signal at that boundary, requires a normal exit and confirms another runner can acquire the same resources. This probe does not establish that every possible restart failure has the same cause.

At `93008eeda8ef5aa7165ef9e2ebfdb1df751e2a4f`, the probe exited normally with code 0 and no terminating signal. All 223 local tests and typecheck passed. The repeated complete image smoke also passed all tests, typecheck, toolchain versions, credential/auth-file absence and exact offline GPT catalog checks with network disabled, non-root execution and all capabilities dropped. Containers closed normally. Results: `/tmp/acolyte-workflow-offline-9JOhZG/results.json`; logs: `/tmp/acolyte-workflow-{readiness-before,readiness-after,offline-readiness}.log`.

This remains synthetic developer-workflow evidence, not a selected-model inference pass or expanded product recovery acceptance. The original dirty recovery and image checkouts were read back after the change and remained intact.

## Complete isolated execution integration

`ee5bd54` connects independent-clone execution, immutable container Git metadata, host-only commits/publication, read-only Luna analysis and manual dispatch/run commands. `d0f5f9b` adds complete board-stage/timing and analysis/reservation regressions. The first pass at that revision passed 254 tests but failed typecheck on the analysis test close wrapper; `f0d5cae` corrects the return type and passes both. No test was retired.

At `6a79e0d`, both manual CLI entrypoints exercise the complete injected delivery through the real merge gate. All 256 tests passed in the protected, credential-free, network-disabled check container, followed by typecheck. The source/Git metadata/dependency mounts were read-only. Credential-free installation used a separate script-disabled session. Image verification passed exact Node/Pi versions, non-root UID and immutable image identity. Diff checks passed. This is synthetic fixture evidence, not a real inference, GitHub CI or live ticket run. See [execution evidence](workflow-execution.md) for failures, corrections and limits.

The first whole-workflow review rejected `f0d5cae` despite its 254 passing tests. It found candidate system-prompt loading, missing post-CI eligibility revalidation and comparison-time path aliases. At `43407b4`, all 274 tests/typecheck/diff checks and an actual Pi 1.5.0 loader regression passed after targeted corrections. [Whole-workflow review evidence](workflow-independent-review.md) preserves the verdict, findings, failed probe attempts and limitations. The second whole-workflow round rejected `e91d600` for key-bearing online shell/test execution. Correction `f70962e` restricts implementation/repair to file tools; all 275 tests, typecheck, protected checks and an actual Pi agent-loop denial regression passed. Its retained rejection confirms the CI provenance correction but is not whole-delivery approval. The superseded `d6768cf` review was cancelled without a verdict. Fresh exact-HEAD approval remains required.

## Owner-authorized publication exception

The final review attempt on `9b10b74` was blocked without a technical verdict. The owner then explicitly waived further review for publication and requested two evidence-only summary commits followed by one combined workflow/CI commit. See [publication authorization](workflow-publication.md). This is not technical approval and does not change the automated controller's review/CI gates. Historical requirements and rejected rounds below are retained. The current request authorizes a feature-branch push, not a PR, merge or issue closure.

## Review and publication

Fresh Sol-6.1 review **rejected** CI/gate snapshot `4a037bb5285011a1a3a803af7b7f6388d01bf1c8`. The three must-fix findings concerned tested PR/base context, malformed successful contents responses activating bootstrap, and noncanonical transport statuses becoming 404. Corrections and regression evidence are in [gate review dispositions](workflow-merge-gate.md). All 222 integrated tests, typecheck, the documented CI contract check and diff checks passed after correction. Corrected re-review rejected `52a109cffb717a9b85a87d067837fb1bc317a6b7`: an earlier PR merge-ref run could have executed a different workflow before retargeting. The malformed-content and HTTP-status corrections were accepted; the provenance finding remained must-fix. The candidate now requires push-triggered exact-head CI with the pinned definition, and the alternate-base/retarget regression. See the full [second-round verdict and correction](workflow-merge-gate.md). This remains a narrow review, not approval of the eventual complete workflow. The complete controller has passed the protected offline suite/typecheck described above. Fresh independent review of its final exact PR head is still required. Every rejected round and its disposition must remain in this record.

No PR has been published or merged for this delivery. Remote CI must succeed on the exact approved head before the sole merge path, `mergeAfterCi`, may proceed. Missing CI, pending/skipped/failed checks, stale approvals, transport uncertainty and changed PR state must block. A timeout after an external write requires reconciliation, not blind replay.

## Acceptance limits

The [owner-authorized OpenAI OAuth check](workflow-auth-check.md) returned HTTP 200 from the models endpoint with zero inference calls. The selected GPT model IDs were not advertised in that response. Authentication readiness and offline catalog entries are not selected-model inference acceptance. A real coding workflow run remains separately unverified.

TD-002 remains blocked on separately authorized live DeepInfra add/list acceptance. Compaction quality, systemd/reboot and restore acceptance are not established by this workflow, its synthetic tests, technical review or merge. No production servers or 1Password were accessed.
