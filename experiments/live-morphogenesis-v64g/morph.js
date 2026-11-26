// EARLIER ATTEMPT (kept, not the organism): its own behaviour search. Superseded by morphogenesis.js; UnitSystem/trial here are used by hosts.js as the world's executable descendant.
// morph.js — the swarm BECOMES the missing function of a host (user, Nov 22):
// Enter → Morph → Learn → Clone → Integrate → Extract → Reuse.
// Nothing here knows what the host wants. The host only has checks (a number 0..1 on its own state). The swarm's units
// try behaviours built from GENERIC primitives — where to appear, which way to move, whether to wander, whether to stop
// on contact, whether to leave their colour where they are — and keep what raises the host's own check.
// No effect is named anywhere in this file: what the units turn into is only what a host turns out to need.
export const PRIMITIVES = {
  appear: ["top", "bottom", "left", "right", "anywhere"],
  move: [[0, 1], [0, -1], [-1, 0], [1, 0], [0, 0]],
  wander: [0, 1],                                   // a unit's own jitter, from its bits
  stopOnContact: [0, 1],
  leaveColour: ["no", "trail", "contact"],        // leave its colour nowhere, along its path, or where it touches
  colour: [[235, 235, 245], [20, 20, 20], [200, 40, 30], [40, 170, 60], [40, 80, 220], [230, 200, 40]],
};
const KEYS = Object.keys(PRIMITIVES);

/** A behaviour = one choice per primitive. The units carrying it are the system. */
export class UnitSystem {
  constructor(behaviour, unitIds, { rate = 2, seed = 1 } = {}) { this.b = behaviour; this.ids = unitIds; this.rate = rate; this.seed = seed; this.next = 0; this.live = []; }
  rand() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  spawn(W) { const a = this.b.appear, r = Math.floor(this.rand() * (a === "left" || a === "right" ? W.h - 1 : W.w));
    const at = { top: [r, 0], bottom: [r, W.h - 2], left: [0, r], right: [W.w - 1, r], anywhere: [Math.floor(this.rand() * W.w), Math.floor(this.rand() * (W.h - 1))] }[a];
    const id = this.ids[this.next++ % this.ids.length]; return { id, x: at[0], y: at[1], stopped: false }; }
  tick(W) {
    for (let i = 0; i < this.rate; i++) { const p = this.spawn(W); this.live.push(p); W.particles.push(p); }
    const [mx, my] = this.b.move;
    for (const p of this.live) { if (p.stopped) continue;
      let dx = mx; if (this.b.wander) { const j = this.rand(); if (j < 0.25) dx -= 1; else if (j < 0.5) dx += 1; }
      const nx = p.x + dx, ny = p.y + my;
      if (W.solid(nx, ny) || ny < 0 || ny >= W.h) {
        if (this.b.leaveColour === "contact") W.paint(Math.max(0, Math.min(W.w - 1, nx)), Math.max(0, Math.min(W.h - 1, ny)), this.b.colour);
        if (this.b.stopOnContact) p.stopped = true; }
      else { p.x = nx; p.y = ny; if (this.b.leaveColour === "trail") W.paint(p.x, p.y, this.b.colour); } }
    this.live = this.live.filter(p => !p.stopped);
    if (W.particles.length > 3000) W.particles = W.particles.slice(-3000);
  }
  copy() { const c = new UnitSystem(this.b, this.ids, { rate: this.rate, seed: this.seed }); return c; }
}

/** All behaviours, in order (the space the swarm can try). */
export function* behaviours() {
  const idx = KEYS.map(() => 0), sizes = KEYS.map(k => PRIMITIVES[k].length);
  while (true) { yield Object.fromEntries(KEYS.map((k, i) => [k, PRIMITIVES[k][idx[i]]]));
    let i = KEYS.length - 1; while (i >= 0 && ++idx[i] === sizes[i]) idx[i--] = 0; if (i < 0) return; }
}
const key = b => JSON.stringify(b);

/** Try one behaviour in a fork of the host: the host's own check is the only judge. */
export function trial(host, behaviour, unitIds, ticks = 120) {
  const W = host.fork(); W.systems.push(new UnitSystem(behaviour, unitIds)); W.run(ticks); return W.score();
}

/**
 * The whole lifecycle. `swarm` = a LivingSwarm (its real units lend their ids and bits); `library` = what it learned before.
 * Returns a report of every step, the host with the clone integrated, and the library.
 */
export function morphInto(host, swarm, library = { formations: [] }, { ticks = 120, enough = 0.9, maxTrials = 4000 } = {}) {
  const steps = [], say = (step, d) => steps.push({ step, ...d });
  const units = swarm.units.filter(u => !u.broken).slice(0, 24), ids = units.map(u => u.id);
  const base = host.fork().run(ticks).score(); say("enter", { host: host.name, checks: host.checks.length, scoreWithout: +base.toFixed(3) });
  if (base >= enough) { say("nothing-needed", {}); return { steps, host, library, ok: true }; }
  // MORPH + LEARN: what it already learned is tried first (reuse), then everything else, best kept
  let best = { score: -1 }, tried = 0; const seen = new Set();
  for (const f of library.formations) { const s = trial(host, f.behaviour, ids, ticks); tried++; seen.add(key(f.behaviour));
    say("reuse-try", { from: f.learnedIn, score: +s.toFixed(3) }); if (s > best.score) best = { behaviour: f.behaviour, score: s, reused: f.learnedIn }; if (s >= enough) break; }
  // the order the units try things in comes from their own bits (not from how this file lists the primitives)
  let seed = units.reduce((h, u) => (h * 31 + (u.bits ?? []).reduce((a, b, i) => a + b * (i + 1), 0)) >>> 0, 17) || 1;
  const all = [...behaviours()]; for (let i = all.length - 1; i > 0; i--) { seed = (seed * 1664525 + 1013904223) >>> 0; const j = seed % (i + 1); [all[i], all[j]] = [all[j], all[i]]; }
  if (best.score < enough) for (const b of all) { if (seen.has(key(b))) continue; if (++tried > maxTrials) break;
    const s = trial(host, b, ids, ticks); if (s > best.score) best = { behaviour: b, score: s, reused: null }; if (s >= enough) break; }
  units.forEach(u => u.role = { becoming: host.name, behaviour: best.behaviour });
  say("morph", { tried, bestScore: +best.score.toFixed(3), behaviour: best.behaviour, reused: best.reused });
  if (best.score < enough) { units.forEach(u => delete u.role); say("fail", { reason: `nothing the units can do brings the host's check to ${enough} (best ${best.score.toFixed(2)})` }); return { steps, host, library, ok: false }; }
  // CLONE: new units carrying the learned behaviour, with their own copy of its state (ids are new; nothing points back)
  const cloneIds = units.map((u, i) => `clone-${host.name}-${i}`), clone = new UnitSystem(best.behaviour, cloneIds, { seed: 7 });
  say("clone", { units: cloneIds.length, behaviour: best.behaviour });
  // INTEGRATE: the clones become one of the host's own systems
  host.systems.push(clone); say("integrate", { systems: host.systems.length });
  // EXTRACT: the original units leave; the host runs on its own and is judged by its own check
  units.forEach(u => delete u.role);
  const after = host.fork().run(ticks).score();
  const refsSwarm = host.systems.some(s => (s.ids ?? []).some(id => ids.includes(id)));
  say("extract", { scoreWithSwarmGone: +after.toFixed(3), clonesReferToSwarm: refsSwarm });
  const ok = after >= enough && !refsSwarm;
  if (ok && !best.reused) library.formations.push({ behaviour: best.behaviour, learnedIn: host.name, score: +after.toFixed(3), conditions: { temperature: host.temperature } });
  say("learn", { kept: library.formations.length });
  return { steps, host, library, ok };
}
