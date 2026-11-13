// Later-tradition dimensions (Wing / Yiweishu / Han and after), kept apart from the Zhouyi.
// Source: Robert Hatcher, "Image and Number" structure notes. Same bit convention as zhouyi.js.
import {figureOf,gateOf,lower,upper,nuclear} from './zhouyi.js';
export const ERA=Object.freeze({jiaoGua:'Han',huGua:'Han',twelveBranches:'Yiweishu',xianTian:'post-Han (Shao Yong)'});
// Reverse (Jiao Gua): swap the trigrams.
export const jiaoGua=gate=>{const f=figureOf(gate);return gateOf(upper(f)|(lower(f)<<3));};
// Nuclear (Hu Gua): lines 2-4 below, 3-5 above.
export const huGua=gate=>{const n=nuclear(figureOf(gate));return gateOf(n.lower|(n.upper<<3));};
// Twelve branches: from Kun flip lines 1->6 to reach Qian, then 1->6 again to return.
export function twelveBranches(){let f=0;const out=[];for(let k=0;k<12;k++){f^=1<<(k%6);out.push(gateOf(f));}return out;}
// Xian Tian binary value: line 1 = 32 ... line 6 = 1 (bottom most significant).
export const xianTianValue=gate=>{const f=figureOf(gate);let v=0;for(let i=0;i<6;i++)v|=((f>>i)&1)<<(5-i);return v;};
