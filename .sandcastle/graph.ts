// Conservative scheduling primitives, adapted from sandcastle-helper's graph.mts.
// A missing piece of evidence is a hold, never an implicit approval.
export interface Ticket {
  number: number;
  open: boolean;
  ready: boolean;
  parentReady?: boolean;
  container?: boolean;
  holdReason?: string;
  dependencies: number[];
  manifest?: { current: boolean; paths: string[] };
}
export interface Dependency { number: number; state: 'open' | 'completed' | 'not-planned' | 'unknown' }
export interface LiveRun { number: number; predictedPaths: string[]; actualPaths?: string[] }
export interface Decision { number: number; action: 'launch' | 'hold'; reason: string }

// Glob claims deliberately over-approximate at the first metacharacter.
function claim(path: string): { stem: string; prefix: boolean } {
  const input = path.trim();
  if (!input || input.startsWith('/') || /[\\\x00-\x1f\x7f]/.test(input) || input.split('/').includes('..')) return { stem: '', prefix: true };
  // Normalize at comparison time too: old persisted claims may predate the
  // strict analysis parser. A repository-root alias claims the entire tree.
  const value = input.split('/').filter(part => part && part !== '.').join('/');
  if (!value) return { stem: '', prefix: true };
  const index = value.search(/[*?\[\]{}]/);
  return index < 0 ? { stem: value, prefix: input.endsWith('/') } : { stem: value.slice(0, index), prefix: true };
}
export function pathsOverlap(a: string, b: string): boolean {
  const x = claim(a), y = claim(b);
  const contains = (p: typeof x, q: typeof x) => p.prefix ? q.stem.startsWith(p.stem) : q.stem === p.stem || q.stem.startsWith(p.stem + '/');
  return contains(x, y) || contains(y, x);
}

export function schedule(tickets: Ticket[], dependencies: Dependency[], live: LiveRun[], max = 3, selectedIssue?: number): Decision[] {
  const evidence = new Map<number, Dependency['state']>();
  for (const dependency of dependencies) {
    if (evidence.has(dependency.number)) evidence.set(dependency.number, 'unknown');
    else evidence.set(dependency.number, dependency.state);
  }
  const occupied = [...live];
  return [...tickets].sort((a, b) => a.number - b.number).map(ticket => {
    const hold = (reason: string): Decision => ({ number: ticket.number, action: 'hold', reason });
    if (selectedIssue !== undefined && ticket.number !== selectedIssue) return hold('not selected');
    if (!ticket.open || ticket.container || ticket.number === 24 || !(ticket.ready || ticket.parentReady)) return hold('not an eligible implementation ticket');
    if (occupied.some(run => run.number === ticket.number)) return hold('already active');
    if (ticket.holdReason) return hold(ticket.holdReason);
    if (!ticket.manifest?.current || !ticket.manifest.paths.length) return hold('missing or stale manifest');
    for (const dependency of ticket.dependencies) {
      if (dependency === ticket.number || evidence.get(dependency) !== 'completed') return hold(`dependency ${dependency} not delivered`);
    }
    if (occupied.length >= Math.min(3, Math.max(0, max))) return hold('capacity');
    if (occupied.some(run => (run.actualPaths ?? run.predictedPaths).some(a => ticket.manifest!.paths.some(b => pathsOverlap(a, b))))) return hold('path conflict');
    occupied.push({ number: ticket.number, predictedPaths: ticket.manifest.paths });
    return { number: ticket.number, action: 'launch', reason: 'eligible' };
  });
}

const models: Record<string, string> = { 'Luna-6': 'openai/gpt-6-luna', 'Terra-6.1': 'openai/gpt-6.1-terra', 'Sol-6.1': 'openai/gpt-6.1-sol' };
export function implementerModel(body: string): string {
  const matches = [...body.matchAll(/^\s*\*\*Model:\*\*\s*(.*?)\s*$/gm)];
  if (matches.length !== 1 || !Object.hasOwn(models, matches[0][1])) throw new Error('expected exactly one known Model declaration');
  return models[matches[0][1]];
}
