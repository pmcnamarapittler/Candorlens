import json

import pytest

from backend.services import bert_classifier
from backend.services.bert_classifier import BertClassifierService
from backend.services.model_artifacts import (
    ModelArtifactError,
    load_id_to_label,
    validate_model_artifacts,
)


def _write_complete_artifacts(path):
    path.mkdir()
    (path / "config.json").write_text("{}", encoding="utf-8")
    (path / "vocab.txt").write_text("[PAD]\n[UNK]\n", encoding="utf-8")
    (path / "pytorch_model.bin").write_bytes(b"weights")
    (path / "label_map.json").write_text(
        json.dumps(
            {
                "label_map": {
                    "false_urgency": 0,
                    "fear_based_threat": 1,
                    "forced_continuity": 2,
                },
                "id_to_label": {
                    "0": "false_urgency",
                    "1": "fear_based_threat",
                    "2": "forced_continuity",
                },
            }
        ),
        encoding="utf-8",
    )


def _reset_classifier_singleton():
    BertClassifierService._instance = None
    BertClassifierService._tokenizer = None
    BertClassifierService._model = None
    BertClassifierService._model_dir = None
    BertClassifierService._id_to_label = None


def test_validate_model_artifacts_reports_missing_directory(tmp_path):
    with pytest.raises(ModelArtifactError, match="Model directory not found"):
        validate_model_artifacts(tmp_path / "missing")


def test_validate_model_artifacts_reports_missing_vocab(tmp_path):
    model_dir = tmp_path / "bert_v1"
    model_dir.mkdir()
    (model_dir / "config.json").write_text("{}", encoding="utf-8")
    (model_dir / "label_map.json").write_text('{"id_to_label":{"0":"false_urgency"}}', encoding="utf-8")
    (model_dir / "pytorch_model.bin").write_bytes(b"weights")

    with pytest.raises(ModelArtifactError, match="vocab.txt"):
        validate_model_artifacts(model_dir)


def test_validate_model_artifacts_accepts_complete_directory(tmp_path):
    model_dir = tmp_path / "bert_v1"
    _write_complete_artifacts(model_dir)

    assert validate_model_artifacts(model_dir) == model_dir
    assert load_id_to_label(model_dir) == {
        0: "false_urgency",
        1: "fear_based_threat",
        2: "forced_continuity",
    }


def test_load_id_to_label_rejects_unexpected_classes(tmp_path):
    model_dir = tmp_path / "bert_v1"
    _write_complete_artifacts(model_dir)
    (model_dir / "label_map.json").write_text(
        json.dumps({"id_to_label": {"0": "benign"}}),
        encoding="utf-8",
    )

    with pytest.raises(ModelArtifactError, match="must define attack classes"):
        load_id_to_label(model_dir)


def test_load_wraps_transformers_tokenizer_crash(tmp_path, monkeypatch):
    model_dir = tmp_path / "bert_v1"
    _write_complete_artifacts(model_dir)
    monkeypatch.setenv("MODEL_PATH", str(model_dir))
    _reset_classifier_singleton()

    def crash(*args, **kwargs):
        raise TypeError("stat: path should be string, bytes, os.PathLike or integer, not NoneType")

    monkeypatch.setattr(bert_classifier.BertTokenizer, "from_pretrained", crash)

    with pytest.raises(ModelArtifactError, match="Failed to load BERT artifacts"):
        bert_classifier.get_classifier().load()
