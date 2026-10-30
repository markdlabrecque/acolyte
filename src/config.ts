import { readFile, stat } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { Type, type Static } from '@earendil-works/pi-ai';
import { Compile } from 'typebox/compile';

const object = { additionalProperties: false };
const text = Type.String({ minLength: 1, maxLength: 4096 });
const positive = Type.Integer({ minimum: 1, maximum: 1_000_000 });
const dollars = Type.Number({ minimum: 0, maximum: 1000 });
const Schema = Type.Object({
  schemaVersion: Type.Literal(1), agentId: Type.String({ pattern: '^[a-z][a-z0-9-]{0,63}$' }),
  revision: text, prompt: text, store: text, ledger: text, socket: text,
  port: Type.Integer({ minimum: 1024, maximum: 65535 }), authFile: text, owner: text,
  tools: Type.Array(Type.Union([Type.Literal('add_todo'), Type.Literal('list_todos')]), { minItems: 2, maxItems: 2, uniqueItems: true }),
  inference: Type.Object({
    mode: Type.Union([Type.Literal('fixture'), Type.Literal('live')]),
    provider: Type.Literal('deepinfra'), model: Type.Literal('deepseek-ai/DeepSeek-V4-Flash-0731'),
    credentialFile: Type.Union([text, Type.Null()]),
    inputUsdPerMillion: Type.Union([dollars, Type.Null()]), outputUsdPerMillion: Type.Union([dollars, Type.Null()]),
  }, object),
  limits: Type.Object({
    monthlyUsd: dollars, warningUsd: dollars, activeMs: positive, modelCalls: positive,
    toolCalls: positive, queued: Type.Integer({ minimum: 0, maximum: 20 }), inputTokens: positive,
    outputTokens: positive, connectMs: positive, progressMs: positive,
    bodyBytes: Type.Integer({ minimum: 1, maximum: 65536 }), listPage: Type.Integer({ minimum: 1, maximum: 100 }),
  }, object),
}, object);
const validator = Compile(Schema);
export type Config = Static<typeof Schema>;

export async function loadConfig(path: string): Promise<Config> {
  const value: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (!validator.Check(value)) throw new Error('Invalid configuration schema');
  for (const path of [value.store, value.ledger, value.socket, value.authFile, value.inference.credentialFile]) {
    if (path !== null && !isAbsolute(path)) throw new Error('Configuration paths must be absolute');
  }
  if (value.store === value.ledger || Buffer.byteLength(value.socket) > 100 || value.limits.warningUsd > value.limits.monthlyUsd) {
    throw new Error('Invalid storage, socket, or warning configuration');
  }
  return value;
}

export async function protectedFile(path: string): Promise<string> {
  const info = await stat(path);
  if (!info.isFile() || info.uid !== process.getuid?.() || (info.mode & 0o077) !== 0 || info.size > 16384) {
    throw new Error('Credential/authentication file must be owner-only and bounded');
  }
  const value = (await readFile(path, 'utf8')).trim();
  if (!value) throw new Error('Credential/authentication file is empty');
  return value;
}
