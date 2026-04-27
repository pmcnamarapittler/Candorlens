# CandorLens Handoff Checklist

Use this checklist for final handoff validation.

## 1) Repository and Environment
- [ ] Repo clones successfully.
- [ ] Python dependencies install with `pip install -r requirements.txt`.
- [ ] Frontend dependencies install with `npm ci` in `MVP UI/`.
- [ ] Required env vars are documented and available.

## 2) Local Runtime
- [ ] Backend starts with `uvicorn backend.api.main:app --reload`.
- [ ] Frontend starts with `npm run dev` in `MVP UI/`.
- [ ] `GET /` returns `{"status":"ok"}`.

## 3) API Contract Checks
- [ ] `POST /analyze-text` returns valid language-event response.
- [ ] `POST /analyze-flow` returns findings and flow context.
- [ ] `POST /collect-flow` returns website-specific flow events for the provided URL.
- [ ] `POST /report` and `GET /report` persist and return JSON report data.
- [ ] `POST /generate-report` returns `application/pdf`.

## 4) Frontend Functional Checks
- [ ] Onboarding completes and app loads.
- [ ] Overview scan action calls backend and appends findings.
- [ ] Findings tab renders runtime findings with status updates.
- [ ] Report download works from UI and yields a valid PDF file.
- [ ] Downloaded PDF content/layout matches current web report content for the same findings.

## 5) Quality Gates
- [ ] Backend tests pass: `python -m pytest backend/tests`.
- [ ] Frontend checks pass: `npm run lint && npm run test && npm run build` in `MVP UI/`.
- [ ] Runtime eval artifact refreshed: `python scripts/evaluate_production_flow.py --output ml/evaluation/production_flow_eval.json`.
- [ ] Runtime eval gates pass: `python scripts/check_eval_gates.py --metrics ml/evaluation/production_flow_eval.json`.
- [ ] CI workflows are present and green on PR/main.

## 6) Deployment Readiness
- [ ] Deployment commands in `docs/DEPLOYMENT.md` are followed successfully.
- [ ] Container App URL returns healthy status and passes smoke checks.
- [ ] Azure secrets required by `.github/workflows/deploy-azure.yml` are configured.

## 7) Final Handoff Artifacts
- [ ] `docs/MILESTONE_EVIDENCE.md` reviewed and accurate.
- [ ] `docs/DEMO_SCRIPT.md` is used to run stakeholder demo.
- [ ] Known limitations and follow-up work are communicated.

