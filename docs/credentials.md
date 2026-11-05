# DeepInfra credentials

The adapter reads only the absolute file path configured in `inference.credentialFile`. Files named `.env` or `.env.*` are parsed with Node's built-in dotenv parser and must contain `DEEPINFRA_API_KEY`. Other filenames retain the existing raw-key format.

After separate owner authorization for live testing, create a protected file at an absolute path you choose, for example:

```text
/absolute/path/to/private/.env
```

This is a placeholder, not an existing credential location. Prefer a location outside the checkout. If using a checkout-local `.env`, verify that Git ignores it before adding credentials.

```dotenv
DEEPINFRA_API_KEY=your-api-key
```

Keep permissions at `0600`. The adapter opens once, checks that descriptor for current-user ownership, owner-only permissions and regular-file type, and reads at most 16 KiB plus one overflow-detection byte. Symlinks are supported; the opened target must pass those checks. Keep the containing directory private too. These checks do not protect against another process running as the same user modifying the opened file.

Missing or empty keys fail closed. After trimming surrounding whitespace, both formats require visible ASCII without spaces or control characters. The adapter publishes only terminal responses, not partial streaming events. Failed responses are rebuilt from safe fields, dropping provider diagnostics, content and metadata before persistence; unexpected adapter exceptions return a generic error. Stream activity still refreshes the progress deadline. Successful provider content remains trusted as model output; this is not a filter for a malicious provider returning a key as successful content. Dotenv loading does not populate `process.env`, expand variables, or search parent directories.

The eventual local live-test JSON configuration must use:

```json
{
  "credentialFile": "/absolute/path/to/private/.env"
}
```

This is the `inference.credentialFile` field, not a complete configuration. No live-test configuration or inference run is created by adding dotenv support. TD-002 is implemented, live smoke pending. [Independent review for Acolyte #9](evidence/issue-9-credential-review.md) approved the loader, adapter fixes and tests at `932b7ba`. Tests use temporary synthetic credentials only.
