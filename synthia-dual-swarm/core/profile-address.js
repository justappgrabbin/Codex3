// Profile -> semantic address, for things that have no birth moment.
//
// A thing's origin is its design profile (owner, 2026-11-13): what it contains,
// what it depends on, what it is named / expresses, and what it resembles.
// These are Burgess's four irreducible associations (Spacetimes with Semantics
// III, sec. 5.4.9), read against the owner's one-substrate architecture:
//   Movement  <- expression    (naming, labels, what it represents)
//   Evolution <- similarity    (what it is near / correlated with)
//   Being     <- containment   (what it holds; part-of)
//   Design    <- causation     (what it depends on / must precede it)
//   Space     <- not measured; it is the rendered relation of the four.
// The Burgess/dimension correspondence is a PROPOSED reading, not a source
// statement. Everything below is computed; there is no gate table.
//
// Address rule (Proportion of Perspective, recursive):
//   gate  = hexagram formed by the rank order of the four dimensions:
//           first, second and third ranked dimensions are three 2-bit
//           (Klein four-group) values -> 6 bits (V4^3 = C2^6), dimension code =
//           position in the default frame order M,E,B,D (00,01,10,11).
//   line  = share of the leading dimension, in sixths
//   color = share of the second, in sixths      (fixed: what)
//   tone  = share of the third, in sixths       (fixed: why)
//   base  = share of the fourth, in fifths      (fixed: who)
//   degree/minute/second are then read off the wheel position of that cell,
//   so they follow from the leading dimension instead of being assigned.

import { KING_WEN_BY_TRIGRAMS, longitudeFromAddress, addressFromLongitude } from './semantic-address.js';

export const DIMENSIONS = Object.freeze(['Movement', 'Evolution', 'Being', 'Design']);

const words = text => (text.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || [])
  .flatMap(w => w.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_$]+/))
  .map(w => w.toLowerCase()).filter(w => w.length > 2);

/** Measure the four association counts of one JavaScript source text. */
export function measureSource(name, text) {
  const imports = (text.match(/^\s*import\s[^;]*?from\s+['"][^'"]+['"]/gm) || []).length
    + (text.match(/\brequire\(\s*['"][^'"]+['"]\s*\)/g) || []).length;
  const declarations = (text.match(/^\s*(export\s+)?(default\s+)?(async\s+)?(function\*?|class)\s+[A-Za-z_$]/gm) || []).length
    + (text.match(/^\s*(export\s+)?const\s+[A-Za-z_$][\w$]*\s*=/gm) || []).length;
  const exported = (text.match(/^\s*export\s/gm) || []).length;
  const commentLines = (text.match(/^\s*(\/\/|\*|\/\*)/gm) || []).length;
  return {
    name,
    vocabulary: new Set([...words(name), ...words(text)]),
    counts: {
      Movement: exported + commentLines + words(name).length, // expression: names it gives and carries
      Being: declarations,                                     // containment: what it holds
      Design: imports,                                         // causation: what it depends on
      Evolution: 0,                                            // similarity: filled against the corpus
    },
  };
}

const jaccard = (a, b) => {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
};

/** Similarity needs neighbours: sum of the k strongest vocabulary overlaps (0..k). */
export function addSimilarity(measured, k = 3) {
  for (const m of measured) {
    const top = measured.filter(o => o !== m).map(o => jaccard(m.vocabulary, o.vocabulary)).sort((x, y) => y - x).slice(0, k);
    m.counts.Evolution = top.reduce((s, v) => s + v, 0);
  }
  return measured;
}

/**
 * Proportion of Perspective: each count is read in proportion to the whole it
 * was measured in (the corpus), so the four dimensions share one scale.
 * Raw counts stay on the record; `profile` holds the proportional reading.
 */
export function proportionToCorpus(measured) {
  // Each value is read as the proportion of the corpus it stands at or above
  // (mid-rank percentile), so no dimension wins just by having a bigger unit.
  const n = measured.length;
  for (const m of measured) m.profile = {};
  for (const d of DIMENSIONS) {
    for (const m of measured) {
      const below = measured.filter(o => o.counts[d] < m.counts[d]).length;
      const equal = measured.filter(o => o.counts[d] === m.counts[d]).length;
      m.profile[d] = n > 1 ? (below + (equal - 1) / 2) / (n - 1) : 0.5;
    }
  }
  for (const m of measured) if (DIMENSIONS.every(d => m.profile[d] === 0)) DIMENSIONS.forEach(d => (m.profile[d] = 1e-9));
  return measured;
}

/** Profile (shares + rank) -> canonical address. Deterministic, no table. */
export function profileToAddress(counts) {
  const total = DIMENSIONS.reduce((s, d) => s + counts[d], 0);
  if (!total) throw new Error('empty profile: nothing measured');
  const shares = Object.fromEntries(DIMENSIONS.map(d => [d, counts[d] / total]));
  const rank = [...DIMENSIONS].sort((a, b) => shares[b] - shares[a] || DIMENSIONS.indexOf(a) - DIMENSIONS.indexOf(b));
  const code = d => DIMENSIONS.indexOf(d); // 2 bits
  const figure = (code(rank[0]) << 4) | (code(rank[1]) << 2) | code(rank[2]);
  const gate = KING_WEN_BY_TRIGRAMS.get(figure);
  const cut = (x, n) => Math.min(n, Math.floor(x * n) + 1);
  const cell = {
    gate,
    line: cut(shares[rank[0]], 6),
    color: cut(shares[rank[1]], 6),
    tone: cut(shares[rank[2]], 6),
    base: cut(shares[rank[3]], 5),
  };
  const address = addressFromLongitude(longitudeFromAddress(cell) + 1e-6, { provenance: 'computed from design profile (Burgess four associations)' });
  return { leading: rank[0], rank, shares, address };
}
