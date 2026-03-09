# CandorLens API

## Overview

FastAPI backend for CandorLens: analyze text or flows for illegal language patterns (Forced Continuity, False Urgency, Fear-Based Account Threats), with legal mapping (regulation, citation, enforcement precedent, risk severity, remediation).

- **Python:** 3.11
- **Base URL:** `http://localhost:8000` (local) or your Azure Container Apps URL.

---

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MODEL_PATH` | Path to BERT model directory (e.g. `ml/models/bert_v1`). | Repo-relative `ml/models/bert_v1` |
| `TAXONOMY_DIR` | Path to taxonomy directory (contains `legal_mapping.json`). | Repo-relative `taxonomy` |
| `REPORT_STORAGE_BACKEND` | Where to store reports: `azure` or `local`. | `azure` |
| `REPORT_STORAGE_PATH` | For `local` backend: directory for report JSON files. | `data/reports` |
| `AZURE_STORAGE_CONNECTION_STRING` | For `azure` backend: connection string to blob storage. | — |

No secrets or keys are read from code; set env in deployment (e.g. Azure Container Apps configuration).

**Local storage:** Set `REPORT_STORAGE_BACKEND=local` to store reports as JSON files in `data/reports/` (or `REPORT_STORAGE_PATH`). No Azure credentials needed.

---

## Analyze endpoints

### POST /analyze-text

Analyze a single string. Returns one finding with detected class, confidence, and legal mapping.

**Request body:**

```json
{
  "text": "Your account will be suspended unless you verify within 24 hours."
}
```

**Response:** One object that conforms to the [Language Event Schema](taxonomy/language_event_schema.json) plus a nested `legal_mapping`:

- **Schema fields:** `event_id`, `text`, `attack_class`, `confidence` (HIGH/MEDIUM/LOW), `commitment_stage`, `commitment_type`, `coercion_vector`, `flow_step`, `flow_id`, `rationale`, `source` (`"model_prediction"`), and optional `jurisdiction_mapping`, `risk_outcome`, `evidence_type`.
- **legal_mapping:**
  - `regulations`: list of `{ "id", "name", "citation", ... }`
  - `enforcement_precedent`: list of `{ "case", "year", "settlement_usd" or "status", ... }`
  - `risk_severity`: `"high"` | `"medium"` | `"low"`
  - `remediation_guidance`: string

**Example response (truncated):**

```json
{
  "event_id": "evt_20250307_000",
  "text": "Your account will be suspended unless you verify within 24 hours.",
  "attack_class": "fear_based_threat",
  "confidence": "HIGH",
  "commitment_stage": "commit",
  "commitment_type": "account_access",
  "coercion_vector": ["threat_of_loss"],
  "flow_step": 0,
  "flow_id": "single",
  "rationale": "Do not imply account suspension...",
  "source": "model_prediction",
  "jurisdiction_mapping": ["FTC_Act_Section_5", "CPRA_Dark_Pattern"],
  "legal_mapping": {
    "regulations": [
      { "id": "FTC_Act_Section_5", "name": "FTC Act Section 5", "citation": "15 U.S.C. § 45(a)" }
    ],
    "enforcement_precedent": [
      { "case": "FTC v. Credit Karma", "year": 2022, "settlement_usd": 3000000 }
    ],
    "risk_severity": "high",
    "remediation_guidance": "Do not imply account suspension..."
  }
}
```

---

### POST /analyze-flow

Analyze an array of language events (e.g. from a flow). Returns aggregated findings and flow context.

**Request body:**

```json
{
  "events": [
    { "text": "Start your free trial today.", "flow_id": "checkout_1", "flow_step": 0 },
    { "text": "Only 2 left at this price!", "flow_id": "checkout_1", "flow_step": 1 }
  ]
}
```

**Response:**

- **findings:** Array of objects; each has the same shape as a single `/analyze-text` response (Language Event fields + `legal_mapping`), with `flow_id` and `flow_step` from the request.
- **flow_context:**
  - `flow_id`: from request
  - `total_events`: number of findings
  - `summary`: counts by `attack_class`, e.g. `{ "forced_continuity": 1, "false_urgency": 1 }`

---

## Other endpoints

- **GET /** — Health check (`{"status": "ok"}`).
- **POST /report** — Save a report (URL, summary, labels) to Azure Blob Storage.
- **GET /report?url=...** — Retrieve a report by URL.

---

## Deployment (Docker)

Image is built with Python 3.11; BERT is preloaded at startup (lifespan) to target P95 under 500 ms.

```bash
# Build (ensure ml/models/bert_v1 exists or set MODEL_PATH at run)
docker build -t candorlens-api .

# Run
docker run -p 8000:8000 -e MODEL_PATH=/app/ml/models/bert_v1 candorlens-api
```

For Azure Container Apps, set `MODEL_PATH` and `TAXONOMY_DIR` if you override default paths; configure `AZURE_STORAGE_CONNECTION_STRING` for report storage.
