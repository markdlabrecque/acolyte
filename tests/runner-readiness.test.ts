import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { child, fixture, ready, stop } from './support.ts';

test('readiness already has shutdown handlers and an immediate signal releases ownership', { timeout: 15000 }, async () => {
  const f = await fixture();
  f.config.agentId = basename(f.directory).toLowerCase();
  await f.save();
  const preload = join(f.directory, 'signal-on-ready.mjs');
  // Deliver the signal synchronously at the readiness boundary. Without the
  // handlers, SIGTERM terminates the process before the log call returns.
  await writeFile(preload, `const log = console.log;
console.log = (...args) => {
  if (args[0] === 'runner ready') process.kill(process.pid, 'SIGTERM');
  return log(...args);
};\n`);
  const runner = spawn(process.execPath, ['src/runner.ts', f.file], {
    env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import ${pathToFileURL(preload).href}` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  runner.stdout.on('data', data => { output += data; });
  runner.stderr.on('data', data => { output += data; });
  let restarted: ReturnType<typeof child> | undefined;
  try {
    const [code, signal] = await once(runner, 'exit');
    assert.equal(signal, null, output);
    assert.equal(code, 0, output);
    assert.match(output, /runner ready/);
    restarted = child('src/runner.ts', [f.file]);
    await ready(restarted);
  } finally {
    if (runner.exitCode === null && runner.signalCode === null) runner.kill('SIGKILL');
    await stop(restarted);
    await f.cleanup();
  }
});
