// Physical bodies carry ordered bit intervals. Remeshing preserves the word,
// mass, center of mass, linear momentum and angular momentum (including spin).
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const scale=(a,s)=>a.map(v=>v*s);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const vector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
export function bodyMoments(bodies){
 const mass=bodies.reduce((n,b)=>n+b.mass,0);if(!(mass>0))throw Error('Fragment mass must be positive');
 const momentum=bodies.reduce((p,b)=>add(p,scale(b.velocity,b.mass)),[0,0,0]);
 return {mass,position:scale(bodies.reduce((p,b)=>add(p,scale(b.position,b.mass)),[0,0,0]),1/mass),velocity:scale(momentum,1/mass),momentum,angular:bodies.reduce((p,b)=>add(p,add(cross(b.position,scale(b.velocity,b.mass)),b.spin||[0,0,0])),[0,0,0])};
}
function validateLayout(parts){if(!Array.isArray(parts)||![1,2,3].includes(parts.length)||parts.some((p,i)=>p.tier!==parts.length||p.slot!==i||!Number.isInteger(p.value)||p.value<0||p.value>=(1<<(6/parts.length))))throw Error('Invalid physical fragment ordering');}
export function repartitionBodies(owner,parts,oldBodies){
 validateLayout(parts);validateLayout(oldBodies);
 const old=oldBodies.map(b=>({...b,spin:b.spin||[0,0,0]}));
 if(old.some(b=>!vector(b.position)||!vector(b.velocity)||!vector(b.spin)||!Number.isFinite(b.mass)||b.mass<=0))throw Error('Invalid physical fragment');
 const total=bodyMoments(old),width=6/parts.length;
 return parts.map(part=>{
  const start=part.slot*width,end=start+width,pieces=old.map(b=>{const oldWidth=6/b.tier,overlap=Math.max(0,Math.min(end,(b.slot+1)*oldWidth)-Math.max(start,b.slot*oldWidth));return {b,fraction:overlap/oldWidth,mass:b.mass*overlap/oldWidth};}).filter(p=>p.mass>0);
  const mass=pieces.reduce((n,p)=>n+p.mass,0);if(Math.abs(mass-total.mass/parts.length)>1e-8)throw Error('Fragment bit ownership has inconsistent mass');
  const position=scale(pieces.reduce((p,x)=>add(p,scale(x.b.position,x.mass)),[0,0,0]),1/mass),velocity=scale(pieces.reduce((p,x)=>add(p,scale(x.b.velocity,x.mass)),[0,0,0]),1/mass);
  const spin=pieces.reduce((p,x)=>add(p,add(scale(x.b.spin,x.fraction),cross(sub(x.b.position,position),scale(sub(x.b.velocity,velocity),x.mass)))),[0,0,0]);
  return {...part,id:owner+'/lines/'+start+'-'+(end-1),owner,lineStart:start,lineWidth:width,mass,position,velocity,spin};
 });
}
export function advanceBodies(agent,parts,rule){
 const center=agent.state.position3D||[agent.state.position,0,0],velocity=agent.state.velocity||[0,0,0],mass=agent.state.mass||1;
 const physical=parts.every(p=>p.position!==undefined);
 let bodies;
 if(physical){
  bodies=repartitionBodies(agent.id,parts,parts);const old=bodyMoments(bodies),translation=sub(center,old.position),impulseVelocity=sub(velocity,old.velocity);
  bodies=bodies.map(b=>({...b,position:add(b.position,translation),velocity:add(b.velocity,impulseVelocity)}));
 }else{
  if(parts.some(p=>p.position!==undefined))throw Error('Partially initialized physical fragments');
  bodies=parts.map(p=>({...p,position:add(center,[(p.slot-(parts.length-1)/2)*rule.fragmentSpacing,0,0]),velocity:[...velocity],mass:mass/parts.length,spin:[0,0,0]}));
  bodies=repartitionBodies(agent.id,parts,bodies);
 }
 // Central internal forces: equal/opposite impulses, no hidden center anchor.
 for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
  const a=bodies[i],b=bodies[j],delta=sub(b.position,a.position),distance=Math.hypot(...delta),normal=distance>1e-9?scale(delta,1/distance):[1,0,0],relative=dot(sub(b.velocity,a.velocity),normal),reducedMass=1/(1/a.mass+1/b.mass);
  const impulse=scale(normal,(rule.fragmentSpring*(distance-rule.fragmentSpacing*(j-i))+rule.fragmentDamping*relative)*reducedMass);
  a.velocity=add(a.velocity,scale(impulse,1/a.mass));b.velocity=sub(b.velocity,scale(impulse,1/b.mass));
 }
 // The parent field already advanced shared translation. Integrate only motion
 // relative to it, retaining independent fragment velocities and positions.
 return bodies.map(b=>({...b,position:add(b.position,sub(b.velocity,velocity))}));
}
export function closestBodies(a,b){
 let best=null;for(const first of a)for(const second of b){const delta=sub(second.position,first.position),distance=Math.hypot(...delta);if(!best||distance<best.distance)best={first,second,distance,normal:distance>1e-9?scale(delta,1/distance):[1,0,0],relative:sub(second.velocity,first.velocity)};}return best;
}
export function reactContact(pair,restitution){
 const closing=dot(sub(pair.second.velocity,pair.first.velocity),pair.normal);if(closing>=0)return;
 const magnitude=-(1+restitution)*closing/(1/pair.first.mass+1/pair.second.mass),impulse=scale(pair.normal,magnitude);
 pair.first.velocity=sub(pair.first.velocity,scale(impulse,1/pair.first.mass));pair.second.velocity=add(pair.second.velocity,scale(impulse,1/pair.second.mass));
}
