"""Confidence and lexical gates for suppressing weak model predictions."""

from __future__ import annotations

import os
import re

DEFAULT_MIN_FINDING_CONFIDENCE = 0.70
CLASS_MIN_FINDING_CONFIDENCE = {
    "forced_continuity": 0.72,
    "false_urgency": 0.7,
    "fear_based_threat": 0.75,
}

CLASS_EVIDENCE_TERMS = {
    "forced_continuity": (
        "trial",
        "subscription",
        "renew",
        "renewal",
        "monthly",
        "billed",
        "billing",
        "cancel",
        "charge",
        "payment",
        "$",
    ),
    "false_urgency": (
        "expires",
        "expire",
        "limited",
        "hurry",
        "only",
        "deadline",
        "today",
        "countdown",
        "last chance",
        "now",
        "left",
    ),
    "fear_based_threat": (
        "suspended",
        "suspend",
        "locked",
        "lose access",
        "verify",
        "security",
        "flagged",
        "deactivated",
        "deactivate",
        "unusual",
        "failed",
        "required",
        "risk",
    ),
}

CLASS_STRONG_PHRASES = {
    "forced_continuity": (
        "auto renew",
        "renews automatically",
        "charged monthly",
        "recurring charge",
        "cancel anytime",
    ),
    "false_urgency": (
        "offer expires",
        "limited time",
        "last chance",
        "only today",
        "ends tonight",
    ),
    "fear_based_threat": (
        "account will be suspended",
        "account is locked",
        "lose access",
        "security alert",
        "verify now",
    ),
}


def min_finding_confidence() -> float:
    value = os.getenv("MIN_FINDING_CONFIDENCE")
    if not value:
        return DEFAULT_MIN_FINDING_CONFIDENCE
    try:
        return float(value)
    except ValueError:
        return DEFAULT_MIN_FINDING_CONFIDENCE


def min_confidence_for_class(attack_class: str) -> float:
    env_key = f"MIN_FINDING_CONFIDENCE_{attack_class.upper()}"
    value = os.getenv(env_key)
    if value:
        try:
            return float(value)
        except ValueError:
            pass
    return CLASS_MIN_FINDING_CONFIDENCE.get(attack_class, min_finding_confidence())


def has_class_evidence(attack_class: str, text: str) -> bool:
    terms = CLASS_EVIDENCE_TERMS.get(attack_class) or ()
    strong_phrases = CLASS_STRONG_PHRASES.get(attack_class) or ()
    lower = text.lower()
    if any(phrase in lower for phrase in strong_phrases):
        return True

    matches = 0
    for term in terms:
        if " " in term:
            found = term in lower
        else:
            found = re.search(rf"\b{re.escape(term)}\b", lower) is not None
        if found:
            matches += 1
            if matches >= 2:
                return True
    return False


def should_emit_finding(attack_class: str, raw_confidence: float, text: str) -> bool:
    if raw_confidence < min_confidence_for_class(attack_class):
        return False
    return has_class_evidence(attack_class, text)
