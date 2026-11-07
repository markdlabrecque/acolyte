import { execFile } from 'node:child_process';

export interface GitHubClient {
  request<T = unknown>(method: string, path: string, body?: unknown): Promise<T>;
}

export class GitHubRequestError extends Error {
  readonly status: number | undefined;
  constructor(status?: number) {
    super(status ? `GitHub request failed (${status})` : 'GitHub request failed or timed out');
    this.status = status;
  }
}

// gh-axi renders TOON even with --jq tojson. Machine evidence uses gh's raw JSON.
// Authentication remains inside the host CLI; credentials never enter arguments or logs.
export function createGitHubClient(_repo?: string): GitHubClient {
  return {
    request<T>(method: string, path: string, body?: unknown): Promise<T> {
      if (!/^(GET|POST|PUT|PATCH|DELETE)$/.test(method) || !/^repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_./?=&%-]+$/.test(path)) {
        return Promise.reject(new Error('Invalid GitHub request'));
      }
      return new Promise((resolve, reject) => {
        const args = ['api', '--hostname', 'github.com', '--method', method, path];
        if (body !== undefined) args.push('--input', '-');
        const child = execFile('gh', args, { timeout: 30_000, maxBuffer: 8 * 1024 * 1024 }, (error, stdout) => {
          let payload: unknown;
          try { payload = stdout.trim() ? JSON.parse(stdout) : undefined; }
          catch { return reject(new Error('Invalid GitHub JSON')); }
          if (error) {
            const raw = payload && typeof payload === 'object' ? (payload as { status?: unknown }).status : undefined;
            const canonical = typeof raw === 'number' && Number.isInteger(raw) && raw >= 400 && raw <= 599
              || typeof raw === 'string' && /^[45][0-9]{2}$/.test(raw);
            return reject(new GitHubRequestError(canonical ? Number(raw) : undefined));
          }
          if (payload === undefined && method !== 'DELETE') return reject(new Error('Missing GitHub JSON'));
          resolve(payload as T);
        });
        child.stdin?.on('error', () => {}); // A failed/timed-out child can close stdin before input is written.
        if (body !== undefined) child.stdin?.end(JSON.stringify(body));
      });
    },
  };
}
