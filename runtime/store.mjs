import {mkdir,readFile,open,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
export class StateStore {
 constructor(directory){this.directory=directory;this.file=path.join(directory,'checkpoint.json');}
 async initialize(){await mkdir(this.directory,{recursive:true,mode:0o700});}
 async token(){
  const file=path.join(this.directory,'pairing-token');
  try{const token=(await readFile(file,'utf8')).trim();if(!/^[a-f0-9]{64}$/.test(token))throw Error('Invalid pairing credential');return token;}
  catch(error){if(error.code!=='ENOENT')throw error;const token=randomBytes(32).toString('hex');const handle=await open(file,'wx',0o600);try{await handle.writeFile(token+'\n');await handle.sync();}finally{await handle.close();}return token;}
 }
 async load(){
  let text;try{text=await readFile(this.file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(Buffer.byteLength(text)>32*1024*1024)throw Error('Checkpoint exceeds storage limit');
  const envelope=JSON.parse(text);if(envelope.schema!=='synthia.container-state/v1'||typeof envelope.payload!=='string'||digest(envelope.payload)!==envelope.sha256)throw Error('Checkpoint integrity failed; original file preserved');
  return JSON.parse(envelope.payload);
 }
 async save(state){
  const payload=JSON.stringify(state),text=JSON.stringify({schema:'synthia.container-state/v1',sha256:digest(payload),payload});
  if(Buffer.byteLength(text)>32*1024*1024)throw Error('Checkpoint exceeds storage limit');
  const temp=this.file+'.tmp',handle=await open(temp,'w',0o600);
  try{await handle.writeFile(text);await handle.sync();}finally{await handle.close();}
  await rename(temp,this.file);
  const directory=await open(this.directory,'r');try{await directory.sync();}finally{await directory.close();}
 }
}
