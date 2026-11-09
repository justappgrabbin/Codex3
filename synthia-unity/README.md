# Synthia Unity project

Open this directory in Unity Hub using Unity 2022.3 LTS, open `Assets/Scenes/SynthiaWorld.unity`, allow the models to import, then press Play. `Synthia → Prepare real character controllers` can rebuild the generated animation controllers.

Included: actual FBX human mesh with 44-bone skeleton, local skin binding and authored idle/walk clips; the supplied Unity wolf mesh, original skeleton/animation assets and textures; a runtime that registers bodies and interface objects in one relation graph; per-object surface particle morphing; nested qualitative frames containing all five dimensions; imported locally trained assembly-controller weights; retained event records.

The UI is generated object by object and registered in the same native kernel. Named qualities come from the source page and its human-expression table, rather than five scalar labels. A finite frame path resolves recursively without preallocating an infinite tree.

This is a Unity project package, not an editor-verified player build. Unity is not installed in the execution environment, so compilation, model-import compatibility, animation-controller behavior and visual results must be verified in the Unity Editor. The browser runtime has separate automated verification. Do not mistake that browser evidence for a Unity test.

The C# runtime is a native integration scaffold, not full parity with the JavaScript research core: it imports a trained local controller rather than training in Unity, and does not yet replay the complete JavaScript event stream. It does not run image reconstruction, UniRig inference, CharacterGen or WorldGen. The source archives do not include all necessary model checkpoints.

The human is adapted from the supplied UniRig `examples/skeleton/tira.fbx`. That file contains a mesh and skeleton but no skin weights. Nearest-bone weights and the clips were authored locally; they are not represented as pretrained UniRig output. The wolf comes from the supplied Unity project's `Assets/Palette/Wolf` files. Original archives were left unchanged.
