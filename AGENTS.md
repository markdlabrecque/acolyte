# Project workflow

## Start an issue

1. Check the branch and working tree. Surface uncommitted work before editing; preserve it.
2. Read `CURRENT.md` and the requested GitHub issue. For TD-002 work, also read `docs/tickets/002-first-todo-round-trip.md` and the relevant evidence in `docs/runtime-contract.md`.
3. Fetch `origin`, update local `main` with a fast-forward, and create a focused feature branch from it. Use `main` as the PR target.
4. Prefer `gh-axi` for GitHub operations. On this machine it is at `~/.config/nvm/versions/node/v24.20.0/bin/gh-axi`; consult its help for supported flags.

## Implement and review

1. Make the smallest root-cause fix within the issue's acceptance criteria. Add regression coverage for reproduced failures.
2. Run the full test suite and typecheck using the scripts in `package.json`. Resolve failures before publication and check `git diff --check`.
3. Obtain independent technical review in a fresh agent context. Give the reviewer the candidate revision, scope, acceptance criteria and safety boundaries. Reviewers inspect code and tests, run synthetic checks as needed, and return an explicit approve/reject verdict with findings and limitations.
4. Fix must-fix findings and request a fresh independent re-review of the corrected candidate. Record the rejected rounds as well as the final approval. If a finding must be deferred, record its linked follow-up and obtain explicit acceptance of the deferral; do not call an unresolved rejection approval.
5. Record the reviewed revision, finding dispositions, test commands/results and limitations under `docs/evidence/`. Update the affected ticket and runtime evidence. Technical approval of an issue is not acceptance of the whole milestone.

## Publish and synchronize

For requests to complete the delivery workflow, commit and push the feature branch, open a PR into `main`, and merge after passing tests, typecheck and independent review. Respect any narrower authorization in the current request; ask before publication or merge if it was not authorized.

- Start the PR title with the issue reference, such as `#9: Review the credential loader`, and link the closing issue in its body. Include the change, before/after evidence and merge risks.
- Check GitHub checks before merging. This project has accepted passing local tests and typecheck when no remote CI is configured. Report absent CI accurately; any configured required checks must pass.
- Verify that the PR merged and the intended issue closed. Switch to local `main` and fast-forward from `origin/main`.
- After the merge, update `CURRENT.md` from verified repository and GitHub state. Include the merge, issue status, test/review evidence and remaining acceptance gaps. Commit and push this status-only update directly on `main` as the separate final delivery step.
- Finish only after local `main` and `origin/main` match and the checkout is clean. Report the PR link and status-update commit concisely.

## Safety and acceptance boundaries

Use temporary synthetic credentials, local stores and loopback providers for development and review. Live inference and real credential access require separate explicit owner authorization. Never access production servers. Never use 1Password without explicit authorization in the current request.

Preserve historical evidence as historical evidence. A merged fix, passing local tests or independent review does not establish a live DeepInfra add/list pass. Keep TD-002 blocked until its separately authorized live acceptance is evidenced. See `docs/credentials.md` before changing credential handling.
