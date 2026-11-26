// hexagram.js — six-bit extraction, trigrams, changing lines.
import { kingWenFromMask, hexagramGlyph, hexagramCodePoint } from "./kingwen.js";

export const TRIGRAMS = ["Kun ☷", "Zhen ☳", "Kan ☵", "Dui ☱", "Gen ☶", "Li ☲", "Xun ☴", "Qian ☰"];
// index = 3-bit value, bottom line = bit 0 (☷=000 Earth, ☳=001 Thunder bottom-yang, ... ☰=111 Heaven)
// check: Zhen (thunder) = yang bottom only = 001; Gen (mountain) = yang top only = 100; Kan (water) = middle = 010

/** Split an 8-bit byte into its six-line mask and two-bit register. */
export function fromByte(byte) {
  const mask = byte & 0x3f, register = (byte >>> 6) & 0x03;
  return { byte, mask, register, ...describe(mask) };
}

/** Everything the six lines say about themselves. */
export function describe(mask) {
  mask &= 0x3f;
  const lowerTrigram = mask & 0x07, upperTrigram = (mask >>> 3) & 0x07, kingWen = kingWenFromMask(mask);
  const lines = [0, 1, 2, 3, 4, 5].map(i => (mask >>> i) & 1);          // bottom -> top
  return { mask, lines, lowerTrigram, upperTrigram, lowerName: TRIGRAMS[lowerTrigram], upperName: TRIGRAMS[upperTrigram],
           kingWen, glyph: hexagramGlyph(kingWen), codePoint: hexagramCodePoint(kingWen) };
}

/** Lines that change between two states (bit i set = line i+1 changes). */
export function changingLines(previousMask, nextMask) {
  const changed = (previousMask ^ nextMask) & 0x3f;
  return { changed, lines: [0, 1, 2, 3, 4, 5].filter(i => (changed >>> i) & 1).map(i => i + 1) };
}

/** Flip exactly one line (1..6). */
export function changeLine(mask, line) { return (mask ^ (1 << (line - 1))) & 0x3f; }

/**
 * Project a code point wider than one byte into six bits WITHOUT discarding it:
 * returns the original code point and UTF-8 bytes plus the projection record.
 */
export function projectCodePoint(cp) {
  const utf8 = [...new TextEncoder().encode(String.fromCodePoint(cp))];
  const last = utf8[utf8.length - 1];
  return { codePoint: cp, utf8, projection: { rule: "last UTF-8 byte & 0x3F", fromByte: last, ...fromByte(last) } };
}
