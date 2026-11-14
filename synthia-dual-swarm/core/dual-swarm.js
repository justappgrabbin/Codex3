// Dual swarm: inner body (genotype, the full 384-line spectrum, mostly latent)
// and outer body (phenotype, the 26 birth activations). The five dimensions are
// the interplay: an inner unit takes its leading dimension from the outer
// activations coupled to it (base -> dimension, Rave course p.40 base table).
// Expressed = its gate is activated. Channel partners give potential only
// (the inner unit leans toward a dimension but stays latent).
// Coupling weights below are PROVISIONAL working values, not sourced.
import { DIMENSIONS, BASES } from './state-space-canon.js';
import { GATE_WHEEL, WHEEL_START, CHANNELS, centerOf } from './chart.js';

export const COUPLING = Object.freeze({ sameLine: 1, sameGate: 0.5, channelPartner: 0.35, provisional: true });
const dimOfBase = b => BASES[b - 1].dimension;
const partners = g => CHANNELS.filter(c => c.includes(g)).map(([a, b]) => (a === g ? b : a));

/** Angle (radians, screen) of a gate/line on the mandala. */
export function angleOf(gate, line = 3.5) {
  const deg = WHEEL_START + GATE_WHEEL.indexOf(gate) * 5.625 + (line - 0.5) * 0.9375;
  return -deg * Math.PI / 180; // counter-clockwise like a chart wheel
}

/** Build both swarms from one or more charts: [{owner, chart}]. */
export function buildSwarm(people) {
  const outer = [];
  for (const { owner, chart } of people)
    for (const a of chart.activations) outer.push({ ...a, owner, dimension: dimOfBase(a.base), kind: 'outer' });

  const inner = [];
  for (const gate of GATE_WHEEL) for (let line = 1; line <= 6; line++) {
    const weights = Object.fromEntries(DIMENSIONS.map(d => [d, 0]));
    const owners = new Set(), sources = []; let direct = false;
    for (const a of outer) {
      let w = 0;
      if (a.gate === gate) w = a.line === line ? COUPLING.sameLine : COUPLING.sameGate;
      else if (partners(gate).includes(a.gate)) w = COUPLING.channelPartner;
      if (w) { weights[a.dimension] += w; owners.add(a.owner); sources.push(a); if (a.gate === gate) direct = true; }
    }
    const total = Object.values(weights).reduce((s, x) => s + x, 0);
    const ranked = DIMENSIONS.slice().sort((x, y) => weights[y] - weights[x]);
    const lead = total ? ranked[0] : null;
    // Where two dimensions pull equally, the unit sits where they meet: Space.
    const meeting = total > 0 && weights[ranked[0]] === weights[ranked[1]];
    inner.push({ kind: 'inner', gate, line, center: centerOf(gate), weights, energy: total,
      dimension: meeting ? 'Space' : lead, latent: !direct, potential: !direct && total > 0, owners: [...owners], sources });
  }
  return { inner, outer, connection: connection(people) };
}

/** What happens between people: electromagnetic, companionship, dominance. */
export function connection(people) {
  if (people.length < 2) return [];
  const gatesOf = p => new Set(p.chart.activations.map(a => a.gate));
  const [A, B] = people.map(gatesOf), out = [];
  for (const [a, b] of CHANNELS) {
    const ha = [A.has(a), A.has(b)], hb = [B.has(a), B.has(b)];
    const fullA = ha[0] && ha[1], fullB = hb[0] && hb[1];
    if (fullA && fullB) out.push({ channel: [a, b], type: 'companionship' });
    else if (fullA || fullB) out.push({ channel: [a, b], type: 'dominance', by: fullA ? people[0].owner : people[1].owner });
    else if ((ha[0] && hb[1]) || (ha[1] && hb[0])) out.push({ channel: [a, b], type: 'electromagnetic' });
  }
  return out;
}

/** Place units for drawing: inner ring of 384, outer ring of activations. */
export function place(swarm, { cx, cy, r }) {
  for (const u of swarm.inner) {
    const t = angleOf(u.gate, u.line), rr = r * (0.55 + (u.line - 1) * 0.045);
    u.home = { x: cx + Math.cos(t) * rr, y: cy + Math.sin(t) * rr };
    u.x ??= u.home.x; u.y ??= u.home.y; u.vx ??= 0; u.vy ??= 0;
  }
  swarm.outer.forEach((a, i) => {
    const t = angleOf(a.gate, a.line), rr = r * (a.side === 'Personality' ? 1.02 : 0.92) + (a.owner === swarm.outer[0].owner ? 0 : r * 0.08);
    a.x = cx + Math.cos(t) * rr; a.y = cy + Math.sin(t) * rr;
  });
  swarm.center = { cx, cy, r };
  return swarm;
}

// Flow per dimension (owner's canon): Movement up, Being inward,
// Evolution outward, Design forward along the wheel, Space toward where the
// others meet (the centroid of active units). Latent units only breathe.
export function step(swarm, dt = 1, time = 0) {
  const { cx, cy, r } = swarm.center;
  const act = swarm.inner.filter(u => !u.latent);
  const mx = act.reduce((s, u) => s + u.x, 0) / (act.length || 1), my = act.reduce((s, u) => s + u.y, 0) / (act.length || 1);
  for (const u of swarm.inner) {
    let fx = (u.home.x - u.x) * 0.02, fy = (u.home.y - u.y) * 0.02; // tether to its address
    const e = Math.min(1.5, u.energy) * r * 0.0009;
    const dx = u.x - cx, dy = u.y - cy, d = Math.hypot(dx, dy) || 1;
    switch (u.dimension) {
      case 'Movement': fy -= e * 6; break;
      case 'Being': fx -= dx / d * e * 6; fy -= dy / d * e * 6; break;
      case 'Evolution': fx += dx / d * e * 6; fy += dy / d * e * 6; break;
      case 'Design': fx += -dy / d * e * 6; fy += dx / d * e * 6; break;
      case 'Space': fx += (mx - u.x) * 0.004 * u.energy; fy += (my - u.y) * 0.004 * u.energy; break;
      default: { const p = Math.sin(time * 0.002 + u.gate * 1.7 + u.line); fx += dx / d * p * 0.05; fy += dy / d * p * 0.05; }
    }
    u.vx = (u.vx + fx * dt) * 0.88; u.vy = (u.vy + fy * dt) * 0.88;
    u.x += u.vx * dt; u.y += u.vy * dt;
  }
  return swarm;
}

export function summary(swarm) {
  const count = Object.fromEntries(DIMENSIONS.map(d => [d, 0]));
  for (const u of swarm.inner) if (u.dimension) count[u.dimension]++;
  return { expressed: swarm.inner.filter(u => !u.latent).length, latent: swarm.inner.filter(u => u.latent).length, byDimension: count };
}
