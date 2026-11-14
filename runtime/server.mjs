import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual} from 'node:crypto';
import {RuntimeEngine} from './engine.mjs';
import {StateStore} from './store.mjs';

export async function createRuntime({directory=process.env.SYNTHIA_DATA||'/data',tickMs=Number(process.env.SYNTHIA_TICK_MS||1000),token=null}={}){
 if(!Number.isInteger(tickMs)||tickMs<50||tickMs>60000)throw Error('Tick interval must be 50–60000 ms');
 const store=new StateStore(directory);await store.initialize();const credential=token||await store.token();if(!/^[a-f0-9]{64}$/.test(credential))throw Error('Invalid pairing credential');
 const saved=await store.load();let engine=new RuntimeEngine(saved?.checkpoint),revision=saved?.revision||0,receipts=saved?.receipts||[],queue=Promise.resolve(),timer=null,tickQueued=false,closing=false,fault=null;
 const serialize=fn=>{const result=queue.then(fn);queue=result.catch(()=>{});return result;};
 const persist=async()=>store.save({checkpoint:engine.checkpoint(),revision,receipts});
 if(!saved)await persist();
 const authorize=req=>{const given=Buffer.from(req.headers.authorization||''),expected=Buffer.from('Bearer '+credential);return given.length===expected.length&&timingSafeEqual(given,expected);};
 const send=(res,status,value)=>{const data=JSON.stringify(value);res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(data);};
 const body=async req=>{let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>16*1024*1024)throw Error('Request body exceeds 16 MB');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));};
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/health'&&req.method==='GET')return send(res,fault?503:200,{ok:!fault,service:'synthia-container',schema:'synthia.runtime/v1'});
   if(!authorize(req))return send(res,401,{error:'Pairing token required'});
   if(req.method==='GET'&&url.pathname==='/v1/state')return await serialize(()=>send(res,200,{...engine.snapshot(),revision,fault}));
   if(req.method==='GET'&&url.pathname==='/v1/preview')return await serialize(()=>send(res,200,engine.preview()));
   if(req.method==='GET'&&url.pathname==='/v1/checkpoint')return await serialize(()=>send(res,200,engine.checkpoint()));
   if(req.method==='GET'&&url.pathname==='/v1/tool')return await serialize(()=>send(res,200,engine.production.exportTool(url.searchParams.get('id'))));
   if(req.method==='POST'&&url.pathname==='/v1/commands'){
    const command=await body(req);
    if(typeof command?.requestId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(command.requestId))return send(res,400,{error:'A unique requestId is required'});
    return await serialize(async()=>{
     const existing=receipts.find(r=>r.requestId===command.requestId);if(existing)return send(res,200,existing);
     if(fault&&!['pause','restore'].includes(command.action))return send(res,503,{error:fault});
     const before=engine.checkpoint(),oldRevision=revision,oldReceipts=receipts;
     try{
      const result=engine.command(command);revision++;
      const receipt={ok:true,requestId:command.requestId,revision,...result};receipts=[...receipts,receipt].slice(-128);await persist();fault=null;return send(res,200,receipt);
     }catch(error){engine=new RuntimeEngine(before);revision=oldRevision;receipts=oldReceipts;throw error;}
    });
   }
   return send(res,404,{error:'Unknown runtime route'});
  }catch(error){if(!res.headersSent)send(res,400,{error:error.message});}
 });
 server.requestTimeout=30000;server.headersTimeout=10000;server.maxHeadersCount=40;
 function startClock(){timer=setInterval(()=>{
  if(tickQueued||closing||fault||!engine.swarm.state.running)return;tickQueued=true;
  serialize(async()=>{try{if(engine.tick()){revision++;await persist();}}catch(error){fault='Runtime stopped: '+error.message;engine.swarm.control(false);console.error(fault);}finally{tickQueued=false;}});
 },tickMs);}
 async function listen({port=Number(process.env.PORT||17841),host=process.env.SYNTHIA_HOST||'127.0.0.1'}={}){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});startClock();return server.address();}
 async function close(){closing=true;clearInterval(timer);await queue;await persist();await new Promise(resolve=>server.close(resolve));}
 return {server,listen,close,engine:()=>engine};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const runtime=await createRuntime();const address=await runtime.listen();console.log('Synthia container runtime listening on '+address.address+':'+address.port+'; credentials remain in the data directory.');
 let stopping=false;for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{if(stopping)return;stopping=true;runtime.close().then(()=>process.exit(0),error=>{console.error(error.message);process.exit(1);});});
}
