// expression.js — sound -> color -> geometry, all from ONE state, sound first.
// (User's order: sound comes first and determines color and shape.)
// Lines 1-3 (lower trigram) face inward, 4-6 (upper trigram) face outward.
// Register 0..3 = the four fields, each with its own range/scale (configurable).

export const CONFIG = {
  ratios: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2],                       // six harmonic voices, line 1..6
  fields: [                                                          // register -> field
    { name: "Evolution (sidereal)", baseHz: 110, scale: 0.85 },
    { name: "Movement (mean draconic)", baseHz: 165, scale: 0.95 },
    { name: "Design (true draconic)", baseHz: 220, scale: 1.05 },
    { name: "Being (tropical)", baseHz: 330, scale: 1.15 },
  ],
};

/** Sound: six voices; amplitude = smoothed line weight (no chord restart on change). */
export function sound(smoothedLines, register, cfg = CONFIG) {
  const f0 = cfg.fields[register].baseHz;
  const voices = smoothedLines.map((w, i) => ({ line: i + 1, freq: f0 * cfg.ratios[i], amp: w / 6 }));
  const energy = voices.reduce((s, v) => s + v.amp, 0);
  const centroid = energy > 0 ? voices.reduce((s, v) => s + v.freq * v.amp, 0) / energy : f0;
  return { field: cfg.fields[register].name, f0, voices, energy, centroid };
}

/** Color, derived from the sound: outward voices (4-6) set hue, inward voices (1-3) set depth. */
export function colorFromSound(snd) {
  const out = snd.voices.slice(3), inn = snd.voices.slice(0, 3);
  const outW = out.map(v => v.amp * 6), inW = inn.map(v => v.amp * 6);
  const upper = outW[0] + 2 * outW[1] + 4 * outW[2];                 // continuous 0..7 (outward trigram)
  const lower = inW[0] + 2 * inW[1] + 4 * inW[2];                    // continuous 0..7 (inward trigram)
  const hue = (upper / 8) * 360 + (Math.log2(snd.f0 / 110) * 30);    // register shifts hue band
  return { h: ((hue % 360) + 360) % 360, s: 35 + (lower / 7) * 55, l: 30 + snd.energy * 40 };
}

/** Shortest-path hue interpolation (wraps at 360, never sweeps the long way round). */
export function lerpColor(a, b, t) {
  let dh = ((b.h - a.h + 540) % 360) - 180;
  return { h: (a.h + dh * t + 360) % 360, s: a.s + (b.s - a.s) * t, l: a.l + (b.l - a.l) * t };
}

export function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map(x => Math.round(x * 255));
}

/** Geometry: radial shape, one spoke per line; weight 0..1 pushes its vertex out (morphs, never jumps). */
export function radialGeometry(lineWeights, scale = 1, curvature = 0) {
  return lineWeights.map((w, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 6, r = scale * (0.35 + 0.65 * w);
    return { line: i + 1, x: r * Math.cos(a), y: r * Math.sin(a), r, curvature };
  });
}

/** All three from one state-transition event, in the order sound -> color -> geometry. */
export function express(smoothedLines, register, cfg = CONFIG) {
  const snd = sound(smoothedLines, register, cfg);
  const col = colorFromSound(snd);
  const geo = radialGeometry(smoothedLines, cfg.fields[register].scale, snd.energy);
  return { sound: snd, color: { ...col, rgb: hslToRgb(col) }, geometry: geo };
}
