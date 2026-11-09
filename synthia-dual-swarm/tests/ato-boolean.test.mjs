import test from 'node:test';
import assert from 'node:assert/strict';
import {Substrate} from '../core/substrate.js';
import {AutonomousSwarm} from '../core/autonomy.js';
import {AtoToolSelector,SWARM_AXES,TOOL_PROTOTYPES} from '../core/ato-boolean.js';
import {xor,toBitString} from '../vendor/ato-core/src/boolean-ato.mjs';

const swarm=(opts={})=>new AutonomousSwarm(new Substrate(),{selector:new AtoToolSelector(opts)});

test('named axes and tool prototypes have matching widths',()=>{const s=new AtoToolSelector();assert.deepEqual([...s.axes],[...SWARM_AXES]);for(const v of Object.values(TOOL_PROTOTYPES))assert.equal(v.length,SWARM_AXES.length);});

test('Hamming ranking picks the tool that fits the situation',()=>{const s=new AtoToolSelector();
 assert.equal(s.rank([0,0,0,0,1,1,0])[0].tool,'inspect');
 assert.equal(s.rank([1,1,1,1,1,1,1])[0].tool,'repair');
 assert.equal(s.rank([1,1,1,0,1,1,0])[0].tool,'morph');
 assert.equal(s.bonus('repair',[1,1,1,1,1,1,1]),2);assert.equal(s.bonus('nope',[1,1,1,1,1,1,1]),0);});

test('Klein analogy D equals A xor B xor C in both equivalence and xor modes',()=>{
 const [a,b,c]=['inspect','communicate','gather'].map(t=>TOOL_PROTOTYPES[t]);const expected=toBitString(xor(xor(a,b),c));
 assert.equal(new AtoToolSelector({mode:'equivalence'}).analogy('inspect','communicate','gather').result,expected);
 assert.equal(new AtoToolSelector({mode:'xor'}).analogy('inspect','communicate','gather').result,expected);
 // the intermediate relation is inverted between the two modes
 const r1=new AtoToolSelector({mode:'equivalence'}).analogy('inspect','communicate','gather').relation,r2=new AtoToolSelector({mode:'xor'}).analogy('inspect','communicate','gather').relation;
 assert.equal([...r1].map((x,i)=>x!==r2[i]).every(Boolean),true);});

test('swarm with ATO selector still completes the relay and records Hamming bonus',()=>{const r=swarm();r.control(true);while(r.step()){}assert.equal(r.state.completed,true);assert.ok(r.state.tick<120);
 const a=r.agents()[0],choice=r.decide(a);assert.ok(choice===undefined||typeof choice.ato==='number');});

test('ATO selector cannot bypass a denied permission',()=>{const r=swarm();r.setPermission('morph',false);r.control(true);while(r.step()){}assert.equal(r.state.completed,false);assert.ok(r.agents().every(a=>a.state.tool==='hands'));});

test('checkpoint restore with selector replays identically',()=>{const r=swarm();r.control(true);for(let i=0;i<5;i++)r.step();r.control(false);const restored=AutonomousSwarm.restore(r.checkpoint(),{selector:new AtoToolSelector()});assert.equal(restored.fingerprint(),r.fingerprint());r.control(true);restored.control(true);while(r.step()){}while(restored.step()){}assert.equal(restored.fingerprint(),r.fingerprint());});

test('without a selector the swarm behaves exactly as before',()=>{const a=new AutonomousSwarm(new Substrate()),b=swarm({weight:0});a.control(true);b.control(true);while(a.step()){}while(b.step()){}assert.equal(a.state.tick,b.state.tick);assert.equal(a.state.completed,b.state.completed);});
