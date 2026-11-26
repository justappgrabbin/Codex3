// focal-point.js — one shared, moving central point that the whole swarm orients to (user, Nov 22 2026).
// It is a REFERENCE, not a controller: it issues no instructions. Each participant measures its own angle to it
// and decides for itself; the angle sets how strongly it takes part, so participation varies continuously
// ("a varying rate") as either the point or the participant moves.
//
//   * Morphology sets the target: what the swarm is working on (text, or an explicit address) goes through the
//     user's morphology generator (vendor/morphology, from Generative-address-system) and becomes an address.
//     If morphology cannot resolve it, the focus is reported unresolved — no address is invented.
//   * Placement: degree/minute/second inside the zodiac give the exact angle (longitude). A gate.line.color.tone.base
//     address with no degrees is placed at the start of its cell on the wheel (semantic-address.js).
//   * Spacetime semantics sets HOW each one relates to the point: the association type of its own dimension
//     (Burgess types per dimension, spacetime-semantics.js): Being containment, Movement cooperation,
//     Design causation, Evolution similarity; Space has no link type — it is where the others meet.
//   * Participation rule (mine, change freely): w = (1 + cos Δ) / 2, Δ = angle between participant and focus.
//     Same place = 1, opposite side of the wheel = 0, smooth in between.
// The morphology generator imports node:crypto, so focusFromSubject runs in Node (runtime/), not the browser bundle;
// focusFromAddress and everything else is pure and runs anywhere.
import { longitudeFromAddress } from './semantic-address.js';
import { TYPE_OF_DIMENSION } from './spacetime-semantics.js';

const norm = d => ((d % 360) + 360) % 360;
/** Angle in degrees (0..360) from an address: exact degrees if present, else the start of its gate cell. */
export function placementOf(address = {}) {
  if (Number.isFinite(address.longitude)) return norm(address.longitude);
  if (Number.isFinite(address.degree) && Number.isInteger(address.zodiac))
    return norm((address.zodiac - 1) * 30 + address.degree + (address.minute ?? 0) / 60 + (address.second ?? 0) / 3600);
  if (Number.isInteger(address.gate)) return longitudeFromAddress(address);
  return null;
}
/** Smallest angle between two placements, 0..180. */
export const separation = (a, b) => { const d = Math.abs(norm(a) - norm(b)); return d > 180 ? 360 - d : d; };
export const participation = delta => (1 + Math.cos(delta * Math.PI / 180)) / 2;

/** Focus from an explicit address (a touch, a picked unit, the leading hexagram of a job). */
export function focusFromAddress(address, source = 'address') {
  const at = placementOf(address);
  if (at == null) return { status: 'unresolved', reason: 'address has no gate and no degrees', source };
  return { status: 'resolved', address, longitude: at, source };
}

/** Focus from what the swarm is working on, through the user's morphology. Node only (see header). */
export async function focusFromSubject(subject) {
  const { SemanticAddressGenerator } = await import('../vendor/morphology/extensions/generative-address-morphology/src/core/semantic-address.mjs');
  const r = new SemanticAddressGenerator().generate(typeof subject === 'string' ? { text: subject } : subject);
  if (r.status !== 'generated' || !r.addresses.length) return { status: 'unresolved', reason: r.reason ?? 'morphology produced no address', source: 'morphology' };
  const best = r.addresses[0];
  return { ...focusFromAddress(best, 'morphology'), similarity: best.semantic?.similarity ?? null, candidates: r.addresses.length };
}

/** Every participant reads the focus from where it stands. Returns per-participant readings; changes nothing. */
export function orient(focus, participants) {
  if (focus?.status !== 'resolved') return participants.map(p => ({ id: p.id, status: 'no focus', weight: 0 }));
  return participants.map(p => {
    const at = placementOf(p.address ?? p);
    if (at == null) return { id: p.id, status: 'unplaced', weight: 0 };
    const delta = separation(at, focus.longitude), dim = p.dimension ?? p.address?.dimension ?? null;
    return { id: p.id, status: 'oriented', angle: delta, weight: participation(delta),
      relation: dim === 'Space' ? 'meeting point (no link type)' : TYPE_OF_DIMENSION[dim] ?? null, dimension: dim };
  });
}

/** The point moves with the work: each new subject gives a new focus, and everyone re-reads it. */
export class FocalPoint {
  constructor() { this.focus = null; this.history = []; }
  set(focus) { this.focus = focus; this.history.push({ ...focus, at: this.history.length }); return focus; }
  async retarget(subject) { return this.set(typeof subject === 'object' && !Array.isArray(subject) && (subject.gate || subject.degree != null || subject.longitude != null)
    ? focusFromAddress(subject) : await focusFromSubject(subject)); }
  read(participants) { return orient(this.focus, participants); }
}
