# Image work evidence summary

This records the separate, uncommitted `chore/sandcastle-node24-pi15` work against base `8672f4a90f5f8078882e92f17aba75d41b3db6ee`. The owner requested an evidence-only commit before the combined workflow/CI commit. The original checkout and credential files remain untouched.

## Recorded result

- Development image pins Node `24.20.0` and Pi coding agent `1.5.0`. Application Pi dependencies remain `1.4.0`.
- Image `sandcastle:acolyte` was built with an empty build context. Its ID is `sha256:e891a57c5e65d9d81180a9aa7d8f3f8ff5a32abfeb27e7e3a9ce9ca1087a6c77`; `sandcastle:main` was preserved.
- The source evidence reports non-root execution, no host credentials/auth/socket exposure, 114 baseline tests passing with no failures/skips, typecheck, entrypoint syntax and diff checks passing in the isolated SDK sandbox.
- Offline catalog discovery listed the selected OpenAI model. This was not inference, authentication or selected-model access acceptance.
- Local evidence: `/tmp/acolyte-sandcastle-pi15-build.log` and `/tmp/acolyte-sandcastle-pi15-wTKyyD/results.json`.

## Provenance and scope

Source notes: `code/sandcastle-runtime/docs/evidence/sandcastle-runtime-update.md`. The source patch's SHA-256, rechecked before capture, is `515aa6752884f3095f418b621826bcbb5a58d4ac58be52ea0ca0024dc3cd2114` for `git diff --binary HEAD -- .sandcastle/Dockerfile .sandcastle/main.ts .sandcastle/.env.example`.

This commit contains only this summary. The following combined workflow/CI commit incorporates the image pins and credential example, replaces the starter launcher with the full controller, and retains detailed historical image evidence. It does not copy a real `.env` or claim that the old starter launcher is the final implementation.

The source image review was pending. The owner's later waiver covers publication of this workflow delivery, not a fabricated technical approval. No live provider run, production change, service installation, reboot or TD-002 acceptance is established.
