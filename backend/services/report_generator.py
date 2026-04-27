"""
Generate PDF compliance reports for CandorLens findings.
"""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
import logging

from backend.schemas.report import GenerateReportRequest
from backend.services.report_html_renderer import build_report_html

logger = logging.getLogger(__name__)


def _severity_rank(value: str) -> int:
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    return order.get((value or "").upper(), 3)


def _safe_text(value: str | None | object) -> str:
    if not value:
        return ""
    return str(value).replace("\n", " ").strip()


def _generate_pdf_report_reportlab(payload: GenerateReportRequest) -> bytes:
    """
    Fallback ReportLab renderer.
    """
    try:
        from reportlab.lib.pagesizes import LETTER
        from reportlab.pdfgen import canvas
    except ImportError as exc:
        raise RuntimeError("reportlab is required for PDF generation") from exc

    findings = sorted(payload.findings, key=lambda item: _severity_rank(item.severity))
    generated_at = payload.generated_at or datetime.utcnow()

    high_count = sum(1 for f in findings if f.severity.upper() == "HIGH")
    medium_count = sum(1 for f in findings if f.severity.upper() == "MEDIUM")
    low_count = sum(1 for f in findings if f.severity.upper() == "LOW")

    stream = BytesIO()
    doc = canvas.Canvas(stream, pagesize=LETTER)
    width, height = LETTER
    y = height - 56

    def line(text: str, size: int = 10, step: int = 14) -> None:
        nonlocal y
        if y < 56:
            doc.showPage()
            y = height - 56
        doc.setFont("Helvetica", size)
        doc.drawString(56, y, text[:130])
        y -= step

    doc.setTitle("CandorLens Compliance Report")
    doc.setFont("Helvetica-Bold", 18)
    doc.drawString(56, y, "CandorLens Compliance Report")
    y -= 24

    line(f"Company: {_safe_text(payload.company_name) or 'N/A'}")
    line(f"Website: {_safe_text(payload.website_url) or 'N/A'}")
    line(f"Generated at: {generated_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    line("")

    doc.setFont("Helvetica-Bold", 12)
    doc.drawString(56, y, "Executive Summary")
    y -= 18
    line(f"Total findings: {len(findings)}")
    line(f"High severity: {high_count} | Medium severity: {medium_count} | Low severity: {low_count}")
    line("")

    doc.setFont("Helvetica-Bold", 12)
    doc.drawString(56, y, "Findings")
    y -= 18

    if not findings:
        line("No findings were provided for this report.")
    else:
        for idx, finding in enumerate(findings, start=1):
            confidence = ""
            if finding.confidence is not None:
                confidence = f" | Confidence: {finding.confidence:.2f}"
            line(
                f"{idx}. [{finding.severity.upper()}] {_safe_text(finding.title) or 'Untitled finding'}",
                size=10,
                step=13,
            )
            line(f"Regulation: {_safe_text(finding.regulation) or 'N/A'}{confidence}", size=9, step=12)
            if finding.attack_class:
                line(f"Classifier class: {_safe_text(finding.attack_class)}", size=9, step=12)
            if finding.raw_confidence is not None:
                line(f"Raw confidence: {finding.raw_confidence:.3f}", size=9, step=12)
            if finding.source_url:
                line(f"Source URL: {_safe_text(finding.source_url)}", size=9, step=12)
            evidence = finding.evidence_text or finding.extracted_text
            if evidence:
                line(f"Evidence: {_safe_text(evidence)}", size=9, step=12)
            if finding.description:
                line(f"Description: {_safe_text(finding.description)}", size=9, step=12)
            if finding.remediation_guidance:
                line(f"Remediation: {_safe_text(finding.remediation_guidance)}", size=9, step=12)
            line("")

    doc.showPage()
    doc.save()
    return stream.getvalue()


def _generate_pdf_report_playwright(payload: GenerateReportRequest) -> bytes:
    """
    Preferred renderer: browser-generated PDF for improved visual parity.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError("Playwright is required for browser-rendered PDF") from exc

    html = build_report_html(payload)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.set_content(html, wait_until="load")
            pdf_bytes = page.pdf(format="A4", print_background=True, margin={"top": "24px", "right": "24px", "bottom": "24px", "left": "24px"})
        finally:
            browser.close()
    return pdf_bytes


def generate_pdf_report(payload: GenerateReportRequest) -> bytes:
    """
    Generate report PDF with browser rendering first; fallback to ReportLab.
    """
    try:
        return _generate_pdf_report_playwright(payload)
    except Exception as exc:
        logger.warning("Playwright PDF rendering failed; falling back to ReportLab: %s", exc)
        return _generate_pdf_report_reportlab(payload)

