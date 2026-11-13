import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createRuntime} from './server.mjs';
import {StateStore} from './store.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('daemon progresses with no UI, saves state, resumes after restart and deduplicates commands',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'synthia-container-'));let runtime;
 try{
  runtime=await createRuntime({directory,tickMs:50});let address=await runtime.listen({port:0});let endpoint='http://127.0.0.1:'+address.port;
  const token=(await readFile(path.join(directory,'pairing-token'),'utf8')).trim(),headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
  const get=()=>fetch(endpoint+'/v1/state',{headers}).then(r=>r.json());
  assert.equal((await fetch(endpoint+'/v1/state')).status,401);
  const command=async value=>{const r=await fetch(endpoint+'/v1/commands',{method:'POST',headers,body:JSON.stringify(value)});assert.equal(r.status,200);return r.json();};
  const config={budget:200,scenario:{agents:[],structures:[{id:'autonomy.unreachable',position:8,health:0,required:1}],supplies:[]}};
  await command({action:'configure',config,requestId:randomUUID()});await command({action:'start',requestId:randomUUID()});
  const before=(await get()).tick;await sleep(180);const after=await get();assert.ok(after.tick>before);
  const request={action:'request',requestId:randomUUID(),request:{samples:Array.from({length:9},(_,i)=>[i,2*i+1])}};
  assert.deepEqual(await command(request),await command(request));assert.equal((await get()).production.tasks.length,1);
  await runtime.close();runtime=null;
  runtime=await createRuntime({directory,tickMs:50});address=await runtime.listen({port:0});endpoint='http://127.0.0.1:'+address.port;
  const restored=await get();assert.ok(restored.tick>=after.tick);assert.equal(restored.running,true);assert.equal(restored.production.tasks.length,1);
  await sleep(120);assert.ok((await get()).tick>restored.tick);
  assert.equal((await readFile(path.join(directory,'pairing-token'),'utf8')).trim(),token);
  await command({action:'pause',requestId:randomUUID()});const paused=(await get()).tick;await sleep(120);assert.equal((await get()).tick,paused);
 }finally{if(runtime)await runtime.close();await rm(directory,{recursive:true,force:true});}
});
test('invalid commands roll back state and corrupt checkpoints are preserved and rejected',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'synthia-container-'));let runtime;
 try{
  runtime=await createRuntime({directory,tickMs:50});const address=await runtime.listen({port:0}),token=(await readFile(path.join(directory,'pairing-token'),'utf8')).trim(),headers={Authorization:'Bearer '+token,'Content-Type':'application/json'},endpoint='http://127.0.0.1:'+address.port;
  const before=await fetch(endpoint+'/v1/checkpoint',{headers}).then(r=>r.json());
  const r=await fetch(endpoint+'/v1/commands',{method:'POST',headers,body:JSON.stringify({action:'rules',rules:{actionCost:-1},requestId:randomUUID()})});assert.equal(r.status,400);
  assert.deepEqual(await fetch(endpoint+'/v1/checkpoint',{headers}).then(r=>r.json()),before);
  await runtime.close();runtime=null;
  const file=path.join(directory,'checkpoint.json'),raw=await readFile(file,'utf8');await writeFile(file,raw.replace('synthia.container-state/v1','invalid'));
  await assert.rejects(()=>new StateStore(directory).load(),/integrity/);assert.equal(await readFile(file,'utf8'),raw.replace('synthia.container-state/v1','invalid'));
 }finally{if(runtime)await runtime.close();await rm(directory,{recursive:true,force:true});}
});
