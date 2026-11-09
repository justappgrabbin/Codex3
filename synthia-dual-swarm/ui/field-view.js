import * as T from '../vendor/three/three.module.js';
import {gateBits} from '../core/substrate.js';
import {DIMENSIONS} from '../core/ontology.js';
import {FIELD_VECTORS} from '../vendor/generative/structural-topology.mjs';

// Rendering is an adapter over the retained world, never the state authority.
export class FieldView {
 constructor(canvas,onSelect){
  this.canvas=canvas;this.onSelect=onSelect;this.selected='field.gate.11';this.focus='';this.view='';this.clock=0;this.paused=false;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.scene=new T.Scene();this.scene.background=new T.Color('#0a141c');
  this.scene.add(new T.HemisphereLight('#d6e9eb','#1f3040',2));const light=new T.DirectionalLight('#fff3d9',2);light.position.set(-8,20,10);this.scene.add(light);
  this.camera=new T.PerspectiveCamera(42,1,.1,150);this.target=new T.Vector3();this.azimuth=.18;this.elevation=.88;this.distance=32;
  this.group=new T.Group();this.scene.add(this.group);this.nodes=new Map();this.targets=[];this.ray=new T.Raycaster();this.pointer=new T.Vector2();
  this.links=new T.LineSegments(new T.BufferGeometry(),new T.LineBasicMaterial({color:'#7bbda9',transparent:true,opacity:.35}));this.scene.add(this.links);
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;drag.lastX=e.clientX;drag.lastY=e.clientY;drag.moved||=Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5;if(drag.moved){this.azimuth-=dx*.006;this.elevation=Math.max(.25,Math.min(1.45,this.elevation+dy*.006));this.cameraPosition();}});
  canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const b=canvas.getBoundingClientRect();this.pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.targets,true)[0];if(hit){let o=hit.object;while(o&&!o.userData.entity)o=o.parent;if(o)this.onSelect(o.userData.entity);}}drag=null;});
  canvas.addEventListener('pointercancel',()=>drag=null);
  canvas.addEventListener('wheel',e=>{e.preventDefault();this.distance=Math.max(5,Math.min(65,this.distance*Math.exp(e.deltaY*.001)));this.cameraPosition();},{passive:false});
  this.resize=new ResizeObserver(()=>this.fit());this.resize.observe(canvas);this.fit();this.frame();
 }
 cameraPosition(){this.camera.position.set(this.target.x+Math.sin(this.azimuth)*Math.cos(this.elevation)*this.distance,this.target.y+Math.sin(this.elevation)*this.distance,this.target.z+Math.cos(this.azimuth)*Math.cos(this.elevation)*this.distance);this.camera.lookAt(this.target);}
 fit(){const {clientWidth:w,clientHeight:h}=this.canvas;if(!w||!h)return;const portrait=this.camera.aspect<1;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;if(portrait!==(this.camera.aspect<1))this.distance=this.focus==='field'?(this.camera.aspect<1?48:32):(this.camera.aspect<1?23:16);this.camera.updateProjectionMatrix();this.cameraPosition();}
 reset(){this.azimuth=.18;this.elevation=.88;this.distance=this.camera.aspect<1?48:32;this.cameraPosition();}
 clear(){this.group.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});this.group.clear();this.nodes.clear();this.targets=[];}
 label(text,parent,x,y,z,size=.8){const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.font='500 28px system-ui';ctx.textAlign='center';ctx.fillStyle='#b8cbc9';ctx.fillText(text,128,42);const material=new T.SpriteMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false});const s=new T.Sprite(material);s.position.set(x,y,z);s.scale.set(size,size/4,1);parent.add(s);return s;}
 build(runtime){
  this.clear();this.focus=runtime.state.focus;const objects=runtime.children();
  const grid=new T.GridHelper(27,27,'#243e47','#152b35');grid.position.y=-.1;this.group.add(grid);
  const count=objects.length,columns=count===64?8:Math.ceil(Math.sqrt(count)),spacing=count===64?2.25:3.5;
  objects.forEach((e,i)=>{
   const x=(i%columns-(columns-1)/2)*spacing,z=(Math.floor(i/columns)-(Math.ceil(count/columns)-1)/2)*spacing;
   const g=new T.Group();g.position.set(x,0,z);g.userData.entity=e.id;this.group.add(g);this.targets.push(g);
   const material=new T.MeshStandardMaterial({color:'#9fd3be',roughness:.6,metalness:.12});
   const pick=new T.Mesh(new T.CylinderGeometry(.72,.72,.05,6),new T.MeshStandardMaterial({color:'#162c36',roughness:.9}));pick.position.y=-.05;g.add(pick);
   const bars=[],bits=e.state.pattern??(e.state.scale==='gate'?gateBits(e.address.gate):[e.state.bit??1]);
   bits.forEach((bit,j)=>{for(let half=0;half<(bit?1:2);half++){const m=new T.Mesh(new T.BoxGeometry(bit?.82:.34,.08,.085),material);m.position.set(bit?0:half===0?-.24:.24,.08,(2.5-j)*.18);g.add(m);bars.push({mesh:m,home:m.position.clone(),line:j,half,bit});}});
   const seed=new T.Mesh(new T.OctahedronGeometry(.13),material);seed.position.y=.28;g.add(seed);
   this.label(e.state.scale==='gate'?'G'+e.address.gate:e.label,g,0,.1,1.0,1.05);
   this.nodes.set(e.id,{group:g,bars,material,base:pick,seed,position:g.position.clone(),level:0});
  });
  this.view=runtime.state.view;this.distance=count===64?(this.camera.aspect<1?48:32):count===6?16:14;this.target.set(0,0,0);this.cameraPosition();
 }
 update(runtime,selected){
  this.runtime=runtime;this.selected=selected;
  if(this.focus!==runtime.state.focus||this.nodes.size!==runtime.children().length)this.build(runtime);
  this.view=runtime.state.view;
  const component=Object.keys(FIELD_VECTORS).find(k=>FIELD_VECTORS[k]===this.view),tint=new T.Color(DIMENSIONS[this.view].color);
  for(const [id,node]of this.nodes){const e=runtime.core.require(id),s=e.state;node.level=s.scale==='gate'?(component?s.vectors[component][0]:Math.sqrt(Math.max(0,s.expression))):s.scale==='analogy'?.5:.25;
   node.material.color.copy(tint);node.material.emissive.copy(tint).multiplyScalar(id===selected?.5:.06);node.base.material.color.set(id===selected?'#3e605e':'#162c36');node.group.visible=s.active!==false;
  }
  const positions=[];
  for(const r of runtime.core.relations.values()){if(r.kind!=='one-line-interaction')continue;const a=this.nodes.get(r.source),b=this.nodes.get(r.target);if(!a||!b||!a.group.visible||!b.group.visible)continue;if(selected&&selected!==r.source&&selected!==r.target&&!runtime.state.activity.some(x=>x.relation===r.id))continue;for(const n of [a,b])positions.push(n.group.position.x,.25+n.level*1.5,n.group.position.z);}
  this.links.geometry.dispose();this.links.geometry=new T.BufferGeometry();this.links.geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));this.links.material.color.copy(tint);
 }
 frame(){if(!this.paused&&this.canvas.clientWidth&&this.canvas.clientHeight){for(const node of this.nodes.values()){
   const amount=Math.max(0,Math.min(1,node.level));node.seed.position.y+=(.25+amount*1.5-node.seed.position.y)*.08;
   // Geometry expresses the measured state; camera layout has no semantic authority.
   for(const b of node.bars){const phase=b.line*Math.PI/3;const spread=amount*.7;const target=new T.Vector3(b.home.x+Math.cos(phase)*spread,b.home.y+amount*(b.line+1)*.24,b.home.z+Math.sin(phase)*spread);b.mesh.position.lerp(target,.09);}
  }this.renderer.render(this.scene,this.camera);}this.raf=requestAnimationFrame(()=>this.frame());}
}
