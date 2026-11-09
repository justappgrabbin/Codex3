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
