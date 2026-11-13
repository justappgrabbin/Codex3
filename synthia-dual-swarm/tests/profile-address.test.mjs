import test from 'node:test';
import assert from 'node:assert/strict';
import { measureSource, addSimilarity, proportionToCorpus, profileToAddress } from '../core/profile-address.js';
import { validateAddress } from '../core/ontology.js';

const corpus = (withCopy = true) => proportionToCorpus(addSimilarity([
  measureSource('store.js', 'export class Store {}\nexport class Box {}\nexport function put(){}\nexport function take(){}\nconst a=1\nconst b=2'),
  measureSource('wire.js', "import a from './a.js'\nimport b from './b.js'\nimport c from './c.js'\nimport d from './d.js'\nfunction run(){}"),
  measureSource('named_label_doc.js', '// names labels\n// describes the meaning\n// expresses roles\nexport const x = 1'),
  ...(withCopy ? [measureSource('store_copy.js', 'export class Store {}\nexport class Box {}\nexport function put(){}')] : []),
]));

test('each association type leads where it dominates', () => {
  // (Without the near-duplicate file: a duplicate legitimately makes similarity co-lead.)
  const [store, wire, doc] = corpus(false).map(m => profileToAddress(m.profile));
  assert.equal(store.leading, 'Being');      // containment
  assert.equal(wire.leading, 'Design');      // causation
  assert.equal(doc.leading, 'Movement');     // expression
});

test('deterministic: same corpus, same addresses', () => {
  const a = corpus().map(m => profileToAddress(m.profile).address);
  const b = corpus().map(m => profileToAddress(m.profile).address);
  assert.deepEqual(a, b);
});

test('addresses are valid substrate addresses with computed provenance', () => {
  for (const m of corpus()) {
    const { address } = profileToAddress(m.profile);
    validateAddress(address);
    assert.match(address.provenance, /design profile/);
  }
});

test('empty profile is refused, not guessed', () => {
  assert.throws(() => profileToAddress({ Movement: 0, Evolution: 0, Being: 0, Design: 0 }), /empty profile/);
});
