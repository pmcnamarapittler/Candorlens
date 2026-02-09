# Onboarding

Getting started with CandorLens development.

---

## Deliverable 2 (D2) — Proposal Alignment

**Proposal (Feb 8):** *Data pipeline working, JSONL loader validated, 50+ events ingested.*

### 1. Data pipeline working

Per proposal §6 (Data Strategy): Playwright-based flow collector, manual annotation, JSONL output.

- **Flow capture:** `scripts/flow_collector.py` — Playwright-based capture of subscription/checkout/cancellation flows. Output: `data/raw/<flow_id>/` (screenshots + metadata).
- **Annotation:** `scripts/annotate.py` — Manual annotation of each text sample with attack class, confidence, and reasoning. Output: appends to `data/annotated/events.jsonl`.
- **Schema:** The strict LanguageEvent schema is defined in `taxonomy/language_event_schema.json`. The working dataset `data/annotated/events.jsonl` is relaxed (includes extra sources like `ftc_complaint` and varied `event_id` formats). Use `--schema-strict` for strict schema validation.

**Run from repo root:**
```bash
pip install playwright && playwright install chromium
python scripts/flow_collector.py --interactive
python scripts/annotate.py --output data/annotated/events.jsonl
```

### 2. JSONL loader validated

- **Loader:** `scripts/load_events.py` — Loads and validates JSONL; streams file line-by-line.
  - Default mode: Relaxed validation (accepts any `event_id`, allows `ftc_complaint` source)
  - `--strict-source`: Require source in (manual_label, model_prediction)
  - `--schema-strict`: Enforce schema `event_id` pattern (^evt_[0-9]{8}_[0-9]{3}$) and source enum
  - `--validate-only`: Exit with code 1 if any line is invalid
- **Validator:** `ml/data/validate_jsonl.py` — Pydantic-based validation (relaxed by default)
  - `--use-d2-loader`: Use the simple loader from scripts/load_events.py
  - `--schema-strict`: With --use-d2-loader, enforce strict schema validation
  - `--fail-fast`: Stop on first error instead of collecting all errors

**Validate from repo root:**
```bash
# Relaxed validation (default)
python scripts/load_events.py
python scripts/load_events.py --validate-only

# Schema-strict validation (enforces event_id pattern and source enum)
python scripts/load_events.py --schema-strict
python -m ml.data.validate_jsonl data/annotated/events.jsonl --use-d2-loader --schema-strict
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
