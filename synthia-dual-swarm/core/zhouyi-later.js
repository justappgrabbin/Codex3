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

// ---- Wing-era line virtues (Yao De), by rule; Hatcher: none of these are in the Zhouyi ----
const bit=(f,l)=>(f>>(l-1))&1;
export const pangTong=gate=>gateOf(figureOf(gate)^63);              // opposite, sums to 63
export const zhong=line=>line===2||line===5;                          // central place
export const dang=(gate,line)=>bit(figureOf(gate),line)===(line%2);   // yang in odd, yin in even
export const ying=(gate,line)=>{const p=line>3?line-3:line+3,f=figureOf(gate);return bit(f,line)!==bit(f,p);}; // 1-4, 2-5, 3-6 answer
export const bi=(gate,line)=>{const f=figureOf(gate);return [line-1,line+1].filter(n=>n>=1&&n<=6&&bit(f,n)!==bit(f,line));}; // unlike neighbours
export function yaoDe(gate,line){return {zhong:zhong(line),dang:dang(gate,line),ying:ying(gate,line),bi:bi(gate,line)};}
// San Cai (Wing): lines 1-2 earth, 3-4 human, 5-6 heaven.
export const sanCai=line=>['earth','earth','human','human','heaven','heaven'][line-1];
// Ban Xiang: the two trigrams as inner/outer.
export const banXiang=gate=>{const f=figureOf(gate);return {inner:{trigram:lower(f),reads:'inner, coming, who'},outer:{trigram:upper(f),reads:'outer, going, how'}};};
// Binomial expression (A+B)^n: how many figures of n lines have k yang lines.
export function binomial(n){const r=[1];for(let k=1;k<=n;k++)r.push(r[k-1]*(n-k+1)/k);return r;}
