import {exampleAddress,hash} from './ontology.js';
import {Substrate} from './substrate.js';

// Bounded local autonomy. Operators define physics/capabilities; choices are made
// from observations and experience. No network, shell or arbitrary-code tools.
export class AutonomousSwarm {
 constructor(core,{budget=120}={}){this.core=core;if(!core.entities.has('autonomy'))this.setup(budget);}
 setup(budget){
  if(!Number.isInteger(budget)||budget<1||budget>1000)throw Error('Budget must be 1–1000 ticks');
  const make=(id,label,state,functions=[])=>this.core.create({id,label,address:exampleAddress(),dimension:'Being',frame:this.core.entities.has('world')?'world':null,state,functions});
  make('autonomy','Continuous local swarm',{tick:0,budget,running:false,completed:false,permissions:{inspect:true,communicate:true,gather:true,repair:true,morph:true},board:[],summary:'Ready: restore the shared relay.'});
  make('autonomy.relay','Damaged shared relay',{position:6,health:0,required:3},['inspect','repair']);
  make('autonomy.stock','Shared material supply',{position:0,parts:9},['gather']);
  for(const [name,position,speed,reach,goal,capabilities] of [
   ['scout',3,2,4,'discover and communicate',['inspect','communicate','morph']],
   ['carrier',0,2,2,'make resources available',['inspect','communicate','gather','repair','morph']],
   ['builder',5,1,2,'restore shared infrastructure',['inspect','communicate','gather','repair','morph']]
  ])make('autonomy.'+name,name,{position,speed,reach,goal,capabilities,inventory:0,known:false,announced:false,tool:'hands',policy:{},experiences:[],lastAction:'waiting'},capabilities);
 }
 get state(){return this.core.require('autonomy').state;}
 agents(){return ['scout','carrier','builder'].map(x=>this.core.require('autonomy.'+x));}
 control(running){const next=!!running&&!this.state.completed&&this.state.tick<this.state.budget;if(next!==this.state.running)this.core.change('autonomy',{running:next},'supervisor control');}
 setPermission(action,enabled){if(!(action in this.state.permissions))throw Error('Unknown permission');this.core.change('autonomy',{permissions:{...this.state.permissions,[action]:!!enabled}},'supervisor permission');}
 checkpoint(){return {kind:'synthia-autonomy-checkpoint/v1',log:this.core.export()};}
 static restore(checkpoint){if(checkpoint?.kind!=='synthia-autonomy-checkpoint/v1')throw Error('Unknown checkpoint');const core=Substrate.replay(checkpoint.log);if(!core.entities.has('autonomy'))throw Error('Checkpoint has no autonomy state');const runtime=new AutonomousSwarm(core);runtime.control(false);return runtime;}
 perceive(agent){const relay=this.core.require('autonomy.relay').state,s=agent.state;if(!s.known&&Math.abs(s.position-relay.position)<=s.reach&&this.state.permissions.inspect){this.core.change(agent.id,{known:true},'local perception: relay within body sensing radius');this.core.record('observation.recorded',{kind:'agent-perception',agent:agent.id,object:'autonomy.relay',tick:this.state.tick,health:relay.health});}}
 candidates(agent){const s=agent.state,relay=this.core.require('autonomy.relay').state,stock=this.core.require('autonomy.stock').state,p=this.state.permissions,actions=[];
  const add=(action,utility,target)=>{if(p[action]&&s.capabilities.includes(action))actions.push({action,utility,target});};
  if(!s.known)add('inspect',5,'autonomy.relay');
  if(s.known&&!s.announced)add('communicate',9,'autonomy.relay');
  if(s.known&&relay.health<relay.required){
   if(s.inventory>0){add('repair',8,'autonomy.relay');if(s.tool!=='gripper')add('morph',7,'autonomy.relay');}
   else if(stock.parts>0)add('gather',s.goal.includes('resources')?8:6,'autonomy.stock');
  }
  return actions;
 }
 decide(agent){const s=agent.state;return this.candidates(agent).map(c=>{const q=s.policy[c.action]||{n:0,value:0};return {...c,score:c.utility+q.value+1/Math.sqrt(q.n+1)};}).sort((a,b)=>b.score-a.score||a.action.localeCompare(b.action))[0];}
 relation(source,target,kind){let r=[...this.core.relations.values()].find(r=>r.source===source&&r.target===target&&r.kind===kind);if(!r)r=this.core.relate({source,target,kind,projection:'causal',dimension:'Evolution',context:{createdBy:'autonomous interaction',tick:this.state.tick}});return r;}
 act(agent,choice){const s=structuredClone(agent.state),target=this.core.require(choice.target).state;let reward=0,outcome='';
  if(choice.action==='communicate'){
   const board=[...this.state.board,{from:agent.id,tick:this.state.tick,object:choice.target,health:target.health}].slice(-30);
   this.core.change('autonomy',{board},'agent posts observed problem');s.announced=true;
   for(const other of this.agents())if(other.id!==agent.id){this.core.change(other.id,{known:true},'received observed relay state');this.core.signal(this.relation(agent.id,other.id,'communicates').id,1);}
   reward=1;outcome='shared observation';
  }else if(choice.action==='morph'){
   s.tool='gripper';s.reach=3;s.speed=1;reward=.5;outcome='formed gripper; longer reach, lower speed';
  }else if(Math.abs(s.position-target.position)>s.reach){
   s.position+=Math.sign(target.position-s.position)*Math.min(s.speed,Math.abs(target.position-s.position));reward=-.02;outcome='approached using body speed';
  }else if(choice.action==='inspect'){
   s.known=true;reward=.2;outcome='observed damage';
  }else if(choice.action==='gather'){
   if(target.parts>0){this.core.change(choice.target,{parts:target.parts-1},'material consumed from finite shared stock');s.inventory++;reward=.6;outcome='gathered one part';}else{reward=-1;outcome='supply exhausted';}
  }else if(choice.action==='repair'){
   if(s.tool!=='gripper'){reward=-2;outcome='failed: hands cannot grip relay coupling';}
   else if(s.inventory>0&&target.health<target.required){s.inventory--;this.core.change(choice.target,{health:target.health+1},'repair consumed part and restored shared infrastructure');reward=3;outcome='restored relay health';this.core.signal(this.relation(agent.id,choice.target,'repairs').id,1);}
   else{reward=-.3;outcome='repair no longer needed';}
  }
  const prior=s.policy[choice.action]||{n:0,value:0,failures:0},n=prior.n+1;
  s.policy[choice.action]={n,value:prior.value+(reward-prior.value)/n,failures:prior.failures+(reward<=-1?1:0)};
  s.experiences=[...s.experiences,{tick:this.state.tick,action:choice.action,reward,outcome}].slice(-64);s.lastAction=choice.action+': '+outcome;
  this.core.change(agent.id,s,'consequence feedback updates future action values');
  this.core.record('observation.recorded',{kind:'agent-experience',agent:agent.id,tick:this.state.tick,action:choice.action,reward,outcome});
 }
 step(){if(!this.state.running||this.state.completed||this.state.tick>=this.state.budget||this.core.events.length>45000){if(this.state.running)this.control(false);return false;}
  this.core.change('autonomy',{tick:this.state.tick+1},'fixed simulation clock');
  for(const a of this.agents()){this.perceive(a);const choice=this.decide(a);if(choice)this.act(a,choice);}
  const relay=this.core.require('autonomy.relay').state,completed=relay.health>=relay.required,exhausted=this.state.tick>=this.state.budget;
  this.core.change('autonomy',{completed,running:!completed&&!exhausted,summary:completed?'Relay restored through communication, material use and adapted tools.':exhausted?'Execution budget reached.':'Agents perceiving, selecting tools and learning from consequences.'},'shared consequence assessment');return true;
 }
 fingerprint(){return hash(this.core.snapshot());}
}
