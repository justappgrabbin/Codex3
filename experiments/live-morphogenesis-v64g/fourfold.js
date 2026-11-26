// fourfold.js — the four parts of the address ARE the four dimensions (user, Nov 20):
//   WHERE = Movement  : planetary, dimension, zodiac
//   WHAT  = Evolution : gate, line, color, tone, base
//   WHEN  = Being     : degree, minute, second
//   WHY   = Design    : arc (arc-second), house
//   (Space = Who, results from the four; never a part of its own.)
// The order of the four changes with the leading dimension. Drawing follows one chain:
//   1. Movement's words define the area — they are written into the shape.
//   2. The colour is defined by what came from those words.
//   3. The motion comes from the capital letter of the expression; Movement goes up.
// Nothing here replaces living.js; units get a .four record and the swarm can draw in "words" mode.
import { sentence, CHAINS } from "./lexicon.js";
import { colorFromSound, hslToRgb } from "./expression.js";
import { opcodeName } from "./bhantugh_ops.js";

export const PARTS = {
  where: { dim: "Movement", fields: ["planetary", "dimension", "zodiac"] },
  what: { dim: "Evolution", fields: ["gate", "line", "color", "tone", "base"] },
  when: { dim: "Being", fields: ["degree", "minute", "second"] },
  why: { dim: "Design", fields: ["arc", "house"] },
};
const DIM_PART = Object.fromEntries(Object.entries(PARTS).map(([p, v]) => [v.dim, p]));
const BASE_OF = { Movement: 1, Evolution: 2, Being: 3, Design: 4, Space: 5 };

// Orders by leading dimension. Movement-led M-E-B-D and Being-led B-M-D-E are the user's (frame orders, Nov 16/17:
// MEBDS default, BMSDE from Being, Space dropped since it is not a part). Evolution-led and Design-led are NOT given
// yet — rotation of the default is used and marked.
// Kept (not deleted): the earlier orders.
export const ORDER_BY_LEADER_V1 = {
  Movement: ["Movement", "Evolution", "Being", "Design"],
  Being: ["Being", "Movement", "Design", "Evolution"],
  Evolution: ["Evolution", "Being", "Design", "Movement"],   // NOT CONFIRMED (rotation)
  Design: ["Design", "Movement", "Evolution", "Being"],      // NOT CONFIRMED (rotation)
};
// Nov 22 (user, from the Black Book pages): the order out of singularity is a CIRCLE —
// One Being, Two Movement, Three Space, Four Design, Five Evolution, and back to Being. No dimension is better or
// worse; each leads to the next. Any leader's order = start at the leader and go round the circle.
// Space is in the circle but is not a part of the address, so it is passed over when listing parts.
export const DIMENSION_CIRCLE = ["Being", "Movement", "Space", "Design", "Evolution"];
export const nextInCircle = d => DIMENSION_CIRCLE[(DIMENSION_CIRCLE.indexOf(d) + 1) % DIMENSION_CIRCLE.length];
export const circleFrom = leader => { const i = DIMENSION_CIRCLE.indexOf(leader);
  return [...DIMENSION_CIRCLE.slice(i), ...DIMENSION_CIRCLE.slice(0, i)]; };
// UNDONE (user, Nov 22): making every leader's order a rotation of one circle was wrong — one template for all goes
// against proportion of perspective; each dimension has its OWN order and rules. The circle stays available
// (DIMENSION_CIRCLE / nextInCircle) but no order is derived from it. Active orders are the earlier ones again.
export const ORDER_BY_LEADER_CIRCLE_UNUSED = Object.fromEntries(["Movement", "Evolution", "Being", "Design"]
  .map(d => [d, circleFrom(d).filter(x => x !== "Space")]));
// Nov 22 (user: "there's math to this — Boolean vectors"). Each primary is a 2-bit vector, and each dimension
// walks to the next by ITS OWN Boolean operator, so every order is computed, none is a rotation of another.
// Vectors (my assignment, the one that reproduces both confirmed orders): Movement 00, Evolution 01, Being 11, Design 10
// (M-E-B-D is then the 2-bit Gray code: one bit changes per step).
//   Movement's rule: flip the low bit, then the high bit, alternating   (one step at a time, bottom up)
//   Being's rule:    complement both bits, then flip the high bit, alternating   (jumps to its opposite)
// Evolution's and Design's operators are NOT given yet -> their orders stay the earlier, unconfirmed ones.
export const DIM_VECTOR = { Movement: 0b00, Evolution: 0b01, Being: 0b11, Design: 0b10 };
const VEC_DIM = Object.fromEntries(Object.entries(DIM_VECTOR).map(([d, v]) => [v, d]));
export const OPERATORS = {
  Movement: [v => v ^ 0b01, v => v ^ 0b10],
  Being: [v => v ^ 0b11, v => v ^ 0b10],
};
/** Walk from the leader's vector with the leader's own operators; null if that dimension's operators aren't known. */
export function deriveOrder(leader) {
  const ops = OPERATORS[leader]; if (!ops) return null;
  let v = DIM_VECTOR[leader]; const out = [leader];
  for (let i = 0; out.length < 4; i++) { v = ops[i % ops.length](v); const d = VEC_DIM[v]; if (out.includes(d)) return null; out.push(d); }
  return out;
}
export const ORDER_BY_LEADER = Object.fromEntries(Object.keys(ORDER_BY_LEADER_V1)
  .map(d => [d, deriveOrder(d) ?? ORDER_BY_LEADER_V1[d]]));
export const CONFIRMED_ORDERS = ["Movement", "Being"];

/** One dimension's part of the address, and whether this unit carries it. */
export function part(addr, dim) {
  const p = PARTS[DIM_PART[dim]], vals = p.fields.map(k => addr[k]);
  return { dim, part: DIM_PART[dim], fields: p.fields, values: vals, carried: vals.some(v => v !== undefined && v !== null) };
}

/** A dimension's words: the gate's sentence walked through THAT dimension's own chain (lexicon Section 6),
 *  so the same gate says different words in each dimension. Falls back to the chain itself if Rule O halts. */
export function wordsIn(addr, dim) {
  if (!addr.gate) return [];
  const s = sentence({ gate: addr.gate, line: addr.line ?? 1, color: addr.color ?? 1, tone: addr.tone ?? 1, base: BASE_OF[dim] });
  if (!s.halted) return s.tokens.map(t => t.word);
  // Rule O halted this combination: the dimension still has its chain; start where this part of the address points
  const chain = [...CHAINS[dim].nature, ...CHAINS[dim].human], v = part(addr, dim).values.filter(x => typeof x === "number");
  const at = v.reduce((a, b) => a + b, 0) % chain.length;
  return [...chain.slice(at), ...chain.slice(0, at)].slice(0, 3);
}

/** Colour from the words: every letter is an ASCII code = MIDI note -> frequency; the words' sound sets the colour. */
export function colorOfWords(words) {
  const letters = words.join("").split("").filter(c => c.charCodeAt(0) < 128);
  const hz = letters.map(c => 440 * 2 ** ((c.charCodeAt(0) - 69) / 12));
  const lines = [0, 1, 2, 3, 4, 5].map(i => { const sub = hz.filter((_, k) => k % 6 === i); return sub.length ? Math.min(1, sub.reduce((a, b) => a + b, 0) / sub.length / 2000) : 0; });
  const snd = { f0: hz.length ? Math.min(...hz) : 110, voices: lines.map((w, i) => ({ line: i + 1, amp: w / 6, freq: 0 })), energy: lines.reduce((a, b) => a + b, 0) / 6 };
  const c = colorFromSound(snd); return { ...c, rgb: hslToRgb(c), hex: "#" + hslToRgb(c).map(x => x.toString(16).padStart(2, "0")).join("") };
}

/** Motion from the capital letter of the expression. The spec's opcode letters (A attract, B branch, F flock, M morph,
 *  O orbit, R repel, S spiral) are instructions; any capital also gives a heading (its place in A..Z around the circle).
 *  The dimension adds its own direction: Movement goes UP (Black Book: starts at the bottom and moves up). */
export const DIM_DIRECTION = { Movement: [0, -1] };     // others not given yet: no added direction
export function motionOf(words, dim) {
  const cap = (words.join(" ").match(/[A-Z]/) || ["A"])[0], k = cap.charCodeAt(0) - 65;
  const ang = (k / 26) * 2 * Math.PI, d = DIM_DIRECTION[dim] ?? [0, 0];
  return { capital: cap, instruction: opcodeName(cap.charCodeAt(0)), heading: [Math.cos(ang) * 0.5 + d[0], Math.sin(ang) * 0.5 + d[1]] };
}

/** The full fourfold reading of one address under a leader: the four parts in order, each with words, colour, motion.
 *  The FIRST in order is the one that defines the area (Movement by default). */
export function fourfold(addr, leader = "Movement") {
  const order = ORDER_BY_LEADER[leader] ?? ORDER_BY_LEADER.Movement;
  const parts = order.map(dim => { const w = wordsIn(addr, dim); return { ...part(addr, dim), words: w }; });
  const definer = parts.find(p => p.words.length) ?? parts[0];
  return { leader, order, parts, area: definer.words, color: colorOfWords(definer.words), motion: motionOf(definer.words, definer.dim),
    confirmedOrder: CONFIRMED_ORDERS.includes(leader) };
}

/** Calibration between two units: each of the four parts compared on its own (where/what/when/why). */
export function calibrate(a, b) {
  const out = {};
  for (const [p, v] of Object.entries(PARTS)) { const both = v.fields.filter(k => a[k] != null && b[k] != null);
    out[p] = { dim: v.dim, compared: both.length, same: both.filter(k => a[k] === b[k]).length }; }
  return out;
}

/** Qualities a unit has (user, Nov 22): the dimension part is the whole; beyond it the unit carries 1, 2 or 3 parts.
 *  1 part -> sound · 2 parts -> sound + colour · 3 parts -> sound + colour + shape. Counted from the address itself. */
export const QUALITY_ORDER = ["sound", "color", "shape"];
export function qualitiesOf(addr) {
  const beyond = ["what", "when", "why"].filter(p => PARTS[p].fields.some(k => addr[k] !== undefined && addr[k] !== null)).length;
  return { parts: beyond, qualities: QUALITY_ORDER.slice(0, beyond) };
}

/** Parts per dimension (user, Nov 22): Movement 1 (sound), Evolution 2 (sound+colour), Being 3 (sound+colour+shape).
 *  Design and Space not given yet -> counted from what the address carries. The user notes this may change with the
 *  leading dimension; how is not given yet, so the leader does not alter it here. */
export const PARTS_BY_DIMENSION = { Movement: 1, Evolution: 2, Being: 3 };
export function qualitiesByDimension(addr) {
  const n = PARTS_BY_DIMENSION[addr.dimension];
  if (n === undefined) return { ...qualitiesOf(addr), from: "address" };
  return { parts: n, qualities: QUALITY_ORDER.slice(0, n), from: "dimension" };
}

/** Every dimension holds all the dimensions (nested, not five layers). The dimension decides the PATTERN it reads with:
 *  Movement: straight down the column, in pairs (the dual)   Evolution: down and across (plus)
 *  Being: straight down, single                              Design: down, across and diagonal (all eight)
 *  Space: results from the four, reads them all.  Offsets are [dx, dy] in cells. */
export const READ_PATTERN = {
  Movement: [[0, 0], [0, 1], [0, -1], [1, 0], [1, 1], [1, -1]],          // column + its pair column
  Evolution: [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]],
  Being: [[0, 0], [0, 1], [0, -1]],
  Design: [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]],
  Space: [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1], [0, 2], [0, -2], [2, 0], [-2, 0]],
};
/** Sample an RGBA picture through a dimension's pattern: the colour that unit sees where it sits. */
export function readThrough(dim, px, w, h, cx, cy) {
  const P = READ_PATTERN[dim] ?? READ_PATTERN.Being; let r = 0, g = 0, b = 0, n = 0;
  for (const [dx, dy] of P) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const q = (y * w + x) * 4; r += px[q]; g += px[q + 1]; b += px[q + 2]; n++; }
  return n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : [0, 0, 0];
}

/** The fine address (degree, minute, second, arc-second) as one angle in arc-seconds within the sign (0..108000). */
export const fineArcsec = a => (a.degree ?? 0) * 3600 + (a.minute ?? 0) * 60 + (a.second ?? 0) + (a.arc ?? 0) / 100;
/** Where a unit sits SETS its fine address: across = degree + minute, down = second + arc-second. */
export function fineFromCell(cx, cy, w, h) {
  const across = cx / w * 30 * 60, down = cy / h * 60 * 100;        // minutes of arc across 30°, centi-arcsec down 60"
  return { degree: Math.floor(across / 60), minute: Math.floor(across % 60), second: Math.floor(down / 100), arc: Math.floor(down % 100) };
}
/** Orb weight: 1 when the fine addresses match, fading linearly to 0 at the orb (in arc-seconds). */
export const orbWeight = (a, b, orb) => Math.max(0, 1 - Math.abs(fineArcsec(a) - fineArcsec(b)) / orb);
/** Read the picture through the dimension's pattern, each neighbour counted by how close its fine address is (orb). */
export function readThroughOrb(dim, px, w, h, cx, cy, orb = null) {
  const P = READ_PATTERN[dim] ?? READ_PATTERN.Being, me = fineFromCell(cx, cy, w, h);
  orb ??= 2.5 * Math.max(30 * 3600 / w, 60 / h);                       // about two and a half squares
  let r = 0, g = 0, b = 0, n = 0;
  for (const [dx, dy] of P) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const k = Math.max(orbWeight(me, fineFromCell(x, y, w, h), orb), dx === 0 && dy === 0 ? 1 : 0), q = (y * w + x) * 4;
    r += px[q] * k; g += px[q + 1] * k; b += px[q + 2] * k; n += k; }
  return n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : [0, 0, 0];
}

/** The address is the state (user, Nov 22): how many sections a unit carries IS its dimension's depth.
 *  1st Movement: where · 2nd Evolution: + what · 3rd Being: + when · 4th Design: + why. Space results from all four.
 *  Which section comes next follows the leader's order (ORDER_BY_LEADER), starting from the unit's own "where". */
export const DEPTH = { Movement: 1, Evolution: 2, Being: 3, Design: 4, Space: 4 };
export function carriedSections(dim, leader = "Movement") {
  // Depth keeps the user's stated sequence (Movement where · Evolution +what · Being +when · Design +why),
  // so it reads the earlier order table, not the circle.
  const order = (ORDER_BY_LEADER_V1[leader] ?? ORDER_BY_LEADER_V1.Movement).map(d => DIM_PART[d]);
  const seq = ["where", ...order.filter(p => p !== "where")];
  return seq.slice(0, DEPTH[dim] ?? 1);
}
/** Strip an address down to what its dimension carries. */
export function stateOf(addr, dim = addr.dimension, leader = "Movement") {
  const keep = new Set(carriedSections(dim, leader).flatMap(p => PARTS[p].fields)), out = {};
  for (const [k, v] of Object.entries(addr)) if (keep.has(k)) out[k] = v;
  return out;
}
/** Qualities from depth: 1 sound · 2 + colour · 3 + shape · 4 all three (+ why). */
export function qualitiesOfState(dim) { const n = DEPTH[dim] ?? 1; return { parts: n, qualities: QUALITY_ORDER.slice(0, Math.min(3, n)) }; }
