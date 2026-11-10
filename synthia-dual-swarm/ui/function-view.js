import {DIMENSIONS} from '../core/ontology.js';
export class FunctionView{
 constructor(canvas,onSelect){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onSelect=onSelect;this.nodes=[];canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const hit=this.nodes.find(n=>Math.hypot(x-n.x,y-n.y)<n.r+10);if(hit)this.onSelect(hit.id);});}
 draw(core,selected){if(core.entities.get('primitive.swarm')?.state.clusters.length||selected.startsWith('primitive.swarm'))return this.drawPrimitives(core,selected);if(core.entities.has('field'))return this.drawWorld(core,selected);const c=this.canvas,ratio=Math.min(devicePixelRatio,2),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;c.width=w*ratio;c.height=h*ratio;const ctx=this.ctx;ctx.scale(ratio,ratio);ctx.fillStyle='#0d1720';ctx.fillRect(0,0,w,h);const cx=w/2,cy=h*.48,r=Math.min(w*.26,h*.29);this.nodes=[];
  const active=[...core.entities.values()].filter(e=>e.id!=='world'&&e.id!=='player'&&e.id!=='companion'&&!e.id.startsWith('perspective.')&&(!e.id.startsWith('ui.')||e.id==='ui.root'));const groups=['Movement','Evolution','Being','Design'];
  groups.forEach((d,i)=>{const a=-Math.PI/2+i*Math.PI/2,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;this.nodes.push({id:'perspective.'+d,x,y,r:22,label:d,dim:d});});
  this.nodes.push({id:'companion',x:cx,y:cy,r:28,label:'Companion',dim:'Space'});
  active.forEach((e,i)=>{const a=(i/Math.max(1,active.length))*Math.PI*2+.2;this.nodes.push({id:e.id,x:cx+Math.cos(a)*r*1.65,y:cy+Math.sin(a)*r*1.35,r:e.kind==='composite'?13:8,label:e.label,dim:e.dimension});});
  const node=id=>this.nodes.find(n=>n.id===id);ctx.lineWidth=1;
  for(const rel of core.relations.values()){const a=node(rel.source),b=node(rel.target);if(!a||!b)continue;ctx.strokeStyle=rel.crossings?'#95d4bd':'#2a424c';ctx.lineWidth=rel.crossings?1+rel.weight*2:1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=this.nodes[i],b=this.nodes[j];ctx.strokeStyle='#35514e';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(cx,cy,b.x,b.y);ctx.stroke();}
  for(const n of this.nodes){ctx.fillStyle=n.id===selected?'#edf0df':DIMENSIONS[n.dim].color;ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#10232c';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#d9e3de';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(n.label,n.x,n.y+n.r+19);}
  ctx.fillStyle='#809b9d';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText('One substrate · four contributing perspectives · Space expressed through relations',cx,h-26);
 }
 drawPrimitives(core,selected){
  const c=this.canvas,w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;
  const ratio=Math.min(devicePixelRatio,2);c.width=w*ratio;c.height=h*ratio;const ctx=this.ctx;ctx.scale(ratio,ratio);ctx.fillStyle='#0d1720';ctx.fillRect(0,0,w,h);
  const root=core.entities.get(selected),subset=new Set();
  const include=id=>{if(subset.has(id))return;subset.add(id);for(const child of core.require(id).children)include(child);};
  if(root?.state.graph)include(root.id);
  const entities=[...core.entities.values()].filter(e=>e.id.startsWith('primitive.swarm.')&&(!subset.size||subset.has(e.id)));
  const columns=Math.max(1,Math.ceil(Math.sqrt(entities.length))),dx=(w-40)/columns,dy=(h-110)/Math.max(1,Math.ceil(entities.length/columns));
  this.nodes=entities.map((e,i)=>({id:e.id,x:20+(i%columns+.5)*dx,y:45+(Math.floor(i/columns)+.5)*dy,r:e.state.graph?13:8,label:e.state.graph?'Cluster '+e.id.split('.').at(-1):e.label}));
  const lookup=new Map(this.nodes.map(n=>[n.id,n]));
  const edge=(source,target,color)=>{const a=lookup.get(source),b=lookup.get(target);if(!a||!b)return;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();};
  for(const entity of entities)for(const child of entity.children)edge(child,entity.id,'#35515c');
  for(const relation of core.relations.values())if(relation.kind==='primitive-port-binding')edge(relation.source,relation.target,'#9fd3be');
  ctx.font='12px system-ui';ctx.textAlign='center';
  for(const n of this.nodes){ctx.fillStyle=n.id===selected?'#fff0c8':core.require(n.id).state.graph?'#d8b48c':'#9fd3be';ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bcd0ca';ctx.fillText(n.label,n.x,n.y+n.r+20,dx-8);}
  ctx.fillStyle='#bcd0ca';ctx.fillText('Registered primitives and discovered clusters · lines retain actual composition and port bindings',w/2,h-20);
 }
 drawWorld(core,selected){
  const c=this.canvas,w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;
  const ratio=Math.min(devicePixelRatio,2);c.width=w*ratio;c.height=h*ratio;const ctx=this.ctx;ctx.scale(ratio,ratio);ctx.fillStyle='#0d1720';ctx.fillRect(0,0,w,h);
  const field=core.require('field'),focus=core.require(field.state.focus),ids=focus.state.resolvedContents?core.require(focus.state.resolvedContents).children:focus.children;
  const columns=Math.ceil(Math.sqrt(ids.length)),rows=Math.ceil(ids.length/columns),dx=(w-70)/Math.max(1,columns),dy=(h-130)/Math.max(1,rows);
  this.nodes=ids.map((id,i)=>({id,x:35+(i%columns+.5)*dx,y:85+(Math.floor(i/columns)+.5)*dy,r:Math.min(8,dx/6),label:core.require(id).state.scale==='gate'?'G'+core.require(id).address.gate:core.require(id).label}));
  const lookup=new Map(this.nodes.map(n=>[n.id,n]));
  for(const rel of core.relations.values()){if(rel.kind!=='one-line-interaction')continue;const a=lookup.get(rel.source),b=lookup.get(rel.target);if(!a||!b)continue;ctx.strokeStyle=rel.source===selected||rel.target===selected?'#9fd3be':'#213d47';ctx.lineWidth=rel.source===selected||rel.target===selected?2:1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  ctx.font='11px system-ui';ctx.textAlign='center';
  for(const n of this.nodes){ctx.fillStyle=n.id===selected?'#fff0c8':'#9fd3be';ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#aabfbd';ctx.fillText(n.label,n.x,n.y+n.r+16,dx-8);}
  ctx.fillStyle='#aabfbd';ctx.fillText(focus.label+' · actual constituent relations · select a node to inspect',w/2,h-20);
 }
}
