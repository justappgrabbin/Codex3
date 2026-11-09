# Synthia — adaptive dual swarm

Open `Synthia-Dual-Swarm.html` in a WebGL browser, or run `npm start` and visit http://localhost:8000. The single file embeds the code, human and wolf; no account or API key is required. Managed browsers that block file URLs can use the local server.

## Try this build

1. Use **Morph body** to dissolve and reassemble the actual skinned human. The wolf uses the supplied Unity asset.
2. Use **Train** to fit an assembly controller, compare its held-out cost, then invoke the resulting assembly capability. Its graph architecture comes from registered clusters and relations.
3. Use **Morph interface** to animate interface objects individually. The seed page is compiled into the same entity substrate as bodies and tools.
4. Inspect a dimension, then a named quality. Each nested frame exposes all five dimensions again, with twelve named qualities per dimension. Identity remains unchanged through the frame path.
5. Upload an image to learn its local color regions and boundary relations. The observed image stays flat; brightness does not fabricate mountains.
6. Switch to Function to inspect actual relations. Expand the optional activity fixtures for the three authored games. Export/import and retained history support deterministic state replay.

## What is implemented

The function and embodied views share entities, typed relations, executable tools, source addresses and retained history. Surface particles sample the supplied human mesh and use local bonds and a learned spring controller during morphing. A small message-passing network learns assembly parameters through backpropagation on simulated trials, including held-out evaluation. Live assembly observations can inform subsequent training. This is a bounded learning task, not evidence of general intelligence.

Recursive qualitative frames retain source vocabulary and resolve all five dimensions at each path, lazily, with a practical depth limit of 32. The scalar simulation controls are separate from that qualitative ontology. Registering a quality name does not implement all its possible sensory or causal meanings.

## Current limits

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
