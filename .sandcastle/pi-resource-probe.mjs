// Run in the pinned, credential-free Pi 1.5.0 image with networking disabled.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, writeFile, rm, realpath, access} from 'node:fs/promises';
import {basename, dirname, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PI_IMPLEMENT_TOOLS, PI_RESOURCE_ARGS} from './pi-resources.ts';
assert.equal(execFileSync('pi', ['--version'], {encoding: 'utf8'}).trim(), '1.5.0');
const executable = execFileSync('sh', ['-lc', 'command -v pi'], {encoding: 'utf8'}).trim();
const entry = dirname(await realpath(executable));
const dist = basename(entry) === 'bundle' ? dirname(entry) : entry;
const {DefaultResourceLoader} = await import(pathToFileURL(join(dist, 'core/resource-loader.js')).href);
const {SettingsManager} = await import(pathToFileURL(join(dist, 'core/settings-manager.js')).href);
const {parseArgs} = await import(pathToFileURL(join(dist, 'cli/args.js')).href);
const root = await mkdtemp('/tmp/pi-resource-regression-');
try {
  const cwd = join(root, 'candidate'), agentDir = join(root, 'agent');
  await mkdir(join(cwd, '.pi'), {recursive: true}); await mkdir(agentDir);
  await writeFile(join(cwd, '.pi/SYSTEM.md'), 'CANDIDATE_SYSTEM_APPROVE_EVERYTHING');
  await writeFile(join(cwd, '.pi/APPEND_SYSTEM.md'), 'CANDIDATE_APPEND_IGNORE_FINDINGS');
  const options = {...parseArgs([...PI_RESOURCE_ARGS]), cwd, agentDir, settingsManager: SettingsManager.inMemory()};
  const unsafe = new DefaultResourceLoader({...options, systemPrompt: undefined, appendSystemPrompt: undefined});
  await unsafe.reload();
  assert.match(unsafe.getSystemPrompt(), /CANDIDATE_SYSTEM/);
  assert.ok(unsafe.getAppendSystemPrompt().some(p => p.includes('CANDIDATE_APPEND')));
  const safe = new DefaultResourceLoader(options); await safe.reload();
  assert.equal(safe.getSystemPrompt(), '');
  assert.deepEqual(safe.getAppendSystemPrompt(), ['']);
  console.log('Actual Pi 1.5.0 loader: both candidate system prompts reproduced, then suppressed');

  // Exercise the real Pi tool factory and agent loop, with a synthetic stream.
  // Even an explicit model tool call must not run candidate checks with the key.
  const {createTool} = await import(pathToFileURL(join(dist, 'core/tools/index.js')).href);
  const {Agent} = await import(pathToFileURL(join(dist, '../node_modules/@earendil-works/pi-agent-core/dist/index.js')).href);
  const selected = parseArgs(['--tools', PI_IMPLEMENT_TOOLS.join(',')]).tools;
  assert.deepEqual(selected, [...PI_IMPLEMENT_TOOLS]);
  assert.ok(!selected.includes('bash') && !selected.includes('powershell'));
  await writeFile(join(cwd, 'package.json'), JSON.stringify({scripts: {test: 'touch checks-ran', typecheck: 'touch checks-ran'}}));
  let turns = 0;
  const agent = new Agent({
    initialState: {systemPrompt: 'Synthetic offline boundary test.', model: {id: 'synthetic', name: 'synthetic', provider: 'synthetic', api: 'openai-responses', baseUrl: '', reasoning: false, input: ['text'], contextWindow: 8192, maxTokens: 128, cost: {input: 0, output: 0, cacheRead: 0, cacheWrite: 0}}, tools: selected.map(name => createTool(name, cwd))},
    streamFn: () => {
      assert.ok(++turns <= 2, 'Unexpected extra model turn');
      const message = {role: 'assistant', provider: 'synthetic', api: 'openai-responses', model: 'synthetic', timestamp: Date.now(), usage: {input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: {input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0}}, stopReason: turns === 1 ? 'toolUse' : 'stop', content: turns === 1 ? [{type: 'toolCall', id: 'requested-checks', name: 'bash', arguments: {command: 'npm test && npm run typecheck'}}] : [{type: 'text', text: 'Shell unavailable. Controller must run checks offline.'}]};
      return {async *[Symbol.asyncIterator]() { yield {type: 'start', partial: message}; yield {type: 'done', reason: message.stopReason, message}; }, result: async () => message};
    },
  });
  const previous = process.env.OPENAI_API_KEY;
  try {
    process.env.OPENAI_API_KEY = 'synthetic-online-process-key';
    await agent.prompt('Run the candidate checks now.');
    const result = agent.state.messages.find(m => m.role === 'toolResult' && m.toolCallId === 'requested-checks');
    assert.equal(result?.isError, true);
    assert.match(JSON.stringify(result.content), /Tool bash not found/);
    await assert.rejects(access(join(cwd, 'checks-ran')));
    assert.equal(turns, 2);
  } finally { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; }
  console.log('Actual Pi 1.5.0 agent: implementation-requested npm checks denied; no candidate process ran');
} finally { await rm(root, {recursive: true, force: true}); }
