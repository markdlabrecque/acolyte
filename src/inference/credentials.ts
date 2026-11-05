import { basename } from 'node:path';
import { parseEnv } from 'node:util';
import { protectedFile } from '../config.ts';

export async function deepInfraCredential(path: string): Promise<string> {
  const contents = await protectedFile(path);
  const name = basename(path);
  // Parse only the selected protected file. Do not populate process.env or expand variables.
  let key: string | undefined = contents;
  if (name === '.env' || name.startsWith('.env.')) {
    try { key = parseEnv(contents).DEEPINFRA_API_KEY?.trim(); } catch { key = undefined; }
  }
  // Only visible ASCII is safe in a bearer token. Reject before an HTTP library
  // can include an invalid header value in its error message.
  if (!key || !/^[\x21-\x7e]+$/.test(key)) throw new Error('Invalid or missing DEEPINFRA_API_KEY in credential file');
  return key;
}
