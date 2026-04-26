from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import analyze, report
from backend.services.bert_classifier import ModelArtifactError, get_classifier

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload BERT model at startup for P95 response time under 500ms."""
    try:
        get_classifier().load()
    except ModelArtifactError as exc:
        logger.warning("BERT model preload skipped: %s", exc)
    yield
    # Shutdown: no explicit unload needed


app = FastAPI(
    title="CandorLens API",
    version="0.1.0",
    description="Backend API for CandorLens (reports, OCR, ML, etc.)",
    lifespan=lifespan,
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


@app.get("/")
async def root():
    return {"status": "ok"}


# Analyze routes (BERT + Legal Mapper)
app.include_router(analyze.router)
app.include_router(report.router)