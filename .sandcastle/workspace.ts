import { checked, command, isSha } from './execution.ts';

let identity: Promise<{name: string; email: string}> | undefined;

// This controller runs in its own Node process. The SDK also invokes host git,
// so sanitize its inherited Git configuration before opening any candidate.
// SSH authentication remains host-only; no configuration file is changed.
export function initializeHostGit(source: string): Promise<{name: string; email: string}> {
  identity ??= (async () => {
    const name = await checked('git', ['-C', source, 'config', '--get', 'user.name']);
    const email = await checked('git', ['-C', source, 'config', '--get', 'user.email']);
    if (!name || !email || /[\r\n\0]/.test(name + email) || /claude|anthropic/i.test(name + email)) throw new Error('A human Git identity is required');
    for (const key of Object.keys(process.env)) if (key.startsWith('GIT_')) delete process.env[key];
    process.env.GIT_CONFIG_GLOBAL = '/dev/null';
    process.env.GIT_CONFIG_SYSTEM = '/dev/null';
    process.env.GIT_CONFIG_NOSYSTEM = '1';
    process.env.GIT_TERMINAL_PROMPT = '0';
    return {name, email};
  })();
  return identity;
}

export async function ownedGit(root: string, args: string[], human?: {name: string; email: string}): Promise<string> {
  // Immutable candidate Git metadata plus disabled global config prevents
  // attributes, hooks and fsmonitor from turning Git operations into host code.
  const env: NodeJS.ProcessEnv = {...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))), GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0'};
  if (human) Object.assign(env, {GIT_AUTHOR_NAME: human.name, GIT_COMMITTER_NAME: human.name, GIT_AUTHOR_EMAIL: human.email, GIT_COMMITTER_EMAIL: human.email});
  const result = await command('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', '-c', 'submodule.recurse=false', '-c', 'fetch.recurseSubmodules=false', '-C', root, ...args], {env, timeout: 120_000});
  if (result.exitCode !== 0) throw new Error('Trusted Git operation failed');
  return args.includes('-z') ? result.stdout : result.stdout.trim();
}

export async function fetchBase(clone: string, repo: string, base: string): Promise<string> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || base !== 'main') throw new Error('Invalid publication target');
  await ownedGit(clone, ['fetch', '--no-tags', '--no-recurse-submodules', `https://github.com/${repo}.git`, base]);
  const sha = await ownedGit(clone, ['rev-parse', 'FETCH_HEAD']);
  if (!isSha(sha)) throw new Error('Invalid fetched base');
  return sha;
}

export async function prepareClone(source: string, clone: string, repo: string, base: string, expected: string): Promise<void> {
  await initializeHostGit(source);
  if (!isSha(expected)) throw new Error('Missing reservation base');
  await ownedGit(source, ['clone', '--no-local', '--no-checkout', '--', source, clone]);
  await ownedGit(clone, ['remote', 'remove', 'origin']);
  await ownedGit(clone, ['config', 'core.hooksPath', '/dev/null']);
  await ownedGit(clone, ['config', 'core.fsmonitor', 'false']);
  await ownedGit(clone, ['config', 'submodule.recurse', 'false']);
  await ownedGit(clone, ['config', 'fetch.recurseSubmodules', 'false']);
  if (await fetchBase(clone, repo, base) !== expected) throw new Error('Base advanced since reservation; analyze and reserve again');
}
