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
