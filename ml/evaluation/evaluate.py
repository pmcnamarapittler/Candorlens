#!/usr/bin/env python3
"""
CandorLens — Model Evaluation (D3)
Loads the trained BERT model and evaluates on the held-out test set.
Reports per-class precision, recall, F1, and confusion matrix.

Usage (from repo root):
    python ml/evaluation/evaluate.py
"""

import sys
import json
from pathlib import Path

import numpy as np
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from sklearn.metrics import classification_report, confusion_matrix

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.training.config import (
    SPLITS_DIR,
    MODELS_DIR,
    MAX_SEQ_LENGTH,
    NUM_LABELS,
    ID_TO_LABEL,
)


def load_jsonl(path):
    """Read a JSONL file into parallel text and label lists."""
    texts, labels = [], []
    with open(path) as f:
        for line in f:
            obj = json.loads(line)
            texts.append(obj["text"])
            labels.append(obj["label"])
    return texts, labels


def main():
    model_dir = MODELS_DIR / "bert_v1"
    test_path = SPLITS_DIR / "test.jsonl"

    # ── Preflight checks ──
    if not model_dir.exists():
        print(f"ERROR: Model not found at {model_dir}. Run train_classifier.py first.")
        sys.exit(1)
    if not test_path.exists():
        print(f"ERROR: Test set not found at {test_path}. Run prepare_splits.py first.")
        sys.exit(1)

    # 1. Load test data
    texts, labels = load_jsonl(test_path)
    print(f"Loaded {len(texts)} test samples from {test_path}")

    # 2. Load model and tokenizer
    print(f"Loading model from {model_dir}...")
    tokenizer = BertTokenizer.from_pretrained(str(model_dir))
    model = BertForSequenceClassification.from_pretrained(str(model_dir), num_labels=NUM_LABELS)
    model.eval()

    # 3. Tokenize
    encodings = tokenizer(
        texts, truncation=True, padding=True, max_length=MAX_SEQ_LENGTH, return_tensors="pt"
    )

    # 4. Run inference (no gradients needed)
    with torch.no_grad():
        outputs = model(**encodings)
        logits = outputs.logits
        preds = torch.argmax(logits, dim=-1).numpy()

    labels_np = np.array(labels)

    # 5. Classification report (per-class precision, recall, F1)
    target_names = [ID_TO_LABEL[i] for i in range(NUM_LABELS)]
    report = classification_report(
        labels_np, preds, target_names=target_names, digits=4, output_dict=True
    )
    report_str = classification_report(
        labels_np, preds, target_names=target_names, digits=4
    )

    print("\n" + "=" * 60)
    print("CLASSIFICATION REPORT")
    print("=" * 60)
    print(report_str)

    # 6. Confusion matrix
    cm = confusion_matrix(labels_np, preds)
    print("CONFUSION MATRIX")
    print("-" * 60)
    # Header
    header = "                    " + "  ".join(f"{name[:12]:>12}" for name in target_names)
    print(header)
    for i, row in enumerate(cm):
        row_str = "  ".join(f"{val:>12}" for val in row)
        print(f"{target_names[i]:>20}  {row_str}")
    print()

    # 7. D3 target check
    print("=" * 60)
    print("D3 TARGET CHECK: ≥60% precision per class")
    print("=" * 60)
    all_pass = True
    for name in target_names:
        precision = report[name]["precision"]
        status = "PASS" if precision >= 0.60 else "FAIL"
        print(f"  {name:>20}: {precision:.2%}  {status}")
        if precision < 0.60:
            all_pass = False

    macro_f1 = report["macro avg"]["f1-score"]
    print(f"\n  {'Macro F1':>20}: {macro_f1:.2%}")
    print(f"\n  Overall: {'D3 TARGET MET' if all_pass else 'D3 TARGET NOT MET'}")

    # 8. Save results
    results_dir = Path(__file__).resolve().parent
    results = {
        "test_samples": len(texts),
        "classification_report": report,
        "confusion_matrix": cm.tolist(),
        "d3_target_met": all_pass,
        "per_class_precision": {
            name: round(report[name]["precision"], 4) for name in target_names
        },
    }
    results_path = results_dir / "results_v1.json"
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n  Results saved to: {results_path}")


if __name__ == "__main__":
    main()