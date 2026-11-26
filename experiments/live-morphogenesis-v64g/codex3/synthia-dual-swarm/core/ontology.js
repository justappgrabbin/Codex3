// Source: user documents, source-1 and later source-2 terminology.
export const DIMENSIONS=Object.freeze({
 Movement:{question:'When',nature:'Energy',term:'Axiom',keynote:'I Define',color:'#f4ba75'},
 Evolution:{question:'What',nature:'Gravity',term:'Axion',keynote:'I Remember',color:'#bcabff'},
 Being:{question:'Where',nature:'Matter',term:'Arc-second',keynote:'I Am',color:'#86d3b0'},
 Design:{question:'Why',nature:'Structure',term:'Axis',keynote:'I Design',color:'#80c6e5'},
 Space:{question:'Who',nature:'Form',term:'Axon',keynote:'We Meet',color:'#f0d9a5'}
});
export const ACTIVE=Object.freeze(['Movement','Evolution','Being','Design']);
export const VERSION='synthia.dual.v1';
export function copy(value){return structuredClone(value);}
export function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export class CoreError extends Error{constructor(code,message,details={}){super(message);this.name='CoreError';this.code=code;this.details=details;}}
export function fail(code,message,details){throw new CoreError(code,message,details);}
export function validateAddress(address){
 if(!address||typeof address!=='object')fail('ADDRESS_REQUIRED','An explicit address is required');
 const bounds={gate:[1,64],line:[1,6],color:[1,6],tone:[1,6],base:[1,5],degree:[0,29],minute:[0,59],second:[0,59],arc:[0,99],zodiac:[1,12],house:[1,12]};
 for(const [key,[min,max]] of Object.entries(bounds))if(!Number.isInteger(address[key])||address[key]<min||address[key]>max)fail('DMSA_RANGE_ERROR',`${key}=${address[key]}; expected integer ${min}..${max}`,{field:key,received:address[key],permitted:[min,max],address:copy(address)});
 if(typeof address.filter!=='string'||!address.filter)fail('ADDRESS_FILTER_REQUIRED','A filter context is required');
 return copy(address);
}
// Demonstration addresses, never represented as calculated natal positions.
export function exampleAddress(gate=11){return {filter:'local-example',gate,line:1,color:1,tone:1,base:1,degree:0,minute:0,second:0,arc:0,zodiac:1,house:1,provenance:'authored-example; not an astronomical calculation'};}
export function validateQualities(q){if(!q||!ACTIVE.every(d=>Number.isFinite(q[d])&&q[d]>=0&&q[d]<=1))fail('QUALITY_RANGE','Four contributing qualities must be finite numbers in 0..1');return Object.fromEntries(ACTIVE.map(d=>[d,q[d]]));}
export function stable(value){if(Array.isArray(value))return '['+value.map(stable).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';return JSON.stringify(value);}
export function hash(value){const s=stable(value);let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}return (n>>>0).toString(16).padStart(8,'0');}
