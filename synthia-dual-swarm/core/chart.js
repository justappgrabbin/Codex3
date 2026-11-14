// Real birth chart -> 26 activations (13 bodies x Personality/Design).
// Ephemeris: astronomy-engine 2.1.19 (MIT, vendored). Wheel: gate 41 starts at
// 302 deg tropical (2 deg Aquarius; checked against published gate-degree tables).
// Design moment: the Sun 88 deg of solar arc before birth.
import * as A from '../vendor/astronomy-engine/astronomy.js';

export const WHEEL_START = 302;
export const GATE_WHEEL = Object.freeze([
  41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,
  27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,
  31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,
  28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60]);

// 36 channels and 9 centers. Copied from Generative-address-system
// merged/centers-channels.js with one correction: Solar Plexus is
// 6,22,30,36,37,49,55 (the source had 29 in place of 49; 29 is Sacral).
export const CHANNELS = Object.freeze([
  [1,8],[2,14],[3,60],[4,63],[5,15],[6,59],[7,31],[9,52],[10,20],[10,34],[10,57],[11,56],
  [12,22],[13,33],[16,48],[17,62],[18,58],[19,49],[20,34],[20,57],[21,45],[23,43],[24,61],[25,51],
  [26,44],[27,50],[28,38],[29,46],[30,41],[32,54],[34,57],[35,36],[37,40],[39,55],[42,53],[47,64]]);
export const CENTERS = Object.freeze({
  Head:[64,61,63], Ajna:[47,24,4,17,43,11], Throat:[62,23,56,35,12,45,33,8,31,20,16],
  G:[1,13,25,46,2,15,10,7], Heart:[40,26,51,21], Solar:[6,22,30,36,37,49,55],
  Spleen:[48,57,44,50,32,28,18], Sacral:[5,14,29,59,9,3,42,27,34], Root:[53,60,52,19,39,41,58,38,54]});
// The source table was incomplete (Ajna missing 17,43; Throat missing 8,31,16;
// G missing 7; 16 listed under Spleen; Sacral/Root short). Completed here to
// the standard bodygraph; every gate 1..64 belongs to exactly one center (tested).

export const BODIES = Object.freeze(['Sun','Earth','Moon','NorthNode','SouthNode','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']);

const norm = x => ((x % 360) + 360) % 360;

/** Ecliptic longitude -> gate/line/color/tone/base. */
export function fromLongitude(lon) {
  let p = norm(lon - WHEEL_START);
  const gi = Math.floor(p / 5.625); p -= gi * 5.625;
  const line = Math.floor(p / 0.9375) + 1; p -= (line - 1) * 0.9375;
  const color = Math.floor(p / 0.15625) + 1; p -= (color - 1) * 0.15625;
  const tone = Math.floor(p / (0.15625 / 6)) + 1; p -= (tone - 1) * (0.15625 / 6);
  const base = Math.min(5, Math.floor(p / (0.15625 / 30)) + 1);
  return { gate: GATE_WHEEL[gi], line, color, tone, base, longitude: norm(lon) };
}

// Mean lunar node (Meeus, Astronomical Algorithms ch.47). Some HD software
// uses the true node instead; the two differ by up to ~1.7 deg.
function meanNode(time) {
  const T = time.tt / 36525;
  return norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000);
}

export function longitudes(date) {
  const t = A.MakeTime(date);
  const sun = A.SunPosition(t).elon;
  const geo = b => A.Ecliptic(A.GeoVector(b, t, true)).elon;
  const nn = meanNode(t);
  return {
    Sun: sun, Earth: norm(sun + 180), Moon: A.EclipticGeoMoon(t).lon,
    NorthNode: nn, SouthNode: norm(nn + 180),
    Mercury: geo(A.Body.Mercury), Venus: geo(A.Body.Venus), Mars: geo(A.Body.Mars),
    Jupiter: geo(A.Body.Jupiter), Saturn: geo(A.Body.Saturn), Uranus: geo(A.Body.Uranus),
    Neptune: geo(A.Body.Neptune), Pluto: geo(A.Body.Pluto),
  };
}

/** The moment the Sun stood 88 deg behind its birth position. */
export function designDate(birth) {
  const target = norm(A.SunPosition(A.MakeTime(birth)).elon - 88);
  const start = new Date(birth.getTime() - 100 * 864e5);
  const hit = A.SearchSunLongitude(target, start, 20);
  if (!hit) throw Error('design moment not found');
  return hit.date;
}

/** birth: a Date in UTC. Returns {birth, design, activations[26], channels, centers}. */
export function calculateChart(birth) {
  const design = designDate(birth);
  const activations = [];
  for (const [side, when] of [['Personality', birth], ['Design', design]]) {
    const lons = longitudes(when);
    for (const body of BODIES) activations.push({ side, body, ...fromLongitude(lons[body]) });
  }
  return { birth, design, activations, ...definition(activations) };
}

export function centerOf(gate) {
  for (const [c, gs] of Object.entries(CENTERS)) if (gs.includes(gate)) return c;
  return null;
}

export function definition(activations) {
  const gates = new Set(activations.map(a => a.gate));
  const channels = CHANNELS.filter(([a, b]) => gates.has(a) && gates.has(b));
  const centers = new Set(channels.flatMap(([a, b]) => [centerOf(a), centerOf(b)]));
  return { channels, definedCenters: [...centers] };
}
