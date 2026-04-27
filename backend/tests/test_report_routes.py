from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.routes import report


def _build_client() -> TestClient:
    app = FastAPI()
    app.include_router(report.router)
    return TestClient(app)


def test_generate_report_returns_pdf(monkeypatch):
    monkeypatch.setattr(report, "generate_pdf_report", lambda payload: b"%PDF-1.4\nmock")
    client = _build_client()

    response = client.post(
        "/generate-report",
        json={
            "website_url": "https://example.com",
            "company_name": "Example Inc",
            "findings": [
                {
                    "id": "evt_20260425_001",
                    "title": "Forced Continuity Language",
                    "severity": "HIGH",
                    "regulation": "ROSCA",
                    "confidence": 0.9,
                    "description": "Missing recurring charge disclosure",
                    "attack_class": "forced_continuity",
                    "raw_confidence": 0.92,
                    "source_url": "https://example.com/pricing",
                    "flow_id": "pricing",
                    "flow_step": 0,
                    "evidence_text": "Start your free trial now.",
                }
            ],
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content.startswith(b"%PDF")


def test_generate_report_allows_empty_findings(monkeypatch):
    monkeypatch.setattr(report, "generate_pdf_report", lambda payload: b"%PDF-1.4\nmock")
    client = _build_client()

    response = client.post(
        "/generate-report",
        json={
            "website_url": "https://example.com",
            "company_name": "Example Inc",
            "findings": [],
        },
    )

    assert response.status_code == 200
    assert response.content.startswith(b"%PDF")


def test_generate_report_validation_error():
    client = _build_client()
    response = client.post(
        "/generate-report",
        json={
            "website_url": "https://example.com",
            "company_name": "Example Inc",
            "findings": [
                {
                    "id": "evt_20260425_001",
                    "title": "Bad Severity",
                    "severity": "CRITICAL",
                    "regulation": "ROSCA",
                }
            ],
        },
    )
    assert response.status_code == 422


def test_report_save_and_get(monkeypatch):
    store = {}

    def fake_save(url, payload):
        store[url] = payload

    def fake_get(url):
        return store.get(url)

    monkeypatch.setattr(report, "save_report", fake_save)
    monkeypatch.setattr(report, "get_report", fake_get)
    client = _build_client()

    save_response = client.post(
        "/report",
        json={"url": "https://example.com", "summary": "Stored report", "labels": ["fu"]},
    )
    assert save_response.status_code == 200
    assert save_response.json() == {"status": "ok"}

    get_response = client.get("/report", params={"url": "https://example.com"})
    assert get_response.status_code == 200
    assert get_response.json()["summary"] == "Stored report"


def test_report_get_not_found(monkeypatch):
    monkeypatch.setattr(report, "get_report", lambda _: None)
    client = _build_client()
    response = client.get("/report", params={"url": "https://example.com"})
    assert response.status_code == 404

