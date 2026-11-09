// Phone-sized structural experiment. Geometry features are not semantic vectors.
const WIDTH={1:6,2:3,3:2};
export function splitWord(word,tier){
 if(!Number.isInteger(word)||word<0||word>63||!Number.isInteger(tier)||!WIDTH[tier])throw Error('Invalid six-bit word or tier');
 const width=WIDTH[tier];return Array.from({length:tier},(_,slot)=>({tier,slot,value:(word>>(slot*width))&((1<<width)-1)}));
}
export function compileWord(parts){
 if(!Array.isArray(parts)||!parts.length)throw Error('Missing word fragments');
 const tier=parts[0].tier,width=WIDTH[tier];
 if(!width||parts.length!==tier||parts.some((p,i)=>p.tier!==tier||p.slot!==i||!Number.isInteger(p.value)||p.value<0||p.value>=(1<<width)))throw Error('Invalid or unordered word fragments');
 return parts.reduce((word,p)=>word|(p.value<<(p.slot*width)),0);
}
export function changeTier(parts,tier){return splitWord(compileWord(parts),tier);}
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
function geometry(a,b){const p=a.state.position3D||[a.state.position,0,0],q=b.state.position3D||[b.state.position,0,0],delta=q.map((v,i)=>v-p[i]),distance=Math.hypot(...delta),normal=distance>1e-9?delta.map(v=>v/distance):[1,0,0],relative=(b.state.velocity||[0,0,0]).map((v,i)=>v-(a.state.velocity||[0,0,0])[i]);return {distance,normal,relative};}
// The strongest impact axis chooses a two-line mask. Tangential motion rotates
// its position. This explicit local law is configurable physics, not learning.
export function impactMask(normal,relative){let axis=0;for(let k=1;k<3;k++)if(Math.abs(normal[k])>Math.abs(normal[axis]))axis=k;const offset=relative[(axis+1)%3]<0?1:0;return ((3<<(2*axis+offset))|((3<<(2*axis+offset))>>6))&63;}
export function stepSixBitSwarm(swarm){
 const rule=swarm.rules.sixBit;if(!rule?.enabled)return;
 const agents=swarm.agents(),previous=swarm.state.sixBit||{contacts:[],edges:[],activations:{}},nodes=new Map(),pairs=[],density=new Map(agents.map(a=>[a.id,0]));
 for(const a of agents){const parts=a.state.wordFragments||splitWord(a.state.open===false?0:63,1);nodes.set(a.id,{word:compileWord(parts),parts});}
 for(let i=0;i<agents.length;i++)for(let j=i+1;j<agents.length;j++){const a=agents[i],b=agents[j],g=geometry(a,b);if(g.distance<=rule.radius){density.set(a.id,density.get(a.id)+1);density.set(b.id,density.get(b.id)+1);pairs.push({a,b,...g,key:JSON.stringify([a.id,b.id])});}}
 const contacts=[],transitions=[],oldContacts=new Set(previous.contacts),oldEdges=new Map(previous.edges.map(e=>[e.key,e]));
 // All collision deltas read the same pre-contact state, then combine with XOR.
 const deltas=new Map(agents.map(a=>[a.id,0]));
 for(const p of pairs)if(p.distance<=rule.contactRadius){contacts.push(p.key);if(!oldContacts.has(p.key)){const wa=nodes.get(p.a.id).word,wb=nodes.get(p.b.id).word,maskA=impactMask(p.normal,p.relative),maskB=impactMask(p.normal.map(v=>-v),p.relative.map(v=>-v)),difference=wa^wb,da=difference&maskA,db=difference&maskB;deltas.set(p.a.id,deltas.get(p.a.id)^da);deltas.set(p.b.id,deltas.get(p.b.id)^db);transitions.push({a:p.a.id,b:p.b.id,before:[wa,wb],masks:[maskA,maskB],deltas:[da,db]});}}
 const edges=[],incoming=new Map(agents.map(a=>[a.id,0]));
 for(const p of pairs){const old=oldEdges.get(p.key),localDensity=(density.get(p.a.id)+density.get(p.b.id))/2,speed=Math.min(rule.maxSignalSpeed,rule.alpha*localDensity/Math.max(.001,p.distance)),changed=!!(deltas.get(p.a.id)||deltas.get(p.b.id)),affinity=1-((nodes.get(p.a.id).word^deltas.get(p.a.id))^(nodes.get(p.b.id).word^deltas.get(p.b.id))).toString(2).replace(/0/g,'').length/6;
  // Contacts with changed lines rebuild locally; otherwise retain and decay.
  const weight=changed?affinity:(old?old.weight*(1-rule.decay)+rule.gain*affinity:rule.gain*affinity);
  if(weight>=rule.pruneThreshold){edges.push({key:p.key,a:p.a.id,b:p.b.id,weight:Math.min(1,weight),speed,distance:p.distance,density:localDensity});const strength=Math.min(1,speed)*weight;incoming.set(p.a.id,incoming.get(p.a.id)+strength*(previous.activations[p.b.id]||0));incoming.set(p.b.id,incoming.get(p.b.id)+strength*(previous.activations[p.a.id]||0));}
 }
 const activations={};
 for(const a of agents){const n=nodes.get(a.id),word=n.word^deltas.get(a.id),count=density.get(a.id),current=n.parts[0].tier;let tier=current;
  // Hysteresis prevents a density boundary from thrashing the representation.
  if(count>=rule.highDensity)tier=1;else if(count>=rule.midDensity)tier=2;else if(count<Math.max(1,rule.midDensity-1))tier=3;
  const parts=splitWord(word,tier),activation=Math.tanh(rule.signalLeak*(previous.activations[a.id]||0)+incoming.get(a.id)+(word/63)*rule.inputGain);activations[a.id]=activation;
  swarm.core.change(a.id,{wordFragments:parts,word,wordTier:tier,open:!!(word&1),neuralActivation:activation},deltas.get(a.id)?'physical contact changes six-bit lines; local routing rebuilt':'lossless density-based tier compilation and geometric signal propagation');
 }
 swarm.core.change('autonomy',{sixBit:{contacts,edges,activations,transitions,nodeCount:agents.length,kind:'adaptive structural routing; learning unverified'}},'persist bounded geometry-derived network');
}
