import {quantizeRows,int8Predict} from './quantized-weights.js';
import {stepSixBitSwarm} from './six-bit-swarm.js';
const clamp=x=>Math.max(0,Math.min(1,x));
function inputPoint(point){if(!Array.isArray(point)||point.length!==4||point.some(x=>!Number.isFinite(x)||Math.abs(x)>1000))throw Error('Visual point requires finite [x,y,z,time]');}
function validateSamples(samples){if(!Array.isArray(samples)||samples.length<8||samples.length>4096)throw Error('Visual training requires 8–4096 samples per job');const seen=new Set();for(const row of samples){inputPoint(row?.point);if(!Array.isArray(row.rgba)||row.rgba.length!==4||row.rgba.some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('Visual target requires normalized RGBA');const key=JSON.stringify(row.point);if(seen.has(key))throw Error('Duplicate sample coordinates would leak into evaluation');seen.add(key);}}
function features(topology,point){
 inputPoint(point);const x=point.map((v,i)=>(v-topology.center[i])/topology.scale[i]),raw=topology.nodes.map(n=>{const r=n.position.reduce((sum,v,i)=>sum+(x[i]-v)**2,0);return Math.exp(-r/2)*(1+.1*n.activation+.1*n.word/63);}),routed=[...raw];
 for(const edge of topology.edges){const a=topology.index[edge.a],b=topology.index[edge.b];if(a===undefined||b===undefined)continue;const gain=.2*edge.weight;routed[a]+=gain*raw[b];routed[b]+=gain*raw[a];}
 return [1,...x,...x.map(v=>Math.sin(v)),...routed,...routed.map(v=>v*x[3])];
}
const predictRows=(rows,x)=>rows.map(row=>row.reduce((sum,w,i)=>sum+w*x[i],0));
function loss(model,rows,quantized=false){return rows.reduce((sum,r)=>{const x=features(model.topology,r.point),output=quantized?int8Predict(model.quantized,x):predictRows(model.weights,x);return sum+output.reduce((n,v,i)=>n+(clamp(v)-r.rgba[i])**2,0)/4;},0)/rows.length;}
export class VisualField {
 constructor(swarm){this.swarm=swarm;this.core=swarm.core;}
 get state(){return this.swarm.state.visualField||null;}
 queue({samples,epochs=120,rate=.04,maxQuantizationMse=.002,maxReconstructionMse=.02,referenceFrame=null}={}){
  validateSamples(samples);if(!this.swarm.rules.sixBit?.enabled)throw Error('Enable six-bit swarm before visual training');
  if(!Number.isInteger(epochs)||epochs<1||epochs>1000||!Number.isFinite(rate)||rate<=0||rate>.2||!Number.isFinite(maxQuantizationMse)||maxQuantizationMse<0||maxQuantizationMse>.1||!Number.isFinite(maxReconstructionMse)||maxReconstructionMse<0||maxReconstructionMse>1)throw Error('Invalid training controls');
  if(referenceFrame!==null&&(!Number.isInteger(referenceFrame.width)||!Number.isInteger(referenceFrame.height)||referenceFrame.width<1||referenceFrame.height<1||referenceFrame.width*referenceFrame.height>65536))throw Error('Invalid visual reference dimensions');
  if(this.state?.status==='training')throw Error('A visual training job is already active');
  if(!this.swarm.state.sixBit||this.swarm.agents().some(a=>!Number.isInteger(a.state.word)))stepSixBitSwarm(this.swarm);
  const agents=this.swarm.agents();if(!agents.length)throw Error('Visual training needs active swarm particles');
  const train=samples.filter((_,i)=>i%5!==0),validation=samples.filter((_,i)=>i%5===0),center=[0,1,2,3].map(i=>train.reduce((sum,r)=>sum+r.point[i],0)/train.length),scale=center.map((c,i)=>Math.max(1,...train.map(r=>Math.abs(r.point[i]-c))));
  const nodes=agents.map(a=>({id:a.id,position:(a.state.position3D||[a.state.position,0,0]).map((v,i)=>Math.max(-3,Math.min(3,(v-center[i])/scale[i]))),word:a.state.word,activation:a.state.neuralActivation||0}));
  const topology={nodes,edges:structuredClone(this.swarm.state.sixBit.edges),index:Object.fromEntries(nodes.map((n,i)=>[n.id,i])),center,scale,sourceTick:this.swarm.state.tick};
  const weights=Array.from({length:4},()=>Array(9+nodes.length*2).fill(0)),model={schema:'synthia.swarm-visual/v1',status:'training',referenceFrame,topology,weights,epochs,epoch:0,cursor:0,rate,maxQuantizationMse,maxReconstructionMse,updates:0,scope:'coordinate-conditioned RGBA field; depth/camera recovery and photorealism unverified'};
  model.metrics={before:loss(model,validation),validationSamples:validation.length,trainingSamples:train.length};
  this.core.change('autonomy',{visualField:model,visualObservations:{train,validation}},'visual reconstruction training queued on measured swarm topology');
 }
 tick(){
  if(this.state?.status!=='training')return false;const model=structuredClone(this.state),observations=this.swarm.state.visualObservations;if(!observations)throw Error('Visual observations missing');
  // A job is sliced across service ticks; a slice always has the same update budget.
  for(let i=0;i<256&&model.epoch<model.epochs;i++){
   const row=observations.train[model.cursor],x=features(model.topology,row.point),out=predictRows(model.weights,x),norm=1+x.reduce((n,v)=>n+v*v,0);
   for(let c=0;c<4;c++){const delta=model.rate*(out[c]-row.rgba[c])/norm;for(let j=0;j<x.length;j++)model.weights[c][j]-=delta*x[j];}
   model.updates++;model.cursor++;if(model.cursor===observations.train.length){model.cursor=0;model.epoch++;}
  }
  if(model.epoch===model.epochs){
   model.quantized=quantizeRows(model.weights);const fpMse=loss(model,observations.validation),int8Mse=loss(model,observations.validation,true);
   model.metrics={...model.metrics,fpMse,int8Mse,quantizationIncrease:int8Mse-fpMse,improved:int8Mse<model.metrics.before,parameterBytes:model.quantized.parameterBytes,float32ParameterBytes:model.quantized.rows*model.quantized.columns*4};
   model.status=int8Mse-fpMse>model.maxQuantizationMse?'quantization-rejected':int8Mse>model.maxReconstructionMse?'reconstruction-insufficient':'ready';
   if(model.status==='ready')delete model.weights;else delete model.quantized;
   delete model.train;delete model.validation;
  }
  this.core.change('autonomy',{visualField:model,...(model.status==='training'?{}:{visualObservations:null})},'reconstruction error trains readout; held-out INT8 quality gate controls acceptance');return true;
 }
 sample(point){const model=this.state;if(model?.status!=='ready')throw Error('No accepted quantized visual model');return int8Predict(model.quantized,features(model.topology,point)).map(clamp);}
 frame({width=this.state?.referenceFrame?.width||32,height=this.state?.referenceFrame?.height||32,z=0,time=0,xRange=[-1,1],yRange=[-1,1]}={}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>65536)throw Error('Frame dimensions exceed per-request allocation budget');
  for(const range of [xRange,yRange])if(!Array.isArray(range)||range.length!==2||range.some(x=>!Number.isFinite(x)||Math.abs(x)>1000)||range[0]>range[1])throw Error('Invalid frame coordinate range');
  const rgba=[];for(let y=0;y<height;y++)for(let x=0;x<width;x++)rgba.push(...this.sample([xRange[0]+(xRange[1]-xRange[0])*x/Math.max(1,width-1),yRange[0]+(yRange[1]-yRange[0])*y/Math.max(1,height-1),z,time]).map(v=>Math.round(v*255)));
  return {width,height,time,z,rgba,format:'rgba8',projection:'coordinate slice; not a recovered perspective camera'};
 }
}
