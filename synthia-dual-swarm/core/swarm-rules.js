// These are physical/decision rules, not an action schedule. Stored in replay.
export const DEFAULT_RULES = Object.freeze({
 energyReserve:.2, recovery:6, actionCost:1, learningCost:1,
 relationshipGain:.25, relationshipDecay:.01, clusterThreshold:.2, clusterRadius:6,
 components:[{id:'gripper',provides:['grip'],reach:3,speed:1,energyCost:1,partsCost:0}],
 priorities:{recover:20,discover:5,share:9,restore:8,acquire:6,adapt:7,cooperate:10}
});
export const OPERATIONS = Object.freeze(['scale','bias','sin','clamp']);
export const ACTIONS = Object.freeze(['inspect','communicate','gather','repair','morph','transfer','rest']);
export function validateRules(input={}){
 const rules={...DEFAULT_RULES,...input,priorities:{...DEFAULT_RULES.priorities,...input.priorities}};
 const limits={energyReserve:[.01,1],recovery:[1,100],actionCost:[.01,100],learningCost:[.01,100],relationshipGain:[0,1],relationshipDecay:[0,1],clusterThreshold:[.01,1],clusterRadius:[0,1000]};
 for(const key of Object.keys(input))if(!(key in limits)&&key!=='priorities'&&key!=='components')throw Error('Unknown swarm rule: '+key);
 for(const [key,[min,max]] of Object.entries(limits))if(!Number.isFinite(rules[key])||rules[key]<min||rules[key]>max)throw Error('Invalid swarm rule: '+key);
 for(const [key,value] of Object.entries(rules.priorities))if(!(key in DEFAULT_RULES.priorities)||!Number.isFinite(value)||value<0||value>100)throw Error('Invalid goal priority');
 if(!Array.isArray(rules.components)||rules.components.length>32||new Set(rules.components.map(c=>c.id)).size!==rules.components.length)throw Error('Invalid component catalog');
 for(const c of rules.components){
  if(!c||typeof c.id!=='string'||!c.id||c.id.length>64||!Array.isArray(c.provides)||!c.provides.every(f=>typeof f==='string'&&f.length>0&&f.length<=64))throw Error('Invalid component capabilities');
  for(const [key,min,max] of [['reach',0,100],['speed',.01,100],['energyCost',.01,100],['partsCost',0,100]])if(!Number.isFinite(c[key])||c[key]<min||c[key]>max)throw Error('Invalid component cost or geometry');
  if(!Number.isInteger(c.partsCost))throw Error('Component material costs must be whole parts');
 }
 return structuredClone(rules);
}
export function validateAgent(spec){
 if(!spec||typeof spec.id!=='string'||!spec.id.startsWith('autonomy.')||spec.id.length>120)throw Error('Invalid agent identity');
 for(const [key,min,max] of [['position',-1000,1000],['speed',.01,100],['reach',0,100],['energy',0,1000],['maxEnergy',1,1000],['capacity',0,100]])if(!Number.isFinite(spec[key])||spec[key]<min||spec[key]>max)throw Error('Invalid agent '+key);
 if(spec.energy>spec.maxEnergy||!Number.isInteger(spec.capacity)||!Array.isArray(spec.capabilities)||spec.capabilities.some(a=>!ACTIONS.includes(a))||!Array.isArray(spec.primitives)||spec.primitives.some(a=>!OPERATIONS.includes(a)))throw Error('Invalid agent capabilities or resources');
 return spec;
}
