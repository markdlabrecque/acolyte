import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGitHubClient, GitHubRequestError } from './github.ts';

// Exercise the actual execFile transport against a local executable, not the
// network, real gh, credential files or an injected pre-parsed HTTP exception.
async function withFakeGh(status: unknown, check: () => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'acolyte-gh-transport-'));
  const previous = process.env.PATH;
  try {
    const body = JSON.stringify({ status });
    await writeFile(join(root, 'gh'), `#!/usr/bin/env node\nprocess.stdout.write(${JSON.stringify(body)}); process.exitCode = 1;\n`, { mode: 0o700 });
    process.env.PATH = `${root}:${previous ?? ''}`;
    await check();
  } finally {
    if (previous === undefined) delete process.env.PATH; else process.env.PATH = previous;
    await rm(root, { recursive: true, force: true });
  }
}

for (const status of [404, '404', 403, '503']) test(`canonical HTTP status ${JSON.stringify(status)} survives transport`, async () => {
  await withFakeGh(status, async () => {
    await assert.rejects(createGitHubClient().request('GET', 'repos/owner/repo/contents/ci.yml'), error =>
      error instanceof GitHubRequestError && error.status === Number(status));
  });
});

for (const status of ['0x194', '4.04e2', '404.0', ' 404', '404 ', '', 399, 600, null, false, undefined]) test(`malformed HTTP status ${JSON.stringify(status)} remains unknown`, async () => {
  await withFakeGh(status, async () => {
    await assert.rejects(createGitHubClient().request('GET', 'repos/owner/repo/contents/ci.yml'), error =>
      error instanceof GitHubRequestError && error.status === undefined);
  });
});

test('invalid transport methods and paths fail before executing gh', async () => {
  const client = createGitHubClient();
  await assert.rejects(client.request('TRACE', 'repos/owner/repo/issues'));
  await assert.rejects(client.request('GET', 'https://example.com/issues'));
  await assert.rejects(client.request('GET', 'repos/owner/repo/issues; echo unsafe'));
});
