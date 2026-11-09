// Recovered from user-supplied Indiverse_Adaptive_Context_World_Source.zip, simulator-core.mjs.
// Same ConnectionNet implementation; scalar helpers retained locally.
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const sigmoid=x=>1/(1+Math.exp(-Math.max(-32,Math.min(32,x))));
/** Tiny real two-layer MLP trained with scalar-gradient backpropagation. */
export class ConnectionNet{
 constructor(input=8,hidden=10){
  this.input=input;this.hidden=hidden;
  let seed=318077; const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  this.w1=Array.from({length:hidden},()=>Array.from({length:input},()=> (rnd()-.5)*.6));
  this.b1=Array.from({length:hidden},()=> (rnd()-.5)*.1);
  this.w2=Array.from({length:hidden},()=> (rnd()-.5)*.35);
  this.b2=0.12;
 }
 forward(x){
  const hidden=this.w1.map((weights,k)=>Math.tanh(dot(weights,x)+this.b1[k]));
  return {hidden,y:sigmoid(dot(this.w2,hidden)+this.b2)};
 }
 predict(x){return this.forward(x).y;}
 train(x,target,lr=.09){
  const {hidden,y}=this.forward(x),error=y-target,d2=2*error*y*(1-y);
  const oldW2=this.w2.slice();
  for(let k=0;k<this.hidden;k++)this.w2[k]-=lr*d2*hidden[k];
  this.b2-=lr*d2;
  for(let k=0;k<this.hidden;k++){
   const d1=d2*oldW2[k]*(1-hidden[k]*hidden[k]);
   for(let d=0;d<this.input;d++)this.w1[k][d]-=lr*d1*x[d];
   this.b1[k]-=lr*d1;
  }
  return error*error;
 }
}
