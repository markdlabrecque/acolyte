import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSandbox } from '@ai-hero/sandcastle';
import { checked, codingEnvironment, command, noDotEnv, protectedDocker, runPi, type SessionOptions } from './execution.ts';
import { parseReview } from './adapter.ts';

const key = 'synthetic-coding-credential-not-a-real-key';

test('coding environment is explicit and never forwards ambient host credentials', () => {
  assert.deepEqual(codingEnvironment({OPENAI_API_KEY: key, GH_TOKEN: 'host-only', HOME: '/host', SSH_AUTH_SOCK: '/host/socket', DEEPINFRA_API_KEY: 'product-only'}), {OPENAI_API_KEY: key});
  for (const env of [{}, {OPENAI_API_KEY: ''}, {OPENAI_API_KEY: 'bad\nkey'}]) assert.throws(() => codingEnvironment(env));
});

test('SDK cwd guard refuses dotenv files and linked configuration directories without reading them', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sandbox-env-'));
  try {
    await noDotEnv(root);
    await mkdir(join(root, '.sandcastle'));
    await writeFile(join(root, '.sandcastle', '.env'), 'GH_TOKEN=must-not-load');
    await assert.rejects(noDotEnv(root));
    await rm(join(root, '.sandcastle'), {recursive: true});
    await symlink('/unavailable/host-auth-directory', join(root, '.sandcastle'));
    await assert.rejects(noDotEnv(root));
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('Pi uses explicit provider/model, fresh context and actual readonly tool restrictions', async () => {
  let calls = 0;
  const sandbox = {async exec(text: string, options?: {stdin?: string}) {
    calls++;
    assert.match(text, /--model 'gpt-6\.1-sol'/);
    assert.match(text, /--provider openai/);
    for (const flag of ['no-session', 'no-extensions', 'no-skills', 'no-context-files', 'no-prompt-templates', 'no-themes']) assert.ok(text.includes(`--${flag}`));
    assert.ok(text.includes('--system-prompt /dev/null --append-system-prompt /dev/null'));
    assert.ok(text.endsWith('--tools read,grep,find,ls'));
    assert.equal(options?.stdin, 'Synthetic review prompt');
    return {exitCode: 0, stderr: '', stdout: JSON.stringify({type: 'agent_end', messages: [{role: 'assistant', stopReason: 'stop', content: [{type: 'text', text: 'approved-result'}]}]})};
  }};
  assert.equal(await runPi(sandbox, 'openai/gpt-6.1-sol', 'Synthetic review prompt', true), 'approved-result');
  await assert.rejects(runPi(sandbox, 'unknown/model', 'x', true));
  assert.equal(calls, 1);
  await assert.rejects(runPi({exec: async () => ({exitCode: 0, stdout: '', stderr: ''})}, 'openai/gpt-6-luna', 'x', true));
});

test('implementation-requested checks cannot acquire a shell in the online Pi session', async () => {
  let calls = 0;
  await assert.rejects(runPi({exec: async (text, options) => {
    calls++; assert.ok(text.endsWith('--tools read,edit,write,grep,find,ls'));
    assert.ok(!text.includes('--tools read,edit,write,bash'));
    assert.equal(options?.stdin, 'Please run npm test && npm run typecheck');
    return {exitCode: 0, stdout: '', stderr: ''};
  }}, 'openai/gpt-6.1-terra', 'Please run npm test && npm run typecheck', false), /no complete result/);
  assert.equal(calls, 1);
});

test('review JSON cannot approve another revision, ambiguous output or unresolved findings', () => {
  const head = 'a'.repeat(40);
  assert.equal(parseReview(JSON.stringify({verdict: 'APPROVE', headSha: head, findings: []}), head).verdict, 'APPROVE');
  for (const value of [{verdict: 'APPROVE', headSha: 'b'.repeat(40), findings: []}, {verdict: 'APPROVE', headSha: head, findings: ['must fix']}, {verdict: 'approve', headSha: head, findings: []}, null]) assert.throws(() => parseReview(JSON.stringify(value), head));
});

test('command transport streams complete lines and keeps bounded result semantics', async () => {
  const lines: string[] = [];
  const result = await command(process.execPath, ['-e', 'process.stdout.write("first\\nsecond");'], {onLine: line => lines.push(line)});
  assert.equal(result.exitCode, 0); assert.equal(result.stdout, 'first\nsecond');
  assert.deepEqual(lines, ['first', 'second']);
});

for (const mode of ['coding', 'checks', 'install'] as const) test(`public SDK provider creates ${mode} isolation without host secrets or writable Git metadata`, async () => {
  const root = await mkdtemp(join(tmpdir(), 'sandbox-provider-'));
  try {
    const clone = join(root, 'repo'), dependencies = join(root, 'dependencies');
    await mkdir(clone); await mkdir(dependencies);
    await checked('git', ['init', '--initial-branch=main', clone]);
    await writeFile(join(clone, 'fixture.txt'), 'fixture');
    await checked('git', ['-C', clone, 'add', 'fixture.txt']);
    await checked('git', ['-C', clone, '-c', 'core.hooksPath=/dev/null', '-c', 'user.name=Workflow fixture', '-c', 'user.email=fixture@localhost', 'commit', '-m', 'fixture']);
    const baseSha = await checked('git', ['-C', clone, 'rev-parse', 'HEAD']);
    const calls: string[][] = [];
    const options: SessionOptions = {clone, dependencies, branch: `fixture-${mode}`, baseSha, image: 'synthetic-image', readonly: mode !== 'coding', online: mode === 'coding', install: mode === 'install', env: {OPENAI_API_KEY: key, GH_TOKEN: 'never-forward', HOME: '/host', SSH_AUTH_SOCK: '/host/socket'}};
    const sandbox = await createSandbox({cwd: clone, branch: options.branch, baseBranch: baseSha, sandbox: protectedDocker(options, async (_file, args) => { calls.push(args); return {exitCode: 0, stdout: '', stderr: ''}; })});
    try {
      const args = calls.find(c => c[0] === 'run')!;
      assert.ok(args.includes('--read-only')); assert.ok(args.includes('no-new-privileges'));
      assert.equal(args[args.indexOf('--cap-drop') + 1], 'ALL');
      assert.ok(!args.join(' ').includes('never-forward'));
      assert.ok(!args.join(' ').includes('/host'));
      assert.ok(!args.join(' ').includes('docker.sock'));
      const mounts = args.flatMap((s, i) => s === '--mount' ? [args[i + 1]] : []);
      const worktree = mounts.find(m => m.includes('dst=/home/agent/workspace,') || m.endsWith('dst=/home/agent/workspace'))!;
      assert.equal(worktree.endsWith(',readonly'), mode !== 'coding');
      for (const git of mounts.filter(m => m.includes('.git'))) assert.ok(git.endsWith(',readonly'), git);
      assert.ok(mounts.some(m => m.includes('dst=/home/agent/workspace/.git,readonly')));
      assert.equal(mounts.find(m => m.includes('dst=/home/agent/workspace/node_modules'))!.endsWith(',readonly'), mode !== 'install');
      assert.equal(args.includes('--env'), mode === 'coding');
      assert.equal(args.includes('--network'), mode === 'checks');
    } finally { await sandbox.close(); }
    assert.equal(calls.filter(c => c[0] === 'rm').length, 1);
  } finally { await rm(root, {recursive: true, force: true}); }
});
