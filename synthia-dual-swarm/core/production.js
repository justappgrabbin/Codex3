import {particleDistance} from './particle-field.js';
import {OPERATIONS} from './swarm-rules.js';
import {exampleAddress,hash} from './ontology.js';

// Bounded program synthesis: executable data, never eval or host-code execution.
const searchSeeds = [
 {op:'scale',value:-1},{op:'scale',value:.5},{op:'scale',value:2},
 {op:'bias',value:-.5},{op:'bias',value:.5},{op:'bias',value:1},
 {op:'sin'},{op:'clamp'}
];
export function validateProgram(program){
 if(!Array.isArray(program)||program.length<1||program.length>6)throw Error('Programs require 1–6 permitted operations');
 for(const step of program){if(!step||!OPERATIONS.includes(step.op)||(['scale','bias'].includes(step.op)?!Number.isFinite(step.value)||Math.abs(step.value)>100:step.value!==undefined))throw Error('Unknown operation or parameter');}
 return program;
}
export function runProgram(program,input){
 validateProgram(program);
 if(!Number.isFinite(input)||Math.abs(input)>1000)throw Error('Input must be finite and within ±1000');
 return program.reduce((x,s)=>s.op==='scale'?x*s.value:s.op==='bias'?x+s.value:s.op==='sin'?Math.sin(x):Math.max(-1,Math.min(1,x)),input);
}
export function programSource(program){
 validateProgram(program);
 let expression='x';
 for(const s of program)expression=s.op==='scale'?`(${expression} * ${s.value})`:s.op==='bias'?`(${expression} + ${s.value})`:s.op==='sin'?`Math.sin(${expression})`:`Math.max(-1, Math.min(1, ${expression}))`;
 return `// Synthia bounded composition; input domain: finite numbers within ±1000.\nexport function transform(x) {\n  if (!Number.isFinite(x) || Math.abs(x) > 1000) throw Error('Invalid input');\n  return ${expression};\n}\n`;
}
export class LocalProduction {
 constructor(swarm){
  this.swarm=swarm;this.core=swarm.core;
  if(!this.core.entities.has('production'))this.core.create({id:'production',label:'Local function and form bridge',dimension:'Design',address:exampleAddress(),state:{permissions:{compose:true,apply:true,export:true},tools:[],attempts:[],bindings:[],tasks:[]}});
 }
 get state(){return this.core.require('production').state;}
 clusters(){
  const agents=this.swarm.agents(),visited=new Set(),clusters=[];
  for(const first of agents){
   if(visited.has(first.id))continue;
   const members=[],queue=[first];visited.add(first.id);
   while(queue.length){const a=queue.shift();members.push(a.id);
    for(const b of agents)if(!visited.has(b.id)&&(this.swarm.rules.field.enabled?particleDistance(a,b):Math.abs(a.state.position-b.state.position))<=this.swarm.rules.clusterRadius&&Math.max(a.state.ties?.[b.id]||0,b.state.ties?.[a.id]||0)>=this.swarm.rules.clusterThreshold){visited.add(b.id);queue.push(b);}
   }
   if(members.length>1)clusters.push({members:members.sort(),operations:[...new Set(members.flatMap(id=>this.core.require(id).state.primitives||[]))].sort()});
  }
  return clusters;
 }
 eligible(cluster){return cluster.members.every(id=>(this.core.require(id).state.energy??40)>=this.swarm.rules.learningCost);}
 available(tool){return this.clusters().some(c=>this.eligible(c)&&tool.program.every(s=>c.operations.includes(s.op)));}
 validateSamples(samples){
  if(!Array.isArray(samples)||samples.length<6||samples.length>64||samples.some(s=>!Array.isArray(s)||s.length!==2||!s.every(Number.isFinite)||s.some(x=>Math.abs(x)>1000)))throw Error('Supply 6–64 finite [input, output] pairs within ±1000');
  if(new Set(samples.map(s=>s[0])).size!==samples.length)throw Error('Sample inputs must be distinct');
 }
 request({samples,target=null,maxCandidates=600,tolerance=.000001,proposals=[]}){
  this.validateSamples(samples);
  if(!Array.isArray(proposals)||proposals.length>8)throw Error('Invalid proposal budget');proposals.forEach(validateProgram);
  if(target!==null)this.core.require(target);
  if(!this.state.permissions.compose)throw Error('Composition permission denied');
  if(!Number.isInteger(maxCandidates)||maxCandidates<1||maxCandidates>600||!Number.isFinite(tolerance)||tolerance<0||tolerance>.01)throw Error('Invalid search budget or tolerance');
  const tasks=this.state.tasks||[];if(tasks.filter(t=>['queued','blocked'].includes(t.status)).length>=16)throw Error('Pending task limit reached');
  const id='production.request.'+(this.core.events.length+1);
  this.core.change('production',{tasks:[...tasks,{id,samples:structuredClone(samples),target,maxCandidates,tolerance,proposals:structuredClone(proposals),status:'queued',lastContext:null}].slice(-32)},'new unmet function demand');
  this.core.change('autonomy',{completed:false},'function demand reopens swarm activity');return id;
 }
 tick(){
  const tasks=structuredClone(this.state.tasks||[]),task=tasks.find(t=>['queued','blocked'].includes(t.status));if(!task)return;
  const context=hash({clusters:this.clusters(),permissions:this.state.permissions,morph:this.swarm.state.permissions.morph,energy:this.swarm.agents().map(a=>[a.id,Math.floor(a.state.energy/4)])});
  if(task.lastContext===context)return;
  task.lastContext=context;
  if(!this.state.permissions.compose||!this.clusters().some(c=>this.eligible(c))){task.status='blocked';task.reason='Awaiting permitted cluster with energy';}
  else{
   const result=this.learn(task.samples,task);task.status=result.tool?'completed':'failed';task.reason=result.tool?'Passed training and held-out examples':'No candidate passed within search budget';task.toolId=result.tool?.id||null;
   if(result.tool&&task.target){try{this.bind(result.tool.id,task.target);task.applied=true;}catch(error){task.applied=false;task.reason+='; '+error.message;}}
  }
  this.core.change('production',{tasks},'cluster responds to current function demand');
 }
 learn(samples,{maxCandidates=600,tolerance=.000001,proposals=[]}={}){
  if(!this.state.permissions.compose)throw Error('Composition permission denied');
  this.validateSamples(samples);
  if(!Array.isArray(proposals)||proposals.length>8)throw Error('Invalid proposal budget');proposals.forEach(validateProgram);
  if(!Number.isInteger(maxCandidates)||maxCandidates<1||maxCandidates>600||!Number.isFinite(tolerance)||tolerance<0||tolerance>.01)throw Error('Invalid search budget or tolerance');
  const clusters=this.clusters().filter(c=>this.eligible(c));
  if(!clusters.length)throw Error('No active relationship cluster with available energy; run agents first');
  const train=samples.filter((_,i)=>i%3!==2),heldout=samples.filter((_,i)=>i%3===2);
  let tested=0,best=null;
  const loss=(program,rows)=>rows.reduce((sum,[x,y])=>sum+(runProgram(program,x)-y)**2,0)/rows.length;
  for(const cluster of clusters){
   for(const program of proposals)if(tested<maxCandidates&&program.every(step=>cluster.operations.includes(step.op))){tested++;const error=loss(program,train);if(!best||error<best.trainingError)best={program:structuredClone(program),members:cluster.members,trainingError:error};}
   const mx=train.reduce((n,[x])=>n+x,0)/train.length,my=train.reduce((n,[,y])=>n+y,0)/train.length,variance=train.reduce((n,[x])=>n+(x-mx)**2,0);
   const slope=variance?train.reduce((n,[x,y])=>n+(x-mx)*(y-my),0)/variance:0,intercept=my-slope*mx;
   const fitted=[{op:'scale',value:slope},{op:'bias',value:intercept}].filter(s=>Number.isFinite(s.value)&&Math.abs(s.value)<=100);
   const alphabet=[...searchSeeds,...fitted].filter(o=>cluster.operations.includes(o.op));let level=[[]];
   for(let depth=1;depth<=3&&tested<maxCandidates;depth++){
    const next=[];
    for(const prefix of level)for(const op of alphabet){
     if(tested>=maxCandidates)break;
     const program=[...prefix,op];next.push(program);tested++;
     const error=loss(program,train);
     if(!best||error<best.trainingError)best={program,members:cluster.members,trainingError:error};
    }
    level=next;
   }
  }
  for(const id of new Set(clusters.flatMap(c=>c.members)))this.core.change(id,{energy:this.core.require(id).state.energy-this.swarm.rules.learningCost},'bounded local composition trial cost');
  const validationError=best?loss(best.program,heldout):null,accepted=!!best&&best.trainingError<=tolerance&&validationError<=tolerance;
  const evidence={tested,training:train.length,heldout:heldout.length,trainingError:best?.trainingError??null,validationError,accepted,samples:structuredClone(samples),tick:this.swarm.state.tick};
  let tool=null;
  if(accepted){
   const id='production.tool.'+hash(best.program);
   tool={id,program:best.program,members:best.members,evidence,inputRange:[Math.min(...samples.map(s=>s[0])),Math.max(...samples.map(s=>s[0]))]};
   if(!this.core.entities.has(id))this.core.compose({id,label:'Verified relational transformation',children:best.members,operator:'sequence',dimension:'Design',address:exampleAddress(),functions:['transform']});
   this.core.change(id,{program:best.program,evidence,members:best.members},'retained tested composition and provenance');
   this.core.change('production',{tools:[...this.state.tools.filter(t=>t.id!==id),tool].slice(-32)},'retain successful local function');
  }
  this.core.change('production',{attempts:[...this.state.attempts,evidence].slice(-32)},'training and held-out feedback');
  return {tool,evidence};
 }
 bind(toolId,target){
  if(!this.state.permissions.apply||!this.swarm.state.permissions.morph)throw Error('Morph permission denied');
  const tool=this.state.tools.find(t=>t.id===toolId),entity=this.core.require(target);
  if(!tool||!this.available(tool))throw Error('The tool requires its current relationship cluster and energy');
  if(!entity.functions.includes('morph')&&!['player','companion','world'].includes(target))throw Error('Target does not permit morphing');
  this.core.change('production',{bindings:[...this.state.bindings.filter(b=>b.target!==target),{toolId,target}]},'verified function applied to existing form target');
 }
 unbind(target){this.core.change('production',{bindings:this.state.bindings.filter(b=>b.target!==target)},'release local transformation');}
 sample(target,time){
  if(!Number.isFinite(time))return null;
  const binding=this.state.bindings.find(b=>b.target===target),tool=this.state.tools.find(t=>t.id===binding?.toolId);
  if(!this.state.permissions.apply||!this.swarm.state.permissions.morph||!tool||!this.available(tool))return null;
  return Math.max(-1,Math.min(1,runProgram(tool.program,tool.inputRange?tool.inputRange[0]+((time/4)%1)*(tool.inputRange[1]-tool.inputRange[0]):time%20)));
 }
 feedback(target,measurement){
  const binding=this.state.bindings.find(b=>b.target===target),tool=this.state.tools.find(t=>t.id===binding?.toolId);
  if(!tool||!this.available(tool)||!this.state.permissions.apply||!this.swarm.state.permissions.morph||!Number.isFinite(measurement))return;
  let relation=[...this.core.relations.values()].find(r=>r.source===tool.id&&r.target===target&&r.kind==='drives-form');
  if(!relation)relation=this.core.relate({source:tool.id,target,kind:'drives-form',projection:'causal',dimension:'Design',context:{evidence:'observed local renderer output'}});
  this.core.signal(relation.id,measurement);
  this.core.change(tool.id,{lastFeedback:{target,measurement,tick:this.swarm.state.tick}},'observed form consequence of learned function');
  this.core.record('observation.recorded',{kind:'production-form-feedback',target,measurement,tick:this.swarm.state.tick});
 }
 exportTool(id){
  if(!this.state.permissions.export)throw Error('Export permission denied');
  const tool=this.state.tools.find(t=>t.id===id);if(!tool)throw Error('Unknown tool');
  return {source:programSource(tool.program),manifest:structuredClone(tool)};
 }
}
