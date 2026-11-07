# Whole-workflow review rounds

## Round 1: rejected

Independent Sol review rejected exact `f0d5caedb250f7bf566d20266aeb6f7abf4a4339` against `8672f4a90f5f8078882e92f17aba75d41b3db6ee`. The assigned checkout remained clean. The reviewer independently cloned that revision, removed origin and ran 254 tests, typecheck and diff checks inside the pinned non-root, capability-dropped, credential-free, network-disabled image with read-only source/dependencies. All passed. Log: `/tmp/acolyte-independent-f0d5cae-tests.log`.

Passing checks did not resolve these must-fix findings:

1. P1: `--no-context-files` does not suppress candidate `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`. An actual Pi 1.5.0 `DefaultResourceLoader` probe loaded both prompts without inference. They could override independent verification or analysis. Candidate correction explicitly supplies `/dev/null` for both prompt sources, using shared resource arguments. `npm run test:pi-resources` is a maintained image-only regression using the real global Pi 1.5.0 parser and loader. It first reproduces both candidate markers with unprotected discovery, then checks their suppression with the production arguments. This is not a command-string-only test. Run it in the pinned image with no credentials or network.
2. P1: ticket context, readiness, blockers and competing paths were checked before publication, not after up to 15 minutes of CI polling. The reviewer changed context and added a blocker after publication; the synthetic workflow issued one merge write without another ticket/dependency read. Candidate correction shares the publication eligibility check with a final trusted callback inside `mergeAfterCi`, after CI/base/PR rechecks and immediately before its sole write. The callback rediscovers ticket/parent context, current readiness/dependencies and actual path claims. It applies to uninterrupted execution and `waiting-ci` recovery. Regressions cover changed context, new blocker, owner closure, removed readiness and a newly overlapping PR in both paths, with no merge or publication replay.
3. P2: internal dot and empty path components bypassed overlap comparison. The analysis parser was tightened after the reviewed revision, but old persisted claims still needed protection. Candidate correction canonicalizes aliases at the comparison boundary too. Repository-root/unsafe claims conservatively overlap everything. Regressions cover internal `./`, repeated separators, leading aliases, root claims and both new and persisted scheduling claims.

## Protected correction verification

At `43407b45ff4901f52a6ce58e869c56c5c6c409bb`, the complete protected smoke passed all 274 tests, zero failures/skips, typecheck and diff checks. The actual global Pi 1.5.0 parser/loader regression reproduced both candidate markers, then suppressed both with the production resource arguments. Credential-free script-disabled installation/reinstallation, image/UID/version checks, offline GPT catalogs and read-only Git/dependency/credential absence checks also passed. No inference was performed. Results: `/tmp/acolyte-protected-final-hGgBt5/results.json`; log: `/tmp/acolyte-protected-review-corrections-3.log`.

Retained failed attempts: the first loader probe incorrectly assumed the CLI entrypoint lived directly in `dist`; the image uses `dist/bundle`, so the probe now resolves the adjacent unbundled library directory. The next suite run found an overly narrow expected-error assertion for resumed path conflicts. Recovery correctly stopped at the existing earlier actual-path guard, before reaching the new final fence. The assertion now accepts that specific safe hold as well. Both were known, targeted fixture fixes; no test was retired or skipped. Logs: `/tmp/acolyte-protected-review-corrections{,-2}.log`.

These are correction candidates, not accepted deferrals or an approval. The separate CI/gate review's two rejected rounds remain in [gate evidence](workflow-merge-gate.md). A fresh exact-HEAD review is required.

The reviewer performed no live inference/provider calls, GitHub operations, remote CI, browser work or full ticket run. Its verdict does not establish TD-002, product or operational acceptance. The owner's recovery/image worktrees were preserved.

## Round 2: rejected

Independent whole-workflow Sol review rejected exact `e91d600405d0ab76c4602c62e70385274888359f` against the same base. Its sanitized independent clone passed credential-free script-disabled installation, 262 tests with zero failures/cancellations/skips, typecheck and base-to-candidate diff checks in protected Docker. Log: `/tmp/acolyte-independent-e91d600-tests.log`. No candidate code ran on the host. The assigned checkout stayed clean.

P1: the online implementer received the coding key and unrestricted `bash`, while its prompt expressly instructed it to run tests. Consequently, implementation-requested checks could execute with credentials and network access despite the controller's later correctly isolated check phase. The reviewer reproduced this with a synthetic key and fake Docker effects, without disclosure or real network requests. References at that revision: `prompt.md:3`, `adapter.ts:54–55,104–108`, `execution.ts:83–93,134–135` under `.sandcastle/`.

Correction at `f70962e51fc7a3888c1b47d7c9ad5937321ce1aa` removes shell/code-execution tools from every online implementation and repair. The shared explicit allowlist is `read,edit,write,grep,find,ls`; verification/analysis remain read-only. The prompt now prohibits executing checks or claiming they ran and assigns execution to the trusted controller's separate credential-free, network-disabled worker. No prompt-only restriction or later cleanup is relied on.

A unit regression sends an explicit implementation request to run `npm test && npm run typecheck` and verifies the resulting Pi command has only file tools. The maintained image-only probe goes further: it uses the real Pi 1.5.0 CLI parser, tool factory and agent loop with a synthetic model stream that requests a `bash` tool call for those exact checks. With a synthetic coding key present, the request returns an error and neither test script executes. The probe uses no inference or external provider. This supplements the earlier real resource-loader probe.

Protected smoke at that correction passed all 275 tests, zero failures/cancellations/skips, typecheck, diff checks, installation/reinstallation, image/toolchain/isolation checks, offline model catalogs and both actual Pi probes. Results: `/tmp/acolyte-protected-final-wZYPB7/results.json`; log: `/tmp/acolyte-protected-file-tools.log`.

The reviewer found no remaining bypass of the historical alternate-base/retarget CI defect. It inspected exact-head push provenance, pinned head/base workflow blobs, ancestry, genuine Actions job/check identity, distinct PR check names, duplicate/conflicting run rejection and latest rerun evidence. It confirmed workflow blob `0adae0e36df61d8543164b16df0679d0026aa05e` and bounded typed-404 bootstrap without waiving CI/protection. Both earlier CI/gate rejections remain retained. This finding disposition is not approval of the whole candidate or actual remote CI evidence.

The review of intermediate `d6768cfa75a5fb2cbb8562a26a5b2e6bced678e0` was cancelled by the parent once this additional rejection arrived. It returned no verdict and cannot authorize publication. Fresh independent review must cover the corrected final HEAD, including this record. No deferral is requested.

Round 2 performed no real model execution, remote Actions run, authenticated protection readback, publication/merge or TD-002 acceptance. Synthetic integrated tests do not establish those external contracts.

## Final attempt and owner publication waiver

Fresh whole-workflow review of `9b10b748b84bb34e368294a66c9de70bbf47741e` failed at the review service's content screen before producing a technical verdict. It is neither APPROVE nor REJECT. The source passed all 275 tests, typecheck and protected smoke, including both actual Pi probes. The owner subsequently waived further review for this workflow publication and requested a three-commit feature-branch push. [Publication evidence](workflow-publication.md) records the exact instruction and packaging. This supersedes the earlier publication prerequisite only; no independent approval is claimed, rejected rounds stay retained, future automated runs still require review and protected main is not bypassed.
