# CandorLens Deployment Guide (Backend)

This guide documents a reproducible deployment path for the FastAPI backend container.

## 1) Prerequisites

- Docker installed locally
- Azure subscription with Container Apps enabled
- Optional: Azure Blob Storage connection string for `/report` persistence
- Playwright Chromium runtime available for `/collect-flow` and browser-rendered `/generate-report`

## 2) Required Environment Variables

- `MODEL_PATH` (default resolves to `ml/models/bert_v1` in container)
- `TAXONOMY_DIR` (default resolves to `taxonomy`)
- `REPORT_STORAGE_BACKEND` (`local` or `azure`)
- `REPORT_STORAGE_PATH` (required when `REPORT_STORAGE_BACKEND=local`)
- `AZURE_STORAGE_CONNECTION_STRING` (required when `REPORT_STORAGE_BACKEND=azure`)

## 3) Local Docker Validation

```bash
docker build -t candorlens-api .
docker run --rm -p 8000:8000 \
  -e REPORT_STORAGE_BACKEND=local \
  -e REPORT_STORAGE_PATH=data/reports \
  candorlens-api
```

### Smoke checks

```bash
curl -s http://localhost:8000/

curl -s -X POST http://localhost:8000/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text":"Start your free trial now"}'

curl -s -X POST http://localhost:8000/collect-flow \
  -H "Content-Type: application/json" \
  -d '{"website_url":"https://example.com","max_steps":6}'

curl -s -X POST http://localhost:8000/generate-report \
  -H "Content-Type: application/json" \
  -d '{"website_url":"https://example.com","company_name":"Example Inc","findings":[{"id":"evt_001","title":"Forced Continuity Language","severity":"HIGH","regulation":"ROSCA","confidence":0.9}]}' \
  --output candorlens_report.pdf
```

Expected:
- `/` returns `{"status":"ok"}`
- `/analyze-text` returns a classified response
- `/collect-flow` returns website-specific flow events
- `/generate-report` returns a valid PDF file

## 4) Azure Container Apps Deployment (Deterministic CLI Path)

Set your environment values once:

```bash
export RESOURCE_GROUP="<resource-group>"
export LOCATION="<azure-region>"
export ACR_NAME="<acr-name>"
export ACR_LOGIN_SERVER="<acr-name>.azurecr.io"
export CONTAINER_APP_NAME="<container-app-name>"
export CONTAINER_ENV_NAME="<container-app-environment-name>"
export STORAGE_CONNECTION_STRING="<azure-storage-connection-string>"
export IMAGE_TAG="${ACR_LOGIN_SERVER}/candorlens-api:$(git rev-parse --short HEAD)"
```

Authenticate and build/push image:

```bash
az login
az acr login --name "${ACR_NAME}"
docker build -t "${IMAGE_TAG}" .
docker push "${IMAGE_TAG}"
```

Create or update the Container App:

```bash
az containerapp up \
  --name "${CONTAINER_APP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --environment "${CONTAINER_ENV_NAME}" \
  --image "${IMAGE_TAG}" \
  --target-port 8000 \
  --ingress external \
  --env-vars \
    MODEL_PATH=/app/ml/models/bert_v1 \
    TAXONOMY_DIR=/app/taxonomy \
    REPORT_STORAGE_BACKEND=azure \
    AZURE_STORAGE_CONNECTION_STRING="${STORAGE_CONNECTION_STRING}"
```

Get the public URL:

```bash
APP_URL="$(az containerapp show -n "${CONTAINER_APP_NAME}" -g "${RESOURCE_GROUP}" --query properties.configuration.ingress.fqdn -o tsv)"
echo "https://${APP_URL}"
```

Run smoke checks against hosted URL:

```bash
curl -s "https://${APP_URL}/"
curl -s -X POST "https://${APP_URL}/analyze-text" \
  -H "Content-Type: application/json" \
  -d '{"text":"Start your free trial now"}'
curl -s -X POST "https://${APP_URL}/generate-report" \
  -H "Content-Type: application/json" \
  -d '{"website_url":"https://example.com","company_name":"Example Inc","findings":[{"id":"evt_001","title":"Forced Continuity Language","severity":"HIGH","regulation":"ROSCA","confidence":0.9}]}' \
  --output candorlens_report_hosted.pdf
```

## 5) GitHub Actions Deployment Workflow

The workflow `.github/workflows/deploy-azure.yml` uses:

- `AZURE_CREDENTIALS`
- `ACR_NAME`
- `ACR_LOGIN_SERVER`
- `AZURE_CONTAINER_APP_NAME`
- `AZURE_RESOURCE_GROUP`
- `AZURE_STORAGE_CONNECTION_STRING`

Trigger via manual `workflow_dispatch` after CI passes.

