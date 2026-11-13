import * as T from '../synthia-dual-swarm/vendor/three/three.module.js';
const canvas=document.getElementById('world'),status=document.getElementById('status');
let renderer,scene,camera,objects,latest=null,yaw=.6,pitch=.5,distance=8,target=new T.Vector3(),drag=null,fitted=false;
try{
 renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));scene=new T.Scene();scene.background=new T.Color('#101b23');camera=new T.PerspectiveCamera(45,1,.01,2000);objects=new T.Group();scene.add(objects,new T.HemisphereLight('#e1f0f4','#32423d',2.5));const light=new T.DirectionalLight('#fff0d7',3);light.position.set(-3,8,5);scene.add(light);
 function fit(){const r=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();}new ResizeObserver(fit).observe(canvas);fit();
 function frame(){camera.position.set(target.x+distance*Math.cos(pitch)*Math.sin(yaw),target.y+distance*Math.sin(pitch),target.z+distance*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(target);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.01;pitch=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-drag.y)*.01));drag={x:e.clientX,y:e.clientY};});for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,()=>drag=null);canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(.5,Math.min(1000,distance*Math.exp(e.deltaY*.001)));},{passive:false});
}catch(error){status.textContent='3D inspector unavailable: '+error.message;}
window.zoomSwarm=factor=>{distance=Math.max(.5,Math.min(1000,distance*factor));};
window.receiveSnapshot=snapshot=>{
 if(!objects)return;objects.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});objects.clear();latest=snapshot;
 const agents=snapshot.entities.filter(e=>e.state.active!==false&&e.state.autonomous),positions=new Map(),bodies=[];
 for(const a of agents){const s=a.state,rgb=s.binaryColor||(s.open===false?[0,0,0]:[255,255,255]);for(const part of s.wordFragments?.every(p=>p.position)?s.wordFragments:[{id:a.id,position:s.position3D||[s.position,0,0],mass:s.mass||1}]){bodies.push(part);positions.set(part.id,part.position);const mesh=new T.Mesh(new T.SphereGeometry(.11*Math.cbrt(part.mass||1),12,8),new T.MeshStandardMaterial({color:new T.Color(...rgb.map(v=>v/255)),roughness:.45}));mesh.position.fromArray(part.position);objects.add(mesh);}}
 if(bodies.length){target.set(0,0,0);for(const b of bodies)target.add(new T.Vector3(...b.position));target.multiplyScalar(1/bodies.length);if(!fitted){const extent=Math.max(...bodies.map(b=>new T.Vector3(...b.position).distanceTo(target)));distance=Math.max(2,extent*2.7);fitted=true;}}
 const state=snapshot.entities.find(e=>e.id==='autonomy')?.state;
 for(const edge of state?.sixBit?.edges||[]){const points=edge.fragments?.map(id=>positions.get(id));if(!points?.every(Boolean))continue;const line=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color:'#8ed7c0',transparent:true,opacity:Math.max(edge.weight,edge.reverseWeight||0)}));objects.add(line);}
 status.textContent='Swarm inspector · tick '+(state?.tick||0)+' · '+bodies.length+' physical fragments · '+(state?.running?'running':'paused');
};
