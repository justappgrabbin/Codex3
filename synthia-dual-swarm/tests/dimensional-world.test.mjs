import test from 'node:test';
import assert from 'node:assert/strict';
import {Substrate,gateBits} from '../core/substrate.js';
import {DimensionalWorld,JUT_TOPOLOGY} from '../core/dimensional-world.js';
import {advanceStructuralState} from '../vendor/generative/structural-dynamics.mjs';
import {hammingDistance} from '../vendor/generative/boolean-ato.js';
const make=()=>new DimensionalWorld(new Substrate());
test('Klein published iconographic analogy composes a decomposable form',()=>{
 const r=make(),result=r.composeAnalogy('111110','010001','100101');
 assert.equal(result.relation.join(''),'010000');assert.equal(result.result.join(''),'001010');
 assert.equal(r.children().length,65);r.focus(result.id);assert.equal(r.children().length,6);
 assert.deepEqual(r.children().map(e=>e.state.bit),[0,0,1,0,1,0]);
 const count=r.core.entities.size;r.composeAnalogy('111110','010001','100101');assert.equal(r.core.entities.size,count);
 assert.deepEqual(Substrate.replay(r.core.export()).snapshot(),r.core.snapshot());
});
test('one addressed world retains six lines per gate across all five views',()=>{
 const r=make(),ids=[...r.core.entities.keys()];assert.equal(r.gates().length,64);
 for(const e of r.gates()){assert.equal(e.children.length,6);assert.deepEqual(e.children.map(id=>r.core.require(id).state.bit),gateBits(e.address.gate));}
 for(const d of ['Movement','Evolution','Being','Design','Space']){r.view(d);assert.deepEqual([...r.core.entities.keys()],ids);}
 assert.equal(r.capacity(2).capacity,'4777574400');
});
test('Hamming matching finds only the six legal single-line alternatives',()=>{
 const r=make();for(const e of r.gates()){const ns=r.neighbors(e.id);assert.equal(ns.length,6);assert.ok(ns.every(n=>hammingDistance(gateBits(e.address.gate),gateBits(n.metadata.gate))===1));}
});
test('masked interaction conditions change the outcome; Space is derived',()=>{
 const options={vectors:{M:[.2],E:[.3],B:[.5],I:[.8]},tensor:[[.7,.1,.1,.1],[.1,.7,.1,.1],[.1,.1,.7,.1],[.1,.1,.1,.7]],readout:{MI:1,EB:1}};
 const open=advanceStructuralState(options),closed=advanceStructuralState({...options,openEdges:[]});
 assert.notDeepEqual(open.vectors,closed.vectors);assert.equal(closed.P.value,null);assert.equal(open.P.role,'emergent');assert.equal(Object.hasOwn(open.vectors,'P'),false);
 assert.throws(()=>advanceStructuralState({...options,vectors:{P:[1]}}));assert.equal(JUT_TOPOLOGY.nodes.length,4);
});
test('experience changes coupling gains and the complete event history replays',()=>{
 const r=make();r.step();const before=structuredClone(r.state.couplings);r.impulse('field.gate.1');r.step();assert.ok(Object.keys(before).length>0);
 assert.ok(Object.entries(r.state.couplings).some(([id,v])=>before[id]&&v.observations>before[id].observations&&v.gain!==before[id].gain));
 assert.ok(r.state.activity.every(x=>x.hamming===1));assert.deepEqual(Substrate.replay(r.core.export()).snapshot(),r.core.snapshot());
 r.control(false);const tick=r.state.tick;assert.equal(r.step(),false);assert.equal(r.state.tick,tick);
});
test('recursive address resolution is idempotent and preserves its parent identity',()=>{
 const r=make(),id='field.gate.11.line.1',original=structuredClone(r.core.require(id));r.focus(id);assert.equal(r.children().length,6);const count=r.core.entities.size;
 r.focus(id);assert.equal(r.core.entities.size,count);assert.deepEqual(r.core.require(id).address,original.address);
 const color=r.children()[0];r.focus(color.id);assert.equal(r.children().length,6);r.focus(r.children()[0].id);assert.equal(r.children().length,5);
 assert.deepEqual(Substrate.replay(r.core.export()).snapshot(),r.core.snapshot());
});
test('existing factory analyzes actual constituents and retains a tool receipt',async()=>{
 const r=make(),out=await r.analyze('field.gate.11');assert.equal(out.input.entity,'field.gate.11');assert.equal(out.input.children.length,6);
 assert.ok(r.core.events.some(e=>e.type==='observation.recorded'&&e.data.kind==='world-tool-factory'));
 r.core.change('field',{budget:1},'bounded execution check');r.step();assert.equal(r.state.running,false);assert.equal(r.step(),false);
});
