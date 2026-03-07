"""
Internal AnalyzedEvent shape and single transformation to Language Event Schema response.
Attack-class defaults for commitment_type, coercion_vector, jurisdiction_mapping.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from backend.services.legal_mapper import LegalMappingResult

# Attack-class defaults (model does not produce these; deterministic from class)
COMMITMENT_TYPE_BY_CLASS: dict[str, Literal["financial", "account_access", "data_sharing", "subscription_enrollment"]] = {
    "forced_continuity": "financial",
    "false_urgency": "financial",
    "fear_based_threat": "account_access",
}
COERCION_VECTOR_BY_CLASS: dict[str, list[str]] = {
    "forced_continuity": ["cost_obfuscation"],
    "false_urgency": ["temporal_pressure", "urgency_without_basis"],
    "fear_based_threat": ["threat_of_loss"],
}
JURISDICTION_BY_CLASS: dict[str, list[str]] = {
    "forced_continuity": ["FTC_Act_Section_5", "ROSCA"],
    "false_urgency": ["FTC_Act_Section_5"],
    "fear_based_threat": ["FTC_Act_Section_5", "CPRA_Dark_Pattern"],
}

ConfidenceEnum = Literal["HIGH", "MEDIUM", "LOW"]
AttackClassEnum = Literal["forced_continuity", "false_urgency", "fear_based_threat"]
CommitmentStageEnum = Literal["pre_commit", "commit", "post_commit"]
CommitmentTypeEnum = Literal["financial", "account_access", "data_sharing", "subscription_enrollment"]
CoercionVectorItem = Literal[
    "temporal_pressure",
    "authority_claim",
    "threat_of_loss",
    "cost_obfuscation",
    "ambiguous_action_label",
    "urgency_without_basis",
]


class AnalyzedEvent(BaseModel):
    """Canonical internal shape: model output + legal mapping + request context."""

    text: str
    flow_id: str
    flow_step: int = Field(..., ge=0)
    attack_class: str  # forced_continuity | false_urgency | fear_based_threat
    raw_confidence: float = Field(..., ge=0, le=1)
    legal_mapping: LegalMappingResult


# Response: schema-compliant LanguageEvent plus nested legal_mapping for API
class LegalMappingResponse(BaseModel):
    """Legal mapping in API response (regulation, precedent, severity, remediation)."""

    regulations: list[dict] = Field(..., description="Regulation name and citation")
    enforcement_precedent: list[dict] = Field(..., description="Enforcement precedent")
    risk_severity: str
    remediation_guidance: str


class LanguageEventResponse(BaseModel):
    """Response shape: Language Event Schema fields + legal_mapping."""

    event_id: str
    text: str
    attack_class: AttackClassEnum
    confidence: ConfidenceEnum
    commitment_stage: CommitmentStageEnum
    commitment_type: CommitmentTypeEnum
    coercion_vector: list[CoercionVectorItem]
    flow_step: int
    flow_id: str
    rationale: str
    source: Literal["model_prediction"]
    risk_outcome: str | None = None
    evidence_type: str | None = None
    jurisdiction_mapping: list[str] | None = None
    legal_mapping: LegalMappingResponse


def to_language_event(analyzed: AnalyzedEvent, event_id: str, confidence_enum: str) -> LanguageEventResponse:
    """
    Single transformation from internal AnalyzedEvent to LanguageEventResponse.
    Fills all required schema fields using attack_class defaults and legal mapping.
    """
    ac = analyzed.attack_class
    commitment_type = COMMITMENT_TYPE_BY_CLASS.get(ac, "financial")
    coercion_vector = COERCION_VECTOR_BY_CLASS.get(ac, ["temporal_pressure"])
    jurisdiction_mapping = JURISDICTION_BY_CLASS.get(ac)
    rationale = analyzed.legal_mapping.remediation_guidance or "Flagged by model as potential violation."
    if len(rationale) < 10:
        rationale = "Flagged by model as potential violation. " + rationale

    legal_resp = LegalMappingResponse(
        regulations=[r.model_dump() for r in analyzed.legal_mapping.regulations],
        enforcement_precedent=[p.model_dump() for p in analyzed.legal_mapping.enforcement_precedent],
        risk_severity=analyzed.legal_mapping.risk_severity,
        remediation_guidance=analyzed.legal_mapping.remediation_guidance,
    )

    return LanguageEventResponse(
        event_id=event_id,
        text=analyzed.text,
        attack_class=ac,
        confidence=confidence_enum,
        commitment_stage="commit",
        commitment_type=commitment_type,
        coercion_vector=coercion_vector,
        flow_step=analyzed.flow_step,
        flow_id=analyzed.flow_id,
        rationale=rationale,
        source="model_prediction",
        jurisdiction_mapping=jurisdiction_mapping,
        legal_mapping=legal_resp,
    )


def generate_event_id(date: datetime | None = None, sequence: int = 0) -> str:
    """Generate event_id matching schema pattern evt_YYYYMMDD_NNN."""
    d = date or datetime.utcnow()
    return f"evt_{d.strftime('%Y%m%d')}_{sequence:03d}"
