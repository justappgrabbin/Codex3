import test from 'node:test';import assert from 'node:assert/strict';
import {ASSOCIATIONS,TYPE_OF_DIMENSION,SemanticSpacetime,flow} from '../core/spacetime-semantics.js';

test('four association types, one per corner dimension; Space is not a link type',()=>{
 assert.deepEqual(Object.keys(ASSOCIATIONS).sort(),['causation','containment','cooperation','similarity']);
 assert.equal(TYPE_OF_DIMENSION.Being,'containment');assert.equal(TYPE_OF_DIMENSION.Movement,'cooperation');
 assert.equal(TYPE_OF_DIMENSION.Space,undefined);assert.equal(ASSOCIATIONS.similarity.directed,false);});
test('links read from either end with inverse names',()=>{
 const g=new SemanticSpacetime();g.link('centre','containment','gate');
 assert.deepEqual(g.from('gate'),[{relation:'part-of',other:'centre',dimension:'Being'}]);
 g.link('a','similarity','b');assert.equal(g.from('b','similarity')[0].relation,'similarity');});
test('containment nests into superagents and refuses cycles',()=>{
 const g=new SemanticSpacetime();g.link('centre','containment','gate');g.link('gate','containment','line');
 assert.deepEqual(g.superagent('centre').sort(),['gate','line']);
 assert.throws(()=>g.link('line','containment','centre'),/cycle/);});
test('causation runs forward as a precedence chain',()=>{
 const g=new SemanticSpacetime();g.link('A1','causation','A2');g.link('A2','causation','A3');
 assert.deepEqual(g.chain('A1'),['A1','A2','A3']);assert.equal(g.from('A2','causation')[0].relation,'depends-on');});
test('screen flow: Movement up, Being down, Design to next, Evolution out, Space to the meeting point',()=>{
 assert.deepEqual(flow('Movement'),[0,1]);assert.deepEqual(flow('Being'),[0,-1]);
 assert.deepEqual(flow('Design',{position:[0,0],next:[3,4]}),[0.6,0.8]);
 assert.deepEqual(flow('Evolution',{position:[2,0],centre:[0,0]}),[1,0]);
 assert.deepEqual(flow('Space',{position:[0,0],others:[[2,2],[2,2]]}).map(x=>+x.toFixed(4)),[0.7071,0.7071]);});
