import {RuntimeEngine} from '../runtime/engine.mjs';
// QuickJS owns the same portable core in an Android Linux process, without DOM.
if(typeof globalThis.structuredClone!=='function')globalThis.structuredClone=function clone(v){
 if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(clone);
 if(v instanceof Map)return new Map([...v].map(([k,x])=>[clone(k),clone(x)]));if(v instanceof Set)return new Set([...v].map(clone));
 if(v instanceof Date)return new Date(v.getTime());if(ArrayBuffer.isView(v))return new v.constructor(v);
 const out={};for(const k of Object.keys(v))Object.defineProperty(out,k,{value:clone(v[k]),enumerable:true,writable:true,configurable:true});return out;
};
let engine,revision=0,receipts=[];
globalThis.NativeSwarm={
 open(text){const saved=text?JSON.parse(text):null;engine=new RuntimeEngine(saved?.checkpoint);revision=saved?.revision||0;receipts=saved?.receipts||[];return this.state();},
 state(){return JSON.stringify({...engine.snapshot(),revision});},
 save(){return JSON.stringify({checkpoint:engine.checkpoint(),revision,receipts});},
 tick(){const changed=engine.tick();if(changed)revision++;return changed;},
 request(text){
  const message=JSON.parse(text),route=message.route;
  if(route==='/v1/state')return this.state();
  if(route==='/v1/preview')return JSON.stringify(engine.preview());
  if(route==='/v1/checkpoint')return JSON.stringify(engine.checkpoint());
  if(route.startsWith('/v1/tool?id='))return JSON.stringify(engine.production.exportTool(decodeURIComponent(route.slice('/v1/tool?id='.length))));
  if(route!=='/v1/commands')throw Error('Unknown native operation');
  const command=message.body;if(typeof command?.requestId!=='string')throw Error('Missing operation identity');
  const prior=receipts.find(r=>r.requestId===command.requestId);if(prior)return JSON.stringify(prior);
  const checkpoint=engine.checkpoint();try{const result=engine.command(command);revision++;const receipt={ok:true,revision,requestId:command.requestId,...result};receipts=[...receipts,receipt].slice(-128);return JSON.stringify(receipt);}catch(error){engine=new RuntimeEngine(checkpoint);throw error;}
 }
};
