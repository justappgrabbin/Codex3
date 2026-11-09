// Example initial conditions only. No runtime branch depends on these identities.
export const RELAY_DEMO = {
 structures:[{id:'autonomy.relay',position:6,health:0,required:3}],
 supplies:[{id:'autonomy.stock',position:0,parts:9}],
 agents:[
  {id:'autonomy.scout',position:3,speed:2,reach:4,capabilities:['inspect','communicate','morph','rest'],primitives:['sin']},
  {id:'autonomy.carrier',position:0,speed:2,reach:2,primitives:['scale','bias']},
  {id:'autonomy.builder',position:5,speed:1,reach:2,primitives:['clamp']}
 ]
};

// Reproducible starting conditions, not a prescribed reaction sequence.
export const PARTICLE_FIELD = {structures:[],supplies:[],agents:Array.from({length:8},(_,i)=>({
 id:'autonomy.particle.'+i,label:'Particle '+(i+1),position3D:[Math.cos(i*2.39996)*2,Math.sin(i*1.7)*.5,Math.sin(i*2.39996)*2],
 open:i%2===0,primitives:[['scale','bias','sin','clamp'][i%4]]
}))};
