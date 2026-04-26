"""Validation helpers for external BERT model artifacts."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

REQUIRED_TOKENIZER_FILES = ("vocab.txt",)
REQUIRED_CONFIG_FILES = ("config.json", "label_map.json")
SUPPORTED_WEIGHT_FILES = ("pytorch_model.bin", "model.safetensors")
EXPECTED_ATTACK_CLASSES = {"false_urgency", "fear_based_threat", "forced_continuity"}


class ModelArtifactError(RuntimeError):
    """Raised when external BERT model artifacts are missing or invalid."""


def get_model_dir() -> Path:
    """Resolve model directory: MODEL_PATH env or repo-relative ml/models/bert_v1."""
    if os.environ.get("MODEL_PATH"):
        return Path(os.environ["MODEL_PATH"]).resolve()
    repo_root = Path(__file__).resolve().parents[2]
    return repo_root / "ml" / "models" / "bert_v1"


def _missing_artifacts(model_dir: Path) -> list[str]:
    missing: list[str] = []
    for filename in (*REQUIRED_CONFIG_FILES, *REQUIRED_TOKENIZER_FILES):
        if not (model_dir / filename).is_file():
            missing.append(filename)
    if not any((model_dir / filename).is_file() for filename in SUPPORTED_WEIGHT_FILES):
        missing.append("one of: " + ", ".join(SUPPORTED_WEIGHT_FILES))
    return missing


def validate_model_artifacts(model_dir: Path | None = None) -> Path:
    """Validate required external model files and return the resolved model directory."""
    resolved = model_dir or get_model_dir()
    if not resolved.exists():
        raise ModelArtifactError(
            f"Model directory not found: {resolved}. "
            "Run training or mount external artifacts with MODEL_PATH."
        )
    if not resolved.is_dir():
        raise ModelArtifactError(f"MODEL_PATH is not a directory: {resolved}")
    missing = _missing_artifacts(resolved)
    if missing:
        raise ModelArtifactError(
            f"Model artifacts are incomplete in {resolved}; missing {', '.join(missing)}. "
            "Expected a trained HuggingFace BERT directory with tokenizer and label metadata."
        )
    return resolved


def _load_label_metadata(path: Path) -> dict[str, Any]:
    try:
        with open(path, encoding="utf-8") as f:
            metadata = json.load(f)
    except OSError as exc:
        raise ModelArtifactError(f"Could not read label metadata at {path}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ModelArtifactError(f"Invalid JSON in label metadata at {path}: {exc}") from exc
    if not isinstance(metadata, dict):
        raise ModelArtifactError(f"Label metadata at {path} must be a JSON object")
    return metadata


def load_id_to_label(model_dir: Path) -> dict[int, str]:
    """Load label metadata saved alongside the model and validate class IDs."""
    path = model_dir / "label_map.json"
    metadata = _load_label_metadata(path)
    raw_id_to_label = metadata.get("id_to_label")
    if not isinstance(raw_id_to_label, dict):
        raise ModelArtifactError(f"Label metadata at {path} must contain an id_to_label object")

    try:
        id_to_label = {int(idx): str(label) for idx, label in raw_id_to_label.items()}
    except (TypeError, ValueError) as exc:
        raise ModelArtifactError(f"Label metadata at {path} has non-integer class IDs") from exc

    expected_ids = set(range(len(id_to_label)))
    if set(id_to_label) != expected_ids:
        raise ModelArtifactError(
            f"Label metadata at {path} must use contiguous class IDs 0..{len(id_to_label) - 1}"
        )
    labels = set(id_to_label.values())
    if labels != EXPECTED_ATTACK_CLASSES:
        raise ModelArtifactError(
            f"Label metadata at {path} must define attack classes {sorted(EXPECTED_ATTACK_CLASSES)}"
        )
    return id_to_label
