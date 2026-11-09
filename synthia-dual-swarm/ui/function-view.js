import {DIMENSIONS} from '../core/ontology.js';
export class FunctionView{
 constructor(canvas,onSelect){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onSelect=onSelect;this.nodes=[];canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const hit=this.nodes.find(n=>Math.hypot(x-n.x,y-n.y)<n.r+10);if(hit)this.onSelect(hit.id);});}
 draw(core,selected){const c=this.canvas,ratio=Math.min(devicePixelRatio,2),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;c.width=w*ratio;c.height=h*ratio;const ctx=this.ctx;ctx.scale(ratio,ratio);ctx.fillStyle='#0d1720';ctx.fillRect(0,0,w,h);const cx=w/2,cy=h*.48,r=Math.min(w*.26,h*.29);this.nodes=[];
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
}
