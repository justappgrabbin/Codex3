"""Render training curves, test accuracy, and confusion matrices."""
import json
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
import numpy as np

ROOT = Path(__file__).resolve().parent
CLASSES = ["Triangle", "Square", "Pentagon", "Hexagon", "Star", "Y-Shape",
           "Plus", "Kite", "Binary-Tree", "Hourglass"]
metrics = json.loads((ROOT / "evaluation.json").read_text())

with PdfPages(ROOT / "evaluation.pdf") as pdf:
    figure, axes = plt.subplots(3, 1, figsize=(8.5, 10), sharex=True, layout="constrained")
    figure.suptitle("Training dynamics · Five-dimensional swarm recognition")
    for axis, key, name in zip(axes, ("loss", "robotAccuracy", "swarmAccuracy"),
                               ("Negative log-likelihood", "Per-robot accuracy (%)", "Swarm accuracy (%)")):
        for radius, result in metrics.items():
            values = np.array([[epoch[key] for epoch in run["epochs"]] for run in result["runs"]])
            if key != "loss":
                values *= 100
            mean, sd = values.mean(axis=0), values.std(axis=0, ddof=1)
            epochs = np.arange(1, len(mean) + 1)
            line, = axis.plot(epochs, mean, label=f"r = {radius}")
            axis.fill_between(epochs, mean - sd, mean + sd, color=line.get_color(), alpha=.15)
        axis.set_ylabel(name)
        axis.grid(alpha=.24)
    axes[0].legend(title="Mean ± 1 SD across 3 seeds")
    axes[-1].set_xlabel("Epoch")
    pdf.savefig(figure)
    plt.close(figure)

    figure, axis = plt.subplots(figsize=(8.5, 5), layout="constrained")
    axis.bar(list(metrics), [100*m["meanSwarmAccuracy"] for m in metrics.values()],
             yerr=[100*m["sdSwarmAccuracy"] for m in metrics.values()], capsize=6, color="#6344b5")
    axis.set(title="Held-out swarm accuracy · Mean ± 1 SD across 3 seeds",
             xlabel="Communication radius", ylabel="All robots predict the true class (%)", ylim=(0, 100))
    axis.grid(axis="y", alpha=.24)
    pdf.savefig(figure)
    plt.close(figure)

    for radius, result in metrics.items():
        figure, axis = plt.subplots(figsize=(8.5, 7), layout="constrained")
        counts = np.array(result["confusion"])
        image = axis.imshow(counts, cmap="Purples", vmin=0, vmax=72)
        for (row, column), value in np.ndenumerate(counts):
            if value:
                axis.text(column, row, str(value), ha="center", va="center",
                          color="white" if value > 42 else "#231539")
        axis.set(title=f"r = {radius} · Held-out counts across 3 seeds",
                 xlabel="Unanimous prediction", ylabel="True class")
        axis.set_xticks(range(11), CLASSES + ["Disagreement"], rotation=45, ha="right")
        axis.set_yticks(range(10), CLASSES)
        figure.colorbar(image, ax=axis, label="Swarms")
        pdf.savefig(figure)
        plt.close(figure)
