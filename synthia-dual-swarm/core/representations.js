const NATO='Alfa Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliett Kilo Lima Mike November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey X-ray Yankee Zulu'.split(' ');
const EXTRA={ß:'ss',ẞ:'SS',æ:'ae',Æ:'AE',œ:'oe',Œ:'OE',ø:'o',Ø:'O',ł:'l',Ł:'L',đ:'d',Đ:'D',ð:'d',Ð:'D',þ:'th',Þ:'Th'};
// Deliberately bounded character transliteration, not language-aware translation.
const source='αβγδεζηθικλμνξοπρσςτυφχψωабвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const target=['a','b','g','d','e','z','i','th','i','k','l','m','n','x','o','p','r','s','s','t','y','f','ch','ps','o','a','b','v','g','d','e','yo','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','kh','ts','ch','sh','shch','','y','','e','yu','ya'];
const MAP={...EXTRA};[...source].forEach((c,i)=>{MAP[c]=target[i];MAP[c.toUpperCase()]=target[i]?target[i][0].toUpperCase()+target[i].slice(1):'';});
function latin(text){return [...text.normalize('NFKD')].map(c=>/[\u0300-\u036f]/.test(c)?'':MAP[c]??c).join('');}
export function representText(text){
 if(typeof text!=='string'||text.length>4096)throw Error('Text must contain at most 4096 UTF-16 units');
 const bytes=[],points=[];for(const c of text){const n=c.codePointAt(0);if(n>=0xd800&&n<=0xdfff)throw Error('Unpaired Unicode surrogate');points.push('U+'+n.toString(16).toUpperCase().padStart(4,'0'));if(n<128)bytes.push(n);else if(n<2048)bytes.push(192|(n>>6),128|(n&63));else if(n<65536)bytes.push(224|(n>>12),128|((n>>6)&63),128|(n&63));else bytes.push(240|(n>>18),128|((n>>12)&63),128|((n>>6)&63),128|(n&63));}
 const transliteration=latin(text),unmapped=[...new Set([...transliteration].filter(c=>c.codePointAt(0)>127))];
 return {text,unicode:points,utf8:bytes,binary:bytes.map(n=>n.toString(2).padStart(8,'0')).join(' '),ascii:[...text].every(c=>c.codePointAt(0)<128)?text:null,transliteration,unmapped,nato:[...transliteration].map(c=>/[a-z]/i.test(c)?NATO[c.toUpperCase().charCodeAt(0)-65]:c===' '?' / ':c).join(' ')};
}
export function representBytes(bytes){
 if(!Array.isArray(bytes)||bytes.some(b=>!Number.isInteger(b)||b<0||b>255))throw Error('Invalid UTF-8 bytes');
 let text='';for(let i=0;i<bytes.length;){const a=bytes[i++];let n,count,min;if(a<128){n=a;count=0;min=0;}else if(a>=194&&a<=223){n=a&31;count=1;min=128;}else if(a>=224&&a<=239){n=a&15;count=2;min=2048;}else if(a>=240&&a<=244){n=a&7;count=3;min=65536;}else throw Error('Invalid UTF-8 sequence');for(let k=0;k<count;k++){const b=bytes[i++];if(b===undefined||(b&192)!==128)throw Error('Incomplete or invalid UTF-8 sequence');n=n*64+(b&63);}if(n<min||n>0x10ffff||(n>=0xd800&&n<=0xdfff))throw Error('Invalid Unicode scalar');text+=String.fromCodePoint(n);}
 return representText(text);
}
