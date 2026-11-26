// kingwen.js — verified King Wen <-> 6-bit line mask lookup.
// Source: OEIS A102241, "hexagrams of the Yi Jing in King Wen order, top line = 2^5,
// bottom line = 2^0". Index i holds the mask of King Wen hexagram i+1.
// Bit 0 = bottom line, bit 5 = top line, 1 = solid/yang, 0 = broken/yin.
export const KW_MASK = [63, 0, 17, 34, 23, 58, 2, 16, 55, 59, 7, 56, 61, 47, 4, 8, 25, 38, 3, 48, 41, 37, 32, 1,
  57, 39, 33, 30, 18, 45, 28, 14, 60, 15, 40, 5, 53, 43, 20, 10, 35, 49, 31, 62, 24, 6, 26, 22, 29, 46, 9, 36, 52,
  11, 13, 44, 54, 27, 50, 19, 51, 12, 21, 42];

const MASK_TO_KW = new Array(64);
KW_MASK.forEach((m, i) => { MASK_TO_KW[m] = i + 1; });

/** King Wen number (1..64) for a bottom-to-top 6-bit mask. Binary index is NOT the King Wen number. */
export function kingWenFromMask(mask) { return MASK_TO_KW[mask & 0x3f]; }
/** 6-bit mask for a King Wen number (1..64). */
export function maskFromKingWen(kw) { return KW_MASK[kw - 1]; }
/** Unicode hexagram glyph: U+4DC0..U+4DFF in King Wen order. */
export function hexagramGlyph(kw) { return String.fromCodePoint(0x4dc0 + kw - 1); }
export function hexagramCodePoint(kw) { return "U+" + (0x4dc0 + kw - 1).toString(16).toUpperCase(); }
