import test from 'node:test';import assert from 'node:assert/strict';
import {Substrate} from '../core/substrate.js';
import {AutonomousSwarm} from '../core/autonomy.js';
import {gateBits} from '../vendor/generative-state-space/addressing.js';
import {nextLine,addressForProfile} from '../core/semantic-agents.js';

test('no unit keeps the placeholder address',()=>{
 const r=new AutonomousSwarm(new Substrate());
 for(const e of r.core.entities.values())assert.notEqual(e.address.filter,'local-example',e.id);});
test('addresses move with the swarm, one line at a time, toward each unit\'s own links',()=>{
 const r=new AutonomousSwarm(new Substrate());r.control(true);
 const start=new Map(r.agents().map(a=>[a.id,a.address.gate]));
 while(r.step()){}
 const changes=r.core.events.filter(e=>e.type==='gate.changed');
 assert.ok(changes.length>0,'some unit changed address');
 for(const c of changes){const a=gateBits(c.data.from),b=gateBits(c.data.to);assert.equal(a.filter((x,i)=>x!==b[i]).length,1);}
 assert.ok(r.agents().some(a=>a.address.gate!==start.get(a.id)),'an agent ended somewhere new');
 assert.ok(r.agents().every(a=>['Movement','Evolution','Being','Design'].includes(a.state.leading)));
 assert.ok(new Set(r.agents().map(a=>a.state.leading)).size>=1);});
test('the whole run replays to the same addresses',()=>{
 const r=new AutonomousSwarm(new Substrate());r.control(true);while(r.step()){}
 const back=AutonomousSwarm.restore(r.checkpoint());
 for(const a of r.agents())assert.equal(back.core.require(a.id).address.gate,a.address.gate);});
test('next line is the lowest differing one; same gate needs none',()=>{
 assert.equal(nextLine(4,18),3);assert.equal(nextLine(4,4),null);
 assert.equal(addressForProfile({Movement:0,Evolution:0,Being:0,Design:0}).formed,false);});
