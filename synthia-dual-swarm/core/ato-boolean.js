// Optional original ATO-Core Boolean tool-similarity scoring inside the Dynamic Swarm.
// These named features/prototypes are adapter hypotheses, NOT Klein semantic readings.
// Original Boolean algebra is copied unchanged from swarm-ato-boolean.
import {FeatureSpace,hammingDistance,toBitString} from '../vendor/ato-core/src/boolean-ato.mjs';
export const AXES=Object.freeze(['known-target','carrying-part','has-required-tool','needs-repair','stock-present','within-reach','low-energy']);
export const PROTOTYPES=Object.freeze({
 inspect:'0001000',communicate:'1001000',gather:'1001100',
 morph:'1101100',repair:'1111010',transfer:'1101000',rest:'0000001'
});
export class DynamicAtoSelector {
 constructor({weight=2}={}){
  if(!Number.isFinite(weight)||weight<0||weight>2)throw new RangeError('ATO weight must be finite in [0,2]');
  this.weight=weight;this.space=new FeatureSpace(AXES);
  for(const [action,bits] of Object.entries(PROTOTYPES))this.space.add(action,bits,{kind:'proposed-action-prototype'});
 }
 situation(agent,choice,swarm){
  const s=agent.state,target=swarm.core.entities.get(choice.target)?.state||{};
  const structures=swarm.structures(),supplies=swarm.supplies();
  const needsRepair=structures.some(e=>e.state.health<e.state.required);
  const required=target.requiredCapability||'grip';
  const tool=(s.toolFeatures||[]).includes(required);
  const position=Number.isFinite(target.position)?target.position:s.position;
  return [!!(s.memories||[]).includes(choice.target),s.inventory>0,tool,needsRepair,
   supplies.some(e=>e.state.parts>0),Math.abs(s.position-position)<=s.reach,
   (s.energy??40)<(s.maxEnergy??40)*swarm.rules.energyReserve].map(Number);
 }
 explain(agent,choice,swarm){
  const vector=this.situation(agent,choice,swarm),entry=this.space.get(choice.action);
  if(!entry)return {bonus:0,reason:'NO_PROTOTYPE'};
  const distance=hammingDistance(vector,entry.vector);
  return {bonus:this.weight*(AXES.length-distance)/AXES.length,distance,
   axes:[...AXES],situation:toBitString(vector),prototype:toBitString(entry.vector),
   source:'original-ATO-Core/boolean-ato.mjs:hammingDistance',
   interpretation:'proposed action-feature similarity, not Klein semantic inference'};
 }
 bonus(agent,choice,swarm){return this.explain(agent,choice,swarm).bonus;}
}
