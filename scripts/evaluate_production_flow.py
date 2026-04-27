#!/usr/bin/env python3
"""Evaluate production pipeline: snippets -> classifier -> gates."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
import sys
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.services.bert_classifier import get_classifier
from backend.services.evidence_gates import should_emit_finding
from backend.services.text_evidence import extract_evidence_snippets

SUPPORTED_CLASSES = {"forced_continuity", "false_urgency", "fear_based_threat", "benign"}


def _load_samples(path: Path | None) -> list[dict[str, Any]]:
    if path is None:
        return [
            {"text": "Your trial renews monthly unless you cancel before billing date.", "label": "forced_continuity"},
            {"text": "Offer expires tonight. Only 2 seats left.", "label": "false_urgency"},
            {"text": "Your account will be suspended unless you verify now.", "label": "fear_based_threat"},
            {"text": "Browse products and resources for your team.", "label": "benign"},
            {"text": "Learn more about integrations and customer stories.", "label": "benign"},
        ]

    with open(path, encoding="utf-8") as handle:
        rows = [json.loads(line) for line in handle if line.strip()]
    for row in rows:
        label = str(row.get("label", "")).strip()
        if label not in SUPPORTED_CLASSES:
            raise ValueError(f"Unsupported label '{label}'. Expected one of {sorted(SUPPORTED_CLASSES)}")
        if not str(row.get("text", "")).strip():
            raise ValueError("Each row must contain non-empty 'text'")
    return rows


def _extract_single_event(text: str) -> list[str]:
    event = {"text": text, "flow_id": "eval", "flow_step": 0}
    snippets = extract_evidence_snippets(event)
    return [snippet.text for snippet in snippets] or [text]


def _predict_label(text: str) -> tuple[str, float, int]:
    classifier = get_classifier()
    snippets = _extract_single_event(text)
    predictions = classifier.predict_batch(snippets)
    emitted = [(label, conf) for snippet, (label, conf) in zip(snippets, predictions) if should_emit_finding(label, conf, snippet)]
    if not emitted:
        return "benign", 0.0, len(snippets)
    top_label, top_conf = max(emitted, key=lambda item: item[1])
    return top_label, top_conf, len(snippets)


def _metrics(samples: list[dict[str, Any]]) -> dict[str, Any]:
    labels = ["forced_continuity", "false_urgency", "fear_based_threat", "benign"]
    confusion = {label: Counter() for label in labels}
    snippet_counts: list[int] = []
    confidence_by_label: dict[str, list[float]] = defaultdict(list)

    for sample in samples:
        gold = sample["label"]
        pred, conf, snippet_count = _predict_label(sample["text"])
        confusion[gold][pred] += 1
        snippet_counts.append(snippet_count)
        if pred != "benign":
            confidence_by_label[pred].append(conf)

    per_class: dict[str, dict[str, float]] = {}
    for label in labels[:-1]:
        tp = confusion[label][label]
        fp = sum(confusion[other][label] for other in labels if other != label)
        fn = sum(confusion[label][other] for other in labels if other != label)
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
        per_class[label] = {"precision": precision, "recall": recall, "f1": f1, "support": sum(confusion[label].values())}

    total = len(samples)
    correct = sum(confusion[label][label] for label in labels)
    accuracy = correct / total if total else 0.0
    macro_f1 = sum(per_class[label]["f1"] for label in per_class) / len(per_class)
    benign_false_positives = sum(confusion["benign"][label] for label in labels if label != "benign")
    avg_snippets = sum(snippet_counts) / len(snippet_counts) if snippet_counts else 0.0

    return {
        "samples": total,
        "accuracy": accuracy,
        "macro_f1": macro_f1,
        "per_class": per_class,
        "confusion": {label: dict(confusion[label]) for label in labels},
        "benign_false_positives": benign_false_positives,
        "average_snippets_per_input": avg_snippets,
        "mean_raw_confidence_by_predicted_class": {
            label: (sum(values) / len(values) if values else 0.0)
            for label, values in confidence_by_label.items()
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate production classifier flow with snippet extraction and gates.")
    parser.add_argument("--samples", type=Path, default=None, help="Optional JSONL with fields: text, label")
    parser.add_argument("--output", type=Path, default=None, help="Optional path to save JSON metrics")
    args = parser.parse_args()

    samples = _load_samples(args.samples)
    metrics = _metrics(samples)
    print(json.dumps(metrics, indent=2))
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as handle:
            json.dump(metrics, handle, indent=2)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
