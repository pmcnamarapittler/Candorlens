"""
Schemas for JSON report persistence and PDF report generation.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class StoredReportRequest(BaseModel):
    """Simple JSON report payload for /report persistence."""

    url: HttpUrl
    summary: str = Field(..., min_length=1, max_length=4000)
    labels: list[str] = Field(default_factory=list)


class ReportStatusResponse(BaseModel):
    """Simple status response used by /report persistence endpoint."""

    status: Literal["ok"]


class ReportFinding(BaseModel):
    """Frontend/backend shared finding shape used for PDF generation."""

    id: str = Field(..., min_length=1, max_length=128)
    title: str = Field(..., min_length=1, max_length=240)
    severity: Literal["HIGH", "MEDIUM", "LOW"] = Field(..., description="HIGH, MEDIUM, or LOW")
    regulation: str = Field(..., min_length=1, max_length=240)
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    description: str = Field(default="", max_length=4000)
    extracted_text: str | None = None
    remediation_guidance: str | None = None


class GenerateReportRequest(BaseModel):
    """Payload for POST /generate-report."""

    website_url: HttpUrl
    company_name: str = Field(..., min_length=1, max_length=240)
    generated_at: datetime | None = None
    findings: list[ReportFinding] = Field(..., min_length=1, max_length=500)

