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
export function xorBoolean(a,b){booleanToWord(a,a.length);booleanToWord(b,a.length);return a.map((bit,i)=>bit!==b[i]);}
export function andBoolean(a,b){booleanToWord(a,a.length);booleanToWord(b,a.length);return a.map((bit,i)=>bit&&b[i]);}
