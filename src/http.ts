import { request, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { Type } from '@earendil-works/pi-ai';
import { Compile } from 'typebox/compile';
import { Rejection } from './runtime/pi-durable.ts';

const id = Type.String({ pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$' });
const inputSchema = Compile(Type.Object({ schemaVersion: Type.Literal(1), conversationId: id, requestId: id,
  message: Type.String({ minLength: 1, maxLength: 16384 }) }, { additionalProperties: false }));
export function authenticated(req: IncomingMessage, token: string) {
  const value = Buffer.from(req.headers.authorization ?? '');
  const expected = Buffer.from(`Bearer ${token}`);
  return value.length === expected.length && timingSafeEqual(value, expected);
}
export function send(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(value));
}
export async function body(req: IncomingMessage, maximum: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maximum) throw new Rejection(413, 'Payload too large');
    chunks.push(chunk);
  }
  let value: unknown;
  try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Rejection(400, 'Malformed JSON'); }
  if (!inputSchema.Check(value) || ['constructor', 'prototype', '__proto__'].some(key => value.requestId === key || value.conversationId === key)) {
    throw new Rejection(400, 'Invalid request schema');
  }
  return value;
}
export function forward(options: { socketPath?: string; port?: number; path: string; method: string; token: string; owner?: string }, payload?: unknown) {
  return new Promise<{ status: number; value: Record<string, unknown> }>((resolve, reject) => {
    const req = request({ socketPath: options.socketPath, hostname: '127.0.0.1', port: options.port,
      path: options.path, method: options.method, headers: { authorization: `Bearer ${options.token}`, 'content-type': 'application/json',
        ...(options.owner ? { 'x-sender': options.owner, 'x-source': 'cli', 'x-correlation-id': crypto.randomUUID(), 'x-received-at': new Date().toISOString() } : {}),
      } }, response => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 1_000_000) req.destroy(new Error('Response too large'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => {
        try { resolve({ status: response.statusCode ?? 503, value: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
        catch { reject(new Error('Invalid transport response')); }
      });
    });
    req.setTimeout(5000, () => req.destroy(new Error('Transport timeout')));
    req.on('error', reject);
    req.end(payload === undefined ? undefined : JSON.stringify(payload));
  });
}
export function failure(res: ServerResponse, error: unknown) {
  send(res, error instanceof Rejection ? error.status : 503,
    { error: error instanceof Rejection ? error.message : 'Runner/storage unavailable' });
}
