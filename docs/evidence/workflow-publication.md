# Workflow publication authorization and packaging

## Owner decision

After the final review request was blocked by the review service without a technical verdict, the owner said: "if the tests pass, I don't need a review of this workflow. Do the remote CI config and then capture and push all of it together".

The owner then specified: "Include only a summary of the evidence provided by the image and recovery work first as separate commits each, then commit the workflow and CI as another single commit together." The owner also requested updates to affected tickets.

This explicitly waives further independent review for this workflow publication. It is not an independent APPROVE verdict, does not erase rejected rounds and does not weaken the controller's review requirements for future tickets. This request authorizes pushing a feature branch, not opening/merging a PR, closing delivery issues or pushing directly to protected main.

## Three-commit delivery

1. Image evidence summary only, sourced from the separate `chore/sandcastle-node24-pi15` worktree.
2. Recovery evidence summary only, sourced from the separate `feat/25-recover-admitted-request` worktree. Recovery implementation/tests remain excluded.
3. Full workflow and remote CI together, captured from original integration `9b10b748b84bb34e368294a66c9de70bbf47741e`, with publication/status documentation updated for this decision.

Publication branch: `feat/37-workflow-ci-delivery`, based on remote main `8672f4a90f5f8078882e92f17aba75d41b3db6ee`. The original integration branch and both dirty owner checkouts remain intact. No real credential files are included.

Historical integration commit IDs in evidence refer to the retained original development history. The publication branch deliberately packages that source as one commit, rather than pretending those earlier rejected revisions were approved or individually published.

## Verification and remote CI

The original final source passed 275 tests, zero failures/skips, typecheck and diff checks, plus protected-container installation/reinstallation, isolation, exact image/toolchain, offline catalogs, actual Pi system-resource loading and actual agent-loop shell-denial probes. Final-source log: `/tmp/acolyte-protected-final-file-tools.log`; results: `/tmp/acolyte-protected-final-HekEAM/results.json`. The repackaged committed HEAD must pass the same protected smoke before push.

GitHub readback before publication confirmed Actions enabled. Main protection requires strict, genuine Actions app 15368 checks named `tests` and `typecheck`, administrator enforcement, a PR and resolved conversations, with force pushes/deletions disabled. Those settings are unchanged.

The committed `.github/workflows/ci.yml` runs for every branch push and PR, without path filters. It pins checkout/setup-node actions and Node 24.20.0, disables checkout credential persistence, grants only contents read, and sets finite job deadlines. Push jobs are `tests` and `typecheck`; PR jobs are separately named `PR tests` and `PR typecheck`. The merge gate only accepts immutable push-bound provenance. Its pinned workflow blob is unchanged at `0adae0e36df61d8543164b16df0679d0026aa05e`.

This file is a pre-push record, not a claim that remote CI already ran. After pushing, record the actual final SHA and Actions result on [parent 37](https://github.com/markdlabrecque/acolyte/issues/37), [CI 38](https://github.com/markdlabrecque/acolyte/issues/38), [gate 39](https://github.com/markdlabrecque/acolyte/issues/39) and [controller 40](https://github.com/markdlabrecque/acolyte/issues/40). Record the evidence-only recovery capture on [issue 25](https://github.com/markdlabrecque/acolyte/issues/25), without claiming its source was delivered. Leave issues open and report any failed CI rather than merging or bypassing it.

Selected-model inference, a real ticket run, product/live DeepInfra acceptance, services, reboot and restore remain unverified or separately scoped. No production or 1Password access is authorized.
