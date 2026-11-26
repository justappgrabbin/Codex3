// living.js — the swarm as living units. Pure JavaScript, no model, no training.
// Every unit IS its ontological address. The BHANTUGH layers are the operations the unit runs:
//   Binary  -> how two units react (shared bits attract, differing bits repel)
//   Hex     -> colour value and position sector
//   ASCII   -> the instruction the unit carries out when touched
//   NATO    -> rhythm (beats = syllables of the code word)
//   Unicode -> how it links to neighbours (box-drawing glyph from its bond directions)
//   Geometry-> SOUND -> SHAPE: Chladni plate pattern from the unit's frequencies (sound decides shape)
//   Gematria-> mass / pull (English ordinal sum of its sentence words)
//   Hash    -> how two units combine into a new one (SHA-256 of both bit strings, reproducible)
//   HTML    -> the built, clickable result (SVG)
// Settled with the user: address sections, variable depth, order set by the leading primary dimension
// (Movement, Evolution, Being, Design; Space is computed, never leads); decay vs regeneration by flow;
// every decline carries its cause (cycle vs failure); touch response is predicted before the touch.
// OPEN SETTINGS (not settled — change freely): SECTION_ORDER rule, OPPOSITE_TRIGRAM_FOR_COLOR_TONE,
// what a broken piece becomes (here: loose pieces left in the mesh).
import { maskFromKingWen } from "./kingwen.js";
import { computeOnBond, openedBy, partsOf } from "./relational.js";
import { startGrow, growTick } from "./grow.js";
import { sound, colorFromSound, hslToRgb } from "./expression.js";
import { sha256Hex } from "./encoding.js";
import { sentence } from "./lexicon.js";
import * as OPS from "./bhantugh_ops.js";
import { dress } from "./vocabulary.js";
import { fourfold, qualitiesOf, qualitiesByDimension } from "./fourfold.js";

export const SECTIONS = {
  P: ["planetary", "dimension"],
  G: ["gate", "line", "color", "tone", "base"],
  T: ["degree", "minute", "second"],
  H: ["arc", "zodiac", "house"],
};
export const PRIMARIES = ["Movement", "Evolution", "Being", "Design"];
// OPEN SETTING: which order the sections are read in when each primary leads. My rule until you give
// the real one: rotate P-G-T-H by the leader's index (Movement reads P first, Evolution G first, ...).
export const SECTION_ORDER = Object.fromEntries(PRIMARIES.map((d, i) => {
  const base = ["P", "G", "T", "H"]; return [d, [...base.slice(i), ...base.slice(0, i)]]; }));
export const SETTINGS = { OPPOSITE_TRIGRAM_FOR_COLOR_TONE: false, VISIBLE_AT: 3, CYCLE_PERIOD: 360, DECAY: 0.003, SIGHT: 0.35, EXPLORE: 0.0015, GROW: true, GROW_ROUNDS: 6 };

const NATO = "Alfa Bravo Charlie Delta Echo Foxtrot Golf Hotel India Juliett Kilo Lima Mike November Oscar Papa Quebec Romeo Sierra Tango Uniform Victor Whiskey X-ray Yankee Zulu".split(" ");
const syllables = w => (w.toLowerCase().match(/[aeiouy]+/g) || []).length;
const popcount = n => { let c = 0; for (; n; n &= n - 1) c++; return c; };

/** Which sections a unit actually carries (variable depth). */
export function sectionsOf(addr) {          // a section is carried from its first field down as far as it goes
  return Object.keys(SECTIONS).filter(s => addr[SECTIONS[s][0]] !== undefined && addr[SECTIONS[s][0]] !== null);
}
const has = (addr, k) => addr[k] !== undefined && addr[k] !== null;

/** BINARY layer: the address packed as bits. Gate = its six lines (King Wen mask). */
export function bitsOf(addr) {
  const out = [];
  const put = (v, n) => { for (let i = n - 1; i >= 0; i--) out.push((v >>> i) & 1); };
  if (addr.gate) put(maskFromKingWen(addr.gate), 6);
  for (const [k, n] of [["line", 3], ["color", 3], ["tone", 3], ["base", 3], ["degree", 5], ["minute", 6], ["second", 6], ["arc", 7], ["house", 4]])
    if (addr[k] != null) put(+addr[k] || 0, n);
  return out;
}
const bitsToInt = (b, from, n) => b.slice(from, from + n).reduce((v, x) => (v << 1) | x, 0);

/** SOUND from the bits: the six lines are six voices; deeper sections shift the fundamental. */
export function soundOf(addr) {
  const b = bitsOf(addr), lines = b.slice(0, 6).reverse();          // bottom line first
  const register = ((addr.base ?? 1) - 1) % 4;
  const s = sound(lines.map(x => x), register);
  const detune = 1 + ((addr.degree ?? 0) * 60 + (addr.minute ?? 0)) / (30 * 60) * 0.0595; // within a semitone
  return { ...s, f0: s.f0 * detune, voices: s.voices.map(v => ({ ...v, freq: v.freq * detune })) };
}

/** GEOMETRY: sound decides shape. Chladni square-plate nodal pattern cos(nπx)cos(mπy) − cos(mπx)cos(nπy),
 *  with mode numbers (n, m) taken from the two strongest voices. Returns sample points on the nodal lines. */
const CHLADNI = new Map();
export function shapeOf(snd, res = 48) {
  if (snd?.voices) snd = { ...snd, voices: snd.voices.filter(Boolean) };   // morph on an empty sound rotates in nothing
  if (!snd?.voices?.length) return { modes: null, points: [] };   // no gate = no voices = no sound = no shape yet (shallow address)
  const loud = snd.voices.map((v, i) => [v.amp, i]).sort((a, b) => b[0] - a[0]);
  const n = loud[0][1] + 1, m = (loud[1]?.[0] ? loud[1][1] : loud[0][1] + 1) + 1 + (loud[0][1] === loud[1]?.[1] ? 1 : 0);
  const key = n * 1000 + m * 10 + res, hit = CHLADNI.get(key); if (hit) return { modes: [n, m], points: hit };   // same modes, same plate: same figure
  const f = (x, y) => Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
  const pts = []; CHLADNI.set(key, pts);
  for (let i = 0; i < res; i++) for (let j = 0; j < res; j++) { const x = i / (res - 1), y = j / (res - 1);
    if (Math.abs(f(x, y)) < 0.08) pts.push([x - 0.5, y - 0.5]); }      // sand settles where the plate is still
  return { modes: [n, m], points: pts };
}

/** GEMATRIA: English ordinal sum (A=1 .. Z=26). */
export const gematria = text => [...String(text).toUpperCase()].reduce((s, c) => s + (c >= "A" && c <= "Z" ? c.charCodeAt(0) - 64 : 0), 0);

/** ASCII: the instruction byte. Derived from the address bits, read as one printable character. */
export function opcodeOf(addr) {
  const b = bitsOf(addr), v = 32 + (bitsToInt(b, 0, 12) % 95);
  const ch = String.fromCharCode(v), up = ch.toUpperCase();
  const nato = up >= "A" && up <= "Z" ? NATO[up.charCodeAt(0) - 65] : null;
  // what the character class does when touched
  const act = /[A-Z]/.test(ch) ? "open" : /[a-z]/.test(ch) ? "turn" : /[0-9]/.test(ch) ? "pulse" : "hold";
  return { byte: v, hex: "0x" + v.toString(16), char: ch, act, nato, beats: nato ? syllables(nato) : 1 };
}

/** UNICODE: link glyph from which directions it is bonded (right, up, left, down). */
const BOX = { 0: "·", 1: "╶", 2: "╵", 3: "└", 4: "╴", 5: "─", 6: "┘", 7: "┴", 8: "╷", 9: "┌", 10: "│", 11: "├", 12: "┐", 13: "┬", 14: "┤", 15: "┼" };
export function linkGlyph(unit, others) {
  let m = 0; for (const o of others) { const dx = o.x - unit.x, dy = o.y - unit.y;
    m |= Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 4) : (dy < 0 ? 2 : 8); }
  return BOX[m];
}

/** HASH: two units combine into a new address, always the same way. */
export function combine(a, b) {
  const bytes = new TextEncoder().encode(bitsOf(a.address).join("") + "|" + bitsOf(b.address).join(""));
  const h = sha256Hex(bytes), n = i => parseInt(h.slice(i, i + 2), 16);
  return { planetary: a.address.planetary, dimension: a.address.dimension, gate: n(0) % 64 + 1, line: n(2) % 6 + 1,
    color: n(4) % 6 + 1, tone: n(6) % 6 + 1, base: n(8) % 5 + 1, hash: h };
}

/** BOND: compare two addresses section by section, in the leader's order.
 *  depth = no-skip run (stops at the first section that doesn't line up);
 *  count = every field that lines up (same value; line also by opposite trigram 1-4, 2-5, 3-6). */
export function bond(a, b, leader = "Movement") {
  const order = SECTION_ORDER[leader], have = new Set(sectionsOf(a)), haveB = new Set(sectionsOf(b));
  const same = (k, x, y) => x === y || ((k === "line" || (SETTINGS.OPPOSITE_TRIGRAM_FOR_COLOR_TONE && (k === "color" || k === "tone")))
    && Math.abs(x - y) === 3);
  let depth = 0, count = 0, run = true; const matched = [];
  for (const s of order) {
    if (!have.has(s) && !haveB.has(s)) continue;                 // neither carries it: nothing to line up
    if (!have.has(s) || !haveB.has(s)) { run = false; continue; }   // only one carries it: the run stops
    const both = SECTIONS[s].filter(k => has(a, k) && has(b, k));          // only the depth both carry
    const hits = both.filter(k => same(k, a[k], b[k]));
    count += hits.length; matched.push(...hits);
    if (run && both.length && hits.length === both.length) depth++; else run = false;
  }
  return { depth, count, matched, visible: count >= SETTINGS.VISIBLE_AT, strength: (depth + count / 13) / 4 };
}

const KINDS = ["person", "mover", "attractor", "item"];

export class LivingSwarm {
  constructor({ leader = "Movement", seed = 7 } = {}) {
    this.leader = leader; this.units = []; this.loose = []; this.t = 0; this.events = [];
    let s = seed >>> 0; this.rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  }

  /** Add a unit. kind: person (regenerates by moving + exchange), mover, attractor (pulls flow), item (only fed). */
  add(address, kind = "item", x = this.rand(), y = this.rand()) {
    if (!KINDS.includes(kind)) throw new Error("kind must be " + KINDS.join("/"));
    const snd = soundOf(address), col = colorFromSound(snd), op = opcodeOf(address);
    const words = address.gate ? sentence({ gate: address.gate, line: address.line ?? 1, color: address.color ?? 1, tone: address.tone ?? 1, base: address.base ?? 1 }) : null;
    const u = { id: this.units.length, address, kind, x, y, health: 1, decline: null, sections: sectionsOf(address),
      bits: bitsOf(address), sound: snd, shape: shapeOf(snd), color: col, opcode: op,
      sentence: words && !words.halted ? words.text : null, mass: 1 + gematria(words?.text ?? op.char) / 100,
      letters: OPS.addressSentence(address), why: OPS.why(address), target: null,
      phase: ((address.degree ?? 0) * 12 + (address.house ?? 0) * 30) % SETTINGS.CYCLE_PERIOD, bonds: [], transforms: new Map(), acquired: new Set() };
    Object.defineProperty(u, "parts", { get: () => partsOf(u), enumerable: false });
    u.q = qualitiesByDimension(address);
    u.four = fourfold(address, this.leader); u.fourLeader = this.leader; dress(u);   /* the user's gate vocabulary */
    u.program = OPS.program(u.letters); u.melody = OPS.melody(u.letters); u.voice = OPS.voice(u.letters);
    this.units.push(u); return u;
  }

  /** Cycle phase 0..1 (the shared clock; each unit enters it at its own place). */
  cycle(u) { return 0.5 + 0.5 * Math.sin(2 * Math.PI * (this.t + u.phase) / SETTINGS.CYCLE_PERIOD); }

  /** Recompute bonds for everyone near enough to interact. */
  link(radius = null) {
    const U = this.units.filter(u => !u.broken);
    radius ??= Math.min(0.25, 3 / Math.sqrt(U.length || 1), this.image ? 1.6 / this.image.w : 1);   // in a picture the units are a lattice: neighbours are the squares around (Badalov r = 1.6)
    this.radius = radius;
    for (const u of U) u.bonds = [];
    const grid = this.grid = new Map(), key = (x, y) => (Math.floor(x / radius) * 73856093) ^ (Math.floor(y / radius) * 19349663);
    for (const u of U) { const k = key(u.x, u.y); (grid.get(k) ?? grid.set(k, []).get(k)).push(u); }
    for (const a of U) { const gx = Math.floor(a.x / radius), gy = Math.floor(a.y / radius);
      for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) for (const b of grid.get(((gx + ix) * 73856093) ^ ((gy + iy) * 19349663)) ?? []) {
        if (b.id <= a.id || (this.grow && (!a.target || !b.target))) continue;   /* joiners in transit do not bond until they settle */ const d = Math.hypot(a.x - b.x, a.y - b.y); if (d > radius) continue;
        const r = bond(a.address, b.address, this.leader), sp = OPS.evaluateSwarmBond(a.address, b.address);
        let via = null;
        if (!r.count && !sp.connectionCount) {          // not compatible as they are: maybe something either acquired opens it
          via = openedBy(a, b, bond, this.leader) ?? openedBy(b, a, bond, this.leader); if (!via) continue; Object.assign(r, via.bond); }
        // spec rule decides visibility and level; section depth (no-skip) is kept alongside
        const e = { a: a.id, b: b.id, ...r, d, spec: sp, connectionCount: sp.connectionCount, level: sp.level, visible: sp.isVisible,
          strength: (r.depth + sp.connectionCount) / 9, via: via ? { acquiredGate: via.gate } : null };
        e.product = computeOnBond(a, b);                // the bond computes: Klein's operator on the two units' Boolean vectors
        a.bonds.push(e); b.bonds.push(e); } }
  }
  /** Units near (x, y) from the grid built by link(). */
  near(x, y, r) { const R = this.radius ?? 0.25, out = [], gx = Math.floor(x / R), gy = Math.floor(y / R), n = Math.ceil(r / R);
    for (let ix = -n; ix <= n; ix++) for (let iy = -n; iy <= n; iy++) for (const o of this.grid?.get(((gx + ix) * 73856093) ^ ((gy + iy) * 19349663)) ?? []) out.push(o);
    return out; }

  /** Visible clusters: connected groups whose bonds reached the visibility count. */
  clusters() {
    const seen = new Set(), out = [];
    for (const u of this.units) { if (seen.has(u.id) || u.broken) continue;
      const stack = [u], group = []; seen.add(u.id);
      while (stack.length) { const v = stack.pop(); group.push(v);
        for (const e of v.bonds) if (e.visible) { const w = this.units[e.a === v.id ? e.b : e.a]; if (!seen.has(w.id) && !w.broken) { seen.add(w.id); stack.push(w); } } }
      if (group.length > 1) out.push(group); }
    return out;
  }

  /** One step of life: renewal from flow, decay, movement, attraction, breaking. Every decline records why. */
  step(dt = 1) {
    this.t += dt; this.link(); if (this.grow) { let n = 0; for (let r = 0; r < SETTINGS.GROW_ROUNDS; r++) { const k = growTick(this); n += k; if (!k) break; } this.grow.lastRound = n; }
    if (!this.pinnedLeader) this.leader = OPS.leadingDimension(this.units, this.units.flatMap(u => u.bonds.filter(e => e.a === u.id))).leader;
    for (const u of this.units) { if (u.broken) continue;
      const cyc = this.cycle(u);
      const feed = u.bonds.reduce((s, e) => s + e.strength * this.units[e.a === u.id ? e.b : e.a].health, 0);
      let renewal = 0;
      if (u.kind === "person" || u.kind === "mover") renewal = 0.02 * (feed + 0.5) * cyc;        // exchange while moving
      if (u.kind === "attractor") renewal = 0.03 * feed * cyc * u.mass;                       // pull needs something to answer
      if (u.kind === "item") renewal = 0.008 * feed * cyc;                                    // only what flows to it
      const before = u.health;
      u.health = Math.max(0, Math.min(1, u.health + (renewal - SETTINGS.DECAY) * dt));
      // WHY it declines: if this same flow would hold it up at the top of its cycle, the cycle is the cause;
      // if not even the peak would hold it, what feeds it is missing — that's failure.
      const atPeak = cyc > 1e-6 ? renewal / cyc : 0;
      if (u.health < before) u.decline = { cause: atPeak >= SETTINGS.DECAY ? "cycle" : "failure", feed, cycle: cyc, t: this.t };
      else u.decline = null;
      // movers go toward better neighbours when renewal is low
      if ((u.kind === "person" || u.kind === "mover") && u.health < 0.8 && !u.target) {   // a unit holding its square does not go looking
        // looks only as far as it can see, and goes toward the richest place in view (not one global spot)
        let gx = 0, gy = 0;
        for (const o of this.near(u.x, u.y, SETTINGS.SIGHT)) { if (o === u || o.broken) continue; const dx = o.x - u.x, dy = o.y - u.y, d = Math.hypot(dx, dy);
          if (d > SETTINGS.SIGHT || d < 1e-6) continue; const w = o.health * o.mass / d;
          gx += dx / d * w; gy += dy / d * w; }
        const g = Math.hypot(gx, gy) || 1; u.x += gx / g * 0.01 * dt; u.y += gy / g * 0.01 * dt; }
      // nothing occupies the same place: units too close push apart
      if (!u.target && !this.grow) for (const o of this.near(u.x, u.y, 0.04)) { if (o === u || o.broken || (u.wanting && o.target)) continue; /* a joiner passes over the settled lattice */ const dx = u.x - o.x, dy = u.y - o.y, d = Math.hypot(dx, dy);
        if (d < 0.04 && d > 1e-6) { u.x += dx / d * (0.04 - d) * 0.5; u.y += dy / d * (0.04 - d) * 0.5; } }
      // attractors pull nearby units in
      if (u.kind === "attractor") for (const o of this.near(u.x, u.y, 0.3)) { if (o === u || o.broken || o.kind === "attractor" || o.target) continue;
        const d = Math.hypot(o.x - u.x, o.y - u.y); if (d < 0.3 && d > 0.02) { const k = 0.004 * u.mass * cyc / d;
          o.x += (u.x - o.x) * k; o.y += (u.y - o.y) * k; } }
      // binary reaction: shared bits pull together, differing bits push apart (short range)
      if (!u.target) for (const e of u.bonds) { const o = this.units[e.a === u.id ? e.b : e.a];
        const n = Math.min(u.bits.length, o.bits.length); let x = 0; for (let k = 0; k < n; k++) x += u.bits[k] ^ o.bits[k];
        const push = (x / n - 0.5) * 0.002; u.x += (u.x - o.x) * push; u.y += (u.y - o.y) * push; }
      this.run(u, u.program[Math.floor(this.t) % (u.program.length || 1)], (u.target ? 0.0002 : 0.002) * dt); // holding a picture: instructions stay small
      if (this.mode === "words") {                                       // the four-part chain drives what it looks like and how it moves
        if (u.fourLeader !== this.leader) { u.four = fourfold(u.address, this.leader); u.fourLeader = this.leader; dress(u); }
        const [hx, hy] = u.four.motion.heading; u.x = (u.x + hx * 0.003 * dt + 1) % 1; u.y = (u.y + hy * 0.003 * dt + 1) % 1;
        if (u.four.motion.instruction) this.run(u, u.four.motion.instruction, 0.001 * dt); }
      // exploring (port of boid_simulation.py move_away_from_memory): a free unit steers away from where it has just been,
      // so units that are looking cover new ground instead of circling. Trail of the last 50 places, sampled every 4 steps.
      if (!u.target && SETTINGS.EXPLORE > 0) { u.trail ??= []; if ((this.t | 0) % 4 === 0 && u.trail.at(-1)?.t !== (this.t | 0)) { u.trail.push({ x: u.x, y: u.y, t: this.t | 0 }); if (u.trail.length > 50) u.trail.shift(); }
        let ax = 0, ay = 0; for (const p of u.trail) { const dx = u.x - p.x, dy = u.y - p.y, d = Math.hypot(dx, dy); if (d < 0.05 && d > 1e-6) { ax += dx / d; ay += dy / d; } }
        const a = Math.hypot(ax, ay); if (a > 0) { u.x += ax / a * SETTINGS.EXPLORE * dt; u.y += ay / a * SETTINGS.EXPLORE * dt; } }
      if (u.target) { u.x += (u.target.x - u.x) * 0.3 * dt; u.y += (u.target.y - u.y) * 0.3 * dt; }
      if (this.mode !== "words") { u.x = Math.min(1, Math.max(0, u.x)); u.y = Math.min(1, Math.max(0, u.y)); }
      if (u.health < 0.1 && u.kind !== "person") {                       // not enough holding it: breaks away
        u.broken = true; this.loose.push({ from: u.id, address: u.address, t: this.t });
        this.events.push({ t: this.t, type: "break", unit: u.id, cause: u.decline?.cause ?? "failure" }); }
    }
    return this;
  }

  /** Carry out one ASCII instruction (spec §5) on unit u with strength k. */
  run(u, op, k) {
    if (!op) return;
    const nb = u.bonds.map(e => this.units[e.a === u.id ? e.b : e.a]).filter(o => !o.broken);
    const cx = nb.length ? nb.reduce((s, o) => s + o.x, 0) / nb.length : u.x, cy = nb.length ? nb.reduce((s, o) => s + o.y, 0) / nb.length : u.y;
    const dx = cx - u.x, dy = cy - u.y;
    switch (op) {
      case "attract": case "flock": u.x += dx * k * 10; u.y += dy * k * 10; break;
      case "repel": case "exit": u.x -= dx * k * 10; u.y -= dy * k * 10; break;
      case "orbit": u.x += -dy * k * 10; u.y += dx * k * 10; break;
      case "spiral": u.x += (-dy + dx * 0.3) * k * 10; u.y += (dx + dy * 0.3) * k * 10; break;
      case "branch": u.x += dy * k * 10; u.y -= dx * k * 10; break;
      case "align": u.x += (Math.round(u.x * 20) / 20 - u.x) * k * 50; u.y += (Math.round(u.y * 20) / 20 - u.y) * k * 50; break;
      case "morph": u.shape = shapeOf({ ...u.sound, voices: [...u.sound.voices.slice(1), u.sound.voices[0]] }); break;
      case "alert": u.health = Math.min(1, u.health + k); break;
    }
  }
  /** Move the swarm into a picture: gray = 0..1 array (w*h). Each unit takes a cell of its own dimension's layer. */
  picture(gray, w, h) { this.image = OPS.asciiImage(gray, w, h);
    if (SETTINGS.GROW) { startGrow(this, this.image); return this.image; }     // grows from what settled (grow.js); the from-above way below is kept
    const T = OPS.pictureTargets(this.image, this.units.filter(u => !u.broken));
    for (const u of this.units) u.target = T.get(u.id) ?? null; return this.image; }
  release() { for (const u of this.units) u.target = null; this.image = null; this.parts = null; }

  /** The function side of a picture: find the part under a square (flood fill that stops at the edges the swarm sees)
   *  and its hinge (the side of the part farther from where it was touched). No side effects. */
  findPart(cx, cy, tol = 20) {
    const img = this.image; if (!img) return null; const { w, h } = img, edges = this.partEdges ?? img.edges, rgb = this.imageRGB;   // parts have their own edges
    let mx = 0; for (const e of edges) if (e > mx) mx = e;
    // walls: strong edges, widened by one square so dotted borders (rows of studs) close up
    const wall = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) if (edges[i] > mx * 0.35) { const x = i % w, y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) wall[yy * w + xx] = 1; } }
    const col = i => rgb ? [rgb[i * 4], rgb[i * 4 + 1], rgb[i * 4 + 2]] : [img.layers.reduce((s, L) => s + L[i], 0) * 50, 0, 0];
    const seed = cy * w + cx, c0 = col(seed), near = i => { const c = col(i); return Math.hypot(c[0] - c0[0], c[1] - c0[1], c[2] - c0[2]) < tol; };
    const seen = new Uint8Array(w * h), cells = [], stack = [seed];
    while (stack.length && cells.length < w * h * 0.35) { const i = stack.pop(); if (seen[i]) continue; seen[i] = 1;
      if (i !== seed && (wall[i] || !near(i))) continue; cells.push(i); const x = i % w, y = (i / w) | 0;
      if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1); if (y > 0) stack.push(i - w); if (y < h - 1) stack.push(i + w); }
    let x0 = w, x1 = 0; for (const i of cells) { const x = i % w; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    const hingeX = (cx - x0 < x1 - cx ? x1 + 1 : x0) / w;                     // hinge on the far side from the touch
    return { cells: new Set(cells), x0: x0 / w, x1: (x1 + 1) / w, hinge: hingeX, size: cells.length, key: seed };
  }
  /** A whole door: the touched panel, every panel stacked above/below it with the same left and right edges, and the
   *  frame one square around them. Built from findPart, so it still comes from what the swarm sees. */
  findDoor(cx, cy) {
    const img = this.image; if (!img) return null; const { w, h } = img;
    let first = null; for (const tol of [20, 14, 10, 7]) { first = this.findPart(cx, cy, tol); if (first.size <= w * h * 0.15) break; }   // too big = spilled; match tighter
    if (!first || first.size < 4) return first;
    const X0 = Math.round(first.x0 * w), X1 = Math.round(first.x1 * w), mid = (X0 + X1) >> 1, cells = new Set(first.cells);
    let y0 = h, y1 = 0; const grow = p => { for (const i of p.cells) { cells.add(i); const y = (i / w) | 0; if (y < y0) y0 = y; if (y > y1) y1 = y; } };
    grow(first);
    for (let y = 0; y < h; y += 2) { if (cells.has(y * w + mid)) continue; const p = this.findPart(mid, y);
      if (p && p.size > 20 && p.size < w * h * 0.15 && Math.abs(Math.round(p.x0 * w) - X0) <= 2 && Math.abs(Math.round(p.x1 * w) - X1) <= 2) grow(p); }
    for (let y = Math.max(0, y0 - 1); y <= Math.min(h - 1, y1 + 1); y++) for (let x = Math.max(0, X0 - 2); x <= Math.min(w - 1, X1 + 1); x++) cells.add(y * w + x);
    let x0 = w, x1 = 0; for (const i of cells) { const x = i % w; if (x < x0) x0 = x; if (x > x1) x1 = x; }
    const hingeX = (cx - x0 < x1 - cx ? x1 + 1 : x0) / w;
    return { cells, x0: x0 / w, x1: (x1 + 1) / w, y0: y0 / h, y1: (y1 + 1) / h, hinge: hingeX, size: cells.size, key: cx * 1000 + cy };
  }

  /** Lift a part straight up (a lid or drawer front); called again by openPart to put it back. */
  liftPart(part, amount = 0.12) {
    const { w, h } = this.image;
    for (const u of this.units) { if (!u.target) continue; u.home ??= { x: u.target.x, y: u.target.y };
      const i = Math.min(h - 1, Math.floor(u.home.y * h)) * w + Math.min(w - 1, Math.floor(u.home.x * w)); if (!part.cells.has(i)) continue;
      u.target = { ...u.target, x: u.home.x, y: u.home.y - amount }; u.opened = true; }
    this.events.push({ t: this.t, type: "lift", size: part.size }); return true;
  }
  /** Open (or close) the part: its units swing about the hinge. The view follows because each unit moves to its new place. */
  openPart(part, angle = 1.2) {
    const { w, h } = this.image, key = part.hinge + ":" + Math.round(part.size / 20); this.parts ??= new Map();
    const open = !this.parts.get(key); this.parts.set(key, open);
    for (const u of this.units) { if (!u.target) continue; u.home ??= { x: u.target.x, y: u.target.y };
      const i = Math.min(h - 1, Math.floor(u.home.y * h)) * w + Math.min(w - 1, Math.floor(u.home.x * w)); if (!part.cells.has(i)) continue;
      const c = open ? Math.cos(angle) : 1, sy = open ? 1 + 0.08 * Math.abs(u.home.x - part.hinge) : 1;   // seen edge-on, the far side squeezes in
      u.target = { ...u.target, x: part.hinge + (u.home.x - part.hinge) * c, y: 0.5 + (u.home.y - 0.5) * sy }; u.opened = open; }
    this.events.push({ t: this.t, type: open ? "open" : "close", size: part.size }); return open;
  }

  /** What touching a unit WILL do — computed before any touch (no side effects). */
  predict(id) {
    const u = this.units[id], group = this.clusters().find(g => g.includes(u)) ?? [u];
    const hinge = group.reduce((h, v) => (v.bonds.length > h.bonds.length ? v : h), group[0]);
    const op = u.program[Math.floor(this.t) % (u.program.length || 1)] ?? null;
    return { unit: id, instruction: op, program: u.program, voice: u.voice, act: u.opcode.act, char: u.opcode.char, nato: u.opcode.nato, beats: u.opcode.beats,
      moves: group.map(v => v.id), pivot: hinge.id, visible: group.length > 1 };
  }
  /** Touch: carry out the predicted response. "open" swings the cluster about its most-bonded unit. */
  touch(id) {
    const p = this.predict(id), pv = this.units[p.pivot];
    const ang = { open: Math.PI / 2, turn: Math.PI / 6, pulse: 0, hold: 0 }[p.act];
    for (const k of p.moves) { const v = this.units[k]; if (v === pv) continue;
      const dx = v.x - pv.x, dy = v.y - pv.y, c = Math.cos(ang), s = Math.sin(ang);
      v.x = pv.x + dx * c - dy * s; v.y = pv.y + dx * s + dy * c;
      if (p.act === "pulse") v.health = Math.min(1, v.health + 0.05); }
    for (const k of p.moves) this.run(this.units[k], p.instruction, 0.02);   // the spec instruction, strongly
    this.events.push({ t: this.t, type: "touch", ...p }); return p;
  }

  /** Appearance of a unit right now: colour fades and the shape chips as health drops. */
  appearance(u) {
    const sat = u.color.s * u.health, light = u.color.l * (0.6 + 0.4 * u.health);
    const keep = Math.max(3, Math.round(u.shape.points.length * u.health));
    return { rgb: hslToRgb({ h: u.color.h, s: sat, l: light }), hex: "#" + hslToRgb({ h: u.color.h, s: sat, l: light }).map(x => x.toString(16).padStart(2, "0")).join(""),
      points: u.shape.points.filter((_, i) => i % Math.ceil(u.shape.points.length / keep) === 0),
      glyph: linkGlyph(u, u.bonds.map(e => this.units[e.a === u.id ? e.b : e.a])) };
  }

  /** HTML layer: the whole swarm as clickable SVG (data-unit carries the id for touch). */
  toSVG(size = 400) {
    const parts = this.units.filter(u => !u.broken).map(u => { const a = this.appearance(u), r = 10 * (0.5 + u.mass / 2);
      const dots = a.points.map(([px, py]) => `<rect x="${(u.x * size + px * r * 2).toFixed(1)}" y="${(u.y * size + py * r * 2).toFixed(1)}" width="1.4" height="1.4"/>`).join("");
      return `<g data-unit="${u.id}" fill="${a.hex}"><title>${u.opcode.char} ${u.sentence ?? ""}</title>${dots}</g>`; });
    const lines = this.units.flatMap(u => u.bonds.filter(e => e.a === u.id && e.visible).map(e => { const o = this.units[e.b];
      return `<line x1="${u.x * size}" y1="${u.y * size}" x2="${o.x * size}" y2="${o.y * size}" stroke="#889" stroke-width="${0.5 + e.depth}"/>`; }));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${lines.join("")}${parts.join("")}</svg>`;
  }
}
