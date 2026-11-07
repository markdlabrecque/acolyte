import { implementerModel } from './graph.ts';

export interface WorkItem { number: number; title: string; body: string; context?: string }
export interface Review { verdict: 'APPROVE' | 'REJECT'; headSha: string; findings: string[] }
export interface RunRecord {
  issue: number; stage: string; repairsUsed: number; reviews: Review[];
  headSha?: string; pr?: number; mergeSha?: string; error?: string;
  [key: string]: unknown;
}
export interface RunPorts {
  load(): Promise<RunRecord | undefined>;
  save(record: RunRecord): Promise<void>;
  implement(input: { ticket: WorkItem; model: string; repair: number; findings: string[] }): Promise<void>;
  acquireDelivery?(): Promise<() => Promise<void>>;
  checks(): Promise<{ passed: boolean; details: string }>;
  head(): Promise<string>;
  clean(): Promise<boolean>;
  verify(input: { ticket: WorkItem; model: string; headSha: string }): Promise<Review>;
  publish(input: { ticket: WorkItem; headSha: string; review: Review }): Promise<{ number: number }>;
  merge(input: { number: number; headSha: string; review: Review }): Promise<{ sha: string; merged: true }>;
}

const verifier = 'openai/gpt-6.1-sol';
const validReview = (value: Review): boolean => !!value && (value.verdict === 'APPROVE' || value.verdict === 'REJECT') && typeof value.headSha === 'string' && Array.isArray(value.findings) && value.findings.every(x => typeof x === 'string');

/** The caller must hold the issue reservation throughout this invocation. */
export async function runTicket(ticket: WorkItem, ports: RunPorts): Promise<RunRecord> {
  let record = await ports.load() ?? { issue: ticket.number, stage: 'reserved', repairsUsed: 0, reviews: [] };
  // Never act on malformed or foreign persisted evidence.
  if (record.issue !== ticket.number || !Number.isInteger(record.repairsUsed) || record.repairsUsed < 0 || record.repairsUsed > 2 || !Array.isArray(record.reviews) || !record.reviews.every(validReview)) throw new Error('invalid run record');
  const save = async (stage: string) => { record = { ...record, stage }; await ports.save(record); };
  const stop = async (message: string) => { record = { ...record, error: message }; await save('needs-human'); return record; };
  // Ports may persist worktree/branch metadata during an effect. Keep it without
  // allowing it to replace the controller's review, counter or stage evidence.
  const refresh = async () => {
    const stored = await ports.load();
    if (stored && stored.issue !== ticket.number) throw new Error('run record changed issue');
    const control = {
      issue: record.issue, stage: record.stage, repairsUsed: record.repairsUsed,
      reviews: record.reviews, headSha: record.headSha, pr: record.pr,
      mergeSha: record.mergeSha, error: record.error, checkFailures: record.checkFailures,
    };
    record = { ...record, ...stored, ...control };
  };
  const guard = async (sha: string) => {
    if (!sha || !(await ports.clean()) || await ports.head() !== sha) throw new Error('HEAD changed or worktree is not clean');
  };
  let releaseDelivery: (() => Promise<void>) | undefined;
  try {
    if (record.stage === 'merged' || record.stage === 'needs-human') return record;
    if (record.stage !== 'reserved' && record.stage !== 'waiting-ci') return await stop(`uncertain interrupted stage: ${record.stage}`);
    if (record.stage === 'reserved' && (record.repairsUsed !== 0 || record.reviews.length || record.headSha || record.pr)) return await stop('reserved record contains prior execution evidence');
    const model = implementerModel(ticket.body);
    let approval: Review;
    if (record.stage === 'waiting-ci') {
      releaseDelivery = await ports.acquireDelivery?.();
      const last = record.reviews.at(-1);
      if (!record.pr || !Number.isSafeInteger(record.pr) || record.pr < 1 || !record.headSha || !last || last.verdict !== 'APPROVE' || last.headSha !== record.headSha) return await stop('missing exact approval or PR evidence');
      approval = last;
    } else {
      let findings: string[] = [];
      for (;;) {
        await save('implementing');
        await ports.implement({ ticket, model, repair: record.repairsUsed, findings });
        await refresh();
        releaseDelivery = await ports.acquireDelivery?.();
        await save('checking');
        const checks = await ports.checks();
        await refresh();
        if (!checks.passed) {
          findings = [`Checks failed: ${checks.details}`];
          record = { ...record, checkFailures: [...(Array.isArray(record.checkFailures) ? record.checkFailures : []), checks.details] };
        } else {
          await save('verifying');
          const sha = await ports.head();
          await guard(sha);
          const review = await ports.verify({ ticket, model: verifier, headSha: sha });
          await refresh();
          if (!validReview(review)) throw new Error('malformed review');
          record = { ...record, reviews: [...record.reviews, review] };
          await save('verifying');
          if (review.headSha !== sha) throw new Error('review is bound to a different HEAD');
          await guard(sha);
          if (review.verdict === 'APPROVE') {
            approval = review;
            record = { ...record, headSha: sha };
            break;
          }
          findings = review.findings.length ? review.findings : ['Review rejected without findings'];
        }
        if (releaseDelivery) { await releaseDelivery(); releaseDelivery = undefined; }
        if (record.repairsUsed >= 2) return await stop('repair limit reached');
        record = { ...record, repairsUsed: record.repairsUsed + 1 };
        // Persist the consumed repair before starting the next implementation.
        await save('repair-pending');
      }
      await guard(record.headSha!);
      await save('publishing');
      const pr = await ports.publish({ ticket, headSha: record.headSha!, review: approval });
      await refresh();
      if (!Number.isSafeInteger(pr.number) || pr.number < 1) throw new Error('invalid published PR');
      record = { ...record, pr: pr.number };
      await save('waiting-ci');
    }
    await guard(record.headSha!);
    // A crash after this marker may have merged remotely; never replay it.
    await save('merging');
    const merged = await ports.merge({ number: record.pr!, headSha: record.headSha!, review: approval });
    await refresh();
    if (merged.merged !== true || typeof merged.sha !== 'string' || !merged.sha) throw new Error('merge not confirmed');
    record = { ...record, mergeSha: merged.sha, error: undefined };
    await save('merged');
    return record;
  } catch (error) {
    // Include metadata persisted by an effect even if it threw after a write.
    await refresh();
    return await stop(error instanceof Error ? error.message : 'unknown effect failure');
  } finally {
    await releaseDelivery?.();
  }
}
