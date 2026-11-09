import test from 'node:test';
import assert from 'node:assert/strict';
import {Substrate} from '../core/substrate.js';
import {AutonomousSwarm} from '../core/autonomy.js';
import {DynamicAtoSelector,AXES} from '../core/ato-boolean.js';
import {completeAnalogy,toBitString} from '../vendor/ato-core/src/boolean-ato.mjs';

test('original ATO Boolean analogy survives unchanged',()=>{
 assert.equal(toBitString(completeAnalogy('101','011','110','xor').result),'000');
});
test('ATO is optional, bounded and provides inspectable evidence',()=>{
 for(const weight of [Infinity,NaN,-1,3])assert.throws(()=>new DynamicAtoSelector({weight}));
 const r=new AutonomousSwarm(new Substrate(),{selector:new DynamicAtoSelector()});
 const a=r.agents()[0],choice=r.decide(a);
 assert.ok(choice);assert.ok(choice.ato>=0&&choice.ato<=2);
 const evidence=r.selector.explain(a,choice,r);
 assert.deepEqual(evidence.axes,AXES);
 assert.equal(evidence.situation.length,AXES.length);
 assert.match(evidence.source,/ATO-Core/);
});
test('permission denial still applies with ATO and original Swarm',()=>{
 const r=new AutonomousSwarm(new Substrate(),{selector:new DynamicAtoSelector()});
 r.setPermission('morph',false);r.control(true);
 while(r.step()){}
 assert.equal(r.state.completed,false);
 assert.ok(r.agents().every(a=>a.state.tool==='hands'));
});
test('original Swarm can still run with ATO disabled',()=>{
 const r=new AutonomousSwarm(new Substrate());
 assert.equal(r.selector,null);r.control(true);while(r.step()){}
 assert.equal(r.state.completed,true);
});
test('ATO selector can be restored with world checkpoint',()=>{
 const sel=new DynamicAtoSelector(),r=new AutonomousSwarm(new Substrate(),{selector:sel});
 r.control(true);for(let i=0;i<3;i++)r.step();r.control(false);
 const restored=AutonomousSwarm.restore(r.checkpoint(),{selector:new DynamicAtoSelector()});
 assert.equal(restored.fingerprint(),r.fingerprint());
});
