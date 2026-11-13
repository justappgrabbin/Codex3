// Portable INT8 parameters; JavaScript floating-point accumulation. No JIT/code generation.
const decoded=new WeakMap();
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function encode(bytes){let out='';for(let i=0;i<bytes.length;i+=3){const n=(bytes[i]<<16)|((bytes[i+1]||0)<<8)|(bytes[i+2]||0);out+=alphabet[(n>>>18)&63]+alphabet[(n>>>12)&63]+(i+1<bytes.length?alphabet[(n>>>6)&63]:'=')+(i+2<bytes.length?alphabet[n&63]:'=');}return out;}
function decode(text){if(typeof text!=='string'||text.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text))throw Error('Invalid INT8 payload');const bytes=[];for(let i=0;i<text.length;i+=4){const n=(alphabet.indexOf(text[i])<<18)|(alphabet.indexOf(text[i+1])<<12)|((text[i+2]==='='?0:alphabet.indexOf(text[i+2]))<<6)|(text[i+3]==='='?0:alphabet.indexOf(text[i+3]));bytes.push((n>>>16)&255);if(text[i+2]!=='=')bytes.push((n>>>8)&255);if(text[i+3]!=='=')bytes.push(n&255);}return Int8Array.from(bytes);}
export function quantizeRows(rows){
 if(!Array.isArray(rows)||!rows.length||rows.length>64||!Array.isArray(rows[0])||!rows[0].length||rows[0].length>512||rows.some(r=>!Array.isArray(r)||r.length!==rows[0].length||r.some(x=>!Number.isFinite(x))))throw Error('Invalid model weight matrix');
 const scales=rows.map(row=>Math.max(...row.map(Math.abs))/127||1),weights=[];rows.forEach((row,i)=>row.forEach(w=>weights.push(Math.max(-127,Math.min(127,Math.round(w/scales[i])))&255)));
 return {format:'synthia.int8-rows/v1',rows:rows.length,columns:rows[0].length,scales,data:encode(weights),parameterBytes:weights.length+4*scales.length};
}
export function int8Predict(model,input){
 if(model?.format!=='synthia.int8-rows/v1'||!Number.isInteger(model.rows)||model.rows<1||model.rows>64||!Number.isInteger(model.columns)||model.columns<1||model.columns>512||!Array.isArray(model.scales)||model.scales.length!==model.rows||model.scales.some(s=>!Number.isFinite(s)||s<=0)||!Array.isArray(input)||input.length!==model.columns||input.some(x=>!Number.isFinite(x)))throw Error('Invalid quantized model or input');
 if(typeof model.data!=='string'||model.data.length!==4*Math.ceil(model.rows*model.columns/3))throw Error('Invalid weight payload length');
 let cached=decoded.get(model);if(!cached||cached.data!==model.data){cached={data:model.data,weights:decode(model.data)};decoded.set(model,cached);}const weights=cached.weights;if(weights.length!==model.rows*model.columns)throw Error('Invalid weight payload length');
 return model.scales.map((scale,row)=>{let sum=0;for(let j=0;j<input.length;j++)sum+=weights[row*input.length+j]*input[j];return sum*scale;});
}
