"""
Analyze endpoints: POST /analyze-text and POST /analyze-flow.
Returns Language Event Schema-shaped responses with legal mapping.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from backend.schemas.language_event import LanguageEventResponse
from backend.services.analyze_service import analyze_flow, analyze_text
from backend.services.flow_runtime_ingest import collect_flow_events

router = APIRouter()


class ErrorResponse(BaseModel):
    detail: str


class AnalyzeTextRequest(BaseModel):
    """Request body for single-text analysis."""

    text: str = Field(..., min_length=1, description="Text to analyze for illegal patterns")


class FlowEventInput(BaseModel):
    """Single event in a flow: text and flow context."""

    text: str = Field(..., min_length=1)
    flow_id: str = Field(..., min_length=1)
    flow_step: int = Field(..., ge=0)
    url: str | None = None
    page_title: str | None = None


class AnalyzeFlowRequest(BaseModel):
    """Request body for flow analysis."""

    events: list[FlowEventInput] = Field(..., min_length=1)


class AnalyzeFlowResponse(BaseModel):
    """Response: findings (LanguageEvent-shaped) + flow_context."""

    findings: list[LanguageEventResponse]
    flow_context: dict


class CollectFlowRequest(BaseModel):
    website_url: HttpUrl
    max_steps: int = Field(default=8, ge=1, le=12)


class CollectFlowResponse(BaseModel):
    events: list[FlowEventInput]
    discovered_flows: list[dict]
    pages_discovered: int


@router.post(
    "/analyze-text",
    response_model=LanguageEventResponse,
    responses={400: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
async def api_analyze_text(body: AnalyzeTextRequest) -> LanguageEventResponse:
    """
    Analyze a single string. Returns detected class, confidence, and legal mapping
    (regulation name/citation, enforcement precedent, risk_severity, remediation_guidance).
    """
    try:
        return analyze_text(body.text)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/analyze-flow",
    response_model=AnalyzeFlowResponse,
    responses={400: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
async def api_analyze_flow(body: AnalyzeFlowRequest) -> AnalyzeFlowResponse:
    """
    Analyze an array of language events. Returns aggregated findings with flow context
    (flow_id, total_events, summary by attack_class). Each finding conforms to Language Event Schema.
    """
    events = [e.model_dump() for e in body.events]
    try:
        findings, flow_context = analyze_flow(events)
        return AnalyzeFlowResponse(findings=findings, flow_context=flow_context)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/collect-flow",
    response_model=CollectFlowResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def api_collect_flow(body: CollectFlowRequest) -> CollectFlowResponse:
    """
    Collect website-specific flow events with Playwright for downstream /analyze-flow.
    """
    try:
        payload = collect_flow_events(str(body.website_url), max_steps=body.max_steps)
        events = [FlowEventInput(**event) for event in payload["events"]]
        return CollectFlowResponse(
            events=events,
            discovered_flows=payload.get("discovered_flows", []),
            pages_discovered=payload.get("pages_discovered", len(events)),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
