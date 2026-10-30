# Does OpenDuet require CopilotKit Intelligence?

Source retrieval date: **2026-10-29 UTC**. This is an independent source and code review, not a restatement of the previous report. I did not read the previous report as evidence.

## Conclusion

**Yes, the current, unmodified OpenDuet application requires the branded CopilotKit Intelligence backend for its supported conversation and background-turn paths. No, CopilotKit applications in general do not require that backend.** These are different claims.

The narrow OpenDuet requirement survives examination of the implementation, not just its README. Configuration refuses missing Intelligence settings; the mounted runtime always receives an Intelligence client; scheduled turns create and read Intelligence threads and take platform locks. Removing the shell script's licence check does not replace those runtime dependencies.

However, an unqualified statement that "CopilotKit Intelligence is required" is **overstated** if it means any of the following:

- Every application using CopilotKit requires Intelligence. Official documentation explicitly says otherwise.
- OpenDuet must use CopilotKit's hosted cloud. Intelligence endpoints are configurable, and self-hosted Intelligence is documented.
- Intelligence supplies the model or is the external agent framework. Model access and AG-UI agents are separate choices.
- Every form of OpenDuet memory requires Intelligence's memory service. **That is wrong at this revision:** personal memory has an application-owned database fallback. Automatic Learning can also be inactive while the application still starts and chats.
- An MIT fork could never replace Intelligence. A replacement is possible engineering work, but I found no shipped, supported switch that does it for OpenDuet.

A precise replacement for the earlier claim is:

> OpenDuet currently depends on CopilotKit Intelligence for its conversation backend and run coordination. Bring your own model or AG-UI agent, and self-host Intelligence if appropriate, but running OpenDuet without Intelligence requires changing its integration. CopilotKit's OSS TypeScript runtime itself supports applications without Intelligence.

## Revisions and method

- OpenDuet was freshly cloned from <https://github.com/CopilotKit/OpenDuet> into `/tmp/openduet-verification.pHfzoT/OpenDuet` and pinned to **`677e0fcd148d80b99dd788c6d6f9c1c9f40a72db`**. Commit date: `2026-10-28T15:37:51-07:00`.
- Official CopilotKit documentation source and current SDK source were separately fetched from <https://github.com/CopilotKit/CopilotKit>, pinned to **`621f0ec65453d82e84a5b2b2ad80a575e3a6a9cc`**. Commit date: `2026-10-29T21:09:31Z`.
- OpenDuet declares `@copilotkit/runtime` **`1.77.0`** in its [server manifest][O-package]. I downloaded that exact [published source archive](https://registry.npmjs.org/@copilotkit/runtime/-/runtime-1.77.0.tgz), extracted embedded TypeScript source from its source maps, and verified its SHA-512 against the registry's `dist.integrity`. This was a source download, not a package installation.
- The current CopilotKit SDK source differs from published 1.77.0. I did not treat them as identical. Statements about OpenDuet's wiring come from the pinned OpenDuet revision; version-specific SDK observations below identify 1.77.0 explicitly. Current SDK links are independent corroboration.
- Live first-party documentation and pricing pages were retrieved separately. GitHub links below pin source lines; live site links identify the pages actually consulted. A deployed documentation build can differ from the current repository revision.
- No app, bootstrap script, test suite, installation, sign-in, credential lookup, or production access was run. These are static findings, not an end-to-end demonstration.

Initial Cairn status was branch `docs/cairn-project-name`, with three untracked files: `.scratch/openduet-research.md`, `CURRENT.md`, and `output/cairn-vs-openduet.html`. Those files were left untouched. This report is the only intended new Cairn file.

## What each layer means

| Layer | What it does here | Does choosing your own remove Intelligence? |
| --- | --- | --- |
| LLM/model provider | Generates model responses. The tenant's model configuration defaults to OpenAI; README documents OpenAI-compatible endpoints and Anthropic. | No. It changes model access, not thread storage or the run gateway. |
| External agent/framework | Supplies an AG-UI endpoint, whether LangGraph, Mastra, another framework, or handwritten. | No. OpenDuet wraps the agent in the Intelligence-backed conversation path. |
| CopilotKit OSS TypeScript runtime | Connects agents and frontend interactions. It supports an SSE/in-memory mode without Intelligence. | Yes for an application built with that mode, but OpenDuet does not select it. |
| CopilotKit Intelligence | Separate branded service for saved interaction history, delivery, and platform capabilities. OpenDuet also uses its thread locks and runner gateway. | This is the dependency under investigation. Self-hosting it changes its operator, not its identity. |
| Personal memory and Automatic Learning | Personal-memory content and recall can fall back to OpenBot tables. Learning needs an assigned container and may be disabled or inactive. | Disabling these features does not remove the thread and runner dependency. |

Sources: [OpenDuet model and provider instructions][O-providers], [tenant model YAML][O-model], [AG-UI agent and architecture description][O-agent], and [official OSS comparison][D-oss].

## 1. The README requirement is explicit, but code is the stronger evidence

The [OpenDuet quick start][O-quickstart] says:

> "**Intelligence is required**: it keeps OpenDuet's threads and memory, and the server will not start without its key. The free Developer plan is enough."

The [root environment example][O-env] is equally explicit:

> "There is no degraded mode."

That documentation alone would not settle whether the dependency is artificial or bypassable. The relevant implementation is `runtimeCapabilities` in [`openbot/server/src/config.ts`][O-config]:

```ts
const missing = Object.entries({
  INTELLIGENCE_API_URL: settings.apiUrl,
  INTELLIGENCE_GATEWAY_WS_URL: settings.gatewayWsUrl,
  INTELLIGENCE_API_KEY: settings.apiKey,
})
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length > 0) {
  throw new Error(
    `CopilotKit Intelligence is required and is not configured. Missing: ${missing.join(", ")}`,
  );
}
```

It returns only `mode: "intelligence"`, `durableHistory: true`, and the Intelligence settings. The [capabilities type][O-capabilities] has exactly that one mode. The executable entrypoint calls [`loadConfig()`][O-load-config], and the [configuration tests][O-config-tests] explicitly cover rejection of each missing setting and rejection of an entirely absent Intelligence configuration. Those tests were read, not executed.

This boot check validates configuration presence, **not successful authentication with a working backend**. Nonempty placeholder settings are not proof the application can converse. The tests also establish that `COPILOTKIT_LICENSE_TOKEN` is not a mandatory fourth setting. Managed Intelligence uses the project key; a configured licence token is forwarded for deployments that need it.

## 2. Bootstrap has an additional check; bypassing it is insufficient

The root [`scripts/start.sh`][O-start-wrapper] links the root environment file, installs dependencies if needed, then delegates to `openbot/scripts/start.sh`. I inspected it but did not run it.

The delegated script fetches `/api/copilotkit/info` and [checks][O-start-health]:

```ts
const status = info.licenseStatus;
if (status !== "valid") {
  // diagnostics
  process.exit(1);
}
```

This is a shell-launcher gate after the API has been started, not proof that the API process itself cannot exist with unusable credentials. Launching the API by another entrypoint bypasses this shell block, **but not `loadConfig` or the runtime's Intelligence integration**. Separately, the server's [entitlement-reporting helper][O-entitlement] is explicitly nonfatal and logs failures. "Server starts", "launcher reports ready", "memory entitlement available", and "a conversation completes" are distinct conditions.

## 3. Actual conversation reads, writes, and runs still use Intelligence

### Web conversation runtime

[`mountCopilotRuntime`][O-runtime] creates `IntelligenceKnowingANewThread` with the configured API URL, WebSocket URL, and API key, then constructs:

```ts
const runtime = new CopilotRuntime({
  // other options omitted
  intelligence: intelligenceClient,
  licenseToken: intelligence.licenseToken,
```

There is no condition choosing an OSS runner when Intelligence is absent. In the exact published **1.77.0** SDK source, `CopilotSseRuntime` uses `options.runner ?? new InMemoryAgentRunner()`, whereas `CopilotIntelligenceRuntime` constructs `IntelligenceAgentRunner` from the Intelligence client's connection settings. The [current pinned SDK source][C-mode-selection] independently confirms the constructor chooses the Intelligence delegate when Intelligence options are present, and the [Intelligence runtime][C-runner] uses the platform runner.

In the **1.77.0** web-run handler, execution first calls `runtime.intelligence.getOrCreateThread(...)`, then `runtime.intelligence.ɵacquireThreadLock(...)`. Failure to initialize the thread returns an error response, rather than selecting local storage. The [current source][C-run] retains those dependencies. The published runner also requires gateway joining and durable event delivery; it contains a 60,000 ms event-durability deadline. Supplying an LLM key does not satisfy these platform operations.

### History and scheduled turns

OpenDuet's [history reader][O-history] calls:

```ts
intelligenceClient.getThreadMessages({
  threadId: input.threadId,
  userId: input.actorId,
})
```

Its [thread existence reader][O-thread-status] calls `intelligence.getThread`. Only a specific missing-thread response becomes "unknown"; other failures propagate.

For routines and other headless work, [`index.ts`][O-headless-client] constructs another `CopilotKitIntelligence` client from the same required settings and [creates `IntelligenceAgentRunner`][O-headless-runner]. The actual [turn implementation][O-turn] does:

```ts
await intelligence.getOrCreateThread({
  threadId,
  userId: ownerUserId,
  agentId,
  ...(learningContainerId ? { learningContainerId } : {}),
});
```

It then reads `intelligence.getThreadMessages(...)`. Its [lease implementation][O-lock] acquires and renews Intelligence thread locks. This is not merely a startup-time subscription check.

The apparent empty-history fallback is [restricted to a `PlatformRequestError` with status 404][O-empty-history]. An outage, rejected credentials, or another error does **not** become a successful empty local conversation. The special case handles a thread that does not yet exist.

### What the local database does and does not prove

The application has its own Postgres data. That does not make Postgres an alternate implementation of the conversation backend. For example, the [channel `lastMessage` field][O-channel-cache] is explicitly described as "a cache of what a client observed rather than an authoritative mirror of the thread". There are also actual local [group-message rows][O-group-messages], plus task, approval, audit, credential, and memory records. It would be wrong to claim **no messages or memory are stored locally**. None of those findings changes the normal conversation/history/lock paths traced above into an OSS-only mode.

## 4. Real fallbacks exist, but they are narrower than replacing Intelligence

### Personal memory

This is the strongest correction to the README's broad "threads and memory" shorthand. The [memory-store implementation][O-memory-store] says:

> "A person's memory: CopilotKit Intelligence when this deployment is entitled to it, OpenBot's own tables when it is not."

It further says:

> "Without Intelligence memory, nothing here calls the platform, and the store behaves exactly as it did before: the tables are the whole store."

That is backed by actual operations, not only comments. [`create` inserts into `personalMemories`][O-memory-create] before mirroring, and [`retrieve` reads eligible local rows and returns them when remote recall is unavailable][O-memory-retrieve]. The [Intelligence memory adapter][O-memory-adapter] checks `response.entitlement.features.memory === true` and returns an unavailable result when the capability cannot be used. An Intelligence-only memory that has no local row cannot necessarily be edited or forgotten during an outage; the store documents that exception.

Therefore **Intelligence's memory feature is not a prerequisite for all personal memory**. This is not a fallback for conversation threads or the gateway runner.

### Automatic Learning

The [Automatic Learning guide][O-learning] states:

> "Collection and delivery require an existing, assigned container. OpenBot still starts and chats without one."

The [environment example][O-learning-env] documents saved off settings, inactive collection without a container, and `OPENBOT_LEARNING_AUTO_ASSIGN=false`. The [startup container helper][O-learning-start] is noninteractive and nonfatal. Turning off auto-assignment is not itself the same as disabling an existing saved Learning assignment; the Admin settings govern that. Neither setting selects a replacement conversation backend.

Telemetry opt-outs likewise only disable telemetry, not Intelligence. The [README][O-telemetry] names `COPILOTKIT_TELEMETRY_DISABLED=true` and `DO_NOT_TRACK=1` for that purpose.

## 5. What "bring your own" actually establishes

I searched the current official docs source, the official CopilotKit README, fetched product pages, and the OpenDuet checkout for "bring your own intelligence", "own intelligence", and "BYOI". **I did not find a current official promise using the exact phrase "bring your own intelligence" that documents an OpenDuet replacement backend.** The original comments were not supplied, so I cannot attribute or disprove their exact wording or historical context.

The substantive BYO claims are real and need not be dismissed:

1. **Bring your own model or model runtime.** OpenDuet documents provider changes. The official [custom model-router guide](https://docs.copilotkit.ai/backend/custom-agent) shows an OSS runtime constructed with `runner: new InMemoryAgentRunner()`. This is a CopilotKit integration example, not an OpenDuet configuration recipe.
2. **Bring your own agent/framework.** The OpenDuet [README][O-agent] says, "Any endpoint that speaks AG-UI can be the agent" and "OpenDuet is not tied to one framework or one model." That swaps reasoning/execution, not the surrounding platform integration.
3. **Bring your own persistence in an OSS application.** The official [OSS comparison][D-oss] states:

   > "CopilotKit's **open-source SDKs and TypeScript runtime** connect your frontend to your agent without requiring a CopilotKit service."

   And:

   > "LangGraph checkpointers, ADK session services, and application-owned storage can retain history without Intelligence. You own the storage and UI integration."

   These statements directly refute a blanket requirement for CopilotKit generally. The published SDK's SSE/in-memory implementation corroborates them. They do not establish that OpenDuet already implements that integration.
4. **Bring your own thread system while also using Intelligence.** The official [guide](https://docs.copilotkit.ai/intelligence/bring-your-own-thread-system), with [pinned source][D-byo-threads], says:

   > "Your framework continues managing the original conversation and agent state. Intelligence automatically records its own copy of the supported AG-UI interaction history that passes through your connected CopilotKit runtime."

   This is coexistence with Intelligence, not removal of it. The guide also says Intelligence rename, archive, and delete actions affect only Intelligence records.
5. **Point at your own Intelligence deployment.** The OpenDuet [environment example][O-env] allows alternate endpoints; the official [local evaluation guide][D-local] runs the branded Intelligence stack on your machine. Neither is an arbitrary backend plug-in contract.

The [live OSS comparison](https://docs.copilotkit.ai/concepts/oss-vs-enterprise) and [Intelligence overview](https://docs.copilotkit.ai/intelligence/overview) were consulted as well as their repository sources. The overview explicitly says your frontend, agent, and model stay where they are. Current docs distinguish the TypeScript runtime, which can work without Intelligence, from the Python, Go, Ruby, and C#/.NET runtime implementations, which require it. That runtime-language distinction is separate from the language of an external AG-UI agent.

## 6. Supported choices and what would require a fork

| Proposed way around the dependency | Finding |
| --- | --- |
| Omit all Intelligence settings | Refused by current OpenDuet configuration. |
| Skip only the shell health/licence check | Bypasses one launcher gate, not runtime thread creation, history reads, locks, or gateway delivery. |
| Put dummy values in the required settings | Can satisfy presence checks, not successful authenticated operations. No supported functioning mode demonstrated. |
| Disable Automatic Learning, remote memory, or telemetry | Does not replace conversation storage or run coordination. |
| Supply your own model or AG-UI agent | Supported, but orthogonal to Intelligence. |
| Run branded Intelligence locally or on your own infrastructure | Documented alternative to the managed service. Still uses Intelligence and its terms. |
| Use CopilotKit OSS SSE/in-memory runtime and your own durable storage | Supported at the SDK/application-building level. Not a shipped OpenDuet mode. |
| Replace OpenDuet's Intelligence integration with OSS components or an API-compatible backend | Possible fork work, not an explicit supported no-Intelligence deployment path found in this revision. Endpoint configurability alone does not establish protocol compatibility. |

A serious replacement would have to address web history and thread lifecycle, headless turns, platform locks/run coordination, and delivery/reconnection, not just delete the `loadConfig` check. Depending on retained features, it would also need alternatives for Intelligence-backed learning, memory integration, and channel operations. This is an inferred engineering scope from the traced callers, not a tested migration recipe.

## 7. Pricing and licensing, only as relevant

- OpenDuet's [licence][O-license] is MIT. The official [OSS comparison][D-license] likewise says the SDKs and runtime are MIT, while Intelligence and Showcase have separate terms. MIT licensing of the client application does not make a separately deployed service unnecessary or put that service under the same licence.
- A mandatory Intelligence backend does **not** imply a mandatory paid plan. OpenDuet says the free Developer plan suffices. The [live pricing page](https://www.copilotkit.ai/pricing), retrieved on the source date, says free hosted Intelligence has **1,000 interactions per organization per month**. Its local Developer Edition is free for non-production use with a renewable 30-day licence.
- Self-hosting is **not accurately summarized as universally Enterprise-only**. The live pricing page offers hosted and self-hosted pay-as-you-go at **$49/month including 10,000 interactions**, with usage charges after that, and says self-hosted pay-as-you-go needs internet usage reporting. Some OpenDuet environment comments still describe production self-hosting as Enterprise. Treat that wording as inconsistent with the current pricing page, not as authoritative current commercial terms.
- The [local-evaluation documentation][D-local] describes a macOS/Docker Desktop preview. Linux with rootful Docker is accepted by the CLI but explicitly outside the verified supported preview scope. It includes saved threads and Automatic Learning but **not User Memory or Product Analytics**. That is consistent with the importance of OpenBot's local personal-memory fallback. The [licence section][D-local-license] specifies account-based evaluation licensing and renewal. Local evaluation is not a documented licence-free, account-free replacement for Intelligence.

## Verification record and limits

Evidence directory: `/tmp/openduet-verification.pHfzoT/`.

- Git status and branch checked before research; pre-existing untracked files reported before proceeding.
- Both source revisions pinned using `git rev-parse HEAD`; commit timestamps read with `git log -1 --format='%cI %s'`.
- Live first-party pages retrieved with HTTP 200, including the OSS comparison, Intelligence overview, BYO thread guide, custom model-router guide, local and production self-hosting guides, backend product page, OpenDuet product page, and pricing. HTML and extracted text are retained in the evidence directory.
- Exact `@copilotkit/runtime@1.77.0` registry archive retained as `runtime-1.77.0.tgz`; registry metadata is `runtime-1.77.0-metadata.json`; decoded source is under `sdk-extracted/`. Registry SHA-512 verification passed. Current GitHub SDK excerpts are under `sdk-github/` and are kept distinct.
- Static review covered root README and environment, root launcher and delegated startup checks, server configuration and its tests, runtime mounting, thread lookup/history, headless turn creation/locking, local database schemas, memory storage/recall, and Learning configuration.
- The sparse CopilotKit checkout initially encountered a missing `git-lfs` filter while checking out documentation images. Source-only retrieval succeeded without installing Git LFS. No image asset was needed as evidence.
- Document checks: `python /tmp/openduet-verification.pHfzoT/validate-report.py` checks all 40 line-pinned source references against local source files, reference definitions, selected exact excerpts, and the published archive's integrity. Results are saved in `report-validation.json` in the evidence directory. These are source/document checks, not runtime tests or reviewer approval.
- No exact original BYO-intelligence comment was available. The negative finding is limited to the current sources searched, not every historical comment or every possible fork.
- No runtime compatibility, outage, model call, or end-to-end test was executed, per the request. Source evidence supports the current application's dependency; it does not prove a fork or protocol-compatible replacement impossible.

[O-package]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/package.json#L17-L26
[O-quickstart]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/README.md#L90-L111
[O-providers]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/README.md#L113-L124
[O-model]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/examples/openduet/model.yaml#L1-L4
[O-agent]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/README.md#L223-L240
[O-env]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/.env.example#L147-L171
[O-config]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/config.ts#L991-L1017
[O-capabilities]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/config.ts#L30-L45
[O-load-config]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/index.ts#L357
[O-config-tests]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/tests/config.test.ts#L102-L162
[O-start-wrapper]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/scripts/start.sh#L1-L12
[O-start-health]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/scripts/start.sh#L492-L518
[O-entitlement]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/intelligence-entitlement-check.ts#L71-L88
[O-runtime]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/copilot.ts#L1782-L1823
[O-history]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/copilot.ts#L1867-L1903
[O-thread-status]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/channels/thread-status.ts#L23-L37
[O-headless-client]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/index.ts#L725-L747
[O-headless-runner]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/index.ts#L1755-L1767
[O-turn]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/toolkit/src/run-turn.ts#L712-L741
[O-lock]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/toolkit/src/run-turn.ts#L423-L442
[O-empty-history]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/toolkit/src/thread-history.ts#L20-L44
[O-channel-cache]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/db/schema/core.ts#L310-L320
[O-group-messages]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/db/schema/group.ts#L37-L58
[O-memory-store]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/memory/store.ts#L94-L111
[O-memory-create]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/memory/store.ts#L348-L377
[O-memory-retrieve]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/memory/store.ts#L763-L785
[O-memory-adapter]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/server/src/memory/intelligence.ts#L77-L135
[O-learning]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/docs/automatic-learning.md#L1-L7
[O-learning-env]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/.env.example#L191-L213
[O-learning-start]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/openbot/scripts/start.sh#L362-L374
[O-telemetry]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/README.md#L142-L144
[O-license]: https://github.com/CopilotKit/OpenDuet/blob/677e0fcd148d80b99dd788c6d6f9c1c9f40a72db/LICENSE#L1-L21
[D-oss]: https://github.com/CopilotKit/CopilotKit/blob/621f0ec65453d82e84a5b2b2ad80a575e3a6a9cc/showcase/shell-docs/src/content/docs/concepts/oss-vs-enterprise.mdx#L8-L29
[D-license]: https://github.com/CopilotKit/CopilotKit/blob/621f0ec65453d82e84a5b2b2ad80a575e3a6a9cc/showcase/shell-docs/src/content/docs/concepts/oss-vs-enterprise.mdx#L80-L83
[D-byo-threads]: https://github.com/CopilotKit/CopilotKit/blob/621f0ec65453d82e84a5b2b2ad80a575e3a6a9cc/showcase/shell-docs/src/content/docs/intelligence/bring-your-own-thread-system.mdx#L7-L31
[D-local]: https://github.com/CopilotKit/CopilotKit/blob/621f0ec65453d82e84a5b2b2ad80a575e3a6a9cc/showcase/shell-docs/src/content/docs/intelligence/self-hosting-local.mdx#L9-L41
[D-local-license]: https://github.com/CopilotKit/CopilotKit/blob/621f0ec65453d82e84a5b2b2ad80a575e3a6a9cc/showcase/shell-docs/src/content/docs/intelligence/self-hosting-local.mdx#L228-L239
[C-mode-selection]: https://github.com/CopilotKit/CopilotKit/blob/621f0ec65453d82e84a5b2b2ad80a575e3a6a9cc/packages/runtime/src/v2/runtime/core/runtime.ts#L900-L907
[C-runner]: https://github.com/CopilotKit/CopilotKit/blob/621f0ec65453d82e84a5b2b2ad80a575e3a6a9cc/packages/runtime/src/v2/runtime/core/runtime.ts#L743-L752
[C-run]: https://github.com/CopilotKit/CopilotKit/blob/621f0ec65453d82e84a5b2b2ad80a575e3a6a9cc/packages/runtime/src/v2/runtime/handlers/intelligence/run.ts#L139-L178
