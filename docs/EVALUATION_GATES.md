# Evaluation Gates

This document defines promotion gates for the **runtime pipeline**:

`extract_evidence_snippets -> BERT predict_batch -> should_emit_finding`

## Source of Truth

- Runtime eval command:
  - `python scripts/evaluate_production_flow.py --output ml/evaluation/production_flow_eval.json`
- Gate check command:
  - `python scripts/check_eval_gates.py --metrics ml/evaluation/production_flow_eval.json`

## Required Thresholds

- `macro_f1 >= 0.65`
- Per-class precision (`forced_continuity`, `false_urgency`, `fear_based_threat`) `>= 0.70`
- Per-class recall (`forced_continuity`, `false_urgency`, `fear_based_threat`) `>= 0.60`
- `benign_false_positives <= 2`

## Notes

- These gates align with proposal-level quality targets while remaining practical for the current 3-class-plus-gating runtime.
- Thresholds can be tuned with stakeholder approval, but changes must be documented in this file and reflected in `scripts/check_eval_gates.py`.
