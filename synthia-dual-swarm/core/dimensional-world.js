import {gateBits} from './substrate.js';
import {exampleAddress,hash} from './ontology.js';
import {DIMENSION_NAMES} from './dimensional-frames.js';
import {FeatureSpace,hammingDistance,completeAnalogy,normalizeVector} from '../vendor/generative/boolean-ato.js';
import {gateFromBits} from '../vendor/recovered/src/synthia/semantic-mesh/state-space/addressing.js';
import {JUT_TOPOLOGY,FIELD_VECTORS,DIRECTIONAL_CLAIMS,FractalAddressSpace} from '../vendor/generative/structural-topology.mjs';
import {advanceStructuralState} from '../vendor/generative/structural-dynamics.mjs';
import {ToolFactory} from '../vendor/recovered/src/synthia/semantic-mesh/merged/tool-factory.js';

export {JUT_TOPOLOGY,DIRECTIONAL_CLAIMS};
export const FIELD_ID='field';
const contributing=Object.values(FIELD_VECTORS);
const clamp=x=>Math.max(0,Math.min(1,x));
// An explicit, bounded demonstration configuration for the existing update
// operator, NOT a source-derived equation for consciousness or letter rotation.
export const PREVIEW_TENSOR=Object.freeze([
 Object.freeze([.78,.06,.06,.06]),Object.freeze([.06,.78,.06,.06]),
 Object.freeze([.06,.06,.78,.06]),Object.freeze([.06,.06,.06,.78])
]);
export class DimensionalWorld {
 constructor(core){this.core=core;this.features=new FeatureSpace(['line1','line2','line3','line4','line5','line6']);for(let gate=1;gate<=64;gate++)this.features.add('field.gate.'+gate,gateBits(gate),{gate});this.factory=new ToolFactory();if(!core.entities.has(FIELD_ID))this.setup();}
 setup(){
  const c=this.core,gates=[];
  for(let gate=1;gate<=64;gate++){
   const children=[],bits=gateBits(gate);
   for(let i=0;i<6;i++){const id=`field.gate.${gate}.line.${i+1}`;children.push(id);c.create({id,label:`Gate ${gate} / line ${i+1} · ${bits[i]?'yang':'yin'}`,address:{...exampleAddress(gate),line:i+1},dimension:'Being',functions:['inspect','transition'],state:{scale:'line',bit:bits[i],active:true}});}
   const id='field.gate.'+gate;gates.push(id);c.compose({id,label:`Gate ${gate}`,children,address:exampleAddress(gate),dimension:'Being',functions:['inspect','enter','impulse','analyze'],embodied:{shape:'hexagram-assembly'}});
   c.change(id,{scale:'gate',energy:.18+(gate%7)*.035,active:true,vectors:Object.fromEntries(Object.keys(FIELD_VECTORS).map((f,i)=>[f,[.15+((gate*(i+3))%17)/40]])),expression:0,position:[0,0,0]},'authored initial conditions; canonical gate bits, not generated semantics');
   children.forEach(child=>c.move(child,id,'Being','line belongs to its hexagram'));
  }
  c.compose({id:FIELD_ID,label:'Yi Jing relational world',children:gates,address:exampleAddress(),dimension:'Design',functions:['inspect','enter'],embodied:{shape:'relational-world'}});
  c.change(FIELD_ID,{scale:'world',tick:0,budget:240,running:true,view:'Space',focus:FIELD_ID,openEdges:JUT_TOPOLOGY.relations.map(e=>e.id),tensor:PREVIEW_TENSOR.map(r=>[...r]),summary:'64 hexagram assemblies · one world, five perspectives',lastInteraction:null,activity:[],couplings:{},physics:'explicit demonstration tensor; directional letter traversal unresolved'},'bounded world initialized from the existing Yi Jing and structural operators');
  gates.forEach(id=>c.move(id,FIELD_ID,'Being','same identity in one shared world'));
  if(c.entities.has('world'))c.move(FIELD_ID,'world','Design','recursive world inside existing substrate');
  this.seed();
 }
 get state(){return this.core.require(FIELD_ID).state;}
 gates(){return this.core.require(FIELD_ID).children.map(id=>this.core.require(id));}
 control(running){this.core.change(FIELD_ID,{running:!!running&&this.state.tick<this.state.budget&&this.core.events.length<44000},'world supervisor');}
 view(dimension){if(!DIMENSION_NAMES.includes(dimension))throw Error('Unknown dimension');this.core.change(FIELD_ID,{view:dimension},'same objects, another dimensional perspective');}
 focus(id){this.core.require(id);if(id!==FIELD_ID&&!id.startsWith('field.gate.'))throw Error('Choose a world constituent');this.ensureChildren(id);this.core.change(FIELD_ID,{focus:id},'entered local dominating structure; identity retained');}
 ensureChildren(id){
  const e=this.core.require(id),c=this.core;if(e.children.length||e.state.resolvedContents)return;
  const next={line:['color',6],color:['tone',6],tone:['base',5]}[e.state.scale];if(!next)return;
  const [field,count]=next,children=[];
  for(let i=1;i<=count;i++){const child=id+'.'+field+'.'+i;children.push(child);c.create({id:child,label:`${field[0].toUpperCase()+field.slice(1)} ${i}`,address:{...e.address,[field]:i},dimension:e.dimension,frame:id,functions:['inspect','enter'],state:{scale:field,active:true}});}
  // A retained composition references the original primitive. It never rewrites
  // its children/history behind the event ledger.
  const container=id+'.contents';c.compose({id:container,label:e.label+' / resolved contents',children,address:e.address,dimension:e.dimension});c.move(container,id,'Being','lazy address resolution');
  c.change(id,{resolvedContents:container},'lower constituents remain individually addressed');
 }
 children(id=this.state.focus){const e=this.core.require(id);return [...(e.state.resolvedContents?this.core.require(e.state.resolvedContents).children:e.children),...(id===FIELD_ID?e.state.generated??[]:[])].map(child=>this.core.require(child));}
 composeAnalogy(a,b,c){
  const A=normalizeVector(a,6),B=normalizeVector(b,6),C=normalizeVector(c,6),result=completeAnalogy(A,B,C,'equivalence');
  const core=this.core,key=[A,B,C].map(v=>v.join('')).join('-'),id='field.gate.ato-'+key;
  if(core.entities.has(id))return {id,...result};
  if((this.state.generated?.length??0)>=16)throw Error('This world holds up to 16 additional analogy compositions; restore a checkpoint to explore another branch.');
  const address={...exampleAddress(gateFromBits([...result.result])),filter:'explicit-boolean-feature-prototype'},children=[];
  for(let i=0;i<6;i++){const child=id+'.line.'+(i+1);children.push(child);core.create({id:child,label:'Result line '+(i+1),address:{...address,line:i+1},dimension:'Being',functions:['inspect','enter'],state:{scale:'line',bit:result.result[i],active:true}});}
  core.compose({id,label:'ATO '+result.result.join(''),children,address,dimension:'Being',functions:['inspect','enter','analyze'],embodied:{shape:'hexagram-assembly'}});
  core.change(id,{scale:'analogy',pattern:[...result.result],energy:.7,expression:.5,active:true,analogy:{A:[...A],B:[...B],C:[...C],operator:[...result.relation],D:[...result.result],mode:result.mode,source:'Sheldon Klein, Analogical Foundations, pp.2–3; feature encoding is explicit, not inferred semantics'}},'A:B::C:D; D = equivalence(C, equivalence(A,B))');
  children.forEach(child=>core.move(child,id,'Being','computed Boolean constituent; input lineage retained'));
  core.move(id,FIELD_ID,'Being','new form composed inside the same world');
  core.record('observation.recorded',{kind:'klein-visual-analogy',entity:id,A:[...A],B:[...B],C:[...C],D:[...result.result],operator:[...result.relation]});
  core.change(FIELD_ID,{generated:[...(this.state.generated??[]),id],lastInteraction:id},'new composition joins world without erasing its input derivation');
  return {id,...result};
 }
 setEdge(id,enabled){if(!JUT_TOPOLOGY.relations.some(e=>e.id===id))throw Error('Unknown structural edge');const edges=new Set(this.state.openEdges);enabled?edges.add(id):edges.delete(id);this.core.change(FIELD_ID,{openEdges:[...edges]},'explicit interaction condition changed');}
 seed(){for(const gate of [1,2,11,24,43,57])this.impulse('field.gate.'+gate,.85);}
 impulse(id,amount=1){const e=this.core.require(id);if(e.state.scale!=='gate'||!Number.isFinite(amount)||amount<0||amount>1)throw Error('Signal requires a hexagram and an intensity in 0..1');const vectors=structuredClone(e.state.vectors);vectors.I=[amount];this.core.change(id,{energy:amount,vectors,active:true},'observed external signal changes current condition');this.core.change(FIELD_ID,{lastInteraction:id},'world input retained');}
 toggle(id){const e=this.core.require(id);if(e.state.scale!=='gate')throw Error('Choose a hexagram');this.core.change(id,{active:!e.state.active},'constituent activation changed; existence and lineage retained');}
 neighbors(id){const e=this.core.require(id);return this.features.nearest(gateBits(e.address.gate),{limit:64}).filter(x=>x.id!==id&&x.distance===1);}
 async analyze(id){
  const e=this.core.require(id);if(!id.startsWith('field.gate.'))throw Error('Select a world constituent');
  const {tool}=this.factory.generate({purpose:'Analyze an explicitly addressed composition',dimension:e.dimension,level:4,gate:e.address.gate});
  const input={entity:id,address:e.address,bits:gateBits(e.address.gate),children:this.children(id).map(x=>x.id),views:DIMENSION_NAMES};
  const output=await tool.execute(input);
  this.core.record('observation.recorded',{kind:'world-tool-factory',tool:tool.id,address:tool.addressKey,entity:id,input,output});
  this.core.change(id,{analysis:{tool:tool.id,output}},'existing tool factory analyzer result');return output;
 }
 step(){
  if(!this.state.running)return false;
  if(this.state.tick>=this.state.budget||this.core.events.length>=44000){this.control(false);return false;}
  const c=this.core,prior=new Map(this.gates().map(e=>[e.id,structuredClone(e.state)])),couplings={...this.state.couplings},activity=[],tick=this.state.tick+1;
  // Synchronous observation: all decisions read the same previous state.
  for(const e of this.gates()){
   const s=prior.get(e.id);if(!s.active)continue;
   const candidates=this.neighbors(e.id).filter(n=>prior.get(n.id).active).map(n=>({id:n.id,distance:n.distance,energy:prior.get(n.id).energy}));
   const best=candidates.sort((a,b)=>b.energy-a.energy||a.id.localeCompare(b.id))[0];
   const key=best?[e.id,best.id].sort().join('|'):null,gain=key?couplings[key]?.gain??.08:0;
   const vectors=structuredClone(s.vectors);if(best)vectors.I=[clamp(vectors.I[0]+Math.max(0,best.energy-s.energy)*gain)];
   const next=advanceStructuralState({vectors,tensor:this.state.tensor,openEdges:this.state.openEdges,readout:{MI:1,EB:1}});
   const values=Object.values(next.vectors).map(v=>v[0]),energy=values.reduce((a,b)=>a+b,0)/4,expression=next.P.value?.[0]??0;
   if(best&&best.energy-s.energy>.04){
    const old=couplings[key]||{gain:.08,observations:0,value:0},reward=energy-s.energy;
    couplings[key]={gain:Math.max(.02,Math.min(.2,old.gain+reward*.04)),observations:old.observations+1,value:old.value+(reward-old.value)/(old.observations+1)};
    let r=[...c.relations.values()].find(r=>r.kind==='one-line-interaction'&&r.source===best.id&&r.target===e.id);
    if(!r)r=c.relate({source:best.id,target:e.id,kind:'one-line-interaction',dimension:'Evolution',projection:'causal',context:{hamming:1,rule:'preview-neighbor-feedback/v1',semanticClaim:false}});
    c.signal(r.id,Math.max(0,best.energy-s.energy));
    activity.push({from:best.id,to:e.id,relation:r.id,hamming:hammingDistance(gateBits(e.address.gate),gateBits(c.require(best.id).address.gate))});
   }
   c.change(e.id,{energy,vectors:next.vectors,expression},'existing masked structural update; emergent Space readout');
  }
  c.change(FIELD_ID,{tick,couplings,activity:activity.slice(-32),running:tick<this.state.budget,summary:`${activity.length} local interactions · ${Object.keys(couplings).length} remembered couplings`},'perceive, match, update, retain consequences');
  return true;
 }
 signature(){return hash(this.core.snapshot());}
 capacity(depth=1){return new FractalAddressSpace({depth}).snapshot();}
}
