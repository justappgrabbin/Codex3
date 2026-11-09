# Synthia Android

Native Android controls and a separate `:swarm` foreground service own the simulation. The service embeds Cash App QuickJS 0.9.2 and the existing portable Codex3 core. Android provides its Linux process sandbox; this is not a Linux distribution container. No Docker, Termux, external server, account or paid API is needed. The optional WebView only observes the existing 3D world.

Start or pause from Runtime. A persistent notification offers Pause while running. Home and closing the observer do not pause the clock. Android force-stop, battery policies, device shutdown and storage limits can stop work. Checkpoints retain state and running intent; reopening restores them. Work has a 1,000-tick default budget and a 32MB checkpoint limit. This is a development APK, not an unlimited always-on daemon.

## Particle rules

Eight initial virtual particles expose open/closed bits, mass, position, velocity and measured qualities. Open=1 and closed=0 are explicit initial conventions. Initial black/white colors, interaction radius, impulse strength and the four `00/01/10/11` coefficients are editable under World rules. Positive coefficients attract; negative coefficients repel. Each interacting pair receives equal/opposite impulse, with acceleration depending on mass. This applies to pair mechanics; goals and learning are not claimed to obey Newtonian conservation.

Ordered groups of eight particle identities expose a byte. Values below 128 decode ASCII; other values remain numeric. This representation does not make ASCII a learned language. Initial state alternation and attraction/repulsion are editable examples, not an asserted interpretation of the user's final symbol system. Existing relationship learning and collective numerical tool discovery remain in the same core. General photorealistic image/video generation and arbitrary code synthesis are not implemented by these particle laws.

## Build

Install Node 22, Python 3, JDK 17+ and Android SDK platform 35/build-tools 35.0.0. Set `JAVA_HOME` and `ANDROID_SDK_ROOT`, then:

```sh
npm ci --prefix synthia-dual-swarm
python android/build.py
node --test android/tests/native-runtime.test.mjs
```

Output: `android/build/synthia-codex3-debug.apk` and `receipt.json`. QuickJS is fetched from Maven Central with a pinned SHA-256 check. The build bundles ARM64, ARMv7, x86 and x86_64 native libraries. Minimum Android 7/API24. Package `com.synthia.codex3` installs separately from `com.synthia.adaptive`; it does not contain the Adaptive APK's large Qwen model or reuse that app's signing identity. Debug signing is for development; stable release signing and device/store qualification remain necessary.

The optional `runtime/server.mjs` is a Node development adapter for the same core, not the APK's runtime or a deployment requirement. The Java `tests/NativeCoreTest.java` can additionally exercise the bundle with QuickJS JVM 0.9.2 and its host native dependencies.

QuickJS Android dependency: https://github.com/cashapp/quickjs-java (Apache-2.0); underlying QuickJS is MIT licensed. Existing scene assets and vendored components retain their original provenance.
