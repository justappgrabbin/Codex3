import {exampleAddress,hash} from './ontology.js';
import {Substrate} from './substrate.js';

// Bounded local autonomy. Operators define physics/capabilities; choices are made
// from observations and experience. No network, shell or arbitrary-code tools.
export class AutonomousSwarm {
 constructor(core,{budget=120}={}){this.core=core;if(!core.entities.has('autonomy'))this.setup(budget);}
 setup(budget){
  if(!Number.isInteger(budget)||budget<1||budget>1000)throw Error('Budget must be 1–1000 ticks');
  const make=(id,label,state,functions=[])=>this.core.create({id,label,address:exampleAddress(),dimension:'Being',frame:this.core.entities.has('world')?'world':null,state,functions});
  make('autonomy','Continuous local swarm',{tick:0,budget,running:false,completed:false,permissions:{inspect:true,communicate:true,gather:true,repair:true,morph:true,transfer:true,rest:true},board:[],summary:'Ready: restore the shared relay.'});
  make('autonomy.relay','Damaged shared relay',{position:6,health:0,required:3},['inspect','repair']);
  make('autonomy.stock','Shared material supply',{position:0,parts:9},['gather']);
  for(const [name,position,speed,reach,goal,capabilities] of [
   ['scout',3,2,4,'discover and communicate',['inspect','communicate','morph','rest']],
   ['carrier',0,2,2,'make resources available',['inspect','communicate','gather','repair','morph','transfer','rest']],
   ['builder',5,1,2,'restore shared infrastructure',['inspect','communicate','gather','repair','morph','transfer','rest']]
  ])make('autonomy.'+name,name,{position,speed,reach,goal,capabilities,energy:40,maxEnergy:40,capacity:3,memories:[],ties:{},generatedGoals:[],inventory:0,known:false,announced:false,tool:'hands',policy:{},experiences:[],lastAction:'waiting'},capabilities);
 }
 get state(){return this.core.require('autonomy').state;}
 agents(){return ['scout','carrier','builder'].map(x=>this.core.require('autonomy.'+x));}
 control(running){const next=!!running&&!this.state.completed&&this.state.tick<this.state.budget;if(next!==this.state.running)this.core.change('autonomy',{running:next},'supervisor control');}
 setPermission(action,enabled){if(!(action in this.state.permissions))throw Error('Unknown permission');this.core.change('autonomy',{permissions:{...this.state.permissions,[action]:!!enabled}},'supervisor permission');}
 checkpoint(){return {kind:'synthia-autonomy-checkpoint/v1',log:this.core.export()};}
 static restore(checkpoint){if(checkpoint?.kind!=='synthia-autonomy-checkpoint/v1')throw Error('Unknown checkpoint');const core=Substrate.replay(checkpoint.log);if(!core.entities.has('autonomy'))throw Error('Checkpoint has no autonomy state');const runtime=new AutonomousSwarm(core);runtime.control(false);return runtime;}
 structures(){return [...this.core.entities.values()].filter(e=>e.id.startsWith('autonomy.')&&Number.isFinite(e.state.health)&&Number.isFinite(e.state.required));}
 supplies(){return [...this.core.entities.values()].filter(e=>e.id.startsWith('autonomy.')&&Number.isFinite(e.state.parts));}
 addObject({id,position,health,required,parts}){
  if(typeof id!=='string'||!id.startsWith('autonomy.')||!Number.isFinite(position)||Math.abs(position)>1000)throw Error('Invalid world object');
  const state={position};
  if(parts!==undefined){if(!Number.isInteger(parts)||parts<0||parts>1000)throw Error('Invalid material supply');state.parts=parts;}
  else{if(!Number.isInteger(required)||required<1||required>1000||!Number.isInteger(health)||health<0||health>required)throw Error('Invalid structure');Object.assign(state,{health,required});}
  this.core.create({id,label:id,address:exampleAddress(),dimension:'Being',state});
  this.core.change('autonomy',{completed:false},'world conditions changed');
 }
 perceive(agent){const s=agent.state,memories=new Set(s.memories||[]);
  if(this.state.permissions.inspect&&s.capabilities.includes('inspect'))for(const object of this.structures())if(Math.abs(s.position-object.state.position)<=s.reach)memories.add(object.id);
  this.core.change(agent.id,{memories:[...memories],known:memories.has('autonomy.relay')},'local perception of reachable structures');
 }
 candidates(agent){const s=agent.state,p=this.state.permissions,actions=[],goals=[];
  const add=(action,utility,target)=>{if(p[action]&&s.capabilities.includes(action))actions.push({action,utility,target});};
  if((s.energy??40)<8){goals.push({kind:'recover',target:agent.id});add('rest',20,agent.id);}
  for(const object of this.structures()){
   if(object.state.health>=object.state.required)continue;
   if(!(s.memories||[]).includes(object.id)){add('inspect',5,object.id);continue;}
   goals.push({kind:'restore',target:object.id});
   if(!this.state.board.some(m=>m.from===agent.id&&m.object===object.id))add('communicate',9,object.id);
   if(s.inventory>0){add('repair',8,object.id);if(s.tool!=='gripper')add('morph',7,object.id);}
   else for(const stock of this.supplies())if(stock.state.parts>0)add('gather',6-Math.abs(s.position-stock.state.position)*.01,stock.id);
   if(s.inventory>0)for(const other of this.agents())if(other.id!==agent.id&&other.state.inventory===0&&other.state.tool==='gripper')add('transfer',10,other.id);
  }
  this.core.change(agent.id,{generatedGoals:goals,goal:goals.map(g=>g.kind+' '+g.target).join(', ')||'observe world'},'derive temporary goals from current needs and observations');
  return actions.filter(choice=>this.validate(agent,choice));
 }
 validate(agent,choice){
  if(!agent||!this.agents().some(a=>a===agent)||!choice||!['inspect','communicate','gather','repair','morph','transfer','rest'].includes(choice.action))return false;
  const s=agent.state,t=this.core.entities.get(choice.target),action=choice.action;
  if(!t||!this.state.permissions[action]||!s.capabilities.includes(action)||(action!=='rest'&&(s.energy??40)<1))return false;
  if(action==='rest')return t===agent;
  if(action==='transfer')return this.agents().includes(t)&&t!==agent&&s.inventory>0&&t.state.inventory<(t.state.capacity??3);
  if(action==='gather')return this.supplies().includes(t)&&t.state.parts>0&&s.inventory<(s.capacity??3);
  return this.structures().includes(t)&&(action==='inspect'||(s.memories||[]).includes(t.id))&&(action!=='repair'||s.inventory>0&&t.state.health<t.state.required);
 }
 decide(agent){const s=agent.state;return this.candidates(agent).map(c=>{const q=s.policy[c.action]||{n:0,value:0};return {...c,score:c.utility+q.value+1/Math.sqrt(q.n+1)};}).sort((a,b)=>b.score-a.score||a.action.localeCompare(b.action))[0];}
 relation(source,target,kind){let r=[...this.core.relations.values()].find(r=>r.source===source&&r.target===target&&r.kind===kind);if(!r)r=this.core.relate({source,target,kind,projection:'causal',dimension:'Evolution',context:{createdBy:'autonomous interaction',tick:this.state.tick}});return r;}
 act(agent,choice){if(!this.validate(agent,choice))return false;const s=structuredClone(agent.state),target=this.core.require(choice.target).state;let reward=0,outcome='';
  s.energy=Math.max(0,(s.energy??40)-(choice.action==='rest'?0:1));
  if(choice.action==='rest'){s.energy=Math.min(s.maxEnergy??40,s.energy+6);reward=.1;outcome='recovered energy';
  }else if(choice.action==='communicate'){
   const board=[...this.state.board,{from:agent.id,tick:this.state.tick,object:choice.target,health:target.health}].slice(-30);
   this.core.change('autonomy',{board},'agent posts observed problem');s.announced=true;
   for(const other of this.agents())if(other.id!==agent.id){this.core.change(other.id,{known:true,memories:[...new Set([...(other.state.memories||[]),choice.target])],ties:{...other.state.ties,[agent.id]:Math.min(1,(other.state.ties?.[agent.id]||0)+.25)}},'received observed structure state');this.core.signal(this.relation(agent.id,other.id,'communicates').id,1);}
   reward=1;outcome='shared observation';
  }else if(choice.action==='morph'){
   s.tool='gripper';s.reach=3;s.speed=1;reward=.5;outcome='formed gripper; longer reach, lower speed';
  }else if(Math.abs(s.position-target.position)>s.reach){
   s.position+=Math.sign(target.position-s.position)*Math.min(s.speed,Math.abs(target.position-s.position));reward=-.02;outcome='approached using body speed';
  }else if(choice.action==='transfer'){
   s.inventory--;this.core.change(choice.target,{inventory:target.inventory+1},'cooperation transfers existing material');s.ties={...s.ties,[choice.target]:Math.min(1,(s.ties?.[choice.target]||0)+.4)};this.core.signal(this.relation(agent.id,choice.target,'cooperates').id,1);reward=1;outcome='transferred one part';
  }else if(choice.action==='inspect'){
   s.memories=[...new Set([...(s.memories||[]),choice.target])];s.known=true;reward=.2;outcome='observed damage';
  }else if(choice.action==='gather'){
   if(target.parts>0){this.core.change(choice.target,{parts:target.parts-1},'material consumed from finite shared stock');s.inventory++;reward=.6;outcome='gathered one part';}else{reward=-1;outcome='supply exhausted';}
  }else if(choice.action==='repair'){
   if(s.tool!=='gripper'){reward=-2;outcome='failed: hands cannot grip relay coupling';}
   else if(s.inventory>0&&target.health<target.required){s.inventory--;this.core.change(choice.target,{health:target.health+1},'repair consumed part and restored shared infrastructure');reward=3;outcome='restored relay health';this.core.signal(this.relation(agent.id,choice.target,'repairs').id,1);}
   else{reward=-.3;outcome='repair no longer needed';}
  }
  const prior=s.policy[choice.action]||{n:0,value:0,failures:0},n=prior.n+1;
  s.policy[choice.action]={n,value:prior.value+(reward-prior.value)/n,failures:prior.failures+(reward<=-1?1:0)};
  s.experiences=[...s.experiences,{tick:this.state.tick,action:choice.action,target:choice.target,reward,outcome}].slice(-64);s.lastAction=choice.action+': '+outcome;
  this.core.change(agent.id,s,'consequence feedback updates future action values');
  return this.core.record('observation.recorded',{kind:'agent-experience',agent:agent.id,tick:this.state.tick,action:choice.action,target:choice.target,reward,outcome});
 }
 step(){if(!this.state.running||this.state.completed||this.state.tick>=this.state.budget||this.core.events.length>45000){if(this.state.running)this.control(false);return false;}
  this.core.change('autonomy',{tick:this.state.tick+1},'fixed simulation clock');
  for(const a of this.agents()){this.core.change(a.id,{ties:Object.fromEntries(Object.entries(a.state.ties||{}).map(([id,value])=>[id,Math.max(0,value-.01)]).filter(([,value])=>value>0))},'unused social ties weaken and dissolve');this.perceive(a);const choice=this.decide(a);if(choice)this.act(a,choice);}
  const completed=this.structures().every(e=>e.state.health>=e.state.required),exhausted=this.state.tick>=this.state.budget;
  this.core.change('autonomy',{completed,running:!completed&&!exhausted,summary:completed?'All infrastructure restored through permitted actions.':exhausted?'Execution budget reached.':'Agents perceiving, selecting tools and learning from consequences.'},'shared consequence assessment');return true;
 }
 fingerprint(){return hash(this.core.snapshot());}
}
