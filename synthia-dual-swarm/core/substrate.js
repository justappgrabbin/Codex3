import {AutomataMesh} from '../vendor/recovered/src/synthia/semantic-mesh/mesh/mesh.js';
import {Automaton} from '../vendor/recovered/src/synthia/semantic-mesh/automata/automaton.js';
import {StatePacket} from '../vendor/recovered/src/synthia/semantic-mesh/mesh/packet.js';
import {gateBits,gateFromBits} from '../vendor/recovered/src/synthia/semantic-mesh/state-space/addressing.js';
import {ACTIVE,VERSION,copy,freeze,fail,validateAddress,validateQualities,hash} from './ontology.js';
import {resolveDimensionalFrame,facetKey} from './dimensional-frames.js';
export {gateBits};

export class Substrate{
 constructor(){this.entities=new Map();this.relations=new Map();this.events=[];this.listeners=new Set();this.mesh=new AutomataMesh();this.operators=new Map();this.signals=[];this.installOperators();}
 onChange(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 require(id){const e=this.entities.get(id);if(!e)fail('ENTITY_UNKNOWN',`Unknown entity: ${id}`);return e;}
 validateEvent(type,d){
  if(!d||typeof d!=='object'||Array.isArray(d))fail('EVENT_DATA','Event data must be an object');
  const check=(v,depth=0)=>{if(depth>40)fail('EVENT_DEPTH','Event data exceeds maximum nesting');if(typeof v==='number'&&!Number.isFinite(v))fail('EVENT_NUMBER','Event numbers must be finite');if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(k))fail('EVENT_KEY','Unsafe object key');check(x,depth+1);}};check(d);
  if(type==='entity.created'||type==='composite.created'){if(typeof d.id!=='string'||!d.id||this.entities.has(d.id))fail('ENTITY_DUPLICATE','Invalid or duplicate recorded identity');validateAddress(d.address);validateQualities(d.qualities);if(!ACTIVE.includes(d.dimension))fail('DIMENSION_UNKNOWN','Unknown recorded dimension');if(!Array.isArray(d.children)||!Array.isArray(d.history)||!Array.isArray(d.functions)||!d.state||typeof d.label!=='string')fail('ENTITY_SCHEMA','Incomplete recorded entity');d.children.forEach(id=>this.require(id));if(d.frame)this.require(d.frame);}
  else if(type==='relation.created'){this.require(d.source);this.require(d.target);if(this.relations.has(d.id)||typeof d.id!=='string'||!['knowledge','causal','phase','temporal','dependency'].includes(d.projection)||!ACTIVE.includes(d.dimension))fail('RELATION_SCHEMA','Invalid recorded relation');validateAddress(d.address);if(d.crossings!==0||d.weight!==0)fail('RELATION_ORIGIN','Relations must begin without fabricated crossings');}
  else if(type==='entity.moved'){this.require(d.id);this.require(d.frame);if(!ACTIVE.includes(d.placement))fail('PLACEMENT_UNKNOWN','Unknown recorded placement');if(d.id===d.frame||this.descendants(d.id).includes(d.frame))fail('FRAME_CYCLE','Invalid recorded frame');let frame=this.require(d.frame),seen=new Set([d.id]);while(frame){if(seen.has(frame.id))fail('FRAME_CYCLE','Cyclic recorded frames');seen.add(frame.id);frame=frame.frame?this.require(frame.frame):null;}}
  else if(type==='entity.changed'){this.require(d.id);if(!d.patch||typeof d.patch!=='object'||Array.isArray(d.patch))fail('STATE_PATCH','Invalid recorded patch');}
  else if(type==='quality.changed'){this.require(d.id);validateQualities(d.qualities);}
  else if(type==='gate.changed'){const e=this.require(d.id);if(e.address.gate!==d.from||!Number.isInteger(d.line)||d.line<1||d.line>6)fail('GATE_HISTORY','Invalid recorded gate transition');const bits=gateBits(d.from);bits[d.line-1]^=1;if(gateFromBits(bits)!==d.to)fail('GATE_HISTORY','Recorded gate must change the indicated line');}
  else if(type==='signal.delivered'){const r=this.relations.get(d.relation);if(!r||d.from!==r.source||d.to!==r.target||!Number.isFinite(d.value)||!d.receipt?.delivered)fail('SIGNAL_INVALID','Invalid recorded signal');}
  else if(!['tool.executed','observation.recorded','profile.saved','activity.completed','scene.entered'].includes(type))fail('EVENT_UNKNOWN','Unknown event: '+type);
 }
 record(type,data){this.validateEvent(type,data);const event=freeze({seq:this.events.length+1,parent:this.events.length||null,rule:VERSION,type,data:copy(data)});this.apply(event);this.events.push(event);for(const fn of this.listeners)fn(event);return event;}
 apply(event){const d=event.data;
  if(event.type==='entity.created'||event.type==='composite.created'){const e=copy(d);this.entities.set(e.id,e);this.mesh.register({id:e.id,ports:{in:[{id:'input',type:'json'}],out:[{id:'output',type:'json'}]}});}
  else if(event.type==='relation.created'){this.relations.set(d.id,copy(d));this.mesh.addEdge(d.projection,d.source,d.target,d.kind,{...d.context,address:d.address,dimension:d.dimension,transformation:d.transformation,provenance:d.provenance});const result=this.mesh.connect(d.source,d.target);if(result.status!=='connected')fail('PORT_CONNECTION_FAILED','Recovered mesh rejected relation',result);}
  else if(event.type==='entity.moved'){const e=this.require(d.id);e.frame=d.frame;e.placement=d.placement;e.history.push({seq:event.seq,frame:d.frame,placement:copy(d.placement),reason:d.reason});}
  else if(event.type==='entity.changed'){const e=this.require(d.id);Object.assign(e.state,copy(d.patch));e.history.push({seq:event.seq,patch:copy(d.patch),reason:d.reason});}
  else if(event.type==='quality.changed'){const e=this.require(d.id);e.qualities=copy(d.qualities);e.history.push({seq:event.seq,qualities:copy(d.qualities)});}
  else if(event.type==='signal.delivered'){const r=this.relations.get(d.relation);r.crossings++;r.weight=r.crossings/(r.crossings+1);this.signals.push({...copy(d),seq:event.seq});}
  else if(event.type==='gate.changed'){const e=this.require(d.id);e.address.gate=d.to;e.history.push({seq:event.seq,gate:d.to,line:d.line,from:d.from});}
  else if(!['tool.executed','observation.recorded','profile.saved','activity.completed','scene.entered'].includes(event.type))fail('EVENT_UNKNOWN',`Unknown event: ${event.type}`);
 }
 create({id,label,kind='primitive',dimension='Being',address,qualities={Movement:.5,Evolution:.5,Being:.5,Design:.5},frame=null,placement=null,embodied={},functions=[],state={}}){
  if(typeof id!=='string'||!id||this.entities.has(id))fail('ENTITY_DUPLICATE','Entity id must be new and nonempty',{id});
  if(!ACTIVE.includes(dimension))fail('DIMENSION_UNKNOWN','Identity requires one of the four contributing perspectives');
  if(frame!==null)this.require(frame);
  const entity={id,label:String(label||id),kind,dimension,address:validateAddress(address),qualities:validateQualities(qualities),frame,placement,embodied:copy(embodied),functions:[...functions],state:copy(state),children:[],history:[{seq:this.events.length+1,frame,placement:copy(placement),reason:'origin'}]};
  this.record('entity.created',entity);return this.require(id);
 }
 compose({id,label,children,operator='bundle',dimension='Design',address,embodied={},functions=[]}){
  if(this.entities.has(id)||typeof id!=='string'||!id)fail('ENTITY_DUPLICATE','Composite id must be new');
  if(!['bundle','sequence'].includes(operator))fail('OPERATOR_UNKNOWN','Composition uses bundle or sequence');
  if(!ACTIVE.includes(dimension))fail('DIMENSION_UNKNOWN','Composite requires a contributing dimension');
  if(!Array.isArray(children)||!children.length||new Set(children).size!==children.length)fail('COMPOSITION_CHILDREN','Children must be a nonempty list of distinct existing identities');
  const parts=children.map(x=>this.require(x));const qualities=Object.fromEntries(ACTIVE.map(d=>[d,parts.reduce((n,p)=>n+p.qualities[d],0)/parts.length]));
  const entity={id,label:String(label||id),kind:'composite',dimension,address:validateAddress(address),qualities,frame:null,placement:null,embodied:copy(embodied),functions:[...functions],state:{operator},children:[...children],history:[{seq:this.events.length+1,reason:'composition',operator,children:[...children]}]};
  this.record('composite.created',entity);
  children.forEach((child,index)=>this.relate({source:id,target:child,kind:'contains',projection:'dependency',dimension,context:{operator,index},transformation:operator}));return this.require(id);
 }
 descendants(id){return this.require(id).children.flatMap(child=>[child,...this.descendants(child)]);}
 depth(id){const e=this.require(id);return e.children.length?1+Math.max(...e.children.map(c=>this.depth(c))):0;}
 move(id,frame,placement,reason='entered frame'){this.require(id);this.require(frame);if(id===frame||this.descendants(id).includes(frame))fail('FRAME_CYCLE','A structure cannot be placed inside its own descendants');let f=this.require(frame);const seen=new Set([id]);while(f){if(seen.has(f.id))fail('FRAME_CYCLE','Frame containment must remain acyclic');seen.add(f.id);f=f.frame?this.require(f.frame):null;}if(!ACTIVE.includes(placement))fail('PLACEMENT_UNKNOWN','Placement must name a contributing dimension');return this.record('entity.moved',{id,frame,placement,reason});}
 change(id,patch,reason){this.require(id);if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>['__proto__','constructor','prototype'].includes(k)))fail('STATE_PATCH','Invalid state patch');return this.record('entity.changed',{id,patch,reason:reason||'local action'});}
 qualities(id,q){this.require(id);return this.record('quality.changed',{id,qualities:validateQualities(q)});}
 relate({source,target,kind,projection='knowledge',dimension='Design',transformation='relate',context={}}){this.require(source);this.require(target);if(!ACTIVE.includes(dimension))fail('DIMENSION_UNKNOWN','Relation requires contributing perspective');if(!['knowledge','causal','phase','temporal','dependency'].includes(projection))fail('PROJECTION_UNKNOWN','Unknown graph projection');const id='relation-'+(this.relations.size+1);const r={id,source,target,kind,projection,dimension,transformation,context:copy(context),address:copy(this.require(source).address),provenance:{event:this.events.length+1,rule:VERSION},weight:0,crossings:0};this.record('relation.created',r);return this.relations.get(id);}
 signal(id,value){const r=this.relations.get(id);if(!r)fail('RELATION_UNKNOWN','Cannot signal an absent relation');if(!Number.isFinite(value))fail('SIGNAL_INVALID','Signal must be finite');const packet=new StatePacket({id:'signal-'+(this.events.length+1),from:r.source,to:r.target,payload:{value},address:r.address,derivationId:'event-'+(this.events.length+1)});const receipt=this.mesh.route(packet);if(!receipt.delivered)fail('SIGNAL_UNDELIVERED','Packet not delivered',receipt);return this.record('signal.delivered',{relation:id,value,from:r.source,to:r.target,packet:packet.toJSON(),receipt});}
 changeLine(id,line){const e=this.require(id);if(!Number.isInteger(line)||line<1||line>6)fail('LINE_RANGE','Line must be 1..6');const bits=gateBits(e.address.gate);bits[line-1]^=1;return this.record('gate.changed',{id,line,from:e.address.gate,to:gateFromBits(bits)});}
 expression(id){const e=this.require(id);const q=e.qualities;const pairs=[];for(let i=0;i<ACTIVE.length;i++)for(let j=i+1;j<ACTIVE.length;j++){const a=ACTIVE[i],b=ACTIVE[j];pairs.push({source:a,target:b,intensity:Math.sqrt(q[a]*q[b])});}return {entity:id,dimension:'Space',derived:true,rule:'pairwise-geometric-mean/v1 (design hypothesis)',pairs,coherence:pairs.reduce((n,p)=>n+p.intensity,0)/pairs.length};}
 dimensionalViews(id,path=[]){return resolveDimensionalFrame(this.require(id),path);}
 setFacet(id,path,dimension,quality,attributes){const e=this.require(id),key=facetKey(path,dimension,quality);if(!attributes||typeof attributes!=='object'||Array.isArray(attributes))fail('FACET_ATTRIBUTES','Quality attributes must be an object');this.change(id,{facets:{...e.state.facets,[key]:copy(attributes)}},'qualified local frame observation');return key;}
 installOperators(){
  for(const name of ['bundle','sequence','resonate']){
   this.operators.set(name,new Automaton({id:'operator.'+name,address:{gate:16,line:1,color:1,tone:1,base:1},dimension:'Design',states:['ready','resolved'],q0:'ready',finals:['resolved'],implementation:(input,{emit})=>{
    const parts=input.entities;let result;
    if(name==='sequence')result={order:parts.map(e=>e.id),expression:parts.map(e=>e.label).join(' ')};
    else if(name==='bundle')result={parts:parts.map(e=>e.id),sharedFunctions:[...new Set(parts.flatMap(e=>e.functions))]};
    else{const product=ACTIVE.map(d=>parts.reduce((a,e)=>a*e.qualities[d],1));const strengths=product.map(x=>Math.pow(x,1/parts.length));result={relation:'co-active',intensity:strengths.reduce((a,b)=>a+b,0)/4,direction:ACTIVE[strengths.indexOf(Math.max(...strengths))],context:input.context};}
    emit({from:'ready',to:'resolved',transition:'flow',input:parts.map(e=>e.id)});return result;
   }}));
  }
 }
 registerAction(name,handler){if(typeof name!=='string'||typeof handler!=='function')fail('TOOL_REGISTRATION','Tool requires name and executable handler');this.operators.set('action.'+name,new Automaton({id:'action.'+name,address:{gate:16,line:1,color:1,tone:1,base:1},dimension:'Design',states:['ready','resolved'],q0:'ready',finals:['resolved'],implementation:(input,{emit})=>{const entity=input.entities[0];if(!entity?.functions.includes(name))fail('CAPABILITY_MISSING',`Entity cannot execute ${name}`);const result=handler(entity.id,input.context);emit({from:'ready',to:'resolved',transition:'flow',input:{entity:entity.id,capability:name}});return result;}}));}
 execute(name,ids,context={}){const op=this.operators.get(name);if(!op)fail('OPERATOR_UNKNOWN','Unknown operator: '+name);if(!ids.length)fail('OPERATOR_EMPTY','Operator requires operands');const entities=ids.map(id=>copy(this.require(id)));const result=op.run({entities,context:copy(context)});this.record('tool.executed',{operator:name,inputs:ids,context,output:result.output,trace:result.trace,ledger:result.ledger,contextHash:hash({entities,context,rule:VERSION})});return copy(result.output);}
 snapshot(){return {entities:[...this.entities.values()].map(copy),relations:[...this.relations.values()].map(copy),signals:copy(this.signals)};}
 export(){return {schema:VERSION,events:copy(this.events),stateHash:hash(this.snapshot())};}
 static replay(bundle){if(bundle?.schema!==VERSION||!Array.isArray(bundle.events)||bundle.events.length>50000)fail('REPLAY_SCHEMA','Unsupported replay schema or event budget');const s=new Substrate();for(const event of bundle.events){if(event.seq!==s.events.length+1||event.parent!==(s.events.length||null)||event.rule!==VERSION)fail('REPLAY_SEQUENCE','Event sequence or rule lineage is invalid');s.record(event.type,event.data);}if(hash(s.snapshot())!==bundle.stateHash)fail('REPLAY_HASH','Replay state does not match recorded state');return s;}
}
