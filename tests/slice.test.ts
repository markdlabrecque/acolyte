import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { test } from 'node:test';

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>(resolve => server.close(() => resolve()));
  return port;
}

function child(file: string, args: string[]) {
  const process = spawn(globalThis.process.execPath, [file, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  process.stdout.on('data', data => { stdout += data; });
  process.stderr.on('data', data => { stderr += data; });
  const exited = once(process, 'exit').then(([code]) => ({ code, stdout, stderr }));
  return { process, exited, output: () => stdout + stderr };
}

async function ready(process: ReturnType<typeof child>) {
  for (let i = 0; i < 200; i++) {
    if (process.output().includes('ready')) return;
    if (process.process.exitCode !== null) throw new Error(process.output());
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error(`readiness timeout: ${process.output()}`);
}

test('CLI crosses authenticated gateway and runner to Pi Durable add/list', { timeout: 15000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'td002-slice-'));
  const port = await freePort();
  const tokenFile = join(directory, 'auth');
  const configFile = join(directory, 'assistant.json');
  await writeFile(tokenFile, 'fixture-token-not-a-credential', { mode: 0o600 });
  const config = {
    schemaVersion: 1, agentId: 'assistant', revision: 'fixture-1',
    prompt: 'Manage todos using add_todo and list_todos only.',
    store: join(directory, 'agent.sqlite'), ledger: join(directory, 'spend.sqlite'),
    socket: join(directory, 'runner.sock'), port, authFile: tokenFile,
    owner: 'owner', tools: ['add_todo', 'list_todos'],
    inference: {
      mode: 'fixture', provider: 'deepinfra', model: 'deepseek-ai/DeepSeek-V4-Flash-0731',
      credentialFile: null, inputUsdPerMillion: 1, outputUsdPerMillion: 1,
    },
    limits: { monthlyUsd: 10, warningUsd: 5, activeMs: 300000, modelCalls: 20,
      toolCalls: 50, queued: 20, inputTokens: 8192, outputTokens: 1024,
      connectMs: 30000, progressMs: 90000, bodyBytes: 16384, listPage: 20 },
  };
  await writeFile(configFile, JSON.stringify(config));
  const runner = child('src/runner.ts', [configFile]);
  let gateway: ReturnType<typeof child> | undefined;
  const cli = async (...args: string[]) => child('src/cli.ts', ['--config', configFile, '--json', ...args]).exited;
  try {
    await ready(runner);
    gateway = child('src/gateway.ts', [configFile]);
    await ready(gateway);
    assert.equal((await cli('config', 'validate')).code, 0);
    const added = await cli('submit', '--agent', 'assistant', '--conversation', 'demo', '--request-id', 'add-1', 'Add "Book dentist"');
    assert.equal(added.code, 0, added.stderr);
    assert.equal(JSON.parse(added.stdout).requestId, 'add-1');
    const result = async (id: string) => {
      for (let i = 0; i < 100; i++) {
        const response = await cli('result', '--agent', 'assistant', id);
        assert.equal(response.code, 0, response.stderr);
        const value = JSON.parse(response.stdout);
        if (value.state === 'completed') return value;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      throw new Error('result timeout');
    };
    assert.match((await result('add-1')).answer, /Book dentist/);
    const duplicate = await cli('submit', '--agent', 'assistant', '--conversation', 'demo', '--request-id', 'add-1', 'Add "Book dentist"');
    assert.equal(JSON.parse(duplicate.stdout).receipt, JSON.parse(added.stdout).receipt);
    assert.equal((await cli('submit', '--agent', 'assistant', '--conversation', 'demo', '--request-id', 'add-1', 'changed')).code, 2);
    assert.equal((await cli('submit', '--agent', 'assistant', '--conversation', 'demo', '--request-id', 'list-1', 'List todos')).code, 0);
    assert.match((await result('list-1')).answer, /Book dentist/);
    const denied = await fetch(`http://127.0.0.1:${port}/v1/agents/assistant/requests`, { method: 'POST', body: '{}' });
    assert.equal(denied.status, 401);
    const status = await cli('status', '--agent', 'assistant', 'add-1');
    assert.equal(JSON.parse(status.stdout).state, 'completed');
    assert.doesNotMatch(runner.output() + gateway.output(), /Book dentist|fixture-token/);
  } finally {
    gateway?.process.kill('SIGTERM');
    runner.process.kill('SIGTERM');
    await Promise.all([runner.exited, gateway?.exited]);
    await rm(directory, { recursive: true, force: true });
  }
});
