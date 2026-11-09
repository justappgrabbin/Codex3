import * as T from '../vendor/three/three.module.js';
import {BRANCHES} from '../core/world.js';
import {loadAvatar,sampleBody} from './avatars.js';
import {AssemblyLearner,assemblyFeatures} from '../core/assembly-learning.js';
const color=c=>new T.Color(c);
export class SceneView{
 constructor(canvas,{onSelect,onArrive,onError,onBuildOutcome,onPopulation}){
  this.canvas=canvas;this.onSelect=onSelect;this.onArrive=onArrive;this.onError=onError;this.onBuildOutcome=onBuildOutcome;this.onPopulation=onPopulation;this.clock=0;this.paused=false;this.motion=null;this.room='';this.selected=null;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.scene=new T.Scene();this.scene.background=color('#0d1720');this.scene.fog=new T.Fog('#0d1720',20,38);this.camera=new T.PerspectiveCamera(42,1,.1,70);this.camera.position.set(0,7.4,13);this.camera.lookAt(0,.7,-.5);
  this.scene.add(new T.HemisphereLight('#d7ebed','#243138',2.4));const sun=new T.DirectionalLight('#fff0d7',3.5);sun.position.set(-4,9,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;this.scene.add(sun);
  this.content=new T.Group();this.scene.add(this.content);this.ray=new T.Raycaster();this.pointer=new T.Vector2();this.targets=[];this.materials=[];
  this.player={root:new T.Group(),limbs:[],body:new T.Group()};this.player.root.userData.entity='player';this.scene.add(this.player.root);this.player.root.position.set(0,0,3);
  this.companion=new T.Group();this.companion.userData.entity='companion';this.scene.add(this.companion);this.learner=new AssemblyLearner();this.morphStart=-100;this.avatarError=null;this.loadBodies();
  this.canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.targets,true)[0];if(hit){let o=hit.object;while(o&&!o.userData.entity)o=o.parent;if(o)this.onSelect(o.userData.entity);}});
  this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(canvas);this.fit();this.last=performance.now();this.raf=requestAnimationFrame(t=>this.frame(t));
 }
 async loadBodies(){try{this.human=await loadAvatar('human',1.9);this.player.root.add(this.human.model);this.bodySamples=sampleBody(this.human,1400);const g=new T.BufferGeometry(),a=new Float32Array(this.bodySamples.length*3),colors=new Float32Array(a.length);this.bodySamples.forEach((s,i)=>colors.set([s.color.r,s.color.g,s.color.b],i*3));g.setAttribute('position',new T.BufferAttribute(a,3));g.setAttribute('color',new T.BufferAttribute(colors,3));this.bodyPoints=new T.Points(g,new T.PointsMaterial({size:.025,vertexColors:true,transparent:true,opacity:.12,depthWrite:false}));this.bodyPoints.frustumCulled=false;this.scene.add(this.bodyPoints);this.bodyVelocity=new Float32Array(a.length);this.morphStart=this.clock;
   this.human.mixer.update(0);this.player.root.updateMatrixWorld(true);this.buildBodyRelations();this.wolf=await loadAvatar('wolf',.8);this.companion.add(this.wolf.model);this.companion.position.set(1,0,3);this.wolf.setWalking(false);
  }catch(e){this.avatarError=e.message;console.error('Avatar loading failed',e);this.onError?.(e);}}
 buildBodyRelations(){const p=this.bodyPoints.geometry.attributes.position.array,v=new T.Vector3(),grid=new Map(),cell=.18;for(let i=0;i<this.bodySamples.length;i++){const s=this.bodySamples[i],m=this.human.meshes[s.meshIndex];m.skeleton.update();m.getVertexPosition(s.index,v);m.localToWorld(v);p.set([v.x,v.y,v.z],i*3);const key=[v.x,v.y,v.z].map(x=>Math.floor(x/cell)).join(':');if(!grid.has(key))grid.set(key,[]);grid.get(key).push(i);}const seen=new Set(),links=[];
  for(let i=0;i<this.bodySamples.length;i++){const base=[p[i*3],p[i*3+1],p[i*3+2]].map(x=>Math.floor(x/cell)),near=[];for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){for(const j of grid.get([base[0]+x,base[1]+y,base[2]+z].join(':'))||[]){if(j===i)continue;const d=Math.hypot(p[i*3]-p[j*3],p[i*3+1]-p[j*3+1],p[i*3+2]-p[j*3+2]);if(d>.002&&d<.18)near.push({j,d});}}near.sort((a,b)=>a.d-b.d);for(const {j,d} of near.slice(0,2)){const key=[i,j].sort((a,b)=>a-b).join(':');if(!seen.has(key)){seen.add(key);links.push({a:i,b:j,rest:d});}}}
  this.bodyLinks=links;this.onPopulation?.({addressRef:'player',dimensionViews:'inherited from player; resolved in local surface position',source:'supplied human mesh',particles:this.bodySamples.map((s,i)=>({id:'surface.player.'+i,mesh:s.meshIndex,vertex:s.index,polarity:s.polarity})),links,rule:'local-nearest-surface/v1; geometric topology, not semantic recognition'});
 }
 morph(){if(!this.human)return false;this.morphStart=this.clock;this.measuredMorph=false;this.morphEnergy=0;return true;}
 applyLearner(state){if(state)this.learner.restore(state);}
 fit(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;if(this.imageField){this.camera.position.set(0,3.5,this.camera.aspect<1?14:10);this.camera.lookAt(0,1.6,0);}else if(this.world?.room==='hub'&&!this.world.core.require('world').state.fixtureRoom){this.camera.position.set(0,2.8,this.camera.aspect<1?10:8);this.camera.lookAt(0,1,3);}else{this.camera.position.set(0,this.camera.aspect<1?10:7.4,this.camera.aspect<1?21:13);this.camera.lookAt(0,.7,-.5);}this.camera.updateProjectionMatrix();}
 material(c,metalness=.15){const m=new T.MeshStandardMaterial({color:c,roughness:.55,metalness});m.userData.baseColor=c;this.materials.push(m);return m;}
 box(parent,pos,size,c,id){const m=new T.Mesh(new T.BoxGeometry(...size),this.material(c));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;if(id)m.userData.entity=id;parent.add(m);return m;}
 sphere(parent,pos,r,c,id){const m=new T.Mesh(new T.SphereGeometry(r,20,14),this.material(c));m.position.set(...pos);m.castShadow=true;if(id)m.userData.entity=id;parent.add(m);return m;}
 label(parent,text,pos,c='#c4d2d7',size=1.3){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle=c;ctx.textAlign='center';ctx.font='500 36px system-ui';ctx.fillText(text,256,58);const map=new T.CanvasTexture(canvas),sprite=new T.Sprite(new T.SpriteMaterial({map,depthWrite:false}));sprite.position.set(...pos);sprite.scale.set(size,size*96/512,1);parent.add(sprite);return sprite;}
 makeCompanion(){const n=120,geo=new T.BufferGeometry(),a=new Float32Array(n*3);for(let i=0;i<n;i++){const t=i*2.39996,y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y)*.28;a.set([Math.cos(t)*r,y*.28,Math.sin(t)*r],i*3);}geo.setAttribute('position',new T.BufferAttribute(a,3));const p=new T.Points(geo,new T.PointsMaterial({color:'#9fe3d1',size:.035,transparent:true,opacity:.9}));return p;}
 disposeContent(){this.content.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});this.content.clear();this.targets=[];this.materials=[];this.particles=null;}
 build(world,{animate=true}={}){this.world=world;this.room=world.room;this.imageField=null;this.imageFieldId=null;this.motion=null;this.disposeContent();this.player.root.visible=true;this.player.root.position.fromArray(world.core.require('player').state.position);this.player.root.rotation.y=Math.PI;this.scene.background=color('#0d1720');
  const floor=this.box(this.content,[0,-.2,0],[12,.35,11],'#1d3038','world');this.targets.push(floor);
  const grid=new T.GridHelper(12,24,'#3a555b','#263d45');grid.position.y=-.018;this.content.add(grid);
  this.box(this.content,[0,.025,0],[.035,.025,8],'#5c7777');
  if(world.room==='hub'&&!world.state.fixtureRoom){this.player.root.rotation.y=0;this.camera.position.set(0,2.8,8);this.camera.lookAt(0,1.0,3);this.label(this.content,'FUNCTION + EMBODIED',[0,.02,.2],'#718c8b',3);}
  else if(world.room==='hub'){
   this.box(this.content,[0,1.6,-4.4],[12,3.2,.2],'#182a32');
   BRANCHES.forEach((b,i)=>{const x=(i-1)*3.5,id='door.'+b.id;const g=new T.Group();g.position.set(x,0,-3);g.userData.entity=id;this.content.add(g);this.targets.push(g);
    this.box(g,[-.86,1.4,0],[.18,2.8,.32],b.color);this.box(g,[.86,1.4,0],[.18,2.8,.32],b.color);this.box(g,[0,2.75,0],[1.9,.2,.32],b.color);const portal=this.box(g,[0,1.3,-.10],[1.5,2.55,.10],'#29434c');portal.material.emissive=color(b.color);portal.material.emissiveIntensity=.12;
    this.box(g,[0,.035,.45],[1.75,.06,1.2],b.color);this.label(g,b.label,[0,3.16,0],b.color,2.3);this.label(g,world.state.completed.includes(b.id)?'Completed · revisit':'Enter',[0,.65,.05],'#d6e0dc',1.1);
   });
   this.label(this.content,'THE MEETING FIELD',[0,.02,4.4],'#718c8b',3);
  }else if(world.room==='resonance'){
   for(let i=0;i<3;i++){const id='resonance.part.'+i,g=new T.Group();g.position.set((i-1)*2.6,0,-1);g.userData.entity=id;this.content.add(g);this.targets.push(g);this.box(g,[0,.35,0],[1.5,.7,1.5],'#293c49');const ring=new T.Mesh(new T.TorusGeometry(.56,.07,12,48),this.material(['#a3c8df','#bcabff','#e0b5cc'][i]));ring.position.y=1.5+i*.2;g.add(ring);this.sphere(g,[0,1.5+i*.2,0],.20,['#a3c8df','#bcabff','#e0b5cc'][i]);this.label(g,['Low','Middle','High'][i],[0,2.6,0],undefined,1.3);}
   this.label(this.content,'Listen · remember · respond',[0,.05,4.2],'#bcabff',4);
  }else if(world.room==='structure'){
   this.box(this.content,[0,-.005,-.5],[3.4,.02,6.8],'#101e27');for(let i=0;i<3;i++){const id='structure.part.'+i,g=new T.Group();g.position.set(0,.18,1.5-i*2);g.userData.entity=id;this.content.add(g);this.targets.push(g);const span=this.box(g,[0,0,0],[2.9,.25,.8],'#83b8c9');span.rotation.y=world.core.require(id).state.turn?0:Math.PI/2;this.label(g,String(i+1),[2.2,.2,0],'#b9d8dd',.5);}
   this.label(this.content,'Connect the crossing',[0,.05,4.2],'#80c6e5',3.5);
  }else{
   this.box(this.content,[0,.01,-.4],[3.6,.045,9],'#25353d');for(let i=0;i<9;i++)this.box(this.content,[0,.04,3.5-i],[.055,.02,.45],'#aaa08b');
   for(let i=0;i<3;i++){const id='movement.part.'+i;const g=new T.Group();g.position.set(i%2?2.9:-2.9,0,1.5-i*2.4);g.userData.entity=id;this.content.add(g);this.targets.push(g);const done=world.core.require(id).state.done;this.box(g,[0,.3,0],[1.25,.6,1.25],done?'#365e55':'#9c714a');this.sphere(g,[0,1.25,0],.22,done?'#86d3b0':'#f4ba75');this.label(g,done?'Delivered':'Stop '+(i+1),[0,1.95,0],done?'#86d3b0':'#f4ba75',1.5);}
   this.car=new T.Group();this.car.position.set(0,0,1);this.content.add(this.car);this.car.userData.entity='player';this.box(this.car,[0,.45,0],[1,.45,1.9],'#b18057');this.box(this.car,[0,.83,-.1],[.87,.45,1.02],'#8cb7c2');for(const x of [-.53,.53])for(const z of [-.57,.57]){const wheel=new T.Mesh(new T.CylinderGeometry(.22,.22,.14,16),this.material('#18232b'));wheel.rotation.z=Math.PI/2;wheel.position.set(x,.24,z);this.car.add(wheel);}this.label(this.content,'Deliveries become a journey',[0,.05,4.3],'#f4ba75',4);
  }
  this.targets.push(this.player.root,this.companion);const ps=world.core.require('player').state;if(world.room==='movement'&&ps.vehicle&&this.car){this.car.position.fromArray(ps.position);this.player.root.visible=false;}this.assembledAt=this.clock;if(animate){this.makeAssembly();this.morph();}this.applyQualities(world);
 }
 applyQualities(world){this.world=world;const c=world.core;const tint={Movement:'#f4ba75',Evolution:'#bcabff',Being:'#86d3b0',Design:'#80c6e5'};
  this.content.traverse(o=>{if(o.isMesh){let p=o;while(p&&!p.userData.entity)p=p.parent;const e=p&&c.entities.get(p.userData.entity);if(!e)return;const q=e.qualities,dominant=Object.keys(q).reduce((a,b)=>q[a]>=q[b]?a:b);o.material.color.set(o.material.userData.baseColor).lerp(color(tint[dominant]),Math.abs(q[dominant]-.5)*.65);o.material.roughness=.85-q.Design*.6;}
   if(o.userData.entity&&o.userData.entity!=='world'){const e=c.entities.get(o.userData.entity);if(e&&e.id!=='player')o.scale.setScalar(.9+e.qualities.Being*.2);}});
  const companion=c.expression('companion');this.companion.scale.setScalar(.7+companion.coherence*.6);
  if(this.human){const q=c.require('player').qualities,dominant=Object.keys(q).reduce((a,b)=>q[a]>=q[b]?a:b);for(const mesh of this.human.meshes)for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])if(/coat|trouser|cap/i.test(m.name)){m.userData.originalColor??=m.color.getHex();m.color.setHex(m.userData.originalColor).lerp(color(tint[dominant]),Math.abs(q[dominant]-.5)*1.2);}}
 }
 makeAssembly(){this.content.updateMatrixWorld(true);const targets=[],colors=[];
  this.content.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.getAttribute('position');const col=o.material.color;for(let j=0;j<a.count;j+=Math.max(1,Math.floor(a.count/45))){const v=new T.Vector3().fromBufferAttribute(a,j).applyMatrix4(o.matrixWorld);targets.push(v.x,v.y,v.z);colors.push(col.r,col.g,col.b);}});
  const n=targets.length/3,geo=new T.BufferGeometry(),origin=new Float32Array(targets.length);for(let i=0;i<n;i++){const a=i*2.39996,r=2+((i*37)%97)/25;origin[i*3]=Math.cos(a)*r;origin[i*3+1]=.5+((i*17)%101)/25;origin[i*3+2]=Math.sin(a)*r;}
  geo.setAttribute('position',new T.BufferAttribute(origin.slice(),3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));this.particles=new T.Points(geo,new T.PointsMaterial({vertexColors:true,size:.035,transparent:true,opacity:1}));this.particles.userData={targets:new Float32Array(targets),origin};this.content.add(this.particles);
 }
 showImageField(field,id){this.disposeContent();const geo=new T.BufferGeometry(),positions=new Float32Array(field.samples.length*3),colors=new Float32Array(positions.length);for(let i=0;i<field.samples.length;i++){const s=field.samples[i];positions.set([s.position[0],s.position[1]+1.8,s.position[2]],i*3);colors.set(s.rgb.map(v=>v*s.alpha),i*3);}geo.setAttribute('position',new T.BufferAttribute(positions.slice(),3));geo.setAttribute('color',new T.BufferAttribute(colors,3));const points=new T.Points(geo,new T.PointsMaterial({size:.09,vertexColors:true,transparent:true,opacity:.95}));points.userData.entity=id;this.content.add(points);this.targets.push(points);this.imageField={field,points,targets:positions,start:this.clock};this.imageFieldId=id;this.camera.position.set(0,3.5,10);this.camera.lookAt(0,1.6,0);}
 walkTo(target,onDone,{vehicle=false}={}){if(this.motion||this.paused)return false;const start=this.player.root.position.clone(),end=new T.Vector3(...target),distance=start.distanceTo(end);this.motion={start,end,elapsed:0,duration:Math.max(.6,distance/(vehicle?3.2:1.45)),onDone,vehicle};this.player.root.rotation.y=Math.atan2(end.x-start.x,end.z-start.z);return true;}
 driveTo(index,onDone){const target=[index%2?1.1:-1.1,0,1.5-index*2.4];if(!this.world.core.require('player').state.vehicle){return this.walkTo([.75,0,1],()=>{this.world.movePlayer([0,0,1],true);this.player.root.position.set(0,0,1);this.player.root.visible=false;this.walkTo(target,onDone,{vehicle:true});});}this.player.root.visible=false;return this.walkTo(target,onDone,{vehicle:true});}
 gait(dt,moving){if(this.human){this.human.setWalking(moving);this.human.mixer.update(dt*(.8+(this.world?.core.require('player').qualities.Movement||.5)*.4));}if(this.wolf){this.wolf.setWalking(moving);this.wolf.mixer.update(dt);}this.player.root.updateMatrixWorld(true);this.companion.updateMatrixWorld(true);this.updateBodySwarm(dt);}
 updateBodySwarm(dt){if(!this.bodyPoints||!this.world)return;this.bodyPoints.visible=this.player.root.visible;const age=this.clock-this.morphStart,morph=age<.9?Math.sin(age/.9*Math.PI/2):age<1.3?1:age<3.4?Math.max(0,1-(age-1.3)/2.1):0,positions=this.bodyPoints.geometry.attributes.position.array,velocity=this.bodyVelocity,q=this.world.core.require('player').qualities,v=new T.Vector3(),coupling=this.learner.predict(q,.5+morph*2,.5),k=3+coupling*25,damp=2*Math.sqrt(k)*(.55+.45*q.Design);this.morphPhase=morph;let residual=0,energy=0;for(const mesh of this.human.meshes)mesh.skeleton.update();
  for(let i=0;i<this.bodySamples.length;i++){const s=this.bodySamples[i],mesh=this.human.meshes[s.meshIndex];mesh.getVertexPosition(s.index,v);mesh.localToWorld(v);const phase=i*2.39996,spread=morph*(.65+q.Movement*.8);v.x+=Math.cos(phase)*spread;v.y+=Math.sin(phase*.37)*spread*.6;v.z+=Math.sin(phase)*spread;
   for(let axis=0;axis<3;axis++){const j=i*3+axis,target=[v.x,v.y,v.z][axis];if(age<.05||!Number.isFinite(positions[j]))positions[j]=target;const accel=(target-positions[j])*k-velocity[j]*damp;velocity[j]+=accel*dt;positions[j]+=velocity[j]*dt;residual+=(target-positions[j])**2;energy+=accel*accel*dt;}}
  this.morphEnergy=(this.morphEnergy||0)+energy/this.bodySamples.length;if(age>=3.4&&!this.measuredMorph){this.measuredMorph=true;this.onBuildOutcome?.({kind:'assembly',entity:'player',features:assemblyFeatures(q,1.5,.5),particles:this.bodySamples.length,residual:Math.sqrt(residual/positions.length),energy:this.morphEnergy,coupling,source:'live skinned-mesh particle assembly',rule:'spring-surface/v1'});}
  const gate=this.world.core.require('player').address.gate,gateStrength=gate===11?1.4:gate===12?.1:1;for(const link of this.bodyLinks||[]){const a=link.a*3,b=link.b*3,dx=positions[b]-positions[a],dy=positions[b+1]-positions[a+1],dz=positions[b+2]-positions[a+2],length=Math.max(.001,Math.hypot(dx,dy,dz)),force=(length-link.rest)*k*.12*(1-morph)*gateStrength/length;for(const [axis,delta]of [[0,dx],[1,dy],[2,dz]]){const correction=delta*force*dt;velocity[a+axis]+=correction;velocity[b+axis]-=correction;}}
  this.bodyPoints.geometry.attributes.position.needsUpdate=true;this.bodyPoints.material.opacity=.12+morph*.88;for(const mesh of this.human.meshes)for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material]){mat.opacity=(mat.userData.originalOpacity??1)*(1-morph*.96);const transparent=morph>.01;if(mat.transparent!==transparent){mat.transparent=transparent;mat.needsUpdate=true;}mat.depthWrite=morph<.2;}
 }
 frame(now){const dt=Math.min(.04,(now-this.last)/1000);this.last=now;if(!this.paused){this.clock+=dt;
  if(this.motion){const m=this.motion;m.elapsed+=dt;const t=Math.min(1,m.elapsed/m.duration);this.player.root.position.lerpVectors(m.start,m.end,t);if(m.vehicle&&this.car){this.car.position.copy(this.player.root.position);this.car.rotation.y=this.player.root.rotation.y;}if(t===1){this.motion=null;this.onArrive?.(m.end.toArray(),m.vehicle);m.onDone?.();}}
  this.companion.position.copy(this.player.root.position).add(new T.Vector3(.9,0,.3));this.companion.rotation.y=this.player.root.rotation.y;this.gait(dt,!!this.motion&&!this.motion.vehicle);
  if(this.particles){const p=this.particles,u=Math.min(1,(this.clock-this.assembledAt)/1.6),e=1-Math.pow(1-u,3),a=p.geometry.attributes.position.array;for(let i=0;i<a.length;i++)a[i]=p.userData.origin[i]*(1-e)+p.userData.targets[i]*e;p.geometry.attributes.position.needsUpdate=true;p.material.opacity=(1-u)*.9;for(const mat of this.materials){mat.transparent=u<1;mat.opacity=Math.min(1,.2+u);}}
  if(this.imageField){const {field,points,targets,start}=this.imageField,age=this.clock-start,gather=Math.min(1,age/2),a=points.geometry.attributes.position.array;for(let i=0;i<field.samples.length;i++){const seed=i*2.39996,motion=age<2?1-gather:0,region=field.samples[i].cluster;a[i*3]=targets[i*3]+Math.cos(seed)*motion*3+Math.sin(this.clock*.5+region)*.018;a[i*3+1]=targets[i*3+1]+Math.sin(seed)*motion*2+Math.cos(this.clock*.4+region)*.018;a[i*3+2]=0;}points.geometry.attributes.position.needsUpdate=true;}
 }this.updateProduction();this.renderer.render(this.scene,this.camera);this.raf=requestAnimationFrame(t=>this.frame(t));}
 updateProduction(){
  this.productionTargets??=new Map();
  for(const [object,base] of this.productionTargets){object.scale.copy(base.scale);object.rotation.z=base.rotation;}
  this.productionTargets.clear();
  if(!this.production)return;
  for(const binding of this.production.state.bindings){
   const value=this.production.sample(binding.target,this.clock);if(value===null)continue;
   let object;
   if(binding.target===this.imageFieldId)object=this.imageField?.points;
   else this.scene.traverse(o=>{if(!object&&o.userData.entity===binding.target)object=o;});
   if(!object)continue;
   const base={scale:object.scale.clone(),rotation:object.rotation.z};this.productionTargets.set(object,base);
   object.scale.multiplyScalar(1+value*.05);object.rotation.z+=value*.04;
   this.productionMeasurements??=new Map();
   const key=binding.toolId+':'+binding.target;
   if(!this.productionMeasurements.has(key)){this.productionMeasurements.set(key,true);this.production.feedback(binding.target,Math.abs(value*.05));}
  }
 }
 setPaused(value){this.paused=value;}
 highlight(id){this.selected=id;this.content.traverse(o=>{if(o.isMesh&&o.material?.emissive){let p=o;while(p&&!p.userData.entity)p=p.parent;o.material.emissive.set(p?.userData.entity===id?'#274a45':'#000000');}});}
}
