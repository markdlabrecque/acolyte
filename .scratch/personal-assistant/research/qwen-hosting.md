# Qwen 3.8 identity and hosted inference

Research date: 2026-10-25, America/Vancouver. Primary-source documentation only. No API requests, runtime benchmarks, accounts, or credentials were used. This answers research ticket 15; choosing a provider and budget remains ticket 09.

## Finding

Qwen 3.8 is a verified family, but it does not identify a single model. The family includes official downloadable weights for [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B), licensed Apache-2.0; [Qwen3.8-2.4T-A95B](https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B), licensed `qwen3.8-max`; and [Qwen3.8-Flash-Next](https://huggingface.co/Qwen/Qwen3.8-Flash-Next), licensed `qwen-community-1.0`. Open weights do not imply that every variant has the same license.

The Flash-Next model card explicitly identifies QwenCloud's `qwen3.8-flash` as the official production version based on Flash-Next, with additional capabilities such as a default 1M context and built-in tools. It does not promise bit-for-bit equivalence to the downloadable checkpoint. Calling the hosted Flash deployment an open-weight-family option is supported; calling it the exact downloadable model is too strong. [Official Flash-Next card](https://huggingface.co/Qwen/Qwen3.8-Flash-Next)

For this personal assistant, QwenCloud Flash is the most promising Qwen cost candidate in the reviewed sources. That is a proposal based on documented price and API support, not measured assistant quality or a provider selection by Mark.

## Hosted options and prices

All amounts below are published USD per million tokens for ordinary real-time serverless inference, checked on the research date. These are reference quotes, not purchases or a user budget.

| Provider and model | Input | Cached input | Output | Notes |
| --- | ---: | ---: | ---: | --- |
| QwenCloud `qwen3.8-flash` | 0.15 | 0.016 implicit or explicit read | 0.47 | Explicit creation 0.20; flat row, no context price tiers shown |
| QwenCloud `qwen3.8-27b` | 0.50 | 0.10 implicit; 0.05 explicit | 3.00 | Explicit creation 0.625 |
| QwenCloud `qwen3.8-2.4t-a95b` | 2.00 | 0.25 implicit; 0.17 explicit | 6.00 | Explicit creation 2.50 |
| Together `Qwen/Qwen3.8-Flash` | 0.15 | No separate discount listed | 0.47 | Function calling and structured output documented |
| Together `Qwen/Qwen3.8-2.4T-A95B` | 2.00 | Conflicting 0.25 and 0.50 | 6.00 | Marketing/pricing says 0.25; serverless catalog says 0.50 |
| Fireworks `accounts/fireworks/models/qwen3p8-max` | 2.00 | 0.25 | 6.00 | Function calling supported; links to official 2.4T-A95B weights |

Sources: [QwenCloud price reference](https://docs.qwencloud.com/developer-guides/getting-started/model-prices), [Together pricing](https://www.together.ai/pricing), [Together serverless catalog](https://docs.together.ai/docs/serverless/models), [Fireworks model page](https://fireworks.ai/models/fireworks/qwen3p8-max). The Together Max conflict should be resolved before treating its cache rate as settled. A dash in the Flash cache column is not evidence of free cached tokens.

QwenCloud's retrieved price-reference table did not expose regional tab labels. Its billing guide explicitly says prices vary by region and deployment scope and all regions bill USD. Therefore the QwenCloud figures above remain published reference rates pending confirmation in the selected regional console. The docs use Singapore by default, but that alone does not establish a regional quote. No per-request minimum billed token count was found for text inference. Thinking tokens count toward billed output; cache eligibility is a separate condition. [Billing guide](https://docs.qwencloud.com/developer-guides/getting-started/pricing)

Singapore stores data there and runs inference outside mainland China. Virginia has separate Global and US scopes; Global may run on nodes including mainland China. Keys, endpoints, workspaces, and model lists are regional. Region and scope need an explicit choice before activation. [Regions and scopes](https://docs.qwencloud.com/developer-guides/getting-started/regions)

Together's quoted rows are standard serverless, not its geography-specific premium endpoints. Its catalog states serverless has no minimum cost. The reviewed US-only and Canada-only model lists do not include these Qwen variants. [Serverless catalog](https://docs.together.ai/docs/serverless/models)

## Cache behavior

QwenCloud uses prefix matching. Both explicit and implicit caching require at least 1,024 tokens. Implicit caching is automatic with no guaranteed hit or fixed retention; cache generation, eviction, and scheduling matter. Explicit caching uses markers, expires after five minutes without a hit, and refreshes on a hit. Creation completes after the response. Up to four markers and a 20-content-block lookback apply. Models and accounts isolate caches. Inspect response `cached_tokens` and `cache_creation_input_tokens`; meeting the threshold is insufficient. Explicit and implicit modes are mutually exclusive for Chat Completions. Use the model-specific rates above rather than generic percentage discounts. [QwenCloud context cache](https://docs.qwencloud.com/developer-guides/run-and-scale/context-cache)

Together caching is automatic. It matches rendered prompt tokens, including tools and reasoning settings. Entries typically last about an hour, best effort, and heavy load can evict them sooner. Minimum prefix length varies by model. A stable `prompt_cache_key` groups related requests for routing but cannot ensure hits. No caller-set expiry is available. Count hits from response usage; do not infer a billing discount when the model's rate table lacks one. [Together prompt caching](https://docs.together.ai/docs/inference/chat/prompt-caching)

Fireworks caching is automatic and requires exact prefixes. Reuse occurs within one replica; `user` or `x-session-affinity` helps route a conversation consistently. Lifetime is usually at least several minutes and can reach hours depending on model, load, and deployment, with oldest entries evicted first. These are provider descriptions, not a fixed TTL promise. [Fireworks prompt caching](https://docs.fireworks.ai/guides/prompt-caching)

Planning implications: put stable instructions and tool schemas first, with timestamps and new mail/calendar data afterward. Ordinary conversations within minutes have more reuse opportunities than isolated checks hours apart. Five-minute recurring checks sit at QwenCloud's explicit expiry boundary, so jitter and response timing can cause paid cache recreation. Switching models or providers requires a new cache. Do not add requests solely to keep a cache warm. Poll connectors and compare changes without an LLM; invoke inference when interpretation or a digest is needed. These are design inferences, not measured hit rates.

## Assistant fit and reliability evidence

QwenCloud documents function calling, structured output, context caching, and a 1M context for Flash. Thinking defaults to `xhigh`; it can be lowered or disabled. Its guide says multi-turn tool use should preserve `reasoning_content`. Those contracts make it a plausible email/calendar/todo assistant candidate, subject to later task-specific verification. Qwen's Toolathlon and office-work benchmarks are vendor-reported evaluations and do not establish Mark's workflow accuracy, prompt-injection resistance, or production availability. [Flash documentation](https://docs.qwencloud.com/developer-guides/getting-started/latest-model)

Together's provider-run status page reported Qwen3.8-2.4T-A95B at 99.794% uptime over the displayed 30-day window when retrieved, with the page updated October 25, 2026. That is published monitoring evidence for Max on Together, not Flash uptime, an independent audit, or a future guarantee. [Together status](https://status.together.ai/)

Fireworks' status page listed Qwen 3.8 Max and said serverless was operational. The retrieved page did not expose a numeric model uptime history. [Fireworks status](https://status.fireworks.ai/)

No comparable public QwenCloud model-level measured uptime series was located in this bounded review. Published capability claims cannot fill that gap. No provider has been proven reliable for this assistant through this research.

## Recommendation and unresolved choice

Shortlist QwenCloud `qwen3.8-flash` against the separately researched DeepSeek candidate. It has the strongest documented low-cost Qwen cache offer reviewed here. Use uncached cost as the conservative planning estimate until real usage reports show hit rates. Together Flash is a credible same-base-price alternative with documented tool support, but the available price table gives no cache discount. Max on Together or Fireworks is a more expensive option whose quality benefit for this personal workflow remains unmeasured.

Mark still needs to choose the exact Qwen variant if selecting Qwen, provider, region/scope, monthly budget, budget-exhaustion behavior, and whether any fallback is manual or automatic. Research does not authorize automatic switching. Confirm the regional quote and settle any relevant license or hosted-model equivalence requirement before committing to a provider.
