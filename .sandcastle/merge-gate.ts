import { GitHubRequestError, type GitHubClient } from './github.ts';

export interface MergeRequest {
  repo: string;
  number: number;
  expectedHeadSha: string;
  expectedBase: string;
  review: { verdict: 'APPROVE'; headSha: string };
  // Trusted controller's last ticket/context/path fence, including resumed runs.
  beforeMerge?: () => Promise<void>;
}

const sha = (s: unknown): s is string => typeof s === 'string' && /^[a-f0-9]{40}$/.test(s);
const fail = (): never => { throw new Error('Merge gate: missing, conflicting or unsafe evidence'); };
// GitHub's published application ID for GitHub Actions.
const actions = 15368;
const names = ['tests', 'typecheck'];

// The owner authorized adding CI and merging this delivery. This is a one-time
// trust anchor for that reviewed workflow, not a switch that disables CI checks.
// Once main advances, a missing base workflow always blocks again.
export const INITIAL_CI_BOOTSTRAP = Object.freeze({
  repo: 'markdlabrecque/acolyte',
  baseSha: '8672f4a90f5f8078882e92f17aba75d41b3db6ee',
  workflowBlobSha: '0adae0e36df61d8543164b16df0679d0026aa05e',
});

export async function mergeAfterCi(client: GitHubClient, request: MergeRequest): Promise<{ sha: string; merged: true }> {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(request.repo) || !Number.isSafeInteger(request.number) || request.number < 1 || request.expectedBase !== 'main' || !sha(request.expectedHeadSha) || request.review?.verdict !== 'APPROVE' || request.review.headSha !== request.expectedHeadSha) fail();
  const root = `repos/${request.repo}`;
  // The client is deliberately untrusted at this boundary: malformed JSON must fail closed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const get = (path: string): Promise<any> => client.request('GET', root + path);
  const readPr = async () => {
    const p = await get(`/pulls/${request.number}`);
    if (!p || p.number !== request.number || p.state !== 'open' || p.merged !== false || p.draft !== false || p.head?.sha !== request.expectedHeadSha || p.base?.ref !== request.expectedBase || p.base?.repo?.full_name !== request.repo || p.head?.repo?.full_name !== request.repo || !sha(p.base?.sha) || p.mergeable !== true || p.mergeable_state !== 'clean') fail();
    return p;
  };
  const first = await readPr();
  // CI checks out the exact head, not an implicit merge ref. Prove this head
  // already contains the observed main tip, so it includes the tested base.
  const verifyBase = async () => {
    const branch = await get(`/branches/${request.expectedBase}`);
    const comparison = await get(`/compare/${first.base.sha}...${request.expectedHeadSha}`);
    if (branch?.commit?.sha !== first.base.sha || comparison?.base_commit?.sha !== first.base.sha || comparison?.merge_base_commit?.sha !== first.base.sha || !['ahead', 'identical'].includes(comparison?.status) || !Array.isArray(comparison?.commits) || comparison.total_commits !== comparison.commits.length) fail();
    const testedTip = comparison.status === 'identical' ? first.base.sha : comparison.commits.at(-1)?.sha;
    if (testedTip !== request.expectedHeadSha) fail();
  };
  await verifyBase();
  // A PR must not replace the trusted base workflow with same-named no-op jobs.
  let baseWorkflow;
  let confirmedMissing = false;
  try { baseWorkflow = await get(`/contents/.github/workflows/ci.yml?ref=${first.base.sha}`); }
  catch (error) {
    if (!(error instanceof GitHubRequestError) || error.status !== 404 || request.repo !== INITIAL_CI_BOOTSTRAP.repo || first.base.sha !== INITIAL_CI_BOOTSTRAP.baseSha) throw error;
    confirmedMissing = true;
  }
  const headWorkflow = await get(`/contents/.github/workflows/ci.yml?ref=${request.expectedHeadSha}`);
  if (headWorkflow?.type !== 'file' || !sha(headWorkflow.sha)) fail();
  if (!confirmedMissing) {
    if (baseWorkflow?.type !== 'file' || !sha(baseWorkflow.sha) || baseWorkflow.sha !== headWorkflow.sha) fail();
  } else if (request.repo !== INITIAL_CI_BOOTSTRAP.repo || first.base.sha !== INITIAL_CI_BOOTSTRAP.baseSha || headWorkflow.sha !== INITIAL_CI_BOOTSTRAP.workflowBlobSha) fail();
  const protection = await get(`/branches/${request.expectedBase}/protection`);
  const required = protection?.required_status_checks;
  if (required?.strict !== true || protection?.enforce_admins?.enabled !== true || protection?.allow_force_pushes?.enabled !== false || protection?.allow_deletions?.enabled !== false || !Array.isArray(required.checks) || !Array.isArray(required.contexts)) fail();
  // An unpinned context, duplicate context, or foreign app can weaken the policy.
  if (required.checks.length !== 2 || required.contexts.length !== 2 || new Set(required.contexts).size !== 2 || names.some(n => !required.contexts.includes(n)) || names.some(n => required.checks.filter((c: { context?: unknown; app_id?: unknown }) => c.context === n && c.app_id === actions).length !== 1)) fail();
  const verifyChecks = async () => {
  const checks = await get(`/commits/${request.expectedHeadSha}/check-runs?per_page=100`);
  if (!Array.isArray(checks?.check_runs) || checks.total_count !== checks.check_runs.length || checks.total_count > 100) fail();
  const statuses = await get(`/commits/${request.expectedHeadSha}/status?per_page=100`);
  if (statuses?.sha !== request.expectedHeadSha || !Array.isArray(statuses.statuses) || statuses.total_count !== statuses.statuses.length || statuses.total_count > 100 || statuses.statuses.some((s: { context?: unknown }) => names.includes(String(s.context)))) fail();
  const runs = await get(`/actions/runs?head_sha=${request.expectedHeadSha}&per_page=100`);
  if (!Array.isArray(runs?.workflow_runs) || runs.total_count !== runs.workflow_runs.length || runs.total_count > 100) fail();
  // A push executes the workflow at its pushed SHA. PR runs execute a merge-ref
  // definition, which can differ after retargeting even when head_sha is unchanged.
  const candidates = runs.workflow_runs.filter((r: { event?: unknown; path?: unknown; name?: unknown }) => r.event === 'push' && (r.path === '.github/workflows/ci.yml' || r.name === 'CI'));
  if (candidates.length !== 1) fail();
  const run = candidates[0];
  if (!Number.isSafeInteger(first.base.repo.id) || first.base.repo.id < 1 || first.head.repo.id !== first.base.repo.id || typeof first.head.ref !== 'string' || !first.head.ref || run.repository?.id !== first.base.repo.id || run.head_repository?.id !== first.base.repo.id) fail();
  // Associations are mutable and are never execution provenance. Push runs can
  // precede PR creation and legitimately have none. Reject conflicting metadata
  // when present; trust comes from push + exact SHA + the pinned workflow blob.
  if (!Array.isArray(run.pull_requests)) fail();
  if (run.pull_requests.length) {
    const associated = run.pull_requests.filter((p: {number?: unknown}) => p.number === request.number);
    if (associated.length !== 1) fail();
    const context = associated[0];
    if (context.url !== `https://api.github.com/repos/${request.repo}/pulls/${request.number}` || context.head?.sha !== request.expectedHeadSha || context.head?.ref !== first.head.ref || context.base?.sha !== first.base.sha || context.base?.ref !== request.expectedBase || [context.head?.repo, context.base?.repo].some(r => r?.id !== first.base.repo.id || r?.url !== `https://api.github.com/repos/${request.repo}`)) fail();
  }
  if (!Number.isSafeInteger(run.id) || !Number.isSafeInteger(run.workflow_id) || run.name !== 'CI' || run.path !== '.github/workflows/ci.yml' || run.head_sha !== request.expectedHeadSha || run.head_branch !== first.head.ref || run.event !== 'push' || run.status !== 'completed' || run.conclusion !== 'success' || run.repository?.full_name !== request.repo || run.head_repository?.full_name !== request.repo) fail();
  const workflow = await get(`/actions/workflows/${run.workflow_id}`);
  if (workflow?.id !== run.workflow_id || workflow.name !== 'CI' || workflow.path !== '.github/workflows/ci.yml' || workflow.state !== 'active') fail();
  const jobs = await get(`/actions/runs/${run.id}/jobs?filter=latest&per_page=100`);
  if (!Array.isArray(jobs?.jobs) || jobs.total_count !== jobs.jobs.length || jobs.total_count > 100) fail();
  for (const name of names) {
    const matches = checks.check_runs.filter((c: { name?: unknown }) => c.name === name);
    const jobMatches = jobs.jobs.filter((j: { name?: unknown }) => j.name === name);
    if (matches.length !== 1 || jobMatches.length !== 1) fail();
    const c = matches[0], j = jobMatches[0];
    if (!Number.isSafeInteger(c.id) || c.app?.id !== actions || c.head_sha !== request.expectedHeadSha || c.status !== 'completed' || c.conclusion !== 'success' || j.id !== c.id || j.run_id !== run.id || j.head_sha !== request.expectedHeadSha || j.status !== 'completed' || j.conclusion !== 'success' || j.check_run_url !== `https://api.github.com/repos/${request.repo}/check-runs/${c.id}`) fail();
  }
  };
  await verifyChecks();
  const second = await readPr();
  if (second.base.sha !== first.base.sha) fail();
  await verifyChecks();
  const finalPr = await readPr();
  if (finalPr.base.sha !== first.base.sha || finalPr.head.ref !== first.head.ref || finalPr.base.repo.id !== first.base.repo.id || finalPr.head.repo.id !== first.head.repo.id) fail();
  await verifyBase();
  await request.beforeMerge?.();
  const result = await client.request<{ merged?: unknown; sha?: unknown }>('PUT', `${root}/pulls/${request.number}/merge`, { sha: request.expectedHeadSha });
  if (result?.merged !== true || !sha(result.sha)) fail();
  const merged = await get(`/pulls/${request.number}`);
  if (merged?.number !== request.number || merged.state !== 'closed' || merged.merged !== true || typeof merged.merged_at !== 'string' || !merged.merged_at || merged.merge_commit_sha !== result.sha || merged.head?.sha !== request.expectedHeadSha || merged.base?.ref !== request.expectedBase || merged.base?.repo?.full_name !== request.repo) fail();
  return { sha: result.sha as string, merged: true };
}
