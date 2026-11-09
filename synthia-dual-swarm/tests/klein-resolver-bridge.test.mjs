import test from 'node:test';
import assert from 'node:assert/strict';
import {attachKleinResolver} from '../core/klein-resolver-bridge.js';

function fakeSwarm() {
 const agent={id:'a',state:{position:0,generatedGoals:[{kind:'restore',target:'wall'}],ties:{},experiences:[]}};
 const swarm={
  state:{tick:1}, agent,
  candidates(){return [{action:'inspect',target:'wall',utility:1},{action:'rest',target:'a',utility:2}];},
  validate(_agent,c){return c.action==='inspect'||c.action==='rest';},
  decide(){return {action:'rest',target:'a'};}
 };
 return swarm;
}
test('real sourced resolver can select existing validated candidate',()=>{
 const swarm=fakeSwarm();
 const attached=attachKleinResolver(swarm,observation=>({
  context_id:observation.context_id,source_tool:'klein-original',choice:{action:'inspect',target:'wall'}
 }));
 assert.deepEqual(swarm.decide(swarm.agent),{action:'inspect',target:'wall',utility:1});
 assert.equal(attached.evidence[0].status,'accepted');
 attached.detach();
 assert.equal(swarm.decide(swarm.agent).action,'rest');
});
test('fabricated or unpermitted choices fall back to original decision',()=>{
 for(const resolver of [
  ()=>({choice:{action:'inspect',target:'wall'}}),
  o=>({context_id:o.context_id,source_tool:'klein-original',choice:{action:'delete',target:'wall'}}),
  ()=>{throw Error('offline');},
  async o=>({context_id:o.context_id,source_tool:'klein-original',choice:{action:'inspect',target:'wall'}})
 ]) {
  const swarm=fakeSwarm();const h=attachKleinResolver(swarm,resolver);
  assert.equal(swarm.decide(swarm.agent).action,'rest');
  assert.notEqual(h.evidence[0].status,'accepted');
 }
});
test('resolver cannot attach twice and must be explicit',()=>{
 const swarm=fakeSwarm();
 assert.throws(()=>attachKleinResolver(swarm,null),TypeError);
 const h=attachKleinResolver(swarm,()=>null);
 assert.throws(()=>attachKleinResolver(swarm,()=>null));
 h.detach();
});
