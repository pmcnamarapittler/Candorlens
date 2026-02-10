#!/usr/bin/env python3
"""
CandorLens Text Preprocessor
Cleans and normalizes text fields for model training.

Usage:
    python preprocess.py <input.jsonl> <output.jsonl>
    python preprocess.py data/annotated/events.jsonl data/preprocessed/events.jsonl
"""

import re
import json
import argparse
from pathlib import Path
from typing import List, Dict


# --- Text Cleaning Functions ---

def normalize_whitespace(text: str) -> str:
    """Normalize whitespace (multiple spaces → single space, trim)."""
    # Replace tabs, newlines with spaces
    text = text.replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')
    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text)
    # Trim
    return text.strip()


def handle_html_entities(text: str) -> str:
    """Convert common HTML entities to their character equivalents."""
    replacements = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&rsquo;': "'",
        '&lsquo;': "'",
        '&rdquo;': '"',
        '&ldquo;': '"',
        '&mdash;': '—',
        '&ndash;': '–',
    }
    for entity, char in replacements.items():
        text = text.replace(entity, char)
    return text


def normalize_punctuation(text: str) -> str:
    """Normalize excessive punctuation."""
    # Collapse repeated punctuation (e.g., "!!!" → "!")
    text = re.sub(r'([!?.]){3,}', r'\1', text)
    # Normalize ellipsis
    text = re.sub(r'\.{3,}', '...', text)
    return text


def normalize_quotes(text: str) -> str:
    """Normalize different quote styles to standard ASCII."""
    # Map common smart/curly quotes to straight ASCII (Unicode escapes for portability)
    replacements = {
        "\u201C": '"',  # left double quotation mark
        "\u201D": '"',   # right double quotation mark
        "\u201E": '"',   # double low-9 quotation mark
        "\u2018": "'",   # left single quotation mark
        "\u2019": "'",   # right single quotation mark / apostrophe
        "\u201B": "'",   # single high-reversed-9 quotation mark
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text


def preprocess_text(text: str, preserve_case: bool = True) -> str:
    """
    Main preprocessing pipeline.
    
    Args:
        text: Raw text to preprocess
        preserve_case: If False, lowercase the text (default: True, because case matters)
    
    Returns:
        Cleaned text
    """
    # Apply cleaning steps
    text = handle_html_entities(text)
    text = normalize_quotes(text)
    text = normalize_whitespace(text)
    text = normalize_punctuation(text)
    
    # Optional: lowercase (BERT can handle casing, so we preserve by default)
    if not preserve_case:
        text = text.lower()
    
    return text


# --- JSONL Processing ---

def preprocess_jsonl(
    input_path: Path,
    output_path: Path,
    preserve_case: bool = True,
    add_normalized_field: bool = True
):
    """
    Preprocess all events in a JSONL file.
    
    Args:
        input_path: Input JSONL file
        output_path: Output JSONL file
        preserve_case: Whether to preserve case (default: True)
        add_normalized_field: If True, add 'text_normalized' field and keep 'text' original.
                               If False, overwrite 'text' field.
    """
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"LOADING: Reading: {input_path}")
    
    events = []
    with open(input_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            
            try:
                event = json.loads(line)
                
                # Preprocess text
                original_text = event['text']
                cleaned_text = preprocess_text(original_text, preserve_case=preserve_case)
                
                if add_normalized_field:
                    # Keep original, add normalized
                    event['text_normalized'] = cleaned_text
                else:
                    # Overwrite original
                    event['text'] = cleaned_text
                
                events.append(event)
                
            except (json.JSONDecodeError, KeyError) as e:
                print(f"WARNING: Line {line_num}: Skipping malformed event: {e}")
                continue
    
    # Write preprocessed events
    print(f"SAVED: Writing: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        for event in events:
            f.write(json.dumps(event, ensure_ascii=False) + '\n')
    
    print(f"OK: Preprocessed {len(events)} events")
    
    # Show example
    if events:
        print("\nNOTE: Example transformation:")
        example = events[0]
        print(f"  Original: {example['text'][:80]}...")
        if add_normalized_field:
            print(f"  Cleaned:  {example['text_normalized'][:80]}...")
        else:
            print(f"  Cleaned:  {example['text'][:80]}...")


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(description="Preprocess CandorLens JSONL files")
    parser.add_argument(
        'input_file',
        type=Path,
        help='Input JSONL file'
    )
    parser.add_argument(
        'output_file',
        type=Path,
        help='Output JSONL file'
    )
    parser.add_argument(
        '--lowercase',
        action='store_true',
        help='Convert text to lowercase (default: preserve case)'
    )
    parser.add_argument(
        '--overwrite-text',
        action='store_true',
        help='Overwrite "text" field instead of adding "text_normalized"'
    )
    
    args = parser.parse_args()
    
    preprocess_jsonl(
        input_path=args.input_file,
        output_path=args.output_file,
        preserve_case=not args.lowercase,
        add_normalized_field=not args.overwrite_text
    )
    
    print("\nSUCCESS: Preprocessing complete!")


if __name__ == "__main__":
    main()
