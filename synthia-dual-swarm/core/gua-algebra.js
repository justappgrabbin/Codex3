// Boolean algebra of the gua, after Andreas Schöter, "Boolean Algebra and the Yijing"
// (The Oracle 2:7, 1998). Kept separate from zhouyi.js: Schöter writes about the whole
// Yijing tradition, not the Zhouyi text. Same bit convention: bit 0 = bottom line.
// Schöter writes gua bottom line first, left to right ("100" = the Arousing).
export const fromSchoter=s=>[...s].reduce((f,c,i)=>f|((c==='1'?1:0)<<i),0);
export const toSchoter=(f,n=6)=>Array.from({length:n},(_,i)=>(f>>i)&1).join('');
const mask=n=>(1<<n)-1;
// The four combinatory operations (Table 1); not is the structural complement.
export const not=(x,n=6)=>(~x)&mask(n), or=(x,y)=>x|y, and=(x,y)=>x&y, xor=(x,y)=>x^y;
// Induced partial order (Def. 5): x <= y iff x or y = y. Level in the lattice = yang count.
export const leq=(x,y)=>(x|y)===y;
export const level=x=>{let c=0;for(;x;x&=x-1)c++;return c;};
// Change (Def. 9): the context of G changing into R is G xor R; applying it to G gives R.
export const change=(g,r)=>g^r;
// Sequences (Def. 6): Rising Yang counts with the bottom line least significant;
// Sinking Yang with the top line least significant (Shao Yong's Xiantian order).
export const risingYang=(n=3)=>Array.from({length:1<<n},(_,v)=>v);
export const sinkingIndex=(f,n=6)=>Array.from({length:n},(_,i)=>(f>>i)&1).reduce((v,b)=>(v<<1)|b,0);
export const fromSinkingIndex=(v,n=6)=>Array.from({length:n},(_,i)=>(v>>(n-1-i))&1).reduce((f,b,i)=>f|(b<<i),0);
export const sinkingYang=(n=3)=>Array.from({length:1<<n},(_,v)=>fromSinkingIndex(v,n));
// Cleary's Primal Correlate (Def. 8), computed on the Sinking Yang index.
export function primalCorrelate(f){
 if(f===63)return 0;if(f===0)return 63;
 const N=sinkingIndex(f);return fromSinkingIndex((f&1)?N-31:N+31);
}
