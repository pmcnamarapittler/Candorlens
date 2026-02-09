#!/usr/bin/env python3
"""
CandorLens Flow Aggregator
Aggregate events by flow_id and compute flow-level features.

Usage:
    python aggregate_flows.py <input.jsonl>
    python aggregate_flows.py data/annotated/events.jsonl --output flows.json
"""

import json
import argparse
from pathlib import Path
from typing import List, Dict
from collections import defaultdict, Counter


# --- Flow Aggregation ---

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


def aggregate_by_flow(events: List[dict]) -> Dict[str, dict]:
    """
    Group events by flow_id and compute flow-level features.
    
    Returns:
        Dictionary mapping flow_id to flow statistics
    """
    flows = defaultdict(list)
    
    # Group events by flow_id
    for event in events:
        flows[event['flow_id']].append(event)
    
    # Sort events within each flow by flow_step
    for flow_id in flows:
        flows[flow_id] = sorted(flows[flow_id], key=lambda e: e['flow_step'])
    
    # Compute flow-level statistics
    flow_stats = {}
    
    for flow_id, flow_events in flows.items():
        # Extract attack classes
        attack_classes = [e['attack_class'] for e in flow_events]
        attack_counts = Counter(attack_classes)
        
        # Extract confidence levels
        confidence_levels = [e['confidence'] for e in flow_events]
        
        # Coercion vectors (flatten list of lists)
        all_coercion_vectors = []
        for event in flow_events:
            all_coercion_vectors.extend(event['coercion_vector'])
        
        # Commitment stages
        commitment_stages = [e['commitment_stage'] for e in flow_events]
        
        flow_stats[flow_id] = {
            'flow_id': flow_id,
            'total_steps': len(flow_events),
            'event_ids': [e['event_id'] for e in flow_events],
            
            # Attack statistics
            'attack_classes': list(set(attack_classes)),
            'attack_class_counts': dict(attack_counts),
            'dominant_attack_class': attack_counts.most_common(1)[0][0] if attack_counts else None,
            'attack_diversity': len(set(attack_classes)),  # Number of unique attack types
            'attack_density': len(flow_events),  # Attacks per step (all events are attacks)
            
            # Confidence statistics
            'confidence_levels': confidence_levels,
            'high_confidence_count': sum(1 for c in confidence_levels if c == 'HIGH'),
            'max_confidence': max(confidence_levels, key=['LOW', 'MEDIUM', 'HIGH'].index),
            
            # Coercion vectors
            'coercion_vectors_used': list(set(all_coercion_vectors)),
            'coercion_vector_counts': dict(Counter(all_coercion_vectors)),
            
            # Commitment stage distribution
            'commitment_stages': list(set(commitment_stages)),
            'commitment_stage_counts': dict(Counter(commitment_stages)),
            
            # Text aggregation (optional: concatenate all text)
            'concatenated_text': ' [STEP] '.join(e['text'] for e in flow_events),
            
            # Events (full data)
            'events': flow_events
        }
    
    return flow_stats


def print_flow_summary(flow_stats: Dict[str, dict]):
    """Print summary of flow aggregation."""
    print("\n" + "="*70)
    print("FLOW AGGREGATION SUMMARY")
    print("="*70)
    print(f"\nTotal unique flows: {len(flow_stats)}")
    
    # Overall statistics
    all_steps = [flow['total_steps'] for flow in flow_stats.values()]
    print(f"\nSteps per flow:")
    print(f"  Min: {min(all_steps)}, Max: {max(all_steps)}, Avg: {sum(all_steps)/len(all_steps):.1f}")
    
    # Flow details
    print("\n" + "─"*70)
    print("FLOW DETAILS")
    print("─"*70)
    
    for flow_id, flow in sorted(flow_stats.items()):
        print(f"\nSTATS: {flow_id}")
        print(f"   Steps: {flow['total_steps']}")
        print(f"   Attack classes: {', '.join(flow['attack_classes'])}")
        print(f"   Dominant: {flow['dominant_attack_class']} ({flow['attack_class_counts'][flow['dominant_attack_class']]} events)")
        print(f"   High confidence: {flow['high_confidence_count']}/{flow['total_steps']}")
        print(f"   Coercion vectors: {len(flow['coercion_vectors_used'])} unique")
    
    print("\n" + "="*70)


# --- CLI ---

def main():
    parser = argparse.ArgumentParser(description="Aggregate events by flow")
    parser.add_argument(
        'input_file',
        type=Path,
        help='Input JSONL file'
    )
    parser.add_argument(
        '--output',
        type=Path,
        help='Output JSON file for flow statistics'
    )
    parser.add_argument(
        '--no-events',
        action='store_true',
        help='Exclude full event data from output (save space)'
    )
    
    args = parser.parse_args()
    
    # Load events
    print(f"LOADING: Loading events from: {args.input_file}")
    events = load_events(args.input_file)
    
    if not events:
        print("ERROR: No events found")
        exit(1)
    
    print(f"OK: Loaded {len(events)} events")
    
    # Aggregate by flow
    print("\nPROCESSING: Aggregating by flow...")
    flow_stats = aggregate_by_flow(events)
    
    # Print summary
    print_flow_summary(flow_stats)
    
    # Optionally save
    if args.output:
        # Remove full events if requested (to reduce file size)
        if args.no_events:
            for flow in flow_stats.values():
                del flow['events']
        
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, 'w') as f:
            json.dump(flow_stats, f, indent=2, ensure_ascii=False)
        
        print(f"\nSAVED: Flow statistics saved to: {args.output}")
    
    print("\nSUCCESS: Flow aggregation complete!")


if __name__ == "__main__":
    main()
