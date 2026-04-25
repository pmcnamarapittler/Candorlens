from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.api.routes import analyze


def _build_client() -> TestClient:
    app = FastAPI()
    app.include_router(analyze.router)
    return TestClient(app)


def test_analyze_flow_success(monkeypatch):
    def fake_analyze_flow(events):
        findings = [
            {
                "event_id": "evt_20260425_001",
                "text": events[0]["text"],
                "attack_class": "false_urgency",
                "confidence": "MEDIUM",
                "commitment_stage": "commit",
                "commitment_type": "financial",
                "coercion_vector": ["temporal_pressure"],
                "flow_step": 0,
                "flow_id": events[0]["flow_id"],
                "rationale": "Artificial urgency phrase.",
                "source": "model_prediction",
                "risk_outcome": None,
                "evidence_type": None,
                "jurisdiction_mapping": ["FTC_Act_Section_5"],
                "legal_mapping": {
                    "regulations": [
                        {
                            "id": "FTC_Act_Section_5",
                            "name": "FTC Act Section 5",
                            "citation": "15 U.S.C. § 45(a)",
                        }
                    ],
                    "enforcement_precedent": [],
                    "risk_severity": "medium",
                    "remediation_guidance": "Remove fabricated urgency.",
                },
            }
        ]
        context = {"flow_id": events[0]["flow_id"], "total_events": 1, "summary": {"false_urgency": 1}}
        return findings, context

    monkeypatch.setattr(analyze, "analyze_flow", fake_analyze_flow)
    client = _build_client()

    response = client.post(
        "/analyze-flow",
        json={"events": [{"text": "Offer ends in 2 minutes", "flow_id": "checkout", "flow_step": 0}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["flow_context"]["flow_id"] == "checkout"
    assert body["findings"][0]["attack_class"] == "false_urgency"


def test_analyze_flow_validation_error():
    client = _build_client()
    response = client.post("/analyze-flow", json={"events": []})
    assert response.status_code == 422


def test_collect_flow_success(monkeypatch):
    monkeypatch.setattr(
        analyze,
        "collect_flow_events",
        lambda url, max_steps=8: {
            "events": [
                {
                    "text": "Start your trial",
                    "flow_id": "checkout",
                    "flow_step": 0,
                    "url": url,
                    "page_title": "Checkout",
                }
            ],
            "discovered_flows": [{"id": "checkout", "title": "Checkout", "path": "/checkout", "risk_hint": "HIGH"}],
            "pages_discovered": 1,
        },
    )
    client = _build_client()
    response = client.post("/collect-flow", json={"website_url": "https://example.com", "max_steps": 6})
    assert response.status_code == 200
    payload = response.json()
    assert payload["pages_discovered"] == 1
    assert payload["events"][0]["flow_id"] == "checkout"

