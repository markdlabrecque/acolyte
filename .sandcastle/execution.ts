import { execFile, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { lstat, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createBindMountSandboxProvider, createSandbox, pi, type ExecResult } from '@ai-hero/sandcastle';
import { PI_IMPLEMENT_TOOLS, PI_RESOURCE_ARGS, PI_REVIEW_TOOLS } from './pi-resources.ts';

export const quote = (s: string): string => `'${s.replaceAll("'", "'\\''")}'`;
export const isSha = (s: unknown): s is string => typeof s === 'string' && /^[a-f0-9]{40}$/.test(s);
export interface Command { (file: string, args: string[], options?: {cwd?: string; env?: NodeJS.ProcessEnv; stdin?: string; timeout?: number; onLine?: (line: string) => void}): Promise<ExecResult> }
export const command: Command = (file, args, options = {}) => new Promise((accept, reject) => {
  const child = execFile(file, args, {cwd: options.cwd, env: options.env, timeout: options.timeout ?? 60_000, maxBuffer: 16 * 1024 * 1024}, (error, stdout, stderr) => {
    if (error && (typeof error.code !== 'number' || error.killed)) return reject(new Error(`${file} execution failed or timed out`));
    accept({exitCode: error ? Number(error.code) : 0, stdout, stderr});
  });
  if (options.onLine) for (const stream of [child.stdout, child.stderr]) {
    let pending = '';
    stream?.on('data', (chunk: Buffer | string) => {
      const lines = (pending + chunk.toString()).split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) options.onLine!(line);
    });
    stream?.on('end', () => { if (pending) options.onLine!(pending); });
  }
  child.stdin?.on('error', () => {});
  child.stdin?.end(options.stdin);
});
export async function checked(file: string, args: string[], options: Parameters<Command>[2] = {}): Promise<string> {
  const result = await command(file, args, options);
  if (result.exitCode !== 0) throw new Error(`${file} command failed`);
  return result.stdout.trim();
}

export function codingEnvironment(env: NodeJS.ProcessEnv): Record<string, string> {
  const key = env.OPENAI_API_KEY;
  if (!key || /[\r\n\0]/.test(key)) throw new Error('Explicit OPENAI_API_KEY is required; host OAuth/auth directories are never copied');
  return {OPENAI_API_KEY: key};
}

export async function resolveImage(image: string): Promise<string> {
  const id = await checked('docker', ['image', 'inspect', '--format', '{{.Id}}', image]);
  if (!/^sha256:[a-f0-9]{64}$/.test(id)) throw new Error('Invalid local coding image identity');
  await checked('docker', ['run', '--rm', '--pull=never', '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--entrypoint', '/bin/sh', id, '-c', `test "$(id -u)" = "${process.getuid?.()}" && test "$(id -u)" != 0 && test "$(node --version)" = v24.20.0 && test "$(pi --version)" = 1.5.0 && ! command -v claude`]);
  return id;
}

export async function noDotEnv(root: string): Promise<void> {
  for (const [path, directory] of [[join(root, '.sandcastle'), true], [join(root, '.sandcastle', '.env'), false]] as const) {
    const info = await lstat(path).catch(error => { if (error.code === 'ENOENT') return undefined; throw error; });
    if (info && (!directory || !info.isDirectory() || info.isSymbolicLink())) throw new Error('Sandbox .env or unsafe .sandcastle directory is forbidden');
  }
}

export interface SessionOptions {
  clone: string; branch: string; baseSha: string; dependencies: string;
  image: string; readonly: boolean; online: boolean; install?: boolean; env?: Record<string, string>;
}

// Public SDK provider API. Git metadata is immutable even for implementers.
// This prevents model-written hooks/config/includes from executing on the host
// when Sandcastle or the controller later invokes git.
export function protectedDocker(options: SessionOptions, run: Command = command) {
  return createBindMountSandboxProvider({
    name: 'acolyte-protected-docker', sandboxHomedir: '/home/agent',
    create: async spec => {
      const uid = process.getuid?.(), gid = process.getgid?.();
      if (!uid || gid === undefined) throw new Error('A non-root Linux owner is required');
      const worktree = resolve(spec.worktreePath), git = join(resolve(options.clone), '.git');
      if (!worktree.startsWith(resolve(options.clone) + '/') || resolve(spec.hostRepoPath) !== resolve(options.clone)) throw new Error('SDK worktree escaped the isolated clone');
      const dependencyTarget = join(worktree, 'node_modules');
      const target = await lstat(dependencyTarget).catch(error => { if (error.code === 'ENOENT') return undefined; throw error; });
      if (target && (!target.isDirectory() || target.isSymbolicLink())) throw new Error('Unsafe dependency mount target');
      if (!target) await mkdir(dependencyTarget, {mode: 0o700});
      const mounts = [
        {hostPath: worktree, sandboxPath: '/home/agent/workspace', readonly: options.readonly},
        ...spec.mounts.filter(m => !((resolve(m.hostPath) === worktree && m.sandboxPath === '/home/agent/workspace') || (resolve(m.hostPath) === join(worktree, '.git') && m.sandboxPath === '/home/agent/workspace/.git'))).map(m => {
          if (resolve(m.hostPath) !== join(worktree, '.git') && resolve(m.hostPath) !== git && !resolve(m.hostPath).startsWith(git + '/')) throw new Error('Unexpected SDK Git mount');
          return {...m, readonly: true};
        }),
        {hostPath: join(worktree, '.git'), sandboxPath: '/home/agent/workspace/.git', readonly: true},
        {hostPath: options.dependencies, sandboxPath: '/home/agent/workspace/node_modules', readonly: !options.install},
      ];
      if (Object.keys(spec.env).length) throw new Error('Ambient SDK environment is forbidden');
      const env = options.online ? codingEnvironment(options.env ?? {}) : {};
      const name = `acolyte-${randomUUID()}`;
      const args = ['run', '--pull=never', '--detach', '--name', name, '--label', 'acolyte.workflow=true', '--read-only', '--user', `${uid}:${gid}`, '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--cpus', '2', '--pids-limit', '512', '--memory', '4g', '--memory-swap', '4g', '--workdir', '/home/agent/workspace', '--tmpfs', `/home/agent:rw,exec,nosuid,nodev,uid=${uid},gid=${gid},mode=700`, '--tmpfs', '/tmp:rw,exec,nosuid,nodev,mode=1777'];
      if (!options.online && !options.install) args.push('--network', 'none');
      for (const m of mounts) {
        if (/[\0\n,]/.test(m.hostPath + m.sandboxPath)) throw new Error('Unsafe Docker mount path');
        args.push('--mount', `type=bind,src=${m.hostPath},dst=${m.sandboxPath}${m.readonly ? ',readonly' : ''}`);
      }
      // Docker receives coding auth only. No host HOME, GitHub token, agent,
      // socket, application credentials or ambient environment is forwarded.
      for (const [key, value] of Object.entries(env)) args.push('--env', `${key}=${value}`);
      args.push('--entrypoint', '/bin/sleep', options.image, 'infinity');
      const started = await run('docker', args);
      if (started.exitCode !== 0) {
        await run('docker', ['rm', '--force', name]).catch(() => {});
        // Do not include Docker arguments or provider stderr in durable errors.
        throw new Error('Sandbox creation failed; inspect image availability and mount support');
      }
      let closed = false;
      const force = () => { if (!closed) { try { execFileSync('docker', ['rm', '--force', name], {timeout: 30_000, stdio: 'ignore'}); } catch {} } };
      process.once('exit', force);
      const close = async () => {
        if (closed) return;
        const result = await run('docker', ['rm', '--force', name]);
        if (result.exitCode !== 0) throw new Error('Container cleanup failed; inspect retained container');
        closed = true; process.removeListener('exit', force);
      };
      return {
        worktreePath: '/home/agent/workspace', sandboxId: name,
        exec: async (text, exec = {}) => {
          if (exec.sudo) throw new Error('Privileged execution is forbidden');
          const result = await run('docker', ['exec', '--interactive', '--workdir', exec.cwd ?? '/home/agent/workspace', name, 'sh', '-lc', text], {stdin: exec.stdin, timeout: 30 * 60_000, onLine: exec.onLine ? line => exec.onLine!(env.OPENAI_API_KEY ? line.replaceAll(env.OPENAI_API_KEY, '[redacted]') : line) : undefined});
          return result;
        },
        copyFileIn: async () => { throw new Error('Host file injection is forbidden'); },
        copyFileOut: async () => { throw new Error('Use retained repository evidence, not arbitrary file extraction'); },
        close,
      };
    },
  });
}

export async function openSession(options: SessionOptions) {
  await noDotEnv(options.clone);
  return createSandbox({cwd: options.clone, branch: options.branch, baseBranch: options.baseSha, sandbox: protectedDocker(options)});
}

export async function runPi(session: {exec(command: string, options?: {stdin?: string}): Promise<ExecResult>}, model: string, prompt: string, readonly: boolean): Promise<string> {
  if (!['openai/gpt-6-luna', 'openai/gpt-6.1-terra', 'openai/gpt-6.1-sol'].includes(model)) throw new Error('Unknown coding model');
  const agent = pi(model.slice('openai/'.length), {thinking: 'high', captureSessions: false});
  const built = agent.buildPrintCommand({prompt, dangerouslySkipPermissions: false});
  const flags = ' --provider openai ' + PI_RESOURCE_ARGS.join(' ') + ' --tools ' + (readonly ? PI_REVIEW_TOOLS : PI_IMPLEMENT_TOOLS).join(',');
  const result = await session.exec(built.command + flags, {stdin: built.stdin});
  if (result.exitCode !== 0) throw new Error('Coding model execution failed; no provider fallback is allowed');
  let answer: string | undefined;
  for (const line of result.stdout.split('\n')) for (const event of agent.parseStreamLine(line)) {
    if (event.type === 'error') throw new Error('Coding model reported an error');
    if (event.type === 'result') answer = event.result;
  }
  if (answer === undefined) throw new Error('Coding model returned no complete result');
  return answer;
}
