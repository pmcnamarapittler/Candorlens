# Classifier Policy

## Current Runtime Strategy (Non-Radical Baseline)

CandorLens currently runs a **3-class BERT classifier**:

- `forced_continuity`
- `false_urgency`
- `fear_based_threat`

Runtime prediction handling is intentionally conservative:

1. Text is chunked into evidence snippets.
2. BERT predicts class/confidence per snippet.
3. Confidence + lexical evidence gates suppress weak predictions.
4. Suppressed snippets are treated as **benign by gating** for report output.

This policy preserves the existing architecture and avoids disruptive model migration.

## BENIGN_BY_GATING

`benign` is not a native model label in the deployed checkpoint.
Instead, benign outcomes are inferred when no snippet passes gates.

Pros:
- Lower false-positive report noise.
- No immediate retraining requirement.

Tradeoff:
- It is not equivalent to a true 4-class classifier with explicit `benign` supervision.

## Future Path (Phased, Optional)

Only migrate to a 4-class model (`+ benign`) when evidence justifies it:

- Production-pipeline eval consistently misses targets.
- Error analysis shows gating cannot recover required precision/recall balance.
- Stakeholder-approved model promotion criteria are unmet.

Until then, keep 3-class + gating as the production baseline.
