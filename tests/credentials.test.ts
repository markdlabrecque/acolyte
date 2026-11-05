import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, writeFile, chmod, rm, open, rename, symlink, mkdir } from 'node:fs/promises';
import { protectedFile } from '../src/config.ts';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deepInfraCredential } from '../src/inference/credentials.ts';

test('protected raw keys and dotenv credentials without process environment mutation', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'td002-credentials-'));
  const previous = { ...process.env };
  try {
    for (const [name, contents, expected] of [
      ['model.key', ' synthetic-raw-key\n', 'synthetic-raw-key'],
      ['.env', 'DEEPINFRA_API_KEY=synthetic-env-key\n', 'synthetic-env-key'],
      ['.env.literal', 'OTHER=secret\nDEEPINFRA_API_KEY=${OTHER}\n', '${OTHER}'],
      ['.env.live', '# comment\nexport DEEPINFRA_API_KEY="synthetic-quoted-key" # comment\nOTHER=ignored\n', 'synthetic-quoted-key'],
    ]) {
      await t.test(name, async () => {
        const path = join(directory, name!);
        await writeFile(path, contents!, { mode: 0o600 });
        assert.equal(await deepInfraCredential(path), expected);
        assert.deepEqual({ ...process.env }, previous);
      });
    }
    for (const contents of ['OTHER=synthetic-secret', 'DEEPINFRA_API_KEY=', 'DEEPINFRA_API_KEY="   "', 'DEEPINFRA_API_KEY="line1\nline2"']) {
      await t.test('missing, empty or multiline key fails without revealing contents', async () => {
        const path = join(directory, '.env');
        await writeFile(path, contents, { mode: 0o600 });
        await assert.rejects(deepInfraCredential(path), { message: 'Invalid or missing DEEPINFRA_API_KEY in credential file' });
      });
    }
    await t.test('raw malformed keys fail without revealing contents', async () => {
      for (const contents of ['synthetic\nsecret', 'synthetic\rsecret', 'synthetic\0secret', 'synthetic\tsecret', 'synthetic secret', 'synthetic☃secret']) {
        const path = join(directory, 'model.key');
        await writeFile(path, contents, { mode: 0o600 });
        await assert.rejects(deepInfraCredential(path), { message: 'Invalid or missing DEEPINFRA_API_KEY in credential file' });
      }
    });
    await t.test('no parent search', async () => {
      await mkdir(join(directory, 'child'));
      await assert.rejects(deepInfraCredential(join(directory, 'child', '.env')), /ENOENT/);
    });
    await t.test('dotenv requires owner-only permissions', async () => {
      const path = join(directory, '.env');
      await writeFile(path, 'DEEPINFRA_API_KEY=synthetic-key');
      await chmod(path, 0o644);
      await assert.rejects(deepInfraCredential(path), /owner-only/);
    });
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('protected file checks the opened target and bounds actual bytes', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'protected-file-'));
  const path = join(directory, 'key');
  try {
    await writeFile(path, 'x'.repeat(16384), { mode: 0o600 });
    assert.equal((await protectedFile(path)).length, 16384);
    await writeFile(path, 'x'.repeat(16385));
    await assert.rejects(protectedFile(path), /bounded/);
    await assert.rejects(protectedFile(directory), /owner-only/);
    await writeFile(path, 'original');
    const link = join(directory, 'link');
    await symlink(path, link);
    assert.equal(await protectedFile(link), 'original');
    await chmod(path, 0o644);
    await assert.rejects(protectedFile(link), /owner-only/);
    await chmod(path, 0o600);
    const probe = await open(path, 'r');
    const prototype = Object.getPrototypeOf(probe);
    const stat = prototype.stat;
    await probe.close();
    for (const scenario of ['replacement', 'growth', 'owner']) {
      await t.test(scenario, async t => {
        await writeFile(path, 'original');
        await chmod(path, 0o600);
        t.mock.method(prototype, 'stat', async function (this: typeof probe) {
          const info = await stat.call(this);
          if (scenario === 'replacement') {
            await rename(path, join(directory, 'old'));
            await writeFile(path, 'replacement'.repeat(2000), { mode: 0o644 });
          } else if (scenario === 'growth') {
            await writeFile(path, 'x'.repeat(20000));
          } else {
            info.uid = process.getuid!() + 1;
          }
          return info;
        });
        if (scenario === 'replacement') assert.equal(await protectedFile(path), 'original');
        else await assert.rejects(protectedFile(path), /owner-only and bounded/);
      });
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
