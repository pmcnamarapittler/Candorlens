from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api import main
from backend.api.routes import analyze
from backend.services.bert_classifier import BertClassifierService, ModelArtifactError


def _build_client() -> TestClient:
    app = FastAPI()
    app.include_router(analyze.router)
    return TestClient(app)


def test_analyze_text_success(monkeypatch):
    def fake_analyze_text(text: str):
        return {
            "event_id": "evt_20260425_001",
            "text": text,
            "attack_class": "forced_continuity",
            "confidence": "HIGH",
            "commitment_stage": "commit",
            "commitment_type": "financial",
            "coercion_vector": ["cost_obfuscation"],
            "flow_step": 0,
            "flow_id": "single",
            "rationale": "Missing disclosure.",
            "source": "model_prediction",
            "risk_outcome": None,
            "evidence_type": None,
            "jurisdiction_mapping": ["ROSCA"],
            "legal_mapping": {
                "regulations": [{"id": "ROSCA", "name": "ROSCA", "citation": "15 U.S.C. § 8403"}],
                "enforcement_precedent": [],
                "risk_severity": "high",
                "remediation_guidance": "Add clear disclosure.",
            },
        }

    monkeypatch.setattr(analyze, "analyze_text", fake_analyze_text)
    client = _build_client()
    response = client.post("/analyze-text", json={"text": "Start your free trial"})

    assert response.status_code == 200
    body = response.json()
    assert body["attack_class"] == "forced_continuity"
    assert body["confidence"] == "HIGH"


def test_analyze_text_validation_error():
    client = _build_client()
    response = client.post("/analyze-text", json={"text": ""})
    assert response.status_code == 422


def test_analyze_text_bad_request(monkeypatch):
    monkeypatch.setattr(analyze, "analyze_text", lambda _: (_ for _ in ()).throw(ValueError("bad input")))
    client = _build_client()
    response = client.post("/analyze-text", json={"text": "input"})
    assert response.status_code == 400


def test_analyze_text_service_unavailable(monkeypatch):
    monkeypatch.setattr(
        analyze,
        "analyze_text",
        lambda _: (_ for _ in ()).throw(FileNotFoundError("model missing")),
    )
    client = _build_client()
    response = client.post("/analyze-text", json={"text": "input"})
    assert response.status_code == 503


def test_analyze_text_model_artifact_error(monkeypatch):
    monkeypatch.setattr(
        analyze,
        "analyze_text",
        lambda _: (_ for _ in ()).throw(ModelArtifactError("model artifacts incomplete")),
    )
    client = _build_client()
    response = client.post("/analyze-text", json={"text": "input"})
    assert response.status_code == 503
    assert "model artifacts incomplete" in response.json()["detail"]


def test_app_starts_when_model_artifacts_are_missing(tmp_path, monkeypatch):
    BertClassifierService._instance = None
    BertClassifierService._tokenizer = None
    BertClassifierService._model = None
    BertClassifierService._model_dir = None
    BertClassifierService._id_to_label = None
    monkeypatch.setenv("MODEL_PATH", str(tmp_path / "missing"))

    with TestClient(main.app) as client:
        response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

