import {DEFAULT_RULES,ACTIONS,validateRules,validateAgent} from './swarm-rules.js';
import {RELAY_DEMO} from './swarm-scenarios.js';
import {LocalProduction} from './production.js';
import {exampleAddress,hash} from './ontology.js';
import {Substrate} from './substrate.js';

// Bounded local autonomy. Operators define physics/capabilities; choices are made
// from observations and experience. No network, shell or arbitrary-code tools.
export class AutonomousSwarm {
 constructor(core,{budget=120,scenario=RELAY_DEMO,rules={}}={}){this.core=core;if(!core.entities.has('autonomy'))this.setup(budget,scenario,rules);}
 setup(budget,scenario,rules){
  if(!Number.isInteger(budget)||budget<1||budget>1000)throw Error('Budget must be 1–1000 ticks');
  const validatedRules=validateRules(rules);
  if(!scenario||!Array.isArray(scenario.agents)||!Array.isArray(scenario.structures)||!Array.isArray(scenario.supplies)||scenario.agents.length>64||scenario.structures.length+scenario.supplies.length>128)throw Error('Invalid bounded scenario');
  // Validate every entry before creating any events, including duplicate IDs.
  const ids=new Set(['autonomy']);
  for(const object of [...scenario.structures,...scenario.supplies,...scenario.agents]){if(!object?.id||ids.has(object.id)||this.core.entities.has(object.id))throw Error('Duplicate scenario identity');ids.add(object.id);}
  for(const a of scenario.agents)validateAgent(this.agentSpec(a));
  for(const o of [...scenario.structures,...scenario.supplies])this.objectState(o);
  this.core.create({id:'autonomy',label:'Rule-governed local swarm',dimension:'Being',address:exampleAddress(),state:{tick:0,budget,rules:validatedRules,running:false,completed:false,permissions:Object.fromEntries(ACTIONS.map(a=>[a,true])),board:[],summary:'Ready: perceive needs and discover useful actions.'}});
  for(const o of [...scenario.structures,...scenario.supplies])this.addObject(o);
  for(const a of scenario.agents)this.addAgent(a);
 }
 agentSpec(spec){return {position:0,speed:1,reach:2,energy:40,maxEnergy:40,capacity:3,capabilities:[...ACTIONS],primitives:[],...spec};}
 addAgent(spec){
  const a=validateAgent(this.agentSpec(spec));if(this.agents().length>=64)throw Error('Agent limit reached');
  const {id,label, ...body}=a;
  this.core.create({id,label:label||id,dimension:'Being',address:exampleAddress(),functions:body.capabilities,state:{...body,autonomous:true,active:true,goal:'observe needs',inventory:0,memories:[],ties:{},generatedGoals:[],known:false,tool:'hands',toolFeatures:[],policy:{},sequencePolicy:{},experiences:[],lastAction:'waiting'}});
  this.core.change('autonomy',{completed:false},'new participant changes available capabilities');return this.core.require(id);
 }
 setAgentActive(id,active){const a=this.core.require(id);if(!a.state.autonomous&&!Array.isArray(a.state.capabilities))throw Error('Not a swarm agent');this.core.change(id,{active:!!active},'participant availability changed');this.core.change('autonomy',{completed:false},'reconsider available teams');}
 get rules(){return this.state.rules||DEFAULT_RULES;}
 setRules(patch){this.core.change('autonomy',{rules:validateRules({...this.rules,...patch,priorities:{...this.rules.priorities,...patch.priorities}}),completed:false},'supervisor changes explicit world rules');}
 get state(){return this.core.require('autonomy').state;}
 agents(){return [...this.core.entities.values()].filter(e=>e.state.active!==false&&(e.state.autonomous===true||e.id.startsWith('autonomy.')&&Array.isArray(e.state.capabilities)));}
 control(running){const next=!!running&&!this.state.completed&&this.state.tick<this.state.budget;if(next!==this.state.running)this.core.change('autonomy',{running:next},'supervisor control');}
 setPermission(action,enabled){if(!(action in this.state.permissions))throw Error('Unknown permission');this.core.change('autonomy',{permissions:{...this.state.permissions,[action]:!!enabled}},'supervisor permission');}
 checkpoint(){return {kind:'synthia-autonomy-checkpoint/v1',log:this.core.export()};}
 static restore(checkpoint){if(checkpoint?.kind!=='synthia-autonomy-checkpoint/v1')throw Error('Unknown checkpoint');const core=Substrate.replay(checkpoint.log);if(!core.entities.has('autonomy'))throw Error('Checkpoint has no autonomy state');const runtime=new AutonomousSwarm(core);runtime.control(false);return runtime;}
 structures(){return [...this.core.entities.values()].filter(e=>e.id.startsWith('autonomy.')&&Number.isFinite(e.state.health)&&Number.isFinite(e.state.required));}
 supplies(){return [...this.core.entities.values()].filter(e=>e.id.startsWith('autonomy.')&&Number.isFinite(e.state.parts));}
 objectState({id,position,health,required,parts,requiredCapability='grip'}){
  if(typeof id!=='string'||!id.startsWith('autonomy.')||!Number.isFinite(position)||Math.abs(position)>1000)throw Error('Invalid world object');
  const state={position};
  if(parts!==undefined){if(!Number.isInteger(parts)||parts<0||parts>1000)throw Error('Invalid material supply');state.parts=parts;}
  else{if(!Number.isInteger(required)||required<1||required>1000||!Number.isInteger(health)||health<0||health>required)throw Error('Invalid structure');if(typeof requiredCapability!=='string'||!requiredCapability||requiredCapability.length>64)throw Error('Invalid required capability');Object.assign(state,{health,required,requiredCapability});}
  return state;
 }
 addObject(spec){
  const state=this.objectState(spec);
  if(this.structures().length+this.supplies().length>=128)throw Error('World object limit reached');
  this.core.create({id:spec.id,label:spec.label||spec.id,address:exampleAddress(),dimension:'Being',state});
  this.core.change('autonomy',{completed:false},'world conditions changed');
 }
 perceive(agent){const s=agent.state,memories=new Set(s.memories||[]);
  if(this.state.permissions.inspect&&s.capabilities.includes('inspect'))for(const object of this.structures())if(Math.abs(s.position-object.state.position)<=s.reach)memories.add(object.id);
  this.core.change(agent.id,{memories:[...memories],known:memories.size>0},'local perception of reachable structures');
 }
 candidates(agent){const s=agent.state,p=this.state.permissions,actions=[],goals=[],weights=this.rules.priorities;
  const add=(action,utility,target,extra={})=>{if(p[action]&&s.capabilities.includes(action))actions.push({action,utility,target,...extra});};
  if((s.energy??40)<(s.maxEnergy??40)*this.rules.energyReserve){goals.push({kind:'recover',target:agent.id});add('rest',weights.recover,agent.id);}
  for(const object of this.structures()){
   if(object.state.health>=object.state.required)continue;
   if(!(s.memories||[]).includes(object.id)){add('inspect',weights.discover,object.id);continue;}
   goals.push({kind:'restore',target:object.id});
   if(!this.state.board.some(m=>m.from===agent.id&&m.object===object.id))add('communicate',weights.share,object.id);
   if(s.inventory>0){add('repair',weights.restore*(1+(object.state.required-object.state.health)/object.state.required*.1),object.id);if(!(s.toolFeatures||[]).includes(object.state.requiredCapability||'grip'))for(const component of this.rules.components)if(component.provides.includes(object.state.requiredCapability||'grip'))add('morph',weights.adapt-component.partsCost*.1,object.id,{component:component.id});}
   else for(const stock of this.supplies())if(stock.state.parts>0)add('gather',weights.acquire-Math.abs(s.position-stock.state.position)*.01,stock.id);
   if(s.inventory>0)for(const other of this.agents())if(other.id!==agent.id&&other.state.inventory===0&&(other.state.toolFeatures||[]).includes(object.state.requiredCapability||'grip'))add('transfer',weights.cooperate,other.id);
  }
  const production=this.core.entities.get('production')?.state;
  if(production&&(production.tasks?.some(t=>['queued','blocked'].includes(t.status))||production.bindings.length)){
   goals.push({kind:'coordinate',target:'production'});
   for(const other of this.agents())if(other!==agent&&Math.abs(s.position-other.state.position)<=this.rules.clusterRadius&&(s.primitives||[]).some(op=>!other.state.primitives?.includes(op))&&Math.max(s.ties?.[other.id]||0,other.state.ties?.[agent.id]||0)<this.rules.clusterThreshold+this.rules.relationshipDecay)add('communicate',weights.cooperate,other.id);
  }
  this.core.change(agent.id,{generatedGoals:goals,goal:goals.map(g=>g.kind+' '+g.target).join(', ')||'observe world'},'derive temporary goals from current needs and observations');
  return actions.filter(choice=>this.validate(agent,choice));
 }
 validate(agent,choice){
  if(!agent||!this.agents().some(a=>a===agent)||!choice||!ACTIONS.includes(choice.action))return false;
  const s=agent.state,t=this.core.entities.get(choice.target),action=choice.action;
  if(!t||!this.state.permissions[action]||!s.capabilities.includes(action)||(action!=='rest'&&action!=='morph'&&(s.energy??40)<this.rules.actionCost))return false;
  if(action==='rest')return t===agent;
  if(action==='communicate'&&this.agents().includes(t))return t!==agent&&Math.abs(s.position-t.state.position)<=this.rules.clusterRadius;
  if(action==='transfer')return this.agents().includes(t)&&t!==agent&&s.inventory>0&&t.state.inventory<(t.state.capacity??3);
  if(action==='gather')return this.supplies().includes(t)&&t.state.parts>0&&s.inventory<(s.capacity??3);
  if(action==='morph'){const component=this.rules.components.find(c=>c.id===choice.component);if(!component||s.inventory<component.partsCost||(s.energy??40)<component.energyCost)return false;}
  return this.structures().includes(t)&&(action==='inspect'||(s.memories||[]).includes(t.id))&&(action!=='repair'||s.inventory>0&&t.state.health<t.state.required);
 }
 decide(agent){const s=agent.state;return this.candidates(agent).map(c=>{const q=s.policy[c.action]||{n:0,value:0};return {...c,score:c.utility+q.value+(s.sequencePolicy?.[(s.previousAction||'start')+'>'+c.action]?.value||0)*.25+1/Math.sqrt(q.n+1)};}).sort((a,b)=>b.score-a.score||a.action.localeCompare(b.action))[0];}
 relation(source,target,kind){let r=[...this.core.relations.values()].find(r=>r.source===source&&r.target===target&&r.kind===kind);if(!r)r=this.core.relate({source,target,kind,projection:'causal',dimension:'Evolution',context:{createdBy:'autonomous interaction',tick:this.state.tick}});return r;}
 act(agent,choice){if(!this.validate(agent,choice))return false;const s=structuredClone(agent.state),target=this.core.require(choice.target).state;let reward=0,outcome='';
  const component=choice.action==='morph'?this.rules.components.find(c=>c.id===choice.component):null;
  s.energy=Math.max(0,(s.energy??40)-(choice.action==='rest'?0:component?.energyCost??this.rules.actionCost));
  if(choice.action==='rest'){s.energy=Math.min(s.maxEnergy??40,s.energy+this.rules.recovery);reward=.1;outcome='recovered energy';
  }else if(choice.action==='communicate'&&this.agents().some(a=>a.id===choice.target)){
   s.ties={...s.ties,[choice.target]:Math.min(1,(s.ties?.[choice.target]||0)+this.rules.relationshipGain)};s.memories=[...new Set([...(s.memories||[]),...(target.memories||[])])];
   this.core.change(choice.target,{ties:{...target.ties,[agent.id]:Math.min(1,(target.ties?.[agent.id]||0)+this.rules.relationshipGain)},memories:[...new Set([...(target.memories||[]),...(s.memories||[])])]},'peer capability contact exchanges current observations');
   this.core.signal(this.relation(agent.id,choice.target,'coordinates').id,1);reward=1;outcome='coordinated complementary capabilities';
  }else if(choice.action==='communicate'){
   const board=[...this.state.board,{from:agent.id,tick:this.state.tick,object:choice.target,health:target.health}].slice(-30);
   this.core.change('autonomy',{board},'agent posts observed problem');s.announced=true;
   for(const other of this.agents())if(other.id!==agent.id){this.core.change(other.id,{known:true,memories:[...new Set([...(other.state.memories||[]),choice.target])],ties:{...other.state.ties,[agent.id]:Math.min(1,(other.state.ties?.[agent.id]||0)+this.rules.relationshipGain)}},'received observed structure state');this.core.signal(this.relation(agent.id,other.id,'communicates').id,1);}
   reward=1;outcome='shared observation';
  }else if(choice.action==='morph'){
   s.tool=component.id;s.toolFeatures=[...component.provides];s.reach=component.reach;s.speed=component.speed;s.inventory-=component.partsCost;reward=.5;outcome='assembled '+component.id+' with permitted materials and geometry';
  }else if(Math.abs(s.position-target.position)>s.reach){
   s.position+=Math.sign(target.position-s.position)*Math.min(s.speed,Math.abs(target.position-s.position));reward=-.02;outcome='approached using body speed';
  }else if(choice.action==='transfer'){
   s.inventory--;this.core.change(choice.target,{inventory:target.inventory+1},'cooperation transfers existing material');s.ties={...s.ties,[choice.target]:Math.min(1,(s.ties?.[choice.target]||0)+.4)};this.core.signal(this.relation(agent.id,choice.target,'cooperates').id,1);reward=1;outcome='transferred one part';
  }else if(choice.action==='inspect'){
   s.memories=[...new Set([...(s.memories||[]),choice.target])];s.known=true;reward=.2;outcome='observed damage';
  }else if(choice.action==='gather'){
   if(target.parts>0){this.core.change(choice.target,{parts:target.parts-1},'material consumed from finite shared stock');s.inventory++;reward=.6;outcome='gathered one part';}else{reward=-1;outcome='supply exhausted';}
  }else if(choice.action==='repair'){
   if(!(s.toolFeatures||(s.tool==='gripper'?['grip']:[])).includes(target.requiredCapability||'grip')){reward=-2;outcome='failed: current tool cannot grip component';}
   else if(s.inventory>0&&target.health<target.required){s.inventory--;this.core.change(choice.target,{health:target.health+1},'repair consumed part and restored shared infrastructure');reward=3;outcome='restored structure health';this.core.signal(this.relation(agent.id,choice.target,'repairs').id,1);}
   else{reward=-.3;outcome='repair no longer needed';}
  }
  const sequence=(s.previousAction||'start')+'>'+choice.action,learned=s.sequencePolicy?.[sequence]||{n:0,value:0};s.sequencePolicy={...s.sequencePolicy,[sequence]:{n:learned.n+1,value:learned.value+(reward-learned.value)/(learned.n+1)}};s.previousAction=choice.action;
  const prior=s.policy[choice.action]||{n:0,value:0,failures:0},n=prior.n+1;
  s.policy[choice.action]={n,value:prior.value+(reward-prior.value)/n,failures:prior.failures+(reward<=-1?1:0)};
  s.experiences=[...s.experiences,{tick:this.state.tick,action:choice.action,target:choice.target,reward,outcome}].slice(-64);s.lastAction=choice.action+': '+outcome;
  this.core.change(agent.id,s,'consequence feedback updates future action values');
  return this.core.record('observation.recorded',{kind:'agent-experience',agent:agent.id,tick:this.state.tick,action:choice.action,target:choice.target,reward,outcome});
 }
 step(){if(!this.state.running||this.state.completed||this.state.tick>=this.state.budget||this.core.events.length>45000){if(this.state.running)this.control(false);return false;}
  this.core.change('autonomy',{tick:this.state.tick+1},'fixed simulation clock');
  for(const a of this.agents()){this.core.change(a.id,{ties:Object.fromEntries(Object.entries(a.state.ties||{}).map(([id,value])=>[id,Math.max(0,value-this.rules.relationshipDecay)]).filter(([,value])=>value>0))},'unused social ties weaken and dissolve');this.perceive(a);const choice=this.decide(a);if(choice)this.act(a,choice);}
  if(this.core.entities.has('production'))new LocalProduction(this).tick();
  const pending=this.core.entities.get('production')?.state.tasks?.some(t=>['queued','blocked'].includes(t.status)),completed=this.structures().every(e=>e.state.health>=e.state.required)&&!pending,exhausted=this.state.tick>=this.state.budget;
  this.core.change('autonomy',{completed,running:!completed&&!exhausted,summary:completed?'All infrastructure restored through permitted actions.':exhausted?'Execution budget reached.':'Agents perceiving, selecting tools and learning from consequences.'},'shared consequence assessment');return true;
 }
 fingerprint(){return hash(this.core.snapshot());}
}
