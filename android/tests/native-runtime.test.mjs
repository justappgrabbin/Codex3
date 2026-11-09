import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('bundled native dispatcher ticks, restores, deduplicates and rolls back invalid commands',()=>{
 const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../build/assets/native-runtime.js',import.meta.url),'utf8'),context);
 const api=context.NativeSwarm;api.open(null);
 const command=body=>api.request(JSON.stringify({route:'/v1/commands',body}));
 const first=command({action:'start',requestId:'start'});assert.equal(command({action:'start',requestId:'start'}),first);
 for(let i=0;i<5;i++)api.tick();assert.equal(JSON.parse(api.state()).tick,5);
 const rep=JSON.parse(command({action:'representText',text:'Café 🌍',requestId:'representation'})).representation;assert.equal(rep.transliteration,'Cafe 🌍');assert.equal(rep.unicode[5],'U+1F30D');
 const saved=api.save();api.open(saved);assert.equal(api.save(),saved);
 assert.throws(()=>command({action:'particleState',id:'absent',open:true,requestId:'bad'}));assert.equal(api.save(),saved);
 api.tick();assert.equal(JSON.parse(api.state()).tick,6);
 command({action:'pause',requestId:'pause'});api.tick();assert.equal(JSON.parse(api.state()).tick,6);
});
