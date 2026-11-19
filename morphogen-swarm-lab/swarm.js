const rules = [
  ['Cohesion', 'At least two peers are within range.'],
  ['Closure', 'Two nearby peers share a link.'],
  ['Reach', 'A peer can introduce a new neighbor.'],
  ['Alignment', 'Nearby peers move in a similar direction.']
];
const formations = ['Triangle','Square','Pentagon','Hexagon','Star','Y-Shape','Plus','Kite','Binary-Tree','Hourglass'];
const tau = 2 * Math.PI;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const rand = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const thesisRadii = [1.2, 1.6, 2.5];
const displayScale = .36;
const fixed = [
  [[0,0], ...Array.from({length:5}, (_, i) => {
    const angle = i*tau/5;
    return [1.12*Math.cos(angle), 1.12*Math.sin(angle)];
  })],
  [[0,0],[0,-1],[0,-1.78],[-.87,.5],[-1.54,.89],[.87,.5],[1.54,.89]],
  [[0,0],[-1,0],[1,0],[0,1],[0,-1]],
  [[0,-.82],[-.78,0],[.78,0],[0,.62],[0,1.57]],
  [[0,-.76],[-.68,-.09],[.68,-.09],[-1.18,.75],[-.24,.75],[.24,.75],[1.18,.75]],
  [[0,0],[-.55,-.9],[.55,-.9],[-.55,.9],[.55,.9]]
];
function thesisSwarm(name, random = null) {
  const index = formations.indexOf(name);
  const count = index + 3;
  const radius = .5 / Math.sin(Math.PI / count);
  const points = index >= 4 ? fixed[index-4] : Array.from({length:count}, (_, i) =>
    [radius*Math.cos(i*tau/count), radius*Math.sin(i*tau/count)]);
  const scale = random ? .75 + random()*.5 : 1;
  const noise = () => random ? .06*Math.sqrt(-2*Math.log(1-random()))*Math.cos(tau*random()) : 0;
  return points.map(([x,y]) => ({
    x:(x*scale+noise())*displayScale, y:(y*scale+noise())*displayScale,
    vx:0, vy:0, value:0, bits:[0,0,0,0]
  }));
}
function seedSwarm(preset, seed = 71) {
  const random = rand(seed);
  if (formations.includes(preset)) return thesisSwarm(preset);
  const count = 84;
  return Array.from({length:count}, (_, i) => {
    const j = Math.floor(i / 3) / 27;
    let position;
    const angle = i*tau/count;
    if (preset === 'Ring') position = [Math.cos(angle), Math.sin(angle)].map(x => x * (.53 + random()*.13));
    else if (preset === 'Scatter') position = [(random()-.5)*1.8,(random()-.5)*1.45];
    else {
      const a = i % 3 * tau / 3 + j * 2.9;
      const r = .07 + j * .74;
      position = [Math.cos(a)*r, Math.sin(a)*r*.85];
    }
    const [x,y] = position.map(x => x + (random()-.5)*(.095));
    return {x,y,vx:-y*.065,vy:x*.065, value:0, bits:[0,0,0,0]};
  });
}
function neighborhoods(agents, radius) {
  const peers = agents.map(() => new Set());
  const edges = [];
  for (let i=0;i<agents.length;i++) {
    for (let j=i+1;j<agents.length;j++) {
      if (Math.hypot(agents[i].x-agents[j].x,agents[i].y-agents[j].y) <= radius) {
        peers[i].add(j);
        peers[j].add(i);
        edges.push([i,j]);
      }
    }
  }
  return {peers,edges};
}
function sense(agents, peers, mask) {
  return agents.map((agent,i) => {
    const near = [...peers[i]];
    const bits = [
      near.length >= 2,
      near.some(j => near.some(k => peers[j].has(k))),
      near.some(j => [...peers[j]].some(k => k !== i && !peers[i].has(k))),
      near.filter(j => {
        const peer = agents[j];
        const speeds = Math.hypot(peer.vx,peer.vy)*Math.hypot(agent.vx,agent.vy);
        return speeds > 1e-8 && (peer.vx*agent.vx+peer.vy*agent.vy)/speeds > .7;
      }).length > near.length/2
    ].map((bit,k) => Number(bit && mask[k]));
    const [a,b,c,d] = bits;
    return [a,b,c,d,.27*a*b + .25*a*c + .22*b*d + .16*c*d + .10*a*b*c*d];
  });
}
function average(rows, peers) {
  return rows.map((row,i) => row.map((value,k) => {
    for (const j of peers[i]) value += rows[j][k];
    return value / (peers[i].size+1);
  }));
}
function gossip(rows, peers) {
  for (let round=0;round<5;round++) rows = average(rows,peers);
  return rows;
}
function predict(features, peers, layers) {
  function project(rows, {weights, bias}, relu = true) {
    return rows.map(row => bias.map((offset,j) => {
      const value = row.reduce((sum,input,k) => sum + input*weights[k][j], offset);
      return relu ? Math.max(0,value) : value;
    }));
  }
  let rows = features;
  for (const layer of layers.slice(0,3)) rows = project(average(rows,peers),layer);
  const hidden = project(gossip(rows,peers),layers[3]);
  return project(hidden,layers[4],false).map(scores => formations[scores.indexOf(Math.max(...scores))]);
}
function step(agents, {radius, mask, influence}) {
  const {peers} = neighborhoods(agents,radius);
  const features = sense(agents,peers,mask);
  const values = gossip(features.map(row => [row[4]]),peers);
  return agents.map((agent,i) => {
    const [value] = values[i];
    let fx=0, fy=0;
    for (const j of peers[i]) {
      const peer = agents[j];
      const dx=peer.x-agent.x, dy=peer.y-agent.y;
      const distance=Math.max(.002, Math.hypot(dx,dy));
      const spacing = .10 + value*.09;
      const force = clamp((distance-spacing)*.32,-.12,.11);
      fx += force*dx/distance - dy*value*.14 + (peer.vx-agent.vx)*.08;
      fy += force*dy/distance + dx*value*.14 + (peer.vy-agent.vy)*.08;
    }
    const n = Math.max(1,peers[i].size);
    let vx = clamp(agent.vx*.96 + fx/n*influence*.34,-.12,.12);
    let vy = clamp(agent.vy*.96 + fy/n*influence*.34,-.12,.12);
    let x=agent.x+vx*.028, y=agent.y+vy*.028;
    if (Math.abs(x)>1.08) vx *= -.7;
    if (Math.abs(y)>.86) vy *= -.7;
    return {...agent, x:clamp(x,-1.08,1.08), y:clamp(y,-.86,.86), vx,vy,value,bits:features[i].slice(0,4)};
  });
}

// An assigned agent retains its task and steers toward the task's location.
function rebalanceOverlay(agents, tasks, assignments, radius) {
  const {peers} = neighborhoods(agents, radius);
  const retained = new Map();
  const occupied = new Set();
  for (const task of tasks) {
    const candidates = agents.flatMap((agent,i) => {
      if (occupied.has(i)) return [];
      const distance = Math.hypot(agent.x-task.x,agent.y-task.y);
      if (distance > radius) return [];
      const nearby = [...peers[i]].filter(j => occupied.has(j)).length;
      return [{i, score:distance - agent.value*.1 + nearby*.03 - (assignments.get(task.id) === i ? .18 : 0)}];
    });
    candidates.sort((a,b) => a.score - b.score || a.i - b.i);
    if (candidates.length === 0) continue;
    retained.set(task.id,candidates[0].i);
    occupied.add(candidates[0].i);
  }
  return retained;
}
