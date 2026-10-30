import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import type { Config } from '../src/config.ts';

export async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'td002-acceptance-'));
  const config: Config = {
    schemaVersion: 1, agentId: 'acceptance', revision: 'test-1', prompt: 'Use only add_todo and list_todos.',
    store: join(directory, 'agent.sqlite'), ledger: join(directory, 'spend.sqlite'),
    socket: join(directory, 'runner.sock'), port: 43129, authFile: join(directory, 'auth'),
    owner: 'owner', tools: ['add_todo', 'list_todos'],
    inference: { mode: 'fixture', provider: 'deepinfra', model: 'deepseek-ai/DeepSeek-V4-Flash-0731',
      credentialFile: null, inputUsdPerMillion: 1, outputUsdPerMillion: 1 },
    limits: { monthlyUsd: 10, warningUsd: 5, activeMs: 300000, modelCalls: 20, toolCalls: 50,
      queued: 20, inputTokens: 16384, outputTokens: 1024, connectMs: 1000, progressMs: 1000,
      bodyBytes: 16384, listPage: 1 },
  };
  await writeFile(config.authFile, 'synthetic-local-auth-only', { mode: 0o600 });
  const file = join(directory, 'config.json');
  return { config, directory, file, save: () => writeFile(file, JSON.stringify(config)),
    cleanup: () => rm(directory, { recursive: true, force: true }) };
}
export async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  await new Promise<void>(resolve => server.close(() => resolve()));
  return address.port;
}
export function child(file: string, args: string[]) {
  const process = spawn(globalThis.process.execPath, [file, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  process.stdout.on('data', data => { output += data; });
  process.stderr.on('data', data => { output += data; });
  const exited = once(process, 'exit').then(([code]) => ({ code, output }));
  return { process, exited, output: () => output };
}
export async function ready(child: ReturnType<typeof import('./support.ts').child>) {
  await until(() => {
    if (child.process.exitCode !== null) throw new Error(child.output());
    return child.output().includes('ready');
  });
}
export async function until<T>(read: () => T | Promise<T>, accept: (value: T) => boolean = Boolean): Promise<T> {
  for (let i = 0; i < 500; i++) {
    const value = await read();
    if (accept(value)) return value;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('condition timeout');
}
export async function stop(child: ReturnType<typeof import('./support.ts').child> | undefined) {
  if (!child) return;
  if (child.process.exitCode === null) child.process.kill('SIGTERM');
  return child.exited;
}
