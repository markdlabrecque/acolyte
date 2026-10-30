import { createServer, type Server } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { once } from 'node:events';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { loadConfig, protectedFile } from './config.ts';
import { ownStore, ownSocket } from './host/store.ts';
import { spendingLedger } from './inference/budget.ts';
import { openRuntime, Rejection } from './runtime/pi-durable.ts';
import { authenticated, body, send, failure } from './http.ts';

process.umask(0o077);
let store: Awaited<ReturnType<typeof ownStore>> | undefined;
let socket: Awaited<ReturnType<typeof ownSocket>> | undefined;
let ledger: ReturnType<typeof spendingLedger> | undefined;
let runtime: Awaited<ReturnType<typeof openRuntime>> | undefined;
let server: Server | undefined;
let closing: Promise<void> | undefined;
function close() {
  return closing ??= (async () => {
    // Stop admission first. Release ownership only after all writers are closed.
    if (server?.listening) {
      const stopped = new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
      server.closeAllConnections();
      await stopped;
    }
    try {
      if (runtime) await runtime.close();
      else await store?.storage.close(context);
    } finally {
      try { ledger?.close(); }
      finally { try { await socket?.close(); } finally { await store?.unlock(); } }
    }
  })();
}
try {
  const config = await loadConfig(process.argv[2]!);
  const token = await protectedFile(config.authFile);
  await mkdir(dirname(config.socket), { recursive: true, mode: 0o700 });
  socket = await ownSocket(config.socket);
  store = await ownStore(config);
  ledger = spendingLedger(store.ledger, config);
  runtime = await openRuntime(store.storage, config, ledger);
  server = createServer((req, res) => {
    void (async () => {
      if (!authenticated(req, token)) throw new Rejection(401, 'Authentication required');
      if (req.headers['x-sender'] !== config.owner || req.headers['x-source'] !== 'cli') throw new Rejection(403, 'Route denied');
      const match = /^\/v1\/agents\/([^/]+)\/requests(?:\/([^/]+)(\/result)?)?$/.exec(req.url ?? '');
      if (!match || match[1] !== config.agentId) throw new Rejection(403, 'Route denied');
      if (req.method === 'POST' && !match[2]) {
        const result = await runtime!.submit(await body(req, config.limits.bodyBytes));
        send(res, result.status, result);
      } else if (req.method === 'GET' && match[2]) {
        const result = await runtime!.inspect(decodeURIComponent(match[2]), !!match[3]);
        send(res, result.status, result);
      } else throw new Rejection(400, 'Unsupported method');
    })().catch(error => failure(res, error));
  });
  server.listen(socket.bindPath);
  await once(server, 'listening');
  await socket.claim();
  console.log('runner ready');
  const shutdown = () => { void close().catch(() => { console.error('runner shutdown failed'); process.exitCode = 2; }); };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
} catch {
  try { await close(); } catch { /* Startup still fails closed. */ }
  console.error('runner startup failed');
  process.exitCode = 2;
}
