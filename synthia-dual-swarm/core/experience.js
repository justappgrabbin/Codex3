import {exampleAddress} from './ontology.js';
import {completeAnalogy,normalizeVector} from '../vendor/generative/boolean-ato.js';

// Contracts state affordances, not prebuilt screens or personality prescriptions.
export const FORMAT_CONTRACTS=Object.freeze({
 game:{needs:['objective','information','progress','world','challenge','response'],layout:'spatial'},
 slides:{needs:['objective','information','progress','sequence'],layout:'sequential'},
 demonstration:{needs:['objective','information','progress','controls','visual','feedback'],layout:'interactive'},
});
export const CAPABILITIES=Object.freeze([
 {id:'purpose',role:'heading',provides:['objective'],cost:1,order:0},
 {id:'information',role:'reading',provides:['information'],cost:1,order:1},
 {id:'continuity',role:'progress',provides:['progress'],cost:1,order:2},
 {id:'world',role:'world',provides:['world','visual'],cost:2,order:3},
 {id:'challenge',role:'assessment',provides:['challenge','response'],cost:2,order:4},
 {id:'sequence',role:'navigation',provides:['sequence'],cost:1,order:5},
 {id:'parameters',role:'parameters',provides:['controls','feedback'],requires:['visual'],cost:2,order:4},
]);

export function composeCapabilities(contract,catalog=CAPABILITIES,budget=16){
 if(!contract||!Array.isArray(contract.needs)||!contract.needs.length)throw Error('An experience needs an explicit affordance contract');
 if(!Array.isArray(catalog)||catalog.some(c=>!c.id||!Array.isArray(c.provides)||!Number.isFinite(c.cost)||c.cost<=0)||new Set(catalog.map(c=>c.id)).size!==catalog.length)throw Error('Invalid capability catalog');
 const missing=new Set(contract.needs),selected=[];let remaining=budget;
 while(missing.size){
  const candidates=catalog.filter(c=>!selected.includes(c)&&c.cost<=remaining).map(c=>({c,coverage:c.provides.filter(p=>missing.has(p)).length})).filter(x=>x.coverage>0).sort((a,b)=>b.coverage/b.c.cost-a.coverage/a.c.cost||a.c.id.localeCompare(b.c.id));
  const next=candidates[0]?.c;if(!next)throw Error('No available capability composition satisfies: '+[...missing].join(', '));
  selected.push(next);remaining-=next.cost;next.provides.forEach(p=>missing.delete(p));
  for(const required of next.requires??[])if(!selected.some(c=>c.provides.includes(required)))missing.add(required);
 }
 return {components:selected.sort((a,b)=>(a.order??0)-(b.order??0)),cost:budget-remaining,layout:contract.layout??'flow',needs:[...contract.needs]};
}

export function interpretExperienceRequest(text){
 const request=String(text).trim();if(!request||request.length>500)throw Error('Use a request of 1–500 characters');
 // Explicit format requests only. Unrecognized input preserves the current world.
 const affirmative=request.toLowerCase().split(/[.!?;,]|\b(?:but|instead|rather)\b/).filter(s=>!/(?:don['’]?t|do not|never|no longer|not)\s+(?:want\s+|use\s+|show\s+|give\s+|a\s+|an\s+|any\s+|to\s+|play\s+|me\s+)*(?:game|slides?|presentations?|demonstrations?)/.test(s)).join(' ');
 if(/interactive\s+(?:demo|demonstration)|demonstrat|let me (?:try|experiment)|hands.on/.test(affirmative))return {format:'demonstration',request};
 if(/slides?|presentation|classroom|conventional instruction/.test(affirmative))return {format:'slides',request};
 if(/game|play/.test(affirmative))return {format:'game',request};
 return {format:null,request};
}

export const BOOLEAN_LESSON=Object.freeze({
 subject:'Sheldon Klein’s Boolean analogy',
 objective:'Compute an analogical transformation and apply it to a new six-feature situation.',
 source:'Sheldon Klein, The Analogical Foundations of Creativity in Language, Culture & the Arts, pp. 2–3',
 units:[
  {id:'relation',title:'Find the transformation',information:'A = 111110 and B = 010001. Strong equivalence gives 1 where corresponding bits agree and 0 where they differ. Compute the six-bit operator relating A to B.',answer:'010000'},
  {id:'transfer',title:'Apply it to another situation',information:'C = 100101. Apply the operator 010000 to C using strong equivalence. This is A:B :: C:D. Compute D.',answer:'001010'},
  {id:'reversibility',title:'Recover the original',information:'The same operator is involutive: applying 010000 to D = 001010 recovers C. Compute the recovered vector.',answer:'100101'},
 ],
});

export class ExperienceSession {
 constructor(core){this.core=core;}
 get exists(){return this.core.entities.has('experience.lesson');}
 get state(){return this.core.require('experience.lesson').state;}
 get environment(){return this.exists&&this.state.environment?this.core.require(this.state.environment):null;}
 start(lesson=BOOLEAN_LESSON,format='game'){
  if(this.exists){this.reconfigure(format,'Resume the existing activity');return;}
  if(!lesson?.subject||!lesson.objective||!Array.isArray(lesson.units)||!lesson.units.length||lesson.units.some(u=>!u.id||!u.title||!u.information)||new Set(lesson.units.map(u=>u.id)).size!==lesson.units.length)throw Error('Lesson requires a subject, objective and individually identified information units');
  const c=this.core;c.create({id:'experience.lesson',label:lesson.subject,address:exampleAddress(),dimension:'Design',functions:['teach','assess','reconfigure'],state:{subject:lesson.subject,objective:lesson.objective,source:lesson.source??null,units:structuredClone(lesson.units),completed:[],attempts:[],cursor:0,environment:null,revision:0,feedback:'',sandbox:{A:'111110',B:'010001',C:'100101'}}});
  this.reconfigure(format,'Start an activity from available capabilities');
 }
 request(text){const intent=interpretExperienceRequest(text);if(!intent.format)return {accepted:false,reason:'No supported format request recognized. The activity and its progress are unchanged.'};if(!this.exists)this.start();return this.reconfigure(intent.format,intent.request);}
 reconfigure(format,request,catalog=CAPABILITIES){
  const contract=typeof format==='string'?FORMAT_CONTRACTS[format]:format;if(!contract)throw Error('Unknown experience contract');
  // Plan first: failed planning must not dismantle a working environment.
  const plan=composeCapabilities(contract,catalog),c=this.core,old=this.environment,previous=old?.children??[],next=plan.components.map(cap=>'experience.component.'+cap.id),revision=this.state.revision+1;
  const retained=next.filter(id=>previous.includes(id)),released=previous.filter(id=>!next.includes(id)),created=next.filter(id=>!c.entities.has(id));
  for(const id of released)c.change(id,{active:false,resources:0},'no longer required by the requested experience');
  for(const cap of plan.components){const id='experience.component.'+cap.id;if(!c.entities.has(id))c.create({id,label:cap.id,address:exampleAddress(),dimension:'Design',functions:['render'],state:{role:cap.role,provides:[...cap.provides]}});c.change(id,{active:true,resources:cap.cost},'allocated reusable capability');}
  const id='experience.environment.'+revision;c.compose({id,label:'Composed experience '+revision,children:next,address:exampleAddress(),dimension:'Design',functions:['render','reconfigure']});
  c.change(id,{active:true,format:typeof format==='string'?format:'custom',layout:plan.layout,needs:plan.needs,cost:plan.cost,request,retained,released,created},'environment assembled from affordance requirements');
  if(old)c.change(old.id,{active:false},'presentation retired; purpose and history retained');
  c.change('experience.lesson',{environment:id,revision,feedback:revision>1?'Presentation changed. Your objective and progress are retained.':''},'purpose remains independent of the environment');
  c.relate({source:id,target:'experience.lesson',kind:'serves-objective',projection:'dependency',dimension:'Design',context:{request,retained,released,created}});
  c.record('observation.recorded',{kind:'experience-reconfiguration',from:old?.id??null,to:id,lesson:'experience.lesson',retained,released,created});
  return {accepted:true,environment:id,format:this.environment.state.format,retained,released,created};
 }
 navigate(offset){if(!Number.isInteger(offset))throw Error('Navigation offset must be an integer');this.core.change('experience.lesson',{cursor:Math.max(0,Math.min(this.state.units.length-1,this.state.cursor+offset))},'presentation position changed; demonstrated progress retained');}
 submit(answer){
  const unit=this.state.units[this.state.cursor];if(unit.answer==null)throw Error('This information unit has no registered assessment');
  const correct=String(answer).trim()===String(unit.answer),attempt={unit:unit.id,answer:String(answer).slice(0,240),correct};
  this.core.change('experience.lesson',{attempts:[...this.state.attempts,attempt].slice(-100),completed:correct?[...new Set([...this.state.completed,unit.id])]:[...this.state.completed],feedback:correct?'Correct. This progress belongs to the activity and survives presentation changes.':'The result differs. Compare each corresponding pair of bits and try again.'},'assessment outcome updates the same persistent activity');return {correct};
 }
 experiment(patch){const sandbox={...this.state.sandbox,...patch};for(const key of ['A','B','C'])normalizeVector(sandbox[key],6);const result=completeAnalogy(sandbox.A,sandbox.B,sandbox.C,'equivalence');this.core.change('experience.lesson',{sandbox,experiment:{operator:result.relation.join(''),result:result.result.join('')}},'interactive manipulation; the objective and assessment progress are unchanged');return result;}
}
