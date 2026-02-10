#!/usr/bin/env python3
"""
CandorLens — BERT Classifier Training (D3)
Fine-tunes bert-base-uncased on 3 attack classes with early stopping.

Usage (from repo root):
    python ml/training/train_classifier.py
"""

import sys
import json
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import Dataset
from sklearn.model_selection import train_test_split
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
)

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ml.training.config import (
    SPLITS_DIR,
    MODELS_DIR,
    MODEL_NAME,
    MAX_SEQ_LENGTH,
    LEARNING_RATE,
    NUM_EPOCHS,
    BATCH_SIZE,
    WEIGHT_DECAY,
    WARMUP_RATIO,
    FREEZE_LAYERS,
    NUM_LABELS,
    ID_TO_LABEL,
    RANDOM_SEED,
)


# ── Dataset wrapper ──

class EventDataset(Dataset):
    """Wraps tokenizer output + labels for the HuggingFace Trainer."""

    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        item = {k: v[idx] for k, v in self.encodings.items()}
        item["labels"] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item


# ── Helpers ──

def load_jsonl(path):
    """Read a JSONL file into parallel text and label lists."""
    texts, labels = [], []
    with open(path) as f:
        for line in f:
            obj = json.loads(line)
            texts.append(obj["text"])
            labels.append(obj["label"])
    return texts, labels


def compute_metrics(eval_pred):
    """Compute accuracy for Trainer eval loop (early stopping signal)."""
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    accuracy = (preds == labels).mean()
    return {"accuracy": accuracy}


# ── Main ──

def main():
    # 1. Load training split from Script 1 output
    train_path = SPLITS_DIR / "train.jsonl"
    if not train_path.exists():
        print(f"ERROR: {train_path} not found. Run prepare_splits.py first.")
        sys.exit(1)

    texts, labels = load_jsonl(train_path)
    print(f"Loaded {len(texts)} training samples from {train_path}")

    # 2. Split into train / val for early stopping (90/10)
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts,
        labels,
        test_size=0.1,
        random_state=RANDOM_SEED,
        stratify=labels,
    )
    print(f"  Train: {len(train_texts)}  |  Val: {len(val_texts)}")

    # 3. Tokenize
    tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)

    train_encodings = tokenizer(
        train_texts, truncation=True, padding=True, max_length=MAX_SEQ_LENGTH
    )
    val_encodings = tokenizer(
        val_texts, truncation=True, padding=True, max_length=MAX_SEQ_LENGTH
    )

    train_dataset = EventDataset(train_encodings, train_labels)
    val_dataset = EventDataset(val_encodings, val_labels)

    # 4. Load model
    model = BertForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
    )

    # 5. Freeze lower encoder layers to reduce overfitting
    for param in model.bert.embeddings.parameters():
        param.requires_grad = False

    for layer in model.bert.encoder.layer[:FREEZE_LAYERS]:
        for param in layer.parameters():
            param.requires_grad = False

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"Trainable parameters: {trainable:,} / {total:,} ({100 * trainable / total:.1f}%)")

    # 6. Training arguments
    output_dir = MODELS_DIR / "bert_v1"

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
        warmup_ratio=WARMUP_RATIO,
        # Evaluation & early stopping
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        # Logging
        logging_strategy="epoch",
        # Reproducibility
        seed=RANDOM_SEED,
        # Save space — keep only best checkpoint
        save_total_limit=1,
    )

    # 7. Train
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    print(f"\nStarting training ({NUM_EPOCHS} epochs max, early stop patience=2)...")
    print(f"  Model:  {MODEL_NAME}")
    print(f"  LR:     {LEARNING_RATE}")
    print(f"  Batch:  {BATCH_SIZE}")
    print(f"  Frozen: first {FREEZE_LAYERS} of 12 encoder layers\n")

    trainer.train()

    # 8. Save best model, tokenizer, and training log
    final_dir = MODELS_DIR / "bert_v1"
    final_dir.mkdir(parents=True, exist_ok=True)

    trainer.save_model(str(final_dir))
    tokenizer.save_pretrained(str(final_dir))

    log_history = trainer.state.log_history
    with open(final_dir / "training_log.json", "w") as f:
        json.dump(log_history, f, indent=2)

    # 9. Summary
    print(f"\nTraining complete.")
    print(f"  Best model saved to: {final_dir}")
    print(f"  Epochs completed: {int(trainer.state.epoch)}")
    print(f"  Best eval_loss: {trainer.state.best_metric:.4f}")
    print(f"  Label map: {ID_TO_LABEL}")


if __name__ == "__main__":
    main()