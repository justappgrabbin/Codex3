import test from 'node:test';import assert from 'node:assert/strict';
import {Substrate} from '../core/substrate.js';
import {AutonomousSwarm} from '../core/autonomy.js';
import {gateBits} from '../vendor/generative-state-space/addressing.js';
import {nextLine,addressForProfile,wordGate,followWord} from '../core/semantic-agents.js';
import {figureOfGate} from '../core/address-swarm-bridge.js';

test('no unit keeps the placeholder address',()=>{
 const r=new AutonomousSwarm(new Substrate(),{rules:{sixBit:{enabled:true}}});
 for(const e of r.core.entities.values())assert.notEqual(e.address.filter,'local-example',e.id);});
test('when a unit\'s word changes, its address follows line by line, lowest first',()=>{
 const r=new AutonomousSwarm(new Substrate(),{rules:{sixBit:{enabled:true}}});const id=r.agents()[0].id;
 const [from,to]=[r.core.require(id).address.gate,46];
 followWord(r.core,id,figureOfGate(to),{Movement:1,Evolution:0,Being:0,Design:0});
 const changes=r.core.events.filter(e=>e.type==='gate.changed'&&e.data.id===id);
 assert.equal(r.core.require(id).address.gate,to);assert.equal(r.core.require(id).state.leading,'Movement');
 for(const c of changes){const a=gateBits(c.data.from),b=gateBits(c.data.to);assert.equal(a.filter((x,i)=>x!==b[i]).length,1);}
 assert.deepEqual(changes.map(c=>c.data.line),[...changes.map(c=>c.data.line)].sort((x,y)=>x-y));
 assert.equal(changes[0].data.from,from);});
test('a unit is a gate: its address is exactly its 3-2-1 word',()=>{
 const r=new AutonomousSwarm(new Substrate(),{rules:{sixBit:{enabled:true}}});r.control(true);for(let i=0;i<40&&r.step();i++){}
 for(const a of r.agents())assert.equal(a.address.gate,wordGate(a.state.word),a.id);});
test('the whole run replays to the same addresses',()=>{
 const r=new AutonomousSwarm(new Substrate(),{rules:{sixBit:{enabled:true}}});r.control(true);while(r.step()){}
 const back=AutonomousSwarm.restore(r.checkpoint());
 for(const a of r.agents())assert.equal(back.core.require(a.id).address.gate,a.address.gate);});
test('next line is the lowest differing one; same gate needs none',()=>{
 assert.equal(nextLine(4,18),3);assert.equal(nextLine(4,4),null);
 assert.equal(addressForProfile({Movement:0,Evolution:0,Being:0,Design:0}).formed,false);});
