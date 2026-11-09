# Verification — 2026-11-09

- 46 existing substrate, autonomy and production tests pass.
- Five particle tests pass: four pair states with unequal masses conserve momentum; configurable force/proximity; ordered ASCII decoding; checkpoint continuity; full 3D cluster separation.
- Two Node adapter persistence/transaction tests pass.
- Bundled native dispatcher test passes for pause/tick, checkpoint restore, command deduplication and invalid-command rollback.
- Actual QuickJS JVM 0.9.2 ran the bundled native engine, advanced the field, restored a checkpoint and learned a collective numerical function from samples. This caught and resolved an unsupported Array.at call before delivery.
- APK compiles, aligns native libraries, and passes Android apksigner verification.
- Android API30 x86_64 software emulator installed and launched the native APK. Runtime controls loaded, with a distinct `com.synthia.codex3:swarm` service process. Start followed by Home produced saved tick 1 and then tick 4 with running=true. Force-stop and reopen restored tick 14 and running=true. Force-stop itself does not keep work running.
- Emulator System UI experienced ANRs during software-only boot; this is not physical-device performance validation. No physical ARM device, Android35 runtime, Play Store qualification or signed release validation was performed. Optional 3D observer and full visual generation are not qualified by these background-service checks.

The final build receipt records the APK/runtime hashes. CI repeats core, dispatcher and APK build checks; CI emulator tests are not configured. The checked-in APK build uses a development signing key and installs as a separate app from Synthia Adaptive.

Representation update: four additional tests verify ASCII/NATO agreement, multibyte UTF-8 and supplementary Unicode round trips, bounded transliteration with explicit unmapped characters, and rejection of malformed UTF-8/surrogates. The native dispatcher and actual QuickJS JVM also verify Unicode conversion. The APK was rebuilt and signature verification passed. The new conversion dialog has not been manually exercised on a device.

## 0.4.0 — six-bit swarm and INT8 visual readout

69 automated tests pass (the previous 58 plus five six-bit and six visual/quantization tests). All 64 words survive all nine tier conversions; malformed fragments fail explicitly. Tests cover contact-only simultaneous XOR updates, overlap debounce, distance-based routing/pruning, topology restoration, actual reconstruction-error training, INT8 prediction/storage, quantization rejection, poor-reconstruction rejection and time-conditioned generated samples.

The native dispatcher test and actual QuickJS JVM execute visual training and frame generation. A 4,096-observation, 40-epoch job also completed through the existing swarm clock in 512 ticks with 23,083 events and an approximately 11 MB checkpoint. This is a workload test, not a photographic quality claim. The tested gradient field's held-out MSE was approximately 0.000251 floating-point and 0.000270 INT8; the zero-tolerance compression gate correctly rejected that degradation.

The APK compiles, aligns, signs and verifies as version 0.4.0. The API30 emulator launches it and shows the new Learn controls. The original 0.3.x emulator background/persistence checks remain recorded above. Current visual evidence is synthetic coordinate/color data; photorealism, camera/depth reconstruction, general video generation, physical-device quality/performance and encoded video output remain unverified or unfinished. See the dedicated six-bit/visual architecture document for the exact implementation and gaps.

## 0.5.0 — physical fragments and Boolean vectors

78 automated tests pass: the previous 69 plus four physical-fragment tests and five Boolean-vector tests. New checks exhaust every word and tier conversion while preserving mass, center of mass, linear momentum and angular momentum (including recorded intrinsic spin). They verify independent fragment motion, contacts between fragments whose owner centers are outside the interaction radius, lossless live density-driven remeshing, deterministic replay, strict Boolean masks/XOR for all 4,096 word pairs, and initialization from legacy scalar-only checkpoints.

Visual-training tests now check that hidden nodes and edges reference physical fragment identities. The actual QuickJS JVM executes the bundled core, visual training, generation, checkpoint replay and physical Boolean-fragment assertions. The APK compiles and passes signature verification. The native graph and optional 3D observer render physical fragments. This release's visual controls/rendering have not been manually exercised on an Android device: no emulator was running after the environment restart. Earlier emulator checks are historical evidence for prior releases, not a claim of device qualification for 0.5.0.

The same 4,096-observation/40-epoch workload also completed with the new physical Boolean representation: 512 ticks, 24 fragment bodies, 23,083 events, a ready quantized model, and a 17,102,269-byte checkpoint. This confirms workload continuity, not photorealistic reconstruction quality.
