# DeepInfra credentials

The adapter reads only the absolute file path configured in `inference.credentialFile`. Files named `.env` or `.env.*` are parsed with Node's built-in dotenv parser and must contain `DEEPINFRA_API_KEY`. Other filenames retain the existing raw-key format.

For the TD-002 worktree, edit the ignored file:

```text
/home/mark/Projects/pi-durable-agents-td-002/.env
```

```dotenv
DEEPINFRA_API_KEY=your-api-key
```

Keep permissions at `0600`. The adapter requires the file to belong to the current user, be owner-only, and be at most 16 KiB. Missing or empty keys fail closed. No file contents are logged. Dotenv loading does not populate `process.env`, expand variables, or search parent directories.

The eventual local live-test JSON configuration must use:

```json
{
  "credentialFile": "/home/mark/Projects/pi-durable-agents-td-002/.env"
}
```

This is the `inference.credentialFile` field, not a complete configuration. No live-test configuration or inference run is created by adding dotenv support. The existing live-acceptance gate remains open. Tests use temporary synthetic credentials only.
