# Verify Qwen 3.8 identity and hosting

ID: 15
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:research
Type: research
Status: resolved
Assignee: mark
Blocked by: none

## Question

Verify the exact user-supplied Qwen 3.8 identity and availability using primary sources. Do not silently substitute another model. If verified, compare hosting, tool use, caching, pricing, and reliability. If not verified, document that limitation and clearly label any nearby alternatives.

Planning research only. Use primary sources, save evidence under `research/`, and record the answer here. No credentials, installations, production access, or live tests.

## Answer

Resolved 2026-10-25 as bounded documentation research. [Evidence and sources](../research/qwen-hosting.md).

Qwen 3.8 is verified as a family with published open weights, not one exact endpoint. QwenCloud Flash is based on the open-weight Flash-Next variant and has a documented low-cost cache offer. Published reference rates are USD 0.15 input, 0.47 output, 0.016 cache read, and 0.20 explicit creation per million tokens. The retrieved pricing table did not identify its regional tab, so the chosen region's quote remains to be confirmed. Together and Fireworks provide additional verified hosting options; Together Max's published cached rates conflict.

Cache lifetimes and routing differ by provider. QwenCloud explicit caching expires after five minutes without a hit; implicit retention is unspecified. Together documents roughly one hour best effort; Fireworks documents minutes to hours depending on load and deployment. No hit rate or assistant quality was measured. Together publishes a Max-specific uptime history; equivalent QwenCloud evidence was not found.

Provider, exact model, region, budget, and fallback policy remain owner decisions in ticket 09. No deployment, purchase, API test, or automatic switching was performed or authorized.
