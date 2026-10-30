import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = resolve(root, 'tmp/plans/durable-todo-slice.packed.html');
mkdirSync(dirname(output), { recursive: true });
execFileSync(process.execPath, [
  resolve(homedir(), '.pi/agent/skills/html-plan/runtime/pack.mjs'),
  resolve(root, 'docs/plans/durable-todo-slice.html'),
  '--root', root, '-o', output,
], { stdio: 'inherit' });

// Keep the exported feedback controls independent of any assistant brand.
const page = readFileSync(output, 'utf8')
  .replaceAll('Comment for Claude…', 'Comment for the assistant')
  .replaceAll('Copied — paste it back to Claude', 'Copied. Paste it back to the assistant.')
  .replaceAll('This goes to Claude when you press Send.', 'This returns your plan response.')
  .replaceAll('Copy this and paste it to Claude.', 'Copy this response and paste it into the conversation.')
  .replaceAll('"Anthropic Sans", ', '')
  .replaceAll('"Anthropic Serif", ', '')
  .replaceAll('"Anthropic Mono", ', '');
writeFileSync(output, page);
