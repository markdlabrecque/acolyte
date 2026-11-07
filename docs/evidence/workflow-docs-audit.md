# Workflow documentation audit

Scope: the implementation candidate for the GitHub developer workflow. This audit does not approve the candidate or establish product acceptance.

## Scanned current documents

- `README.md`, `CURRENT.md`, `AGENTS.md`, `package.json` and `/tmp/acolyte-workflow-contract.md`.
- `docs/evidence/README.md`, `docs/remaining-work.md`, `docs/tickets/README.md` and `docs/01-always-available-durable-agent-milestone.md`.
- `docs/sandcastle-plan.html` and its packed companion; `docs/plans/always-available-agent.html` and its packed companion.
- Searched tracked Markdown and HTML for Sandcastle, CI, model, image and GitHub helper references. Relevant product and evidence records include `docs/runtime-contract.md`, `docs/credentials.md`, `docs/tickets/002-first-todo-round-trip.md`, `docs/evidence/sandcastle-runtime-update.md` and `pi-durable-personal-agent-prd.md`.

The README and status now distinguish the candidate developer workflow from the application, its Pi 1.4.0 pins and DeepInfra acceptance. The index, remaining-work and milestone pages link current guidance without changing product scope. The plan pairs carry matching notices; the older Sandcastle plan's commands and decisions are superseded. `AGENTS.md` and `docs/sandcastle-workflow.md` belong to other contributors and were not edited here. The workflow link requires that contributor's file at integration.

Historical test counts, review verdicts, prior no-CI statements, spike records and the product PRD's separately authorized fallback remain historical or product-specific. They are not claims about the current developer workflow. The owner's separate recovery work was not touched.

## Validation and limits

The html-plan packer succeeded for `docs/sandcastle-plan.html`. It changed bundled runtime whitespace and an embedded source revision, so the packed file retains its original runtime and excerpt with the same notice inserted instead. Packing `docs/plans/always-available-agent.html` failed because `node_modules/@earendil-works/pi-durable/README.md` is absent in this worktree. Its packed companion likewise retains the existing bundle and has the matching notice inserted. Full regeneration of that plan remains pending when its pinned dependencies are available. Neither page was browser-tested. No model calls, credentials, live providers or remote operations were used by the documentation worker.

## Integration validation

After `npm ci` supplied the pinned dependency README, the integration checkout passed `pack.mjs --lint-only` for both source plans. The product plan retains two prose-length warnings; the Sandcastle plan has none. The existing packed runtimes remain preserved, with notices matching their source pages. This validation did not regenerate their historical embedded excerpts or browser-test either page.

`CURRENT.md` now links the separately owner-authorized OpenAI OAuth HTTP 200 check and states that selected-model inference and a real coding workflow run remain unverified. The authentication evidence is separate from this worker's offline documentation checks.
