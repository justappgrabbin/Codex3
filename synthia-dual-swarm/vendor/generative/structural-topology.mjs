// Ported from justappgrabbin/Generative-address-system, structural-space.mjs.
// Independent exports extracted unchanged; source statuses and unresolved rules retained.
const freeze = value => { if(value && typeof value === 'object' && !Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);} return value; };
export const FIELD_VECTORS = freeze({ M: 'Evolution', E: 'Design', B: 'Being', I: 'Movement' });
export const DIRECTIONAL_CLAIMS = freeze({
  Being: { description: 'across', status: 'user-stated', path: null },
  Movement: { description: 'up/down; its top can be our bottom', status: 'user-stated', path: null },
  Evolution: { description: 'dual; W-shaped flow; minor-side qualification', status: 'exact-path-unresolved', path: null },
  Design: { description: 'diagonal', status: 'provisional-per-user', path: null },
  Space: { description: 'emerges from interplay', status: 'user-stated', path: null },
});

export class FractalAddressSpace {
  static fields = freeze([['gate', 64], ['line', 6], ['color', 6], ['tone', 6], ['base', 5]]);
  static branching = 69120n;
  constructor({ depth = 1 } = {}) {
    if (!Number.isInteger(depth) || depth < 1 || depth > 32) throw new RangeError('depth must be in 1..32');
    this.depth = depth;
  }
  get capacity() { return FractalAddressSpace.branching ** BigInt(this.depth); }
  at(index) {
    if (typeof index === 'number' && !Number.isSafeInteger(index)) throw new RangeError('use a BigInt or decimal string for large indexes');
    let remaining = BigInt(index);
    if (remaining < 0n || remaining >= this.capacity) throw new RangeError('index outside fractal address space');
    const path = [];
    for (let level = 0; level < this.depth; level++) {
      const cell = {};
      for (const [name, size] of [...FractalAddressSpace.fields].reverse()) { cell[name] = Number(remaining % BigInt(size)) + 1; remaining /= BigInt(size); }
      path.unshift(Object.fromEntries(FractalAddressSpace.fields.map(([name]) => [name, cell[name]])));
    }
    return { index: String(BigInt(index)), identity: `state://${path.map(c => FractalAddressSpace.fields.map(([k]) => c[k]).join('.')).join('/')}`, path };
  }
  indexOf(path) {
    if (!Array.isArray(path) || path.length !== this.depth) throw new RangeError('path must match depth');
    let result = 0n;
    for (const cell of path) for (const [name, size] of FractalAddressSpace.fields) {
      if (!Number.isInteger(cell[name]) || cell[name] < 1 || cell[name] > size) throw new RangeError(`invalid ${name}`);
      result = result * BigInt(size) + BigInt(cell[name] - 1);
    }
    return result;
  }
  snapshot() { return { depth: this.depth, branching: String(FractalAddressSpace.branching), capacity: String(this.capacity), allocation: 'lazy',
    interpretation: 'representational capacity of independent recursive slots; not a count of validated meanings',
    angularPolicy: 'degree/minute/second/arc are not multiplied as independent axes without established rules' }; }
}

export const JUT_TOPOLOGY = freeze({
  source: 'user: explicit M/E/B/I + emergent P formalization, 2026-10-22',
  nodes: [
    { id: 'Evolution', vector: 'M', position: [-1, -1], labels: ['Mind', 'Evolution'] },
    { id: 'Design', vector: 'E', position: [1, -1], labels: ['Ego', 'Design'] },
    { id: 'Being', vector: 'B', position: [-1, 1], labels: ['Body', 'Being'] },
    { id: 'Movement', vector: 'I', position: [1, 1], labels: ['Individuality', 'Movement'] },
  ],
  relations: [
    { id: 'speed', from: 'Evolution', to: 'Design', label: 'Speed', kind: 'outer' },
    { id: 'material', from: 'Evolution', to: 'Being', label: 'Material', kind: 'outer' },
    { id: 'force', from: 'Being', to: 'Movement', label: 'Force', kind: 'outer' },
    { id: 'position', from: 'Design', to: 'Movement', label: 'Position', kind: 'outer' },
    { id: 'diagonal-MI', from: 'Evolution', to: 'Movement', label: 'M/I cross-coupling', kind: 'diagonal' },
    { id: 'diagonal-EB', from: 'Design', to: 'Being', label: 'E/B cross-coupling', kind: 'diagonal' },
  ],
  expression: null,
  layoutPolicy: 'reference layout from the supplied graph; other perspective transformations require explicit rules',
});


