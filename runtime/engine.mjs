import {VisualField} from '../synthia-dual-swarm/core/visual-field.js';
import {DEFAULT_RULES} from '../synthia-dual-swarm/core/swarm-rules.js';
import {representText} from '../synthia-dual-swarm/core/representations.js';
import {PARTICLE_FIELD} from '../synthia-dual-swarm/core/swarm-scenarios.js';
import {Substrate} from '../synthia-dual-swarm/core/substrate.js';
import {World} from '../synthia-dual-swarm/core/world.js';
import {AutonomousSwarm} from '../synthia-dual-swarm/core/autonomy.js';
import {LocalProduction} from '../synthia-dual-swarm/core/production.js';

export class RuntimeEngine {
 constructor(saved=null){
  this.core=saved?Substrate.replay(saved.log):new Substrate();
  if(!saved)new World(this.core);
  this.swarm=new AutonomousSwarm(this.core,{scenario:PARTICLE_FIELD,budget:1000,rules:{continuous:true,sixBit:{enabled:true,radius:3,contactRadius:.32,alpha:1,maxSignalSpeed:4,midDensity:2,highDensity:5,gain:.1,decay:.02,pruneThreshold:.02,signalLeak:.5,inputGain:.2},field:{enabled:true,radius:3,strength:.02,pairs:{'00':-1,'01':1,'10':1,'11':-1},colors:{'0':[0,0,0],'1':[255,255,255]},asciiGroups:[PARTICLE_FIELD.agents.map(a=>a.id)]}}});this.production=new LocalProduction(this.swarm);
 }
 checkpoint(){return this.swarm.checkpoint();}
 snapshot(){
  const {state}=this.swarm;
  return {schema:'synthia.runtime/v1',tick:state.tick,budget:state.budget,running:state.running,completed:state.completed,summary:state.summary,
   agents:this.swarm.agents().map(a=>({id:a.id,label:a.label,...structuredClone(a.state)})),
   structures:this.swarm.structures().map(e=>({id:e.id,...e.state})),supplies:this.swarm.supplies().map(e=>({id:e.id,...e.state})),
   clusters:this.production.clusters(),production:structuredClone(this.production.state),permissions:{...state.permissions},rules:structuredClone(this.swarm.rules),field:structuredClone(state.field||{pairs:[],encodings:[]}),sixBit:structuredClone(state.sixBit||null),visualModel:state.visualField?{status:state.visualField.status,epoch:state.visualField.epoch,epochs:state.visualField.epochs,metrics:structuredClone(state.visualField.metrics),scope:state.visualField.scope}:null,
   events:this.core.events.slice(-30).map(e=>({seq:e.seq,type:e.type,reason:e.data.reason||e.data.kind||e.data.outcome||e.data.label||e.data.id||''})),eventCount:this.core.events.length};
 }
 preview(){return {entities:[...this.core.entities.values()].map(e=>({...structuredClone(e),history:[]})),relations:[...this.core.relations.values()].map(e=>structuredClone(e)),signals:[]};}
 tick(){return this.swarm.step();}
 command(command){
  const {action}=command;let result={};
  if(action==='sixBitMode')this.swarm.setRules({sixBit:{...DEFAULT_RULES.sixBit,...this.swarm.rules.sixBit,enabled:command.enabled===true}});
  else if(action==='trainVisual')new VisualField(this.swarm).queue(command.training);
  else if(action==='visualFrame')result={frame:new VisualField(this.swarm).frame(command.frame)};
  else if(action==='representText')result={representation:representText(command.text)};
  else if(action==='start')this.swarm.control(true);
  else if(action==='pause')this.swarm.control(false);
  else if(action==='step'){this.swarm.control(true);this.swarm.step();this.swarm.control(false);}
  else if(action==='request')result={taskId:this.production.request(command.request)};
  else if(action==='permission')this.swarm.setPermission(command.name,command.enabled);
  else if(action==='rules')this.swarm.setRules(command.rules);
  else if(action==='addAgent')this.swarm.addAgent(command.agent);
  else if(action==='particleState'){if(this.swarm.rules.sixBit?.enabled)throw Error('Six-bit mode changes lines through contacts; disable it to edit binary state directly');const agent=this.core.require(command.id);if(!this.swarm.agents().includes(agent)||typeof command.open!=='boolean')throw Error('Invalid virtual-particle state');this.core.change(command.id,{open:command.open},'particle open/closed state changed');}
  else if(action==='agentActive')this.swarm.setAgentActive(command.id,command.active);
  else if(action==='addObject')this.swarm.addObject(command.object);
  else if(action==='bind')this.production.bind(command.toolId,command.target);
  else if(action==='unbind')this.production.unbind(command.target);
  else if(action==='feedback')this.production.feedback(command.target,command.measurement);
  else if(action==='configure'){
   const candidate=new Substrate();new World(candidate);const swarm=new AutonomousSwarm(candidate,command.config);const production=new LocalProduction(swarm);
   this.core=candidate;this.swarm=swarm;this.production=production;
  }else if(action==='restore'){
   const restored=AutonomousSwarm.restore(command.checkpoint);this.core=restored.core;this.swarm=restored;this.production=new LocalProduction(restored);
  }else throw Error('Unsupported runtime command');
  return result;
 }
}
