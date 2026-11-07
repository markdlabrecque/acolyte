# Sandcastle workflow candidate

The live adapter and CLI are integrated. [CURRENT.md](../CURRENT.md) and [execution evidence](evidence/workflow-execution.md) record the reviewed revision, checks and delivery status. Selected-model inference and a real workflow run remain unverified. The earlier models-list check was not inference. See [authentication evidence](evidence/workflow-auth-check.md).

## Manual commands

Use native Node 24 from the trusted controller checkout. Build the image explicitly before live execution. There is no automatic image build, service, timer or provider fallback.

```sh
node .sandcastle/main.ts --help
node .sandcastle/main.ts dispatch --dry-run
node .sandcastle/main.ts run --issue NUMBER --dry-run
node .sandcastle/main.ts analyze --issue NUMBER --live
node .sandcastle/main.ts dispatch --live --max 3
node .sandcastle/main.ts run --issue NUMBER --live
node .sandcastle/main.ts board generate
node .sandcastle/main.ts board serve --port 0
```

The repository and base are fixed to `markdlabrecque/acolyte` and `main`. Supply `OPENAI_API_KEY` explicitly for coding-provider execution. The controller never resolves recovery `.sandcastle/.env`, OAuth directories or a credential manager. Do not place credentials in the checkout. `--live` authorizes coding work only. It does not authorize real application credentials, production operations, services, live DeepInfra acceptance or milestone acceptance.

Dry-run uses GitHub GETs and existing local state. Without an explicitly exported `GH_TOKEN`, requests are public and unauthenticated. A full repository discovery can exceed GitHub's unauthenticated rate limit; an explicit token supports larger previews without reading a credential file or invoking `gh`. The token stays on the host. Dry-run does not acquire locks, write state, update a board or labels, inspect credential files, probe images/providers, build or call a model. Missing or stale manifests hold tickets. API failures and rate limits stop the preview.

Analysis creates a separate clean clone, reads task and owner context, and asks Luna for repository-relative path claims. Its filesystem and tools are read-only. It saves a manifest only if issue context and base are still current. Analyze each intended task before dispatch. A `*` claim conservatively reserves the whole repository. Analysis does not implement code or demonstrate implementer/verifier model access.

## Isolation and scheduling

The target image is `sandcastle:acolyte`, Node 24.20.0 and Pi 1.5.0. Live execution resolves an immutable local image ID and checks versions without credentials or network access. Application Pi AI/Durable/Chord stay at 1.4.0; the product inference model is unchanged.

Each reservation gets an independent clone and unique branch. Containers receive no host home/configuration, GitHub/SSH credentials or Docker socket. Only online coding sessions receive the filtered coding key. Git metadata and dependencies are read-only for model sessions. Implementers may edit source files but cannot commit. The trusted controller stops the container before staging, scans for the literal coding key and commits with the owner's Git identity. Candidate code, dependency installation and tests run in containers. Installation has no coding credentials and disables package scripts. Checks have no credentials or network. Root filesystems are read-only; containers are non-root, capability-free, deny privilege escalation and have CPU, memory and process limits. Executable temporary files are allowed because the test suite launches temporary synthetic command fixtures.

All linked worktrees use the canonical Git-common-dir state root. The scheduler checks native parent readiness, delivered blockers, cycles, manifests, active PR paths and global capacity. Active manual PRs also occupy claims and capacity. Single-issue execution goes through the same scheduler, issue lock and one-use reservation claim. At most three non-overlapping implementations can run concurrently. Actual changed paths augment predictions and are checked again before publication and merge. Unknown remote scope blocks conservatively.

Delivery is serialized across runs from rebase/checks through review/publication/merge. If main advances, an unreviewed candidate rebases and reruns checks before a fresh review. Unexpected movement after review holds delivery rather than silently refreshing approval. No candidate controller code runs on the host.

## Review, recovery and merge

Routing requires exactly one declaration in the ticket body:

| Assignment | Exact model |
| --- | --- |
| Luna-6 | `openai/gpt-6-luna` |
| Terra-6.1 | `openai/gpt-6.1-terra` |
| Sol-6.1 | `openai/gpt-6.1-sol` |

Online implementation and repair sessions expose only `read,edit,write,grep,find,ls`. They cannot execute shell commands, tests, builds or package scripts with the coding key. The trusted controller runs candidate checks only after stopping the online session, in a separate credential-free, network-disabled container. Every candidate runs full tests, typecheck and diff check, then gets a fresh read-only Sol review. All Pi sessions explicitly use empty `/dev/null` sources for both system and appended system prompts. `--no-context-files` alone does not suppress candidate `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`. Run `npm run test:pi-resources` inside the pinned, credential-free, network-disabled image to exercise actual Pi 1.5.0 resource loading and reject an implementation-requested shell/check call through the real tool factory and agent loop with a synthetic model stream. The reviewer receives the exact diff, check output and acceptance criteria. There are at most two repair rounds after the initial implementation. Counters, rejected reviews, findings and uncertain-effect markers persist outside the writable candidate. No fallback model is selected on errors.

Runs and redacted evidence live beneath `<git-common-dir>/sandcastle/`. The board reads recorded state, not inferred success. Generation writes `board.html`; serving binds to `127.0.0.1`. Neither starts workers or installs a service.

A consumed reservation is not restarted as a new implementation. Interrupted model/check/publication/merge effects go to `needs-human`. A recorded `waiting-ci` run can be explicitly resumed, but an uncertain `merging` marker cannot. Do not delete locks, erase repair counters or mark a run delivered to bypass a hold. Inspect retained evidence and actual GitHub state first. Closing a PR releases its remote claim but does not make its old reservation reusable.

CI polling is bounded to 60 read attempts separated by 15 seconds. A candidate needs genuine exact-head, push-triggered GitHub Actions `tests` and `typecheck`, exact Sol approval, current base/PR identity and enabled main protection. Push execution binds the workflow definition to the reviewed commit's pinned workflow blob. PR-triggered jobs run separately as `PR tests` and `PR typecheck`; their merge-ref definitions and mutable PR associations cannot authorize merge. After CI polling and the gate's final base/PR/check rechecks, a trusted eligibility callback rediscovers ticket/parent context, readiness, blockers and competing paths immediately before the merge write. Both uninterrupted and `waiting-ci` recovery paths use this fence. Missing, pending, skipped, failed, stale, malformed, foreign or ambiguous evidence blocks merge. `mergeAfterCi` is the only merge path; uncertain writes are never retried automatically. Issue closure must be read back as completed. Any later status-only update requires its own reviewed, CI-gated PR.

This adapts [the owner's `sandcastle-helper` revision](https://github.com/markdlabrecque/sandcastle-helper/tree/488899a938507e3fa60a7f40551a05da99afe719) `488899a938507e3fa60a7f40551a05da99afe719`, including scheduling and the shipped board, without its provider-specific runtime or missing-CI fallback. That revision has no standalone license file; its README explicitly instructs copying/adapting these files. This adaptation retains the source reference and does not invent an upstream license grant. See [execution evidence](evidence/workflow-execution.md), [CLI evidence](evidence/workflow-cli.md), [dispatch evidence](evidence/workflow-dispatch.md), and [merge gate evidence](evidence/workflow-merge-gate.md).
