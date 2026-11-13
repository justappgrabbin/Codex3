// Semantic address codec — derived by rule, no gate lookup table.
//
// Added alongside exampleAddress() in ontology.js (nothing removed).
// Decisions recorded in "Synthia Canonical Source of Truth", 2026-11-13:
//   * Each gate covers 5.625 degrees (360 / 64); line, color, tone and base
//     are successive subdivisions of that local frame (6, 6, 6, 5).
//   * Color, tone and base are fixed subdivisions; degree/minute/second are
//     the zodiacal measure of the same longitude.
//   * Default frame order M-E-B-D-S; Being-led frame B-M-S-D-E. The canonical
//     address is stored once; a frame is a view of it.
//
// Wheel derivation: the Fu Xi complement rule already present in the owner's
// Generative-address-system (MandalaGeometry port): eight upper trigrams over
// the first four lower trigrams in Heaven, Lake, Fire, Thunder, Wind, Water,
// Mountain, Earth order give 32 figures; their bitwise complements give the
// other 32. Placed FORWARD around the wheel, 5.625 degrees apart, anchored so
// gate 41 begins at 302 degrees (2 Aquarius), the rule reproduces all 64 gate
// start positions in the owner's canonical interval table (verified in
// tests/semantic-address.test.mjs). The donor placed the sequence backward
// from 46.75 degrees, which reproduced 2 of 64; that file is left unchanged.

const ARCSEC_CIRCLE = 360 * 3600;            // 1,296,000
const ARCSEC_GATE = ARCSEC_CIRCLE / 64;      // 20,250  (5 deg 37' 30")
const ARCSEC_LINE = ARCSEC_GATE / 6;         // 3,375
const ARCSEC_COLOR = ARCSEC_LINE / 6;        // 562.5
const ARCSEC_TONE = ARCSEC_COLOR / 6;        // 93.75
const ARCSEC_BASE = ARCSEC_TONE / 5;         // 18.75
const ARCSEC_SIGN = 30 * 3600;               // 108,000
const ANCHOR_GATE = 41;
const ANCHOR_ARCSEC = 302 * 3600;            // 2 deg Aquarius

// Trigram bits, top line first (source: MandalaGeometry.cs via the owner's port).
const TRIGRAMS = [['Heaven', '111'], ['Lake', '011'], ['Fire', '101'], ['Thunder', '001'],
  ['Wind', '110'], ['Water', '010'], ['Mountain', '100'], ['Earth', '000']].map(([, b]) => parseInt(b, 2));

// King Wen gate number from its six-bit figure (upper trigram << 3 | lower trigram,
// each trigram top line first). Derived from the King Wen pairing of trigrams.
export const KING_WEN_BY_TRIGRAMS = (() => {
  // Rows: upper trigram; columns: lower trigram; order Heaven, Lake, Fire, Thunder,
  // Wind, Water, Mountain, Earth (the standard King Wen key table).
  const order = ['Heaven', 'Lake', 'Fire', 'Thunder', 'Wind', 'Water', 'Mountain', 'Earth'];
  const key = [
    [1, 43, 14, 34, 9, 5, 26, 11],
    [10, 58, 38, 54, 61, 60, 41, 19],
    [13, 49, 30, 55, 37, 63, 22, 36],
    [25, 17, 21, 51, 42, 3, 27, 24],
    [44, 28, 50, 32, 57, 48, 18, 46],
    [6, 47, 64, 40, 59, 29, 4, 7],
    [33, 31, 56, 62, 53, 39, 52, 15],
    [12, 45, 35, 16, 20, 8, 23, 2],
  ];
  const bits = Object.fromEntries(order.map((name, i) => [name, TRIGRAMS[i]]));
  const table = new Map();
  order.forEach((lower, r) => order.forEach((upper, c) => table.set((bits[upper] << 3) | bits[lower], key[r][c])));
  return table;
})();

const mod = (n, m) => ((n % m) + m) % m;

/** Gate start positions (arc-seconds), computed by rule. Returns Map gate -> startArcsec. */
export function deriveWheel() {
  const half = [];
  for (const lower of TRIGRAMS.slice(0, 4)) for (const upper of TRIGRAMS) half.push((upper << 3) | lower);
  const sequence = [...half, ...half.map(v => (~v) & 63)].map(v => KING_WEN_BY_TRIGRAMS.get(v));
  const anchorIndex = sequence.indexOf(ANCHOR_GATE);
  const wheel = new Map();
  sequence.forEach((gate, n) => wheel.set(gate, mod(ANCHOR_ARCSEC + (n - anchorIndex) * ARCSEC_GATE, ARCSEC_CIRCLE)));
  return wheel;
}

const WHEEL = deriveWheel();
const BY_START = [...WHEEL.entries()].sort((a, b) => a[1] - b[1]);

/**
 * Canonical address from an ecliptic longitude in degrees (0-360).
 * `house` is passed through: it depends on birth time and place (ascendant),
 * which a longitude alone does not determine.
 */
export function addressFromLongitude(longitude, { house = null, frame = 'local', provenance = 'computed from longitude' } = {}) {
  if (!Number.isFinite(longitude)) throw new TypeError('longitude must be a finite number of degrees');
  const a = mod(Math.round(longitude * 3600 * 100) / 100, ARCSEC_CIRCLE);
  let gate = BY_START[BY_START.length - 1][0];
  for (const [g, start] of BY_START) if (a >= start) gate = g;
  const within = mod(a - WHEEL.get(gate), ARCSEC_CIRCLE);
  const line = Math.floor(within / ARCSEC_LINE) + 1;
  const afterLine = within - (line - 1) * ARCSEC_LINE;
  const color = Math.floor(afterLine / ARCSEC_COLOR) + 1;
  const afterColor = afterLine - (color - 1) * ARCSEC_COLOR;
  const tone = Math.floor(afterColor / ARCSEC_TONE) + 1;
  const afterTone = afterColor - (tone - 1) * ARCSEC_TONE;
  const base = Math.min(5, Math.floor(afterTone / ARCSEC_BASE) + 1);
  const inSign = a % ARCSEC_SIGN;
  const totalHundredths = Math.round(inSign * 100);
  return {
    filter: frame,
    gate, line, color, tone, base,
    degree: Math.floor(totalHundredths / 360000),
    minute: Math.floor(totalHundredths / 6000) % 60,
    second: Math.floor(totalHundredths / 100) % 60,
    arc: totalHundredths % 100,               // hundredths of an arc-second
    zodiac: Math.floor(a / ARCSEC_SIGN) + 1,  // 1 = Aries
    house: house ?? 1,
    houseKnown: house != null,
    provenance,
  };
}

/** Inverse: the longitude (degrees) at the start of a gate.line.color.tone.base cell. */
export function longitudeFromAddress({ gate, line = 1, color = 1, tone = 1, base = 1 }) {
  if (!WHEEL.has(gate)) throw new RangeError('gate must be 1-64');
  const a = WHEEL.get(gate) + (line - 1) * ARCSEC_LINE + (color - 1) * ARCSEC_COLOR + (tone - 1) * ARCSEC_TONE + (base - 1) * ARCSEC_BASE;
  return mod(a, ARCSEC_CIRCLE) / 3600;
}

export const FRAMES = Object.freeze({
  default: Object.freeze(['Movement', 'Evolution', 'Being', 'Design', 'Space']),
  Being: Object.freeze(['Being', 'Movement', 'Space', 'Design', 'Evolution']),
});

/** A frame view: the same stored values, read in the frame's dimension order. Round-trips. */
export function frameView(values, frame = 'default') {
  const order = FRAMES[frame];
  if (!order) throw new RangeError(`frame "${frame}" has no recorded order yet`);
  return order.map(dimension => [dimension, values[dimension]]);
}

export function fromFrameView(view) {
  return Object.fromEntries(view);
}
