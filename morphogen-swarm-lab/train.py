"""Train the five-input adaptation of Badalov's distributed formation GNN."""
import argparse
import json
from pathlib import Path
import subprocess

import numpy as np

ROOT = Path(__file__).resolve().parent
RADII = (1.2, 1.6, 2.5)
SEEDS = (1, 2, 3)
WIDTHS = (5, 16, 16, 16, 64, 10)
DROPOUT = (.3, .3, .3, .5, 0)
LEARNING_RATE = .001
WEIGHT_DECAY = .0005


def prepare(records):
    features = np.zeros((len(records), 7, 5), dtype=np.float32)
    adjacency = np.broadcast_to(np.eye(7, dtype=np.float32), (len(records), 7, 7)).copy()
    valid = np.zeros((len(records), 7), dtype=bool)
    labels = np.empty(len(records), dtype=int)
    for index, record in enumerate(records):
        count = len(record["features"])
        features[index, :count] = record["features"]
        valid[index, :count] = True
        labels[index] = record["label"]
        for a, b in record["edges"]:
            adjacency[index, a, b] = adjacency[index, b, a] = 1
    mean = adjacency / adjacency.sum(axis=-1, keepdims=True)
    return features, mean, np.linalg.matrix_power(mean, 5), valid, labels


def forward(features, mean, gossip, model, random=None):
    cache = []
    rows = features
    for i, ((weights, bias), dropout) in enumerate(zip(model, DROPOUT)):
        mixing = mean if i < 3 else gossip if i == 3 else None
        incoming = mixing @ rows if mixing is not None else rows
        raw = incoming @ weights + bias
        derivative = None
        rows = raw
        if i < 4:
            derivative = (raw > 0).astype(np.float32)
            if random is not None:
                derivative *= (random.random(raw.shape, dtype=np.float32) >= dropout) / (1 - dropout)
            rows = raw * derivative
        cache.append((incoming, derivative, mixing))
    return rows, cache


def objective(logits, valid, labels):
    scores = logits - logits.max(axis=-1, keepdims=True)
    exponent = np.exp(scores)
    normalizer = exponent.sum(axis=-1, keepdims=True)
    targets = labels[:, None, None]
    correct_scores = np.take_along_axis(scores, targets, axis=-1).squeeze(-1)
    loss = ((np.log(normalizer[..., 0]) - correct_scores) * valid).sum() / valid.sum()
    gradient = exponent / normalizer
    np.put_along_axis(gradient, targets, np.take_along_axis(gradient, targets, axis=-1) - 1, axis=-1)
    gradient *= valid[..., None] / valid.sum()
    return float(loss), gradient


def backwards(gradient, cache, model):
    derivatives = []
    for (incoming, activation, mixing), (weights, _) in zip(reversed(cache), reversed(model)):
        if activation is not None:
            gradient *= activation
        derivatives.append((
            incoming.reshape(-1, incoming.shape[-1]).T @ gradient.reshape(-1, gradient.shape[-1]),
            gradient.sum(axis=(0, 1)),
        ))
        gradient = gradient @ weights.T
        if mixing is not None:
            gradient = mixing.transpose(0, 2, 1) @ gradient
    return reversed(derivatives)


def evaluate(data, indices, model):
    features, mean, gossip, valid, labels = (array[indices] for array in data)
    logits, _ = forward(features, mean, gossip, model)
    loss, _ = objective(logits, valid, labels)
    predictions = logits.argmax(axis=-1)
    correct = predictions == labels[:, None]
    unanimous = np.all((predictions == predictions[:, :1]) | ~valid, axis=1)
    confusion = np.zeros((10, 11), dtype=int)
    np.add.at(confusion, (labels, np.where(unanimous, predictions[:, 0], 10)), 1)
    return {
        "loss": loss,
        "robotAccuracy": float(correct[valid].mean()),
        "swarmAccuracy": float(np.all(correct | ~valid, axis=1).mean()),
        "confusion": confusion.tolist(),
    }


def train(data, training, test, seed, epochs):
    random = np.random.default_rng(seed)
    model = [(random.uniform(-1 / np.sqrt(a), 1 / np.sqrt(a), (a, b)).astype(np.float32),
              random.uniform(-1 / np.sqrt(a), 1 / np.sqrt(a), b).astype(np.float32))
             for a, b in zip(WIDTHS, WIDTHS[1:])]
    moments = [[(np.zeros_like(p), np.zeros_like(p)) for p in layer] for layer in model]
    iteration = 0
    history = []
    for epoch in range(1, epochs + 1):
        order = random.permutation(training)
        for batch in range(0, len(order), 32):
            indices = order[batch:batch+32]
            features, mean, gossip, valid, labels = (array[indices] for array in data)
            logits, cache = forward(features, mean, gossip, model, random)
            _, gradient = objective(logits, valid, labels)
            iteration += 1
            for layer, derivatives, state in zip(model, backwards(gradient, cache, model), moments):
                for parameter, derivative, (first, second) in zip(layer, derivatives, state):
                    derivative = derivative + WEIGHT_DECAY * parameter
                    first *= .9
                    first += .1 * derivative
                    second *= .999
                    second += .001 * derivative ** 2
                    parameter -= LEARNING_RATE * (first / (1 - .9 ** iteration)) / (
                        np.sqrt(second / (1 - .999 ** iteration)) + 1e-8)
        measurement = evaluate(data, training, model)
        del measurement["confusion"]
        history.append(measurement)
    layers = [{"weights": weights.tolist(), "bias": bias.tolist()} for weights, bias in model]
    return layers, {"seed": seed, "epochs": history, "test": evaluate(data, test, model)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--epochs", type=int, default=300)
    parser.add_argument("--output", type=Path, default=ROOT / "trained-models.js")
    parser.add_argument("--metrics", type=Path, default=ROOT / "evaluation.json")
    args = parser.parse_args()
    raw = json.loads(subprocess.check_output(["node", ROOT / "dataset.cjs"]))
    models = {}
    metrics = {}
    for radius, records in zip(RADII, raw):
        data = prepare(records)
        groups = np.random.default_rng(712).permuted(np.arange(1200).reshape(10, 120), axis=1)
        training, test = groups[:, :96].ravel(), groups[:, 96:].ravel()
        runs = []
        for seed in SEEDS:
            layers, run = train(data, training, test, seed, args.epochs)
            runs.append(run)
            if seed == SEEDS[0]:
                models[radius] = layers
            print(f"r={radius} seed={seed} test swarm accuracy={run['test']['swarmAccuracy']:.2%}", flush=True)
        accuracies = [run["test"]["swarmAccuracy"] for run in runs]
        metrics[radius] = {
            "meanSwarmAccuracy": float(np.mean(accuracies)),
            "sdSwarmAccuracy": float(np.std(accuracies, ddof=1)),
            "confusion": np.sum([run["test"]["confusion"] for run in runs], axis=0).tolist(),
            "runs": runs,
        }
    args.output.write_text("const trainedModels = " + json.dumps(models, separators=(",", ":")) + ";\n")
    args.metrics.write_text(json.dumps(metrics, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    main()
