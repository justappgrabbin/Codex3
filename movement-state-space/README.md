# Movement state space — source-first implementation

This is a standalone, additive JavaScript ES module. It does not overwrite Codex3's swarm, existing dimensional frames, models, or assets.

## Source

User-supplied screenshot of *The Crystals and the Monopole*, printed page 5 / PDF page 9.

- Magnetic Monopole — The Attractor; Your Uniqueness; G Center
- Perspective: **Individuality**
- Dimension: **Movement**, spatial direction **bottom → upward**
- Author's textual sequence: **Movement is Energy. Energy is Creation. Creation is Seeing. Seeing is Landscape. Landscape is Environment.**
- Keynote: **I Create**

The word **is** is retained as the source connector. It is not automatically reinterpreted as equivalence, causation, or a computational operator. The order of the textual chain is not claimed to be a map of physical spatial positions. No other perspectives or correspondences are inferred.

## Run

From the repository root (Node.js with ES module support):

```sh
node --test movement-state-space/movement.test.mjs
```

Example:

```js
import {MovementStateSpace} from "./movement-state-space/movement.js";
const movement=new MovementStateSpace();
const a=movement.observe({subject:"observer",expression:"I create",context:"first observation"});
console.log(movement.inspect(),a);
const snapshot=movement.export();
```

## What this implements

- Fixed source vocabulary and explicit direction
- Five source word-to-word links, without invented semantic operators
- Explicit observations with perspective, context, origin, optional qualities and event history
- Structural comparison that does **not** pretend to understand expression
- JSON-safe snapshots with source validation and deterministic replay

## Deliberately unresolved

- Corresponding words in other perspectives
- Meaning of the author's use of **is** as a mathematical operation
- Exact placement of terms in the spatial state space
- Klein tool adapter and tests against actual Klein implementations
- Learned neural representations, autonomous reasoning, generation, or other dimensions

These are not silently implemented with arbitrary assumptions. The next step is to review each Movement perspective and its corresponding terms with the user and actual Klein tool implementation.

No repository-wide test execution has been confirmed by this commit.
