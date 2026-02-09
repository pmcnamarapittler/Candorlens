#!/usr/bin/env python3
"""
CandorLens JSONL Validator
Loads and validates LanguageEvent JSONL files against the schema.

Integrates with scripts/load_events.py for backward compatibility.

Usage:
    python validate_jsonl.py <input.jsonl>
    python validate_jsonl.py data/annotated/events.jsonl --strict
"""

import json
import re
import argparse
import sys
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ValidationError

# Try to import the D2 loader for compatibility
try:
    sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
    from load_events import load_events as d2_load_events
    HAS_D2_LOADER = True
except ImportError:
    HAS_D2_LOADER = False


# --- Pydantic Models (schema enforcement) ---

class LanguageEvent(BaseModel):
    """Pydantic model for CandorLens LanguageEvent schema."""
    
    event_id: str = Field(..., min_length=1)  # Relaxed: allow any non-empty string
    text: str = Field(..., min_length=1)
    attack_class: str = Field(..., pattern="^(forced_continuity|false_urgency|fear_based_threat)$")
    confidence: str = Field(..., pattern="^(HIGH|MEDIUM|LOW)$")
    commitment_stage: str = Field(..., pattern="^(pre_commit|commit|post_commit)$")
    commitment_type: str = Field(..., pattern="^(financial|account_access|data_sharing|subscription_enrollment)$")
    coercion_vector: List[str] = Field(..., min_length=1)
    flow_step: int = Field(..., ge=0)
    flow_id: str = Field(..., min_length=1)
    rationale: str = Field(..., min_length=10)
    source: str = Field(..., pattern="^(manual_label|model_prediction|ftc_complaint)$")
    
    # Optional fields
    evidence_type: Optional[str] = None
    jurisdiction_mapping: Optional[List[str]] = None
    risk_outcome: Optional[str] = None
    case_citation: Optional[str] = None
    
    @field_validator('coercion_vector')
    @classmethod
    def validate_coercion_vector(cls, v):
        valid_vectors = {
            "temporal_pressure",
            "authority_claim",
            "threat_of_loss",
            "cost_obfuscation",
            "ambiguous_action_label",
            "urgency_without_basis"
        }
        for vector in v:
            if vector not in valid_vectors:
                raise ValueError(f"Invalid coercion_vector: {vector}")
        return v
    
    @field_validator('evidence_type')
    @classmethod
    def validate_evidence_type(cls, v):
        if v is None:
            return v
        valid_types = {
            "cta_label", "headline", "body_copy", "modal_text",
            "form_label", "toast_notification", "email_subject", "email_body"
        }
        if v not in valid_types:
            raise ValueError(f"Invalid evidence_type: {v}")
        return v
    
    @field_validator('jurisdiction_mapping')
    @classmethod
    def validate_jurisdiction(cls, v):
        if v is None:
            return v
        valid_jurisdictions = {"FTC_Act_Section_5", "ROSCA", "CPRA_Dark_Pattern"}
        for jurisdiction in v:
            if jurisdiction not in valid_jurisdictions:
                raise ValueError(f"Invalid jurisdiction: {jurisdiction}")
        return v


# --- Validation Functions ---

def load_and_validate_jsonl(
    filepath: Path, 
    strict: bool = False
) -> tuple[List[LanguageEvent], List[dict]]:
    """
    Load and validate JSONL file.
    
    Args:
        filepath: Path to JSONL file
        strict: If True, raise exception on first error. If False, collect errors and continue.
    
    Returns:
        Tuple of (valid_events, errors)
        - valid_events: List of validated LanguageEvent objects
        - errors: List of error dictionaries with line_num, error, raw_data
    """
    valid_events = []
    errors = []
    
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    
    print(f"LOADING: Loading: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue  # Skip empty lines
            
            try:
                # Parse JSON
                raw_data = json.loads(line)
                
                # Validate against schema
                event = LanguageEvent(**raw_data)
                valid_events.append(event)
                
            except json.JSONDecodeError as e:
                error = {
                    'line_num': line_num,
                    'error': f"Invalid JSON: {e}",
                    'raw_data': line[:100]  # First 100 chars
                }
                errors.append(error)
                if strict:
                    raise
                    
            except ValidationError as e:
                error = {
                    'line_num': line_num,
                    'error': f"Schema validation failed: {e}",
                    'raw_data': raw_data
                }
                errors.append(error)
                if strict:
                    raise
    
    return valid_events, errors


def print_validation_report(valid_events: List[LanguageEvent], errors: List[dict]):
    """Print validation summary."""
    total = len(valid_events) + len(errors)
    
    print("\n" + "="*60)
    print("VALIDATION REPORT")
    print("="*60)
    print(f"OK: Valid events:   {len(valid_events)}/{total}")
    print(f"FAIL: Invalid events: {len(errors)}/{total}")
    
    if errors:
        print("\nWARNING: Errors Found:")
        for error in errors[:10]:  # Show first 10 errors
            print(f"\n  Line {error['line_num']}:")
            print(f"  {error['error']}")
        
        if len(errors) > 10:
            print(f"\n  ... and {len(errors) - 10} more errors")
    
    if valid_events:
        print("\nOK: All events passed schema validation")
    
    print("="*60)


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(description="Validate CandorLens JSONL files")
    parser.add_argument(
        'input_file',
        type=Path,
        help='Path to JSONL file to validate'
    )
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Fail immediately on first error (default: collect all errors)'
    )
    parser.add_argument(
        '--output',
        type=Path,
        help='Optional: Save valid events to this file'
    )
    parser.add_argument(
        '--use-d2-loader',
        action='store_true',
        help='Use the D2 simple loader (scripts/load_events.py) instead of Pydantic'
    )
    
    args = parser.parse_args()
    
    # Option to use D2 loader for backward compatibility
    if args.use_d2_loader and HAS_D2_LOADER:
        print("LOADING: Using D2 loader (scripts/load_events.py)")
        events = d2_load_events(args.input_file, validate=True)
        print(f"\nSUCCESS: Loaded {len(events)} valid events")
        if events:
            by_class = {}
            for e in events:
                c = e.get("attack_class", "?")
                by_class[c] = by_class.get(c, 0) + 1
            print("  By attack_class:", by_class)
        exit(0)
    
    # Load and validate with Pydantic (default)
    valid_events, errors = load_and_validate_jsonl(args.input_file, strict=args.strict)
    
    # Print report
    print_validation_report(valid_events, errors)
    
    # Optionally save valid events
    if args.output and valid_events:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, 'w', encoding='utf-8') as f:
            for event in valid_events:
                f.write(event.model_dump_json() + '\n')
        print(f"\nSAVED: Saved {len(valid_events)} valid events to: {args.output}")
    
    # Exit code
    if errors and args.strict:
        exit(1)
    elif errors:
        print("\nWARNING: Validation completed with errors (use --strict to fail)")
        exit(0)
    else:
        print("\nSUCCESS: Validation successful!")
        exit(0)


if __name__ == "__main__":
    main()
