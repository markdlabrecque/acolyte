import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deepInfraCredential } from '../src/inference/credentials.ts';

test('protected raw keys and dotenv credentials without process environment mutation', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'td002-credentials-'));
  const previous = process.env.DEEPINFRA_API_KEY;
  try {
    for (const [name, contents, expected] of [
      ['model.key', ' synthetic-raw-key\n', 'synthetic-raw-key'],
      ['.env', 'DEEPINFRA_API_KEY=synthetic-env-key\n', 'synthetic-env-key'],
      ['.env.live', '# comment\nexport DEEPINFRA_API_KEY="synthetic-quoted-key" # comment\nOTHER=ignored\n', 'synthetic-quoted-key'],
    ]) {
      await t.test(name, async () => {
        const path = join(directory, name!);
        await writeFile(path, contents!, { mode: 0o600 });
        assert.equal(await deepInfraCredential(path), expected);
        assert.equal(process.env.DEEPINFRA_API_KEY, previous);
      });
    }
    for (const contents of ['OTHER=synthetic-secret', 'DEEPINFRA_API_KEY=', 'DEEPINFRA_API_KEY="   "', 'DEEPINFRA_API_KEY="line1\nline2"']) {
      await t.test('missing, empty or multiline key fails without revealing contents', async () => {
        const path = join(directory, '.env');
        await writeFile(path, contents, { mode: 0o600 });
        await assert.rejects(deepInfraCredential(path), { message: 'Invalid or missing DEEPINFRA_API_KEY in credential file' });
      });
    }
    await t.test('dotenv requires owner-only permissions', async () => {
      const path = join(directory, '.env');
      await writeFile(path, 'DEEPINFRA_API_KEY=synthetic-key');
      await chmod(path, 0o644);
      await assert.rejects(deepInfraCredential(path), /owner-only/);
    });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
