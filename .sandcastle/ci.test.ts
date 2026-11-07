import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('CI uses the checkout and setup-node release commits verified against GitHub', async () => {
  // Verified through each upstream release tag's GitHub API ref before publication.
  // The first remote run failed on a mistyped setup-node SHA despite offline checks.
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const actions = [...workflow.matchAll(/^\s+- uses: (\S+)/gm)].map(match => match[1]);
  assert.deepEqual(actions, [
    'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
  ]);
});
