// dimensions.js — the swarm five dimensions deep. Each dimension has its own ORDER (which I Ching),
// RULES (how a unit relates inside that dimension), IMPLEMENTATION (what it does: function aspect)
// and EXPRESSION (how it shows: visual aspect). Nothing here replaces organism.js; it reads it.
//
// Orders, user's assignment: Movement = King Wen, Evolution = Mawangdui, Being = Fuxi;
// Design (the 4th) uses the same order as the 1st, Movement: King Wen (user, Nov 22). Space has none of its own and
// takes the order of whichever dimension is leading.
// All three orders are DERIVED by rule from the six lines (no typed tables beyond kingwen.js):
//   Fuxi (Shao Yong): binary counting 0..63 with the TOP line as the lowest bit (Kun 0, Bo 1, Bi 2 ...).
//   Mawangdui: upper trigrams Qian, Gen, Kan, Zhen, Kun, Dui, Li, Xun; inside each octet the doubled
//   trigram first, then the lower trigrams in the order Qian, Kun, Gen, Dui, Kan, Li, Zhen, Xun.
//
// Rules — my translation of the user's reading of the Black Book (correct any of them):
//   Movement  "starts at the bottom and moves up"       -> reads lines 1->6; relates FORWARD to the next position (LEADS TO)
//   Evolution "has two before"                          -> a position is formed from the two before it (NEAR)
//   Being     "doesn't announce itself, it just is"     -> no outgoing reach; relates by what it shares (CONTAINS, AND)
//   Design    "takes a little from all, not the fifth"  -> composes Movement, Evolution, Being (EXPRESSES)
//   Space     "doesn't see itself, sees everybody else" -> reads every other unit, never itself (the Who)
import { kingWenFromMask, maskFromKingWen } from "./kingwen.js";
import { describe } from "./hexagram.js";
import { express } from "./expression.js";

const rev6 = m => { let r = 0; for (let i = 0; i < 6; i++) r |= ((m >>> i) & 1) << (5 - i); return r; };
// trigram 3-bit values, bottom line = bit 0 (hexagram.js convention)
const T = { Kun: 0, Zhen: 1, Kan: 2, Dui: 3, Gen: 4, Li: 5, Xun: 6, Qian: 7 };
const MWD_UPPER = ["Qian", "Gen", "Kan", "Zhen", "Kun", "Dui", "Li", "Xun"].map(n => T[n]);
const MWD_LOWER = ["Qian", "Kun", "Gen", "Dui", "Kan", "Li", "Zhen", "Xun"].map(n => T[n]);

/** Sequences as arrays of masks, position 0..63. */
export const ORDERS = {
  KingWen: [...Array(64)].map((_, i) => maskFromKingWen(i + 1)),
  Fuxi: [...Array(64)].map((_, i) => rev6(i)),
  Mawangdui: MWD_UPPER.flatMap(u => [u, ...MWD_LOWER.filter(l => l !== u)].map(l => (u << 3) | l)),
};
const INDEX = Object.fromEntries(Object.entries(ORDERS).map(([k, seq]) => { const ix = new Array(64); seq.forEach((m, i) => ix[m] = i); return [k, ix]; }));
export const positionIn = (order, mask) => INDEX[order][mask & 0x3f];
export const maskAt = (order, pos) => ORDERS[order][((pos % 64) + 64) % 64];

export const DIMENSION_RULES = {
  Movement:  { order: "KingWen",   link: "LEADS TO",  wh: "Where", reads: "lines bottom to top, forward to the next position" },
  Evolution: { order: "Mawangdui", link: "NEAR",      wh: "What",  reads: "each position formed from the two before it" },
  Being:     { order: "Fuxi",      link: "CONTAINS",  wh: "When",  reads: "no reach; relates only by what it shares" },
  Design:    { order: "KingWen",   link: "EXPRESSES", wh: "Why",   reads: "composes Movement, Evolution, Being; not Space" },
  Space:     { order: null,        link: "WHO",       wh: "Who",   reads: "sees every other unit, never itself" },
};
export const DIM_NAMES = Object.keys(DIMENSION_RULES);
const popcount = m => { let c = 0; while (m) { c += m & 1; m >>>= 1; } return c; };

/** Which order a dimension uses when `leading` leads (Design/Space borrow the leader's). */
export function orderFor(dim, leading = "Movement") {
  return DIMENSION_RULES[dim].order ?? DIMENSION_RULES[leading].order ?? "KingWen";
}

/** One dimension's relations among a set of masks. Returns [{from,to,weight,link}] — the rule IS the code path. */
export function relationsIn(dim, masks, leading = "Movement") {
  const ord = orderFor(dim, leading), P = masks.map(m => positionIn(ord, m)), n = masks.length, out = [], link = DIMENSION_RULES[dim].link;
  const dist = (a, b) => ((b - a) % 64 + 64) % 64;            // forward distance in this dimension's order
  if (dim === "Movement") for (let i = 0; i < n; i++) {         // forward to the nearest unit ahead
    let best = -1, bd = 65; for (let j = 0; j < n; j++) if (j !== i) { const d = dist(P[i], P[j]); if (d > 0 && d < bd) { bd = d; best = j; } }
    if (best >= 0) out.push({ from: i, to: best, weight: 1 / bd, link }); }
  if (dim === "Evolution") for (let i = 0; i < n; i++) {        // the two nearest units behind form it
    const behind = [...Array(n).keys()].filter(j => j !== i && dist(P[j], P[i]) > 0).sort((a, b) => dist(P[a], P[i]) - dist(P[b], P[i])).slice(0, 2);
    for (const j of behind) out.push({ from: j, to: i, weight: 1 / dist(P[j], P[i]), link }); }
  if (dim === "Being") for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {   // shared lines, symmetric, no direction
    const s = popcount(masks[i] & masks[j]); if (s >= 3) out.push({ from: i, to: j, weight: s / 6, link, symmetric: true }); }
  if (dim === "Design") {                                       // takes a little from the three that have orders
    const acc = new Map(); for (const d of ["Movement", "Evolution", "Being"]) for (const r of relationsIn(d, masks, leading)) {
      const k = r.from < r.to ? `${r.from}-${r.to}` : `${r.to}-${r.from}`, e = acc.get(k) ?? { from: Math.min(r.from, r.to), to: Math.max(r.from, r.to), weight: 0, link, from_dims: [] };
      e.weight += r.weight / 3; e.from_dims.push(d); acc.set(k, e); }
    out.push(...[...acc.values()].filter(e => e.from_dims.length >= 2)); }
  if (dim === "Space") for (let i = 0; i < n; i++) {           // each unit's reading of all the others, excluding itself
    for (let j = 0; j < n; j++) if (j !== i) out.push({ from: i, to: j, weight: (6 - popcount(masks[i] ^ masks[j])) / 6 / (n - 1), link }); }
  return out;
}

/** Movement reads bottom->top; the other dimensions keep the trigram faces (1-3 inward, 4-6 outward). */
export function readLines(dim, mask) {
  const lines = describe(mask).lines;
  return dim === "Movement" ? lines.map((v, i) => ({ line: i + 1, v })) : lines.map((v, i) => ({ line: i + 1, v, face: i < 3 ? "inward" : "outward" }));
}

/** The five layers for a set of agents: position in its order, relations, implementation, expression. */
export function layers(agents, leading = "Movement") {
  const masks = agents.map(a => a.targetMask);
  return DIM_NAMES.map((dim, d) => {
    const ord = orderFor(dim, leading), rel = relationsIn(dim, masks, leading);
    const units = agents.map((a, i) => {
      const dd = a.dims?.[dim], smooth = a.smoothedLines;
      return { agent: i, position: positionIn(ord, masks[i]), angle: positionIn(ord, masks[i]) / 64 * 2 * Math.PI,
        kingWen: kingWenFromMask(masks[i]),
        implementation: dd ? { value: dd.function.value, sentence: dd.function.sentence, reaches: dd.function.reaches } : null,
        expression: express(smooth, d % 4),            // own register per dimension (Space wraps to the Mind field register)
        visualValue: dd?.visual.value ?? 0 };
    });
    return { dimension: dim, depth: d + 1, ...DIMENSION_RULES[dim], order: ord, leading, units, relations: rel };
  });
}
