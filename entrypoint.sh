#!/bin/bash
set -e
python3 /app/scripts/download_model.py
exec uvicorn backend.api.main:app --host 0.0.0.0 --port 8000
