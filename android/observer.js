import * as T from '../synthia-dual-swarm/vendor/three/three.module.js';
import {SceneView} from '../synthia-dual-swarm/ui/scene.js';
import {Substrate} from '../synthia-dual-swarm/core/substrate.js';
import {AutonomousSwarm} from '../synthia-dual-swarm/core/autonomy.js';
import {LocalProduction} from '../synthia-dual-swarm/core/production.js';
let scene,received=0;
try{scene=new SceneView(document.getElementById('world'),{onSelect:()=>{},onError:error=>{document.getElementById('status').textContent=String(error);}});}catch(error){document.getElementById('status').textContent='3D preview unavailable: '+error.message;}
window.receiveSnapshot=snapshot=>{
 if(!scene)return;
 const core=new Substrate();core.entities=new Map(snapshot.entities.map(e=>[e.id,e]));core.relations=new Map(snapshot.relations.map(r=>[r.id,r]));
 const world={core,get room(){return core.require('world').state.room;},get state(){return core.require('world').state;}};
 if(!scene.world||scene.room!==world.room)scene.build(world,{animate:false});else{scene.world=world;scene.applyQualities(world);}
 const swarm=new AutonomousSwarm(core),production=new LocalProduction(swarm);received=performance.now();
 scene.production={state:production.state,sample:(target)=>production.sample(target,swarm.state.tick+(swarm.state.running?Math.min(1,(performance.now()-received)/1000):0)),feedback:(target,value)=>window.SynthiaObservation?.feedback(target,value)};
 if(scene.virtualParticles){scene.virtualParticles.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});scene.scene.remove(scene.virtualParticles);}
 scene.virtualParticles=new T.Group();scene.scene.add(scene.virtualParticles);
 for(const agent of swarm.agents()){const s=agent.state,p=s.position3D||[s.position,0,0],rgb=s.binaryColor||(s.open===false?[0,0,0]:[255,255,255]);const mesh=new T.Mesh(new T.SphereGeometry(.16,12,8),new T.MeshStandardMaterial({color:new T.Color(...rgb.map(v=>v/255)),roughness:.45}));mesh.position.set(p[0],p[1]+1,p[2]);scene.virtualParticles.add(mesh);}
 const activeImage=world.state.activeImage;if(activeImage&&scene.imageFieldId!==activeImage)scene.showImageField(core.require(activeImage).state.field,activeImage);
 document.getElementById('status').textContent='Service tick '+swarm.state.tick+' · '+(swarm.state.running?'running':'paused');
};
