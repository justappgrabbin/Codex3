import test from 'node:test';
import assert from 'node:assert/strict';
import {Substrate} from '../core/substrate.js';
import {ExperienceSession} from '../core/experience.js';
import {PrimitiveSwarm} from '../core/primitive-swarm.js';
import {primitiveSwarm} from '../core/primitives.js';
const finish=r=>{for(let i=0;i<500&&r.state.running;i++)r.step();return r.state.result;};
const observations=[{id:'content',type:'records',value:[{label:'Actual supplied content'},{label:'Retained content'}]},{id:'template',type:'template',value:{tag:'p',text:'{label}'}},{id:'layout',type:'layout',value:{axis:'row',columns:1}}];
const custom=()=>new PrimitiveSwarm(new Substrate()).registerType('number',x=>typeof x==='number'&&Number.isFinite(x));
test('discovers a previously unspecified graph, executes it on fresh inputs and promotes it to a primitive',()=>{
 const r=custom();
 r.register({id:'double',inputs:{n:'number'},output:'number',run:({n})=>n*2});
 r.register({id:'increase',inputs:{n:'number'},output:'number',run:({n})=>n+1});
 r.observe([{id:'seed',type:'number',value:3}]).seek({type:'number',constraints:[{equals:8}]});
 const result=finish(r);assert.equal(result.value,8);assert.ok(result.cluster);assert.equal(r.invoke(result.cluster,{seed:7}),16);
 const graph=r.core.require(result.cluster).state.graph;assert.equal(graph.steps.length,2);
 assert.ok(r.registry.has('cluster.'+result.cluster.split('.').at(-1)));
 assert.ok([...r.core.relations.values()].some(x=>x.kind==='primitive-port-binding'));
 // The promoted graph is eligible as an input-producing primitive at the next scale.
 r.observe([{id:'seed',type:'number',value:10}]).seek({type:'number',constraints:[{equals:23}]});finish(r);
 assert.equal(r.state.result.value,23);assert.ok(r.core.require(r.state.result.cluster).state.graph.steps.some(s=>s.primitive.startsWith('cluster.')));
});
test('new primitive closes a real capability gap without a recipe',()=>{
 const r=custom().registerType('text',x=>typeof x==='string');r.observe([{id:'n',type:'number',value:9}]).seek({type:'text'});finish(r);assert.equal(r.state.status,'blocked');
 r.register({id:'stringify',inputs:{n:'number'},output:'text',run:({n})=>String(n)});assert.equal(r.state.running,true);assert.equal(finish(r).value,'9');
});
test('invalid outputs and guards cannot become claimed capabilities; budgets stop search',()=>{
 const r=custom();r.register({id:'broken',inputs:{n:'number'},output:'number',run:()=> 'wrong'});
 r.observe([{id:'n',type:'number',value:1}]).seek({type:'number',constraints:[{equals:2}]});finish(r);assert.equal(r.state.status,'blocked');assert.equal(r.state.clusters.length,0);assert.equal(r.state.feedback.broken.value,-1);
 const bounded=new PrimitiveSwarm(new Substrate(),{maxAttempts:2}).registerType('number',x=>typeof x==='number');bounded.register({id:'next',inputs:{n:'number'},output:'number',run:({n})=>n+1});bounded.observe([{id:'n',type:'number',value:0}]).seek({type:'number',constraints:[{equals:100}]});finish(bounded);assert.equal(bounded.state.status,'exhausted');assert.equal(bounded.state.executions,2);
});
test('observed feedback changes which compatible primitive runs next',()=>{
 const r=custom();for(const id of ['a','b'])r.register({id,inputs:{n:'number'},output:'number',run:({n})=>n+1});
 r.observe([{id:'n',type:'number',value:0}]).seek({type:'number',constraints:[{equals:2}]});assert.equal(r.nextCandidate().spec.id,'a');r.feedback('a',-1);r.feedback('b',1);assert.equal(r.nextCandidate().spec.id,'b');
});
test('reconfiguration is data-driven and retains purpose/progress; stale observations are discarded',()=>{
 const s=new ExperienceSession(new Substrate());assert.throws(()=>s.start());
 s.start({subject:'User content',objective:'Preserve supplied information',progress:{completed:2}},observations,{type:'artifact'});finish(s.runtime);s.synchronize();const first=s.state.activeCluster;
 assert.equal(s.state.artifact.nodes.length,2);
 s.recordProgress({completed:3});
 const changed=[...observations.filter(x=>x.id!=='layout'),{id:'layout',type:'layout',value:{axis:'column',columns:2}},{id:'size',type:'number',value:1}];
 s.start({subject:'Ignored replacement',objective:'Ignored replacement'},changed,{type:'artifact',constraints:[{path:['nodes',0,'tag'],equals:'section'}]});
 finish(s.runtime);s.synchronize();assert.equal(s.state.artifact.nodes[0].children[0].text,'Actual supplied content');assert.equal(s.state.artifact.layout.columns,2);assert.equal(s.state.progress.completed,3);assert.equal(s.state.objective,'Preserve supplied information');assert.equal(s.core.require(first).state.active,false);
 const before=s.core.snapshot();assert.equal(s.request('teach me with slides').accepted,false);assert.deepEqual(s.core.snapshot(),before);
});
test('checkpoint replays exactly and restored clusters execute fresh inputs; versions and pause are respected',()=>{
 const core=new Substrate(),r=primitiveSwarm(core);r.observe(observations).seek({type:'artifact'});const result=finish(r);r.control(false);assert.equal(r.step(),false);
 const restored=Substrate.replay(core.export());assert.deepEqual(restored.snapshot(),core.snapshot());const next=primitiveSwarm(restored);
 const input=Object.fromEntries(observations.map(x=>[x.id,x.value]));input.content=[{label:'Fresh data'}];assert.equal(next.invoke(result.cluster,input).nodes[0].text,'Fresh data');
 next.register({id:'materialize',version:2,inputs:{items:'records',template:'template'},output:'nodes',run:()=>[]});assert.throws(()=>next.invoke(result.cluster,input),/original primitive contract/);
});
test('Boolean operators compose an analogy through executed constraints rather than a fixed analogy recipe',()=>{
 const r=primitiveSwarm(new Substrate());r.observe([{id:'a',type:'bits',value:[1,1,1,1,1,0]},{id:'b',type:'bits',value:[0,1,0,0,0,1]},{id:'c',type:'bits',value:[1,0,0,1,0,1]}]).seek({type:'bits',constraints:[{equals:[0,0,1,0,1,0]}]});const result=finish(r);assert.deepEqual(result.value,[0,0,1,0,1,0]);assert.ok(result.cluster);
});
