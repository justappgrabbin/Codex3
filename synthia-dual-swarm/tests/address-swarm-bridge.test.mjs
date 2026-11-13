import test from 'node:test';import assert from 'node:assert/strict';
import {figureOfGate,gateOfFigure,addressToBodies,bodiesToGate,retier,changedGate,slotOfLine,profileToBodies} from '../core/address-swarm-bridge.js';
import {addressFromLongitude} from '../core/semantic-address.js';

test('every gate survives address -> bodies -> gate at all three tiers',()=>{
 for(let gate=1;gate<=64;gate++)for(const tier of [1,2,3]){
  const bodies=addressToBodies({gate,line:1},tier);assert.equal(bodies.length,tier);assert.equal(bodiesToGate(bodies),gate);}
 assert.equal(new Set(Array.from({length:64},(_,i)=>figureOfGate(i+1))).size,64);});
test('three packs of two bits; the active line is in the right pack',()=>{
 const a=addressFromLongitude(175.99);const packs=addressToBodies(a,3);
 assert.deepEqual(packs.map(p=>p.lines),[[1,2],[3,4],[5,6]]);
 assert.equal(packs.filter(p=>p.carriesActiveLine).length,1);
 assert.ok(packs[slotOfLine(a.line,3)].carriesActiveLine);assert.equal(packs[0].address.gate,a.gate);});
test('packs re-form into trigrams and the whole without changing the gate',()=>{
 const packs=addressToBodies({gate:41,line:4},3);
 assert.equal(bodiesToGate(retier(packs,2)),41);assert.equal(bodiesToGate(retier(packs,1)),41);});
test('changing lines follow Hatcher p.43: 4 -(3rd)-> 18 -(top)-> 46, and 4 with both -> 46',()=>{
 assert.equal(changedGate(4,3),18);assert.equal(changedGate(18,6),46);assert.equal(changedGate(changedGate(4,6),3),46);
 for(let g=1;g<=64;g++)for(let l=1;l<=6;l++)assert.equal(changedGate(changedGate(g,l),l),g);});
test('design profile gives an address and its bodies',()=>{
 const r=profileToBodies({Movement:5,Evolution:3,Being:2,Design:1});
 assert.equal(r.bodies.length,3);assert.equal(bodiesToGate(r.bodies),r.address.gate);assert.equal(r.leading,'Movement');});
test('figure 63 is gate 1 and 0 is gate 2',()=>{assert.equal(gateOfFigure(63),1);assert.equal(gateOfFigure(0),2);});
