from backend.schemas.report import GenerateReportRequest
from backend.services.report_html_renderer import build_report_html


def test_report_html_includes_model_evidence_fields():
    payload = GenerateReportRequest(
        website_url="https://example.com",
        company_name="Example",
        findings=[
            {
                "id": "evt_001",
                "title": "False Urgency",
                "severity": "HIGH",
                "regulation": "FTC Act Section 5",
                "attack_class": "false_urgency",
                "raw_confidence": 0.88,
                "source_url": "https://example.com/pricing",
                "evidence_text": "Offer expires tonight.",
            }
        ],
    )

    html = build_report_html(payload)

    assert "false_urgency" in html
    assert "0.88" in html
    assert "https://example.com/pricing" in html
    assert "Offer expires tonight." in html
