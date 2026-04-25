from typing import Any

from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, HttpUrl

from backend.services.blob_reports import save_report, get_report
from backend.services.report_generator import generate_pdf_report
from backend.schemas.report import (
    GenerateReportRequest,
    ReportStatusResponse,
    StoredReportRequest,
)


router = APIRouter()


class ErrorResponse(BaseModel):
    detail: str


@router.post(
    "/report",
    response_model=ReportStatusResponse,
    responses={500: {"model": ErrorResponse}},
)
def api_save_report(report: StoredReportRequest) -> ReportStatusResponse:
    """
    Save a report for a given URL into Azure Blob Storage.
    """
    try:
        save_report(str(report.url), report.model_dump(mode="json"))
        return ReportStatusResponse(status="ok")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/report",
    response_model=dict[str, Any],
    responses={404: {"model": ErrorResponse}},
)
def api_get_report(url: HttpUrl = Query(..., description="URL of the page to fetch the report for")):
    """
    Fetch a report for a given URL from Azure Blob Storage.
    """
    report = get_report(str(url))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post(
    "/generate-report",
    responses={500: {"model": ErrorResponse}},
)
def api_generate_report(payload: GenerateReportRequest):
    """
    Generate a PDF report from findings and return binary bytes.
    """
    try:
        pdf_bytes = generate_pdf_report(payload)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {e}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="candorlens_report.pdf"'},
    )