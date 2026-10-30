# Verify the Pi Durable dependency contract

ID: 02
Parent: [Personal assistant implementation decision map](../map.md)
Labels: wayfinder:research
Type: research
Status: resolved
Assignee: mark
Blocked by: none

## Question

What do current primary sources establish about Pi Durable package identity, released or commit-pinned versions, Node/SQLite compatibility, reopen/resume, durable submissions, tool replay, extension hooks, and background wakeups? Identify the smallest application-owned records and missing guarantees relevant to the PRD. Provide source-backed candidates and an isolated recovery experiment plan; distinguish documented claims from executed tests. If core requirements demand substantial extra machinery, identify the explicit dependency decision needed.

## Answer

Research completed on 2026-10-23. [Pi Durable dependency contract](../research/pi-durable-contract.md) records published 1.4.0 candidate pins, a fixed source snapshot, durable scheduling and replay behavior, payload-deduplication and SQLite durability gaps, and an isolated experiment plan. No runtime or recovery tests were executed; dependency acceptance remains open.
