// lexicon.js — the words, and the sentence engine from the user's
// Consciousness Causal Graph Construction Specification, section 6 (Execution Engine & Rule O):
//   INPUT (gate, line, color, tone, base, axis, zodiac, house)
//   -> RULE O (base x tone exists; tone x color compatible) -> SELECT BASE CHAIN -> APPLY GATE ANCHOR
//   -> APPLY LINE TRAJECTORY -> APPLY TONE & COLOR LENS -> RESONANCE CHECK (base.sense == tone.sense: 2x)
//   -> ASSEMBLE. "Every output sentence must be rendered solely by following valid edges across the
//   chain network; no token probabilities or arbitrary word insertions."
// Data: lexicon.json, extracted by script from the user's three Drive docs (nothing typed by hand).
// Chains: the Black Book nature + human chains (same words as genesis.js / dimensional-frames.js).
import LEX from "./lexicon.json" with { type: "json" };
export { LEX };

export const BASE_DIM = ["Movement", "Evolution", "Being", "Design", "Space"];
export const CHAINS = {
  Movement: { nature: ["Energy", "Creation", "Seeing", "Landscape", "Environment"],
              human: ["Individuality", "Activity", "Reaction", "Limitation", "Perspective", "Relation", "Uniqueness"] },
  Evolution: { nature: ["Gravity", "Memory", "Taste", "Love", "Light"],
               human: ["Mind", "Character", "Separation", "Nature", "Integration", "Spirit", "Role"] },
  Being: { nature: ["Matter", "Is", "Touch", "Sex", "Survival"],
           human: ["Body", "Biology", "Chemistry", "Objectivity", "Geometry", "Trajectory", "Genetics"] },
  Design: { nature: ["Structure", "Progress", "Smell", "Life", "Art"],
            human: ["Ego", "Homo Sapiens", "Growth", "Decay", "Continuity", "Manifestation", "Self"] },
  Space: { nature: ["Form", "Illusion", "Hearing", "Music", "Freedom"],
           human: ["Personality", "Type", "Fantasy", "Subjectivity", "Rhythm", "Timing", "Presence"] },
};

const colorNum = s => [...String(s).matchAll(/Color (\d)/g)].map(m => +m[1]);
const colorName = {}; for (const r of LEX.toneColor) for (const m of String(r["Compatible Colors"] + " " + r["Incompatible Combinations"]).matchAll(/Color (\d) \(([^)-]+)/g)) colorName[+m[1]] = m[2].trim();
const cell = (base, tone) => { const row = LEX.baseTone[base - 1]; return row[Object.keys(row)[tone]]; };
const senseOf = c => (String(c).match(/\(([^)]+)\)/) || [, ""])[1];

/** Rule O. Returns { ok, reason }. */
export function ruleO(base, tone, color) {
  if (!(base >= 1 && base <= 5 && tone >= 1 && tone <= 6)) return { ok: false, reason: "base/tone out of range" };
  if (!cell(base, tone)) return { ok: false, reason: `Base ${base} x Tone ${tone} not in Section I` };
  const r = LEX.toneColor[tone - 1];
  if (colorNum(r["Incompatible Combinations"]).includes(color)) return { ok: false, reason: `Tone ${tone} x Color ${color}: ${r["Incompatible Combinations"]}` };
  if (!colorNum(r["Compatible Colors"]).includes(color)) return { ok: false, reason: `Color ${color} not compatible with Tone ${tone} (Section J)` };
  return { ok: true };
}

/** The chain the base selects, and where the gate's anchor enters it. */
export function anchorIn(gate, base) {
  const dim = BASE_DIM[base - 1], chain = [...CHAINS[dim].nature, ...CHAINS[dim].human];
  const parts = String(LEX.gates[gate].anchor).split("/").map(s => s.trim().toLowerCase());
  let at = chain.findIndex(w => parts.includes(w.toLowerCase()));
  let home = dim;
  if (at < 0) for (const d of BASE_DIM) {                  // anchor word lives in another dimension's chain
    const c = [...CHAINS[d].nature, ...CHAINS[d].human], k = c.findIndex(w => parts.includes(w.toLowerCase()));
    if (k >= 0) { home = d; at = k; break; } }
  return { dim, chain, at, anchorHome: home, anchorWord: LEX.gates[gate].anchor, unplaced: at < 0 };
}

/** Section 5 line trajectories, as index paths through the chain. */
export function trajectory(line, chain, at, gate) {
  const a = Math.max(0, at), n = chain.length, end = n - 1;
  switch (line) {
    case 1: return chain.slice(a);                                         // forward from anchor
    case 2: return chain.slice();                                          // whole chain, unbroken
    case 3: { const c = Math.min(a + 2, end), b = Math.min(a + 1, end);     // A -> C -> B -> C
              return [chain[a], chain[c], chain[b], chain[c]]; }
    case 4: return [chain[a], ...CHAINS[BASE_DIM.find(d => CHAINS[d].nature.includes(chain[0])) ?? "Movement"].nature.slice(3)]; // external nodes (nature tail)
    case 5: { const z = LEX.zodiac.find(r => r["Zodiac Sign"] === LEX.gates[gate].zodiac);    // universalize via sign keywords
              return [chain[a], ...(z ? z["Core Archetypal Keywords"].split(",").map(s => s.trim()) : [])]; }
    case 6: return [chain[a], chain[end]];                                 // direct terminal leap
    default: return [];
  }
}

/** The whole Section 6 pipeline for one activation. Deterministic; words only from the tables. */
export function sentence({ gate, line, color, tone, base }) {
  const check = ruleO(base, tone, color);
  if (!check.ok) return { halted: true, reason: check.reason };
  const g = LEX.gates[gate], A = anchorIn(gate, base), path = trajectory(line, A.chain, A.at, gate);
  const c = cell(base, tone), resonant = /Resonant Anchor/.test(c);
  const tokens = path.map((w, i) => ({ word: w, weight: i === 0 && resonant ? 2 : 1 }));   // Resonance Law: 2x
  return {
    halted: false, gate, line, color, tone, base, dimension: A.dim, anchor: A.anchorWord, anchorHome: A.anchorHome,
    hexagram: g.name, archetype: g.archetype, expression: g.lines?.[line] ?? null, keynote: g.keynotes?.[line] ?? null,
    lens: { sense: senseOf(c), color: colorName[color] ?? null, binary: LEX.toneColor[tone - 1]["Binary Operational Framing"] },
    resonant, tokens, environment: { zodiac: g.zodiac, house: g.house, meanings: g.meanings, center: g.center, biology: g.biology },
    text: tokens.map(t => t.weight > 1 ? t.word.toUpperCase() : t.word).join(" → "),
  };
}

/** Every valid sentence one hexagram can make (all lines x valid color/tone/base). */
export function sentencesFor(gate) {
  const out = [];
  for (let line = 1; line <= 6; line++) for (let base = 1; base <= 5; base++) for (let tone = 1; tone <= 6; tone++)
    for (let color = 1; color <= 6; color++) { const s = sentence({ gate, line, color, tone, base }); if (!s.halted) out.push(s); }
  return out;
}

/** Wheel position of any gate line, derived by rule from the wheel (gate = 5.625°, line = 0.9375°). */
import { WHEEL, WHEEL_START } from "./address.js";
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const dms = L => { L = ((L % 360) + 360) % 360; const s = Math.round((L % 30) * 3600), d = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return { sign: SIGNS[Math.floor((L + 1e-9) / 30) % 12], text: `${String(d).padStart(2, "0")}°${String(m).padStart(2, "0")}'${String(x).padStart(2, "0")}"` }; };
export function linePosition(gate, line) {
  const k = WHEEL.indexOf(gate), a = WHEEL_START + k * 5.625 + (line - 1) * 0.9375, A = dms(a), B = dms(a + 0.9375);
  return { start: (a % 360 + 360) % 360, end: ((a + 0.9375) % 360 + 360) % 360, text: A.sign === B.sign ? `${A.text} – ${B.text} ${A.sign}` : `${A.text} ${A.sign} – ${B.text} ${B.sign}` };
}
