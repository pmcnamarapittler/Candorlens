from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

from backend.services.blob_reports import save_report, get_report


router = APIRouter()


class Report(BaseModel):
    url: str
    summary: str
    labels: Optional[List[str]] = []


@router.post("/report")
def api_save_report(report: Report):
    """
    Save a report for a given URL into Azure Blob Storage.
    """
    try:
        save_report(report.url, report.model_dump())
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report")
def api_get_report(url: str = Query(..., description="URL of the page to fetch the report for")):
    """
    Fetch a report for a given URL from Azure Blob Storage.
    """
    report = get_report(url)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report