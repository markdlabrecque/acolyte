import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { realpathSync } from 'node:fs';

export const repo = 'markdlabrecque/acolyte';
export const defaultBase = 'main';
export const defaultImage = 'sandcastle:acolyte';

// A git-common-dir is shared by all worktrees of this repository.
export function stateRoot(source: string): string {
  const common = execFileSync('git', ['-C', source, 'rev-parse', '--git-common-dir'], {encoding: 'utf8'}).trim();
  if (!common) throw new Error('Cannot determine repository common directory');
  return join(realpathSync(resolve(source, common)), 'sandcastle', 'state');
}
