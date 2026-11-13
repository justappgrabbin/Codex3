// Connect reviewed local-model work to the existing Android Accessibility hands.
export function validateHandsScope(value){
 const s=typeof value==='string'?JSON.parse(value):value;
 if(!s||typeof s.goal!=='string'||!s.goal.trim()||s.goal.length>4000)throw new Error('Hands needs a clear goal.');
 if(!Array.isArray(s.packages)||!s.packages.length||s.packages.length>8||!s.packages.every(p=>typeof p==='string'&&/^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$/.test(p)))throw new Error('List the exact Android packages this job may control.');
 if(!Number.isInteger(s.maxSteps)||s.maxSteps<1||s.maxSteps>30)throw new Error('Hands jobs need 1–30 steps.');
 const verbs=['launch','click','tap','swipe','press','type'];
 if(!Array.isArray(s.allowActions)||!s.allowActions.length||!s.allowActions.every(a=>verbs.includes(a)))throw new Error('Choose supported Hands actions.');
 if(typeof s.allowDeletion!=='boolean')throw new Error('Hands must explicitly state allowDeletion true or false.');
 const success=s.success;
 if(!success||typeof success!=='object'||(success.package!==undefined&&!s.packages.includes(success.package))||(success.textContains!==undefined&&(!Array.isArray(success.textContains)||success.textContains.length>8||!success.textContains.every(x=>typeof x==='string'&&x.trim()&&x.length<=300)))||(!success.package&&!success.textContains?.length))throw new Error('Define an observable success condition: an approved package and/or visible text.');
 return {goal:s.goal,packages:[...new Set(s.packages)],maxSteps:s.maxSteps,allowActions:[...new Set(s.allowActions)],allowDeletion:s.allowDeletion,success:{...(success.package?{package:success.package}:{}),...(success.textContains?.length?{textContains:success.textContains}: {})}};
}
export function handsContext(request,{native=globalThis.SynthiaAndroid,maxSteps=12}={}){
 if(!native?.mobileStatus)return {available:false,reason:'Android app required'};
 try{const status=JSON.parse(native.mobileStatus());const list=JSON.parse(native.mobileListApps());const words=String(request).toLowerCase().match(/[a-z0-9]{3,}/g)||[];const apps=(list.apps||[]).map(a=>({packageName:a.packageName,label:a.label})).sort((a,b)=>{const score=x=>words.filter(w=>(x.label+' '+x.packageName).toLowerCase().includes(w)).length;return score(b)-score(a);});let selected=[];for(const app of apps){if(JSON.stringify([...selected,app]).length>6500)break;selected.push(app);}return {available:status.ok&&status.connected,accessibilityConnected:status.connected,maxSteps,installedApps:selected,appsOmitted:apps.length-selected.length};}catch(e){return {available:false,reason:e.message};}
}
export async function waitForHands(taskId,{native=globalThis.SynthiaAndroid,onProgress=()=>{},timeoutMs=660000,delay=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 if(!native?.getHandsResult)throw new Error('Install the APK with the connected Hands executor.');const started=Date.now();
 while(Date.now()-started<timeoutMs){const result=JSON.parse(native.getHandsResult(taskId));if(result.complete)return result;onProgress('Hands: '+(result.phase||'running')+' · step '+(result.step||0));await delay(1000);}
 throw new Error('Hands completion could not be read. Inspect the persistent job result before retrying.');
}
export function startHands(job,config,{native=globalThis.SynthiaAndroid,maxSteps=12}={}){
 const scope=validateHandsScope(job.code);if(scope.maxSteps>maxSteps)throw new Error('This job exceeds your Hands step setting. Edit its scope or update the setting.');
 if(!job.approval||job.approval.revision!==job.revision)throw new Error('Approve this exact Hands job before running it.');
 if(scope.allowDeletion&&!job.approval.deletion)throw new Error('Deletion needs a separate explicit approval.');
 if(!native?.runHands)throw new Error('The Android Hands executor is unavailable in this host.');
 const result=JSON.parse(native.runHands(JSON.stringify({taskId:job.id,scope,provider:config.provider,model:config.model,deletionApproved:job.approval.deletion===true})));
 if(!result.ok)throw new Error(result.error||'Hands could not start.');return result;
}
export function handsScopeSchema(context={}){
 const packages=(context.installedApps||[]).map(a=>a.packageName);
 const packageType=packages.length?{type:'string',enum:packages}:{type:'string',pattern:'^[a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)+$'};
 return {type:'object',additionalProperties:false,required:['goal','packages','maxSteps','allowActions','allowDeletion','success'],properties:{goal:{type:'string',minLength:1},packages:{type:'array',minItems:1,maxItems:8,items:packageType},maxSteps:{type:'integer',minimum:1,maximum:context.maxSteps||12},allowActions:{type:'array',minItems:1,items:{type:'string',enum:['launch','click','tap','swipe','press','type']}},allowDeletion:{type:'boolean'},success:{type:'object',additionalProperties:false,required:['package'],properties:{package:packageType,textContains:{type:'array',items:{type:'string',minLength:1},maxItems:8}}}}};
}
export const HANDS_SCOPE_PROMPT='Return only the structured Android Hands scope for the user request. Use the supplied installed app package IDs exactly; never invent one. Include launch so the task can leave Synthia. maxSteps must respect deviceContext.maxSteps. allowDeletion must be false unless the user explicitly requested deleting/removing data; true never grants approval by itself. success.package is the target app. For merely opening an app omit textContains. For a task changing/reading UI include exact visible result text in success.textContains, not generic button text. No scripts or prose in place of the scope.';
export function normalizeHandsScope(scope,request){
 const text=String(request).trim();
 const openingOnly=/^(?:open|launch)\s+[^.!?\n]+[.!]?$/i.test(text)&&!/\b(and|then|calculate|type|enter|write|delete|remove|change|search|find|read|send)\b/i.test(text);
 const explicitForegroundOnly=/success requirement is only[^\n.]*foreground/i.test(text);
 // App launching is verified by the actual foreground package, never by a
 // generic app-name label that might not exist in the target's UI.
 return (openingOnly||explicitForegroundOnly)?{...scope,allowActions:['launch'],allowDeletion:false,success:{package:scope.success.package}}:scope;
}
