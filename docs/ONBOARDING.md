# Onboarding

Getting started with CandorLens development.

---

## Deliverable 2 (D2) — Proposal Alignment

**Proposal (Feb 8):** *Data pipeline working, JSONL loader validated, 50+ events ingested.*

### 1. Data pipeline working

Per proposal §6 (Data Strategy): Playwright-based flow collector, manual annotation, JSONL output.

- **Flow capture:** `scripts/flow_collector.py` — Playwright-based capture of subscription/checkout/cancellation flows. Output: `data/raw/<flow_id>/` (screenshots + metadata).
- **Annotation:** `scripts/annotate.py` — Manual annotation of each text sample with attack class, confidence, and reasoning. Output: appends to `data/annotated/events.jsonl`.
- **Schema:** Each event follows the LanguageEvent schema in `taxonomy/language_event_schema.json`.

**Run from repo root:**
```bash
pip install playwright && playwright install chromium
python scripts/flow_collector.py --interactive
python scripts/annotate.py --output data/annotated/events.jsonl
```

### 2. JSONL loader validated

- **Loader:** `scripts/load_events.py` — Loads and validates JSONL; streams file line-by-line; supports `--validate-only` and `--strict-source`.
- **Validator:** `ml/data/validate_jsonl.py` — Pydantic-based validation with optional `--use-d2-loader` and `--strict-source`.

**Validate from repo root:**
```bash
python scripts/load_events.py
python scripts/load_events.py --validate-only
python -m ml.data.validate_jsonl data/annotated/events.jsonl
```

### 3. 50+ events ingested

- **Current:** `data/annotated/events.jsonl` contains **150** events (manual_label + ftc_complaint–sourced). The proposal target of 50+ events is met.
- **Add more:** Run `python scripts/annotate.py` or append valid LanguageEvent JSONL lines; re-run the loader to validate.

---

## Key files

| Path | Purpose |
|------|--------|
| `taxonomy/attack_classes.md` | Definitions of FCL, FU, FAT |
| `taxonomy/legal_mapping.json` | Class → regulation → citation |
| `taxonomy/language_event_schema.json` | LanguageEvent schema |
| `data/raw/` | Raw captured flows |
| `data/annotated/events.jsonl` | Labeled events |
| `scripts/flow_collector.py` | Playwright flow capture |
| `scripts/annotate.py` | Manual annotation |
| `scripts/load_events.py` | JSONL loader |
| `ml/data/validate_jsonl.py` | JSONL validator |
