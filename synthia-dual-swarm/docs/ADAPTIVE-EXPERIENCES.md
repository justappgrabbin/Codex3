# Primitive swarm composition

The active runtime is `PrimitiveSwarm`, not a set of named experience recipes.
It searches over registered pure functions and typed observations. There is no
game/slides/demo dispatch table, sample lesson, or personality-to-format mapping.
`ExperienceSession` retains actual subject, objective, information and progress
separately from the produced arrangement.

## Rules and primitives

A primitive declares an identity, version, typed input ports, output type, cost,
optional precondition, and trusted synchronous implementation. Types have value
validators. The default library contains Boolean XOR, equivalence, complement,
Hamming distance, text splitting/reversal/joining, record projection/partitioning,
text-node materialization, nesting and arrangement. Templates and layout values
are observations, not names of experiences. New primitives can be registered
without editing the search algorithm or adding a scenario.

Each bounded step binds compatible observed or produced values to primitive ports,
executes one candidate, validates its result and records the consequence. The
scheduler prefers shallow graphs, then cost adjusted by recorded feedback, then
a stable ordering. Failed executions reduce later selection preference. This
feedback measures execution validity; a person or external evaluator can supply
additional feedback in [-1,1]. It does not automatically establish educational
success or semantic understanding.

A goal specifies an output type and optional value constraints (`equals`,
`includes`, `minimum`, `maximum` at an explicit `path`). A matching executed graph
is promoted to a callable cluster. Its typed external ports, intermediate bindings,
primitive versions and constituent identities remain inspectable. The cluster is
registered as a primitive at the next scale, so later searches can discover larger
compositions using it. Invocation executes the graph on fresh input data; it does
not replay an old answer. Changed observations invalidate derived values, while
retaining feedback, learned clusters, activity purpose and progress.

## Browser controls

**Observe selection** supplies records from the actual selected entity and its
children, with a basic text-node template and layout as explicit initial data.
The default output contract is `{"type":"artifact"}`. This is an inspection adapter,
not a fabricated lesson. **World geometry** returns to the addressed atlas.

In **Tools**, the typed-observations JSON field can replace those selection inputs.
For example, supplying records, a template, a layout and a numeric partition size
allows the search to find either a flat or grouped artifact according to the output
constraints. No named format renderer is selected. The single DOM adapter renders
the verified node tree using a small permitted element vocabulary and text nodes.
It never evaluates HTML, scripts or event handlers from the produced data.

The output-contract field accepts JSON. Natural-language format interpretation is
not implemented: unsupported prose reports a gap and leaves the current
arrangement intact. Finding a new arrangement does not erase subject or progress;
the previous cluster becomes inactive and remains in history. Interactive controls
currently have no synthesized behavior. General semantic grounding and arbitrary
application generation remain future work.

## Supervision and boundaries

Search pauses during replay, hidden tabs and global pause. Controls provide pause,
single-step and a whole-substrate checkpoint restored paused. Defaults bound
working values to 96, attempts to 384, depth to 7, candidate inspection and nested
cluster invocation. Reaching a bound reports `exhausted`, not a claim that no
solution exists. Pure functions must be trusted bounded implementations: JavaScript
cannot forcibly interrupt a synchronously hanging registered function. No shell,
network tools or generated JavaScript execute during search.

Checkpoint data preserves graphs and observations, not function source. Built-in
implementations are re-registered on restoration, and original primitive versions
are checked when invoking a graph. Additional host primitives must be re-registered
by that host. Exact event replay is separate from continuation of execution.

The atlas retains 64 canonical Yi Jing assemblies and recursive addressed
constituents across five **dimensions**, each of which can contain multiple levels.
The former automatic seeded tensor animation has been removed. Available source
operators are not treated as invented physical or psychological laws. Exact 45°
directional glyph traversal remains unresolved, not silently supplied.
