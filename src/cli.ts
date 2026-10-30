#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { loadConfig, protectedFile } from './config.ts';
import { forward } from './http.ts';

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    config: { type: 'string' }, json: { type: 'boolean' }, agent: { type: 'string' },
    conversation: { type: 'string' }, 'request-id': { type: 'string' },
  } });
  if (!values.config) throw new Error('--config is required');
  const config = await loadConfig(values.config);
  const [command, ...args] = positionals;
  if (command === 'config' && args.length === 1 && args[0] === 'validate') {
    console.log(values.json ? JSON.stringify({ valid: true, fixture: config.inference.mode === 'fixture' }) : 'Configuration valid');
  } else {
    if (values.agent !== config.agentId) throw new Error('Explicit configured --agent is required');
    const token = await protectedFile(config.authFile);
    let path = `/v1/agents/${encodeURIComponent(config.agentId)}/requests`;
    let payload;
    if (command === 'submit') {
      if (!values.conversation || !values['request-id'] || args.length !== 1) throw new Error('submit requires --conversation, --request-id, and one message');
      payload = { schemaVersion: 1, conversationId: values.conversation, requestId: values['request-id'], message: args[0] };
    } else if ((command === 'status' || command === 'result') && args.length === 1) {
      path += `/${encodeURIComponent(args[0]!)}` + (command === 'result' ? '/result' : '');
    } else throw new Error('Expected submit, status, result, or config validate');
    let response;
    try { response = await forward({ port: config.port, path, method: payload ? 'POST' : 'GET', token }, payload); }
    catch { throw new Error(payload ? 'Acceptance unconfirmed. Retry the same request ID.' : 'Status unavailable; retry later.'); }
    if (response.status >= 400) {
      if (payload && response.status >= 500) throw new Error('Acceptance unconfirmed. Retry the same request ID.');
      throw new Error(`Request rejected: HTTP ${response.status}`);
    }
    console.log(values.json ? JSON.stringify(response.value) : JSON.stringify(response.value, null, 2));
    if (response.value.state === 'failed') process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Command failed');
  process.exitCode = 2;
}
