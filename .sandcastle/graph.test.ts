import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { implementerModel, pathsOverlap, schedule, type Ticket } from './graph.ts';

const ticket = (number: number, paths = [`src/${number}.ts`]): Ticket => ({ number, open: true, ready: true, dependencies: [], manifest: { current: true, paths } });
test('model declarations must be singular and known', () => {
  assert.equal(implementerModel('**Model:** Terra-6.1'), 'openai/gpt-6.1-terra');
  for (const body of ['', '**Model:** unknown', '**Model:** Luna-6\n**Model:** Luna-6']) assert.throws(() => implementerModel(body));
});
test('native dependency evidence must say completed', () => {
  const t = { ...ticket(26), dependencies: [25] };
  for (const state of ['open', 'not-planned', 'unknown'] as const) assert.equal(schedule([t], [{ number: 25, state }], [])[0].action, 'hold');
  assert.equal(schedule([t], [], [])[0].action, 'hold');
  assert.equal(schedule([t], [{ number: 25, state: 'completed' }], [])[0].action, 'launch');
  assert.equal(schedule([t], [{ number: 25, state: 'open' }, { number: 25, state: 'completed' }], [])[0].action, 'hold');
  assert.equal(schedule([{ ...t, dependencies: [26] }], [{ number: 26, state: 'completed' }], [])[0].action, 'hold');
});
test('path conflicts include active pull requests and new decisions', () => {
  assert.ok(pathsOverlap('src/**', 'src/a.ts'));
  assert.ok(pathsOverlap('src/foo', 'src/foo/bar.ts'));
  const decisions = schedule([ticket(27, ['src/a.ts']), ticket(28, ['src/a.ts']), ticket(29)], [], [{ number: 30, predictedPaths: ['old'], actualPaths: ['src/29.ts'] }]);
  assert.deepEqual(decisions.map(d => d.action), ['launch', 'hold', 'hold']);
});
test('persisted path aliases cannot admit overlapping implementations', () => {
  for (const alias of ['src/./same.ts', 'src//same.ts', '././src/same.ts']) {
    assert.equal(pathsOverlap(alias, 'src/same.ts'), true);
    assert.deepEqual(schedule([ticket(7, [alias]), ticket(8, ['src/same.ts'])], [], []).map(d => d.action), ['launch', 'hold']);
    assert.equal(schedule([ticket(7, ['src/same.ts'])], [], [{number: 8, predictedPaths: [alias]}])[0].action, 'hold');
  }
  for (const root of ['.', './', './.', '', '/', '../escape', 'src/../file']) assert.equal(pathsOverlap(root, 'unrelated/file'), true);
});

test('capacity, container, stale manifests and inherited readiness', () => {
  const tickets = [ticket(24), { ...ticket(25), ready: false, parentReady: true }, { ...ticket(26), manifest: undefined }, ticket(27), ticket(28), ticket(29)];
  assert.deepEqual(schedule(tickets, [], []).map(d => d.action), ['hold', 'launch', 'hold', 'launch', 'launch', 'hold']);
});
