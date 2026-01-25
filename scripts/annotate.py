#!/usr/bin/env python3
"""
CandorLens Annotation Helper
Creates LanguageEvent records interactively or from batch input.

Usage:
    python annotate.py                    # Interactive mode
    python annotate.py --batch input.csv  # Batch from CSV
    python annotate.py --output data.jsonl # Specify output file
"""

import json
import argparse
from datetime import datetime
from pathlib import Path

# Schema enums
ATTACK_CLASSES = ["forced_continuity", "false_urgency", "fear_based_threat"]
CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW"]
COMMITMENT_STAGES = ["pre_commit", "commit", "post_commit"]
COMMITMENT_TYPES = ["financial", "account_access", "data_sharing", "subscription_enrollment"]
COERCION_VECTORS = [
    "temporal_pressure",
    "authority_claim",
    "threat_of_loss",
    "cost_obfuscation",
    "ambiguous_action_label",
    "urgency_without_basis"
]
EVIDENCE_TYPES = [
    "cta_label",
    "headline",
    "body_copy",
    "modal_text",
    "form_label",
    "toast_notification",
    "email_subject",
    "email_body"
]
JURISDICTIONS = ["FTC_Act_Section_5", "ROSCA", "CPRA_Dark_Pattern"]


def generate_event_id():
    """Generate unique event ID: evt_YYYYMMDD_NNN"""
    date_str = datetime.now().strftime("%Y%m%d")
    # Simple counter - in production, track this properly
    import random
    counter = random.randint(1, 999)
    return f"evt_{date_str}_{counter:03d}"


def prompt_choice(prompt: str, options: list, allow_multiple: bool = False) -> str | list:
    """Prompt user to select from options."""
    print(f"\n{prompt}")
    for i, opt in enumerate(options, 1):
        print(f"  {i}. {opt}")
    
    if allow_multiple:
        print("  (Enter numbers separated by commas, e.g., 1,3,4)")
        choices = input("> ").strip()
        indices = [int(x.strip()) - 1 for x in choices.split(",")]
        return [options[i] for i in indices if 0 <= i < len(options)]
    else:
        choice = int(input("> ").strip()) - 1
        return options[choice]


def prompt_text(prompt: str, required: bool = True) -> str:
    """Prompt user for text input."""
    print(f"\n{prompt}")
    value = input("> ").strip()
    while required and not value:
        print("  (Required field)")
        value = input("> ").strip()
    return value


def prompt_int(prompt: str, default: int = 0) -> int:
    """Prompt user for integer input."""
    print(f"\n{prompt} [default: {default}]")
    value = input("> ").strip()
    return int(value) if value else default


def create_language_event_interactive() -> dict:
    """Create a LanguageEvent through interactive prompts."""
    print("\n" + "="*60)
    print("CREATE NEW LANGUAGE EVENT")
    print("="*60)
    
    event = {
        "event_id": generate_event_id(),
        "source": "manual_label"
    }
    
    # Required fields
    event["text"] = prompt_text("Exact text being flagged (copy-paste from UI):")
    event["attack_class"] = prompt_choice("Attack class:", ATTACK_CLASSES)
    event["confidence"] = prompt_choice("Your confidence level:", CONFIDENCE_LEVELS)
    event["commitment_stage"] = prompt_choice("Commitment stage:", COMMITMENT_STAGES)
    event["commitment_type"] = prompt_choice("Commitment type:", COMMITMENT_TYPES)
    event["coercion_vector"] = prompt_choice("Coercion vector(s):", COERCION_VECTORS, allow_multiple=True)
    event["flow_step"] = prompt_int("Flow step index (0-indexed):")
    event["flow_id"] = prompt_text("Flow ID (e.g., 'netflix_cancel_2024'):")
    event["rationale"] = prompt_text("WHY is this manipulative? (min 10 chars):")
    
    # Optional but useful fields
    event["evidence_type"] = prompt_choice("Evidence type:", EVIDENCE_TYPES)
    event["jurisdiction_mapping"] = prompt_choice("Applicable regulations:", JURISDICTIONS, allow_multiple=True)
    event["risk_outcome"] = prompt_text("What harm could result?", required=False)
    
    print(f"\n✓ Created event: {event['event_id']}")
    return event


def save_event(event: dict, output_path: Path):
    """Append event to JSONL file."""
    with open(output_path, "a") as f:
        f.write(json.dumps(event) + "\n")
    print(f"✓ Saved to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="CandorLens Annotation Helper")
    parser.add_argument("--output", "-o", default="data/annotated/events.jsonl",
                        help="Output JSONL file path")
    parser.add_argument("--batch", "-b", help="Batch input CSV file")
    args = parser.parse_args()
    
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print("\n🔍 CandorLens Annotation Helper")
    print(f"   Output: {output_path}")
    
    if args.batch:
        print(f"   Batch mode from: {args.batch}")
        # TODO: Implement batch processing
        print("   Batch mode not yet implemented")
        return
    
    # Interactive mode
    while True:
        event = create_language_event_interactive()
        
        print("\nEvent preview:")
        print(json.dumps(event, indent=2))
        
        confirm = input("\nSave this event? [Y/n/edit]: ").strip().lower()
        if confirm in ["", "y", "yes"]:
            save_event(event, output_path)
        elif confirm == "edit":
            print("Edit not implemented - please re-enter")
            continue
        
        again = input("\nCreate another event? [Y/n]: ").strip().lower()
        if again in ["n", "no"]:
            break
    
    # Show summary
    if output_path.exists():
        count = sum(1 for _ in open(output_path))
        print(f"\n✓ Total events in {output_path}: {count}")


if __name__ == "__main__":
    main()
