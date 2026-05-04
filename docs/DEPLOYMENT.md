# CandorLens Deployment Guide (Backend)

This guide documents a reproducible deployment path for the FastAPI backend container.

## 1) Prerequisites

- Docker installed locally
- Azure subscription with Container Apps enabled
- Optional: Azure Blob Storage connection string for `/report` persistence
- External BERT artifacts available at `MODEL_PATH` or `ml/models/bert_v1`
- Playwright Chromium runtime available for browser-rendered `/generate-report`

## 2) Required Environment Variables

- `MODEL_PATH` (default resolves to `ml/models/bert_v1` in container)
- `TAXONOMY_DIR` (default resolves to `taxonomy`)
- `REPORT_STORAGE_BACKEND` (`local` or `azure`)
- `REPORT_STORAGE_PATH` (required when `REPORT_STORAGE_BACKEND=local`)
- `AZURE_STORAGE_CONNECTION_STRING` (required when `REPORT_STORAGE_BACKEND=azure`)
- `FIRECRAWL_API_KEY` (required for `/collect-flow`)

The model directory is external/private and is not committed to git. It must contain a trained HuggingFace BERT classifier with `config.json`, `label_map.json`, `vocab.txt`, and either `pytorch_model.bin` or `model.safetensors`.

Validate artifacts before starting the API:

```bash
python scripts/verify_model_artifacts.py --model-path ml/models/bert_v1
```

## 3) Local Docker Validation

```bash
docker build -t candorlens-api .
docker run --rm -p 8000:8000 \
  -e REPORT_STORAGE_BACKEND=local \
  -e REPORT_STORAGE_PATH=data/reports \
  -e MODEL_PATH=/app/ml/models/bert_v1 \
  -e FIRECRAWL_API_KEY="<firecrawl-api-key>" \
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
- `/collect-flow` returns website-specific flow events when `FIRECRAWL_API_KEY` is configured
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
export FIRECRAWL_API_KEY="<firecrawl-api-key>"
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
    AZURE_STORAGE_CONNECTION_STRING="${STORAGE_CONNECTION_STRING}" \
    FIRECRAWL_API_KEY="${FIRECRAWL_API_KEY}"
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
- `FIRECRAWL_API_KEY`

Trigger via manual `workflow_dispatch` after CI passes.

## 6) Public website (frontend + API on Azure)

You need **two URLs**: a **hosted API** (Container Apps) and a **hosted static UI** (build output of `MVP UI`). The UI reads the API base from **`VITE_API_BASE_URL`** at **build time** (see `MVP UI/.env.example`).

### Build the dashboard against your hosted API

From repo root (replace with your Container App URL, no trailing slash):

```bash
cd "MVP UI"
cp .env.example .env.local
# Edit .env.local: set VITE_API_BASE_URL=https://<your-api-hostname>
npm ci
npm run build
```

Upload the contents of `MVP UI/dist/` to your static host (Azure Static Web Apps, Storage static website + CDN, etc.).

### Azure Portal — link Blob Storage for `/report`

1. **Create a Storage account** (Performance: Standard, redundancy as you prefer).
2. Open **Security + networking → Access keys** → copy **Connection string** (key1 or key2).  
   The **`reports`** container is **created automatically** on first save if it does not exist (see `backend/services/blob_reports.py`).
3. Set on the **API** (Container App → *your app* → **Settings → Environment variables**):
   - `REPORT_STORAGE_BACKEND` = `azure`
   - `AZURE_STORAGE_CONNECTION_STRING` = *(paste connection string)*

For **local dev without Azure**, use `REPORT_STORAGE_BACKEND=local` and `REPORT_STORAGE_PATH=data/reports` in repo-root `.env`.

### Azure Portal — host the API (Container Apps) at a glance

1. **Container Apps** → create an environment if you do not have one.
2. Create a **Container App** from your image in **Azure Container Registry** (build/push per section 4 above).
3. **Ingress**: **On**, **External**, target port **8000**, transport **HTTP** (platform provides HTTPS on the public FQDN).
4. Under **Environment variables**, set at minimum:
   - `FIRECRAWL_API_KEY`
   - `MODEL_PATH=/app/ml/models/bert_v1` (or wherever your image mounts the BERT artifacts)
   - `TAXONOMY_DIR=/app/taxonomy`
   - `REPORT_STORAGE_BACKEND` + `AZURE_STORAGE_CONNECTION_STRING` if using Blob (see above)

5. Copy the app **FQDN** and use it as `VITE_API_BASE_URL` when you **`npm run build`** the MVP UI.

### CORS

The API currently allows broad CORS for development (`allow_origins=["*"]` in `backend/api/main.py`). For a locked-down production setup, restrict origins to your static site URL once both hostnames are known.

