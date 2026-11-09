// These are physical/decision rules, not an action schedule. Stored in replay.
export const DEFAULT_RULES = Object.freeze({
 continuous:false,
 sixBit:{enabled:false,radius:3,contactRadius:.32,alpha:1,maxSignalSpeed:4,midDensity:2,highDensity:5,gain:.1,decay:.02,pruneThreshold:.02,signalLeak:.5,inputGain:.2},
 energyReserve:.2, recovery:6, actionCost:1, learningCost:1,
 relationshipGain:.25, relationshipDecay:.01, clusterThreshold:.2, clusterRadius:6,
 field:{enabled:false,radius:2,strength:.02,pairs:{'00':-1,'01':1,'10':1,'11':-1},colors:{'0':[0,0,0],'1':[255,255,255]},asciiGroups:[]},
 components:[{id:'gripper',provides:['grip'],reach:3,speed:1,energyCost:1,partsCost:0}],
 priorities:{recover:20,discover:5,share:9,restore:8,acquire:6,adapt:7,cooperate:10}
});
export const OPERATIONS = Object.freeze(['scale','bias','sin','clamp']);
export const ACTIONS = Object.freeze(['inspect','communicate','gather','repair','morph','transfer','rest']);
export function validateRules(input={}){
 const rules={...DEFAULT_RULES,...input,priorities:{...DEFAULT_RULES.priorities,...input.priorities}};
 const limits={energyReserve:[.01,1],recovery:[1,100],actionCost:[.01,100],learningCost:[.01,100],relationshipGain:[0,1],relationshipDecay:[0,1],clusterThreshold:[.01,1],clusterRadius:[0,1000]};
 for(const key of Object.keys(input))if(!(key in limits)&&key!=='priorities'&&key!=='components'&&key!=='field'&&key!=='continuous'&&key!=='sixBit')throw Error('Unknown swarm rule: '+key);
 for(const [key,[min,max]] of Object.entries(limits))if(!Number.isFinite(rules[key])||rules[key]<min||rules[key]>max)throw Error('Invalid swarm rule: '+key);
 for(const [key,value] of Object.entries(rules.priorities))if(!(key in DEFAULT_RULES.priorities)||!Number.isFinite(value)||value<0||value>100)throw Error('Invalid goal priority');
 if(!Array.isArray(rules.components)||rules.components.length>32||new Set(rules.components.map(c=>c.id)).size!==rules.components.length)throw Error('Invalid component catalog');
 for(const c of rules.components){
  if(!c||typeof c.id!=='string'||!c.id||c.id.length>64||!Array.isArray(c.provides)||!c.provides.every(f=>typeof f==='string'&&f.length>0&&f.length<=64))throw Error('Invalid component capabilities');
  for(const [key,min,max] of [['reach',0,100],['speed',.01,100],['energyCost',.01,100],['partsCost',0,100]])if(!Number.isFinite(c[key])||c[key]<min||c[key]>max)throw Error('Invalid component cost or geometry');
  if(!Number.isInteger(c.partsCost))throw Error('Component material costs must be whole parts');
 }
 if(typeof rules.continuous!=='boolean')throw Error('Invalid continuous mode');
 const f=rules.field;
 if(!f||typeof f.enabled!=='boolean'||!Number.isFinite(f.radius)||f.radius<=0||f.radius>100||!Number.isFinite(f.strength)||f.strength<0||f.strength>1)throw Error('Invalid particle field law');
 for(const key of ['00','01','10','11'])if(!Number.isFinite(f.pairs?.[key])||Math.abs(f.pairs[key])>1)throw Error('Invalid binary interaction table');
 for(const key of ['0','1'])if(!Array.isArray(f.colors?.[key])||f.colors[key].length!==3||f.colors[key].some(x=>!Number.isInteger(x)||x<0||x>255))throw Error('Invalid binary color');
 if(!Array.isArray(f.asciiGroups)||f.asciiGroups.length>8||f.asciiGroups.some(g=>!Array.isArray(g)||g.length!==8||new Set(g).size!==8||g.some(id=>typeof id!=='string')))throw Error('Invalid ASCII grouping');
 const n=rules.sixBit;if(!n||typeof n.enabled!=='boolean')throw Error('Invalid six-bit mode');
 for(const [key,min,max] of [['radius',.01,100],['contactRadius',.001,100],['alpha',.001,10],['maxSignalSpeed',.001,100],['midDensity',1,63],['highDensity',1,63],['gain',0,1],['decay',0,1],['pruneThreshold',0,1],['signalLeak',0,.99],['inputGain',0,1]])if(!Number.isFinite(n[key])||n[key]<min||n[key]>max)throw Error('Invalid six-bit rule '+key);
 if(n.contactRadius>n.radius||n.midDensity>=n.highDensity||!Number.isInteger(n.midDensity)||!Number.isInteger(n.highDensity))throw Error('Invalid six-bit density or contact thresholds');
 return structuredClone(rules);
}
export function validateAgent(spec){
 if(!spec||typeof spec.id!=='string'||!spec.id.startsWith('autonomy.')||spec.id.length>120)throw Error('Invalid agent identity');
 for(const [key,min,max] of [['position',-1000,1000],['speed',.01,100],['reach',0,100],['energy',0,1000],['maxEnergy',1,1000],['capacity',0,100]])if(!Number.isFinite(spec[key])||spec[key]<min||spec[key]>max)throw Error('Invalid agent '+key);
 if(spec.position3D!==undefined&&(!Array.isArray(spec.position3D)||spec.position3D.length!==3||spec.position3D.some(x=>!Number.isFinite(x)||Math.abs(x)>1000)))throw Error('Invalid particle position');
 if(typeof spec.open!=='boolean'||!Number.isFinite(spec.mass)||spec.mass<.1||spec.mass>100)throw Error('Invalid particle state or mass');
 if(spec.energy>spec.maxEnergy||!Number.isInteger(spec.capacity)||!Array.isArray(spec.capabilities)||spec.capabilities.some(a=>!ACTIONS.includes(a))||!Array.isArray(spec.primitives)||spec.primitives.some(a=>!OPERATIONS.includes(a)))throw Error('Invalid agent capabilities or resources');
 return spec;
}
