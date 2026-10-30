import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import { writeFile, chmod } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { BACKGROUND_CONTEXT as context } from 'file:///home/mark/Projects/pi-durable-agents-td-002/node_modules/@earendil-works/chord/dist/context/index.js';
import { Harness, MemoryStorage, createRegistry, defineExtension, hook, GenerationTask, type TaskId } from 'file:///home/mark/Projects/pi-durable-agents-td-002/node_modules/@earendil-works/pi-durable/dist/index.js';
import { fauxAssistantMessage } from 'file:///home/mark/Projects/pi-durable-agents-td-002/node_modules/@earendil-works/pi-ai/dist/index.js';
import { inference } from 'file:///home/mark/Projects/pi-durable-agents-td-002/src/inference/deepinfra.ts';
import { spendingLedger, type Reservations } from 'file:///home/mark/Projects/pi-durable-agents-td-002/src/inference/budget.ts';
import { StateDoc } from 'file:///home/mark/Projects/pi-durable-agents-td-002/src/runtime/documents.ts';
import { todoExtension } from 'file:///home/mark/Projects/pi-durable-agents-td-002/src/tools/todos.ts';
import { fixture } from 'file:///home/mark/Projects/pi-durable-agents-td-002/tests/support.ts';
import type { Config } from 'file:///home/mark/Projects/pi-durable-agents-td-002/src/config.ts';

async function wire(handler: (body: Record<string, unknown>, res: ServerResponse, req: IncomingMessage) => Promise<void> | void) {
  const failures: unknown[] = [];
  let calls = 0;
  const server = createServer((req, res) => {
    void (async () => {
      assert.equal(req.url, '/v1/openai/chat/completions');
      assert.equal(req.headers.authorization, 'Bearer synthetic-model-token');
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      calls++;
      await handler(JSON.parse(Buffer.concat(chunks).toString()), res, req);
    })().catch(error => { failures.push(error); res.destroy(); });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return { endpoint: `http://127.0.0.1:${address.port}/v1/openai`, calls: () => calls,
    async close() { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); assert.deepEqual(failures, []); } };
}
function answer(res: ServerResponse, content: string, usage: boolean | Record<string, unknown> = true) {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  const chunk = { id: 'local-1', object: 'chat.completion.chunk', created: 1, model: 'deepseek-ai/DeepSeek-V4-Flash-0731' };
  res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }] })}\n\n`);
  res.write(`data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
    ...(usage ? { usage: usage === true ? { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 } : usage } : {}) })}\n\n`);
  res.end('data: [DONE]\n\n');
}
async function adapter(config: Config, ledger: Reservations, endpoint: string, startedAt = Date.now(),
  beforeGeneration?: (harness: Harness, taskId: TaskId) => Promise<void>) {
  let harness: Harness;
  const provider = inference(config, ledger, () => harness, endpoint);
  const tools = todoExtension(config);
  const registry = createRegistry();
  const arrange = defineExtension({ name: 'test-arrange-attempt', hooks: beforeGeneration ? [hook(GenerationTask, {
    beforeRequest: async (_request, api) => { await beforeGeneration(harness, api.taskId); return undefined; },
  })] : [] });
  registry.install(provider.guard); registry.install(tools); registry.install(arrange);
  harness = await Harness.open(new MemoryStorage(), { models: provider.models, registry,
    settings: { extensions: [provider.guard, tools, arrange], toolExecution: 'sequential', retry: { enabled: false }, stream: { maxRetries: 0 }, compaction: { enabled: false } } }, context);
  await harness.commit(async tx => {
    const doc = await tx.doc(StateDoc);
    doc.active = 'request';
    doc.receipts.request = { requestId: 'request', receipt: 'receipt', conversationId: 'demo', message: 'test', digest: 'digest',
      order: 1, state: 'running', startedAt, modelCalls: 0, toolCalls: 0, config };
  }, context);
  const conversation = await harness.root(context, { agent: { model: { provider: config.inference.provider, modelId: config.inference.model },
    extensions: [provider.guard, tools, arrange], tools: tools.tools } });
  return { harness, async run() {
    const submission = await conversation.submit({ type: 'input', content: 'test', requestId: 'test' }, context);
    return submission.wait(context);
  }, state: () => harness.snapshot(StateDoc, context), close: () => harness.close(context) };
}


const good={prompt_tokens:20,completion_tokens:5,total_tokens:25};
const cases=[
 ['usage-only-final',[{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}]},{choices:[],usage:good}],25],
 ['first-choice-fallback',[{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop',usage:good}]}],25],
 ['top-level-precedence',[{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop',usage:{prompt_tokens:200,completion_tokens:5,total_tokens:205}}],usage:good}],25],
 ['valid-then-incomplete',[{choices:[],usage:good},{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{prompt_tokens:20,total_tokens:25}}],null],
 ['valid-then-inconsistent',[{choices:[],usage:good},{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{...good,total_tokens:2500}}],null],
 ['incomplete-then-final-valid',[{choices:[],usage:{prompt_tokens:20}},{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:good}],25],
 ['cached-input',[{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{...good,prompt_tokens_details:{cached_tokens:12,cache_write_tokens:3}}}],25],
 ['top-cache-hit',[{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{...good,prompt_cache_hit_tokens:12}}],25],
 ['invalid-cache-overcount',[{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{...good,prompt_tokens_details:{cached_tokens:30}}}],null],
 ['negative-cache',[{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{...good,prompt_tokens_details:{cached_tokens:-1}}}],null],
 ['reasoning-in-completion',[{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{...good,completion_tokens_details:{reasoning_tokens:4}}}],25],
 ['invalid-first-choice-after-valid',[{choices:[],usage:good},{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop',usage:{completion_tokens:5,total_tokens:25}}]}],null],
 ['observer-valid-then-empty-object',[{choices:[],usage:good},{choices:[{index:0,delta:{content:'ok'},finish_reason:'stop'}],usage:{}}],null],
];
for (const [name,chunks,expected] of cases) test(name,{timeout:10000},async()=>{
 const f=await fixture(); f.config.inference.mode='live'; f.config.inference.credentialFile=f.config.authFile;
 await writeFile(f.config.authFile,'synthetic-model-token');
 const ledger=spendingLedger(f.config.ledger,f.config);
 const local=await wire((_body,res)=>{
  res.writeHead(200,{'content-type':'text/event-stream'});
  for(const chunk of chunks) res.write('data: '+JSON.stringify({id:'adversarial',object:'chat.completion.chunk',model:f.config.inference.model,...chunk})+'\n\n');
  res.end('data: [DONE]\n\n');
 });
 let app;
 try{
  app=await adapter(f.config,ledger,local.endpoint);
  assert.equal((await app.run()).status,'done'); assert.equal(local.calls(),1);
  const db=new DatabaseSync(f.config.ledger,{readOnly:true});
  try{
   const actual={...db.prepare('SELECT micro_usd,settled FROM reservations').get()};
   assert.deepEqual(actual,{micro_usd:expected??17408,settled:expected===null?0:1});
   console.log(JSON.stringify({name,...actual}));
  }finally{db.close();}
 }finally{await app?.close();await local.close();ledger.close();await f.cleanup();}
});
