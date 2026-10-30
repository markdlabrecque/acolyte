import { basename } from 'node:path';
import { parseEnv } from 'node:util';
import { protectedFile } from '../config.ts';

export async function deepInfraCredential(path: string): Promise<string> {
  const contents = await protectedFile(path);
  const name = basename(path);
  if (name !== '.env' && !name.startsWith('.env.')) return contents;
  // Parse only the selected protected file. Do not populate process.env or expand variables.
  let key: string | undefined;
  try { key = parseEnv(contents).DEEPINFRA_API_KEY?.trim(); } catch { /* Fail without exposing file contents. */ }
  if (!key || /[\r\n\x00]/.test(key)) throw new Error('Invalid or missing DEEPINFRA_API_KEY in credential file');
  return key;
}
