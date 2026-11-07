// Adapted from sandcastle-helper/board/board.mts, revision 488899a.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { RunStore } from './state.ts';

export async function renderBoard(store: RunStore, repo: string): Promise<string> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Invalid repository');
  let names: string[];
  try { names = await readdir(store.root); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') names = []; else throw e; }
  const now = new Date().toISOString();
  const runs = [];
  for (const name of names.filter(n => /^[1-9]\d*\.json$/.test(n)).sort()) {
    const r = await store.load(Number(name.slice(0, -5))); if (!r) throw new Error('Run disappeared');
    const stage = r.stage === 'merged' && !r.mergeSha ? 'stopped' : (({reserved: 'setup', 'waiting-ci': 'ci', merged: 'done', 'needs-human': 'stopped', waiting: 'waiting', queued: 'queued', implementing: 'implementing', 'repair-pending': 'implementing', checking: 'verifying', verifying: 'verifying', publishing: 'pushing', merging: 'ci'} as Record<string, string>)[r.stage] ?? 'stopped');
    const lastReview = Array.isArray(r.reviews) ? r.reviews.at(-1) : undefined;
    runs.push({key: String(r.issue), iid: String(r.issue), project: repo, title: typeof r.title === 'string' ? r.title : `Issue ${r.issue}`, ticketUrl: `https://github.com/${repo}/issues/${r.issue}`, mr: Number.isSafeInteger(r.pr) && r.pr! > 0 ? `https://github.com/${repo}/pull/${r.pr}` : undefined, stage, startedAt: typeof r.startedAt === 'string' ? r.startedAt : now, updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : now, stageSince: typeof r.stageSince === 'string' ? r.stageSince : now, note: `Recorded stage: ${r.stage}; repairs: ${r.repairsUsed}; reviews: ${r.reviews?.length ?? 0}`, verdict: lastReview?.verdict === 'APPROVE' ? 'PASS' : lastReview?.verdict});
  }
  const template = await readFile(fileURLToPath(new URL('./board.template.html', import.meta.url)), 'utf8');
  return template.replace('/*__DATA__*/null', JSON.stringify({runs, generatedAt: now}).replace(/</g, '\\u003c'));
}
export async function writeBoard(store: RunStore, repo: string, file: string): Promise<void> { await writeFile(file, await renderBoard(store, repo), {mode: 0o600}); }
