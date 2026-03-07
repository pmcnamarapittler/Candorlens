"""
Legal Mapper service: deterministic lookup of regulation, precedent, severity, and remediation
per attack class. All legal text is loaded from taxonomy files; no strings in code.
"""

import json
import os
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field


def _get_taxonomy_dir() -> Path:
    """Resolve taxonomy directory: TAXONOMY_DIR env or repo-relative taxonomy/."""
    if os.environ.get("TAXONOMY_DIR"):
        return Path(os.environ["TAXONOMY_DIR"]).resolve()
    # backend/services/legal_mapper.py -> repo root = parents[2]
    repo_root = Path(__file__).resolve().parents[2]
    return repo_root / "taxonomy"


class RegulationInfo(BaseModel):
    """Regulation name and citation."""

    id: str
    name: str
    citation: str
    requirements: list[str] | None = None
    violation_type: str | None = None


class EnforcementPrecedent(BaseModel):
    """Enforcement case reference."""

    case: str
    year: int
    settlement_usd: int | None = None
    status: str | None = None


class LegalMappingResult(BaseModel):
    """Result of legal lookup for an attack class."""

    regulations: list[RegulationInfo] = Field(..., description="Regulation name and legal citation")
    enforcement_precedent: list[EnforcementPrecedent] = Field(
        ..., description="Enforcement precedent cases"
    )
    risk_severity: str = Field(..., description="high, medium, or low")
    remediation_guidance: str = Field(..., description="Specific remediation guidance")


_legal_data: dict[str, Any] | None = None


def _load_legal_data() -> dict[str, Any]:
    """Load legal_mapping.json once; cache in module."""
    global _legal_data
    if _legal_data is not None:
        return _legal_data
    path = _get_taxonomy_dir() / "legal_mapping.json"
    if not path.exists():
        raise FileNotFoundError(f"Legal mapping not found: {path}")
    with open(path, encoding="utf-8") as f:
        _legal_data = json.load(f)
    return _legal_data


def get_legal_mapping(attack_class: str) -> LegalMappingResult:
    """
    Deterministic lookup by attack_class. Returns regulation name/citation,
    enforcement precedent, risk_severity, and remediation_guidance.
    """
    data = _load_legal_data()
    classes = data.get("attack_classes") or {}
    if attack_class not in classes:
        raise ValueError(f"Unknown attack_class: {attack_class}")

    entry = classes[attack_class]
    regulations = [
        RegulationInfo(
            id=r["id"],
            name=r["name"],
            citation=r["citation"],
            requirements=r.get("requirements"),
            violation_type=r.get("violation_type"),
        )
        for r in entry.get("regulations") or []
    ]
    precedent = [
        EnforcementPrecedent(
            case=p["case"],
            year=p["year"],
            settlement_usd=p.get("settlement_usd"),
            status=p.get("status"),
        )
        for p in entry.get("enforcement_precedent") or []
    ]
    return LegalMappingResult(
        regulations=regulations,
        enforcement_precedent=precedent,
        risk_severity=entry.get("risk_severity", "medium"),
        remediation_guidance=entry.get("remediation_guidance", ""),
    )
