// Loopback-only manual preview; no arbitrary evidence file routes.
import { createServer, type Server } from 'node:http';
import { renderBoard } from './board.ts';
import type { RunStore } from './state.ts';
export function serveBoard(store: RunStore, repo: string, port = 0): Promise<Server> {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
  const server = createServer(async (req, res) => {
    if (req.method !== 'GET' || req.url !== '/') { res.writeHead(404); res.end('Not found'); return; }
    try { const html = await renderBoard(store, repo); res.writeHead(200, {'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store'}); res.end(html); }
    catch { res.writeHead(500); res.end('Board unavailable'); }
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(server)); });
}
