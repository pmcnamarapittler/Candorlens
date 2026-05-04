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

# Default lexical-evidence threshold. The gate requires either a strong phrase
# or this many keyword hits to accept a prediction. Per-class overrides live in
# CLASS_MIN_KEYWORD_MATCHES.
DEFAULT_MIN_KEYWORD_MATCHES = 2
CLASS_MIN_KEYWORD_MATCHES = {
    # Forced-continuity snippets are the most lexically redundant ("$", "month",
    # "premium", "subscribe", …), so two keyword hits keep noise low.
    "forced_continuity": 2,
    # False-urgency snippets often contain a single distinctive token like
    # "expires" or "lightning deal" surrounded by neutral copy.
    "false_urgency": 1,
    "fear_based_threat": 2,
}

# Keyword evidence per attack class. Plain words use word-boundary regex,
# multi-word phrases use substring match, and any term containing a non-word
# character (e.g. "$", "/month") falls back to substring match so we don't
# mis-handle currency / unit fragments.
CLASS_EVIDENCE_TERMS = {
    "forced_continuity": (
        # Subscription / billing language
        "trial",
        "trials",
        "tried",
        "subscription",
        "subscribe",
        "subscriber",
        "subscribing",
        "renew",
        "renews",
        "renewal",
        "auto-renew",
        "auto renew",
        "automatic renewal",
        "monthly",
        "month",
        "year",
        "yearly",
        "annually",
        "billed",
        "billing",
        "cancel",
        "cancellation",
        "charge",
        "charged",
        "payment",
        "premium",
        "plus",
        "pro",
        "plan",
        "plans",
        "upgrade",
        "membership",
        "checkout",
        "intro",
        "introductory",
        "ongoing",
        "recurring",
        "commitment",
        "commitments",
        # Currency / pricing fragments (substring matched)
        "$",
        "usd",
        "/month",
        "/mo",
        "per month",
        "/year",
        "/yr",
        "per year",
    ),
    "false_urgency": (
        "expires",
        "expire",
        "expiring",
        "limited",
        "hurry",
        "deadline",
        "today",
        "tonight",
        "countdown",
        "last chance",
        "last day",
        "few left",
        "left in stock",
        "selling fast",
        "while supplies",
        "act fast",
        "ends soon",
        "ends tonight",
        "now or never",
        "lightning deal",
        "flash sale",
        "limited time",
        "only",
        "left",
    ),
    "fear_based_threat": (
        "suspended",
        "suspend",
        "locked",
        "lose access",
        "lose your",
        "verify",
        "verification",
        "security",
        "flagged",
        "deactivated",
        "deactivate",
        "unusual",
        "failed",
        "required",
        "risk",
        "compromise",
        "compromised",
        "breach",
        "breached",
        "alert",
        "warning",
        "unauthorized",
        "threat",
        "fraud",
        "fraudulent",
    ),
}

# Strong phrases auto-pass the gate even at lower confidence.
CLASS_STRONG_PHRASES = {
    "forced_continuity": (
        "auto renew",
        "auto-renew",
        "auto-renews",
        "automatic renewal",
        "renews automatically",
        "renews monthly",
        "charged monthly",
        "recurring charge",
        "recurring billing",
        "cancel anytime",
        "cancel at any time",
        "free trial",
        "start free trial",
        "start your free trial",
        "first month free",
        "no commitments",
        "no commitment",
        "billed annually",
        "billed monthly",
        "per month",
        "per year",
        "billed yearly",
    ),
    "false_urgency": (
        "offer expires",
        "limited time",
        "limited-time",
        "last chance",
        "only today",
        "ends tonight",
        "ends soon",
        "while supplies last",
        "selling fast",
        "act fast",
        "hurry",
    ),
    "fear_based_threat": (
        "account will be suspended",
        "account is locked",
        "account has been locked",
        "lose access",
        "security alert",
        "security warning",
        "verify now",
        "verify your account",
        "unauthorized access",
        "suspicious activity",
        "unusual activity",
    ),
}

_WORD_BOUNDARY_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9'-]*$")


def _is_plain_word(term: str) -> bool:
    """Plain words use \b...\b matching; everything else (currency, slashes,
    multi-word phrases) is matched as a substring."""
    return bool(_WORD_BOUNDARY_PATTERN.fullmatch(term))


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


def count_class_evidence(attack_class: str, text: str) -> tuple[int, bool]:
    """Return (keyword_match_count, strong_phrase_present) for the class."""
    terms = CLASS_EVIDENCE_TERMS.get(attack_class) or ()
    strong_phrases = CLASS_STRONG_PHRASES.get(attack_class) or ()
    lower = text.lower()

    strong_hit = any(phrase in lower for phrase in strong_phrases)

    matches = 0
    seen: set[str] = set()
    for term in terms:
        if term in seen:
            continue
        seen.add(term)
        if _is_plain_word(term):
            found = re.search(rf"\b{re.escape(term)}\b", lower) is not None
        else:
            found = term.lower() in lower
        if found:
            matches += 1
    return matches, strong_hit


def min_keyword_matches_for_class(attack_class: str) -> int:
    return CLASS_MIN_KEYWORD_MATCHES.get(attack_class, DEFAULT_MIN_KEYWORD_MATCHES)


def has_class_evidence(attack_class: str, text: str, *, min_matches: int | None = None) -> bool:
    """True if a strong phrase fires or `min_matches` keyword matches accumulate."""
    matches, strong_hit = count_class_evidence(attack_class, text)
    if strong_hit:
        return True
    threshold = min_matches if min_matches is not None else min_keyword_matches_for_class(attack_class)
    return matches >= threshold


def should_emit_finding(attack_class: str, raw_confidence: float, text: str) -> bool:
    """Decide whether the model prediction is strong enough AND has lexical
    support to be surfaced to the user. Confidence floor + lexical evidence
    must both hold."""
    if raw_confidence < min_confidence_for_class(attack_class):
        return False
    return has_class_evidence(attack_class, text)
