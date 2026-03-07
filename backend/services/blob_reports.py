"""
Report storage: save and retrieve reports by URL.
Supports Azure Blob Storage or local file storage via REPORT_STORAGE_BACKEND.
"""

import hashlib
import json
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _url_to_blob_name(url: str) -> str:
    """
    Turn a URL into a stable, safe blob/filename using SHA-256.
    Example: 'https://example.com' -> 'e3b0c442....json'
    """
    key = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return f"{key}.json"


# --- Azure backend ---


def _get_azure_container():
    """Connect to Azure Blob Storage and return the 'reports' container client."""
    from azure.storage.blob import BlobServiceClient

    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    if not connection_string:
        raise RuntimeError(
            "AZURE_STORAGE_CONNECTION_STRING is not set. "
            "Check your .env file or set REPORT_STORAGE_BACKEND=local for local storage."
        )
    blob_service = BlobServiceClient.from_connection_string(connection_string)
    return blob_service.get_container_client("reports")


def _save_report_azure(url: str, report_data: dict) -> None:
    """Save a report to Azure Blob Storage."""
    container = _get_azure_container()
    blob_name = _url_to_blob_name(url)
    json_data = json.dumps(report_data, indent=2)
    container.upload_blob(
        name=blob_name,
        data=json_data,
        overwrite=True,
        content_type="application/json",
    )


def _get_report_azure(url: str) -> dict | None:
    """Fetch a report from Azure Blob Storage."""
    container = _get_azure_container()
    blob_name = _url_to_blob_name(url)
    try:
        blob_client = container.get_blob_client(blob_name)
        data = blob_client.download_blob().readall()
        return json.loads(data)
    except Exception:
        return None


# --- Local backend ---


def _get_local_reports_dir() -> Path:
    """Resolve local reports directory from env or default."""
    path = os.getenv("REPORT_STORAGE_PATH", "data/reports")
    p = Path(path)
    if not p.is_absolute():
        # Resolve relative to repo root (backend/services/ -> parents[2])
        repo_root = Path(__file__).resolve().parents[2]
        p = repo_root / path
    return p


def _save_report_local(url: str, report_data: dict) -> None:
    """Save a report to local filesystem."""
    reports_dir = _get_local_reports_dir()
    reports_dir.mkdir(parents=True, exist_ok=True)
    filename = _url_to_blob_name(url)
    filepath = reports_dir / filename
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)


def _get_report_local(url: str) -> dict | None:
    """Fetch a report from local filesystem."""
    reports_dir = _get_local_reports_dir()
    filename = _url_to_blob_name(url)
    filepath = reports_dir / filename
    if not filepath.exists():
        return None
    try:
        with open(filepath, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


# --- Public API (backend selected by env) ---


def _get_backend() -> str:
    """Return 'azure' or 'local' based on REPORT_STORAGE_BACKEND."""
    backend = os.getenv("REPORT_STORAGE_BACKEND", "azure").lower().strip()
    if backend not in ("azure", "local"):
        return "azure"
    return backend


def save_report(url: str, report_data: dict) -> None:
    """
    Save a report for a URL.
    Uses Azure Blob or local filesystem based on REPORT_STORAGE_BACKEND.
    """
    if _get_backend() == "local":
        _save_report_local(url, report_data)
    else:
        _save_report_azure(url, report_data)


def get_report(url: str) -> dict | None:
    """
    Fetch a report for a URL.
    Returns dict if found, None otherwise.
    """
    if _get_backend() == "local":
        return _get_report_local(url)
    return _get_report_azure(url)
