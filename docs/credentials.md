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

Keep permissions at `0600`. The adapter requires the file to belong to the current user, be owner-only, and be at most 16 KiB. Missing or empty keys fail closed. No file contents are logged. Dotenv loading does not populate `process.env`, expand variables, or search parent directories.

The eventual local live-test JSON configuration must use:

```json
{
  "credentialFile": "/absolute/path/to/private/.env"
}
```

This is the `inference.credentialFile` field, not a complete configuration. No live-test configuration or inference run is created by adding dotenv support. TD-002 is implemented, live smoke pending. Independent review of this loader is tracked in [Acolyte #9](https://github.com/markdlabrecque/acolyte/issues/9). Tests use temporary synthetic credentials only.
