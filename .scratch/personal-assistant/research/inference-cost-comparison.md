# Inference candidates and illustrative monthly costs

Research date: 2026-10-25. Planning only. No purchases, credentials, installations, model requests, runtime benchmarks, or live schedules. The owner has not chosen a provider, a dollar budget, or automatic switching.

## Owner preferences

Prefer a hosted open-weight model from a reliable provider with effective prompt caching and low total cost. User-supplied candidates are DeepSeek V4 Flash and Qwen 3.8. Claude subscription access through a Pi extension is the fallback preference, subject to verification.

## Cost assumptions

These are illustrative workloads, not observed usage, a forecast, a spending cap, or an approved budget. USD throughout. One 30-day month, one personal assistant. All output counts include any billed reasoning tokens; actual reasoning output can increase costs substantially.

| Work | Light use | More active use | Tokens per model call |
| --- | --- | --- | --- |
| Owner requests | 10 requests/day, 2 model calls each | 30 requests/day, 3 model calls each | 6,000 repeatable prefix + 2,000 changing input; 500 output light or 800 active |
| New email triage | 60 new emails/day across both mailboxes, one call each | Same | 6,000 prefix + 1,000 changing input + 200 output |
| Digests | 3/day | Same | 6,000 prefix + 4,000 changing input + 800 output |

The repeated prefix represents instructions and tool definitions. Changing input represents user messages, retrieved content, and average conversation/tool context. The assumptions do not charge the same email for triage repeatedly. Additional calendar analysis, long threads, large attachments, retries, repeated inference after interruption, extra agents, and longer reasoning increase usage. Triage each new email at the next check so urgent classification does not wait for a batch. Several messages arriving together could share a call, but these examples do not rely on that saving.

| Monthly total | Light use | More active use |
| --- | ---: | ---: |
| Model calls | 2,490 | 4,590 |
| Repeatable prefix tokens | 14.94 million | 27.54 million |
| Changing input tokens | 3.36 million | 7.56 million |
| Billed output tokens | 0.732 million | 2.592 million |

Cache scenarios apply to the repeatable prefix only. All changing input is billed as an uncached miss. A 90% prefix hit scenario is optimistic sensitivity analysis, not a promised hit rate or 90% caching of all input.

Cost = uncached input tokens × miss rate + cached prefix tokens × hit rate + billed output tokens × output rate, with tokens and rates expressed per million. The zero-hit case is useful for choosing a budget without depending on caching.

## Avoid spending on unchanged checks

The confirmed five-minute check target implies 288 checks per source per day. Treating Gmail, Proton, and Calendar as three logical sources yields 25,920 source checks in 30 days. This is a cadence illustration, not a provider API-call count; pagination, per-calendar requests, retries, and change notification support affect actual requests.

Proposed design: connectors detect changes using supported cursors or watermarks; an unchanged result does not call the model. Deterministic reminder delivery and known calendar time comparisons also need no model call. Use inference for new content requiring interpretation, user requests, drafting, and digest composition. Do not send artificial keep-alive model requests merely to preserve a cache.

This preserves the agreed background-check cadence and notification rules. It is a proposed implementation approach, not an implemented integration or a change to those decisions.

## Provider comparison

| Candidate | Uncached input / cached input / output, USD per million | Assistant and cache evidence | Reliability limitation |
| --- | --- | --- | --- |
| DeepInfra `deepseek-ai/DeepSeek-V4-Flash-0731` | $0.06 / $0.015 / $0.18 | Fixed advertised V4 snapshot, MIT weights, tool calling and JSON documented; automatic cache has no documented fixed expiry | No native model uptime percentage or self-serve SLA verified; recent router observations are too limited to establish dependable operation |
| QwenCloud `qwen3.8-flash` | $0.15 / $0.016 / $0.47 reference quote | Based on open-weight Flash-Next, with hosted production additions; tools and structured output documented; implicit cache best effort | Regional quote needs confirmation; no comparable model-level uptime series located |
| Together `Qwen/Qwen3.8-Flash` | $0.15 / no discount listed / $0.47 | Tools and structured outputs documented; caching typically about one hour best effort | Published uptime retrieved for Qwen Max does not establish Flash reliability |

Sources: [DeepInfra exact model](https://deepinfra.com/deepseek-ai/DeepSeek-V4-Flash-0731), [DeepInfra cache](https://docs.deepinfra.com/chat/prompt-caching), [QwenCloud pricing](https://docs.qwencloud.com/developer-guides/getting-started/model-prices), [QwenCloud Flash documentation](https://docs.qwencloud.com/developer-guides/getting-started/latest-model), [Together catalog](https://docs.together.ai/docs/serverless/models). Detailed evidence: [DeepSeek hosting](deepseek-hosting.md), [Qwen hosting](qwen-hosting.md).

DeepSeek direct is a distinct alternative: its old `deepseek-v4-flash` identifier now resolves to V4.1 Flash 1017. Do not silently use it as the requested V4 Flash. The provider publishes off-peak USD $0.15/$0.003/$0.60 and peak $0.30/$0.006/$1.20 for input/cache/output. DeepInfra also advertises a promotional 1017 endpoint. These are documented in the DeepSeek note but not used in the V4 cost table. [DeepSeek current identities and prices](https://api-docs.deepseek.com/quick_start/pricing/)

## Monthly inference examples

| Provider and workload | No cache hits | 50% prefix hits | 90% prefix hits |
| --- | ---: | ---: | ---: |
| DeepInfra V4 Flash 0731, light | $1.23 | $0.89 | $0.62 |
| DeepInfra V4 Flash 0731, active | $2.57 | $1.95 | $1.46 |
| QwenCloud Flash reference quote, light | $3.09 | $2.09 | $1.29 |
| QwenCloud Flash reference quote, active | $6.48 | $4.64 | $3.16 |

QwenCloud numbers use automatic implicit caching, not explicit cache creation. Explicit cache creation costs $0.20 per million tokens and has a five-minute inactivity expiry; it needs a separate write/read model and can be a poor fit when calls are five minutes apart or less frequent. DeepInfra's paid retention feature does not list DeepSeek as supported. Neither provider's ordinary implicit cache has a guaranteed hit rate. [QwenCloud caching](https://docs.qwencloud.com/developer-guides/run-and-scale/context-cache), [DeepInfra retention support](https://docs.deepinfra.com/chat/prompt-cache-retention)

These figures exclude hosting, backup storage, subscription fees, taxes, currency conversion, account funding minimums, and router payment fees. They are calculated consumption costs, not total operating cost or cash required to open/fund an account. Together Flash has no separately listed cached-token discount, so use the Qwen no-hit column for its base-rate illustration. All prices need rechecking before activation.

## Recommendation

Use DeepInfra's versioned V4 Flash 0731 as the first implementation candidate to evaluate. It matches the user's named family and stays cheap even with no cache hits. Keep QwenCloud Flash as the comparison candidate, pending the selected region's quote and whether the hosted derivative satisfies the owner's open-weight preference. This is a recommendation, not a recorded owner selection. The dated DeepInfra ID is an advertised snapshot, not a guarantee of perpetual availability or immutable hosted weights.

Prefer one direct provider endpoint initially so routing does not silently change the model/provider or break cache locality. Keep a stable instruction/tool prefix and put timestamps, mail, calendar changes, and other dynamic content afterward. Record returned usage and cache counts; budget conservatively using misses until actual observations support a hit rate. Do not assume a third-party Pi coding-agent integration proves compatibility with the selected Pi Durable stack.

The documented tool interfaces make both candidates plausible. They do not establish accuracy on Mark's mail, correct calendar arguments, safe treatment of hostile retrieved content, or reliable service. Later implementation verification should measure those tasks, cache hits, reasoning tokens, retries, and latency on the chosen provider. No comparative runtime result exists yet.

## Claude subscription fallback

Current Anthropic documentation permits subscription usage through the Claude Agent SDK and unmodified Claude Code. That does not establish compatibility with Pi Durable. The identified candidate, Eli Dickinson's `pi-claude-bridge`, targets the Pi coding-agent's extension and session interfaces; no direct adapter or tested pairing with the selected Durable/Pi AI 1.4.0 stack was established. It is not confirmed as the extension the owner intended. [Official subscription update](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), [bridge project](https://github.com/elidickinson/pi-claude-bridge), [full evidence](pi-subscription-fallback.md)

Subscription quotas are shared with other Claude usage and are not unlimited fallback capacity. Paid overage settings and eligible Max-plan API credits are separate billing paths. The owner's plan tier and billing mode remain unknown. Keep Claude as a fallback candidate requiring an explicit owner selection and compatibility work; automatic switching remains unauthorized. The subscription research ticket stays claimed because extension identity and Durable compatibility remain unresolved.

## Remaining owner decisions

- Choose an exact model and host. If choosing QwenCloud, also choose region/scope and confirm its quote. If choosing DeepSeek direct, explicitly accept the newer V4.1 model rather than treating the legacy alias as V4 Flash.
- Set a monthly inference budget and currency, then decide whether reaching it warns or pauses AI work. Hosting and backup costs are separate until their design is known.
- Decide whether and when a fallback can run. The owner has expressed a Claude subscription fallback preference but has not authorized automatic switching. Subscription feasibility and account limits require a separate compatibility conclusion.
- Set finite model-call, tool-step, time, retry, queue, and context limits. Provider queue limits are not an acceptable substitute for the application's own bounds.
- Set retention, backup/restore targets, and diagnostic visibility in the still-open operational-budget discussion.

The DeepSeek and Qwen research tickets are resolved. Subscription compatibility research remains claimed. The inference and operational-budget decision remains claimed and unresolved.
