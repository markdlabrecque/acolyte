import { createServer } from 'node:http';
import { loadConfig, protectedFile } from './config.ts';
import { Rejection } from './runtime/pi-durable.ts';
import { authenticated, body, forward, send, failure } from './http.ts';

try {
  const config = await loadConfig(process.argv[2]!);
  const token = await protectedFile(config.authFile);
  const server = createServer((req, res) => {
    void (async () => {
      if (!authenticated(req, token)) throw new Rejection(401, 'Authentication required');
      const match = /^\/v1\/agents\/([^/]+)\/requests(?:\/([^/]+)(\/result)?)?$/.exec(req.url ?? '');
      if (!match || match[1] !== config.agentId) throw new Rejection(403, 'Route denied');
      if (!(req.method === 'POST' && !match[2]) && !(req.method === 'GET' && match[2])) throw new Rejection(400, 'Unsupported method');
      const payload = req.method === 'POST' ? await body(req, config.limits.bodyBytes) : undefined;
      const response = await forward({ socketPath: config.socket, path: req.url!, method: req.method!, token, owner: config.owner }, payload);
      send(res, response.status, response.value);
    })().catch(error => failure(res, error));
  });
  server.listen(config.port, '127.0.0.1', () => console.log('gateway ready'));
  const close = () => { server.close(); server.closeAllConnections(); };
  process.once('SIGTERM', close);
  process.once('SIGINT', close);
} catch {
  console.error('gateway startup failed');
  process.exitCode = 2;
}
