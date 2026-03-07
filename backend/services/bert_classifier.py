"""
BERT classifier service (singleton). Loads fine-tuned bert-base-uncased from ml/models/bert_v1.
Exposes predict and predict_batch for analyze endpoints. Preload via load() at startup for P95.
"""

import os
from pathlib import Path
from typing import Tuple

import torch
from transformers import BertForSequenceClassification, BertTokenizer

# Label map must match ml/training/config.py (alphabetical order)
ID_TO_LABEL = {0: "false_urgency", 1: "fear_based_threat", 2: "forced_continuity"}
NUM_LABELS = 3
MAX_SEQ_LENGTH = 128

# Confidence thresholds for HIGH / MEDIUM / LOW
CONF_HIGH = 0.8
CONF_MEDIUM = 0.5


def _get_model_dir() -> Path:
    """Resolve model directory: MODEL_PATH env or repo-relative ml/models/bert_v1."""
    if os.environ.get("MODEL_PATH"):
        return Path(os.environ["MODEL_PATH"]).resolve()
    repo_root = Path(__file__).resolve().parents[2]
    return repo_root / "ml" / "models" / "bert_v1"


class BertClassifierService:
    """Singleton that loads BERT once and runs inference."""

    _instance: "BertClassifierService | None" = None
    _tokenizer: BertTokenizer | None = None
    _model: BertForSequenceClassification | None = None
    _model_dir: Path | None = None

    def __new__(cls) -> "BertClassifierService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load(self) -> None:
        """Load tokenizer and model from disk. Call at app startup for P95."""
        if self._model is not None:
            return
        model_dir = _get_model_dir()
        if not model_dir.exists():
            raise FileNotFoundError(f"Model not found: {model_dir}. Run BERT training first.")
        self._tokenizer = BertTokenizer.from_pretrained(str(model_dir))
        self._model = BertForSequenceClassification.from_pretrained(
            str(model_dir), num_labels=NUM_LABELS
        )
        self._model.eval()
        self._model_dir = model_dir

    def _ensure_loaded(self) -> None:
        if self._model is None:
            self.load()

    def predict(self, text: str) -> Tuple[str, float]:
        """
        Run inference on a single text. Returns (attack_class, raw_confidence in [0,1]).
        """
        self._ensure_loaded()
        results = self.predict_batch([text])
        return results[0]

    def predict_batch(self, texts: list[str]) -> list[Tuple[str, float]]:
        """
        Batch inference. Returns list of (attack_class, raw_confidence) in same order as texts.
        """
        if not texts:
            return []
        self._ensure_loaded()
        assert self._tokenizer is not None and self._model is not None
        encodings = self._tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=MAX_SEQ_LENGTH,
            return_tensors="pt",
        )
        with torch.no_grad():
            outputs = self._model(**encodings)
            logits = outputs.logits  # (batch, num_labels)
            probs = torch.softmax(logits, dim=-1)
            preds = torch.argmax(logits, dim=-1)
        out = []
        for i in range(len(texts)):
            idx = preds[i].item()
            conf = probs[i][idx].item()
            out.append((ID_TO_LABEL[idx], conf))
        return out

    @staticmethod
    def raw_confidence_to_enum(raw: float) -> str:
        """Map raw confidence [0,1] to schema enum HIGH, MEDIUM, LOW."""
        if raw >= CONF_HIGH:
            return "HIGH"
        if raw >= CONF_MEDIUM:
            return "MEDIUM"
        return "LOW"


def get_classifier() -> BertClassifierService:
    """Return the singleton classifier instance."""
    return BertClassifierService()
