// Thin adapter: lets the swarm use Alexis's ATO-Core Boolean engine
// (vendor/ato-core, copied unchanged) to rank tools by Hamming distance
// over named feature axes, and to complete A:B::C:? analogies.
// Swarm/world side only. The language model never sees this file.
// No addresses, no Human Design data: only boolean-ato.mjs is imported.
import {FeatureSpace,hammingDistance,completeAnalogy,toBitString} from '../vendor/ato-core/src/boolean-ato.mjs';

// Named axes describing an agent's situation in the relay task.
// PROPOSAL for Alexis to review: axis names and tool prototypes below are
// adapter settings, not rules taken from her sources.
export const SWARM_AXES=Object.freeze(['target-known','announced','carrying-part','gripper-formed','repair-needed','stock-available','within-reach']);

// Each tool's prototype = the situation in which that tool fits best.
export const TOOL_PROTOTYPES=Object.freeze({
 inspect:    '0000110',
 communicate:'1000110',
 gather:     '1100110',
 morph:      '1110110',
 repair:     '1111111'
});

export class AtoToolSelector{
 constructor({axes=SWARM_AXES,prototypes=TOOL_PROTOTYPES,mode='equivalence',weight=2}={}){
  if (!Number.isFinite(weight) || weight < 0 || weight > 2) throw new RangeError('ATO bonus weight must be finite and between 0 and 2');
  if (!['equivalence','xor'].includes(mode)) throw new TypeError('Unknown ATO analogy mode');
  this.space=new FeatureSpace(axes);this.mode=mode;this.weight=weight;
  for(const [tool,vector] of Object.entries(prototypes))this.space.add(tool,vector,{kind:'tool-prototype'});
 }
 get axes(){return this.space.features;}
 // Build the agent's Boolean situation vector from swarm state.
 situation(agent,relay,stock){const s=agent.state;return [
  s.known,s.announced,s.inventory>0,s.tool==='gripper',relay.health<relay.required,stock.parts>0,Math.abs(s.position-relay.position)<=s.reach
 ].map(Number);}
 // All tools ranked nearest-first by Hamming distance (ATO-Core FeatureSpace.nearest).
 rank(vector){return this.space.nearest(vector,{limit:this.space.entries.size}).map(e=>({tool:e.id,distance:e.distance}));}
 // Explain the existing original ATO-Core calculation; no invented semantic reading.
 explain(tool,vector){const p=this.space.get(tool);if(!p)return {tool,matched:false,bonus:0,reason:'NO_PROTOTYPE'};
  const distance=hammingDistance(vector,p.vector),width=this.axes.length;
  return {tool,matched:true,axes:[...this.axes],prototype:toBitString(p.vector),situation:toBitString(vector),distance,bonus:this.weight*(width-distance)/width,source:'ATO-Core/boolean-ato.mjs:hammingDistance',interpretation:'tool-feature similarity only'};
 }
 // Optional ranking evidence never grants permission or creates an action.
 bonus(tool,vector){return this.explain(tool,vector).bonus;}
 // Klein analogy over tool prototypes: A is to B as C is to ? (nearest tools to D).
 analogy(a,b,c){const r=this.space.analogy(a,b,c,this.mode);return {relation:toBitString(r.relation),result:toBitString(r.result),candidates:r.candidates.map(e=>({tool:e.id,distance:e.distance}))};}
 // Analogy on raw situation vectors.
 completeSituation(a,b,c){const r=completeAnalogy(a,b,c,this.mode);return toBitString(r.result);}
}
