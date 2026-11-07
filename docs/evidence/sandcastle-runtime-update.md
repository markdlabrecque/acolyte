# Sandcastle Node 24 and Pi 1.5 update

This is historical evidence for the earlier image candidate. Issue #37 integrates the Dockerfile and credential example into the GPT workflow. Its ticket-based routing replaces the hardcoded Sol entrypoint described below. Review and publication statements below describe the earlier candidate, not the later integrated delivery. See `workflow-delivery.md` for the integrated review and CI evidence.

## Candidate

- Base revision: `8672f4a90f5f8078882e92f17aba75d41b3db6ee`.
- Branch: `chore/sandcastle-node24-pi15`, separate from the owner's uncommitted recovery work.
- SHA-256 of `git diff -- .sandcastle`: `515aa6752884f3095f418b621826bcbb5a58d4ac58be52ea0ca0024dc3cd2114`.
- `.sandcastle/Dockerfile` pins Node `24.20.0` and `@earendil-works/pi-coding-agent@1.5.0`. npm reported `1.5.0` as the latest Pi release when checked. The application Pi Durable/Pi AI dependencies remain unchanged at `1.4.0`.
- `.sandcastle/main.ts` selects `openai/gpt-6.1-sol` and explicitly selects the project image `sandcastle:acolyte`.
- `.sandcastle/.env.example` documents `OPENAI_API_KEY`; no real credential file was changed.
- Built image ID: `sha256:e891a57c5e65d9d81180a9aa7d8f3f8ff5a32abfeb27e7e3a9ce9ca1087a6c77`. The existing `sandcastle:main` image was not replaced.

## Verification

Built with an empty context, so project files and credentials could not enter the image:

```sh
docker build --build-arg AGENT_UID="$(id -u)" --build-arg AGENT_GID="$(id -g)" \
  -t sandcastle:acolyte - < .sandcastle/Dockerfile
```

The installed Sandcastle SDK's `createSandbox()` created a temporary clone/worktree and container using the new image, network `none`, all Linux capabilities dropped, two CPUs and only the project's existing `node_modules` mounted read-only. No host Pi SDK, provider extension or Claude executable was mounted. The sandbox was closed and removed after verification.

- Non-root UID/GID `1000:1000`, Node `24.20.0`, npm `11.19.0`, Pi `1.5.0` and GitHub CLI `2.103.3` verified. Claude Code was absent.
- No tested provider/GitHub credentials, project `.env`, host auth files or Docker socket exposed.
- `OPENAI_API_KEY=synthetic-offline-key pi --offline --no-extensions --no-skills --no-context-files --no-prompt-templates --no-themes --no-approve --list-models gpt-6.1-sol` listed the exact model under `openai`. This was catalog discovery, not inference or authentication verification.
- `npm test`: 114 passed, zero failures or skips, through the actual sandbox on the committed application baseline.
- `npm run typecheck`: passed in the sandbox.
- `node --check .sandcastle/main.ts`: passed on the modified entrypoint.
- `git diff --check`: passed.

Local build output: `/tmp/acolyte-sandcastle-pi15-build.log`. Local smoke driver: `/tmp/acolyte-sandcastle-pi15-check.mjs`. Results: `/tmp/acolyte-sandcastle-pi15-wTKyyD/results.json`. These temporary files are supplementary, not durable repository dependencies.

## Review and limitations

Independent technical review remains pending because no subagent profiles are configured. This candidate is not approved for publication or merge. No commit, push or PR was requested or performed.

No live inference, real credential access, GitHub permission probe, production operation, 1Password access, service installation or reboot occurred. A live OpenAI run needs separately provisioned authentication and explicit authorization. The task prompt remains a starter template and the original default merge behavior has not been changed. TD-002 and all V1 acceptance gates retain their existing status.
