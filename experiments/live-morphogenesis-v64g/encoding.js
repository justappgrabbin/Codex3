// encoding.js — BHANTUGH: the eight-layer lowest-level address of every character.
// B Binary · H Hex · A ASCII · N NATO · T Transliteration · U Unicode · G Geometry · H HTML + hash
// The original text is always kept; every other layer is an additional representation.
import { fromByte, projectCodePoint } from "./hexagram.js";
import { radialGeometry } from "./expression.js";

const NATO = { A: "Alfa", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot", G: "Golf", H: "Hotel",
  I: "India", J: "Juliett", K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar", P: "Papa", Q: "Quebec",
  R: "Romeo", S: "Sierra", T: "Tango", U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee", Z: "Zulu",
  0: "Zero", 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight", 9: "Nine" };
// English letter names, IPA (phonetic transcription layer)
const LETTER_IPA = { A: "eɪ", B: "biː", C: "siː", D: "diː", E: "iː", F: "ɛf", G: "dʒiː", H: "eɪtʃ", I: "aɪ", J: "dʒeɪ",
  K: "keɪ", L: "ɛl", M: "ɛm", N: "ɛn", O: "oʊ", P: "piː", Q: "kjuː", R: "ɑːr", S: "ɛs", T: "tiː", U: "juː", V: "viː",
  W: "ˈdʌbəl.juː", X: "ɛks", Y: "waɪ", Z: "ziː" };

// ---- small pure SHA-256 (no dependencies, runs in browser and Node) --------------
export function sha256Hex(bytes) {
  const K = [], H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  for (let n = 2, c = 0; c < 64; n++) { let p = true; for (let d = 2; d * d <= n; d++) if (n % d === 0) { p = false; break; }
    if (p) K[c++] = (Math.cbrt(n) % 1) * 2 ** 32 | 0; }
  const l = bytes.length, buf = new Uint8Array(((l + 9 + 63) >> 6) << 6); buf.set(bytes); buf[l] = 0x80;
  const dv = new DataView(buf.buffer); dv.setUint32(buf.length - 4, l * 8); dv.setUint32(buf.length - 8, Math.floor(l / 2 ** 29));
  const r = (x, n) => (x >>> n) | (x << (32 - n)), w = new Int32Array(64);
  for (let o = 0; o < buf.length; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getInt32(o + i * 4);
    for (let i = 16; i < 64; i++) { const a = w[i - 15], b = w[i - 2];
      w[i] = (r(a, 7) ^ r(a, 18) ^ (a >>> 3)) + w[i - 16] + (r(b, 17) ^ r(b, 19) ^ (b >>> 10)) + w[i - 7] | 0; }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i] | 0;
      const t2 = (r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c)) | 0;
      h = g; g = f; f = e; e = d + t1 | 0; d = c; c = b; b = a; a = t1 + t2 | 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

function scriptOf(ch) {
  for (const s of ["Latin", "Greek", "Cyrillic", "Hebrew", "Arabic", "Han", "Hiragana", "Katakana", "Hangul", "Devanagari", "Phoenician", "Ethiopic"])
    if (new RegExp(`\\p{Script=${s}}`, "u").test(ch)) return s;
  return /\p{M}/u.test(ch) ? "Combining mark" : /\p{P}|\p{S}/u.test(ch) ? "Punctuation/Symbol" : "Other";
}

function transliterate(ch) {
  const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
  if (/^[\x00-\x7f]*$/.test(base)) return base;
  const map = { "ǀ": "|", "ǁ": "||", "ǂ": "!=", "ǃ": "!", "ʘ": "O." };              // click consonants (IPA) -> ASCII convention
  return map[ch] ?? null;                                                         // null = no faithful Latin form; original kept
}

/** All eight BHANTUGH layers for one character at one position. */
export function encodeChar(ch, position) {
  const cp = ch.codePointAt(0), utf8 = [...new TextEncoder().encode(ch)];
  const upper = ch.toUpperCase();
  const hex = projectCodePoint(cp).projection;
  return {
    position, original: ch,
    B_binary: utf8.map(b => b.toString(2).padStart(8, "0")),
    H_hex: utf8.map(b => "0x" + b.toString(16).toUpperCase().padStart(2, "0")),
    A_ascii: cp < 128 ? cp : null,
    N_nato: NATO[upper] ?? null, phonetic: LETTER_IPA[upper] ? `/${LETTER_IPA[upper]}/` : null,
    T_transliteration: transliterate(ch),
    U_unicode: { codePoint: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"), decimal: cp, utf8, script: scriptOf(ch) },
    G_geometry: { hexagram: hex, polygon: radialGeometry(hex.lines, 1) },
    H_html: `&#x${cp.toString(16).toUpperCase()};`, hash: sha256Hex(new Uint8Array(utf8)),
  };
}

/** Encode text. Iterates by code point; order, repeats and spelling are preserved exactly. */
export function encodeText(text) {
  const chars = [...text];
  return { original: text, length: chars.length, chars: chars.map((c, i) => encodeChar(c, i)) };
}

/** Reverse: rebuild the exact original from any one reversible layer. */
export function decode(encoded, layer = "U_unicode") {
  const chars = [...encoded.chars].sort((a, b) => a.position - b.position);
  const fromBytes = arrs => new TextDecoder().decode(new Uint8Array(arrs.flat()));
  if (layer === "U_unicode") return chars.map(c => String.fromCodePoint(c.U_unicode.decimal)).join("");
  if (layer === "B_binary") return fromBytes(chars.map(c => c.B_binary.map(b => parseInt(b, 2))));
  if (layer === "H_hex") return fromBytes(chars.map(c => c.H_hex.map(h => parseInt(h, 16))));
  if (layer === "H_html") return chars.map(c => String.fromCodePoint(parseInt(c.H_html.slice(3, -1), 16))).join("");
  if (layer === "A_ascii") { if (chars.some(c => c.A_ascii === null)) throw new Error("ASCII not reversible: non-ASCII present");
    return chars.map(c => String.fromCharCode(c.A_ascii)).join(""); }
  throw new Error(`layer ${layer} is not reversible (NATO/transliteration/geometry/hash are one-way views)`);
}
