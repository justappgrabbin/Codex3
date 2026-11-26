// Bit zero / changing line one comes first throughout the compiler.
const widths=new Set([2,3,6]);
export function wordToBoolean(word,width=6){
 if(!widths.has(width)||!Number.isInteger(word)||word<0||word>=(1<<width))throw Error('Invalid Boolean word or width');
 return Array.from({length:width},(_,bit)=>!!(word&(1<<bit)));
}
export function booleanToWord(vector,width=6){
 if(!widths.has(width)||!Array.isArray(vector)||vector.length!==width||vector.some(bit=>typeof bit!=='boolean'))throw Error('Expected a strict Boolean state vector');
 return vector.reduce((word,bit,i)=>word|(bit?1<<i:0),0);
}
export function xorBoolean(a,b){return applyBoolean('xor',a,b);}
export function andBoolean(a,b){return applyBoolean('and',a,b);}

// The user's existing Generative-address-system is the operator authority.
// Arrays preserve line order; its integer normalizer is intentionally not used.
export {BINARY_BOOLEAN_FUNCTIONS,BOOLEAN_ALIASES} from '../vendor/generative-state-space/boolean-ato.mjs';
import {BINARY_BOOLEAN_FUNCTIONS,canonicalBooleanOperator,applyBinary} from '../vendor/generative-state-space/boolean-ato.mjs';
export function requireBooleanOperator(name){
 if(typeof name!=='string')throw Error('Boolean operator must be named');
 const mode=canonicalBooleanOperator(name);if(!BINARY_BOOLEAN_FUNCTIONS.includes(mode))throw Error('Unknown generative Boolean operator: '+name);return mode;
}
export function applyBoolean(name,a,b){
 const mode=requireBooleanOperator(name);
 if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length>4096||a.length!==b.length||a.some(x=>typeof x!=='boolean')||b.some(x=>typeof x!=='boolean'))throw Error('Expected equal strict Boolean vectors');
 return applyBinary(mode,a,b).map(Boolean);
}
