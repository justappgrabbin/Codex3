# Primitive composition verification

`npm test` passes 36 checks: 17 substrate/legacy regressions, 5 optional legacy
agent-fixture regressions, 7 dimensional atlas/source-operator checks and 7
primitive-composition checks. The legacy relay agents and activities are fixtures;
the active composition runtime does not instantiate the relay scenario.

The primitive checks demonstrate:

- Discovery of an unspecified multi-step graph, execution on fresh inputs, and
  reuse of its promoted cluster inside another discovered capability.
- A new primitive resolving a previously blocked type contract.
- Rejected invalid outputs, bounded execution and feedback changing selection.
- Data-driven regrouping and layout changes retaining purpose and recorded progress.
- Exact checkpoint replay, restored graph invocation, and primitive-version checks.
- A Boolean result found by composing source operators against an explicit goal,
  without registering an analogy recipe in the search kernel.

`npm run build` creates the embedded standalone from the same source.
`tests/experience-browser.cjs` checks actual selection composition, supplied-data
regrouping, retained activity data, released prior arrangement, checkpoint/replay,
unsupported prose and mobile overflow. It runs against source and standalone.
Screenshots `primitive-composition.png`, `primitive-recomposition.png`, and
`primitive-mobile.png` show these rendered outputs. `primitive-cluster.png` shows
the discovered graph in Function view.

`tests/dimensional-world-browser.cjs` checks the full viewport atlas, stable
identities across dimensional perspectives, recursive constituents, the existing
factory analyzer, body loading, replay and mobile layout. Atlas observations enter
the primitive runtime; the atlas no longer claims fabricated numerical dynamics.

Use a local server on port 8000 and a development Playwright/Chromium installation.
Set `STANDALONE=1` to target the embedded file. Those are verification dependencies,
not runtime dependencies. Unity was not changed or Editor-tested. These checks do
not establish unrestricted world generation, general language understanding or a
complete implementation of the author's directional glyph rules.
