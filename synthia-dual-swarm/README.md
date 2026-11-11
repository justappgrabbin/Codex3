# Synthia — adaptive dual swarm

Open `Synthia-Dual-Swarm.html` in a WebGL browser, or run `npm start` and visit
http://localhost:8000. The single file embeds code and body assets; no account or
API key is required. Rebuild it with `npm install` and `npm run build`.

The active swarm composes **primitive functions** through typed ports and observed
values. Executed graphs that satisfy an output contract become reusable callable
clusters; later compositions can use those clusters as primitives. Feedback affects
selection. There are no preset game/slides/demo paths or generated sample lessons.

The initial world is a full viewport atlas of 64 canonical Yi Jing assemblies with
six addressed lines each. **Inspect** explores their recursive constituents and five
dimensional perspectives without replacing identity. **Observe selection** lets the
primitive runtime compose an artifact from the actual selected records. **World
geometry** returns to the atlas. **Tools** exposes typed observation data, composition
pause/step, learned clusters, checkpointing and the source-based Boolean A:B::C:D
operator. The output-contract field accepts JSON, such as `{"type":"artifact"}`.
Natural-language grounding is not implemented.

Purpose, information and recorded progress remain independent of the arrangement.
The generic renderer consumes a verified node tree; it has no experience-specific
render functions. Search, working memory and nested invocation have explicit bounds.
It runs while this page is active, with no shell or network execution. This is a
bounded executable-composition foundation, not a completed self-generating world.

See [the runtime contract and boundaries](docs/ADAPTIVE-EXPERIENCES.md),
[verification](docs/ADAPTIVE-VERIFICATION.md), and
[source provenance](vendor/generative/README.md).

`npm test` runs 36 checks, including primitive discovery, recursive cluster reuse,
feedback, invalid output rejection and exact replay. Browser checks also exercise
source and standalone composition, the addressed atlas, bodies and mobile layout.

Existing body morphing, relation-derived neural assembly training and image-region
learning remain available. Original activity and relay scenarios remain optional
regression fixtures; they are not evidence of emergent capabilities. Human Design
vocabulary is an authored conceptual framework, not an established physical law.
The original numeric atlas animation has been removed; exact directional glyph
rules and general semantic world generation remain unfinished.

The human is a real mesh with a 44-bone skeleton, locally bound skin weights and authored idle/walk clips. It is a stylized human adapted from the supplied FBX, not a person reconstructed from a photo. Image learning currently clusters observed colors and spatial boundaries: it does not identify people, infer hidden backgrounds, rig a photograph or generate realistic video.

The page objects have shared identities and morph actions; their geometry and behavior are still seeded by authored code. The swarm does not yet invent arbitrary applications, games or human anatomy. Existing activities are explicit fixtures. Human Design source vocabulary is treated as an authored conceptual framework, not an established physical law or a diagnosis. Natal charts and transits are not calculated.

A separate `synthia-unity` project contains native integration components, models and exported controller weights. Unity is unavailable here, so that project has not been compiled or visually verified in the Editor. It is not a finished Unity player build.

## Development

`npm test` runs the core regressions. `npm run build` rebuilds the single-file package after installing the pinned esbuild development dependency. Browser checks require Playwright and Chromium; neither is a runtime dependency.

See `docs/VERIFICATION.md`, `docs/SOURCE-INTAKE.md`, and `docs/INTAKE-INVENTORY.json`. Original uploads were left unchanged. Asset availability does not imply unrestricted redistribution rights; preserve source attribution and verify the original asset terms before publishing.

## Continuous-agent milestone

Use **Start agents** to run three functional agents on a shared 750 ms simulation clock. They discover a damaged relay, communicate observed state, gather finite parts, attempt repairs and update action-value estimates from rewards and failures. A failed repair lowers its learned value enough for tool morphology to become preferable; morphology changes reach, speed and ability to grip. Those consequences affect future actions and other agents. Communication and successful repairs create actual typed relations and packet crossings.

Controls include pause, single-step, a morphology permission, a 120-tick budget, checkpoint/save and restoration. Checkpoints retain the world and experience-updated policies, restore paused, and can reverse experimental runs. Execution also suspends during replay, movement, global pause and hidden tabs. It runs only while the browser page is active; this is not an unattended server service. Completion/budget exhaustion saves a local checkpoint; explicit checkpointing is available mid-run.

This is a bounded local multi-agent scenario with authored legal actions, body mechanics, rewards and goal utilities. It does not accept arbitrary natural-language tasks, invent arbitrary tools, or prove open-ended intelligence. The three agents are functional entities shown in the graph and activity log; they are not three newly rigged visual characters. Their tool morphology currently affects simulation mechanics, not visible hand reconstruction. Existing 5D frames and the separate neural assembly controller remain in place.

Other repositories mentioned as potential integrations (Simlish, Generative-address-system, Synthcodex1, Language-contact-model/Klein and Codex2) have not been connected by this milestone.

## Rule-based dynamic swarm

The autonomy runtime now derives temporary restoration and recovery goals from
world state. It discovers multiple structures, chooses among finite supplies,
learns action values from consequences, transfers existing materials to peers,
and retains social ties which weaken when unused. These ties are agent memory;
the substrate's historical interaction edges remain as an audit trail.

`AutonomousSwarm.addObject({id, position, health, required})` adds infrastructure;
`addObject({id, position, parts})` adds a supply. IDs must start with `autonomy.`.
Adding an object reopens completion, subject to the original tick budget. Example:

```js
const runtime = new AutonomousSwarm(core);
runtime.addObject({id:'autonomy.pump', position:-8, health:0, required:2});
runtime.addObject({id:'autonomy.scrap', position:-4, parts:4});
runtime.control(true);
while (runtime.step()) {}
```

Every direct action is validated for permission, agent capability, target type,
energy, inventory and capacity. Out-of-range physical actions spend energy on
movement first. Agents start with 40 energy, spend one per non-rest action, and
recover six per rest; inventory capacity is three. Grippers still follow the
existing reach/speed tradeoff. Morphing does not manufacture materials.
Checkpoint replay includes goals, observations, policies, energy and social ties.

This remains a bounded local simulation with authored operators and repair-oriented
utilities, three initial agents and a one-dimensional world. It does not yet learn
reusable plans, invent components, negotiate teams, or implement the proposed four
ability pairs. Resource scarcity or denied permissions can prevent completion.
`npm test` covers unfamiliar layouts, direct-action denials, recovery, conservation,
tie decay, new damage and deterministic replay alongside the existing regressions.

## Dynamic participants and collective function learning

The follow-on branch separates initial demo conditions from runtime rules, supports arbitrary participant rosters and component catalogs, and lets agents coordinate in response to queued function demands. A compatible relationship cluster can compose/test a numerical transformation and drive an existing scene object. Learned functions, action-sequence values, goals, rule changes and renderer feedback survive checkpoint replay. Local code, PNG and silent video exports are available.

See [DYNAMIC-SWARM.md](docs/DYNAMIC-SWARM.md) for the configuration format, numerical example, recovered Synthia local-model adapter, verification and current boundaries. The default three-agent relay remains an example, not a required roster or solution script.

The human and wolf are existing stylized assets, not photorealistic generated
anatomy. The human has a locally bound 44-bone skeleton and idle/walk clips. Image
learning clusters observed colors/boundaries, not hidden depth or realistic video.
The separate `synthia-unity` scaffold has not been compiled in Unity Editor here.
Original uploads remain unchanged; preserve asset attribution and source terms.
