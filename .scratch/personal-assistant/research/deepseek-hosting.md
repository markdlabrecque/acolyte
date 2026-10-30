# DeepSeek hosting and caching

Research date: 2026-10-25. Planning evidence only. No inference calls, benchmark runs, purchases, credentials, or installations. Prices are USD per million tokens, excluding taxes and currency conversion.

## Recommendation

DeepInfra's fixed `deepseek-ai/DeepSeek-V4-Flash-0731` is the clearest low-cost candidate matching Mark's named V4 Flash preference. It has documented tool support and inexpensive uncached input, so its value does not depend on optimistic cache assumptions. Treat it as a candidate for later assistant testing, not a proven reliable choice.

DeepSeek direct is a reasonable comparison if Mark accepts the newer V4.1 Flash. Do not silently choose it as V4 Flash: the direct service has retired the old model and reroutes its old name. DeepInfra also hosts the newer 1017 snapshot. No model or provider selection, fallback policy, or budget is approved by this research.

## Exact identities

- `DeepSeek-V4-Flash` exists as an official MIT-licensed open-weight release. The `DeepSeek-V4-Flash-0731` release supersedes the preview; these are distinct snapshots. The official 0731 card reports agent benchmarks, including Toolathlon-Verified 70.3 and AutomationBench Public 25.1. These are publisher evaluations, not evidence of this personal assistant's accuracy. [Original model](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash), [0731 model card](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731).
- DeepSeek direct currently recommends `deepseek-flash`, serving `DeepSeek-V4.1-Flash-1017`. The legacy `deepseek-v4-flash` identifier remains accepted but maps to this newer model. [Direct model/pricing table](https://api-docs.deepseek.com/quick_start/pricing/).
- V4.1 Flash also has MIT-licensed published weights, but is a separate generation. [Official V4.1 model card](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash).

## Provider prices and availability

| Route and advertised version | Uncached input | Cached input | Output | Evidence and qualification |
| --- | ---: | ---: | ---: | --- |
| DeepInfra direct, V4 Flash 0731, standard | $0.06 | $0.015 | $0.18 | Fixed versioned model ID, FP8, function calling and JSON listed. [Model page](https://deepinfra.com/deepseek-ai/DeepSeek-V4-Flash-0731) |
| DeepInfra via OpenRouter, V4 Flash 0731 | $0.06 | $0.015 | $0.18 | Same advertised rates; gateway fees apply separately. [Router provider table](https://openrouter.ai/deepseek/deepseek-v4-flash-0731) |
| DeepSeek direct, V4.1 Flash 1017, off-peak | $0.15 | $0.003 | $0.60 | Current rolling `deepseek-flash` alias. [Direct pricing](https://api-docs.deepseek.com/quick_start/pricing/) |
| DeepSeek direct, V4.1 Flash 1017, peak | $0.30 | $0.006 | $1.20 | Peak weekdays 01:00–04:00 and 06:00–10:00 UTC, excluding Chinese public holidays. All other times off-peak. [Direct pricing](https://api-docs.deepseek.com/quick_start/pricing/) |
| DeepInfra direct, V4.1 Flash 1017, standard promotion | $0.098 | $0.003 displayed, rounded | $0.294 | Advertised 51% discount; underlying base rates $0.20/$0.006/$0.60. The page does not state an end date. [1017 model page](https://deepinfra.com/deepseek-ai/DeepSeek-V4.1-Flash-1017) |
| DeepInfra via OpenRouter, V4.1 Flash 1017 promotion | $0.098 | $0.00294 | $0.294 | Router exposes more cache-price precision. Keep route-specific prices separate. [1017 provider table](https://openrouter.ai/deepseek/deepseek-v4.1-flash-1017) |
| Fireworks direct, V4.1 Flash without 1017 suffix | $0.22 | $0.007 | $0.66 | Serverless model `accounts/fireworks/models/deepseek-v4p1-flash`; not verified as the 1017 snapshot. [Fireworks model page](https://fireworks.ai/models/deepseek-ai/deepseek-v4p1-flash) |

DeepInfra's API example explicitly sends `deepseek-ai/DeepSeek-V4-Flash-0731`; availability is verified from its native documentation, not inferred from OpenRouter. The dated name identifies the advertised snapshot, not an immutable-weights service guarantee. [Native API documentation](https://deepinfra.com/deepseek-ai/DeepSeek-V4-Flash-0731/api).

DeepInfra's unsuffixed V4.1 page has a different 30% promotion and different rates. Do not use it to price 1017. [Unsuffixed V4.1 page](https://deepinfra.com/deepseek-ai/DeepSeek-V4.1-Flash). Fireworks' direct unsuffixed model and OpenRouter's Fireworks 1017 route also differ, so neither price should be copied to the other route.

OpenRouter adds 5.5% when buying Standard credits, rather than per request. Its fee announcement and current agent guide state a $0.80 minimum for card purchases; small top-ups therefore cost proportionally more. Its pricing page says no contractual SLA on Standard. [Pricing](https://openrouter.ai/pricing), [Fee details](https://openrouter.ai/blog/simplifying-our-platform-fee/), [Current agent guide](https://openrouter.ai/blog/tutorials/any-coding-agent/).

## Caching behavior

DeepSeek direct automatically caches prefixes. Current rules require a fully matching persisted prefix unit. Request boundaries create units; detecting a common prefix across requests can create another. Thus `A+B`, then `A+C` can both miss before `A+D` reuses A. Cache construction takes seconds. Retention is best effort, usually hours to days after last use, with no fixed TTL or hit guarantee. Usage reports `prompt_cache_hit_tokens` and `prompt_cache_miss_tokens`. The current page gives no numeric minimum length or fixed interval size. [DeepSeek caching](https://api-docs.deepseek.com/guides/kv_cache/).

DeepInfra automatic caching matches recent prefixes on the same model and account. Its examples explicitly use V4 Flash 0731. It reports `usage.prompt_tokens_details.cached_tokens` and accepts `prompt_cache_key` for a session. The document gives no numeric inactivity expiry or minimum prefix length. Its claim that a key can share cache despite formatting differences should not be read as permission to bill changed input as cached; count actual usage. Keep reusable instructions and tools stable, and changing mail/calendar data at the end. [DeepInfra automatic caching](https://docs.deepinfra.com/chat/prompt-caching).

DeepInfra separately documents paid 5-minute and 1-hour retention, but only lists Nemotron-3-Ultra and Kimi-K2.7-Code as supported. DeepSeek is absent. Unsupported models ignore `prompt_cache_options`; do not assume those retention windows apply to either Flash version. The general retention write premiums are 1.25 times input for 5 minutes and 2 times input for 1 hour, with charges on extension as well as creation. They are not included in the Flash estimates. [Retention support and pricing](https://docs.deepinfra.com/chat/prompt-cache-retention).

Fireworks automatically caches exact prefixes, including tool descriptions. Cache resides within one replica; `user` or `x-session-affinity` helps route a session there. Its documentation says entries normally survive several minutes and sometimes hours depending on load/configuration. This is not a fixed TTL. [Fireworks caching](https://docs.fireworks.ai/guides/prompt-caching).

OpenRouter uses provider stickiness. `session_id` activates it on the first successful request; without it, a cache hit must first occur. Stickiness expires after 10 minutes idle. Manual provider ordering takes priority, and an unavailable provider can trigger fallback. Provider stickiness is not the underlying cache TTL. A five-minute check cadence may preserve affinity, but skipped checks or quiet periods can break it. The generic DeepSeek section still says cache reads cost 0.1 times input; this conflicts with the specific provider tables above, so use endpoint-specific prices. [Router cache documentation](https://openrouter.ai/docs/guides/best-practices/prompt-caching).

## Assistant suitability and operational evidence

DeepSeek documents tool calls in thinking and non-thinking modes. The client executes the requested function; this is the required boundary for email/calendar actions. JSON output and a large context window do not establish correct dates, recipient selection, or safe repeated execution. [Tool call documentation](https://api-docs.deepseek.com/guides/tool_calls/).

Direct Flash enables thinking at high effort by default. With tools, its current documentation asks clients to preserve prior `reasoning_content`; this can increase subsequent input. Cost examples must count billed reasoning output, not only visible answer text. A later evaluation should compare disabled/low thinking for simple triage against higher effort for ambiguous requests. This is a proposed experiment, not an approved routing policy. [Thinking mode](https://api-docs.deepseek.com/guides/thinking_mode/).

DeepInfra publishes a Pi custom-provider integration, including `supportsDeveloperRole: false` and `thinkingFormat: "deepseek"`. Its example uses an unsuffixed V4 identifier and older-looking local cost values, so copy neither model identity nor prices blindly. Pi configuration and real tool-round compatibility remain untested here. [Pi integration](https://docs.deepinfra.com/integrations/pi).

The direct DeepSeek status page currently displays 99.47% uptime for V4.1 Flash. Its extracted page does not establish the percentage's reporting window, so do not annualize it or compare it directly with another provider's figure. Direct API documentation also allows queueing and closes a connection if inference has not begun after 10 minutes. This makes time-sensitive reminder delivery unsuitable for dependence on a fresh LLM response. [Status](https://status.deepseek.com/), [Rate limits and queue behavior](https://api-docs.deepseek.com/quick_start/rate_limit/).

OpenRouter's model pages publish recent observed endpoint uptime and latency. The captured 0731 table showed DeepInfra 100%; the 1017 table showed DeepInfra standard 99.42%, while its Flex route showed 84.40%. Those are router observations over limited recent activity, not our measurements or guarantees. Model-level reachability is labelled three days and should not be mistaken for successful completion of every request. [0731 observations](https://openrouter.ai/deepseek/deepseek-v4-flash-0731), [1017 observations](https://openrouter.ai/deepseek/deepseek-v4.1-flash-1017).

DeepInfra links a public status site, but attempts to fetch it timed out in this research. No native uptime percentage or self-serve SLA was verified. Low prices alone are insufficient reliability evidence. [Official status link](https://status.deepinfra.com/).

## Cost interpretation and remaining evidence

Use the formula `uncached_input × input_rate + cached_input × cache_rate + billed_output × output_rate`, with tokens expressed in millions. Show zero-cache as well as partial-cache cases. Separate a repeatable prefix from changing retrieved information and include all tool-loop turns and reasoning in the assumptions. Promotions and gateway fees require separate treatment.

Recommendation for the personal assistant: poll email/calendar changes and deliver stored reminders without asking a model when no interpretation is needed. Call the model for new content, triage, summaries, and conversational requests. A heartbeat is not inherently an inference call. This is an architectural cost-saving inference, not a claim about implemented code.

Before committing to a provider, test representative email triage, calendar ambiguity, tool arguments, and repeated-action handling in the eventual allowed test environment. Measure cache usage, billed tokens, timeouts and latency there. This research establishes advertised availability and documented mechanics only.
