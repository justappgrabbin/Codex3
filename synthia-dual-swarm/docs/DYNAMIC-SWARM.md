# Rule-governed dynamic swarm

The runtime chooses actions from current needs, capabilities, resources, relationships and learned consequences. Initial conditions and physical laws are explicit data. A fixed action sequence or a particular agent/object name is not required to complete the tests.

## Run it

Start the browser app with `npm start`. The relay world is an example configuration. Use **Start world from JSON** to load `examples/collective-world.json` or your own configuration. The previous world is retained locally and can be restored. New worlds start paused. Imported configuration is bounded to 64 KB, 64 agents, 128 world objects and 1,000 ticks. Invalid configuration leaves the live world intact.

The example file deliberately uses different participants, resource locations and infrastructure. Agent capabilities and mathematical primitives are declared per participant, not assigned by runtime role names. `addAgent`, `setAgentActive`, `addObject` and `setRules` can change conditions during execution. Agent identifiers must start with `autonomy.`; they have no special role semantics.

## Function demand and collective abilities

Supply 6–64 distinct numeric `[input, output]` examples under **Local function → form**, then request a function. For an example numerical task, try:

```json
[[0,-1.2],[1,2.5],[2,6.2],[3,9.9],[4,13.6],[5,17.3]]
```

This specifies desired behavior, not a program or which agents should implement it. The queue reopens the simulation. Agents can exchange observations with nearby complementary peers. Relationships strengthen from accepted interactions and decay under the configured rules. Connected peers pool their permitted operations. The simulation clock attempts the queued demand when a viable cluster has sufficient energy.

The local search tests at most 600 candidates. It composes scale, bias, sine and clamp operations, including affine coefficients inferred from training observations. One third of the examples are reserved for validation. A local coding model can additionally propose programs up to six operations long. Only validated proposals using the cluster's actual primitives are eligible. Failed searches remain recorded outcomes, not fabricated success.

Accepted programs retain their examples, training/validation error and participant provenance. They can bind to a permitted form target and be exported as standalone JavaScript plus evidence JSON. No generated host code is evaluated. A different compatible cluster can later reuse the retained function. Losing relationship strength, proximity, energy or morph permission suspends its application.

The existing renderer applies bounded scale and rotation modulation to the selected object. Its observed consequence is returned through a real `drives-form` substrate relation and event. Releasing a target restores its prior scale/rotation. Scene PNG and short silent video exports use browser canvas capture and the available browser encoder. The recording window is five seconds after encoding begins; encoded timing and frame rate depend on the browser, so no exact clip duration is guaranteed.

## World rules and learning

`core/swarm-rules.js` defines validated costs, energy recovery, goal priorities, relationship parameters and permitted component recipes. `core/swarm-scenarios.js` holds the default example separately. Goal urgency comes from current damage, energy shortage, material availability and function demand. Running action values and adjacent-action sequence values update from actual rewards/failures.

Morphology selects a compatible recipe by the target's required capability. The recipe determines geometry, energy and material costs. For example, a target needing `seal` can lead an agent to assemble an available seal tool; a gripper is not universally prescribed. Parts used in morphology and repairs are consumed from existing inventory. The rules and body definitions remain authored, inspectable laws; this runtime does not invent physics or obtain new permissions.

## Existing Synthia local model

The optional proposal path reuses the user's recovered Adaptive `LocalModel` implementation, unchanged under `vendor/synthia-local/`, with provenance recorded there. It supports the original Android embedded-model bridge and already running Ollama/llamafile engines on loopback. No hosted provider or API key is required.

Browser previews do not contain the APK's 1.117 GB Qwen weights or ARM64 engine. Embedded mode needs the actual Synthia Android host and its local-model route. Desktop engines must already be installed/running and permit the browser origin. If unavailable, the error is visible; no generated output is fabricated. Live native inference was not exercised in this branch's checks.

## Evidence and scope

`npm test` covers the existing substrate and autonomy regressions plus new-roster behavior, alternate component recipes, source conservation, data-derived coefficients, loss/replacement of cluster members, automatic coordination, queued demands across checkpoints, permissions, failed search, executable exports and controlled local-model proposals.

With the server running, `node tests/production-browser.cjs` checks the built standalone app: demand → cluster composition → learned function → observed scene effect → code/PNG/video downloads, replay, checkpoints, custom-world import and restoration. It requires Playwright and Chromium; `CHROMIUM_PATH`, `SYNTHIA_TEST_URL` and `SYNTHIA_TEST_OUTPUT` override local defaults.

This is bounded numerical tool composition and scene production. General program synthesis, learned team negotiation, new anatomical geometry, photorealistic synthesis and the complete WorldGen/CharacterGen/WorldAdapter integrations remain separate work. The source audit located those systems; their discovery is not represented as completed integration here.
