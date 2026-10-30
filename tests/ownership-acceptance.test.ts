import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { lstat, symlink, link, writeFile, rm } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { child, ready, stop, fixture } from './support.ts';
import { ownSocket } from '../src/host/store.ts';

test('real runner refuses duplicate identity, canonical path aliases, hard links, and shared sockets without harming owner', { timeout: 15000 }, async () => {
  const f = await fixture();
  f.config.agentId = basename(f.directory).toLowerCase();
  await f.save();
  const owner = child('src/runner.ts', [f.file]);
  try {
    await ready(owner);
    const inode = (await lstat(f.config.socket)).ino;
    for (const mode of ['identity', 'alias', 'hardlink', 'socket'] as const) {
      const other = structuredClone(f.config);
      if (mode === 'identity') { other.store += '-other'; other.socket += '-other'; }
      else {
        other.agentId += '-other';
        if (mode === 'alias') { other.store += '-alias'; await symlink(f.config.store, other.store); other.socket += '-other'; }
        if (mode === 'hardlink') { other.store += '-hard'; await link(f.config.store, other.store); other.socket += '-other'; }
        if (mode === 'socket') other.store += '-other';
      }
      const file = join(f.directory, `${mode}.json`);
      await writeFile(file, JSON.stringify(other));
      const duplicate = child('src/runner.ts', [file]);
      const result = await duplicate.exited;
      assert.equal(result.code, 2, `${mode}: ${result.output}`);
      assert.equal(owner.process.exitCode, null);
      assert.equal((await lstat(f.config.socket)).ino, inode);
    }
  } finally { await stop(owner); await f.cleanup(); }
});

test('unknown socket and ordinary/symlink paths are never unlinked during startup', { timeout: 15000 }, async () => {
  const f = await fixture();
  f.config.agentId = basename(f.directory).toLowerCase();
  await f.save();
  const external = createServer();
  external.listen(f.config.socket);
  await once(external, 'listening');
  try {
    const inode = (await lstat(f.config.socket)).ino;
    assert.equal((await child('src/runner.ts', [f.file]).exited).code, 2);
    assert.equal((await lstat(f.config.socket)).ino, inode);
    await new Promise<void>(resolve => external.close(() => resolve()));
    await writeFile(f.config.socket, 'not a socket');
    assert.equal((await child('src/runner.ts', [f.file]).exited).code, 2);
    assert.equal((await lstat(f.config.socket)).isFile(), true);
    await rm(f.config.socket);
    await symlink(join(f.directory, 'missing'), f.config.socket);
    assert.equal((await child('src/runner.ts', [f.file]).exited).code, 2);
    assert.equal((await lstat(f.config.socket)).isSymbolicLink(), true);
  } finally { if (external.listening) await new Promise<void>(resolve => external.close(() => resolve())); await f.cleanup(); }
});

test('failed startup releases all owned resources, allowing corrected configuration without a hung process', { timeout: 15000 }, async () => {
  const f = await fixture();
  f.config.agentId = basename(f.directory).toLowerCase();
  await f.save();
  await writeFile(f.config.ledger, 'not SQLite');
  let corrected: ReturnType<typeof child> | undefined;
  try {
    const result = await child('src/runner.ts', [f.file]).exited;
    assert.equal(result.code, 2, result.output);
    await assert.rejects(lstat(f.config.socket), { code: 'ENOENT' });
    await rm(f.config.ledger);
    corrected = child('src/runner.ts', [f.file]);
    await ready(corrected);
    await stop(corrected);
    const original = f.config.agentId;
    f.config.agentId += '-wrong'; await f.save();
    assert.equal((await child('src/runner.ts', [f.file]).exited).code, 2, 'persisted agent identity rejects replacement');
    f.config.agentId = original; await f.save();
    corrected = child('src/runner.ts', [f.file]);
    await ready(corrected);
  } finally { await stop(corrected); await f.cleanup(); }
});

test('runner shutdown does not unlink a replacement socket path', { timeout: 10000 }, async () => {
  const f = await fixture();
  f.config.agentId = basename(f.directory).toLowerCase(); await f.save();
  const runner = child('src/runner.ts', [f.file]);
  try {
    await ready(runner);
    await rm(f.config.socket);
    await writeFile(f.config.socket, 'replacement');
    const inode = (await lstat(f.config.socket)).ino;
    await stop(runner);
    assert.equal((await lstat(f.config.socket)).ino, inode);
  } finally { await stop(runner); await f.cleanup(); }
});

test('socket cleanup retains a replacement inode and refuses a second claimant', async () => {
  const f = await fixture();
  const socket = await ownSocket(f.config.socket);
  const server = createServer();
  server.listen(socket.bindPath);
  await once(server, 'listening');
  await socket.claim();
  try {
    await assert.rejects(ownSocket(f.config.socket), /owned/);
    await rm(f.config.socket);
    await writeFile(f.config.socket, 'replacement');
    const inode = (await lstat(f.config.socket)).ino;
    await socket.close();
    assert.equal((await lstat(f.config.socket)).ino, inode);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); await f.cleanup(); }
});
