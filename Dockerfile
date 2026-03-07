# CandorLens API — Azure Container Apps
# Python 3.11; BERT preloaded at startup for P95 under 500ms.

FROM python:3.11-slim

WORKDIR /app

# Copy dependency list and install (no .env or secrets)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app, ML model path, and taxonomy (legal data)
COPY backend ./backend
COPY ml ./ml
COPY taxonomy ./taxonomy

# Optional: copy only if present (model may be baked in or mounted)
# Model expected at /app/ml/models/bert_v1; override with MODEL_PATH at runtime.
ENV PYTHONPATH=/app
EXPOSE 8000

# Single worker; model loaded once in lifespan. Preload at startup.
CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
