# Additional source intake

All supplied archives were downloaded and inventoried. Inventory is not a claim that every implementation is integrated or verified. No archived executables, install scripts, or generated assistant instructions were run. FBX models were inspected and converted using Blender.

| Archive | Entries | Direct 3D/scene assets |
| --- | ---: | ---: |
| Unity-project.zip | 727 | 4 |
| YOU-N-I-VERSE_GameUnit_Integration_Patch-2.zip | 7 | 0 |
| CharacterGen-main.zip | 149 | 0 |
| casual-character-chat-blueprint-main.zip | 29 | 0 |
| consciousness-unity-bridge.zip | 13 | 0 |
| WorldGen-main.zip | 34 | 0 |
| morphing-particle-swarm-main.zip | 5 | 1 |
| CodeSculptor.zip | 1655 | 0 |
| humanagent.zip | 60 | 0 |
| Animation.zip | 31 | 0 |
| yi-jing-agent-main.zip | 70 | 0 |
| SYNTHIA_MORPH_FORGE_REPAIRED_SOURCE-2.zip | 74 | 0 |
| GameAssetStudio (1).zip | 549 | 0 |
| SimUnity2-master.zip | 214 | 3 |
| CharacterEngine-master.zip | 161 | 1 |
| Dream-Swarm-System-v0.1.0.zip | 438 | 0 |
| klein-mesh-game-engine-v5.1-FIXED.zip | 46 | 0 |
| Kimi_Agent_Spacetime LLM with I Ching.zip | 91 | 0 |
| character.zip | 3 | 0 |
| agent.zip | 480 | 0 |
| Synthia-Morph-Reskin-v0.1.0-3.zip | 41 | 0 |
| Indiverse_Adaptive_Context_World_Source.zip | 9 | 0 |
| Synthia-v0.5.7-CANONICAL-MORPH-INTEGRATION-PATCH.zip | 90 | 0 |
| Synthia-Design-Dream-Seed-v0.1.0-source-1.zip | 16 | 0 |
| UniRig-main.zip | 176 | 8 |

## Directly useful findings

- Unity project: Unity 2018.3.0f2, wolf mesh, 66-bone skeleton, original animation actions and textures. Converted to GLB for the browser runtime; no claim of running the old Unity project in this environment.
- UniRig: its example GLBs are LFS pointers. The skeleton FBX files do contain real meshes and skeletons. The Tira humanoid has 25,145 vertices and 44 bones but no vertex groups/skin weights. The browser body is adapted from this actual mesh, with local nearest-bone skin binding and authored idle/walk cycles. These are not learned UniRig outputs.
- CharacterGen: source pipeline plus reference images/videos, not a ready-to-run set of weighted character meshes or pretrained model files.
- character.zip: Ready Player Me creator/viewer components, not an embedded saved human model.
- SimUnity2: old Sims 2 reimplementation scaffold; its README says skeleton import was unfinished and expects external Sims installation data. It is not a complete standalone character/world asset library.
- Animation.zip: animation/controller/sensor source, not a bundle of animated human bodies.
- Indiverse Adaptive Context World: recovered ConnectionNet backpropagation implementation is used for the local controller baseline. The new causal graph network adds topology compiled from qualified relations.
- WorldGen: source for a GPU/model-backed scene pipeline. Checkpoints/submodules are not in the archive; no claim that its generative pipeline is active in this local JavaScript build.
- Other Synthia/Morph/Forge/Dream archives: inventoried as historical sources; not silently merged into the new runtime.

The current build keeps the core local. External model training and GPU inference are separate future tasks; archives of model source are not substitutes for checkpoints and validated data.
