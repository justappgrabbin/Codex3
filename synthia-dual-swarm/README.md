# Synthia — adaptive dual swarm

Open `Synthia-Dual-Swarm.html` in a WebGL browser, or run `npm start` and visit http://localhost:8000. The single file embeds the code, human and wolf; no account or API key is required. Managed browsers that block file URLs can use the local server.

## Try this build

1. The default view is a full-window relational world: 64 canonical hexagrams with six independently addressed lines each. Select any constituent, inspect it, enter it, and switch dimensional perspective without making a second copy of the object.
2. Open **Tools** for the source-based Klein A:B::C:D composer and the retained assembly/image tools. Open **Inspect** for named dimensional qualities and constituent history. **Bodies** keeps the optional human/wolf preview separate from the world.
3. Click **Start learning activity** and answer the first question with `010000`.
4. In the request box, enter **I don't want to play a game. Teach me with slides.** The environment is recomposed and the 1/3 progress survives.
5. Request **Now show me an interactive demonstration.** Change C to `001010` and demonstrate the result. Its actual addressed geometry is constructed while the same objective and progress remain.
6. Save/export the event history to restore the activity and its current composition. Replay is read-only.

See [Adaptive experiences](docs/ADAPTIVE-EXPERIENCES.md) for the composition contract, acceptance test, and current limits.

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

The Boolean ATO, structural topology, recursive address space, and masked update operator from Generative-address-system are now connected, together with the recovered tool factory. The other proposed repository integrations remain unverified. Source provenance and unresolved boundaries are in vendor/generative/README.md.
