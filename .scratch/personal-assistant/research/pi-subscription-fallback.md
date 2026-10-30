# Pi subscription fallback evidence

## Superseding owner confirmation, 2026-10-25

The owner identified `pi-claude-subscription` as their own extension and confirmed that it works and has been thoroughly tested. The local project at `/Users/mark/Projects/pi-claude-subscription` identifies its repository as `markdlabrecque/pi-claude-subscription`; its README describes Claude Code CLI subprocess inference with Pi-owned tool execution. Accept the owner’s confirmation for planning. This session did not rerun their tests. The resolved [fallback ticket](../issues/16-verify-pi-subscription-fallback.md#answer) records the outcome; activation follows the already confirmed budget policy.

The research below is historical and investigated a different candidate before this correction. Its statements that the intended extension or activation policy are unknown, and its recommendation to keep compatibility research open, are superseded. It must not be used to reopen the owner-confirmed fallback.

## Historical research (superseded candidate) 

Researched 2026-10-25 using public first-party documentation and project source. No software was installed or executed, no model requests were made, and no credentials, auth files, or account settings were inspected. Findings establish a candidate and integration gaps, not a working fallback. Mark's subscription tier and intended extension remain unknown.

## Recommendation

Keep Claude as a manually selected fallback candidate. Do not budget it as unlimited or automatically switch to it. Evaluate the genuine Claude Code/Agent SDK path if a subscription fallback remains desirable. If Mark already has an eligible Max plan, included API credits may provide a simpler standard API route; this is an option to discuss, not an approved configuration or purchase.

## Extension identity

The strongest matching candidate found is Eli Dickinson's `pi-claude-bridge`, npm package `pi-claude-bridge`, provider `claude-bridge`. Its README describes a Pi coding-agent extension using the Claude Agent SDK to run Claude Code, forwarding Pi tools through that integration. It requires Pi 0.86.1 or newer. This is a candidate identified through public research, not confirmation of the extension Mark meant or has installed. [Project README](https://github.com/elidickinson/pi-claude-bridge)

The inspected manifest reports version 0.9.3, Agent SDK dependency `^0.3.308`, and peers `@earendil-works/pi-ai`, `@earendil-works/pi-coding-agent`, and `@earendil-works/pi-tui` at `>=0.86.1`. Development dependencies use Pi `^1.2.0`. These version ranges do not prove a tested Pi 1.4.0 combination. [Manifest](https://github.com/elidickinson/pi-claude-bridge/blob/main/package.json)

Do not confuse it with Beau Gunderson's identically named GitHub repository, which implements local cross-session messaging rather than a Claude inference provider. [Other project's README](https://github.com/beaugunderson/pi-claude-bridge)

Direct subscription-token extensions also exist. `inhumanxd/pi-claude-subscription` supplies its own OAuth login and Claude Code request identity, and explicitly describes third-party subscription-token use as unsupported. `spksoft/pi-sub-anthropic` similarly describes fingerprint emulation and warns of account restrictions and breakage. Neither is the recommended route. [Direct extension](https://github.com/inhumanxd/pi-claude-subscription), [fingerprint extension](https://github.com/spksoft/pi-sub-anthropic)

## Compatibility with this project

The project's existing dependency research selects candidate `@earendil-works/pi-durable` and `@earendil-works/pi-ai` 1.4.0 pins, without approving or testing them. [Existing dependency contract](pi-durable-contract.md)

Bridge source imports coding-agent `ExtensionAPI`, `ExtensionContext`, `ExtensionUIContext`, `buildSessionContext`, and TUI types. It also imports Agent SDK `query` and session-file helpers. This establishes dependence on the coding-agent host and session lifecycle, beyond a standalone Pi AI transport. [Bridge source](https://github.com/elidickinson/pi-claude-bridge/blob/main/src/index.ts)

Durable documents extensions through `defineExtension`, a process-owned registry, and tools, sections, hooks, wrappers and tasks. Its Harness receives a model collection. That is a different documented integration contract. A coding-agent extension's declared Pi version range alone does not show it can load into the Durable Harness. [Durable README](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md)

No direct Durable adapter, tested Durable 1.4.0 pairing, or guarantee that the bridge preserves this application's durable tool intent and approval boundaries was established. A provider adapter may be technically feasible, but is a future design and test question. Do not treat the extension as a drop-in fallback. The pinned Pi AI README could not be retrieved in this session; current source evidence must not be represented as verification of the exact published 1.4.0 package.

## Subscription support and authentication

Anthropic's October 7, 2026 update says Agent SDK, `claude -p`, and third-party app usage can still draw from subscription limits. Its earlier announced change was paused. Therefore an older blanket claim that all SDK subscription use is prohibited would be inaccurate. [Official subscription update](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)

Anthropic documents a narrower authentication boundary: ordinary subscription use of unmodified Claude Code is supported, including an end user signing in when a platform hosts it. Developers must not collect, store or intermediate Claude account credentials or offer their own Claude account login. Products should normally use API credentials; advertised subscription limits assume ordinary individual usage of Claude Code and the Agent SDK. This supports investigating an unmodified binary/SDK route, not impersonating its wire identity or endorsing every bridge transformation. [Authentication and credential restrictions](https://code.claude.com/docs/en/legal-and-compliance)

For the proposed fallback, authentication should remain in Anthropic's own Claude Code flow. Actual login, token refresh, selected billing mode and unattended operation were not tested. No auth files were read.

## Limits and budget implications

Pro and Max share five-hour and weekly usage limits across Claude and Claude Code. Account activity elsewhere reduces capacity available to this assistant. Limits are not a fixed published pool of inference tokens for this workload. [Official Pro/Max guide](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan), [usage factors](https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work)

If usage credits are enabled, requests after plan limits can continue at standard API pricing until the configured monthly cap or available balance is exhausted. Subscription access therefore does not by itself guarantee zero incremental cost. Mark has not authorized usage credits, automatic switching, or purchases. [Official usage-credit behavior](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans)

Eligible Max 5x and Max 20x plans include $100 and $200 in monthly API credits respectively. Pro is ineligible. Claiming requires linking a Console organization; credits expire each billing cycle, are shared by that organization, and remain separate from subscription limits. API requests stop when these credits run out only if no purchased balance or automatic reload can fund further use. These credits cover the Messages API and SDK usage authenticated with that organization's API key; they do not cover interactive Claude Code or its usage-credit overages. Mark's plan and eligibility were not inspected. [Official API-credit details](https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans)

No RPM/TPM guarantee, uptime commitment, or reliable unattended fallback capacity for this subscription route was established. The bridge documents session reconstruction and cache behavior that depend on process/session continuity. Its maintainer's measurements are project-specific evidence, not benchmarks for this assistant or promised cache hits. [Bridge known issues](https://github.com/elidickinson/pi-claude-bridge/blob/main/README.md)

## Decisions still needed

- Confirm the extension Mark intended and whether his plan is Pro, Max 5x, Max 20x, or another tier.
- Decide whether to evaluate subscription-backed Claude Code/SDK, eligible included API credits, or defer Claude integration.
- Define the monthly paid-inference ceiling and what happens at that ceiling or when a provider is unavailable. No automatic switch is approved.
- If integration is pursued later, prove the exact pinned adapter preserves tool execution ownership, approvals, restart behavior and billing-mode controls before enabling it.
