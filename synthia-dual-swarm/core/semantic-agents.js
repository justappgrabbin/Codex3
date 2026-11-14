// Gives swarm units real, changing addresses in place of exampleAddress().
// A unit's profile is read from its own links in the four Burgess association types
// (core/spacetime-semantics.js): cooperation -> Movement, similarity -> Evolution,
// containment -> Being, causation -> Design. The profile becomes an address by the
// design-profile rule (core/profile-address.js). When the profile changes, the address
// moves one line per tick, lowest differing line first (Hatcher, Yijing Word by Word
// p.43-44 transitional method), through the substrate's recorded gate.changed event.
// Working reading of agent state (owner may refine):
//   cooperation = live social ties, similarity = remembered things,
//   containment = what it holds (inventory), causation = goals it is pursuing.
import {profileToAddress} from './profile-address.js';
import {figureOfGate} from './address-swarm-bridge.js';

export function agentProfile(state){
 return {
  Movement:Object.keys(state.ties||{}).length,
  Evolution:(state.memories||[]).length,
  Being:state.inventory||0,
  Design:(state.generatedGoals||[]).length+(state.goal&&state.goal!=='observe needs'?1:0)
 };
}
// World objects: a supply holds parts (containment); a structure is the result of
// repairs (causation) and holds what it still requires (containment).
export function objectProfile(state){
 if(Number.isFinite(state.parts))return {Movement:0,Evolution:0,Being:state.parts,Design:0};
 return {Movement:0,Evolution:0,Being:Math.max(0,(state.required||0)-(state.health||0)),Design:state.health||0};
}

// An empty profile has not formed yet: every association counts once, so the address is
// defined (ties resolve in the fixed order Movement, Evolution, Being, Design).
export function addressForProfile(profile){
 const total=Object.values(profile).reduce((s,v)=>s+v,0);
 const counts=total?profile:{Movement:1,Evolution:1,Being:1,Design:1};
 const r=profileToAddress(counts);
 return {address:{...r.address,filter:'semantic-profile'},leading:r.leading,formed:total>0};
}

// The one line to change next on the way from one gate to another, or null when there.
export function nextLine(fromGate,toGate){
 const diff=figureOfGate(fromGate)^figureOfGate(toGate);
 if(!diff)return null;
 for(let line=1;line<=6;line++)if(diff&(1<<(line-1)))return line;
 return null;
}

// Advance one unit by at most one line toward the address its current links imply.
export function settleEntity(core,id,profile){
 const e=core.require(id),{address,leading}=addressForProfile(profile);
 if(e.state.leading!==leading)core.change(id,{leading,profile},'leading dimension follows the unit\'s own links');
 const line=nextLine(e.address.gate,address.gate);
 if(line)core.changeLine(id,line);
 return {gate:core.require(id).address.gate,target:address.gate,leading,moved:!!line};
}

// A swarm unit IS a gate: its 3-2-1 word (six-bit-swarm.js) is the gate's figure.
// The address follows the word exactly; every differing line is flipped through a
// recorded gate.changed event (lowest first), so the log stays lawful and replayable.
// The profile decides only the leading dimension, never a second gate.
import {gateOfFigure} from './address-swarm-bridge.js';
export function wordGate(word){return gateOfFigure(word);}
export function followWord(core,id,word,profile){
 const e=core.require(id),target=gateOfFigure(word);
 const {leading}=addressForProfile(profile);
 if(e.state.leading!==leading)core.change(id,{leading,profile},'leading dimension follows the unit\'s own links');
 let line;while((line=nextLine(core.require(id).address.gate,target)))core.changeLine(id,line);
 return {gate:core.require(id).address.gate,leading};
}
