from backend.schemas.report import GenerateReportRequest
from backend.services import report_generator


def _payload() -> GenerateReportRequest:
    return GenerateReportRequest(
        website_url="https://example.com",
        company_name="Example",
        findings=[
            {
                "id": "evt_001",
                "title": "Forced Continuity Language",
                "severity": "HIGH",
                "regulation": "ROSCA",
                "confidence": 0.9,
                "description": "Missing disclosure",
            }
        ],
    )


def test_pdf_prefers_playwright_path(monkeypatch):
    monkeypatch.setattr(report_generator, "_generate_pdf_report_playwright", lambda payload: b"%PDF-1.4\nplaywright")
    monkeypatch.setattr(report_generator, "_generate_pdf_report_reportlab", lambda payload: b"%PDF-1.4\nreportlab")
    content = report_generator.generate_pdf_report(_payload())
    assert content.startswith(b"%PDF")
    assert b"playwright" in content


def test_pdf_falls_back_to_reportlab(monkeypatch):
    def raise_err(payload):
        raise RuntimeError("playwright unavailable")

    monkeypatch.setattr(report_generator, "_generate_pdf_report_playwright", raise_err)
    monkeypatch.setattr(report_generator, "_generate_pdf_report_reportlab", lambda payload: b"%PDF-1.4\nreportlab")
    content = report_generator.generate_pdf_report(_payload())
    assert content.startswith(b"%PDF")
    assert b"reportlab" in content

