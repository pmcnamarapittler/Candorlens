#!/usr/bin/env python3
"""
CandorLens Dataset Analyzer
Generate quality reports for annotated datasets.

Usage:
    python analyze_dataset.py <input.jsonl>
    python analyze_dataset.py data/annotated/events.jsonl --save-report report.txt
"""

import json
import argparse
from pathlib import Path
from collections import Counter, defaultdict
from typing import List, Dict


# --- Analysis Functions ---

def load_events(filepath: Path) -> List[dict]:
    """Load events from JSONL file."""
    events = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return events


def analyze_class_distribution(events: List[dict]) -> Dict:
    """Analyze attack class distribution."""
    classes = [e['attack_class'] for e in events]
    counts = Counter(classes)
    total = len(classes)
    
    distribution = {
        'counts': dict(counts),
        'percentages': {k: (v/total)*100 for k, v in counts.items()},
        'total': total
    }
    return distribution


def analyze_confidence_distribution(events: List[dict]) -> Dict:
    """Analyze confidence level distribution."""
    confidence_levels = [e['confidence'] for e in events]
    counts = Counter(confidence_levels)
    
    return {
        'counts': dict(counts),
        'percentages': {k: (v/len(events))*100 for k, v in counts.items()}
    }


def check_duplicates(events: List[dict]) -> Dict:
    """Check for duplicate text and event IDs."""
    texts = [e['text'] for e in events]
    event_ids = [e['event_id'] for e in events]
    
    # Find duplicates
    text_counts = Counter(texts)
    duplicate_texts = {text: count for text, count in text_counts.items() if count > 1}
    
    id_counts = Counter(event_ids)
    duplicate_ids = {eid: count for eid, count in id_counts.items() if count > 1}
    
    return {
        'duplicate_texts': len(duplicate_texts),
        'duplicate_text_examples': list(duplicate_texts.items())[:5],
        'duplicate_ids': len(duplicate_ids),
        'duplicate_id_examples': list(duplicate_ids.items())[:5]
    }


def analyze_field_coverage(events: List[dict]) -> Dict:
    """Check which optional fields are populated."""
    optional_fields = ['evidence_type', 'jurisdiction_mapping', 'risk_outcome', 'case_citation']
    
    coverage = {}
    for field in optional_fields:
        present = sum(1 for e in events if e.get(field))
        coverage[field] = {
            'count': present,
            'percentage': (present / len(events)) * 100
        }
    
    return coverage


def analyze_text_lengths(events: List[dict]) -> Dict:
    """Analyze text length distribution."""
    lengths = [len(e['text']) for e in events]
    word_counts = [len(e['text'].split()) for e in events]
    
    return {
        'char_length': {
            'min': min(lengths),
            'max': max(lengths),
            'avg': sum(lengths) / len(lengths),
            'median': sorted(lengths)[len(lengths)//2]
        },
        'word_count': {
            'min': min(word_counts),
            'max': max(word_counts),
            'avg': sum(word_counts) / len(word_counts),
            'median': sorted(word_counts)[len(word_counts)//2]
        },
        'over_512_tokens': sum(1 for wc in word_counts if wc > 100)  # Rough estimate (BERT limit ~512 tokens)
    }


def analyze_flows(events: List[dict]) -> Dict:
    """Analyze flow-level statistics."""
    flows = defaultdict(list)
    for event in events:
        flows[event['flow_id']].append(event)
    
    flow_sizes = [len(events) for events in flows.values()]
    
    return {
        'unique_flows': len(flows),
        'events_per_flow': {
            'min': min(flow_sizes) if flow_sizes else 0,
            'max': max(flow_sizes) if flow_sizes else 0,
            'avg': sum(flow_sizes) / len(flow_sizes) if flow_sizes else 0
        },
        'flow_ids': list(flows.keys())
    }


def analyze_coercion_vectors(events: List[dict]) -> Dict:
    """Analyze coercion vector usage."""
    all_vectors = []
    for event in events:
        all_vectors.extend(event['coercion_vector'])
    
    counts = Counter(all_vectors)
    
    return {
        'counts': dict(counts),
        'most_common': counts.most_common(3)
    }


# --- Report Generation ---

def generate_report(events: List[dict]) -> str:
    """Generate comprehensive analysis report."""
    
    report_lines = []
    report_lines.append("="*70)
    report_lines.append("CANDORLENS DATASET ANALYSIS REPORT")
    report_lines.append("="*70)
    report_lines.append(f"\nSTATS: Total Events: {len(events)}\n")
    
    # Class distribution
    class_dist = analyze_class_distribution(events)
    report_lines.append("─" * 70)
    report_lines.append("ATTACK CLASS DISTRIBUTION")
    report_lines.append("─" * 70)
    for cls, count in class_dist['counts'].items():
        pct = class_dist['percentages'][cls]
        report_lines.append(f"  {cls:25s} {count:3d} events ({pct:5.1f}%)")
    
    # Check for class imbalance
    pcts = list(class_dist['percentages'].values())
    if max(pcts) / min(pcts) > 2:
        report_lines.append("\n  WARNING: CLASS IMBALANCE DETECTED (consider stratified sampling)")
    else:
        report_lines.append("\n  OK: Class distribution is reasonably balanced")
    
    # Confidence distribution
    conf_dist = analyze_confidence_distribution(events)
    report_lines.append("\n" + "─" * 70)
    report_lines.append("CONFIDENCE LEVELS")
    report_lines.append("─" * 70)
    for level in ['HIGH', 'MEDIUM', 'LOW']:
        count = conf_dist['counts'].get(level, 0)
        pct = conf_dist['percentages'].get(level, 0)
        report_lines.append(f"  {level:10s} {count:3d} events ({pct:5.1f}%)")
    
    # Duplicates
    duplicates = check_duplicates(events)
    report_lines.append("\n" + "─" * 70)
    report_lines.append("DUPLICATE DETECTION")
    report_lines.append("─" * 70)
    report_lines.append(f"  Duplicate texts:     {duplicates['duplicate_texts']}")
    report_lines.append(f"  Duplicate event IDs: {duplicates['duplicate_ids']}")
    
    if duplicates['duplicate_texts'] > 0:
        report_lines.append("\n  WARNING: Duplicate text examples:")
        for text, count in duplicates['duplicate_text_examples']:
            report_lines.append(f"    - \"{text[:60]}...\" ({count}x)")
    
    if duplicates['duplicate_ids'] > 0:
        report_lines.append("\n  WARNING: Duplicate IDs found (FIX REQUIRED)")
    
    # Field coverage
    coverage = analyze_field_coverage(events)
    report_lines.append("\n" + "─" * 70)
    report_lines.append("OPTIONAL FIELD COVERAGE")
    report_lines.append("─" * 70)
    for field, stats in coverage.items():
        report_lines.append(f"  {field:25s} {stats['count']:3d}/{len(events)} ({stats['percentage']:5.1f}%)")
    
    # Text lengths
    text_stats = analyze_text_lengths(events)
    report_lines.append("\n" + "─" * 70)
    report_lines.append("TEXT LENGTH STATISTICS")
    report_lines.append("─" * 70)
    report_lines.append(f"  Character length:")
    report_lines.append(f"    Min: {text_stats['char_length']['min']}, Max: {text_stats['char_length']['max']}, Avg: {text_stats['char_length']['avg']:.1f}")
    report_lines.append(f"  Word count:")
    report_lines.append(f"    Min: {text_stats['word_count']['min']}, Max: {text_stats['word_count']['max']}, Avg: {text_stats['word_count']['avg']:.1f}")
    report_lines.append(f"  Potentially over BERT limit (>100 words): {text_stats['over_512_tokens']}")
    
    # Flow statistics
    flow_stats = analyze_flows(events)
    report_lines.append("\n" + "─" * 70)
    report_lines.append("FLOW STATISTICS")
    report_lines.append("─" * 70)
    report_lines.append(f"  Unique flows: {flow_stats['unique_flows']}")
    report_lines.append(f"  Events per flow: Min={flow_stats['events_per_flow']['min']}, Max={flow_stats['events_per_flow']['max']}, Avg={flow_stats['events_per_flow']['avg']:.1f}")
    
    # Coercion vectors
    coercion_stats = analyze_coercion_vectors(events)
    report_lines.append("\n" + "─" * 70)
    report_lines.append("COERCION VECTORS (Top 3)")
    report_lines.append("─" * 70)
    for vector, count in coercion_stats['most_common']:
        report_lines.append(f"  {vector:30s} {count:3d} times")
    
    # Recommendations
    report_lines.append("\n" + "="*70)
    report_lines.append("RECOMMENDATIONS")
    report_lines.append("="*70)
    
    if len(events) < 50:
        report_lines.append("  NOTE: Annotate more data (target: 50+ events for D2 milestone)")
    
    if duplicates['duplicate_ids'] > 0:
        report_lines.append("  ERROR: Fix duplicate event IDs before training")
    
    if text_stats['over_512_tokens'] > 0:
        report_lines.append(f"  WARNING: {text_stats['over_512_tokens']} events may exceed BERT token limit (consider truncation)")
    
    if len(events) >= 50:
        report_lines.append("  PASS: Dataset size meets D2 milestone requirement")
    
    report_lines.append("\n" + "="*70)
    
    return "\n".join(report_lines)


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(description="Analyze CandorLens dataset quality")
    parser.add_argument(
        'input_file',
        type=Path,
        help='Input JSONL file'
    )
    parser.add_argument(
        '--save-report',
        type=Path,
        help='Save report to file'
    )
    
    args = parser.parse_args()
    
    # Load events
    events = load_events(args.input_file)
    
    if not events:
        print("ERROR: No valid events found in file")
        exit(1)
    
    # Generate report
    report = generate_report(events)
    
    # Print to console
    print(report)
    
    # Optionally save
    if args.save_report:
        args.save_report.parent.mkdir(parents=True, exist_ok=True)
        with open(args.save_report, 'w') as f:
            f.write(report)
        print(f"\nSAVED: Report saved to: {args.save_report}")


if __name__ == "__main__":
    main()
