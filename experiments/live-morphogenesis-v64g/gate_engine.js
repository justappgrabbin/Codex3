// gate_engine.js — what each piece DOES, and how that doing is expressed (user, Nov 25).
// Two layers, fixed first, then swayed:
//   1. GATE = a fixed way of doing (its function). Derived from the hexagram's own structure — the inner trigram's
//      action (lines 1-3) worked into the outer trigram's field (lines 4-6) — and checked against the gate's own words
//      (keynote, archetype, circuit, center from vocabulary.json / the Blue I Ching).
//   2. LINE = a fixed way that doing is expressed (six modes), plus the gate's own line name.
//      Then the line is SWAYED by colour (motivation), tone (how it senses), base (which question/dimension it stands in).
// Trigram attributes are the classical I Ching ones (Heaven creative, Earth receptive, Thunder arousing, Water abysmal,
// Mountain keeping still, Wind gentle/penetrating, Fire clinging/bright, Lake joyous). Line modes are the standard
// six line themes (1 foundation … 6 role model). The swarm operation each verb maps to is this file's proposal (marked).
import { KW_MASK } from "./kingwen.js";

/** trigram from three lines, bottom line = lowest bit (kingwen.js: bit i = line i+1) */
export const TRIGRAMS = {
  7: { name: "Heaven", act: "initiates", op: "create", how: "with sustained strength" },
  0: { name: "Earth", act: "receives", op: "store", how: "by yielding and supporting" },
  1: { name: "Thunder", act: "arouses", op: "trigger", how: "with a sudden start" },
  2: { name: "Water", act: "flows through", op: "route", how: "through danger, without losing itself" },
  4: { name: "Mountain", act: "holds still", op: "filter", how: "by stopping at the right place" },
  6: { name: "Wind", act: "penetrates", op: "propagate", how: "gently and steadily" },
  5: { name: "Fire", act: "illuminates", op: "render", how: "by clinging to what it lights" },
  3: { name: "Lake", act: "opens to", op: "exchange", how: "by joy and exchange" },
};
export const LINE_MODES = {
  1: { mode: "foundation", does: "investigates, lays the ground before acting" },
  2: { mode: "natural", does: "acts from innate talent when called out" },
  3: { mode: "trial and error", does: "tries, breaks, and learns by bumping into things" },
  4: { mode: "network", does: "acts through its connections, shares outward" },
  5: { mode: "projection", does: "offers a practical, general solution others project onto" },
  6: { mode: "role model", does: "oversees from above, then lives the example" },
};

let V = null, R = null;
/** load the gate words (vocabulary.json) and the rule book (colours, tones, dimensions) */
export async function loadGateEngine(base = "./") {
  const get = async f => { try { return await (await fetch(new URL(f, new URL(base, location.href)))).json(); } catch { const fs = await import("fs"); return JSON.parse(fs.readFileSync(new URL(f, import.meta.url))); } };
  [V, R] = await Promise.all([get("vocabulary.json"), get("bhantugh_rules.json")]);
}
export function setGateEngineData(vocab, rules) { V = vocab; R = rules; }

/** 1. the gate's fixed function */
export function gateFunction(gate) {
  const mask = KW_MASK[gate - 1], inner = TRIGRAMS[mask & 7], outer = TRIGRAMS[(mask >> 3) & 7], g = V?.gates?.[gate] ?? {};
  return { gate, mask, inner: inner.name, outer: outer.name,
    does: `${inner.act} ${outer.name.toLowerCase()} — ${inner.how}`,          // structure: inner action into the outer field
    op: inner.op, field: outer.op,                                             // swarm operation (proposal) and what it acts on
    keynote: g.keynote ?? null, archetype: g.archetype ?? null, circuit: g.circuit ?? null, center: g.center ?? null,
    name: g.name ?? null, house: g.house ?? null };
}

/** 2. how the line expresses that doing — fixed, then swayed by colour, tone, base */
export function lineExpression({ gate, line, color, tone, base }) {
  const fixed = LINE_MODES[line] ?? null, g = V?.gates?.[gate];
  const col = R?.colors?.[color], ton = R?.tones?.[tone];
  const dim = R?.dimensions ? Object.entries(R.dimensions).find(([k, d]) => d?.base === base) : null;
  return { line, mode: fixed?.mode, does: fixed?.does, lineName: g?.lines?.[line]?.name ?? null,
    sway: {
      motivation: col ? { response: col.response, poles: col.mode } : null,                 // colour: why it moves
      sense: ton ? { theme: ton.theme, sense: ton.sense, side: tone <= 3 ? "left" : "right" } : null,   // tone: how it senses (1-3 left, 4-6 right)
      ground: dim ? { dimension: dim[0], question: dim[1].question, mode: dim[1].mode } : null,          // base: which question it stands in
    } };
}

/** the whole reading for one unit's address: what it does, how it does it */
export function readUnit(a) {
  const f = gateFunction(a.gate), e = lineExpression(a), s = e.sway;
  const sentence = `Gate ${a.gate}${f.name ? " (" + f.name + ")" : ""} ${f.does}; line ${a.line} (${e.lineName ?? e.mode}) ${e.does}`
    + (s.motivation ? `, moved by ${s.motivation.response.toLowerCase()}` : "") + (s.sense ? `, sensing through ${s.sense.sense.toLowerCase()}` : "")
    + (s.ground ? `, standing in ${s.ground.dimension} (${s.ground.question})` : "") + ".";
  return { function: f, expression: e, sentence };
}
