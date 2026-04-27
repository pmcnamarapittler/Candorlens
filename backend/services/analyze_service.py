"""
Orchestrates BERT classifier and Legal Mapper; builds AnalyzedEvent and LanguageEventResponse.
Single transformation path for both /analyze-text and /analyze-flow.
"""

from datetime import datetime

from backend.schemas.language_event import (
    AnalyzedEvent,
    LanguageEventResponse,
    generate_event_id,
    to_language_event,
)
from backend.services.bert_classifier import get_classifier
from backend.services.evidence_gates import should_emit_finding
from backend.services.legal_mapper import get_legal_mapping
from backend.services.text_evidence import EvidenceSnippet, extract_evidence_snippets


def analyze_text(text: str) -> LanguageEventResponse:
    """
    Analyze a single string: BERT predict, legal lookup, single to_language_event.
    Uses flow_id="single", flow_step=0.
    """
    classifier = get_classifier()
    attack_class, raw_confidence = classifier.predict(text)
    if not should_emit_finding(attack_class, raw_confidence, text):
        raise ValueError("No actionable violation evidence found in the provided text.")
    confidence_enum = classifier.raw_confidence_to_enum(raw_confidence)
    legal = get_legal_mapping(attack_class)
    analyzed = AnalyzedEvent(
        text=text,
        flow_id="single",
        flow_step=0,
        url=None,
        page_title=None,
        attack_class=attack_class,
        raw_confidence=raw_confidence,
        legal_mapping=legal,
    )
    event_id = generate_event_id(sequence=0)
    return to_language_event(analyzed, event_id, confidence_enum)


def analyze_flow(
    events: list[dict],
) -> tuple[list[LanguageEventResponse], dict]:
    """
    Analyze an array of language events (each: text, flow_id, flow_step).
    Returns (findings list, flow_context dict). Single batch inference, then same
    to_language_event per item.
    """
    if not events:
        return [], {"total_events": 0, "summary": {}}

    snippets: list[EvidenceSnippet] = []
    for event in events:
        snippets.extend(extract_evidence_snippets(event))

    if not snippets:
        return [], {"total_events": len(events), "total_snippets": 0, "summary": {}}

    texts = [snippet.text for snippet in snippets]
    classifier = get_classifier()
    predictions = classifier.predict_batch(texts)

    findings: list[LanguageEventResponse] = []
    base_date = datetime.utcnow()
    for i, (snippet, (attack_class, raw_confidence)) in enumerate(zip(snippets, predictions)):
        if not should_emit_finding(attack_class, raw_confidence, snippet.text):
            continue
        legal = get_legal_mapping(attack_class)
        confidence_enum = classifier.raw_confidence_to_enum(raw_confidence)
        analyzed = AnalyzedEvent(
            text=snippet.text,
            flow_id=snippet.flow_id,
            flow_step=snippet.flow_step,
            url=snippet.url,
            page_title=snippet.page_title,
            evidence_text=snippet.text,
            context_text=snippet.context_text,
            snippet_index=snippet.snippet_index,
            attack_class=attack_class,
            raw_confidence=raw_confidence,
            legal_mapping=legal,
        )
        event_id = generate_event_id(date=base_date, sequence=i)
        findings.append(to_language_event(analyzed, event_id, confidence_enum))

    # Flow context: counts by attack_class
    summary: dict[str, int] = {}
    for f in findings:
        summary[f.attack_class] = summary.get(f.attack_class, 0) + 1

    flow_id = events[0].get("flow_id", "flow") if events else "flow"
    flow_context = {
        "flow_id": flow_id,
        "total_events": len(findings),
        "total_pages": len(events),
        "total_snippets": len(snippets),
        "summary": summary,
    }
    return findings, flow_context
