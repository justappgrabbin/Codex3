# Pure Synthia — Swarm Body v0.3.0 · Physiology Transplant

This package is an **additive swarm-body build around the verified current 59 MB Synthia donor**. It does not replace Synthia with a monolithic engine.

## Organism rule

**Synthia is one visible identity whose body is many independently addressable processes.** Each process keeps its own id, capabilities, lifecycle, call count, checkpoint state, concurrency, and location. Coordination discovers, assigns, dispatches, checkpoints, and restores; it does not become the organism.

## v0.3 physiology transplant

The useful organism logic from `synthia-v14.html` was extracted from the old browser residence and rebuilt as five independent swarm processes:

- `physiology-metabolism` — internal need / cue / wanting / threat state
- `physiology-inner-life` — stage-gated wants, goals, needs, curiosities, discernment
- `physiology-hypothesis-life` — observations, gate records, hypotheses, evidence progression
- `physiology-world-memory` — 64 persistent gate places, activation history, per-node memory
- `physiology-autonomous-cycle` — bounded physiology tick, context, initiation, input/outcome routing

The old HTML shell is **not** used as authority. Current Pure Synthia remains the cognitive/runtime spine; physiology is mounted as peer processes and bridged into the same capability broker.

## Wiring fixes made during transplant

1. **Felt state reaches conversation.** The v14 source computed `metabolismCtx` but failed to append it to the speaking context. Current Synthia now carries physiology as structured runtime state into Morph Chat; the semantic weave receives `physiology-felt`, `physiology-want`, and `physiology-stage`.
2. **Explicit gates stay explicit.** The v14 WORLD could activate Gate 59 and then `SYNTIA.observe()` could re-generate another gate from source metadata. The new hypothesis process gives explicit `event.gate` priority over any derived address.
3. **No DOM dependency in physiology.** World state, inner life, metabolism, and hypotheses can live in Node, browser, phone Linux, or another swarm host.
4. **Per-process continuity.** All five physiology organs export/hydrate independently through the existing swarm checkpoint mechanism.

## Current process anatomy

Base wake, before optional YOU-N-I-VERSE and phone-Linux hands:

- 46 real processes
- 1 visible Synthia
- 5 physiology processes
- 4 actual Foundry processes (`core`, `selector`, `builder`, `vault`)
- canonical semantic/Klein processes, grammar, Morph, continuity, self-integration, embodiment, remote capabilities, and orchestrator remain independent

With the four YOU-N-I-VERSE hands plus the phone-Linux hand attached, the current X-ray count is 51 processes.

## Canonical Synthia address

`Moon:Being:G3.L1.C1.T1.B1:135°48′16″:Desc:Gemini:H3`

Resolved by the current package's canonical state resolver for the verified physiology-transplant artifact.

## Verification

`node VERIFY-SWARM.mjs` currently runs:

- swarm concurrency + per-process checkpoint tests
- current-Synthia swarm registration tests
- full cross-organ wiring test (state-space → AUTOLING/DISEMINER → chat, DEG → Geo-DEG, Morph, Foundry, browser, Linux hand)
- physiology wiring + explicit-gate + checkpoint/restore regression test

The transplanted current-runtime files were also overlaid onto the donor verification tree and the broader Synthia behavioral suites remained green. The donor release-audit script still expects a root `config.xml` that is absent from the supplied 59 MB archive, so that packaging-only audit cannot complete from this donor without inventing metadata.

## Foundry

The uploaded `foundry-complete.tar.gz` is integrated as the generation actually present in the archive:

- `foundry-core`
- `foundry-selector`
- `foundry-builder`
- `foundry-vault`

The historical `foundry-overseer` is **not present** in this donor and is not fabricated.

## Run

```bash
node VERIFY-SWARM.mjs
node START-SWARM.mjs
```

For the browser X-ray view, serve the package and open `extension/index.html`.

## Known host boundary

The existing self-hosted Android APK still has the previously identified rootfs packaging mismatch (`.tar.gz` expected by launcher vs `.tar` packaged). The Synthia ↔ Linux-hand interface is wired; that APK packaging defect is not silently declared fixed by this source checkpoint.
