# CandorLens API — Azure Container Apps
# Python 3.11; BERT preloaded at startup for P95 under 500ms.

FROM python:3.11-slim

# System deps needed by pytesseract and opencv
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency list and install (no .env or secrets)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app, ML model path, and taxonomy (legal data)
COPY backend ./backend
COPY ml ./ml
COPY taxonomy ./taxonomy

# Model expected at /app/ml/models/bert_v1; override with MODEL_PATH at runtime.
ENV PYTHONPATH=/app
EXPOSE 8000

# Single worker; model loaded once in lifespan. Preload at startup.
CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
