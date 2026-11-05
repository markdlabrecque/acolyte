import { createServer } from 'node:http';
import { loadConfig, protectedFile } from './config.ts';
import { Rejection } from './runtime/pi-durable.ts';
import { authenticated, body, forward, send, failure, requestRoute } from './http.ts';

try {
  const config = await loadConfig(process.argv[2]!);
  const token = await protectedFile(config.authFile);
  const server = createServer((req, res) => {
    void (async () => {
      if (!authenticated(req, token)) throw new Rejection(401, 'Authentication required');
      requestRoute(req, config.agentId);
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
