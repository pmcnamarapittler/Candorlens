#!/usr/bin/env python3
"""
Download BERT model weights from Azure Blob Storage at container startup.
Skips download if all required files are already present.
"""
import os
import sys
from pathlib import Path

REQUIRED_FILES = ["model.safetensors", "config.json", "vocab.txt", "label_map.json"]
BLOB_PREFIX = "bert_v1"


def main() -> None:
    model_dir = Path(os.environ.get("MODEL_PATH", "/app/ml/models/bert_v1"))

    if all((model_dir / f).exists() for f in REQUIRED_FILES):
        print(f"Model weights already present at {model_dir}, skipping download.")
        return

    conn_str = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
    if not conn_str:
        print("WARNING: AZURE_STORAGE_CONNECTION_STRING not set — model will not be downloaded.")
        return

    try:
        from azure.storage.blob import BlobServiceClient
    except ImportError:
        print("ERROR: azure-storage-blob not installed.")
        sys.exit(1)

    model_dir.mkdir(parents=True, exist_ok=True)
    service = BlobServiceClient.from_connection_string(conn_str)
    container = service.get_container_client("model-weights")

    blobs = [b for b in container.list_blobs(name_starts_with=f"{BLOB_PREFIX}/")]
    if not blobs:
        print(f"ERROR: No blobs found under '{BLOB_PREFIX}/' in model-weights container.")
        sys.exit(1)

    print(f"Downloading {len(blobs)} model file(s) to {model_dir} ...")
    for blob in blobs:
        filename = Path(blob.name).name
        dest = model_dir / filename
        size_mb = (blob.size or 0) / 1e6
        print(f"  {filename} ({size_mb:.1f} MB)")
        with open(dest, "wb") as f:
            container.download_blob(blob.name).readinto(f)

    print("Model download complete.")


if __name__ == "__main__":
    main()
