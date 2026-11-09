import {LocalModel} from '../vendor/synthia-local/model.mjs';
import {validateProgram} from './production.js';

// Reuse Synthia's existing local transport. It only addresses embedded/loopback
// engines; model output remains a proposal subject to the ordinary rule gate.
export async function proposeLocalProgram(samples,config,{signal,model=null}={}){
 if(!Array.isArray(samples)||samples.length<6||samples.length>64||samples.some(s=>!Array.isArray(s)||s.length!==2||!s.every(Number.isFinite)||s.some(v=>Math.abs(v)>1000)))throw Error('Invalid local-model examples');
 const client=model||new LocalModel(config);
 const text=await client.ask([
  {role:'system',content:'Infer a numerical transformation from examples. Return only JSON {"program":[steps]}. Each step is {"op":"scale","value":number}, {"op":"bias","value":number}, {"op":"sin"} or {"op":"clamp"}. Steps operate sequentially on x; clamp clips to [-1,1]. Use 1 to 6 steps. Numeric parameters must be finite within [-100,100]. Do not return code, extra fields, explanations or commands. Your proposal will be executed against training and held-out examples before it can affect a scene.'},
  {role:'user',content:JSON.stringify({examples:samples.filter((_,i)=>i%3!==2)})}
 ],{json:true,signal,maxOutputTokens:512,schema:{type:'object',required:['program'],properties:{program:{type:'array'}}}});
 if(typeof text!=='string'||text.length>10000)throw Error('Invalid local model output');
 const result=JSON.parse(text.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
 return structuredClone(validateProgram(result.program));
}
