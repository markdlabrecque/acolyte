# Workflow CLI candidate evidence

## Current integration

Live dispatch, scheduler-scoped single-issue execution and read-only Luna analysis are now integrated. Commands require an explicit execution mode. Dry-run remains side-effect-free and cannot enter live preflight or launch paths. See [execution evidence](workflow-execution.md) for verification status and [the guide](../sandcastle-workflow.md) for commands. Whole-workflow review, remote CI and real selected-model execution are still pending.

## Historical partial contribution

The statements below describe the earlier CLI-only contribution, not the integrated adapter.

The CLI provides an unauthenticated read-only scheduling preview and manual board generation/loopback serving. Tests inject GitHub responses and a temporary store; they do not call Docker, models or GitHub. `npm ci`, `npm test` (185 passed), `npm run typecheck`, and `git diff --check` passed on the candidate. No live API, model, board browser, or container test was performed.

This is incomplete: there is no analysis implementation, live dispatch, or single-issue launch. In particular the present dispatcher has no issue-selection argument, so a single-issue entrypoint cannot safely invoke it without risking reservations or launches for other issues. The adapter and integrated safety boundaries require further work and independent review. The chosen model IDs have not been verified for inference. No product live acceptance is implied.
