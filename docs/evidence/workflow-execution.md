# Workflow execution integration

## Scope and pending acceptance

The execution adapter now connects scheduling, one-use reservations, isolated model sessions, persisted repair/review rounds, publication, bounded CI polling and the sole protected merge gate. The CLI exposes explicit live dispatch, scoped runs and read-only Luna analysis. This is an implementation candidate. No selected-model inference, real workflow task, remote CI acceptance, publication or merge is established here. TD-002 live acceptance remains separately blocked.

## Changes

- Source edits occur in independent clones. Git metadata is immutable to models; the host stops the container before staging and committing. Ambient SDK dotenv/environment input is rejected.
- Installation is credential-free with scripts disabled. Checks are offline and credential-free. Online coding sessions get only an explicitly filtered OpenAI key. Container roots, Git metadata and model-session dependencies are read-only.
- Canonical state, issue locks, one-use reservation claims and a cross-run delivery lock prevent alternate entrypoints from bypassing capacity or review. Actual changes are reconciled against concurrent local and remote claims.
- Exact model/provider arguments and tool restrictions apply to fresh Pi sessions. After whole-workflow review rejected online candidate execution at `e91d600`, implementation and repair now expose only `read,edit,write,grep,find,ls`. They have no shell or code-execution tool. Candidate tests/build commands run only in the controller's separate credential-free, network-disabled check session. The real Pi 1.5.0 parser/tool-factory/agent-loop probe rejects even an explicit implementation-requested shell/check call with a synthetic key present. See [review rounds](workflow-independent-review.md). Sol receives the measured diff and check output, cannot write files or execute shell commands, and must return exact-head structured approval.
- Main advancement triggers rebase/checks before review. Context changes, uncertainty, missing CI or exhausted repairs hold delivery. Every merge still calls `mergeAfterCi`.
- The SDK declaration requires `@standard-schema/spec`; the exact development dependency is now declared rather than relying on an undeclared transitive type package.

## Failures retained

An initial protected installation/check probe installed dependencies successfully but failed tests. The provider's temporary filesystems inherited Docker's `noexec` default. The transport tests deliberately execute temporary synthetic `gh` commands, and a direct `/tmp` script probe reproduced exit 126. Temporary filesystems now explicitly permit execution while retaining `nosuid`, `nodev`, non-root identity, a read-only root, immutable Git metadata and no host credentials. No test was retired or skipped.

The dry-run fixture also returned an empty array for an absent native-parent endpoint. It now returns the required typed 404. The argument assertions were updated for the newly implemented explicit live mode rather than weakened.

The first adapter lifecycle regressions caught an invalid Git grep option. The credential scan now uses supported `-f -` input, keeping the key out of Git argv. The seven targeted synthetic lifecycle cases then passed, including full gate/closure, two rejected repairs, missing CI, uncertain publication, changed context, actual-path conflict and pre-review rebase. These tests use fake Docker/model/GitHub effects and real temporary Git repositories. They do not prove real inference or remote CI.

## Verification record

- Previous full offline image smoke at `93008ee` passed 223 tests and typecheck. It predates this adapter and must not be treated as validation of this integration.
- Early host-side integration unit tests/typecheck were development checks, not final container-only acceptance.
- At `ee5bd54`, the complete protected-container probe passed all 250 tests with no failures/skips and typecheck. Credential-free installation added 195 packages. `/tmp` execution succeeded, and the checks verified that Git metadata/dependencies were not writable and no coding/GitHub credentials were present. This was the first integrated pass, before the later board/timing, analysis and reservation regressions described below. Final independent whole-workflow review remains pending.
- At `d0f5f9b`, all 254 tests passed, but typecheck rejected the new analysis test's close wrapper because it discarded the SDK `CloseResult`. `f0d5cae` returns that result. The complete protected-container probe at `f0d5cae` then passed all 254 tests with no failures/skips and typecheck. The separate offline image check verified the immutable local ID, non-root UID, exact Node/Pi versions and absence of the legacy coding CLI.
- CLI regression coverage now drives both live dispatch and single-issue execution through `main` with synthetic effects. The CLI passes its injected GitHub client consistently to the real adapter and analyzer. Ambiguous relative path segments in analysis claims are rejected.
- The board now maps every persisted lifecycle phase and retains start/stage timestamps across metadata updates. Checks, publication and merge no longer appear falsely stopped. Readiness remains manual, without automatic blocker-triggered restart.
- At `6a79e0d`, the complete protected-container probe passed all 256 tests with no failures/skips, then typecheck. This includes both manual CLI delivery paths, read-only/stale analysis, persisted repairs, exact-head gate delegation and board lifecycle/timing. `git diff --check` also passed on the host. Installation was credential-free; checks were network-disabled with source, Git metadata and dependencies read-only. Log: `/tmp/acolyte-protected-install-cli-final.log`.
- Independent review of `f0d5cae` was requested in a detached read-only Sol context. Its result cannot approve later CLI, documentation or test changes; final exact-HEAD review is still required.
- Evidence files under `/tmp/acolyte-protected-*` retain the isolated provider and installation probe logs. Synthetic keys only were used. The failed typecheck and earlier failed temporary-execution probe remain part of this record. No test was retired or skipped.
- The refocusing script reported missing OpenRig topology/work-node traces for this standalone checkout. No hierarchy was invented. Current intent and acceptance boundaries were re-read from GitHub issues 37/40 and repository sources.
