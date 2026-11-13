import test from 'node:test';
import assert from 'node:assert/strict';
import { KING_WEN_BY_TRIGRAMS, deriveWheel, addressFromLongitude, longitudeFromAddress, frameView, fromFrameView } from '../core/semantic-address.js';
import { validateAddress } from '../core/ontology.js';

// Fixture: the owner's canonical gate intervals (start degrees), transcribed from
// "Pathways to Purpose - A Refined Resonance Network Program" (Drive). Used only to
// CHECK the rule-derived wheel; the runtime never reads this table.
const OWNER_STARTS = { 25: 358.25, 17: 3.875, 21: 9.5, 51: 15.125, 42: 20.75, 3: 26.375, 27: 32, 24: 37.625, 2: 43.25, 23: 48.875, 8: 54.5, 20: 60.125, 16: 65.75, 35: 71.375, 45: 77, 12: 82.625, 15: 88.25, 52: 93.875, 39: 99.5, 53: 105.125, 62: 110.75, 56: 116.375, 31: 122, 33: 127.625, 7: 133.25, 4: 138.875, 29: 144.5, 59: 150.125, 40: 155.75, 64: 161.375, 47: 167, 6: 172.625, 46: 178.25, 18: 183.875, 48: 189.5, 57: 195.125, 32: 200.75, 50: 206.375, 28: 212, 44: 217.625, 1: 223.25, 43: 228.875, 14: 234.5, 34: 240.125, 9: 245.75, 5: 251.375, 26: 257, 11: 262.625, 10: 268.25, 58: 273.875, 38: 279.5, 54: 285.125, 61: 290.75, 60: 296.375, 41: 302, 19: 307.625, 13: 313.25, 49: 318.875, 30: 324.5, 55: 330.125, 37: 335.75, 63: 341.375, 22: 347, 36: 352.625 };

// Fixture: King Wen gate -> Fu Xi decimal (line 1 = bit 0) from the owner's
// Generative-address-system addressing.js. Used to check the trigram key.
const KW_FUXI = { 1: 63, 2: 0, 3: 17, 4: 34, 5: 23, 6: 58, 7: 2, 8: 16, 9: 55, 10: 59, 11: 7, 12: 56, 13: 61, 14: 47, 15: 4, 16: 8, 17: 25, 18: 38, 19: 3, 20: 48, 21: 41, 22: 37, 23: 32, 24: 1, 25: 57, 26: 39, 27: 33, 28: 30, 29: 18, 30: 45, 31: 28, 32: 14, 33: 60, 34: 15, 35: 40, 36: 5, 37: 53, 38: 43, 39: 20, 40: 10, 41: 35, 42: 49, 43: 31, 44: 62, 45: 24, 46: 6, 47: 26, 48: 22, 49: 29, 50: 46, 51: 9, 52: 36, 53: 52, 54: 11, 55: 13, 56: 44, 57: 54, 58: 27, 59: 50, 60: 19, 61: 51, 62: 12, 63: 21, 64: 42 };

const sign = { Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150, Libra: 180, Scorpio: 210, Sagittarius: 240, Capricorn: 270, Aquarius: 300, Pisces: 330 };
const lon = (s, d, m, sec) => sign[s] + d + m / 60 + sec / 3600;

test('rule-derived wheel reproduces all 64 owner gate start positions', () => {
  const wheel = deriveWheel();
  assert.equal(wheel.size, 64);
  for (const [gate, start] of Object.entries(OWNER_STARTS)) {
    assert.equal(wheel.get(Number(gate)) / 3600, start, `gate ${gate}`);
  }
});

test('every gate lands inside its own interval at its midpoint', () => {
  for (const [gate, start] of Object.entries(OWNER_STARTS)) {
    const mid = (start + 5.625 / 2) % 360;
    assert.equal(addressFromLongitude(mid).gate, Number(gate));
  }
});

test('trigram key agrees with the owner King Wen / Fu Xi mapping for every gate', () => {
  assert.equal(KING_WEN_BY_TRIGRAMS.size, 64);
  for (const [figure, gate] of KING_WEN_BY_TRIGRAMS) {
    // Trigram ints are top-line-first strings, so bit 0 is the bottom line: the
    // six-bit figure is already the Fu Xi value (line 1 = bit 0).
    assert.equal(figure, KW_FUXI[gate], `gate ${gate}`);
  }
});

test("owner's worked examples (Pathways doc)", () => {
  const body = addressFromLongitude(lon('Virgo', 25, 59, 31.92));
  assert.deepEqual([body.gate, body.line, body.color, body.tone, body.base], [6, 4, 4, 4, 2]);
  // The doc reports 43.1 here, but its own formula gives line 2 (19 deg 59' Scorpio is
  // 1.117 deg into gate 43; a line is 0.9375 deg). Only the gate is asserted; the line
  // discrepancy is reported to the owner, not hidden.
  const heart = addressFromLongitude(lon('Scorpio', 19, 59, 31.92));
  assert.equal(heart.gate, 43);
  const mind = addressFromLongitude(lon('Virgo', 1, 22, 39));
  assert.equal(mind.gate, 59);
  assert.equal(mind.line, 2);
});

test('gate 25 wraps across 0 Aries', () => {
  assert.equal(addressFromLongitude(359).gate, 25);
  assert.equal(addressFromLongitude(1).gate, 25);
  assert.equal(addressFromLongitude(3.9).gate, 17);
});

test('subdivisions: 6 lines, 6 colors, 6 tones, 5 bases per gate', () => {
  const start = longitudeFromAddress({ gate: 41 });
  const last = addressFromLongitude(start + 5.625 - 0.001);
  assert.deepEqual([last.gate, last.line, last.color, last.tone, last.base], [41, 6, 6, 6, 5]);
  for (const cell of [{ gate: 10, line: 3, color: 2, tone: 5, base: 4 }, { gate: 64, line: 6, color: 1, tone: 1, base: 1 }]) {
    const a = addressFromLongitude(longitudeFromAddress(cell) + 1e-7);
    assert.deepEqual([a.gate, a.line, a.color, a.tone, a.base], [cell.gate, cell.line, cell.color, cell.tone, cell.base]);
  }
});

test('produces addresses the substrate accepts (drop-in for exampleAddress)', () => {
  for (const L of [0, 45.5, 179.999, 302, 359.99]) validateAddress(addressFromLongitude(L, { house: 7 }));
  const a = addressFromLongitude(lon('Virgo', 25, 59, 31.92));
  assert.deepEqual([a.zodiac, a.degree, a.minute, a.second, a.arc], [6, 25, 59, 31, 92]);
  assert.equal(a.houseKnown, false);
});

test('frame views reorder without changing values and round-trip', () => {
  const values = { Movement: 'm', Evolution: 'e', Being: 'b', Design: 'd', Space: 's' };
  assert.deepEqual(frameView(values).map(([d]) => d[0]).join(''), 'MEBDS');
  assert.deepEqual(frameView(values, 'Being').map(([d]) => d[0]).join(''), 'BMSDE');
  assert.deepEqual(fromFrameView(frameView(values, 'Being')), values);
  assert.throws(() => frameView(values, 'Design'), /no recorded order/);
});
