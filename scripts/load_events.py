#!/usr/bin/env python3
"""
CandorLens JSONL Event Loader (D2)
Loads and validates LanguageEvent records from annotated JSONL files.

Usage:
    python scripts/load_events.py [path]           # Default: data/annotated/events.jsonl
    python scripts/load_events.py --validate-only  # Exit 1 if any line invalid
    python scripts/load_events.py --schema-strict  # Enforce schema event_id + source
"""

import json
import re
import sys
from pathlib import Path

# Required keys per taxonomy/language_event_schema.json
REQUIRED_KEYS = {
    "event_id",
    "text",
    "attack_class",
    "confidence",
    "commitment_stage",
    "commitment_type",
    "coercion_vector",
    "flow_step",
    "flow_id",
    "rationale",
    "source",
}

# Schema-strict event_id pattern
EVENT_ID_PATTERN = r"^evt_[0-9]{8}_[0-9]{3}$"

ATTACK_CLASSES = {"forced_continuity", "false_urgency", "fear_based_threat"}
CONFIDENCE = {"HIGH", "MEDIUM", "LOW"}
COMMITMENT_STAGE = {"pre_commit", "commit", "post_commit"}
COMMITMENT_TYPE = {"financial", "account_access", "data_sharing", "subscription_enrollment"}
COERCION_VECTORS = {
    "temporal_pressure",
    "authority_claim",
    "threat_of_loss",
    "cost_obfuscation",
    "ambiguous_action_label",
    "urgency_without_basis",
}


def _validate_event(event: dict, strict_source: bool = False, schema_strict: bool = False):
    """Validate one event. Returns list of error messages (empty if valid).
    
    Args:
        event: Event dictionary to validate
        strict_source: If True, require source in (manual_label, model_prediction)
        schema_strict: If True, enforce schema event_id pattern and source enum
    """
    errs = []
    if not isinstance(event, dict):
        return ["event is not a dict"]

    missing = REQUIRED_KEYS - set(event.keys())
    if missing:
        errs.append(f"missing required keys: {missing}")
    
    # Schema-strict validation: event_id must match pattern
    if schema_strict and "event_id" in event:
        event_id = event["event_id"]
        if not isinstance(event_id, str):
            errs.append("event_id must be a string")
        elif not re.match(EVENT_ID_PATTERN, event_id):
            errs.append(f"event_id must match pattern {EVENT_ID_PATTERN} (got {event_id})")

    if "attack_class" in event and event["attack_class"] not in ATTACK_CLASSES:
        errs.append(f"invalid attack_class: {event['attack_class']}")
    if "confidence" in event and event["confidence"] not in CONFIDENCE:
        errs.append(f"invalid confidence: {event['confidence']}")
    if "commitment_stage" in event and event["commitment_stage"] not in COMMITMENT_STAGE:
        errs.append(f"invalid commitment_stage: {event['commitment_stage']}")
    if "commitment_type" in event and event["commitment_type"] not in COMMITMENT_TYPE:
        errs.append(f"invalid commitment_type: {event['commitment_type']}")

    cv = event.get("coercion_vector")
    if cv is not None:
        if not isinstance(cv, list) or len(cv) < 1:
            errs.append("coercion_vector must be non-empty array")
        else:
            bad = set(cv) - COERCION_VECTORS
            if bad:
                errs.append(f"invalid coercion_vector entries: {bad}")

    if "flow_step" in event and (not isinstance(event["flow_step"], int) or event["flow_step"] < 0):
        errs.append("flow_step must be non-negative integer")
    
    if "text" in event:
        text_value = event["text"]
        if not isinstance(text_value, str):
            errs.append("text must be a string")
        elif not text_value.strip():
            errs.append("text must be non-empty")
    
    if "rationale" in event:
        rationale_value = event["rationale"]
        if not isinstance(rationale_value, str):
            errs.append("rationale must be a string")
        elif len(rationale_value) < 10:
            errs.append("rationale must be at least 10 characters")

    # Source validation
    if "source" in event:
        if schema_strict or strict_source:
            # Schema-strict or strict_source: only allow schema-defined values
            if event["source"] not in ("manual_label", "model_prediction"):
                errs.append(f"source must be manual_label or model_prediction (got {event['source']})")
        # Otherwise allow ftc_complaint etc. for backward compatibility

    return errs


def load_events(
    path,  # str or Path
    *,
    validate: bool = True,
    strict_source: bool = False,
    schema_strict: bool = False,
):
    """
    Load LanguageEvent records from a JSONL file.

    Args:
        path: Path to .jsonl file (e.g. data/annotated/events.jsonl).
        validate: If True, print validation errors to stderr for invalid lines.
                  Invalid lines are always excluded from the returned list.
        strict_source: If True, require source in (manual_label, model_prediction).
        schema_strict: If True, enforce schema event_id pattern and source enum.

    Returns:
        List of event dicts. Invalid lines are always skipped.
        
    Raises:
        FileNotFoundError: If the file does not exist.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    events = []
    with path.open(encoding="utf-8") as f:
        for i, raw_line in enumerate(f, start=1):
            line = raw_line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError as e:
                if validate:
                    print(f"  [load_events] Line {i}: invalid JSON - {e}", file=sys.stderr)
                continue
            errs = _validate_event(event, strict_source=strict_source, schema_strict=schema_strict)
            if errs:
                if validate:
                    print(f"  [load_events] Line {i} ({event.get('event_id', '?')}): {'; '.join(errs)}", file=sys.stderr)
                continue
            events.append(event)
    return events


def main():
    default_path = Path(__file__).resolve().parent.parent / "data" / "annotated" / "events.jsonl"
    import argparse
    parser = argparse.ArgumentParser(description="Load and validate CandorLens events JSONL")
    parser.add_argument("path", nargs="?", default=str(default_path), help="Path to events.jsonl")
    parser.add_argument("--validate-only", action="store_true", help="Exit with code 1 if any line is invalid")
    parser.add_argument("--strict-source", action="store_true", help="Require source in manual_label, model_prediction")
    parser.add_argument("--schema-strict", action="store_true", help="Enforce schema event_id pattern and source enum")
    args = parser.parse_args()

    path = Path(args.path)
    if not path.exists():
        print(f"File not found: {path}", file=sys.stderr)
        sys.exit(1)

    # When validate_only we want to fail on first invalid line
    if args.validate_only:
        events = []
        with path.open(encoding="utf-8") as f:
            for i, raw_line in enumerate(f, start=1):
                line = raw_line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError as e:
                    print(f"Invalid JSON line {i}: {e}", file=sys.stderr)
                    sys.exit(1)
                errs = _validate_event(event, strict_source=args.strict_source, schema_strict=args.schema_strict)
                if errs:
                    print(f"Invalid event line {i} ({event.get('event_id', '?')}): {'; '.join(errs)}", file=sys.stderr)
                    sys.exit(1)
                events.append(event)
        print(f"OK: {len(events)} events valid")
        sys.exit(0)

    events = load_events(path, validate=True, strict_source=args.strict_source, schema_strict=args.schema_strict)
    print(f"Loaded {len(events)} events from {path}")
    if events:
        by_class = {}
        for e in events:
            c = e.get("attack_class", "?")
            by_class[c] = by_class.get(c, 0) + 1
        print("  By attack_class:", by_class)
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)
