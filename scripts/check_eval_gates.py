#!/usr/bin/env python3
"""Fail when runtime evaluation metrics miss required gates."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

MIN_MACRO_F1 = 0.65
MIN_PRECISION = 0.70
MIN_RECALL = 0.60
MAX_BENIGN_FALSE_POSITIVES = 2
TRACKED_CLASSES = ("forced_continuity", "false_urgency", "fear_based_threat")


def _load_metrics(path: Path) -> dict:
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def _failures(metrics: dict) -> list[str]:
    failures: list[str] = []
    macro_f1 = float(metrics.get("macro_f1", 0.0))
    if macro_f1 < MIN_MACRO_F1:
        failures.append(f"macro_f1 {macro_f1:.4f} < {MIN_MACRO_F1:.2f}")

    per_class = metrics.get("per_class", {})
    for label in TRACKED_CLASSES:
        values = per_class.get(label) or {}
        precision = float(values.get("precision", 0.0))
        recall = float(values.get("recall", 0.0))
        if precision < MIN_PRECISION:
            failures.append(f"{label}.precision {precision:.4f} < {MIN_PRECISION:.2f}")
        if recall < MIN_RECALL:
            failures.append(f"{label}.recall {recall:.4f} < {MIN_RECALL:.2f}")

    benign_false_positives = int(metrics.get("benign_false_positives", 999999))
    if benign_false_positives > MAX_BENIGN_FALSE_POSITIVES:
        failures.append(
            f"benign_false_positives {benign_false_positives} > {MAX_BENIGN_FALSE_POSITIVES}"
        )
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate runtime eval metrics against promotion gates.")
    parser.add_argument(
        "--metrics",
        type=Path,
        default=Path("ml/evaluation/production_flow_eval.json"),
        help="Path to evaluation metrics JSON",
    )
    args = parser.parse_args()

    metrics = _load_metrics(args.metrics)
    failures = _failures(metrics)
    if failures:
        print("EVALUATION GATES FAILED:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("EVALUATION GATES PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
