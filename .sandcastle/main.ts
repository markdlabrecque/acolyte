import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dispatchOnce } from './dispatch.ts';
import { RunStore } from './state.ts';
import { writeBoard } from './board.ts';
import { serveBoard } from './board-server.ts';
import { defaultBase, defaultImage, repo, stateRoot } from './config.ts';
import { createGitHubClient, GitHubRequestError, type GitHubClient } from './github.ts';
import { discoverTickets, type WorkItem } from './tracker.ts';

const source = dirname(dirname(fileURLToPath(import.meta.url)));
const help = `Usage:
  node .sandcastle/main.ts dispatch (--dry-run | --live) [--max 1..3]
  node .sandcastle/main.ts run --issue NUMBER (--dry-run | --live)
  node .sandcastle/main.ts analyze --issue NUMBER --live
  node .sandcastle/main.ts board generate
  node .sandcastle/main.ts board serve [--port PORT]

Target: markdlabrecque/acolyte, main. Starts are manual; no service is installed.
Dry-run uses read-only GitHub APIs and existing manifests. No auth files,
state, locks, models, board, labels, image probes or builds are touched.
--live authorizes coding-provider execution, not product/operational acceptance.
Set OPENAI_API_KEY explicitly. Host OAuth/auth directories are never copied.`;

type Command = {kind: 'help'} | {kind: 'dispatch' | 'run' | 'analyze'; base: string; live: boolean; issue?: number; max?: number} | {kind: 'generate'} | {kind: 'serve'; port: number};
export function parseArgs(args: string[]): Command {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) return {kind: 'help'};
  if (args[0] === 'dispatch' || args[0] === 'run' || args[0] === 'analyze') {
    const kind = args[0], seen = new Set<string>();
    let live = false, mode = false, issue: number | undefined, max: number | undefined;
    for (let i = 1; i < args.length; i++) {
      const flag = args[i];
      if (seen.has(flag)) throw new Error('Duplicate argument');
      seen.add(flag);
      if (flag === '--live' || flag === '--dry-run') {
        if (mode) throw new Error('Choose exactly one execution mode');
        live = flag === '--live'; mode = true;
      } else if (flag === '--base') {
        if (args[++i] !== defaultBase) throw new Error('Only main is supported');
      } else if ((flag === '--issue' && kind !== 'dispatch') || (flag === '--max' && kind === 'dispatch')) {
        const text = args[++i];
        if (!/^[1-9]\d*$/.test(text ?? '') || !Number.isSafeInteger(Number(text))) throw new Error('Invalid numeric argument');
        if (flag === '--issue') issue = Number(text); else max = Number(text);
      } else throw new Error('Unknown or inapplicable argument');
    }
    if (!mode || (kind !== 'dispatch' && issue === undefined) || (max !== undefined && max > 3) || (kind === 'analyze' && !live)) throw new Error('Explicit execution mode and valid selection are required');
    return {kind, base: defaultBase, live, ...(issue === undefined ? {} : {issue}), ...(max === undefined ? {} : {max})};
  }
  if (args[0] === 'board' && args[1] === 'generate' && args.length === 2) return {kind: 'generate'};
  if (args[0] === 'board' && args[1] === 'serve') {
    if (args.length === 2) return {kind: 'serve', port: 0};
    if (args.length === 4 && args[2] === '--port' && /^\d+$/.test(args[3])) {
      const port = Number(args[3]);
      if (Number.isSafeInteger(port) && port <= 65535) return {kind: 'serve', port};
    }
  }
  throw new Error('Invalid command; use --help');
}

// GET only. An explicitly exported GH_TOKEN is optional; never use gh/auth files.
export const publicClient: GitHubClient = {
  async request<T>(method: string, path: string): Promise<T> {
    if (method !== 'GET' || !path.startsWith(`repos/${repo}/`) || !/^[A-Za-z0-9_./?=&%-]+$/.test(path)) throw new Error('Invalid public request');
    const token = process.env.GH_TOKEN;
    if (token && /[\r\n\0]/.test(token)) throw new Error('Invalid explicit GitHub preview token');
    const response = await fetch(`https://api.github.com/${path}`, {headers: {'accept': 'application/vnd.github+json', 'user-agent': 'acolyte-sandcastle', ...(token ? {'authorization': `Bearer ${token}`} : {})}, signal: AbortSignal.timeout(30_000), redirect: 'error'});
    if (!response.ok) throw new GitHubRequestError(response.status);
    return await response.json() as T;
  },
};

interface Dependencies {
  store?: RunStore; client?: GitHubClient; output?: (s: string) => void; repoRoot?: string;
  preflight?: () => Promise<void>;
  launch?: (item: WorkItem) => Promise<unknown>;
  analyze?: (issue: number) => Promise<unknown>;
}
export async function main(args: string[], dependencies: Dependencies = {}): Promise<void> {
  const command = parseArgs(args), output = dependencies.output ?? console.log;
  if (command.kind === 'help') { output(help); return; }
  const repoRoot = dependencies.repoRoot ?? source;
  const store = dependencies.store ?? new RunStore(stateRoot(repoRoot));
  if (command.kind === 'generate') {
    const path = join(dirname(store.root), 'board.html');
    await mkdir(dirname(path), {recursive: true, mode: 0o700});
    await writeBoard(store, repo, path); output(path); return;
  }
  if (command.kind === 'serve') {
    const server = await serveBoard(store, repo, command.port), address = server.address();
    if (!address || typeof address === 'string') throw new Error('Board failed to bind');
    output(`http://127.0.0.1:${address.port}/`); return;
  }
  if (command.live) await (dependencies.preflight ?? (async () => {
    const {codingEnvironment, checked} = await import('./execution.ts');
    codingEnvironment(process.env);
    await checked('docker', ['image', 'inspect', '--format', '{{.Id}}', defaultImage]);
  }))();
  const client = dependencies.client ?? (command.live ? createGitHubClient() : publicClient);
  const options = {repoRoot, repo, base: command.base, store};
  if (command.kind === 'analyze') {
    const result = await (dependencies.analyze ?? (async issue => {
      const {adapterRuntime} = await import('./adapter.ts');
      return (await import('./analyze.ts')).analyzeTicket({...options, issue}, {...adapterRuntime(), client});
    }))(command.issue!);
    output(JSON.stringify(result, null, 2)); return;
  }
  const launch = dependencies.launch ?? (async (ticket: WorkItem) => {
    const adapter = await import('./adapter.ts');
    const result = await adapter.executeReserved({...options, ticket}, {...adapter.adapterRuntime(), client});
    if (result.stage !== 'merged') throw new Error(`Issue ${ticket.number} held at ${result.stage}; inspect durable evidence`);
    return result;
  });
  if (command.live && command.kind === 'run') {
    const existing = await store.load(command.issue!);
    if (existing) {
      const data = await discoverTickets(client, repo, command.base), ticket = data.items.find(i => i.number === command.issue);
      if (!ticket) throw new Error('Issue not found');
      output(JSON.stringify(await launch(ticket), null, 2)); return;
    }
  }
  const decisions = await dispatchOnce({dryRun: !command.live, max: command.max, issue: command.issue}, {client, ...options, launch: command.live ? launch : async () => { throw new Error('Dry-run must not launch'); }});
  output(JSON.stringify(decisions, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error instanceof Error ? error.message : 'Command failed'); process.exitCode = 1; });
}
