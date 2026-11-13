// Word swarm: a person's 26 activations (13 bodies x personality/design) put on screen as
// moving words. Each activation is three spaces (gate.line | colour.tone.base with
// degree.minute.second | arc-second.house). The activation's dimension comes from its base
// (canon base table) and decides how its units move (spacetime-semantics flow).
// Viewed from the same dimension a unit shows words; from another dimension it shows the
// gate's binary; from far away it is a dot.
import {BASES} from './state-space-canon.js';
import {flow} from './spacetime-semantics.js';
import {figureOf} from './zhouyi.js';
import {GATE_NAMES,LINE_NAMES} from '../vendor/recovered/src/synthia/sentenceRealization.mjs';

export const SPACES=Object.freeze(['gate-line','ctb-dms','arcsec-house']);
const range=(v,lo,hi,name)=>{if(!(Number.isInteger(v)&&v>=lo&&v<=hi))throw new RangeError(`${name} must be ${lo}-${hi}`);};
export const dimensionOfBase=base=>{range(base,1,5,'base');return BASES[base-1].dimension;};

export function validate(a){
  range(a.gate,1,64,'gate');range(a.line,1,6,'line');range(a.color,1,6,'color');range(a.tone,1,6,'tone');range(a.base,1,5,'base');
  for(const [k,hi] of [['degree',29],['minute',59],['second',59],['arcsecond',99]])if(a[k]!==undefined)range(a[k],0,hi,k);
  return a;
}

// The three spaces of one activation, with the words each shows on its own dimension.
// bookWords: optional index from scripts/ingest-hatcher.mjs ({gate:{name,lines:{n:phrase}}}); book words win.
export function unitsOf(a,index=0,{bookWords=null}={}){
  validate(a);
  const dimension=dimensionOfBase(a.base),active=a.active!==false;
  const book=bookWords?.[a.gate];
  const lineName=book?.lines?.[a.line]??LINE_NAMES[a.gate]?.[a.line-1]??null; // null where no source has it
  const dms=['degree','minute','second'].filter(k=>a[k]!==undefined).map(k=>a[k]).join('.');
  return [
    {space:'gate-line',words:[book?.name??GATE_NAMES[a.gate],lineName].filter(Boolean)},
    {space:'ctb-dms',words:[`C${a.color} T${a.tone} B${a.base}`,dms].filter(Boolean)},
    {space:'arcsec-house',words:[a.arcsecond!==undefined?`${a.arcsecond}″`:null,a.house!==undefined?`house ${a.house}`:null].filter(Boolean)}
  ].map((u,k)=>({...u,id:`${index}.${k}`,activation:index,gate:a.gate,dimension,active,side:a.side??null,body:a.body??null}));
}

export function binaryOf(gate){const f=figureOf(gate);let s='';for(let i=5;i>=0;i--)s+=(f>>i)&1;return s;} // top line first

// What a unit looks like from a viewer's dimension and zoom (zoom<farZoom = far away).
export function appearance(unit,{viewer,zoom=1,farZoom=0.35}={}){
  if(zoom<farZoom)return {kind:'dot'};
  if(unit.dimension===viewer)return {kind:'words',text:unit.words.join(' · ')};
  return {kind:'binary',text:binaryOf(unit.gate)};
}

// Place units across the screen in reading order (linear), then let them move.
export function layout(units,{width=1,height=1}={}){
  const n=units.length;
  return units.map((u,i)=>({...u,x:((i+0.5)/n)*width,y:height/2+((i%3)-1)*height*0.08}));
}

// One time step. Each unit moves by its dimension's flow; inactive units drift slower.
export function step(units,{dt=1,speed=0.004,width=1,height=1}={}){
  const centre=[width/2,height/2];
  const others=units.filter(u=>u.dimension!=='Space').map(u=>[u.x,u.y]);
  return units.map((u,i)=>{
    const sameDim=units.filter(v=>v.dimension===u.dimension);
    const k=sameDim.indexOf(u),nxt=sameDim[(k+1)%sameDim.length];
    const v=flow(u.dimension,{position:[u.x,u.y],next:nxt&&nxt!==u?[nxt.x,nxt.y]:null,centre,others});
    const s=speed*dt*(u.active?1:0.3);
    // screen y grows downward, flow y grows upward
    let x=u.x+v[0]*s,y=u.y-v[1]*s;
    x=((x%width)+width)%width;y=((y%height)+height)%height;
    return {...u,x,y};
  });
}
