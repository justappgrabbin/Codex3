// bhantugh_ops.js — the user's BHANTUGH spec (Nov 20 rewrite) as working operations. Pure JS.
// Adds to living.js; replaces nothing.
//   ASCII   -> behavioural opcodes (spec §5 table) AND MIDI notes (ASCII 0-127 == MIDI 0-127)
//   NATO    -> voice: the spoken code words (spec §7)
//   Binary+Hex -> tone (from the hexagram bits, in living.soundOf)
//   Bonds   -> spec §19: dimension equality, line/color/tone resonance or opposite trigram, base mirror; levels §20
//   Leading dimension -> highest connection density (§23), among Movement/Evolution/Being/Design only:
//                        Space doesn't lead (user's Black Book page: Space results from the four, contributes nothing)
//   Seen / experienced -> one swarm, two sides at right angles; the why is where they cross (cross product)
//   Image   -> ASCII art: picture -> brightness -> characters; five layers stacked make the full image;
//              Sobel edges (§21) mark contours. Units move to their cells: the swarm becomes the picture.
//   Contracts -> TypeScript-style structural checks before a bond is accepted (§8)
import { gematria } from "./living.js";

// ---- ASCII opcodes, exactly the spec's table (§5) ----
export const OPCODES = { 0x07: "alert", 0x09: "align", 0x1b: "exit",
  0x41: "attract", 0x42: "branch", 0x46: "flock", 0x4d: "morph", 0x4f: "orbit", 0x52: "repel", 0x53: "spiral" };
export const opcodeName = code => OPCODES[code] ?? OPCODES[code & ~0x20] ?? null;   // lowercase = same instruction

/** The address as its structured sentence (spec §18 example format). This is the unit's letters. */
export function addressSentence(a) {
  const ang = a.degree != null ? ` | ${a.degree}°${String(a.minute ?? 0).padStart(2, "0")}'${String(a.second ?? 0).padStart(2, "0")}"` : "";
  return [a.dimension && `Dimension: ${a.dimension}`, a.planetary && `Planet: ${a.planetary}`, a.zodiac && `Zodiac: ${a.zodiac}`,
    a.gate && `Gate ${a.gate}${a.line ? "." + a.line : ""}`, a.color && `Color ${a.color}`, a.tone && `Tone ${a.tone}`, a.base && `Base ${a.base}`]
    .filter(Boolean).join(" | ") + ang + (a.arc != null ? ` | Arc ${a.arc}` : "") + (a.house ? ` | House ${a.house}` : "");
}

/** The instruction program a unit carries: the opcodes found in its sentence, in order. */
export function program(text) { return [...text].map(c => opcodeName(c.charCodeAt(0))).filter(Boolean); }

// ---- sound: ASCII as MIDI, NATO as voice ----
const NATO = { A: "Alfa", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot", G: "Golf", H: "Hotel", I: "India",
  J: "Juliett", K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar", P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra",
  T: "Tango", U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee", Z: "Zulu",
  0: "Zero", 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine" };
export const midiToHz = n => 440 * 2 ** ((n - 69) / 12);
/** Melody: every ASCII character is a MIDI note number; gematria sets how long it is held. */
export function melody(text) {
  return [...text].filter(c => c.charCodeAt(0) < 128 && c !== " ").map(c => { const n = c.charCodeAt(0);
    return { char: c, midi: n, hz: midiToHz(n), beats: 1 + (gematria(c) % 4) }; });
}
/** Voice: the NATO words to speak (letters and digits; everything else is a pause). */
export function voice(text) { return [...text.toUpperCase()].map(c => NATO[c] ?? null).filter(Boolean); }

// ---- bonds, spec §19 ----
export const isHarmonic6 = (a, b) => a === b || Math.abs(a - b) === 3;
export const isHarmonicBase = (a, b) => a === b || a + b === 6;
/** Contract (§8): what a unit must carry for a bond to be evaluated at all. */
export const CONTRACTS = {
  bondable: a => Number.isInteger(a.gate) && a.gate >= 1 && a.gate <= 64,
  full: a => ["line", "color", "tone", "base"].every(k => Number.isInteger(a[k])),
};
export function evaluateSwarmBond(A, B) {
  if (!CONTRACTS.bondable(A) || !CONTRACTS.bondable(B)) return { rejected: "contract", connectionCount: 0, isVisible: false, level: 0, matched: [] };
  const matched = [];
  if (A.dimension && A.dimension === B.dimension) matched.push("dimension");
  for (const k of ["line", "color", "tone"]) if (A[k] != null && B[k] != null && isHarmonic6(A[k], B[k])) matched.push(k);
  if (A.base != null && B.base != null && isHarmonicBase(A.base, B.base)) matched.push("base");
  const n = matched.length;
  return { beneficial: n > 0, connectionCount: n, isVisible: n >= 3, level: Math.min(5, n), matched };
}
/** §20 levels: what becomes visible at each count. */
export const LEVELS = ["silent", "silent", "silent", "lines + sentences", "dimensional grouping", "interactive control"];

/** §23 leading dimension = densest connections; Space excluded (it results from the four). */
export function leadingDimension(units, bonds) {
  const PRIM = ["Movement", "Evolution", "Being", "Design"], score = Object.fromEntries(PRIM.map(d => [d, 0]));
  for (const e of bonds) for (const u of [units[e.a], units[e.b]]) if (u && PRIM.includes(u.address.dimension)) score[u.address.dimension] += e.connectionCount ?? e.count ?? 1;
  return { leader: PRIM.reduce((b, d) => (score[d] > score[b] ? d : b), PRIM[0]), score };
}

// ---- seen / experienced / why ----
// My reading of the user (correct it): SEEN comes from the numbers (angles of the address); EXPERIENCED from the
// letters (the sentence: its gematria, its program, its voice). Same unit, two sides at right angles; the why = seen × experienced.
export function seenVector(a) {
  const t = ((a.degree ?? 0) * 3600 + (a.minute ?? 0) * 60 + (a.second ?? 0)) / (30 * 3600);
  return [Math.cos(2 * Math.PI * t), Math.sin(2 * Math.PI * t), ((a.base ?? 3) - 3) / 2];
}
export function experiencedVector(a) {
  const s = addressSentence(a), g = gematria(s), prog = program(s);
  return [Math.cos(2 * Math.PI * (g % 64) / 64), Math.sin(2 * Math.PI * (g % 64) / 64), Math.tanh(prog.length / 6) * 2 - 1];
}
export const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
export function why(a) { const s = seenVector(a), e = experiencedVector(a), w = cross(s, e);
  return { seen: s, experienced: e, why: w, strength: Math.hypot(...w) }; }

// ---- image from ASCII: five layers stack into the full picture ----
export const RAMP = " .:-=+*#%@";                 // light -> dark
/** gray: Float array 0..1 (row-major w*h). Returns five layers + Sobel edges + the stacked ASCII picture. */
export function asciiImage(gray, w, h) {
  let lo = Infinity, hi = -Infinity; for (const v of gray) { if (v < lo) lo = v; if (v > hi) hi = v; }   // use the picture's own range
  gray = Float32Array.from(gray, v => hi > lo ? (v - lo) / (hi - lo) : v);
  const at = (x, y) => gray[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  const layers = [0, 1, 2, 3, 4].map(() => new Uint8Array(w * h)), edges = new Float32Array(w * h), rows = [];
  for (let y = 0; y < h; y++) { let row = "";
    for (let x = 0; x < w; x++) {
      const v = at(x, y), band = Math.min(4, Math.floor((1 - v) * 5));             // which of the five layers holds this cell
      for (let k = 0; k <= band; k++) layers[k][y * w + x] = 1;                         // layers stack: darker = more layers on
      const gx = -at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1) + at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1);
      const gy = -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) + at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
      edges[y * w + x] = Math.hypot(gx, gy);
      const depth = layers.reduce((s, L) => s + L[y * w + x], 0);                       // 0..5 layers present
      row += RAMP[Math.round(depth / 5 * (RAMP.length - 1))];
    } rows.push(row); }
  return { layers, edges, text: rows.join("\n"), w, h };
}
/** Targets for the swarm: each unit takes a cell of the layer of its own dimension (edges first). */
export function pictureTargets(img, units, oneUnitPerSquare = true) {
  const DIMS = ["Movement", "Evolution", "Being", "Design", "Space"], out = new Map(), used = new Set();
  // deepest layers choose first, so dark squares go to the dimensions that reach them
  const ordered = [...units].sort((a, b) => DIMS.indexOf(b.address.dimension) - DIMS.indexOf(a.address.dimension));
  for (const u of ordered) {
    const k = Math.max(0, DIMS.indexOf(u.address.dimension)), L = img.layers[k];
    let best = -1, bs = -1;
    for (let i = 0; i < L.length; i++) if (L[i] && !used.has(oneUnitPerSquare ? i : k * L.length + i)) { const s = img.edges[i] + ((i * 2654435761 + u.id * 40503) % 997) / 9970;
      if (s > bs) { bs = s; best = i; } }
    if (best >= 0) { used.add(oneUnitPerSquare ? best : k * L.length + best); out.set(u.id, { x: (best % img.w + 0.5) / img.w, y: (Math.floor(best / img.w) + 0.5) / img.h, layer: k }); }
  }
  return out;
}
