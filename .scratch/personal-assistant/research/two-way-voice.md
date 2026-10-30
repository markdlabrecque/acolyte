# Two-way voice for the personal agent

Research checked 25 October 2026 against primary documentation. This is a design comparison, not a runtime test or an approved implementation decision. No credentials were read, services connected, purchases made, or PRD requirements changed.

## Recommendation

For live conversation, evaluate a small browser voice interface connected to the existing durable agent. Keep Slack for conversation history, notifications, and the already required approval buttons. Use a replaceable speech-to-text → durable text agent → text-to-speech pipeline as the low-cost default. Compare it with GPT-Live client delegation if natural full-duplex conversation justifies an additional US$3 per connected hour. Start with one agent and push-to-talk; add automatic turn detection and interruptions after measuring the basic path.

If remaining entirely inside Slack matters more than a live call, audio clips are a supported, much simpler intermediate step. Slack Huddles automation is unsuitable as the production foundation. Discord is technically viable but adds another communication service and requires a new product decision.

These recommendations follow the project's current constraints: Omarchy/systemd, DeepSeek through a replaceable direct provider adapter, existing durable sessions, owner-only commands, exact calendar approvals in Slack DMs, prohibited email sending, and a US$10 monthly model allowance. A separate voice UI, speech charges, audio retention, and voice turn accounting are not yet approved in the PRD.

## Configurable voice mode for custom Pi

For a Codex/Claude-like voice mode, keep Pi as the sole task agent and add a voice sidecar. Configure microphone/transport, transcription model and language, push-to-talk versus automatic turns, endpointing, speech provider/model, voice, pace, pronunciation, and interruption policy independently. Keep task behavior, tools, permissions, and durable work in Pi instructions; keep spoken brevity, acknowledgments, tone, and delivery style in the speech frontend. A plain TTS pipeline speaks Pi text directly; a conversational frontend such as GPT-Live can paraphrase, so retain the canonical answer and the spoken transcript separately. Expose these as named settings rather than baking one speech provider into the Pi model adapter. The Pi coding agent documents a JSONL RPC mode (`--mode rpc`) for external program control, which is a potential bridge for an interactive custom-Pi client. This must not be confused with the separate Pi Durable request/session adapter required by this project; coding-agent RPC does not establish durable admission or recovery semantics. [Pi coding-agent RPC](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/rpc.md). The voice sidecar boundary is a proposed integration, not a built-in Pi Durable feature verified here.

## Options

| Approach | Experience | Preserves DeepSeek agent? | Main tradeoff | Assessment |
|---|---|---|---|---|
| Slack audio clips | Record, send, wait, play reply | Yes | Turn-by-turn rather than continuous conversation | Best Slack-only first step |
| Browser with STT/agent/TTS | Live or push-to-talk with visible transcript | Yes | Build turn handling and a small UI | Best cost/control fit |
| Browser with GPT-Live frontend | Full-duplex speech while backend works | Yes, with client delegation | Another hosted model and duration charges | Strong natural-conversation candidate |
| Realtime speech-to-speech model | Direct audio reasoning and replies | Not as the sole reasoning engine; delegation is additional design | Changes model arrangement and policy integration | Benchmark alternative, not silent replacement |
| Discord voice bot | Native voice room in existing clients | Yes | New platform, voice protocol and DAVE support | Viable if willing to add Discord |
| Automated Slack Huddles user | Huddle that appears to contain a speaking agent | Potentially | Unsupported automated user client | Experimental only |

### 1. Slack audio clips

Slack officially supports audio/video clips up to five minutes, including thread replies, on **all plans**. Its help page covers desktop, iOS, and Android recording. This verifies Free-plan availability in documentation, not the configuration of the owner's workspace. [Slack clips](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)

Proposed flow: the owner posts a clip in the agent thread; the trusted Slack adapter downloads the allowed file, obtains a transcript, and submits one ordinary owner turn to the existing agent. The response is posted as text and optionally generated audio. This is asynchronous two-way voice, with manual recording and playback rather than a hands-free call.

Slack file objects expose private download URLs requiring bearer authentication and can include transcription metadata. Do not assume a transcript is always available or immediately complete. `files:read` allows viewing files in conversations the app has joined; this broad permission still needs the existing owner/channel allowlist. [File object](https://docs.slack.dev/reference/objects/file-object/), [files:read](https://docs.slack.dev/reference/scopes/files.read/)

For output, use the current external upload workflow and `files:write`; `files.completeUploadExternal` supports sharing into a channel and a `thread_ts`. This establishes uploaded audio replies, not a guarantee that an app upload has the same presentation as a manually recorded native clip. Verify desktop/iPhone playback, transcript display, file events, duplicates, and the six-reply counter in a disposable test. [File upload completion](https://docs.slack.dev/reference/methods/files.completeUploadExternal/), [working with files](https://docs.slack.dev/messaging/working-with-files/)

### 2. Separate browser interface with a speech pipeline

A chained voice pipeline separates recognition, the text agent, and synthesis. It permits inspecting and replacing each stage independently; the text agent need not be replaced by an audio-capable model. This matches the PRD's provider-independent speech requirement. [OpenAI voice architecture guide](https://developers.openai.com/api/docs/guides/voice-agents), [LiveKit pipeline types](https://docs.livekit.io/agents/models/pipelines/)

Proposed topology: authenticated browser microphone → voice gateway/STT → existing durable agent request/session → verified response text → TTS → browser speaker. The browser link may be posted in Slack. The gateway authenticates the owner and binds a selected agent and conversation; a URL containing a thread identifier alone is not authorization.

**Framework candidates:**

- **Pipecat + SmallWebRTC:** Pipecat recommends its direct peer-to-peer SmallWebRTC transport for self-hosting and local development. It avoids a mandatory managed media service. Its docs distinguish this from managed Daily/LiveKit transport for distributed or degraded/mobile networks. Start here for a single owner, then test off-LAN iPhone connectivity before claiming it needs no TURN/relay service. Browser-to-server voice over plain WebSocket loses WebRTC's media/network handling advantages. [Pipecat transport comparison](https://docs.pipecat.ai/client/concepts/choosing-a-transport)
- **LiveKit Agents:** Offers STT/LLM/TTS and realtime pipelines, turn controls, and overridable pipeline nodes. A custom LLM node can forward work to the durable agent rather than create a second tool-executing assistant. LiveKit can run locally, but introduces a media server to operate when self-hosted. Its TypeScript support may suit the proposed Node framework; Pipecat commonly adds a Python voice sidecar. Compare operational simplicity rather than assuming either library supplies durable execution. [Nodes and hooks](https://docs.livekit.io/agents/logic/nodes/), [local server](https://docs.livekit.io/transport/self-hosting/local/), [JavaScript agent source](https://github.com/livekit/agents-js)

Microphone capture requires user permission and a secure context, normally HTTPS; localhost is an exception. Test iPhone Safari, Linux browser audio devices, echo cancellation, headset/Bluetooth, screen lock/backgrounding, and Wi-Fi/mobile transitions. No evidence gathered here establishes reliable background mobile calling. Do not base the product on browser-native SpeechRecognition compatibility. [Browser microphone API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

### 3. GPT-Live frontend with the existing backend

The current OpenAI documentation describes **GPT-Live** as a full-duplex voice frontend that can listen while speaking and delegate tasks to a separate backend. Its **client delegation** mode explicitly supports the application's own workflow, backend provider, history, and execution policy. This is different from replacing DeepSeek with OpenAI Realtime for all reasoning. [Voice architecture guide](https://developers.openai.com/api/docs/guides/voice-agents)

The browser connects by WebRTC, with session creation on a trusted server holding the API key. Client delegation requires retaining transcript events and task state: a delegation-created event contains metadata, not the complete request. The application must construct the backend input, validate results, retain action records, and enforce confirmations. Returned commentary may be paraphrased by the voice model, so exact action proposals should remain visible in the Slack approval DM. Speech redirection does not cancel backend work automatically. [GPT-Live quickstart](https://developers.openai.com/api/docs/guides/live), [delegation contract](https://developers.openai.com/api/docs/guides/live-delegation)

This is a promising natural-conversation comparison, but adds a model between the owner and durable agent and a separate ongoing charge. Project access, SDK compatibility, voices, latency, and transcript handling remain untested.

### 4. Discord voice

Discord publishes a bot-capable voice connection protocol, including voice gateway signalling and media transport. This supplies an official platform path for voice bots, unlike Slack Huddles user automation. It still requires suitable implementation/library support for both receiving and sending audio. [Discord voice protocol source](https://github.com/discord/discord-api-docs/blob/main/developers/topics/voice-connections.mdx)

Discord requires third-party apps and bots to implement **DAVE** end-to-end encryption for voice after **2 March 2026**. Reject older tutorials/libraries that only describe the former transport encryption. A bot endpoint can process received audio and send it to a speech provider; transport E2EE does not mean provider processing remains private from that provider. [Discord requirements](https://support.discord.com/hc/en-us/articles/38025123604631-Minimum-Client-Version-Requirements-for-Voice-Chat)

Proposed design uses a private voice channel, owner filtering, and the same durable agent bridge. Keep calendar approvals in Slack unless explicitly redesigned. This adds a platform and mobile/desktop client dependency; it does not require choosing a different reasoning model.

### 5. Slack Huddles automation

OpenClaw documents a Huddles plugin that joins through a dedicated Slack user account in an automated Chrome client. Its own documentation states that Slack has no app/bot media-join API, does not sanction automated user clients, and that DOM changes may break the adapter. Modes include agent/STT/TTS and direct bidirectional voice. This is evidence of an experimental approach, not an official Slack integration or a tested solution for this project. Existing bot/app tokens do not supply this capability. [OpenClaw Huddles plugin](https://docs.openclaw.ai/plugins/slack-huddles)

## Speech processing and costs

| Component | Candidate | Evidence and tradeoff |
|---|---|---|
| Local STT | whisper.cpp | Linux CPU and Vulkan/HIP backends; microphone streaming example exists, but is explicitly described as naive. Benchmark endpointing/accuracy/latency rather than assuming native streaming quality. |
| Local STT | faster-whisper | CPU INT8 supported. Its documented GPU path uses NVIDIA CUDA; do not assume it accelerates the owner's AMD GPU. |
| Local TTS | Piper | Local neural speech with CLI, server, and library interfaces. Check selected voice's licence and sound quality; no per-minute provider bill. |
| Hosted STT | Deepgram or OpenAI transcription | Lower local compute; sends audio off-host and adds metered charges. Use a genuine streaming endpoint when needed. |
| Hosted TTS | gpt-4o-mini-tts or another replaceable provider | Quality/voice evaluation needed; do not couple this choice to the reasoning provider. |

Sources: [whisper.cpp](https://github.com/ggml-org/whisper.cpp), [faster-whisper](https://github.com/SYSTRAN/faster-whisper), [Piper](https://github.com/OHF-Voice/piper1-gpl), [Deepgram pricing](https://deepgram.com/pricing), [OpenAI audio pricing](https://developers.openai.com/api/docs/pricing), [Mini TTS model pricing](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts).

Checked USD examples, excluding taxes and agent inference:

- **GPT-Live 1:** $0.05 per connected minute, billed per second; backend usage separately. One hour is $3. Ten minutes/day for 30 days is **$15**, before DeepSeek. This exceeds the current $10 monthly allowance if speech counts inside it.
- **gpt-4o-mini-transcribe:** listed estimate $0.003 per audio minute; 300 minutes is **$0.90**. This is a transcription cost example, not a claim it alone implements continuous duplex conversation.
- **gpt-4o-mini-tts:** model page lists $0.60/million input text tokens and $12/million output audio tokens. A dependable per-minute figure was not established from the current pricing table; estimate from measured usage rather than reusing older web figures.
- **Local STT/TTS:** no metered speech-provider API charges, but consumes host CPU/RAM, energy, and maintenance. No hardware benchmark was run.

Clarify whether the existing $10 cap includes STT/TTS/voice sessions and media transport. Conservatively include all model charges until the owner explicitly approves otherwise. A realtime service must enforce limits by session duration or usage reservations, not wait for a monthly bill after an open microphone runs indefinitely.

## Integration rules to preserve

The following are proposed design requirements, derived from the current PRD rather than guarantees from a voice SDK:

1. Voice input enters the same owner-authorized durable admission path as typed input; no direct speech-model access to email/calendar credentials or tools.
2. Bind voice to a visible named agent and conversation. Do not create an independent assistant with conflicting state. Define whether a voice session continues a Slack thread or creates a separate durable conversation.
3. Persist final/accepted owner turns, request IDs, responses, and action outcomes. Streaming partial transcripts are provisional; speech corrections must not silently mutate a previously executed action.
4. Keep exact calendar Approve/Reject DMs. A spoken “yes” must not become calendar approval under the present specification. Preserve the no-email-sending boundary.
5. Separate **stop speaking**, **cancel the pending response**, and **cancel a task**. Interrupting audio does not undo an external effect. Clear queued audio and suppress stale responses while retaining known tool outcomes. LiveKit documents interruption controls, but application cancellation still needs explicit wiring. [Speech control](https://docs.livekit.io/agents/multimodality/audio/), [turn handling](https://docs.livekit.io/agents/logic/turns/)
6. Define how the six combined agent replies between owner thread messages applies to voice. Audio frames, streamed text chunks, acknowledgments, and transcript mirrors must not accidentally become extra conversational turns or reset the budget. This is an open product rule.
7. Store generated text separately from the portion actually played. A user can interrupt before hearing a completed answer; do not represent unheard content as confirmed understanding. Avoid raw-audio retention by default until the owner decides retention, backup, deletion, and provider exposure.

## Smallest useful next experiment

Research does not authorize this experiment. Proposed scope:

1. Browser UI with microphone, push-to-talk, transcript, selected agent, playback Stop, and task Cancel.
2. Canned durable backend, no real email/calendar/tools; short fake job and fake approval routed to Slack.
3. Compare a local STT/Piper pipeline, one hosted speech pipeline, and GPT-Live client delegation with identical scripted inputs.
4. Measure first-audio latency, transcription of dates/names, interruptions and stale-output suppression, reconnect behavior, CPU/RAM, and actual cost per ten-minute conversation.
5. Test Omarchy desktop and the owner's iPhone on Wi-Fi and cellular. Demonstrate that approval buttons remain required and duplicate transcripts cannot duplicate actions.
6. Choose one path before connecting it to the production agent. Add multi-agent voice only after one-agent behavior works; speech scheduling and cancellation scope need their own decisions.

The practical choice is between **lowest overhead with a controllable speech pipeline** and **more natural full-duplex conversation at a duration-based cost**. Both can preserve the existing DeepSeek agent and Slack approvals; neither requires Slack Huddles.
