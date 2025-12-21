from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.services.blob_reports import save_report, get_report


app = FastAPI(
    title="CandorLens API",
    version="0.1.0",
    description="Backend API for CandorLens (reports, OCR, ML, etc.)",
)

# --- CORS CONFIG -------------------------------------------------
# For dev we just open it up so Vite (localhost:517x) can talk to it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # you can later restrict to ["http://localhost:5173", ...]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------------------------------------------------------------


class Report(BaseModel):
    url: str
    summary: str
    labels: list[str] = []


@app.get("/")
async def root():
    return {"status": "ok"}


@app.post("/report")
async def api_save_report(report: Report):
    """Save a report to Azure Blob Storage."""
    save_report(report.url, report.model_dump())
    return {"status": "ok"}


@app.get("/report")
async def api_get_report(url: str):
    """Get a report by URL."""
    data = get_report(url)
    if not data:
        raise HTTPException(status_code=404, detail="Report not found")
    return data