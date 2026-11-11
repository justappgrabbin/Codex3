import {Substrate} from './substrate.js';
import {exampleAddress,copy,fail} from './ontology.js';
export const BRANCHES=Object.freeze([
 {id:'resonance',label:'Resonance',subtitle:'Listen. Remember. Respond.',dimension:'Evolution',color:'#bcabff',activity:'Echo the three-note phrase',description:'Listen to the phrase, then touch the instruments in the same order.',sequence:[0,2,1]},
 {id:'structure',label:'Structure',subtitle:'Connect what is apart.',dimension:'Design',color:'#80c6e5',activity:'Build a crossing',description:'Turn each of the three bridge spans until all align with the path.'},
 {id:'movement',label:'Movement',subtitle:'Follow a new trajectory.',dimension:'Movement',color:'#f4ba75',activity:'Make three deliveries',description:'Choose the glowing destinations. Your character walks to the car, then drives the route.'}
]);
export class World{
 constructor(core=new Substrate()){this.core=core;this.setup();this.installTools();}
 installTools(){this.core.registerAction('enter',id=>{if(!id.startsWith('door.'))fail('TOOL_TARGET','Enter expects a door');this.enter(id.slice(5));return {room:this.room};});for(const name of ['rotate','play','deliver'])this.core.registerAction(name,id=>{if(!id.startsWith(this.room+'.part.'))fail('TOOL_CONTEXT','Enter this activity before executing its tools');return this.act(Number(id.split('.').at(-1)));});this.core.registerAction('return',()=>{this.home();return {room:'hub'};});this.core.registerAction('assemble',()=>{if(!this.state.assemblyLearning?.metrics?.improved)fail('LEARNING_REQUIRED','Assembly capability requires a verified learned controller');return {controller:'assembly-trials/v1',weights:this.state.assemblyLearning,entity:'player'};});}
 useTool(id,name,context={}){this.core.require(id);return this.core.execute('action.'+name,[id],{...context,room:this.room});}
 setup(){if(this.core.entities.has('world'))return;
  const c=this.core;const make=(id,label,dimension,extra={})=>c.create({id,label,dimension,address:exampleAddress(16),...extra});
  make('world','The meeting field','Design',{embodied:{shape:'room'},state:{room:'hub',profile:null,completed:[]}});
  make('player','Your character','Being',{embodied:{shape:'skinned-human',asset:'assets/human.glb'},functions:['walk','interact','enter','morph'],frame:'world',state:{position:[0,0,3],vehicle:false}});
  make('companion','Companion','Evolution',{embodied:{shape:'wolf',asset:'assets/wolf.glb'},functions:['remember','signal','prepare','morph'],frame:'world'});
  for(const dim of ['Movement','Evolution','Being','Design'])make('perspective.'+dim,dim,dim,{functions:['inspect','resolve'],frame:'world'});
  for(const b of BRANCHES){make('door.'+b.id,b.label,b.dimension,{embodied:{shape:'door',color:b.color},functions:['enter','prepare'],frame:'world',state:{prepared:false,visits:0}});c.relate({source:'companion',target:'door.'+b.id,kind:'prepares',projection:'causal',dimension:b.dimension,context:{branch:b.id}});}
  c.relate({source:'player',target:'companion',kind:'travels-with',projection:'knowledge',dimension:'Evolution'});
 }
 get state(){return this.core.require('world').state;}
 get room(){return this.state.room;}
 saveProfile(goal,pace){const text=String(goal).trim().slice(0,240);if(!text)fail('GOAL_REQUIRED','Choose a goal to begin');if(!['gentle','exploratory','focused'].includes(pace))fail('PACE_UNKNOWN','Unknown pace');this.core.change('world',{profile:{goal:text,pace}},'user chosen journey');this.core.record('profile.saved',{goal:text,pace});this.prepare();}
 prepare(){const c=this.core;c.change('world',{recommended:null},'objectives do not prescribe a fixed experience; fixtures require explicit selection');
  for(const b of BRANCHES){const id='door.'+b.id;if(!c.require(id).state.prepared)c.change(id,{prepared:true},'branch recipe available before entry');}
 }
 enter(id){const c=this.core;const branch=BRANCHES.find(b=>b.id===id);if(!branch)fail('BRANCH_UNKNOWN','Choose an existing door');if(!c.require('door.'+id).state.prepared)this.prepare();
  if(!c.entities.has('scene.'+id))this.assemble(branch);
  c.change('door.'+id,{visits:c.require('door.'+id).state.visits+1},'door entered');
  c.move('player','scene.'+id,'Being','walked through door');c.move('companion','scene.'+id,'Evolution','accompanied player');c.change('world',{room:id},'scene entered');c.change('player',{position:[0,0,3],vehicle:false},'arrived');c.record('scene.entered',{id});
  const rel=[...c.relations.values()].find(r=>r.source==='companion'&&r.target==='door.'+id);c.signal(rel.id,1);
 }
 assemble(branch){const c=this.core,ids=[];
  for(let i=0;i<3;i++){const id=branch.id+'.part.'+i;ids.push(id);c.create({id,label:branch.id==='resonance'?['Low bell','Middle bell','High bell'][i]:branch.id==='structure'?'Bridge span '+(i+1):'Delivery '+(i+1),dimension:branch.dimension,address:exampleAddress(branch.id==='structure'?11:16),qualities:{Movement:branch.id==='movement'?.9:.4,Evolution:branch.id==='resonance'?.9:.5,Being:.7,Design:branch.id==='structure'?.95:.6},embodied:{shape:branch.id==='structure'?'span':branch.id==='resonance'?'instrument':'destination',color:branch.color},functions:[branch.id==='structure'?'rotate':branch.id==='resonance'?'play':'deliver'],state:{index:i,turn:branch.id==='structure'?1:0,done:false}});}
  c.compose({id:'scene.'+branch.id,label:branch.label+' activity',children:ids,operator:'sequence',dimension:branch.dimension,address:exampleAddress(16),embodied:{shape:'activity'},functions:['enter','return']});
  c.change('scene.'+branch.id,{progress:[],complete:false},'activity initialized');
  c.relate({source:'door.'+branch.id,target:'scene.'+branch.id,kind:'opens-into',projection:'causal',dimension:branch.dimension,context:{recipe:branch.id}});
  c.execute('bundle',ids,{scene:branch.id});c.execute('resonate',ids,{scene:branch.id,goal:this.state.profile?.goal||''});
 }
 act(index){if(!Number.isInteger(index)||index<0||index>2)fail('ACT_INDEX','Choose an activity element');const c=this.core,id=this.room;if(id==='hub')fail('NO_ACTIVITY','Enter a door first');const scene=c.require('scene.'+id);if(scene.state.complete)return {complete:true,already:true};const item=c.require(id+'.part.'+index);
  if(id==='structure'){c.change(item.id,{turn:(item.state.turn+1)%2},'rotate bridge span');const complete=[0,1,2].every(i=>c.require(id+'.part.'+i).state.turn===0);if(complete)this.complete(id);return {complete};}
  if(id==='resonance'){const progress=[...scene.state.progress,index],seq=BRANCHES[0].sequence;const correct=progress.every((x,i)=>x===seq[i]);c.record('observation.recorded',{activity:id,kind:'note',index,matched:correct});c.change(scene.id,{progress:correct?progress:[]},correct?'phrase continued':'new attempt; previous observation retained');const complete=correct&&progress.length===3;if(complete)this.complete(id);return {correct,complete};}
  if(!item.state.done)c.change(item.id,{done:true},'delivery arrived');const progress=[0,1,2].filter(i=>c.require(id+'.part.'+i).state.done);c.change(scene.id,{progress},'delivery progress');const complete=progress.length===3;if(complete)this.complete(id);return {complete};
 }
 complete(id){const c=this.core;c.change('scene.'+id,{complete:true},'activity outcome');c.change('world',{completed:[...new Set([...this.state.completed,id])]},'journey memory');c.record('activity.completed',{id,outcome:'completed',interpretation:'task outcome only; not a judgment of the user'});}
 home(){const c=this.core;c.move('player','world','Being','returned to room');c.move('companion','world','Evolution','returned together');c.change('world',{room:'hub'},'returned');c.change('player',{position:[0,0,3],vehicle:false},'at room entrance');}
 movePlayer(position,vehicle=false){if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))fail('POSITION_INVALID','Position must be finite xyz');this.core.change('player',{position:copy(position),vehicle},'movement arrived');}
}
