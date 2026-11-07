# Owner-authorized OpenAI authentication check

The owner explicitly authorized reuse of existing Pi OpenAI authentication for a bounded live authentication check. No 1Password access, credential printing or inference was authorized by this check.

## Observed

- The existing Pi credential is OpenAI OAuth, not an `OPENAI_API_KEY` environment variable.
- Pi 1.5.0 `auth check --provider openai --json` reported `ready`, auth type `oauth`. No credential-printing option was used.
- One authenticated `GET https://api.openai.com/v1/models` returned HTTP 200. The request used the existing access token in memory; neither the token nor the response body was printed or committed.
- Zero inference requests were made. No credential file was copied into the repository or into a container, and no host authentication directory was mounted.

## Limitations

The returned model list did not contain the configured IDs `gpt-6-luna`, `gpt-6.1-terra` or `gpt-6.1-sol`. This is not proof those models are unavailable through every supported subscription route, but it is not model-access acceptance either. Offline Pi catalog discovery and a successful authentication request do not prove an inference request for these IDs will succeed.

Keep the owner's requested model assignments unchanged. Do not silently substitute another model. A minimal, separately bounded model-access smoke or provider clarification remains necessary before claiming the first real workflow run is ready. Application DeepInfra authentication and TD-002 live acceptance were not tested.
