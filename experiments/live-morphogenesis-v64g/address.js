// address.js — the exact thirteen-field address and the Human Design connection laws,
// ported 1:1 from hd_swarm.py so the JS swarm is the same organism as the trained one.
// planetary.dimension.gate.line.color.tone.base.degree.minute.second.arc.zodiac.house
export const ADDRESS_FIELDS = ["planetary", "dimension", "gate", "line", "color", "tone", "base",
  "degree", "minute", "second", "arc", "zodiac", "house"];

// Five contextual dimensions; Base 1..5 -> dimension and wh-question (Ra, Colors book p.40)
export const DIMENSIONS = [
  { name: "Movement", base: 1, wh: "Where" }, { name: "Evolution", base: 2, wh: "What" },
  { name: "Being", base: 3, wh: "When" }, { name: "Design", base: 4, wh: "Why" }, { name: "Space", base: 5, wh: "Who" }];
export const BODIES = ["Sun", "Earth", "Moon", "NorthNode", "SouthNode", "Mercury", "Venus", "Mars", "Jupiter",
  "Saturn", "Uranus", "Neptune", "Pluto"];
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius",
  "Capricorn", "Aquarius", "Pisces"];

const TABLE = "1 G 8|2 G 14|3 Sacral 60|4 Ajna 63|5 Sacral 15|6 SolarPlexus 59|7 G 31|8 Throat 1|9 Sacral 52|10 G 20,34,57|11 Ajna 56|12 Throat 22|13 G 33|14 Sacral 2|15 G 5|16 Throat 48|17 Ajna 62|18 Spleen 58|19 Root 49|20 Throat 10,34,57|21 Heart 45|22 SolarPlexus 12|23 Throat 43|24 Ajna 61|25 G 51|26 Heart 44|27 Sacral 50|28 Spleen 38|29 Sacral 46|30 SolarPlexus 41|31 Throat 7|32 Spleen 54|33 Throat 13|34 Sacral 10,20,57|35 Throat 36|36 SolarPlexus 35|37 SolarPlexus 40|38 Root 28|39 Root 55|40 Heart 37|41 Root 30|42 Sacral 53|43 Ajna 23|44 Spleen 26|45 Throat 21|46 G 29|47 Ajna 64|48 Spleen 16|49 SolarPlexus 19|50 Spleen 27|51 Heart 25|52 Root 9|53 Root 42|54 Root 32|55 SolarPlexus 39|56 Throat 11|57 Spleen 10,20,34|58 Root 18|59 Sacral 6|60 Root 3|61 Head 24|62 Throat 17|63 Head 4|64 Head 47";
export const CENTER = {}, PARTNERS = {};
for (const it of TABLE.split("|")) { const [g, c, p] = it.split(" "); CENTER[+g] = c; PARTNERS[+g] = new Set(p.split(",").map(Number)); }
export const WHEEL = [41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15,
  52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10,
  58, 38, 54, 61, 60];
export const WHEEL_START = 302.0;
export const CENTERS = ["Head", "Ajna", "Throat", "G", "Heart", "Sacral", "Spleen", "SolarPlexus", "Root"];

/** Full 13-field address of a body at a longitude. Ascendant (optional) gives equal houses. */
export function addressOf(bodyIndex, lon, ascendant = null) {
  const off = (((lon - WHEEL_START) % 360) + 360) % 360, k = Math.floor(off / 5.625), f = (off - k * 5.625) / 5.625;
  const gate = WHEEL[k], line = Math.floor(f * 6) + 1, color = Math.floor(f * 36) % 6 + 1,
    tone = Math.floor(f * 216) % 6 + 1, base = Math.floor(f * 1080) % 5 + 1;
  const L = ((lon % 360) + 360) % 360, inSign = L % 30, degree = Math.floor(inSign);
  const minute = Math.floor((inSign - degree) * 60), secF = ((inSign - degree) * 60 - minute) * 60, second = Math.floor(secF);
  const house = ascendant === null ? null : Math.floor((((L - ascendant) % 360) + 360) % 360 / 30) + 1;
  return { planetary: BODIES[bodyIndex % 13], dimension: DIMENSIONS[base - 1].name, gate, line, color, tone, base,
           degree, minute, second, arc: Math.floor((secF - second) * 100), zodiac: SIGNS[Math.floor(L / 30)], house,
           side: bodyIndex < 13 ? "Personality" : "Design", longitude: L };
}
export function formatAddress(a) { return ADDRESS_FIELDS.map(k => a[k] ?? "").join("."); }
export function parseAddress(s) {
  const p = s.split("."); if (p.length !== 13) throw new Error("address must have 13 fields");
  const o = {}; ADDRESS_FIELDS.forEach((k, i) => { o[k] = /^\d+$/.test(p[i]) ? +p[i] : p[i]; }); return o;
}

/** No-skip match law: gate lines up (same/harmonic), then line->color->tone->base consecutively, +-1 level shift. */
export function matchDepth(a, b) {
  if (!(a.gate === b.gate || PARTNERS[a.gate].has(b.gate))) return 0;
  const A = [a.gate, a.line, a.color, a.tone, a.base], B = [b.gate, b.line, b.color, b.tone, b.base]; let best = 0;
  for (const s of [0, 1, -1]) { let run = 0;
    for (let k = 1; k <= 4; k++) { const j = k + s; if (j >= 1 && j <= 4 && A[k] === B[j]) run++; else break; }
    best = Math.max(best, run); }
  return 1 + best;
}
export function arc(a, b) { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d) / 5.625; }

/** Type by rule from defined channels. */
export const TYPES = ["Reflector", "Projector", "Manifestor", "Generator", "Manifesting Generator"];
export function hdType(gates) {
  const gs = new Set(gates), adj = {};
  for (const a of gs) for (const b of PARTNERS[a]) if (gs.has(b) && a < b) {
    (adj[CENTER[a]] ??= new Set()).add(CENTER[b]); (adj[CENTER[b]] ??= new Set()).add(CENTER[a]); }
  if (!Object.keys(adj).length) return 0;
  const seen = new Set(["Throat"]), st = ["Throat"];
  while (st.length) for (const c of adj[st.pop()] ?? []) if (!seen.has(c)) { seen.add(c); st.push(c); }
  const mt = "Throat" in adj && ["Sacral", "Heart", "SolarPlexus", "Root"].some(m => seen.has(m));
  return "Sacral" in adj ? (mt ? 4 : 3) : (mt ? 2 : 1);
}
