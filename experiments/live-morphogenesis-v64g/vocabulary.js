// vocabulary.js — the user's own gate vocabulary (vocabulary.json, built from their Black Book tables + spec by
// ../build_vocab.py). Each gate's words go to the units that hold that gate: its line's name first (the unit's own
// line), the gate's name, its three meanings, its center — then the dimension's chain words fourfold already gives.
// The words feed the same paths words always fed: the colour (ASCII→MIDI→colour) and the "words" view.
import { colorOfWords, motionOf } from "./fourfold.js";
let V = null;
export async function loadVocabulary(url = new URL("./vocabulary.json", import.meta.url)) {
  if (V) return V; try { V = typeof window === "undefined" ? JSON.parse((await import("node:fs")).readFileSync(url, "utf8")) : await (await fetch(url)).json(); } catch { V = null; } return V; }
export const vocabulary = () => V;
export function gateWords(gate, line) {
  const g = V?.gates?.[gate]; if (!g) return [];
  return [g.lines?.[line]?.name, g.name, ...(g.triad ?? []), g.center].filter(Boolean);
}
/** Give a unit its words. Keeps fourfold's chain words after the gate's own; recolours from the fuller words. */
export function dress(u) {
  if (!V || !u.four || !u.address?.gate) return u;
  const own = gateWords(u.address.gate, u.address.line), chain = u.four.chainWords ?? u.four.area;
  u.four.chainWords = chain; u.four.area = [...own.slice(0, 3), ...chain].slice(0, 6);
  u.four.color = colorOfWords(u.four.area); u.four.motion = motionOf(u.four.area, u.address.dimension); u.vocab = own;
  const B = V.gates?.[u.address.gate]?.blue;   /* Blue I Ching raw page, where given: the line's success (exalted) and failure (detriment) */
  u.blue = B ? { potential: B.potential, rave: B.rave_name, line: B.lines?.[u.address.line] ?? null } : null;
  return u;
}
export const dressAll = S => { for (const u of S.units) dress(u); return S; };
