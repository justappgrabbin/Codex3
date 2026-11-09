import { bootstrapCurrentSynthiaSwarm } from '../src/synthia/swarm/bootstrap.mjs';
import { bindYNIToSwarm } from '../host/yniSwarmHands.mjs';
import { bindSelfhostedToSwarm } from '../host/selfhostedSwarmHand.mjs';

const $ = (id) => document.getElementById(id);
const { swarm, physiology } = await bootstrapCurrentSynthiaSwarm();
bindYNIToSwarm(swarm);
bindSelfhostedToSwarm(swarm);
globalThis.SYNTHIA_SWARM = swarm;

function render() {
  const s = swarm.snapshot();
  $('headline').textContent = `${s.identity.name} · ${s.processCount} processes · 1 visible body`;
  $('groups').textContent = Object.entries(s.groups).sort().map(([k,v]) => `${k}: ${v}`).join('  ·  ');
  const p = physiology.context();
  $('physiology').textContent = `felt: ${p.felt?.feltState || '—'} · want: ${p.felt?.dominantWant || '—'} · stage: ${p.innerLife?.stage || '—'} · gate: ${p.world?.currentGate || '—'} · observations: ${p.metrics?.observationCount || 0}`;
  $('workers').innerHTML = s.workers.map((w) => `<tr><td>${w.id}</td><td>${w.group}</td><td>${w.lifecycle}</td><td>${w.active}</td><td>${w.capabilities.join(', ')}</td></tr>`).join('');
  $('events').textContent = swarm.events.slice(-16).reverse().map((e) => `${e.at.slice(11,19)}  ${e.type}  ${JSON.stringify(e.detail)}`).join('\n');
}
swarm.addEventListener('swarm', render); render();

$('demo').addEventListener('click', async () => {
  $('demo').disabled = true;
  await swarm.submit([
    { id: 'organism', capability: 'organism.snapshot', input: { op: 'snapshot' } },
    { id: 'selfhosted', capability: 'selfhosted.probe', input: { op: 'probe', timeoutMs: 250 } },
  ]);
  $('demo').disabled = false; render();
});

$('checkpoint').addEventListener('click', async () => { await swarm.checkpoint('manual-ui'); render(); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
