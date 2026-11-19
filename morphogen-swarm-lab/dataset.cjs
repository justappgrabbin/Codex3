const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname,'swarm.js'),'utf8');
const dataset = vm.runInNewContext(source + `
  thesisRadii.map((radius, radiusIndex) => {
    const random = rand(41019 + radiusIndex);
    return formations.flatMap((name,label) => {
      const samples = [];
      for (let attempt = 0; samples.length < 120 && attempt < 10000; attempt++) {
        const agents = thesisSwarm(name,random);
        const {peers,edges} = neighborhoods(agents,radius*displayScale);
        const visited = new Set([0]);
        for (const i of visited) for (const j of peers[i]) visited.add(j);
        if (visited.size === agents.length) samples.push({
          label, edges, features:sense(agents,peers,[true,true,true,true])
        });
      }
      if (samples.length !== 120) throw new Error('Insufficient connected samples for '+name);
      return samples;
    });
  })
`);
process.stdout.write(JSON.stringify(dataset));
