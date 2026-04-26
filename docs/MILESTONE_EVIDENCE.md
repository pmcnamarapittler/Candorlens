# Milestone Evidence (D4.5 -> D7)

This document maps implemented artifacts to milestone acceptance criteria.

## D4.5 - Report Generator + Dashboard Integration

### Evidence
- Backend PDF endpoint:
  - `POST /generate-report` in `backend/api/routes/report.py`
  - PDF rendering service in `backend/services/report_generator.py`
- Frontend report download wiring:
  - `MVP UI/src/app.tsx`
  - `MVP UI/src/components/ReportView.tsx`
- API contract docs:
  - `docs/API.md`

### Verification
```bash
curl -s -X POST http://localhost:8000/generate-report \
  -H "Content-Type: application/json" \
  -d '{"website_url":"https://example.com","company_name":"Example Inc","findings":[{"id":"evt_001","title":"Forced Continuity Language","severity":"HIGH","regulation":"ROSCA","confidence":0.9}]}' \
  --output candorlens_report.pdf
```

## D5 - Full Pipeline (Backend-Driven UI Flow)

### Evidence
- Frontend scan flow wired to backend API:
  - `MVP UI/src/services/apiClient.ts`
  - `MVP UI/src/services/scannerService.ts`
  - `MVP UI/src/components/DashboardHome.tsx`
  - `MVP UI/src/app.tsx`
- Firecrawl runtime collection endpoint:
  - `POST /collect-flow` in `backend/api/routes/analyze.py`
  - runtime collector in `backend/services/flow_runtime_ingest.py`
- Findings view consumes runtime findings state:
  - `MVP UI/src/components/FindingsList.tsx`

### Verification
1. Start backend (`uvicorn backend.api.main:app --reload`).
2. Start frontend (`npm run dev` in `MVP UI/`).
3. Run scan from Overview and confirm findings appear in Findings tab.
4. Download report from Overview/Report tab and open resulting PDF.

## D6 - Feature Completion + Quality Gates

### Evidence
- Backend tests:
  - `backend/tests/test_analyze_routes.py`
  - `backend/tests/test_flow_routes.py`
  - `backend/tests/test_report_routes.py`
  - `backend/tests/test_blob_reports.py`
  - `backend/tests/test_pdf_render_parity_smoke.py`
- Frontend tests:
  - `MVP UI/src/components/DashboardHome.test.tsx`
  - `MVP UI/src/components/ReportView.test.tsx`
- Frontend test tooling:
  - `MVP UI/vitest.config.ts`
  - `MVP UI/src/test/setup.ts`
- CI workflows:
  - `.github/workflows/backend-ci.yml`
  - `.github/workflows/frontend-ci.yml`

### Verification
```bash
python -m pytest backend/tests
cd "MVP UI" && npm run lint && npm run test && npm run build
```

## D7 - Handoff Readiness

### Evidence
- API runbook: `docs/API.md`
- Deployment runbook: `docs/DEPLOYMENT.md`
- Handoff checklist: `docs/HANDOFF_CHECKLIST.md`
- Demo script: `docs/DEMO_SCRIPT.md`

### Verification
- A new teammate should be able to:
  1) Run backend and frontend locally,
  2) Execute smoke checks,
  3) Trigger scan + findings + PDF flow,
  4) Follow Azure deployment runbook commands.

