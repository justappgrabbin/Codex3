
const el = id => document.getElementById(id);
const field = el('field');
const historyCanvas = el('history');
let radiusIndex = 0;
const options = {radius:thesisRadii[radiusIndex]*displayScale, influence:.85, mask:[true,true,true,true]};
let preset = 'Spiral', agents, selected, tick, samples, labels, frame, drag;
let overlayTasks = [], overlayAssignments = new Map(), overlayRender = null;
let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
const switches = rules.map(([name, description], i) => {
  const row = document.createElement('label');
  row.className = 'rule';
  row.innerHTML = `<span class="ruleSymbol" aria-hidden="true">${['◉','◇','△','＋'][i]}</span>
    <span><strong>R${i+1} &nbsp; ${name}</strong><small>${description}</small></span>
    <output class="bit" aria-label="Selected agent binary value">0</output><input class="toggle" type="checkbox" role="switch" aria-label="${name}" checked>`;
  el('rules').append(row);
  row.querySelector('input').addEventListener('change', event => {
    options.mask[i] = event.target.checked;
    configure();
    drawField();
  });
  return row.querySelector('output');
});
for (const name of formations) el('formations').add(new Option(name, name));

function setRunning(value) {
  running = value;
  el('status').classList.toggle('paused', !value);
  el('status').innerHTML = '<i></i>' + (value ? 'LIVE SIMULATION' : 'SIMULATION PAUSED');
  el('play').classList.toggle('active', value);
  el('pause').classList.toggle('active', !value);
  el('play').setAttribute('aria-pressed', value);
  el('pause').setAttribute('aria-pressed', !value);
}
function setOverlayTasks(tasks, render) {
  overlayTasks = tasks;
  overlayRender = render;
  updateOverlay();
  updateInspector(false);
  drawField();
}
function updateOverlay() {
  overlayAssignments = overlayTasks.length ?
    rebalanceOverlay(agents,overlayTasks,overlayAssignments,options.radius) : new Map();
  overlayRender?.(overlayTasks,overlayAssignments);
}
function configure(record = true) {
  const {peers} = neighborhoods(agents, options.radius);
  const features = sense(agents, peers, options.mask);
  const values = gossip(features.map(row => [row[4]]), peers);
  labels = predict(features, peers, trainedModels[thesisRadii[radiusIndex]]);
  agents.forEach((agent,i) => {
    agent.bits = features[i].slice(0,4);
    agent.value = values[i][0];
  });
  updateOverlay();
  updateInspector(record);
}
function updateInspector(record) {
  const agent = agents[selected];
  switches.forEach((bit,i) => {bit.textContent = agent.bits[i];});
  el('value').textContent = agent.value.toFixed(3);
  const task = overlayTasks.find(task => overlayAssignments.get(task.id) === selected);
  el('agentLabel').textContent = 'Agent ' + String(selected+1).padStart(2,'0') + (task ? ' · ' + task.description : '');
  el('agentLabel').title = task?.description ?? '';
  el('prediction').textContent = labels[selected];
  el('agreement').textContent = labels.every(label => label === labels[0]) ? labels[0] : 'No consensus';
  if (record) {
    samples.push(agent.value);
    if (samples.length > 100) samples.shift();
  }
  drawHistory();
}
function restart() {
  agents = seedSwarm(preset);
  overlayAssignments = new Map();
  selected = agents.length > 10 ? 22 : 0;
  tick = 0;
  drag = null;
  samples = [];
  configure();
  el('formations').value = formations.includes(preset) ? preset : '';
  for (const button of document.querySelectorAll('[data-preset]')) {
    const active = button.dataset.preset === preset;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  }
  drawField();
}
function canvasContext(canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight, dpr = devicePixelRatio || 1;
  if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) {
    canvas.width = Math.round(w*dpr);
    canvas.height = Math.round(h*dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,w,h};
}
function drawHistory() {
  const {ctx,w,h} = canvasContext(historyCanvas);
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = '#34325d';
  ctx.setLineDash([3,3]);
  for (let i=0;i<=4;i++) {
    ctx.beginPath(); ctx.moveTo(0, 3+i*(h-6)/4); ctx.lineTo(w,3+i*(h-6)/4); ctx.stroke();
  }
  ctx.setLineDash([]);
  const points = samples.length === 1 ? [samples[0], samples[0]] : samples;
  const y = val => h-4-val*(h-8);
  const x = i => w-2 - (points.length-1-i)*(w-4)/99;
  ctx.beginPath();
  points.forEach((val,i) => i ? ctx.lineTo(x(i),y(val)) : ctx.moveTo(x(i),y(val)));
  ctx.strokeStyle = '#ba8bff'; ctx.lineWidth = 1.7; ctx.stroke();
  ctx.lineTo(w-2,h); ctx.lineTo(x(0),h); ctx.closePath();
  const gradient = ctx.createLinearGradient(0,0,0,h);
  gradient.addColorStop(0,'#9c60ff65'); gradient.addColorStop(1,'#9c60ff06');
  ctx.fillStyle = gradient; ctx.fill();
  ctx.fillStyle = '#e4d1ff'; ctx.beginPath(); ctx.arc(w-3,y(points.at(-1)),2.5,0,Math.PI*2); ctx.fill();
}
function drawField() {
  const {ctx,w,h} = canvasContext(field);
  const scale = Math.min(w/2.2,h/1.74);
  frame = {w,h,scale};
  ctx.clearRect(0,0,w,h);
  const cx=w/2, cy=h/2;
  const haze=ctx.createRadialGradient(cx,cy,0,cx,cy,scale);
  haze.addColorStop(0,'#25205c'); haze.addColorStop(1,'#080b20');
  ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#524e83';
  for(let x=12;x<w;x+=19) for(let y=12;y<h;y+=19) ctx.fillRect(x,y,1,1);
  ctx.strokeStyle='#635da443';
  for(let i=1;i<=5;i++) {
    ctx.beginPath();ctx.arc(cx,cy,scale*.19*i,0,Math.PI*2);ctx.stroke();
  }
  ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();ctx.setLineDash([]);
  const {edges} = neighborhoods(agents,options.radius);
  const positions = agents.map(agent => [cx+agent.x*scale,cy+agent.y*scale]);
  const opacity = Math.min(1, agents.length * 8 / Math.max(1,edges.length));
  for (const [i,j] of edges) {
    const energy=(agents[i].value+agents[j].value)/2;
    ctx.strokeStyle=`rgba(157,111,255,${(.10+.30*energy)*opacity})`;
    ctx.beginPath();ctx.moveTo(...positions[i]);ctx.lineTo(...positions[j]);ctx.stroke();
  }
  const overlayAgents = new Set(overlayAssignments.values());
  for (const task of overlayTasks) {
    ctx.strokeStyle='#55f4eb80';
    ctx.strokeRect(cx+task.x*scale-5,cy+task.y*scale-5,10,10);
  }
  agents.forEach((agent,i) => {
    const [x,y] = positions[i];
    const turquoise = i === selected || overlayAgents.has(i) || (agent.bits[2] && i%3===0);
    ctx.shadowBlur = 8+agent.value*13;
    ctx.shadowColor = turquoise ? '#25eaff' : '#a25cff';
    ctx.fillStyle = turquoise ? '#7ffff8' : '#e2caff';
    ctx.beginPath();ctx.arc(x,y,2.4+agent.value*1.6,0,Math.PI*2);ctx.fill();
    if (overlayAgents.has(i)) {
      ctx.strokeStyle='#55f4eb';
      ctx.strokeRect(x-6,y-6,12,12);
    }
    if (i===selected) {
      ctx.strokeStyle='#65fff3';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.stroke();
      ctx.lineWidth=1;
    }
  });
  ctx.shadowBlur=0;
  el('runtime').textContent = `t = ${(tick*.028).toFixed(2)} s  ·  N = ${agents.length}`;
}
function point(event) {
  const rect=field.getBoundingClientRect();
  return [(event.clientX-rect.left-frame.w/2)/frame.scale,(event.clientY-rect.top-frame.h/2)/frame.scale];
}
field.addEventListener('keydown', event => {
  const direction = {ArrowLeft:-1, ArrowUp:-1, ArrowRight:1, ArrowDown:1}[event.key];
  if (!direction) return;
  event.preventDefault();
  selected = (selected+direction+agents.length)%agents.length;
  samples=[];
  updateInspector(true);
  drawField();
});
field.addEventListener('pointerdown', event => {
  const [x,y]=point(event);
  const distances=agents.map(agent=>Math.hypot(agent.x-x,agent.y-y));
  const minimum=Math.min(...distances);
  if (minimum*frame.scale>21) return;
  selected=distances.indexOf(minimum);
  drag={pointer:event.pointerId,index:selected};
  field.setPointerCapture(event.pointerId);
  samples=[];
  updateInspector(true);
  drawField();
});
field.addEventListener('pointermove', event => {
  if (drag?.pointer !== event.pointerId) return;
  const [x,y]=point(event);
  agents[drag.index]={...agents[drag.index],x:Math.max(-1.08,Math.min(1.08,x)),y:Math.max(-.86,Math.min(.86,y)),vx:0,vy:0};
  configure(false);
  drawField();
});
field.addEventListener('lostpointercapture', () => {drag=null; configure();});
el('play').onclick=()=>setRunning(true);
el('pause').onclick=()=>setRunning(false);
el('reset').onclick=()=>restart();
for (const button of document.querySelectorAll('[data-preset]')) button.onclick=()=>{preset=button.dataset.preset;restart();};
el('formations').onchange=event=>{if(event.target.value){preset=event.target.value;restart();}};
const radiusInput = el('radius');
function showRadius() {
  const radius = thesisRadii[radiusIndex];
  const name = ['Short','Medium','Large'][radiusIndex];
  el('radiusValue').textContent = radius.toFixed(1);
  radiusInput.setAttribute('aria-valuetext', name + ' ' + radius.toFixed(1));
}
showRadius();
radiusInput.oninput = () => {
  radiusIndex = Number(radiusInput.value);
  options.radius = thesisRadii[radiusIndex]*displayScale;
  showRadius();
  configure();
  drawField();
};
const influenceInput = el('influence');
el('influenceValue').textContent = options.influence.toFixed(2);
influenceInput.oninput = () => {
  options.influence = Number(influenceInput.value);
  el('influenceValue').textContent = options.influence.toFixed(2);
};
setRunning(running);
restart();
new ResizeObserver(()=>{drawField();drawHistory();}).observe(el('stage'));
let previous=0;
function animate(time) {
  if(running && time-previous>=31){
    previous=time;
    const next=step(agents,options);
    for (const task of overlayTasks) {
      const i = overlayAssignments.get(task.id);
      if (i === undefined) continue;
      const agent = next[i];
      agent.vx = clamp(agent.vx*.65 + (task.x-agent.x)*.85,-.19,.19);
      agent.vy = clamp(agent.vy*.65 + (task.y-agent.y)*.85,-.19,.19);
      agent.x = clamp(agents[i].x + agent.vx*.028,-1.08,1.08);
      agent.y = clamp(agents[i].y + agent.vy*.028,-.86,.86);
    }
    if(drag) next[drag.index]=agents[drag.index];
    agents=next;
    tick++;
    if(tick%8===0) configure();
    drawField();
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
