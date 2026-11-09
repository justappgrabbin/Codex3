# ATO-Core — provenance

Copied unchanged (byte-identical, verified with diff -r) from Alexis's original archive `02-synthia-core-v1.0.0.zip` (md5 95d35ede4bd5876e9290f97ac38cad0c), path `home/claude/synthia-core/ato-core/`. 19 copies of that zip on the box are identical; it ships inside her Drive builds under `authorities/originals/`.

Nothing in this folder was edited. Original tests: `npm run test:ato-core` (79 tests).

The swarm uses only `src/boolean-ato.mjs` (via `core/ato-boolean.js`). Gate/address/Human Design data in this package is NOT wired.

## sha256 of copied files
```
38ef918305fc32aa92eecfba2647cc0824ddfd04276f5d0f08e0c387b3eff2c4  ./README.md
a4d5237d820e9b5d754f531e348394af2e6b8b0e7f5196a5fd38f2bead372219  ./src/activation.mjs
112504b2174240ab545fdab7243d62e60b7c9477f39a406919bd443dc9eee1dd  ./src/address-space.mjs
91b2c1574637996244de42c1d9229425bcc2f24467599b54581a8a713e3b275c  ./src/anomata.mjs
8b0d99de273beb5345b1a9166470860ff1959c09fb5ebb4c82d956692e64fee8  ./src/association.mjs
6bea009b52bbad0d6ae37c38e0218aac3b226c47f74e37c11fa8995a5a34bdb5  ./src/automaton.mjs
ddbbbe767d2b0cd7056ec31d72a515db38d2c18e66f02d48b811f989bb918bc8  ./src/autonomy.mjs
ac47508bf355be809dfb3ce87eaa463527371f70da9ba9f410aefe3500d567e4  ./src/boolean-ato.mjs
300881f8fb0ebaa316c2ba6fbd4c2fb9c8be720a4b3a4ca008c041e690d5863b  ./src/bootstrap.mjs
adb66eebd7cb3948f94bfd07f833ddb1833d37a9d232e659616da0cdb31c5dff  ./src/browser-form.mjs
a0559685a2ce475d959a09487f643e6096284cd323dc15915e52c4344b12e21f  ./src/companion.mjs
7b4034dda1e301061a1aaf844cc25a9d4d96a0d98ba1dba40c02abf36a567d1c  ./src/computational-grammar-coder.mjs
ec857e0ded2a8cab8cbd4d823057278eca080a2d30be6c6c4981da1309bb4e1c  ./src/emergence.mjs
c13d3e706216c1729adbcd562ff7f8ad4e47f1b617e6d452626ce1ab2b337f94  ./src/entry.mjs
d7ba0a85e25c1397514d56ede6dcf491b540d234fc31523bf18eb69987eedfe8  ./src/expression.mjs
37b06bf5ff2c4a13e70da1a50ae3c5f82921f4a08e90b31f7b0367c6a8fac7a7  ./src/families.mjs
a911a836dd0c30033ed7325738b33a5f9aa81627a8d72675cec253a652c1c968  ./src/gate-address.mjs
dd24ad3aa87e8fedbc2ae3e47348e7cabdd7bf05d870e93d5f7c7d5b73b4e67b  ./src/gate-data.mjs
1f26522f86e31468f3906bd565b73f4531dc73da67dffd570bc254d4a1a000ef  ./src/generative-emergence.mjs
6b2622d4cf9274fc209fdf4dca24654cbd7ee82c3af611dcd553c1be06f2f115  ./src/host.mjs
73c064adf78e19846db838de219fb34a287955dc76009461a93c2eae25777a2b  ./src/iching.mjs
e66e207f3b85ee14d632e5a35d2a1f202e4390c707895c1963211f8f2bcc1baf  ./src/index.mjs
400e14cdf3da42936ba4ba80396fda405c3113f6bc4133dddb478a54bc0a3c20  ./src/interpretations.mjs
74ff6042b7933cc174dce1bbeab9a061db75a66e2e149eb40e62b871943bf245  ./src/king-wen.mjs
58d2030f5e2afddac16d519c04349318732dcaabb3f3c34578ef9a56475102ca  ./src/klein-iching.mjs
415b32db25d3d59b031beebe17967dab5af177f9704d4d88c8cc5fd7fcaaab3e  ./src/klein-tools.mjs
743897c2e608bc3dda5e78bd6b292877643ecb338244ff7c57c099040c0b8340  ./src/media-renderers.mjs
ceec86cc83a1ca5ff5a32391130115fbd38310e8c2023fc11ec25eb2adefbef4  ./src/organism.mjs
86870caaef06276d2631ab8c726787533ad081e1d73d076aa7531de8c629bf83  ./src/promotion.mjs
52f2aa13a35e7595f3bb618aa6faab0ba7a6a67bb8a95e3d6c97be2d70e560a2  ./src/quality-transfer.mjs
ba99546d93ffa200e19570ee4e3ac2745b5772d4dc43416b35f2f6fd545c4be8  ./src/research-browser.mjs
342cfb68912a3e2af02501d1571f7d947da7fac008bbaffe8620cf5201992b23  ./src/shell-bridge.mjs
b3064f06c724b21a1fbdede3a991abcdda5d8d1d098b52ba7891ea165ca7de68  ./src/state-space-kernel.mjs
ea77603b6ea8c28a1974cc50a1c3c0cca62c61bb68c7fe1f5fb00d682a1f7aff  ./src/success.mjs
0dd7001f52a394178856ac4b904ae77b3e160de59e3affcfddcf87ba7dd2573f  ./src/tray.mjs
025100b083d0f06e774d1111b730718c925a573b196b25c2c09f08ac222605f6  ./src/workspace.mjs
8ae56bd6b7ec37cf8a801079a4ee41d734fd11b96b7ae285f9b9bbc6e929b2a3  ./test/activation.test.mjs
90da32196b1a6152de27b4e2bd69f3a172ffe23132a785e6159f0216e019d608  ./test/ato.test.mjs
8cc83bb2169ed54648b03e13be92f18d38f8f559eda6c84cf3ae99be018a9d63  ./test/autonomy.test.mjs
a7249e6b4f3072dd5e86ea2a3932d771b83fa861cccc10d5619e46dd2d32a187  ./test/bootstrap.test.mjs
13b0360df790179909ced71ddea417ab9e15b35788221c50a538d22cd64ffab8  ./test/browser-research-interpretation.test.mjs
88f72a498a26a028e51c99e6fd813432b0a881dedaf610e14c9e5526ecb4427d  ./test/companion.test.mjs
09df08a976be9f35e41603858828351fdb1592a563495a83b40fe4ebfa7817f2  ./test/computational-grammar-coder.test.mjs
547b8bc45e7724656bcc9a02738d1e5d0c35a2fe7110511b92b44f8050332db5  ./test/emergence-promotion.test.mjs
618e39779d34d88917fcae167f2773a248fb010861b0659726fce83dfd604883  ./test/families.test.mjs
28cdfa21fe8c962f47d1d5e9b0967eae08cf92aba69c193f08acd78a1221e231  ./test/gate-address.test.mjs
d3244eba4c1df699b886142fce70b484f581f7810f0b51f05b6a7ff9f908e9d4  ./test/generative-expression.test.mjs
41037dce43c6b8de98782694ecee08fed44b03bb2dd6c13c4ef2f49df7efc18f  ./test/host.test.mjs
0105f91cbd40d957b4733189b8d9deb81352b55c010a1419f621751d0c6af9cf  ./test/klein-iching.test.mjs
40471eee357f9cc2b1320168cd6c74c8fdaf2a4c7cae150c5b41d5e4fe08d4c9  ./test/klein-tools.test.mjs
592ac5b21621e31d12db5fa5885d7d4ed7f55461264dd99534e333054b261705  ./test/organism.test.mjs
e9db6fcc5efa437e9af13ee628eda13215a7340f4889ca828e8a4e9434e83ed1  ./test/quality-transfer.test.mjs
4f16fc763739cb2024be95f514621906e8ceb1e91af6308d71220a41890677d1  ./test/source-mechanisms.test.mjs
58ee7c1ca719ba6ddc42aedb5668cbef8c45a3403266afa51dbb3c09a8d21757  ./test/success-tray.test.mjs
7c312ae2d06514798e1663c529e3bd4f59883fa6f40108857a6e7669ed12ec2b  ./test/torture-mesh.test.mjs
7d02a800e5f073031ff85cc961ea3228b9fe07102d5ba324859be97fde5413e9  ./test/workspace.test.mjs
```
