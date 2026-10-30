import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, realpath, stat, lstat, rm, mkdtemp, link, chmod, rmdir } from 'node:fs/promises';
import { dirname, basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { SqliteStorage } from '@earendil-works/pi-durable/storage/sqlite';
import { openNodeSqliteDatabase } from '@earendil-works/pi-durable/storage/sqlite/node';
import type { Config } from '../config.ts';

export async function canonical(path: string): Promise<string> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  try {
    const info = await stat(path);
    if (info.nlink !== 1) throw new Error('Hard-linked stores are not supported');
    return await realpath(path);
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    // A dangling symlink is not a new canonical file. Never lock one path then
    // let SQLite follow it to another path when creating the store.
    const entry = await lstat(path).catch(cause => {
      if (cause.code === 'ENOENT') return undefined;
      throw cause;
    });
    if (entry) throw new Error('Dangling store alias is not supported');
    return join(await realpath(dirname(path)), basename(path));
  }
}

async function lock(path: string) {
  const keeper = spawn('/usr/bin/flock', ['--exclusive', '--nonblock', '--conflict-exit-code', '73', path,
    process.execPath, '-e', 'process.stdout.write("locked\\n"); process.stdin.resume();'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const exited = once(keeper, 'exit');
  await Promise.race([
    once(keeper.stdout, 'data'),
    exited.then(() => { throw new Error('Agent/store already owned or OS lock unavailable'); }),
  ]);
  keeper.stdin.on('error', () => {});
  return async () => { keeper.stdin.end(); await exited; };
}

export async function ownSocket(socket: string) {
  const path = join(await realpath(dirname(socket)), basename(socket));
  const directory = await stat(dirname(path));
  if (directory.uid !== process.getuid!() || (directory.mode & 0o022) !== 0) throw new Error('Unsafe socket directory');
  const unlock = await lock(`${path}.lock`);
  let created: Awaited<ReturnType<typeof lstat>> | undefined;
  let privateDirectory: string | undefined;
  try {
    const existing = await lstat(path).catch(error => {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    });
    // Refuse unknown/stale sockets rather than unlinking another owner's endpoint.
    if (existing) throw new Error('Socket path already exists');
    privateDirectory = await mkdtemp(join(dirname(path), '.runner-'));
    const bindPath = join(privateDirectory, 's');
    return {
      path, bindPath,
      async claim() {
        const info = await lstat(bindPath);
        if (!info.isSocket()) throw new Error('Expected owned socket');
        created = info;
        await chmod(bindPath, 0o600);
        // Node unconditionally unlinks its bind path on close. Bind privately and
        // publish a hard link so Node can never unlink a replaced public endpoint.
        await link(bindPath, path);
      },
      async close() {
        try {
          const info = await lstat(path).catch(error => {
            if (error.code === 'ENOENT') return undefined;
            throw error;
          });
          if (created && info?.dev === created.dev && info.ino === created.ino) await rm(path);
          const inner = await lstat(bindPath).catch(error => {
            if (error.code === 'ENOENT') return undefined;
            throw error;
          });
          if (created && inner?.dev === created.dev && inner.ino === created.ino) await rm(bindPath);
          await rmdir(privateDirectory!);
        } finally { await unlock(); }
      },
    };
  } catch (error) {
    try { if (privateDirectory) await rmdir(privateDirectory); } finally { await unlock(); }
    throw error;
  }
}

export async function ownStore(config: Config) {
  const store = await canonical(config.store);
  const ledger = await canonical(config.ledger);
  if (store === ledger) throw new Error('Spending ledger must be separate');
  const locks = join(tmpdir(), `personal-agent-locks-${process.getuid!()}`);
  await mkdir(locks, { mode: 0o700, recursive: true });
  const info = await stat(locks);
  if (info.uid !== process.getuid!() || (info.mode & 0o077) !== 0) throw new Error('Unsafe ownership directory');
  const unlockAgent = await lock(join(locks, createHash('sha256').update(config.agentId).digest('hex')));
  let unlockStore: (() => Promise<void>) | undefined;
  try {
    unlockStore = await lock(`${store}.lock`);
    const db = await openNodeSqliteDatabase(store);
    try {
      await db.exec('PRAGMA synchronous = FULL');
      if ((await db.get<{ synchronous: number }>('PRAGMA synchronous'))?.synchronous !== 2) throw new Error('SQLite FULL required');
      const storage = await SqliteStorage.open(db);
      return { storage, ledger, unlock: async () => { await unlockStore!(); await unlockAgent(); } };
    } catch (error) { await db.close(); throw error; }
  } catch (error) { await unlockStore?.(); await unlockAgent(); throw error; }
}
