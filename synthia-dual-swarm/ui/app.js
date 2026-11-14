import {proposeLocalProgram} from '../core/local-model.js';
import {LocalProduction} from '../core/production.js';
import {AutonomousSwarm} from '../core/autonomy.js';
import {primitiveSwarm} from '../core/primitives.js';
import {Substrate,gateBits} from '../core/substrate.js';
import {World,BRANCHES} from '../core/world.js';
import {DIMENSIONS,ACTIVE,VERSION,hash} from '../core/ontology.js';
import {SceneView} from './scene.js';
import {FunctionView} from './function-view.js';
import {mountSwarmInterface} from './interface.js';
import {DIMENSION_NAMES,QUALITY_CATALOG} from '../core/dimensional-frames.js';
import {learnImageField,registerImageField} from '../core/image-field.js';
import {AssemblyLearner} from '../core/assembly-learning.js';
import {exampleAddress} from '../core/ontology.js';
import {compileDiscourse} from '../core/grammar.js';
import {DimensionalWorld,JUT_TOPOLOGY,DIRECTIONAL_CLAIMS} from '../core/dimensional-world.js';
import {FieldView} from './field-view.js';
import {ExperienceSession} from '../core/experience.js';
import {ExperienceView} from './experience-view.js';
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
let core=new Substrate(),world=new World(core),selected='field.gate.11',mode='world',replayWorld=null,scene,fieldView,graph,experienceView,experienceSurface=true,busy=false,paused=false,sound=false,audio=null,queued=false,history=false,noticeTimer;
mountSwarmInterface(core,document.getElementById('swarm-blueprint'),document.getElementById('swarm-interface'));
new LocalProduction(new AutonomousSwarm(core));
primitiveSwarm(core);
new DimensionalWorld(core);
let baseline=core.events.length;
let learner=new AssemblyLearner();
let framePath=[],frameDimension='Movement';
const activeWorld=()=>replayWorld||world;
function notify(message){$('notice').textContent=message;$('notice').style.display='block';clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').style.display='none',4500);}
function guard(fn){try{return fn();}catch(e){console.error(e);notify((e.code?e.code+': ':'')+e.message);}}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}
function bind(){core.onChange(schedule);}
function renderLearning(){const w=activeWorld(),model=w.state.assemblyLearning,metrics=model?.metrics;$('learning-status').textContent=metrics?`${model.architecture?.nodes.length||10} cluster neurons · ${model.edges?.length||0} causal connections. Held-out cost ${metrics.before.cost.toFixed(3)} → ${metrics.after.cost.toFixed(3)}. ${metrics.runtimeExamples} live observations.`:'Local controller will learn coupling strengths from measured build trials.';$('train').disabled=busy||!!replayWorld;const host=$('learned-capabilities');host.replaceChildren();for(const e of w.core.entities.values()){if(e.id!=='capability.assembly'||!e.functions.includes('assemble'))continue;const button=el('button',e.label);button.dataset.swarmEntity=e.id;button.disabled=busy||!!replayWorld;button.onclick=()=>guard(()=>{const result=world.useTool(e.id,'assemble');scene?.applyLearner(result.weights);scene?.morph();});host.append(button);}}
async function trainAssembly(){if(busy||replayWorld)return;setBusy(true,'Learning from assembly trials…');await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));guard(()=>{learner=AssemblyLearner.fromRelations(core);const observations=core.events.filter(e=>e.type==='observation.recorded'&&e.data.kind==='assembly').map(e=>e.data);const metrics=learner.train(180,observations),state=learner.export();core.change('world',{assemblyLearning:state},'local backpropagation from assembly trials; held-out evaluation');if(metrics.improved&&!core.entities.has('capability.assembly')){core.compose({id:'capability.assembly',label:'Assemble with learned coupling',children:['perspective.Movement','perspective.Design','player'],operator:'bundle',address:exampleAddress(),functions:['assemble']});core.relate({source:'capability.assembly',target:'player',kind:'controls-assembly',projection:'causal',dimension:'Design',context:{evidence:metrics,source:'trained local controller'},transformation:'learn'});core.relate({source:'ui.train',target:'capability.assembly',kind:'exposes-capability',projection:'knowledge',dimension:'Movement',transformation:'compose-interface'});}scene?.applyLearner(state);scene?.morph();notify(`Assembly controller trained. Held-out cost improved ${Math.round((1-metrics.after.cost/metrics.before.cost)*100)}%.`);});setBusy(false);}
function setBusy(value,label='Walking…'){busy=value;$('busy').hidden=!value;$('busy').textContent=label;schedule();}
function tone(i){if(!sound)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain(),now=audio.currentTime;const e=activeWorld().core.entities.get('resonance.part.'+i);o.type='sine';o.frequency.value=[220,277.18,329.63][i]*(e?1+(e.address.tone-1)*.04:1);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.1,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+.7);o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+.75);}catch(e){notify('Sound unavailable: '+e.message);}}
async function playPhrase(){if(busy||replayWorld)return;if(paused){notify('Resume the world first.');return;}sound=true;$('sound').textContent='Sound on';$('sound').setAttribute('aria-pressed','true');setBusy(true,'Listen: low → high → middle');const indices=BRANCHES[0].sequence;for(const i of indices){tone(i);await new Promise(resolve=>setTimeout(resolve,650));}setBusy(false);}
function enterDoor(id){if(busy||replayWorld)return;if(paused){notify('Resume the world first.');return;}if(!world.state.profile){world.saveProfile($('goal').value,$('pace').value);}if(world.room!=='hub'){world.home();scene?.build(world,{animate:false});}selected='door.'+id;const i=BRANCHES.findIndex(b=>b.id===id);if(!scene||mode==='function'){world.useTool('door.'+id,'enter');schedule();return;}setBusy(true);scene.walkTo([(i-1)*3.5,0,-1.5],()=>{guard(()=>world.useTool('door.'+id,'enter'));setBusy(false);});}
function selectEntity(id){if(!activeWorld().core.entities.has(id))return;selected=id;scene?.highlight(id);if(id.startsWith('door.')&&activeWorld().room==='hub'&&!replayWorld&&mode==='embodied'){enterDoor(id.slice(5));return;}if(/^(resonance|structure|movement)\.part\./.test(id)&&!replayWorld&&mode==='embodied'){act(Number(id.split('.').at(-1)));return;}schedule();}
function act(index){if(busy||replayWorld)return;if(paused){notify('Resume the world first.');return;}if(world.room==='movement'&&!world.core.require('scene.movement').state.complete){if(world.core.require('movement.part.'+index).state.done)return;setBusy(true,'Walking to the car, then driving…');if(scene&&mode==='embodied'){scene.driveTo(index,()=>{guard(()=>{const result=world.useTool('movement.part.'+index,'deliver');scene.build(world,{animate:false});if(result.complete)notify('All deliveries completed. The journey is remembered.');});setBusy(false);});}else{world.useTool('movement.part.'+index,'deliver');setBusy(false);}return;}
 guard(()=>{const result=world.useTool(world.room+'.part.'+index,world.room==='resonance'?'play':'rotate');if(world.room==='resonance'){tone(index);if(result.correct===false)notify('A different phrase. Listen again; your attempt is retained.');}if(world.room==='structure')scene?.build(world,{animate:false});if(result.complete)notify('Activity complete. You can return and revisit it.');});schedule();}
function renderPaths(){const w=activeWorld(),box=$('paths');box.replaceChildren();for(const b of BRANCHES){const btn=el('button',undefined,'path');btn.type='button';btn.dataset.branch=b.id;btn.disabled=busy||!!replayWorld;const title=el('strong',b.label);title.style.color=b.color;title.append(el('span',w.state.completed.includes(b.id)?'Remembered':w.state.recommended===b.id?'Suggested':'Prepared','path-state'));btn.append(title,el('small',b.subtitle));btn.onclick=()=>guard(()=>enterDoor(b.id));box.append(btn);} $('home').hidden=w.room==='hub';$('home').disabled=busy||!!replayWorld;}
function renderActivity(){const w=activeWorld(),branch=BRANCHES.find(b=>b.id===w.room),box=$('activity-controls');box.replaceChildren();$('scene-kicker').textContent=branch?'SPACE / '+branch.label.toUpperCase():'SPACE / DISTRIBUTED EXPRESSION';$('scene-title').textContent=branch?branch.label+' takes form.':'Five perspectives. One swarm.';
 if(!branch){$('activity-title').textContent='Build, observe, adapt';$('activity-description').textContent='Morph the real body, learn assembly coupling, or learn visual regions from an image. World activities are test cases.';return;}
 const s=w.core.require('scene.'+branch.id).state;$('activity-title').textContent=s.complete?'A moment becomes memory.':branch.activity;$('activity-description').textContent=s.complete?'Your activity is retained. Return to the room and choose another path.':branch.description;
 if(branch.id==='resonance'){const listen=el('button','Listen to phrase');listen.id='listen';listen.onclick=playPhrase;listen.disabled=busy||!!replayWorld;box.append(listen);}
 for(let i=0;i<3;i++){const p=w.core.require(branch.id+'.part.'+i),btn=el('button',branch.id==='resonance'?['Low','Middle','High'][i]:branch.id==='structure'?'Rotate span '+(i+1):p.state.done?'Delivered '+(i+1):'Drive to stop '+(i+1));btn.dataset.action=String(i);btn.disabled=busy||!!replayWorld||s.complete||(branch.id==='movement'&&p.state.done);btn.onclick=()=>act(i);box.append(btn);}
}
function renderInspector(){const c=activeWorld().core;if(!c.entities.has(selected))selected='companion';const entity=c.require(selected),select=$('entity-select');select.replaceChildren();for(const e of c.entities.values()){if(e.id.startsWith('ui.')&&e.id!=='ui.root'&&e.id!=='ui.train')continue;const option=el('option',e.label);option.value=e.id;option.selected=e.id===selected;select.append(option);}const depth=c.depth(selected);$('entity-kind').textContent=entity.kind+' · '+entity.dimension+' identity · '+(entity.frame?c.require(entity.frame).label:'root frame')+(depth?' · depth '+depth:'');
 const panel=$('dimensions');panel.replaceChildren();for(const [d,meta] of Object.entries(DIMENSIONS)){const row=el('div',undefined,'dimension'),head=el('div',undefined,'dimension-head'),label=el('label',d),small=el('small',meta.question+' / '+meta.term);label.style.color=meta.color;head.append(label,small);row.append(head);if(d==='Space'){const bar=el('div',undefined,'derived'),fill=el('span');fill.style.width=c.expression(selected).coherence*100+'%';bar.append(fill);row.append(bar);}else{const range=el('input');range.type='range';range.min=0;range.max=100;range.value=entity.qualities[d]*100;range.id='quality-'+d;range.setAttribute('aria-label',d+' quality');label.htmlFor=range.id;range.disabled=!!replayWorld;range.onchange=()=>guard(()=>{c.qualities(selected,{...c.require(selected).qualities,[d]:Number(range.value)/100});});row.append(range);}panel.append(row);}
 const frame=c.dimensionalViews(selected,framePath),matrixBox=$('dimension-matrix');matrixBox.replaceChildren();const trail=el('p',framePath.length?framePath.map(s=>s.dimension+' / '+s.quality).join(' → '):'Root frame · '+entity.label,'frame-path');matrixBox.append(trail);const lenses=el('div',undefined,'frame-lenses');for(const d of DIMENSION_NAMES){const btn=el('button',d);btn.setAttribute('aria-pressed',String(frameDimension===d));btn.onclick=()=>{frameDimension=d;schedule();};lenses.append(btn);}matrixBox.append(lenses);for(const facet of frame.views[frameDimension].qualities){const btn=el('button',facet.quality+' → all five dimensions','facet-button');btn.onclick=()=>{if(framePath.length>=32){notify('This workbench resolves up to 32 nested frames.');return;}framePath=[...framePath,{dimension:frameDimension,quality:facet.quality}];schedule();};matrixBox.append(btn);}if(framePath.length){const up=el('button','Up one frame');up.onclick=()=>{framePath=framePath.slice(0,-1);schedule();};matrixBox.append(up);}matrixBox.append(el('p','Each quality retains its source relations and opens a local frame containing all five dimensions. Simulation weights are separate.','small-note'));const a=entity.address;$('address').textContent=`G${a.gate} · L${a.line} · C${a.color} · T${a.tone} · B${a.base}\n${a.degree}° ${a.minute}′ ${a.second}″ .${String(a.arc).padStart(2,'0')}\nExample / ${a.filter}`;$('address').style.whiteSpace='pre-line';$('hexagram').replaceChildren();for(const bit of gateBits(a.gate)){const line=el('div',undefined,'yao');line.append(el('span'));if(!bit)line.append(el('span'));$('hexagram').append(line);}
 $('history-panel').replaceChildren();const children=entity.children.map(id=>c.require(id).label);if(children.length){const line=el('div',undefined,'history-entry');line.append(el('strong','Composed from'),el('p',children.join(' → ')));$('history-panel').append(line);}for(const h of [...entity.history].reverse()){const line=el('div',undefined,'history-entry');line.append(el('strong','Event '+h.seq),el('p',h.frame?'Frame: '+c.require(h.frame).label+' / '+h.placement:h.reason||JSON.stringify(h.patch||h.qualities||h)));$('history-panel').append(line);}const relations=[...c.relations.values()].filter(r=>r.source===selected||r.target===selected);$('capabilities').textContent=(entity.functions.join(' · ')||'Composition / relation')+' · '+relations.length+' relations';$('resonate').disabled=!!replayWorld;$('change-line').disabled=!!replayWorld;
}
function renderLedger(){const c=activeWorld().core;$('event-count').textContent=c.events.length+' recorded events';const box=$('events');box.replaceChildren();for(const event of c.events.slice(-60).reverse()){const li=el('li');li.append(el('span',String(event.seq).padStart(3,'0')),el('code',event.type),el('span',event.data.label||event.data.reason||event.data.operator||event.data.id||event.data.kind||event.data.relation||''));box.append(li);}const range=$('replay');range.min=baseline;range.max=core.events.length;if(!replayWorld)range.value=core.events.length;$('replay-position').textContent=replayWorld?'Event '+replayWorld.core.events.length:'Live';}
function render(){const w=activeWorld();renderAutonomy();renderPrimitiveAutonomy();renderProduction();renderLearning();renderPaths();renderActivity();renderInspector();renderLedger();if(scene&&scene.room!==w.room)scene.build(w);const imageId=w.state.activeImage;if(imageId&&scene&&scene.imageFieldId!==imageId)scene.showImageField(w.core.require(imageId).state.field,imageId);const model=w.state.assemblyLearning;if(model)scene?.applyLearner(model);scene?.applyQualities(w);graph?.draw(w.core,selected);scene?.highlight(selected);renderField();$('clear-image').hidden=!imageId;$('onboarding').querySelectorAll('input,textarea,select,button').forEach(x=>x.disabled=!!replayWorld||busy);$('world-status').textContent=replayWorld?'Recorded state · read only':busy?'Swarm resolving':w.core.entities.size+' addressed entities · shared interface and embodiment';
 const branch=BRANCHES.find(b=>b.id===w.room);$('companion-text').textContent=replayWorld?'We’re viewing an earlier state. Return to live to continue.':branch?(w.core.require('scene.'+branch.id).state.complete?'We’ll carry this experience into the next room.':branch.description):w.state.profile?'The three recipes are prepared. Your choices stay open.':'Choose a goal. I’ll prepare the room while you explore.';
}
function download(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
function switchView(next){mode=next;document.body.dataset.view=next;$('field-canvas').hidden=next!=='world'||!experienceSurface;$('world-tab').setAttribute('aria-selected',String(next==='world'));fieldView?.fit();if(next==='world'&&core.entities.has('field'))renderField();$('world-canvas').hidden=next!=='embodied';$('function-canvas').hidden=next!=='function';$('embodied-tab').setAttribute('aria-selected',String(next==='embodied'));$('function-tab').setAttribute('aria-selected',String(next==='function'));scene?.fit();graph?.draw(activeWorld().core,selected);}
$('onboarding').onsubmit=e=>{e.preventDefault();guard(()=>{world.saveProfile($('goal').value,$('pace').value);});trainAssembly();};
$('train').onclick=trainAssembly;
$('fixtures').ontoggle=()=>{if(replayWorld||busy)return;core.change('world',{fixtureRoom:$('fixtures').open},'world fixture visibility');if(world.room==='hub'){scene?.build(world);if($('fixtures').open)scene?.fit();}};
$('morph').onclick=()=>guard(()=>{if(replayWorld)return;selected='player';scene?.morph();schedule();});
$('morph-page').onclick=()=>guard(()=>{if(replayWorld||busy)return;const nodes=[...document.querySelectorAll('[data-swarm-entity]')].filter(node=>['BUTTON','LABEL','H1','H2','H3','P','INPUT','SELECT','TEXTAREA'].includes(node.tagName)&&core.entities.has(node.dataset.swarmEntity)),q=core.require('player').qualities,coupling=learner.predict(q,1,.5);let count=0;for(const node of nodes){const id=node.dataset.swarmEntity,e=core.require(id);if(!e.functions.includes('morph-object'))continue;const seed=parseInt(hash(id),16),x=(seed%17-8)*(1-coupling),y=((seed>>>5)%13-6)*(1-coupling);node.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${x}px,${y}px)`,opacity:.55},{transform:'translate(0,0)',opacity:1}],{duration:700+coupling*500,easing:'ease-in-out'});count++;}core.record('observation.recorded',{kind:'interface-assembly',objects:count,controller:'local learned coupling',coupling});});
$('learn-image').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(replayWorld||busy){notify('Return to live and finish the current operation first.');return;}let url;try{setBusy(true,'Learning visual regions…');url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();const ratio=Math.min(1,48/Math.max(image.naturalWidth,image.naturalHeight)),width=Math.max(1,Math.round(image.naturalWidth*ratio)),height=Math.max(1,Math.round(image.naturalHeight*ratio)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,width,height);const field=learnImageField(width,height,ctx.getImageData(0,0,width,height).data),id='image.'+(core.events.length+1);registerImageField(core,field,id);core.change('world',{activeImage:id},'image field assembled from observed pixels');world.movePlayer([-2.8,0,2]);scene?.player.root.position.set(-2.8,0,2);selected=id;$('image-learning-status').textContent=`${field.samples.length} qualified samples; clustering loss ${field.metrics.before.toFixed(3)} → ${field.metrics.after.toFixed(3)}. No depth inferred.`;core.relate({source:'ui.learn-image',target:id,kind:'learns-from',projection:'causal',dimension:'Being',context:{fileName:file.name},transformation:'image-clustering'});schedule();}catch(error){notify('Image learning failed: '+error.message);}finally{if(url)URL.revokeObjectURL(url);setBusy(false);e.target.value='';}};
$('clear-image').onclick=()=>{if(replayWorld)return;core.change('world',{activeImage:null},'returned to body assembly');scene?.build(world);scene?.fit();};
$('home').onclick=()=>guard(()=>{if(!busy&&!replayWorld){world.home();selected='companion';scene?.build(world);}});
$('entity-select').onchange=e=>{selected=e.target.value;scene?.highlight(selected);schedule();};
$('world-tab').onclick=()=>switchView('world');$('embodied-tab').onclick=()=>switchView('embodied');$('function-tab').onclick=()=>switchView('function');
$('qualities-tab').onclick=()=>{history=false;$('quality-panel').hidden=false;$('history-panel').hidden=true;$('qualities-tab').setAttribute('aria-pressed','true');$('history-tab').setAttribute('aria-pressed','false');};
$('history-tab').onclick=()=>{history=true;$('quality-panel').hidden=true;$('history-panel').hidden=false;$('qualities-tab').setAttribute('aria-pressed','false');$('history-tab').setAttribute('aria-pressed','true');};
$('change-line').onclick=()=>guard(()=>{if(!replayWorld){core.changeLine(selected,Number($('line').value));notify('One line changed. The previous gate remains in history.');}});
$('resonate').onclick=()=>guard(()=>{if(replayWorld)return;const ids=selected==='companion'?['companion','player']:[selected,'companion'];const result=core.execute('resonate',ids,{room:world.room,goal:world.state.profile?.goal||'',rule:'co-active/v1'});const relation=core.relate({source:ids[0],target:ids[1],kind:result.relation,projection:'phase',dimension:result.direction,context:{intensity:result.intensity},transformation:'resonate'});core.signal(relation.id,result.intensity);$('operator-result').textContent=`Resolved ${result.relation}: ${result.direction}, intensity ${result.intensity.toFixed(3)}. Packet delivered; crossing retained.`;});
$('pause').onclick=()=>{paused=!paused;scene?.setPaused(paused);$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused));if(fieldView)fieldView.paused=paused;};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));if(sound)tone(0);};
$('save').onclick=()=>guard(()=>{if(replayWorld){notify('Return to live before saving.');return;}localStorage.setItem('synthia.dual.v1',JSON.stringify(core.export()));notify('Journey saved on this browser.');});
$('export').onclick=()=>download('synthia-journey.json',activeWorld().core.export());
$('unity-export').onclick=()=>{const c=activeWorld().core;download('synthia-scene-contract.json',{schema:'synthia.scene.v1',units:'meters',coordinateSystem:'right-handed-y-up',sourceSchema:VERSION,entities:[...c.entities.values()].map(e=>({id:e.id,address:e.address,identityDimension:e.dimension,frame:e.frame,placement:e.placement,qualities:e.qualities,expression:c.expression(e.id),functions:e.functions,embodied:e.embodied,state:e.state,children:e.children})),relations:[...c.relations.values()],eventSequence:c.events.length});};
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(busy)throw Error('Finish the current movement before importing.');if(file.size>8*1024*1024)throw Error('Journey exceeds the 8 MB import limit.');const candidate=Substrate.replay(JSON.parse(await file.text()));for(const id of ['world','player','companion',...BRANCHES.map(b=>'door.'+b.id)])candidate.require(id);const next=new World(candidate);if(next.room!=='hub')candidate.require('scene.'+next.room);core=candidate;world=next;primitiveSwarm(core).control(false);new DimensionalWorld(core).control(false);replayWorld=null;selected='companion';bind();scene?.build(world);schedule();notify('Journey restored and replay verified.');}catch(error){notify('Import rejected: '+error.message);}e.target.value='';};
$('replay').oninput=e=>guard(()=>{if(busy){notify('Finish the current movement before replaying.');e.target.value=core.events.length;return;}const count=Number(e.target.value);if(count===core.events.length){replayWorld=null;}else{const c=new Substrate();for(const event of core.events.slice(0,count))c.record(event.type,event.data);replayWorld=new World(c);}scene?.build(activeWorld(),{animate:false});schedule();});
$('live').onclick=()=>{replayWorld=null;scene?.build(world,{animate:false});schedule();};
$('compile').onclick=()=>guard(()=>{if(replayWorld||busy){notify('Return to live and finish the current movement first.');return;}const result=compileDiscourse(core,$('discourse').value);selected=result.ids.at(-1)||'companion';$('compile-result').textContent=`${result.ids.length} declarations composed; ${result.events} events retained.`;switchView('function');schedule();});
window.addEventListener('resize',()=>graph?.draw(activeWorld().core,selected));
bind();
try{const saved=localStorage.getItem('synthia.dual.v1');if(saved){const c=Substrate.replay(JSON.parse(saved));c.require('player');c.require('companion');core=c;world=new World(core);primitiveSwarm(core).control(false);new DimensionalWorld(core).control(false);bind();if(world.state.profile){$('goal').value=world.state.profile.goal;$('pace').value=world.state.profile.pace;}}}catch(e){notify('Saved journey could not be restored: '+e.message);}
try{scene=new SceneView($('world-canvas'),{onSelect:selectEntity,onError:e=>notify('Character asset could not load: '+e.message),onPopulation:population=>{if(!replayWorld)core.change('player',{population},'surface particles registered with inherited addresses and local relations');},onBuildOutcome:outcome=>{if(!replayWorld)core.record('observation.recorded',outcome);},onArrive:(p,vehicle)=>{if(!replayWorld)world.movePlayer(p,vehicle);}});scene.build(world,{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});}catch(e){console.error(e);$('webgl-error').hidden=false;$('webgl-error').textContent='3D rendering unavailable. The Function view and labeled activity controls remain available. '+e.message;}
experienceView=new ExperienceView($('experience-host'),{onSurface:visible=>{experienceSurface=visible;document.body.dataset.experienceSurface=String(visible);$('field-canvas').hidden=mode!=='world'||!visible;if(!visible)fieldView?.clear();}});
try{fieldView=new FieldView($('field-canvas'),selectEntity);}catch(e){console.error(e);notify('World renderer unavailable: '+e.message);switchView('function');}graph=new FunctionView($('function-canvas'),selectEntity);render();switchView(mode);
// Read-only diagnostics for browser verification; mutations go through the public UI.
window.synthia={getState:()=>activeWorld().core.snapshot(),getExport:()=>activeWorld().core.export(),getStatus:()=>({morphPhase:scene?.morphPhase,humanReady:!!scene?.human,wolfReady:!!scene?.wolf,avatarError:scene?.avatarError,humanBones:scene?.human?.boneCount,humanAnimations:scene?.human?Object.keys(scene.human.actions):[],room:activeWorld().room,busy,paused,replay:!!replayWorld,mode,webgl:!!scene,fieldReady:!!fieldView,fieldObjects:fieldView?.nodes.size,worldTick:activeWorld().core.entities.get('field')?.state.tick}),verifyReplay:()=>hash(Substrate.replay(core.export()).snapshot())===hash(core.snapshot())};

// A fixed, bounded simulation tick; never catches up hidden-tab wall time.
function renderAutonomy(){const c=activeWorld().core;if(!c.entities.has('autonomy'))return;const r=new AutonomousSwarm(c),s=r.state;$('autonomy-status').textContent=`Tick ${s.tick}/${s.budget} · structures ${r.structures().filter(e=>e.state.health>=e.state.required).length}/${r.structures().length} · ${s.summary}`;$('autonomy-toggle').textContent=s.running?'Pause agents':'Start agents';for(const id of ['autonomy-toggle','autonomy-step','autonomy-morph','autonomy-save','autonomy-restore','swarm-config','swarm-config-undo'])$(id).disabled=!!replayWorld||busy;$('autonomy-morph').checked=s.permissions.morph;const host=$('autonomy-agents');host.replaceChildren();for(const a of r.agents()){const item=el('p',`${a.label} · ${a.state.goal} · ${a.state.tool} · energy ${a.state.energy??40} · parts ${a.state.inventory} · ${a.state.lastAction}`,'small-note');item.dataset.swarmEntity=a.id;host.append(item);}}
$('autonomy-toggle').onclick=()=>guard(()=>{if(replayWorld||busy)return;const r=new AutonomousSwarm(core);r.control(!r.state.running);schedule();});
$('autonomy-step').onclick=()=>guard(()=>{if(replayWorld||busy||paused)return;const r=new AutonomousSwarm(core);r.control(true);r.step();r.control(false);schedule();});
$('autonomy-morph').onchange=e=>guard(()=>{if(!replayWorld&&!busy)new AutonomousSwarm(core).setPermission('morph',e.target.checked);});
$('autonomy-save').onclick=()=>guard(()=>{if(replayWorld||busy)return;const r=new AutonomousSwarm(core);r.control(false);localStorage.setItem('synthia.autonomy.checkpoint',JSON.stringify(r.checkpoint()));notify('Checkpoint saved, including policies, resources and history.');});
$('autonomy-restore').onclick=()=>guard(()=>{if(replayWorld||busy)return;const raw=localStorage.getItem('synthia.autonomy.checkpoint')||localStorage.getItem('synthia.autonomy.autosave');if(!raw)throw Error('Save a checkpoint first.');const restored=AutonomousSwarm.restore(JSON.parse(raw));core=restored.core;world=new World(core);selected='autonomy';bind();scene?.build(world,{animate:false});schedule();notify('Checkpoint restored. Agents are paused.');});
setInterval(()=>guard(()=>{if(replayWorld||busy||paused||document.hidden)return;const r=new AutonomousSwarm(core);if(!r.state.running)return;r.step();if(!r.state.running)localStorage.setItem('synthia.autonomy.autosave',JSON.stringify(r.checkpoint()));}),750);
renderAutonomy();

function production(){return new LocalProduction(new AutonomousSwarm(core));}
function renderProduction(){
 const c=activeWorld().core;
 if(!c.entities.has('production')){if(scene)scene.production=null;return;}
 const p=new LocalProduction(new AutonomousSwarm(c));if(scene)scene.production=p;
 $('production-status').textContent=`${p.clusters().length} relationship clusters · ${p.state.tools.length} retained functions · ${p.state.attempts.length} trials · ${(p.state.tasks||[]).filter(t=>['queued','blocked'].includes(t.status)).length} unmet demands${p.state.tasks?.length?' · '+p.state.tasks.at(-1).status:''}`;
 const select=$('production-tool'),previous=select.value;select.replaceChildren();
 for(const tool of p.state.tools){const option=el('option',tool.program.map(s=>s.op+(s.value===undefined?'':' '+s.value)).join(' → '));option.value=tool.id;select.append(option);}if(p.state.tools.some(t=>t.id===previous))select.value=previous;
 for(const id of ['production-learn','production-local','production-apply','production-release','production-code','production-image','production-video'])$(id).disabled=!!replayWorld||busy;
}
function downloadLocal(blob,name){const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('production-learn').onclick=()=>guard(()=>{
 if(replayWorld||busy)return;
 const id=production().request({samples:JSON.parse($('production-samples').value),target:$('production-target').value});
 new AutonomousSwarm(core).control(true);notify('Function demand queued. Agents will coordinate and test available combinations.');schedule();
});
$('production-apply').onclick=()=>guard(()=>{if(!replayWorld&&!busy){production().bind($('production-tool').value,$('production-target').value);schedule();}});
$('production-release').onclick=()=>guard(()=>{if(!replayWorld&&!busy)production().unbind($('production-target').value);});
$('production-code').onclick=()=>guard(()=>{if(replayWorld||busy)return;const result=production().exportTool($('production-tool').value);downloadLocal(new Blob([result.source],{type:'text/javascript'}),'synthia-transform.mjs');downloadLocal(new Blob([JSON.stringify(result.manifest,null,2)],{type:'application/json'}),'synthia-transform-evidence.json');});
$('production-image').onclick=()=>guard(()=>{
 if(replayWorld||busy)return;if(!scene)throw Error('3D rendering is unavailable');
 scene.renderer.render(scene.scene,scene.camera);
 scene.canvas.toBlob(blob=>{if(blob)downloadLocal(blob,'synthia-scene.png');else notify('Scene capture failed');},'image/png');
});
$('production-video').onclick=()=>guard(()=>{
 if(replayWorld||busy)return;
 if(!scene||!scene.canvas.captureStream||!window.MediaRecorder)throw Error('Video recording is unavailable in this browser');
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime)throw Error('No supported video encoder');
 const output=document.createElement('canvas');output.width=960;output.height=540;const ctx=output.getContext('2d');let track;
 const capture=()=>{scene.renderer.render(scene.scene,scene.camera);ctx.fillStyle='#0d1720';ctx.fillRect(0,0,960,540);const scale=Math.min(960/scene.canvas.width,540/scene.canvas.height),w=scene.canvas.width*scale,h=scene.canvas.height*scale;ctx.drawImage(scene.canvas,(960-w)/2,(540-h)/2,w,h);track?.requestFrame?.();};
 capture();const stream=output.captureStream(0);track=stream.getVideoTracks()[0];if(!track.requestFrame){stream.getTracks().forEach(t=>t.stop());throw Error('Manual canvas video capture is unavailable in this browser');}let recorder;try{recorder=new MediaRecorder(stream,{mimeType:mime});}catch(error){stream.getTracks().forEach(t=>t.stop());throw error;}const chunks=[];let timer,frames,flush,encoding=false;
 const cleanup=()=>{clearTimeout(timer);clearTimeout(flush);clearInterval(frames);stream.getTracks().forEach(track=>track.stop());setBusy(false);};
 recorder.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);if(!encoding){encoding=true;clearTimeout(timer);timer=setTimeout(()=>{clearInterval(frames);capture();flush=setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},200);},5000);}}};
 recorder.onerror=()=>{cleanup();notify('Video recording failed');};
 recorder.onstop=()=>{cleanup();if(chunks.length)downloadLocal(new Blob(chunks,{type:mime}),'synthia-scene.'+(mime.startsWith('video/mp4')?'mp4':'webm'));};
 try{recorder.start(100);frames=setInterval(capture,100);setBusy(true,'Recording local scene…');timer=setTimeout(()=>{if(!encoding){recorder.stop();notify('Video encoder did not produce frames');}},15000);}catch(error){cleanup();throw error;}
});
renderProduction();

$('production-local').onclick=async()=>{
 if(replayWorld||busy)return;
 try{
  const samples=JSON.parse($('production-samples').value);production().validateSamples(samples);
  const provider=$('production-provider').value,model=$('production-model').value.trim();
  setBusy(true,'Asking your local coding model…');
  const program=await proposeLocalProgram(samples,{provider,model});
  production().request({samples,target:$('production-target').value,proposals:[program]});
  new AutonomousSwarm(core).control(true);notify('Local model proposal queued for cluster capability checks and held-out testing.');
 }catch(error){notify(error.message);}finally{setBusy(false);}
};

$('swarm-config').onchange=async event=>{
 const input=event.target,file=input.files[0];if(!file||replayWorld||busy)return;
 try{
  if(file.size>65536)throw Error('World configuration must be at most 64 KB');
  const config=JSON.parse(await file.text()),candidate=new Substrate();new World(candidate);
  new LocalProduction(new AutonomousSwarm(candidate,config));
  localStorage.setItem('synthia.autonomy.previous-world',JSON.stringify(new AutonomousSwarm(core).checkpoint()));
  core=candidate;world=new World(core);baseline=core.events.length;selected='autonomy';bind();scene?.build(world,{animate:false});schedule();notify('World conditions loaded. Agents are paused. Previous world retained.');
 }catch(error){notify(error.message);}finally{input.value='';}
};
$('swarm-config-undo').onclick=()=>guard(()=>{
 if(replayWorld||busy)return;const raw=localStorage.getItem('synthia.autonomy.previous-world');if(!raw)throw Error('No previous world configuration');
 const restored=AutonomousSwarm.restore(JSON.parse(raw));core=restored.core;world=new World(core);baseline=Math.min(baseline,core.events.length);selected='autonomy';bind();scene?.build(world,{animate:false});schedule();
});

// Search is bounded and supervised. All registrations are pure local functions.
function renderPrimitiveAutonomy(){const c=activeWorld().core,s=c.entities.get('primitive.swarm')?.state;if(!s)return;
 $('primitive-status').textContent=`${s.status} · ${s.executions}/${s.limits.maxAttempts} executions · ${s.tokens.length} values · ${s.clusters.length} learned clusters`;
 $('primitive-toggle').textContent=s.running?'Pause composition':'Resume composition';
 for(const id of ['primitive-toggle','primitive-step','primitive-save','primitive-restore'])$(id).disabled=!!replayWorld||busy;
 const host=$('primitive-agents');host.replaceChildren();for(const id of s.clusters){const item=el('button',c.require(id).label);item.onclick=()=>{selectEntity(id);switchView('function');};host.append(item);}
}
$('primitive-toggle').onclick=()=>guard(()=>{if(replayWorld||busy)return;const r=primitiveSwarm(core);r.control(!r.state.running);});
$('primitive-step').onclick=()=>guard(()=>{if(replayWorld||busy||paused)return;const r=primitiveSwarm(core);r.control(true);r.step();r.control(false);new ExperienceSession(core).synchronize();});
$('primitive-save').onclick=()=>guard(()=>{if(replayWorld||busy)return;primitiveSwarm(core).control(false);localStorage.setItem('synthia.primitive.checkpoint',JSON.stringify(core.export()));notify('Checkpoint saved with observations, executable graphs, feedback and history.');});
$('primitive-restore').onclick=()=>guard(()=>{if(replayWorld||busy)return;const raw=localStorage.getItem('synthia.primitive.checkpoint');if(!raw)throw Error('Save a checkpoint first.');core=Substrate.replay(JSON.parse(raw));primitiveSwarm(core).control(false);world=new World(core);selected='primitive.swarm';bind();scene?.build(world,{animate:false});schedule();notify('Checkpoint restored. Composition is paused.');});
setInterval(()=>guard(()=>{if(replayWorld||busy||paused||document.hidden)return;const r=primitiveSwarm(core);if(!r.state.running)return;r.step();new ExperienceSession(core).synchronize();}),150);

function renderField(){
 experienceView?.update(activeWorld().core,!!replayWorld);
 const c=activeWorld().core;if(!c.entities.has('field')){$('field-status').textContent='This recording predates the relational world. Return to live.';return;}
 const r=new DimensionalWorld(c);if(experienceSurface)fieldView?.update(r,selected);$('experience-start').disabled=!!replayWorld||busy;$('experience-request').querySelectorAll('input,button').forEach(n=>n.disabled=!!replayWorld||busy);
 const tabs=$('field-dimensions');tabs.replaceChildren();
 for(const d of DIMENSION_NAMES){const b=el('button',d);b.style.setProperty('--dimension-color',DIMENSIONS[d].color);b.setAttribute('aria-pressed',String(r.state.view===d));b.disabled=!!replayWorld;b.onclick=()=>guard(()=>r.view(d));tabs.append(b);}
 $('field-run').textContent=c.entities.get('primitive.swarm')?.state.running?'Pause composition':'Resume composition';
 for(const id of ['field-run','field-step','field-signal','field-activate','field-enter','field-up','field-analyze'])$(id).disabled=!!replayWorld||busy;
 const chosen=c.entities.get(selected),isGate=chosen?.state.scale==='gate';
 $('field-signal').disabled||=!isGate;$('field-activate').disabled||=!isGate;$('field-analyze').disabled||=!selected.startsWith('field.gate.');
 $('field-enter').disabled||=!selected.startsWith('field.gate.')||chosen?.state.scale==='base';
 $('field-up').disabled||=r.state.focus==='field';
 $('field-status').textContent=`${r.state.summary} · ${c.entities.get('primitive.swarm')?.state.status||'waiting'} composition`;
 $('field-selection').textContent=`${r.state.view}: ${DIMENSIONS[r.state.view].nature} / ${DIMENSIONS[r.state.view].question} · ${chosen?.label||'Select a constituent'} · Frame: ${c.require(r.state.focus).label}`;
 $('field-analysis').textContent=chosen?.state.analysis?`${chosen.state.analysis.tool} · addressed constituent analysis retained`:'Select a constituent to analyze its actual address and composition.';
 const edges=$('field-edges');edges.replaceChildren();
 for(const edge of JUT_TOPOLOGY.relations){const label=el('label'),input=el('input');input.type='checkbox';input.checked=r.state.openEdges.includes(edge.id);input.disabled=!!replayWorld;input.onchange=()=>guard(()=>r.setEdge(edge.id,input.checked));label.append(input,document.createTextNode(` ${edge.label}: ${edge.from} ↔ ${edge.to}`));edges.append(label);}
 if(mode==='world'){$('scene-kicker').textContent=r.state.view.toUpperCase()+' / '+DIMENSIONS[r.state.view].nature.toUpperCase();$('scene-title').textContent=c.require(r.state.focus).label;}
}
$('context-toggle').onclick=()=>{const panel=document.querySelector('.journey');panel.classList.toggle('open');$('context-toggle').setAttribute('aria-expanded',String(panel.classList.contains('open')));};
$('inspector-toggle').onclick=()=>{const panel=document.querySelector('.inspector');panel.classList.toggle('open');$('inspector-toggle').setAttribute('aria-expanded',String(panel.classList.contains('open')));};
$('field-run').onclick=()=>guard(()=>{if(replayWorld||busy)return;const r=primitiveSwarm(core);r.control(!r.state.running);});
$('field-step').onclick=()=>guard(()=>{if(replayWorld||busy||paused)return;const r=primitiveSwarm(core);r.control(true);r.step();r.control(false);new ExperienceSession(core).synchronize();});
$('field-signal').onclick=()=>guard(()=>{if(replayWorld)return;const e=core.require(selected);primitiveSwarm(core).observe([{id:'selected',type:'bits',value:gateBits(e.address.gate)}]);notify('Selected Boolean vector observed. Supply an output contract to compose.');});
$('field-activate').onclick=()=>guard(()=>{if(!replayWorld)new DimensionalWorld(core).toggle(selected);});
$('field-enter').onclick=()=>guard(()=>{if(!replayWorld)new DimensionalWorld(core).focus(selected);});
$('field-up').onclick=()=>guard(()=>{if(replayWorld)return;const r=new DimensionalWorld(core),current=core.require(r.state.focus);r.focus(current.frame?.startsWith('field')?current.frame:'field');});
$('field-reset-camera').onclick=()=>fieldView?.reset();
$('field-analyze').onclick=async()=>{try{if(replayWorld||busy)return;setBusy(true,'Analyzing addressed constituents…');await new DimensionalWorld(core).analyze(selected);}catch(e){notify(e.message);}finally{setBusy(false);}};


$('ato-compose').onclick=()=>guard(()=>{if(replayWorld||busy)return;const r=new DimensionalWorld(core),result=r.composeAnalogy($('ato-a').value,$('ato-b').value,$('ato-c').value);selected=result.id;$('ato-result').textContent='D = '+result.result.join('')+' · ATO = '+result.relation.join('');r.focus('field');switchView('world');schedule();});

$('experience-start').onclick=()=>guard(()=>{if(replayWorld||busy)return;const e=core.require(selected),items=[e,...e.children.map(id=>core.require(id))].map(x=>({id:x.id,label:x.label,dimension:x.dimension}));
 experienceView.show(true);const goal=JSON.parse($('experience-instruction').value||'{"type":"artifact"}');
 new ExperienceSession(core).start({subject:e.label,objective:$('goal').value||'Inspect the selected composition',information:items},$('primitive-inputs').value.trim()?JSON.parse($('primitive-inputs').value):[
 {id:'selection',type:'records',value:items},{id:'template',type:'template',value:{tag:'p',text:'{label} · {dimension}'}},
 {id:'layout',type:'layout',value:{axis:'row',columns:1}}
 ],goal);switchView('world');schedule();});
$('experience-request').onsubmit=e=>{e.preventDefault();guard(()=>{if(replayWorld||busy)return;const result=new ExperienceSession(core).request($('experience-instruction').value);$('experience-response').textContent=result.accepted?'Searching compatible primitive compositions; purpose and progress retained.':result.reason;if(result.accepted){experienceView.show(true);switchView('world');schedule();}});};

$('experience-close').onclick=()=>{experienceView.show(false);switchView('world');schedule();};
