"""
BERT classifier service (singleton). Loads fine-tuned bert-base-uncased from ml/models/bert_v1.
Exposes predict and predict_batch for analyze endpoints. Preload via load() at startup for P95.
"""

from pathlib import Path
from typing import Tuple

import torch
from transformers import BertForSequenceClassification, BertTokenizer

from backend.services.model_artifacts import (
    ModelArtifactError,
    load_id_to_label,
    validate_model_artifacts,
)

MAX_SEQ_LENGTH = 128

# Confidence thresholds for HIGH / MEDIUM / LOW
CONF_HIGH = 0.8
CONF_MEDIUM = 0.5


class BertClassifierService:
    """Singleton that loads BERT once and runs inference."""

    _instance: "BertClassifierService | None" = None
    _tokenizer: BertTokenizer | None = None
    _model: BertForSequenceClassification | None = None
    _model_dir: Path | None = None
    _id_to_label: dict[int, str] | None = None

    def __new__(cls) -> "BertClassifierService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load(self) -> None:
        """Load tokenizer and model from disk. Call at app startup for P95."""
        if self._model is not None:
            return
        model_dir = validate_model_artifacts()
        id_to_label = load_id_to_label(model_dir)
        try:
            self._tokenizer = BertTokenizer.from_pretrained(
                str(model_dir), local_files_only=True
            )
            self._model = BertForSequenceClassification.from_pretrained(
                str(model_dir), num_labels=len(id_to_label), local_files_only=True
            )
        except Exception as exc:
            self._tokenizer = None
            self._model = None
            raise ModelArtifactError(
                f"Failed to load BERT artifacts from {model_dir}: {exc}"
            ) from exc
        self._model.eval()
        self._model_dir = model_dir
        self._id_to_label = id_to_label

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
        assert self._tokenizer is not None and self._model is not None and self._id_to_label is not None
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
            if idx not in self._id_to_label:
                raise ModelArtifactError(f"Model predicted unknown class ID {idx}")
            conf = probs[i][idx].item()
            out.append((self._id_to_label[idx], conf))
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
