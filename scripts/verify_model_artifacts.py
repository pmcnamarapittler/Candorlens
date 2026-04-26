#!/usr/bin/env python3
"""Verify external BERT artifacts required by the CandorLens API."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.services.model_artifacts import (  # noqa: E402
    ModelArtifactError,
    load_id_to_label,
    validate_model_artifacts,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate the local or MODEL_PATH BERT artifact directory."
    )
    parser.add_argument(
        "--model-path",
        type=Path,
        default=None,
        help="Optional model directory. Defaults to MODEL_PATH or ml/models/bert_v1.",
    )
    args = parser.parse_args()

    try:
        model_dir = validate_model_artifacts(args.model_path.resolve() if args.model_path else None)
        id_to_label = load_id_to_label(model_dir)
    except ModelArtifactError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    labels = ", ".join(f"{idx}:{label}" for idx, label in sorted(id_to_label.items()))
    print(f"OK: model artifacts verified at {model_dir}")
    print(f"Labels: {labels}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
