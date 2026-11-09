import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../core/world.js';
import {Substrate} from '../core/substrate.js';
import {AutonomousSwarm} from '../core/autonomy.js';
import {LocalProduction,runProgram,programSource} from '../core/production.js';
const samples=Array.from({length:12},(_,i)=>{const x=i/4;return [x,Math.sin(x*2+.5)];});
function setup(){const core=new Substrate();new World(core);const swarm=new AutonomousSwarm(core),p=new LocalProduction(swarm);swarm.control(true);swarm.step();swarm.control(false);return p;}
test('relationships enable an ability unavailable to either member alone',()=>{
 const p=setup(),result=p.learn(samples);assert.ok(result.tool);assert.ok(result.tool.program.length>1);assert.ok(result.evidence.heldout>0);assert.ok(result.evidence.validationError<1e-12);
 for(const member of result.tool.members)assert.ok(!result.tool.program.every(s=>p.core.require(member).state.primitives.includes(s.op)));
 assert.ok(Math.abs(runProgram(result.tool.program,.333)-Math.sin(.333*2+.5))<1e-12);
});
test('missing clusters and permissions reject without spending energy or recording success',()=>{
 const swarm=new AutonomousSwarm(new Substrate()),p=new LocalProduction(swarm),before=p.core.export();assert.throws(()=>p.learn(samples),/cluster/);assert.deepEqual(p.core.export(),before);
 const active=setup();active.core.change('production',{permissions:{...active.state.permissions,compose:false}},'test');const snapshot=active.core.export();assert.throws(()=>active.learn(samples),/permission/);assert.deepEqual(active.core.export(),snapshot);
});
test('bounded search retains failed evidence and spends finite trial energy',()=>{const p=setup(),energies=p.swarm.agents().map(a=>a.state.energy);const r=p.learn(samples.map(([x])=>[x,999]));assert.equal(r.tool,null);assert.equal(p.state.attempts.at(-1).accepted,false);assert.ok(r.evidence.tested<=600);assert.ok(p.swarm.agents().some((a,i)=>a.state.energy<energies[i]));});
test('relation dissolution and distance revoke ability without deleting learned memory',()=>{
 const p=setup(),{tool}=p.learn(samples);p.bind(tool.id,'world');assert.notEqual(p.sample('world',.5),null);
 for(const a of p.swarm.agents())p.core.change(a.id,{ties:{}},'dissolve');assert.equal(p.sample('world',.5),null);assert.equal(p.state.tools.length,1);assert.throws(()=>p.bind(tool.id,'world'),/cluster/);
});
test('checkpoint contains programs, bindings, provenance and feedback',()=>{
 const p=setup(),{tool}=p.learn(samples);p.bind(tool.id,'world');p.feedback('world',.05);
 const q=new LocalProduction(AutonomousSwarm.restore(p.swarm.checkpoint()));assert.deepEqual(q.state,p.state);assert.equal(q.sample('world',.7),p.sample('world',.7));assert.deepEqual(Substrate.replay(p.core.export()).snapshot(),p.core.snapshot());
});
test('emitted JavaScript executes the tested composed function',async()=>{const p=setup(),{tool}=p.learn(samples),source=programSource(tool.program);const module=await import('data:text/javascript,'+encodeURIComponent(source));for(const x of [-2,.11,3])assert.equal(module.transform(x),runProgram(tool.program,x));assert.throws(()=>module.transform(Infinity));});
test('invalid samples and programs cannot inject host operations',()=>{const p=setup(),before=p.core.export();assert.throws(()=>p.learn([[1,2]]));assert.throws(()=>p.learn(Array(6).fill([0,1])));assert.throws(()=>runProgram([{op:'fetch',value:'https://example.com'}],0));assert.throws(()=>programSource([{op:'scale',value:'process.exit()'}]));assert.deepEqual(p.core.export(),before);});
test('morph permission immediately suspends a live binding',()=>{const p=setup(),{tool}=p.learn(samples);p.bind(tool.id,'world');p.swarm.setPermission('morph',false);assert.equal(p.sample('world',.5),null);assert.throws(()=>p.bind(tool.id,'world'));p.swarm.setPermission('morph',true);assert.notEqual(p.sample('world',.5),null);});

test('new anonymous participants coordinate and learn on the shared clock without relay instructions',()=>{
 const core=new Substrate();new World(core);
 const swarm=new AutonomousSwarm(core,{scenario:{structures:[],supplies:[],agents:[
  {id:'autonomy.ember',position:-1,primitives:['scale','bias']},
  {id:'autonomy.tide',position:1,primitives:['sin']},
  {id:'autonomy.moss',position:2,primitives:['clamp']}
 ]}}),p=new LocalProduction(swarm);
 assert.equal(p.clusters().length,0);p.request({samples,target:'player'});swarm.control(true);while(swarm.step()){}
 assert.equal(p.state.tasks[0].status,'completed');assert.equal(p.state.bindings.length,1);assert.ok(p.state.tools[0].members.every(id=>!['autonomy.scout','autonomy.carrier','autonomy.builder'].includes(id)));
 assert.ok(core.events.some(e=>e.data.kind==='coordinates'));assert.equal(swarm.state.completed,true);
});
test('coefficients are inferred from unfamiliar measurements rather than selected from fixed presets',()=>{
 const p=setup(),data=Array.from({length:12},(_,i)=>[i/7,3.7*i/7-1.2]),{tool}=p.learn(data);
 assert.ok(tool);assert.ok(tool.program.some(s=>s.value!==undefined&&![.5,-.5,1,-1,2].includes(s.value)));assert.ok(Math.abs(runProgram(tool.program,.123)-(3.7*.123-1.2))<1e-10);
});
test('lost participants can be replaced by a different compatible relationship cluster',()=>{
 const p=setup(),{tool}=p.learn(samples);p.bind(tool.id,'player');for(const id of tool.members)p.swarm.setAgentActive(id,false);assert.equal(p.sample('player',1),null);
 const a=p.swarm.addAgent({id:'autonomy.new-a',primitives:['scale','bias']}),b=p.swarm.addAgent({id:'autonomy.new-b',primitives:['sin']});
 p.core.change(a.id,{ties:{[b.id]:.8}},'observed cooperation');assert.notEqual(p.sample('player',1),null);assert.equal(p.state.tools.length,1);
});
test('a blocked demand survives checkpoint and is reconsidered when peers become available',()=>{
 const core=new Substrate();new World(core);const swarm=new AutonomousSwarm(core,{scenario:{structures:[],supplies:[],agents:[]}}),p=new LocalProduction(swarm);p.request({samples,target:'player'});swarm.control(true);swarm.step();swarm.control(false);assert.equal(p.state.tasks[0].status,'blocked');
 const restored=AutonomousSwarm.restore(swarm.checkpoint()),q=new LocalProduction(restored);
 restored.addAgent({id:'autonomy.a',position:0,primitives:['scale','bias']});restored.addAgent({id:'autonomy.b',position:1,primitives:['sin']});restored.control(true);while(restored.step()){}assert.equal(q.state.tasks[0].status,'completed');
});
test('a supplied candidate is tested and still requires collective primitive permissions',()=>{
 const p=setup(),data=Array.from({length:12},(_,i)=>[i/7,Math.sin(i/7*3.7-1.2)]),proposal=[{op:'scale',value:3.7},{op:'bias',value:-1.2},{op:'sin'}];
 const {tool}=p.learn(data,{proposals:[proposal],maxCandidates:1});assert.ok(tool);assert.deepEqual(tool.program,proposal);
 const q=setup();for(const a of q.swarm.agents())q.core.change(a.id,{primitives:['scale','bias']},'no sine capability');assert.equal(q.learn(data,{proposals:[proposal],maxCandidates:1}).tool,null);
});
test('recovered local-model transport proposes data and receives no held-out examples',async()=>{
 const {proposeLocalProgram}=await import('../core/local-model.js');let sent;
 const proposal=await proposeLocalProgram(samples,{}, {model:{ask:async messages=>{sent=JSON.parse(messages[1].content);return JSON.stringify({program:[{op:'sin'}]});}}});
 assert.deepEqual(proposal,[{op:'sin'}]);assert.equal(sent.examples.length,8);
 await assert.rejects(()=>proposeLocalProgram(samples,{}, {model:{ask:async()=>'{"program":[{"op":"fetch"}]}'}}));
});
