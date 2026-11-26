// klein_local.js — Klein computation INSIDE each unit. No central controller, no state space.
// Agreed with the user (Nov 22): every unit carries two parts —
//   INSTINCT (same code in every unit, like the shared weights in Badalov's thesis):
//     ATO analogy on the unit's own address bits and a neighbour's: A:B::C:D, D = C xor (A xor B)
//   CULTURE (its own, learned only from what it lived through):
//     AUTOLING-shaped sentence rules  {lhs:"S", rhs:[action, kind, result], frequency}
//     DISEMINER-shaped links           from -> to, weight; "can this lead to that" by walking its own links
// Rules travel ONLY by contact: each gossip round a unit offers its strongest rules to the units it is bonded to.
// The receiver weighs an offer by the bond's strength and by whether its own instinct agrees with it.
// Nothing reads the whole swarm to decide; consensus() only MEASURES what settled (observer, not controller).
// Additive: living.js is not changed; this attaches to a LivingSwarm.
// Analogy runs on each unit's LINES as its own dimension reads them (see linesOf), 1 to 6 bits, never 0.
// Rule/record shapes match vendor/kmge.js so a unit's culture can be handed to klein_bridge.js to be recorded.
import { OPCODES } from "./bhantugh_ops.js";
import { orderFor, maskAt, positionIn, DIM_NAMES } from "./dimensions.js";
import { nextInCircle } from "./fourfold.js";

export const ACTIONS = Object.values(OPCODES);           // the spec's ten instructions are the possible results
export const LOCAL = { OFFER: 3, FORGET: 0.02, FLOOR: 0.05, AGREE: 1, DISAGREE: 0.3, LEARN: 1 };
const KEY_BITS = 4;                                      // 2^4 = 16 >= 10 instructions

/** A unit's LINES (user, Nov 22): the dimension IS the hexagram — the gate is a position in that dimension's own
 *  order (Movement/Design King Wen, Evolution Mawangdui, Being Fuxi, Space = the leader's), so the same gate number
 *  gives different lines in different dimensions. A particle carries 1 to 6 lines from the bottom up
 *  (address.depth, default 6), or its lines directly (address.lines). Never 0: with no gate and no lines a unit is
 *  not a particle yet and takes no part in Klein exchange (returns null).  Planetary stays its own section (unused here). */
export function linesOf(address, leader = "Movement") {
  if (Array.isArray(address.lines) && address.lines.length) {
    if (address.lines.length > 6 || !address.lines.every(b => b === 0 || b === 1)) throw new Error("lines must be 1 to 6 values of 0 or 1");
    return [...address.lines];
  }
  if (!address.gate) return null;
  const dim = DIM_NAMES.includes(address.dimension) ? address.dimension : leader;
  const mask = maskAt(orderFor(dim, leader), address.gate - 1);
  const depth = Math.min(6, Math.max(1, address.depth ?? 6));
  return Array.from({ length: depth }, (_, i) => (mask >>> i) & 1);      // line 1 (bottom) first
}
const keyOf = u => u.lines;
const toInt = b => b.reduce((v, x) => (v << 1) | x, 0);
const toBits = (n, k = KEY_BITS) => Array.from({ length: k }, (_, i) => (n >> (k - 1 - i)) & 1);
const actionBits = a => toBits(Math.max(0, ACTIONS.indexOf(a)));
const bitsAction = b => ACTIONS[toInt(b) % ACTIONS.length];

/** INSTINCT — Klein's ATO: A is to B as C is to D. All four are bit strings; D = C xor (A xor B). */
export function ato(A, B, C) { return C.map((c, i) => c ^ (A[i] ^ B[i])); }

/** Neighbour n (key A) got result R (B = R's bits) in a situation; what would I (key C) get?
 *  Addresses have different depths (a unit carrying only planetary/dimension has no bits at all), so the analogy
 *  runs only over the bits BOTH units carry, up to 4. The result's remaining bits pass through unchanged.
 *  Two units with no shared bits cannot reason by analogy: the result is copied as it was (plain imitation). */
export function sharedWidth(a, b) { return Math.min(a.lines?.length ?? 0, b.lines?.length ?? 0, KEY_BITS); }
export function instinct(me, neighbour, result) {
  const k = sharedWidth(me, neighbour), B = actionBits(result);
  if (k === 0) return result;
  const D = ato(keyOf(neighbour).slice(0, k), B.slice(KEY_BITS - k), keyOf(me).slice(0, k));
  const out = bitsAction([...B.slice(0, KEY_BITS - k), ...D]);
  return out ?? result;
}

/** Give every unit its own culture (idempotent). */
export function grow(swarm) {
  for (const u of swarm.units) { u.culture ??= { rules: [], links: [], lived: 0 };
    u.lines = linesOf(u.address, swarm.leader); u.particle = u.lines !== null; }   // re-read: the leader can change Space's order
  return swarm;
}
/** Units that are not particles yet (no gate, no lines) — listed, never silently given bits. */
export function notParticles(swarm) { grow(swarm); return swarm.units.filter(u => !u.particle).map(u => u.id);
}
const sameRhs = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

function addRule(u, rhs, freq, source) {
  const r = u.culture.rules.find(x => sameRhs(x.rhs, rhs));
  if (r) { r.frequency += freq; return r; }
  const rule = { id: `U${u.id}_${u.culture.rules.length}`, lhs: "S", rhs: [...rhs], isRecursive: false, isSentenceRule: true,
    frequency: freq, sourceContext: source };
  u.culture.rules.push(rule); return rule;
}
function addLink(u, from, to, w) {
  const l = u.culture.links.find(x => x.from === from && x.to === to);
  if (l) l.weight += w; else u.culture.links.push({ from, to, transitive: true, weight: w });
}

/** A unit lives something: [action, part kind, result]. Only that unit's culture changes. */
export function live(u, action, kind, result, ok = true) {
  const w = ok ? LOCAL.LEARN : -LOCAL.LEARN * 0.5;
  addRule(u, [action, kind, result], w, "lived");
  addLink(u, action, kind, Math.abs(w)); addLink(u, kind, result, w);
  u.culture.lived++;
}

/** What this unit expects doing `action` to a `kind` will do — from its own culture first, then instinct
 *  (analogy from the bonded neighbour whose culture has the strongest answer), else null. */
export function expect(swarm, u, action, kind) {
  if (!u.particle) return null;
  const own = u.culture.rules.filter(r => r.rhs[0] === action && r.rhs[1] === kind && r.frequency > 0)
    .sort((a, b) => b.frequency - a.frequency)[0];
  if (own) return { result: own.rhs[2], from: "culture", strength: own.frequency };
  let best = null;
  for (const e of u.bonds) {
    const n = swarm.units[e.a === u.id ? e.b : e.a]; if (n.broken || !n.culture || !n.particle) continue;
    const r = n.culture.rules.filter(x => x.rhs[0] === action && x.rhs[1] === kind && x.frequency > 0)
      .sort((a, b) => b.frequency - a.frequency)[0];
    if (r && (!best || r.frequency * e.strength > best.strength))
      best = { result: instinct(u, n, r.rhs[2]), from: "instinct", via: n.id, strength: r.frequency * e.strength };
  }
  return best;
}

/** DISEMINER-style: can `a` lead to `b` through this unit's own links (any number of steps)? */
export function canLeadTo(u, a, b) {
  const seen = new Set([a]), stack = [a];
  while (stack.length) { const x = stack.pop(); if (x === b && x !== a) return true;
    for (const l of u.culture.links) if (l.from === x && l.weight > 0 && !seen.has(l.to)) { if (l.to === b) return true; seen.add(l.to); stack.push(l.to); } }
  return false;
}

/** One gossip round: each unit offers its strongest rules to the units it is bonded to (contact only).
 *  Offers are collected first, then taken in, so the order units are visited in does not matter. */
export function gossip(swarm, rounds = 1) {
  grow(swarm);
  for (let k = 0; k < rounds; k++) {
    const inbox = new Map();
    for (const u of swarm.units) { if (u.broken || !u.particle) continue;
      const offer = [...u.culture.rules].filter(r => r.frequency > 0).sort((a, b) => b.frequency - a.frequency).slice(0, LOCAL.OFFER);
      for (const e of u.bonds) { const n = swarm.units[e.a === u.id ? e.b : e.a]; if (n.broken || !n.particle) continue;
        for (const r of offer) (inbox.get(n.id) ?? inbox.set(n.id, []).get(n.id)).push({ from: u, rule: r, strength: e.strength }); } }
    for (const [id, offers] of inbox) { const n = swarm.units[id];
      for (const { from, rule, strength } of offers) {
        // instinct checks the offer: does my own analogy from the sender give the same result?
        const mine = instinct(n, from, rule.rhs[2]);
        const fit = mine === rule.rhs[2] ? LOCAL.AGREE : LOCAL.DISAGREE;
        // what arrives is the rule as MY instinct reads it (culture passes through each body)
        addRule(n, [rule.rhs[0], rule.rhs[1], mine], rule.frequency * strength * fit * 0.5, `unit${from.id}`);
      } }
    for (const u of swarm.units) {                        // what is not used fades
      for (const r of u.culture.rules) r.frequency *= 1 - LOCAL.FORGET;
      u.culture.rules = u.culture.rules.filter(r => Math.abs(r.frequency) >= LOCAL.FLOOR || r.sourceContext === "lived");
    }
  }
  return swarm;
}

/** Touch handled by the touched unit itself: it decides from culture/instinct, its bonded cluster carries it out,
 *  and what happened becomes that unit's experience. `judge(result)` (optional) says if it worked. */
export function touchLocal(swarm, id, kind = "part", judge = null, predicted = undefined) {
  grow(swarm);
  const u = swarm.units[id];
  if (!u.particle) throw new Error(`unit ${id} is not a particle yet (no gate or lines), so it cannot decide`);
  const guess = expect(swarm, u, "touch", kind);
  const result = guess?.result ?? predicted ?? swarm.predict(id).instruction ?? u.opcode.act;   // nothing learned: what was predicted (shown) first, else its program
  const group = swarm.clusters().find(g => g.includes(u)) ?? [u];
  for (const v of group) swarm.run(v, result, 0.02);
  const ok = judge ? !!judge(result, u) : true;
  live(u, "touch", kind, result, ok);
  swarm.events.push({ t: swarm.t, type: "local-touch", unit: id, kind, result, from: guess?.from ?? "program", via: guess?.via ?? null, ok });
  return { unit: id, result, from: guess?.from ?? "program", via: guess?.via ?? null, ok, moved: group.map(v => v.id) };
}

/** OBSERVER ONLY: what the swarm as a whole has settled on for a situation (nothing here feeds back). */
export function consensus(swarm, action, kind) {
  const tally = new Map(); let voters = 0;
  for (const u of swarm.units) { if (u.broken || !u.culture) continue;
    const r = u.culture.rules.filter(x => x.rhs[0] === action && x.rhs[1] === kind && x.frequency > 0).sort((a, b) => b.frequency - a.frequency)[0];
    if (r) { voters++; tally.set(r.rhs[2], (tally.get(r.rhs[2]) ?? 0) + 1); } }
  const ranked = [...tally].sort((a, b) => b[1] - a[1]);
  return { voters, ranked, share: ranked.length ? ranked[0][1] / voters : 0 };
}

/** Hand one unit's culture to the recording bridge (klein_bridge.js SwarmKlein.import) — recording, not control. */
export const cultureOf = u => ({ rules: u.culture.rules.map(r => ({ ...r })), links: u.culture.links.map(l => ({ ...l })), events: u.culture.lived });

/** I Ching logic (user, Nov 22): a CHANGING LINE flips (yin<->yang) and leads to a new line, and so to a new hexagram.
 *  Only lines the particle carries can change. With all six lines, the new hexagram's place is read in the particle's
 *  own dimension order (same dimension — the change happens inside it). Returns the new lines and, if whole, the gate. */
export function changeLine(lines, line, dimension = "Movement", leader = "Movement") {
  if (!Number.isInteger(line) || line < 1 || line > lines.length) throw new Error(`line ${line} is not carried (particle has ${lines.length})`);
  const out = [...lines]; out[line - 1] ^= 1;
  if (out.length < 6) return { lines: out, gate: null };
  const mask = out.reduce((m, b, i) => m | (b << i), 0);
  const dim = DIM_NAMES.includes(dimension) ? dimension : leader;
  return { lines: out, gate: positionIn(orderFor(dim, leader), mask) + 1 };
}
/** Particles lead to particles round the circle (Being -> Movement -> Space -> Design -> Evolution -> Being):
 *  not better or worse, just next. Does u lead to v? */
export function leadsTo(u, v) {
  const a = u.address?.dimension ?? u.dimension, b = v.address?.dimension ?? v.dimension;
  return !!a && !!b && nextInCircle(a) === b;
}

/** How a dimension splits its six lines into particles (user, Nov 22). Movement 1+2+3 (a line, a pair, a trigram),
 *  Evolution 3+3 (two trigrams), Being 2+2+2 (three pairs). Design splits like Movement (user: same King Wen order).
 *  Space: follows the leading dimension's split (default Evolution).
 *  Pieces are taken from the bottom line up. */
export const SPLIT = { Movement: [1, 2, 3], Evolution: [3, 3], Being: [2, 2, 2] };
SPLIT.Design = SPLIT.Movement;   // same King Wen order -> same split (user, Nov 22)
// Space has no split of its own: it is derived from whichever dimension is leading (user, Nov 22);
// when nothing else is given it starts from Evolution (user: "start it from Evolution").
export const SPACE_DEFAULT_LEADER = "Evolution";
export function splitFor(dimension, leader = SPACE_DEFAULT_LEADER) {
  if (dimension === "Space") return SPLIT[leader] ?? SPLIT[SPACE_DEFAULT_LEADER];
  return SPLIT[dimension] ?? null;
}
export function splitLines(lines, dimension, leader = SPACE_DEFAULT_LEADER) {
  const sizes = splitFor(dimension, leader); if (!sizes) return null;
  if (lines.length !== 6) throw new Error("splitting needs the whole hexagram (6 lines)");
  const out = []; let i = 0; for (const n of sizes) { out.push(lines.slice(i, i + n)); i += n; } return out;
}
/** Particles needed to make one hexagram in a dimension (null if its split is not given). */
export const particlesPerHexagram = (d, leader = SPACE_DEFAULT_LEADER) => splitFor(d, leader)?.length ?? null;

// Keeping cultures across reloads. A culture belongs to the unit's identity (its address), so it is keyed by the address,
// not by the unit's place in the list. Only a unit that has not lived anything yet takes a saved culture back.
export const identityKey = u => JSON.stringify(Object.keys(u.address).sort().map(k => [k, u.address[k]]));
export function exportCultures(swarm) {
  const out = {}; for (const u of swarm.units) if (u.culture && (u.culture.lived || u.culture.rules.length)) out[identityKey(u)] = cultureOf(u);
  return out;
}
export function applyCultures(swarm, saved) {
  if (!saved) return 0; let n = 0;
  for (const u of swarm.units) { const c = saved[identityKey(u)]; if (!c || !u.culture || u.culture.lived || u.culture.rules.length) continue;
    u.culture.rules = c.rules.map(r => ({ ...r })); u.culture.links = c.links.map(l => ({ ...l })); u.culture.lived = c.events ?? 0; n++; }
  return n;
}
