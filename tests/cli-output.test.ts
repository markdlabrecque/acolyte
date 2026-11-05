import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { child, fixture } from './support.ts';

for (const command of ['submit', 'status', 'result']) {
  test(`CLI ${command} is readable by default and preserves JSON`, async () => {
    const f = await fixture();
    let value: Record<string, unknown>;
    const server = createServer((req, res) => {
      req.resume();
      res.writeHead(Number(value.status), { 'content-type': 'application/json' });
      res.end(JSON.stringify(value));
    });
    try {
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      f.config.port = address.port;
      await f.save();
      const args = command === 'submit'
        ? ['--conversation', 'chat', '--request-id', 'request-1', 'hello'] : ['request-1'];
      const invoke = (json: boolean) => child('src/cli.ts', [
        '--config', f.file, '--agent', f.config.agentId, ...(json ? ['--json'] : []), command, ...args,
      ]).exited;
      const cases = command === 'submit'
        ? [202, 200].map(status => ({ value: { status, receipt: 'receipt-1' }, text:
          'Request request-1 accepted. Receipt: receipt-1\nAcceptance is not completion. Use status or result with the request ID to check.\n', code: 0 }))
        : ['queued', 'running', 'completed', 'failed'].map(state => ({
          value: { status: command === 'result' && ['queued', 'running'].includes(state) ? 202 : 200,
            requestId: 'request-1', receipt: 'receipt-1', state, fixture: true,
            ...(command === 'result' && state === 'completed' ? { answer: 'Your todos:\n- Buy milk' } : {}),
            ...(state === 'failed' ? { failure: 'Model call limit reached' } : {}) },
          text: `Request request-1: ${['queued', 'running'].includes(state) ? `pending (${state})` : state}.\n`
            + (command === 'result' && state === 'completed' ? 'Your todos:\n- Buy milk\n' : '')
            + (state === 'failed' ? 'Model call limit reached\n' : ''),
          code: state === 'failed' ? 1 : 0,
        }));
      for (const entry of cases) {
        value = entry.value;
        assert.deepEqual(await invoke(false), { code: entry.code, output: entry.text });
        assert.deepEqual(await invoke(true), { code: entry.code, output: JSON.stringify(value) + '\n' });
      }
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
      await f.cleanup();
    }
  });
}
