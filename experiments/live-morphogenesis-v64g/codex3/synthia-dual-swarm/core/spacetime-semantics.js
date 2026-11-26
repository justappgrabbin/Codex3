// Semantic spacetime (Burgess, "Spacetimes with Semantics" I-III), formalised for the swarm.
// Four irreducible association types (paper III abstract: aggregation, causation,
// cooperation, similarity). Directions from paper III §4.4.1 (Lemma 19) and §3.13.
// Dimension assignments are the owner's (Being=containment confirmed by her
// top-to-bottom rule; Movement=cooperation confirmed by her bottom-to-top rule;
// Design=causation and Evolution=similarity are working assignments).
// Space is not a link type: it is the condition where the other four meet.

export const ASSOCIATIONS=Object.freeze({
 containment:Object.freeze({dimension:'Being',directed:true,inverse:'part-of',flow:'inward/down',
  source:'Burgess III §4.4.1: "A inside S inside S\'" (superagency and encapsulation)',status:'owner-confirmed'}),
 cooperation:Object.freeze({dimension:'Movement',directed:true,inverse:'composed-into',flow:'upward (parts compose into wholes)',
  source:'Burgess III §3.13: "Composition, or cooperative refinement"',status:'owner-confirmed'}),
 causation:Object.freeze({dimension:'Design',directed:true,inverse:'depends-on',flow:'forward along the precedence chain',
  source:'Burgess III §4.4.1: A1 -> A2 -> A3, "precedence adjacency gradient"',status:'working'}),
 similarity:Object.freeze({dimension:'Evolution',directed:false,inverse:'similarity',flow:'outward to whatever is near',
  source:'Burgess III §3.13: "Similarity (proximity)"; symmetry is a reading, not stated',status:'working'})
});
export const TYPE_OF_DIMENSION=Object.freeze(Object.fromEntries(Object.entries(ASSOCIATIONS).map(([t,a])=>[a.dimension,t])));

// A small semantic-spacetime graph of agents (points). Links are typed; the inverse
// is recorded so either end can be read from. Containment may not form cycles
// (a thing cannot contain what contains it).
export class SemanticSpacetime{
 constructor(){this.agents=new Map();this.links=[];}
 agent(id,props={}){if(typeof id!=='string'||!id)throw TypeError('agent id must be a non-empty string');if(!this.agents.has(id))this.agents.set(id,{id,...props});return this.agents.get(id);}
 link(from,type,to,meta={}){
  const a=ASSOCIATIONS[type];if(!a)throw Error('Unknown association type: '+type);
  if(from===to)throw Error('An agent cannot link to itself');
  this.agent(from);this.agent(to);
  if(type==='containment'&&this.contains(to,from))throw Error('Containment cycle: '+to+' already contains '+from);
  const link=Object.freeze({from,type,to,dimension:a.dimension,directed:a.directed,...meta});
  this.links.push(link);return link;
 }
 // Links touching an agent, read from that agent's side (inverse names on incoming).
 from(id,type=null){
  return this.links.filter(l=>(!type||l.type===type)&&(l.from===id||(l.to===id))).map(l=>{
   if(l.from===id)return {relation:l.type,other:l.to,dimension:l.dimension};
   return {relation:l.directed?ASSOCIATIONS[l.type].inverse:l.type,other:l.from,dimension:l.dimension};});
 }
 contains(outer,inner){
  const seen=new Set(),stack=[outer];
  while(stack.length){const x=stack.pop();if(seen.has(x))continue;seen.add(x);
   for(const l of this.links)if(l.type==='containment'&&l.from===x){if(l.to===inner)return true;stack.push(l.to);}}
  return false;
 }
 // Superagent (Burgess II §3.7): everything an agent contains, at any depth. Scaling up
 // means reading this set as one agent.
 superagent(id){return [...this.agents.keys()].filter(x=>x!==id&&this.contains(id,x));}
 // Causal order: a precedence chain from any start, following causation forward.
 chain(start){
  const out=[start],seen=new Set([start]);let x=start;
  for(;;){const next=this.links.find(l=>l.type==='causation'&&l.from===x&&!seen.has(l.to));if(!next)return out;x=next.to;seen.add(x);out.push(x);}
 }
}

// Screen flow for a swarm unit, by its dimension. Unit vectors; y grows upward.
// Space has no flow of its own: it moves to where the others meet (their centroid).
export function flow(dimension,{position=[0,0],next=null,centre=[0,0],others=[]}={}){
 const norm=v=>{const m=Math.hypot(...v);return m>1e-12?v.map(x=>x/m):[0,0];};
 if(dimension==='Movement')return [0,1];
 if(dimension==='Being')return [0,-1];
 if(dimension==='Design')return next?norm([next[0]-position[0],next[1]-position[1]]):[0,0];
 if(dimension==='Evolution')return norm([position[0]-centre[0],position[1]-centre[1]]);
 if(dimension==='Space'){if(!others.length)return [0,0];const c=others.reduce((s,p)=>[s[0]+p[0]/others.length,s[1]+p[1]/others.length],[0,0]);return norm([c[0]-position[0],c[1]-position[1]]);}
 throw Error('Unknown dimension: '+dimension);
}
