#!/usr/bin/env python3
"""
CandorLens — Prepare Train/Test Splits (D3)
Reads events.jsonl, produces stratified train/test JSONL files.

Usage (from repo root):
    python ml/data/prepare_splits.py
"""

import sys
import json
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.training.config import (
    EVENTS_JSONL,
    TEST_SIZE,
    RANDOM_SEED,
    SPLITS_DIR,
    LABEL_MAP,
    ID_TO_LABEL,
)
from scripts.load_events import load_events
from sklearn.model_selection import train_test_split


def write_jsonl(path, texts, labels):
    """Write text/label pairs to a JSONL file."""
    with open(path, "w") as f:
        for text, label in zip(texts, labels):
            f.write(json.dumps({"text": text, "label": label}) + "\n")


def main():
    # Load and validate events
    events = load_events(EVENTS_JSONL, validate=True)

    texts = [event["text"] for event in events]
    labels = [LABEL_MAP[event["attack_class"]] for event in events]

    # Stratified split
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts,
        labels,
        test_size=TEST_SIZE,
        random_state=RANDOM_SEED,
        stratify=labels,
    )

    # Write output files
    SPLITS_DIR.mkdir(parents=True, exist_ok=True)
    write_jsonl(SPLITS_DIR / "train.jsonl", train_texts, train_labels)
    write_jsonl(SPLITS_DIR / "test.jsonl", test_texts, test_labels)

    with open(SPLITS_DIR / "label_map.json", "w") as f:
        json.dump(LABEL_MAP, f, indent=2)

    # Print summary
    train_counts = Counter(train_labels)
    test_counts = Counter(test_labels)

    print(f"Total events: {len(events)}")
    print(
        f"Train: {len(train_labels)} "
        f"({', '.join(f'{ID_TO_LABEL[k]}={v}' for k, v in sorted(train_counts.items()))})"
    )
    print(
        f"Test:  {len(test_labels)} "
        f"({', '.join(f'{ID_TO_LABEL[k]}={v}' for k, v in sorted(test_counts.items()))})"
    )
    print(f"Saved to: {SPLITS_DIR}")


if __name__ == "__main__":
    main()