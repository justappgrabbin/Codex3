# Morphogen Swarm Lab

Open [index.html](index.html) in a browser. The app runs locally and uses the trained weights bundled beside it. Use **Test shapes** to seed one of the ten thesis formations. Pause the simulation before choosing a shape to inspect it at rest. Drag an agent or resume the simulation to see how the local features respond to changes in the formation. The radius slider switches between the three separately trained models.

## Five-dimensional feedback

Every agent computes four binary features from its local observations: at least two peers, a closed triangle, a distinct peer reachable in two hops, and agreement in movement direction with a majority of direct peers. The fifth input is a weighted sum of products of these bits. Each agent also applies five rounds of local averaging to that scalar to control separation and tangential motion. The resulting motion changes what agents sense on the next step. The positions rendered on the canvas belong to the simulator. The recognition model consumes only local features and messages. Adjusting the rule switches intentionally changes the live input relative to the all-rules-enabled training data.

## Recognition and evaluation

Each model takes the same five inputs and applies three shared mean-aggregation graph convolution layers of width 16 with ReLU and dropout of 0.3. Five rounds of neighbor-and-self averaging follow. Each robot applies the shared 16 → 64 → 10 classifier, with ReLU and dropout of 0.5 on the hidden layer during training. The runtime uses the highest logit as its local class prediction. There is no swarm-level voting in inference.

For each radius (1.2, 1.6, 2.5), the dataset generator accepts 120 connected samples per class with scale drawn uniformly from [0.75, 1.25] and independent Gaussian position noise with standard deviation 0.06 in each coordinate. It uses a stratified 96/24 train/test split per class. Training uses 300 epochs, batches of 32 graphs, per-robot negative log-likelihood, and Adam with learning rate 0.001 and weight decay 0.0005. Each radius is trained independently for three initialization seeds on a fixed split. The browser loads seed 1 for each radius.

The metric follows thesis §2.3 and §6.2. A held-out swarm is correct only when every robot predicts its true class. This resolves the conflicting mention of majority vote in §4.3. The confusion matrices use the ten class labels in the order shown in the app plus an eleventh column for swarms whose robots disagree. Training loss and both training accuracies are recorded per epoch in [evaluation.json](evaluation.json).

The original coordinates and source code were absent from the supplied thesis text. The canonical layouts are reconstructed from its descriptions. Training samples are stationary, so the alignment feature is zero on this benchmark. The results measure the requested five-dimensional representation on the reconstructed data.

To rerun the evaluation and regenerate the browser weights, use Node.js and Python with NumPy:

```sh
OPENBLAS_NUM_THREADS=1 python3 train.py
```

## Results

| Radius | Held-out swarm accuracy, mean ± sample SD |
| --- | ---: |
| 1.2 | 64.72% ± 0.48 percentage points |
| 1.6 | 53.33% ± 4.58 percentage points |
| 2.5 | 21.11% ± 1.92 percentage points |

The [evaluation report](evaluation.pdf) contains the training curves, accuracy comparison, and confusion matrices. To regenerate the PDF from the JSON metrics, run `python3 plot_evaluation.py` with Matplotlib installed.

## Live file overlays

Open an HTML, text, or Markdown file in **Live file workspace**, or use **Try a sample**. Mark an HTML gap with `data-swarm-gap="Description"`, optionally supplying `data-swarm-draft="Preview text"`. For text, use `TODO: Description` or `TODO: Description => Preview text` on its own line. Edit active gap drafts with the fields below the overlay controls.

Each enabled overlay has a position on the swarm canvas. Nearby agents compete for one assignment each based on distance, local fifth value, neighbor activity, and whether the agent already holds the task. Assigned agents steer toward the task. Their changing positions feed back into subsequent assignments. When a task gains or loses its agent, the corresponding patch appears in or disappears from the preview.

The preview runs in an isolated iframe and supports static HTML structure, inline styling, and text. Uploaded scripts and external resources are excluded. Theme, motion, layout, and text drafts are session changes applied to the preview. Arbitrary application repair and automatic prose generation are outside this version.
