import {wordToBoolean,booleanToWord,xorBoolean,andBoolean} from './boolean-state.js';
import {advanceBodies,closestBodies,repartitionBodies,bodyMoments,reactContact} from './fragment-bodies.js';
import {DEFAULT_RULES} from './swarm-rules.js';
// Phone-sized structural experiment. Geometry features are not semantic vectors.
const WIDTH={1:6,2:3,3:2};
export function splitWord(word,tier){
 if(!Number.isInteger(word)||word<0||word>63||!Number.isInteger(tier)||!WIDTH[tier])throw Error('Invalid six-bit word or tier');
 const width=WIDTH[tier];return Array.from({length:tier},(_,slot)=>({tier,slot,value:(word>>(slot*width))&((1<<width)-1),booleanVector:wordToBoolean((word>>(slot*width))&((1<<width)-1),width)}));
}
export function compileWord(parts){
 if(!Array.isArray(parts)||!parts.length)throw Error('Missing word fragments');
 const tier=parts[0].tier,width=WIDTH[tier];
 if(!width||parts.length!==tier||parts.some((p,i)=>p.tier!==tier||p.slot!==i||!Number.isInteger(p.value)||p.value<0||p.value>=(1<<width)))throw Error('Invalid or unordered word fragments');
 for(const p of parts)if(p.booleanVector!==undefined&&booleanToWord(p.booleanVector,width)!==p.value)throw Error('Boolean fragment vector disagrees with compiled value');
 return parts.reduce((word,p)=>word|(p.value<<(p.slot*width)),0);
}
export function changeTier(parts,tier){return splitWord(compileWord(parts),tier);}
// The strongest impact axis chooses a two-line mask. Tangential motion rotates
// its position. This explicit local law is configurable physics, not learning.
export function impactMask(normal,relative){let axis=0;for(let k=1;k<3;k++)if(Math.abs(normal[k])>Math.abs(normal[axis]))axis=k;const offset=relative[(axis+1)%3]<0?1:0;return ((3<<(2*axis+offset))|((3<<(2*axis+offset))>>6))&63;}
export function stepSixBitSwarm(swarm){
 const rule={...DEFAULT_RULES.sixBit,...swarm.rules.sixBit};if(!rule.enabled)return;
 const agents=swarm.agents(),previous=swarm.state.sixBit||{contacts:[],edges:[],activations:{}},nodes=new Map(),pairs=[],density=new Map(agents.map(a=>[a.id,0]));
 for(const a of agents){const parts=a.state.wordFragments||splitWord(a.state.open===false?0:63,1);const word=compileWord(parts),vector=a.state.wordVector||wordToBoolean(word);if(booleanToWord(vector)!==word)throw Error('Boolean word vector disagrees with fragments');nodes.set(a.id,{word,vector,parts,bodies:advanceBodies(a,parts,rule)});}
 for(let i=0;i<agents.length;i++)for(let j=i+1;j<agents.length;j++){const a=agents[i],b=agents[j],g=closestBodies(nodes.get(a.id).bodies,nodes.get(b.id).bodies);if(g.distance<=rule.radius){density.set(a.id,density.get(a.id)+1);density.set(b.id,density.get(b.id)+1);pairs.push({a,b,...g,key:JSON.stringify([a.id,b.id])});}}
 const contacts=[],transitions=[],oldContacts=new Set(previous.contacts),oldEdges=new Map(previous.edges.map(e=>[e.key,e]));
 // All collision deltas read the same pre-contact state, then combine with XOR.
 const deltas=new Map(agents.map(a=>[a.id,wordToBoolean(0)]));
 for(const p of pairs)if(p.distance<=rule.contactRadius){contacts.push(p.key);reactContact(p,rule.restitution);if(!oldContacts.has(p.key)){const wa=nodes.get(p.a.id).word,wb=nodes.get(p.b.id).word,maskA=impactMask(p.normal,p.relative)&(((1<<p.first.lineWidth)-1)<<p.first.lineStart),maskB=impactMask(p.normal.map(v=>-v),p.relative.map(v=>-v))&(((1<<p.second.lineWidth)-1)<<p.second.lineStart),difference=xorBoolean(nodes.get(p.a.id).vector,nodes.get(p.b.id).vector),da=andBoolean(difference,wordToBoolean(maskA)),db=andBoolean(difference,wordToBoolean(maskB));deltas.set(p.a.id,xorBoolean(deltas.get(p.a.id),da));deltas.set(p.b.id,xorBoolean(deltas.get(p.b.id),db));transitions.push({a:p.a.id,b:p.b.id,before:[wa,wb],masks:[maskA,maskB],deltas:[booleanToWord(da),booleanToWord(db)],deltaVectors:[da,db],beforeVectors:[nodes.get(p.a.id).vector,nodes.get(p.b.id).vector],fragments:[p.first.id,p.second.id]});}}
 const edges=[],incoming=new Map(agents.map(a=>[a.id,0]));
 for(const p of pairs){const old=oldEdges.get(p.key),localDensity=(density.get(p.a.id)+density.get(p.b.id))/2,speed=Math.min(rule.maxSignalSpeed,rule.alpha*localDensity/Math.max(.001,p.distance)),changed=deltas.get(p.a.id).some(Boolean)||deltas.get(p.b.id).some(Boolean),affinity=1-xorBoolean(xorBoolean(nodes.get(p.a.id).vector,deltas.get(p.a.id)),xorBoolean(nodes.get(p.b.id).vector,deltas.get(p.b.id))).filter(Boolean).length/6;
  // Contacts with changed lines rebuild locally; otherwise retain and decay.
  const weight=changed?affinity:(old?old.weight*(1-rule.decay)+rule.gain*affinity:rule.gain*affinity);
  if(weight>=rule.pruneThreshold){edges.push({key:p.key,a:p.a.id,b:p.b.id,weight:Math.min(1,weight),fragments:[p.first.id,p.second.id],speed,distance:p.distance,density:localDensity});const strength=Math.min(1,speed)*weight;incoming.set(p.a.id,incoming.get(p.a.id)+strength*(previous.activations[p.b.id]||0));incoming.set(p.b.id,incoming.get(p.b.id)+strength*(previous.activations[p.a.id]||0));}
 }
 const activations={};
 for(const a of agents){const n=nodes.get(a.id),wordVector=xorBoolean(n.vector,deltas.get(a.id)),word=booleanToWord(wordVector),count=density.get(a.id),current=n.parts[0].tier;let tier=current;
  // Hysteresis prevents a density boundary from thrashing the representation.
  const moments=bodyMoments(n.bodies),spread=Math.max(...n.bodies.map(b=>Math.hypot(...b.position.map((v,i)=>v-moments.position[i]))));
  if(count>=rule.highDensity&&spread<=rule.fragmentMergeRadius)tier=1;else if(count>=rule.midDensity&&spread<=2*rule.fragmentMergeRadius)tier=2;else if(count<Math.max(1,rule.midDensity-1)||spread>2*rule.fragmentMergeRadius)tier=3;
  const parts=repartitionBodies(a.id,splitWord(word,tier),n.bodies),activation=Math.tanh(rule.signalLeak*(previous.activations[a.id]||0)+incoming.get(a.id)+(word/63)*rule.inputGain);activations[a.id]=activation;
  swarm.core.change(a.id,{wordFragments:parts,word,wordVector,wordTier:tier,position:moments.position[0],position3D:moments.position,velocity:moments.velocity,open:wordVector[0],neuralActivation:activation},deltas.get(a.id).some(Boolean)?'physical contact changes six-bit lines; local routing rebuilt':'lossless density-based tier compilation and geometric signal propagation');
 }
 const routedEdges=edges.filter(edge=>{const a=swarm.core.require(edge.a),b=swarm.core.require(edge.b),pair=closestBodies(a.state.wordFragments,b.state.wordFragments);edge.fragments=[pair.first.id,pair.second.id];edge.distance=pair.distance;edge.speed=Math.min(rule.maxSignalSpeed,rule.alpha*edge.density/Math.max(.001,pair.distance));return pair.distance<=rule.radius;});
 swarm.core.change('autonomy',{sixBit:{contacts,edges:routedEdges,activations,transitions,nodeCount:agents.length,fragmentCount:agents.reduce((n,a)=>n+a.state.wordFragments.length,0),kind:'adaptive structural routing; learning unverified'}},'persist bounded geometry-derived network');
}
