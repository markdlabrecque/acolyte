# Verify DeepSeek V4 Flash hosting and caching

ID: 14
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:research
Type: research
Status: resolved
Assignee: mark
Blocked by: none

## Question

Verify the exact user-supplied DeepSeek V4 Flash identity, open-weight release, actual hosted providers, tool use, cache eligibility and behavior, retention, routing, current prices, and published reliability evidence. Distinguish documentation from runtime measurements.

Planning research only. Use primary sources, save evidence under `research/`, and record the answer here. No credentials, installations, production access, or live tests.

## Answer

Research completed 2026-10-25 in [DeepSeek hosting and caching](../research/deepseek-hosting.md).

The named V4 Flash is verified, with MIT open weights and a dated 0731 release. DeepInfra directly documents that exact release, tool calling, and USD rates of $0.06 uncached input, $0.015 cached input, and $0.18 output per million tokens. DeepSeek's own service has retired V4 Flash and maps its old identifier to V4.1 Flash 1017. The notes compare these distinct versions and other verified routes without treating them as interchangeable.

Automatic caching is documented but measured hit rates are unknown. DeepInfra's separate paid fixed-window retention does not list DeepSeek as supported. Published recent uptime evidence does not prove reliability for Mark's assistant. Exact provider choice, budget, and switching policy remain decisions in the parent planning ticket; no account, runtime, or schedule was changed.
