# Recovered Synthia local transport

`model.mjs` and `hands.mjs` are byte-for-byte copies from the user's Synthia Adaptive 0.5.4 APK, paths `assets/web/proactive/model.mjs` and `assets/web/proactive/hands.mjs`. Their source was recovered from Drive archive parts 012/013 and validated against the APK entries' ZIP CRCs. Originals remain unchanged. The source package is in the user's Drive folder `1lm-UoNJy9-bZQ6L_I4U7LqqSj_6whzry`.

Codex3 imports `LocalModel` through `core/local-model.js`. Embedded mode needs the original `SynthiaAndroid` host methods and `/api/local-model` route. Desktop preview can address an already running Ollama or llamafile engine on loopback; engine CORS must permit the page. No hosted provider or API key was added. The proposal wrapper passes only training examples; cluster capability checks and held-out execution remain authoritative.

No model weights or ARM64 binaries are copied to this repository. Live Android inference and desktop engine availability are not established by the controlled transport tests.
