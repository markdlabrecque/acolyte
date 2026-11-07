import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { LiveRun } from './graph.ts';

// Structurally matches the lifecycle's RunRecord without importing its implementation.
export interface RunRecord { issue: number; stage: string; repairsUsed: number; reviews: {verdict: 'APPROVE'|'REJECT'; headSha: string; findings: string[]}[]; headSha?: string; pr?: number; mergeSha?: string; error?: string; [key: string]: unknown }
function id(n: number): string { if (!Number.isSafeInteger(n) || n < 1) throw new Error('Invalid issue number'); return String(n); }
async function json<T>(file: string): Promise<T | undefined> {
  try { return JSON.parse(await readFile(file, 'utf8')) as T; }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw e; }
}
export class RunStore {
  readonly root: string;
  constructor(root: string) { this.root = root; }
  async load(issue: number): Promise<RunRecord | undefined> {
    const value = await json<RunRecord>(join(this.root, `${id(issue)}.json`));
    if (value && (value.issue !== issue || typeof value.stage !== 'string' || !value.stage || !Number.isInteger(value.repairsUsed) || value.repairsUsed < 0 || value.repairsUsed > 2 || !Array.isArray(value.reviews) || !value.reviews.every(r => r && (r.verdict === 'APPROVE' || r.verdict === 'REJECT') && typeof r.headSha === 'string' && Array.isArray(r.findings) && r.findings.every(x => typeof x === 'string')) || (value.pr !== undefined && (!Number.isSafeInteger(value.pr) || value.pr < 1)) || (value.executionToken !== undefined && (typeof value.executionToken !== 'string' || !value.executionToken)))) throw new Error('Invalid run record');
    return value;
  }
  private async write(file: string, value: unknown): Promise<void> {
    await mkdir(this.root, {recursive: true, mode: 0o700});
    const tmp = join(this.root, `.${randomUUID()}.tmp`);
    try { await writeFile(tmp, JSON.stringify(value, null, 2), {mode: 0o600, flag: 'wx'}); await rename(tmp, file); }
    finally { await rm(tmp, {force: true}); }
  }
  async save(record: RunRecord): Promise<void> {
    const file = join(this.root, `${id(record.issue)}.json`);
    const old = await this.load(record.issue);
    if (old?.executionToken !== undefined && record.executionToken !== old.executionToken) throw new Error('Execution token is immutable');
    const now = new Date().toISOString();
    await this.write(file, {...record, startedAt: old?.startedAt ?? now, updatedAt: now, stageSince: old?.stage === record.stage ? old.stageSince ?? now : now});
  }
  async live(): Promise<LiveRun[]> {
    let files: string[];
    try { files = await readdir(this.root); } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []; throw e; }
    const runs: LiveRun[] = [];
    for (const file of files.filter(f => /^[1-9]\d*\.json$/.test(f))) {
      const n = Number(file.slice(0, -5)); const r = await this.load(n);
      if (!r) throw new Error('Run disappeared');
      const predicted = Array.isArray(r.predictedPaths) && r.predictedPaths.every(x => typeof x === 'string') ? r.predictedPaths as string[] : [];
      const actual = Array.isArray(r.actualPaths) && r.actualPaths.every(x => typeof x === 'string') ? r.actualPaths as string[] : [];
      const unknownPublishedDiff = !!r.pr && !actual.length;
      runs.push({number: n, predictedPaths: predicted.length ? predicted : [''], actualPaths: predicted.length && !unknownPublishedDiff ? [...predicted, ...actual] : ['']});
    }
    return runs;
  }
  async manifest(issue: number, fingerprint: string): Promise<{current: boolean; paths: string[]} | undefined> {
    const m = await json<{fingerprint: string; paths: string[]}>(join(this.root, `manifest-${id(issue)}.json`));
    if (!m) return undefined;
    if (typeof m.fingerprint !== 'string' || !Array.isArray(m.paths) || !m.paths.every(x => typeof x === 'string')) throw new Error('Invalid manifest');
    return {current: m.fingerprint === fingerprint, paths: m.paths};
  }
  async saveManifest(issue: number, fingerprint: string, paths: string[]): Promise<void> {
    if (typeof fingerprint !== 'string' || !Array.isArray(paths) || !paths.every(x => typeof x === 'string')) throw new Error('Invalid manifest');
    await this.write(join(this.root, `manifest-${id(issue)}.json`), {fingerprint, paths});
  }
  async withLock<T>(fn: () => Promise<T>): Promise<T> { return this.lock('dispatch.lock', fn); }
  async withIssueLock<T>(issue: number, fn: () => Promise<T>): Promise<T> { return this.lock(`issue-${id(issue)}.lock`, fn); }
  async acquireDeliveryLock(): Promise<() => Promise<void>> { return this.acquire('delivery.lock', 3 * 60 * 60_000); }
  private async lock<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire(name, 5_000);
    try { return await fn(); } finally { await release(); }
  }
  private async acquire(name: string, wait: number): Promise<() => Promise<void>> {
    await mkdir(this.root, {recursive: true, mode: 0o700});
    const lock = join(this.root, name);
    // Never steal a lock, even if its process appears dead. Operator inspection is required.
    const deadline = Date.now() + wait;
    for (;;) {
      try { await mkdir(lock, {mode: 0o700}); break; }
      catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST' || Date.now() >= deadline) throw new Error('Dispatch lock unavailable; inspect ownership'); await new Promise(r => setTimeout(r, 25)); }
    }
    const token = randomUUID();
    await writeFile(join(lock, 'owner'), token, {mode: 0o600, flag: 'wx'});
    return async () => {
      // Do not remove a lock whose ownership has changed or cannot be established.
      if (await readFile(join(lock, 'owner'), 'utf8').catch(() => '') === token) await rm(lock, {recursive: true});
    };
  }
}
