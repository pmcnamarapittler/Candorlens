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

# Copy app, scripts, and taxonomy (legal data); ml/ copied without weights (downloaded at runtime)
COPY backend ./backend
COPY ml ./ml
COPY taxonomy ./taxonomy
COPY scripts ./scripts
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Model expected at /app/ml/models/bert_v1; downloaded from Blob Storage at startup.
ENV PYTHONPATH=/app
EXPOSE 8000

# Downloads model weights from Blob Storage then starts uvicorn.
ENTRYPOINT ["/app/entrypoint.sh"]
