import test from 'node:test';
import assert from 'node:assert/strict';
import {attachKleinObserver} from '../core/klein-resolver-bridge.js';

function world(){
 const listeners=new Set(),events=[],entities=new Map([['a',{id:'a',dimension:'Being',address:{gate:1},state:{word:1}}]]),relations=new Map();
 const core={entities,relations,events,
  onChange(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  record(type,data){const event={seq:events.length+1,type,data};events.push(event);for(const fn of listeners)fn(event);return event;}
 };
 const swarm={core,decide(){return 'native-choice';}};
 return swarm;
}
test('records original sourced Klein reading from committed world transition',()=>{
 const swarm=world(),observer=attachKleinObserver(swarm,input=>({
  context_id:input.context_id,source_tool:'original-klein',relations:[{kind:'contact',from:'a',to:'a'}]
 }));
 swarm.core.record('entity.changed',{id:'a',patch:{word:2}});
 assert.equal(swarm.core.events.length,2);
 assert.equal(swarm.core.events[1].data.kind,'klein-world-reading');
 assert.equal(observer.observations[0].status,'recorded');
 assert.equal(swarm.decide(),'native-choice');
 observer.detach();
 swarm.core.record('entity.changed',{id:'a',patch:{word:3}});
 assert.equal(swarm.core.events.length,3);
});
test('unverified and failed readings cannot change world or invent meaning',()=>{
 for(const interpret of [
  ()=>({source_tool:'unverified',relations:[]}),
  ()=>{throw Error('unavailable');},
  async input=>({context_id:input.context_id,source_tool:'klein',relations:[]})
 ]) {
  const swarm=world(),observer=attachKleinObserver(swarm,interpret);
  swarm.core.record('relation.created',{source:'a',target:'a'});
  assert.equal(swarm.core.events.length,1);
  assert.notEqual(observer.observations[0].status,'recorded');
  assert.equal(swarm.decide(),'native-choice');
  observer.detach();
 }
});
