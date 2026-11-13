const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
(async()=>{
 const out=process.env.SYNTHIA_TEST_OUTPUT||'/tmp/synthia-production-proof';await fs.mkdir(out,{recursive:true});
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const p=await b.newPage({viewport:{width:1440,height:1100}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.SYNTHIA_TEST_URL||'http://127.0.0.1:8000')+'/Synthia-Dual-Swarm.html');
 await p.waitForFunction(()=>window.synthia?.getStatus().humanReady);
 await p.fill('#production-samples',JSON.stringify(Array.from({length:12},(_,i)=>[i/4,Math.sin(i/4*2+.5)])));await p.click('#production-learn');
 await p.waitForFunction(()=>window.synthia.getState().entities.find(e=>e.id==='production').state.tools.length===1);
 await p.click('#production-apply');
 await p.waitForFunction(()=>window.synthia.getExport().events.some(e=>e.data.kind==='production-form-feedback'));
 const code=p.waitForEvent('download');await p.click('#production-code');const codeFile=await code;await codeFile.saveAs(path.join(out,codeFile.suggestedFilename()));
 const png=p.waitForEvent('download');await p.click('#production-image');const image=await png;await image.saveAs(path.join(out,image.suggestedFilename()));
 const video=p.waitForEvent('download',{timeout:30000});await p.click('#production-video');const clip=await video;await clip.saveAs(path.join(out,clip.suggestedFilename()));
 assert.ok((await fs.stat(path.join(out,clip.suggestedFilename()))).size>1000);
 assert.equal(await p.evaluate(()=>window.synthia.verifyReplay()),true);
 await p.click('#autonomy-save');await p.click('#production-release');await p.click('#autonomy-restore');
 assert.equal(await p.evaluate(()=>window.synthia.getState().entities.find(e=>e.id==='production').state.bindings.length),1);
 await p.locator('#swarm-config').setInputFiles(path.join(__dirname,'../examples/collective-world.json'));
 await p.waitForFunction(()=>window.synthia.getState().entities.some(e=>e.id==='autonomy.ember'));
 assert.equal(await p.evaluate(()=>window.synthia.getState().entities.some(e=>e.id==='autonomy.relay')),false);
 await p.fill('#production-samples',JSON.stringify(Array.from({length:12},(_,i)=>[i/7,3.7*i/7-1.2])));await p.click('#production-learn');
 await p.waitForFunction(()=>window.synthia.getState().entities.find(e=>e.id==='production').state.tasks[0]?.status==='completed');
 await p.click('#autonomy-toggle');
 await p.click('#swarm-config-undo');await p.waitForFunction(()=>window.synthia.getState().entities.some(e=>e.id==='autonomy.scout'));
 assert.equal(await p.evaluate(()=>window.synthia.verifyReplay()),true);
 assert.deepEqual(errors,[]);await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:path.join(out,'production.png'),fullPage:true});
 console.log(JSON.stringify({generatedFunction:true,formFeedback:true,png:true,video:true,checkpoint:true,replay:true,customWorld:true,output:out}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
