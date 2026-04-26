import json

from transformers import BertTokenizer

from ml.training.config import ID_TO_LABEL, LABEL_MAP
from ml.training.train_classifier import save_label_metadata, save_tokenizer_artifacts


def test_save_label_metadata_writes_inference_label_map(tmp_path):
    save_label_metadata(tmp_path)

    payload = json.loads((tmp_path / "label_map.json").read_text(encoding="utf-8"))
    assert payload["label_map"] == LABEL_MAP
    assert payload["id_to_label"] == {str(idx): label for idx, label in ID_TO_LABEL.items()}


def test_save_tokenizer_artifacts_writes_vocab_file(tmp_path, monkeypatch):
    tokenizer = BertTokenizer(vocab_file=__file__)

    def fake_save_pretrained(path):
        (tmp_path / "tokenizer_config.json").write_text("{}", encoding="utf-8")

    monkeypatch.setattr(tokenizer, "save_pretrained", fake_save_pretrained)

    save_tokenizer_artifacts(tokenizer, tmp_path)

    assert (tmp_path / "vocab.txt").exists()
