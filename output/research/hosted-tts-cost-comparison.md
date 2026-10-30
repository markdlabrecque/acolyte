# Hosted TTS APIs versus GPT-Live

Pricing checked: 25 October 2026. All amounts are US dollars.

## Main finding

Hosted text-to-speech can be considerably cheaper than GPT-Live, especially when speech recognition already runs locally with Parakeet. TTS generates spoken output from text; GPT-Live also supplies a live conversational voice frontend. They are different components, so their prices are not a like-for-like feature comparison.

## Pricing comparison

For character-based services, the estimates below assume **800 characters per minute of generated speech**, or 48,000 characters per speech hour. Actual duration varies with language, speaking speed, pauses, and content. Figures exclude Pi's reasoning-model usage, taxes, promotional credits, and any separately billed services.

| Service | Published pricing | Approximate cost |
|---|---:|---:|
| DeepInfra Kokoro | $0.99 per million characters | $0.0475, approximately **$0.05 per speech hour** |
| Deepgram Aura-1 | $15 per million characters | **$0.72 per speech hour** |
| Deepgram Aura-2 | $30 per million characters | **$1.44 per speech hour** |
| ElevenLabs v4 Turbo | $40 per million characters | **$1.92 per speech hour** |
| Cartesia Sonic Pro | $5/month with 100,000 credits; one character per credit | Approximately **125–133 speech minutes included** |
| GPT-Live (`gpt-live-1`) | $0.05 per session minute, billed per second | **$3 per connected hour**, plus backend model/tool usage |

Cartesia's range follows its published estimate of 750–800 credits per speech minute. The other character-based calculations consistently use 800 characters per minute. Subscription allowances are not interchangeable with pay-as-you-go rates; check plan conditions and overage prices before selecting a service.

## Billing difference

TTS services charge for the text/audio generated, even if playback is subsequently interrupted. They do not charge for the whole conversation simply because a microphone is open. GPT-Live is billed by session duration, including connected time when the agent is not speaking. Close sessions when finished.

With TTS, the application must still implement microphone handling, transcription, turn detection, interruptions, audio playback, and coordination with Pi. GPT-Live supplies the conversational frontend; backend work remains separately billed.

## Example monthly use

Assumptions:

- Ten minutes of conversation per day for 30 days: **300 connected minutes**.
- The agent speaks for half the conversation: **150 generated speech minutes**.
- At 800 characters per speech minute: **120,000 generated characters**.
- Local Parakeet supplies transcription, so no hosted STT charge is included.

| Option | Estimated monthly speech cost |
|---|---:|
| DeepInfra Kokoro | **$0.12** |
| Deepgram Aura-1 | **$1.80** |
| Deepgram Aura-2 | **$3.60** |
| ElevenLabs v4 Turbo | **$4.80** |
| GPT-Live | **$15.00** |

Cartesia Pro's included 100,000 credits would not cover this 120,000-character example; its $5 subscription should not be presented as the total without checking additional-usage terms.

## Proposed starting point for the custom Pi agent

Audition **Parakeet → Pi → hosted Kokoro on DeepInfra** first. At the published Kokoro rate, local TTS would mainly provide privacy, offline operation, and independence rather than substantial savings at personal usage levels.

Compare a more expressive hosted service using identical sentences before deciding. Price alone does not establish voice quality, pronunciation, latency, streaming support, or interruption behavior. No service was installed, purchased, or benchmarked for this comparison.

This is a research recommendation, not an approved provider change or PRD update. The project's existing spending limits and action-approval rules remain applicable.

## Official sources

- [DeepInfra Kokoro pricing](https://deepinfra.com/hexgrad/Kokoro-82M): $0.99 per million characters.
- [Deepgram pricing](https://deepgram.com/pricing): pay-as-you-go Aura-1 at $0.015 per 1,000 characters and Aura-2 at $0.030 per 1,000 characters.
- [ElevenLabs API pricing](https://elevenlabs.io/pricing/api): v4 Turbo at $0.04 per 1,000 characters.
- [Cartesia pricing](https://www.cartesia.ai/pricing): Pro at $5/month with 100,000 credits; Sonic requires approximately 750–800 credits per generated minute, with one credit per character.
- [OpenAI pricing](https://developers.openai.com/api/docs/pricing): GPT-Live 1 at $0.05 per minute, billed per second; backend usage separately billed.
- [GPT-Live session guide](https://developers.openai.com/api/docs/guides/live): session-duration billing and session lifecycle.

Prices and plan terms can change; verify them again before implementation or purchase.
