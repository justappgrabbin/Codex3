import {representBytes} from './representations.js';
export function particleDistance(a,b){const p=a.state.position3D||[a.state.position,0,0],q=b.state.position3D||[b.state.position,0,0];return Math.hypot(a.state.position-b.state.position,p[1]-q[1],p[2]-q[2]);}
// Virtual particles only. Pair impulses are equal and opposite; no device control.
export function encodeBits(agents,order){
 if(!Array.isArray(order)||order.length!==8||new Set(order).size!==8)throw Error('ASCII groups need eight distinct particle identities');
 const byId=new Map(agents.map(a=>[a.id,a]));
 const bits=order.map(id=>{if(!byId.has(id))throw Error('ASCII group contains an unavailable particle');return byId.get(id).state.open===false?0:1;});
 const value=bits.reduce((n,b)=>n*2+b,0);return {order:[...order],bits:bits.join(''),value,ascii:value<128?String.fromCharCode(value):null,printable:value>=32&&value<=126};
}
export function stepParticleField(swarm){
 const rule=swarm.rules.field;if(!rule?.enabled)return;
 const agents=swarm.agents(),bodies=agents.map(a=>({agent:a,p:[a.state.position,...(a.state.position3D||[0,0,0]).slice(1)],v:[...(a.state.velocity||[0,0,0])],mass:a.state.mass||1}));
 const pairs=[],net=[0,0,0];
 for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
  const a=bodies[i],b=bodies[j],delta=b.p.map((x,k)=>x-a.p[k]),distance=Math.hypot(...delta);if(distance>rule.radius)continue;
  const bits=(a.agent.state.open===false?'0':'1')+(b.agent.state.open===false?'0':'1'),coupling=rule.pairs[bits],magnitude=rule.strength*coupling*(1-distance/rule.radius),direction=distance>1e-9?delta.map(x=>x/distance):[1,0,0],impulse=direction.map(x=>x*magnitude);
  for(let k=0;k<3;k++){a.v[k]+=impulse[k]/a.mass;b.v[k]-=impulse[k]/b.mass;net[k]+=impulse[k]-impulse[k];}
  pairs.push({a:a.agent.id,b:b.agent.id,bits,distance,impulse});
 }
 for(const b of bodies){
  const a=b.agent,s=a.state,position=b.p.map((x,k)=>x+b.v[k]);
  const qualities={energyFraction:s.energy/s.maxEnergy,materialReadiness:s.capacity?s.inventory/s.capacity:0,relationshipSupport:Math.min(1,Object.values(s.ties||{}).reduce((n,v)=>n+Math.max(0,v),0)/Math.max(1,agents.length-1)),recentReward:s.experiences[s.experiences.length-1]?.reward||0};
  swarm.core.change(a.id,{position:position[0],position3D:position,velocity:b.v,qualities,bit:s.open===false?0:1,binaryColor:[...rule.colors[s.open===false?'0':'1']]},'particle integrates reciprocal proximity impulses and self-assesses current qualities');
 }
 const encodings=[];for(const order of rule.asciiGroups){try{encodings.push(encodeBits(agents,order));}catch(error){encodings.push({order,error:error.message});}}
 let representation=null;if(encodings.length){try{if(encodings.some(e=>e.error))throw Error('Unavailable particle in byte group');representation=representBytes(encodings.map(e=>e.value));}catch(error){representation={error:error.message};}}
 swarm.core.change('autonomy',{field:{pairs,netInternalImpulse:net,encodings,representation}},'measured virtual-particle reactions and explicit binary representation');
}
