import {writeFile} from 'node:fs/promises';
import {World} from '../core/world.js';
import {AssemblyLearner} from '../core/assembly-learning.js';
const world=new World(),learner=AssemblyLearner.fromRelations(world.core),metrics=learner.train(),state=learner.export();
const data={input:8,hidden:state.b1.length,w1:state.w1.flat(),b1:state.b1,w2:state.w2,b2:state.b2,edges:state.edges.map(({from,to,logit})=>({from,to,logit})),beforeCost:metrics.before.cost,afterCost:metrics.after.cost,provenance:'causal-cluster-network/v1; local simulated assembly trials; no learned character geometry'};
await writeFile(new URL('../../synthia-unity/Assets/Resources/assembly-controller.json',import.meta.url),JSON.stringify(data,null,2));
console.log('Exported trained controller:',data.hidden,'cluster neurons,',data.edges.length,'relations. Held-out cost',data.beforeCost,'→',data.afterCost);
