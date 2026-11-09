# Codex3 six-bit swarm and visual training

This extends the existing Codex3 core, native APK, event log and background service. The target remains learned reconstruction and generation of photographs, 3D scenes and video. This milestone implements the state compiler, geometric routing, and a trained quantized visual readout. It does not establish the full target.

## Runtime implementation

`core/six-bit-swarm.js` strictly validates six-bit words and ordered fragment layouts. All 64 values survive all nine source/target tier conversions: one 6-bit part, two 3-bit parts, or three 2-bit parts. Fragment slot zero carries the least significant bits. Invalid fragments are rejected, never silently masked to zero. These parts are currently logical fragments stored per particle; independently simulated fragment bodies and physical cluster split/merge mechanics are still required for the complete multi-scale spatial specification.

Every service tick advances existing particle mechanics, detects six-bit contacts, updates routing, and performs a slice of queued visual training. Collision deltas use pre-contact words, geometry-derived masks and the specified `(A XOR B) AND mask` rule. Simultaneous deltas are XOR-combined. Contact entry triggers a transition once; sustained overlap does not manufacture repeated impacts. Detection is discrete per tick, not continuous swept collision detection.

Line zero drives the open/closed polarity used by the existing particle mechanics on the next tick, closing the word-to-motion feedback loop. Direct open/closed edits are disabled while contact-only six-bit mode is enabled. Density chooses a lossless representation tier with hysteresis. Proximity creates connections; distance and density determine bounded signal speed. State affinity, local changes and decay adjust routing strengths. Separation prunes connections. Connections and recurrent tanh activations live in the event-sourced checkpoint, including contact debounce state. These are adaptive structural rules, not proof that collisions alone learn semantics. Readout MSE tests do not satisfy the separate proposed criterion of statistically fewer execution steps on unfamiliar tasks.

## Training that uses the swarm

`core/visual-field.js` builds its hidden features from a measured snapshot of actual particle positions, words, activations and edges. Inputs are `[x,y,z,time]`; targets are normalized `[red,green,blue,alpha]`. Spatial radial features and graph message passing feed the learned RGBA readout. A local reconstruction-error delta rule trains the readout weights. It does not train hidden geometry, recover camera poses, infer depth, or implement a text-conditioned image model.

The topology snapshot is retained with each trained model so later swarm movement does not silently corrupt its coordinate interpretation. The live swarm continues evolving independently. Learning topology changes and preserving learned behavior across those changes remain additional work.

One fifth of unique input coordinates are withheld before fitting; duplicate coordinates are rejected. Metrics compare the initial readout, trained floating-point weights and quantized weights. The INT8 candidate is accepted only when validation MSE degradation is within the configured tolerance. A separate normalized RGBA reconstruction-MSE gate (default 0.02) rejects poor fits with status `reconstruction-insufficient`. Neither gate certifies photorealism, depth accuracy or temporal consistency. A strict gate can reject the candidate, retain the floating weights and prevent serving it as an accepted quantized model.

Six-bit words specify logical state; this is separate from weight precision. `core/quantized-weights.js` stores signed INT8 weights as compact base64 with per-row scales. Inference reads these integer weights with JavaScript floating-point accumulation; it does not secretly serve a duplicate floating-point matrix. Training uses floating-point weights. The event history still includes training states for replay, so INT8 parameter savings are not a claim about total checkpoint RAM. No JIT/code generation is introduced, and no acceleration or battery claim has been measured.

Jobs are scheduled in slices of 256 sample updates per existing simulation tick. Observations are recorded once, rather than copied into every training event. The tested default photo workload of 4,096 observations × 40 epochs completed in 512 ticks with an approximately 11 MB checkpoint. Existing execution/event/storage budgets still apply to jobs, and long jobs may require further scheduler/checkpoint engineering.

## Using the APK

On an upgraded checkpoint, select **Runtime → Enable six-bit swarm** if needed. On a new world it is enabled by default. Under **Learn**, choose **Learn from a photo**, or import a JSON training job. The photo adapter samples up to 4,096 RGBA observations, retains the sampled aspect ratio, and reports held-out error. This sampling and the current model capacity are not full-resolution photographic reconstruction. The original file is not overwritten. EXIF orientation handling is not yet qualified.

Example training-job shape:

```json
{
  "epochs": 120,
  "rate": 0.04,
  "maxQuantizationMse": 0.002,
  "samples": [
    {"point": [-1, -1, 0, 0], "rgba": [0.2, 0.4, 0.7, 1]}
  ]
}
```

Supply at least eight distinct samples. The example shows the schema, not a sufficient training dataset. Jobs currently accept up to 4,096 observations; APK JSON imports must fit its IPC budget. Per-job bounds are scheduling/allocation controls, not a claim that the full visual system is complete at that scale.

After training is `ready`, **Generate image from learned field** evaluates the saved INT8 model. Enter width, height, z, time and optional x/y ranges; the result can be previewed and saved as PNG. An empty settings object uses the photo's sampled dimensions. These are coordinate slices, not recovered perspective cameras. Changing time evaluates the same trained field; tests cover time interpolation, not arbitrary motion synthesis.

## Full visual target still to implement and verify

- Persistent patch/scene representations that learn high-frequency photographic detail at useful resolution, with training data and measured held-out image quality.
- Camera/depth/geometry estimation, multi-view consistency, learned scene density/materials and perspective rendering for actual 3D reconstruction and novel views.
- Temporal motion representation, occlusion and identity consistency, video ingestion and encoded video output. A time coordinate and PNG frames alone do not constitute a video generator.
- Learning and validation across topology growth, splitting and merging, rather than only fitting a readout on a retained topology snapshot.
- Dataset-backed generation/conditioning and statistical tests across unfamiliar scenes, not merely synthetic color fields.

No pretrained photorealistic visual weights are bundled. The large Qwen model in the user's separate Adaptive APK is a coding model, not a replacement visual model. None of these tests justify calling the current model a general photorealistic image, scene or video generator.
