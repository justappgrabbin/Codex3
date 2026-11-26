// relational.js — computation on the bond, not only attraction (user spec, Nov 22).
// When two compatible units meet, Klein's Appositional Transformation Operator runs on their Boolean vectors
// (Klein 1983, Current Anthropology 24:151-180; operator code copied unchanged from the user's
// Generative-address-system repo: vendor/boolean-ato.js). Worked example from the paper: *(001000, 101111) = 011000.
// The product is a new state. A unit that took part keeps it as an acquired state, and an acquired state can
// let it bond with units it could not bond with before — the resulting interaction was not possible earlier.
import ATO from "./vendor/boolean-ato.js";
import { maskFromKingWen, kingWenFromMask } from "./kingwen.js";

// NAND on every bond (user, Nov 22): NAND alone can build all 16 Boolean functions, so the function a formation
// computes comes from how bonds chain, not from a table. Klein's equivalence stays available by name.
export const BOND_MODE = { value: "nand" };
/** A chain of bonds computes by NAND step by step: (((a ⊼ b) ⊼ c) ⊼ d)… — the function is the wiring. */
export function chainNand(vectors) { let acc = vectors[0]; for (let i = 1; i < vectors.length; i++) acc = ATO.toBitString(ATO.operator(acc, vectors[i], "nand")); return acc; }
const bits6 = gate => maskFromKingWen(gate).toString(2).padStart(6, "0");

// Capability per dimension = the Klein tool the user placed on that level (user, Nov 2 2026).
// Space's tool carries the user's own "maybe".
export const CAPABILITY_BY_DIMENSION = Object.freeze({
  Movement: "monte-carlo", Evolution: "autoling", Being: "diseminer", Design: "grammar-coder", Space: "generator+monitor (maybe)",
});

/** The four parts a unit keeps apart: who it is, what it can do, what is on now, what its bonds are producing. */
export function partsOf(u) {
  return {
    identity: Object.freeze({ ...u.address }),
    capabilities: [CAPABILITY_BY_DIMENSION[u.address.dimension] ?? null].filter(Boolean),
    active: [...(u.q?.qualities ?? [])],
    transformations: [...(u.transforms?.values() ?? [])],
  };
}

/** Run the operator on one bond. Returns the product state (gate + bits), or null if either side has no gate. */
export function computeOnBond(a, b, mode = BOND_MODE.value) {
  const ga = a.address.gate, gb = b.address.gate; if (!ga || !gb) return null;
  const known = a.transforms?.get(b.id); if (known && known.op === mode) return known;   // same pair, same identities: same product
  const v = ATO.operator(bits6(ga), bits6(gb), mode), s = ATO.toBitString(v);
  const product = { op: mode, from: [ga, gb], bits: s, gate: kingWenFromMask(parseInt(s, 2)) };
  for (const [u, o] of [[a, b], [b, a]]) {
    u.transforms ??= new Map(); u.acquired ??= new Set();
    if (!u.transforms.has(o.id)) { u.transforms.set(o.id, { with: o.id, ...product }); u.acquired.add(product.gate); }
  }
  return product;
}

/** Can a reach b through something it acquired? Returns the acquired gate that opens the bond, or null. */
export function openedBy(a, b, bondFn, leader) {
  // a and b already failed to line up on any field, so only the gate can change that: the acquired gate must equal b's gate
  const g = b.address.gate; if (!g || g === a.address.gate || !a.acquired?.has(g)) return null;
  const r = bondFn({ ...a.address, gate: g }, b.address, leader); return r.count ? { gate: g, bond: r } : null;
}
