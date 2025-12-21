import os
import json
import hashlib

from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv


# Load variables from the .env file in your project root
load_dotenv()


def _get_reports_container():
    """
    Connect to Azure Blob Storage and return the 'reports' container client.
    """
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    if not connection_string:
        raise RuntimeError(
            "AZURE_STORAGE_CONNECTION_STRING is not set. "
            "Check your .env file in the project root."
        )

    blob_service = BlobServiceClient.from_connection_string(connection_string)
    container = blob_service.get_container_client("reports")
    return container


def _url_to_blob_name(url: str) -> str:
    """
    Turn a URL into a stable, safe blob name using SHA-256.
    Example: 'https://example.com' -> 'e3b0c442... .json'
    """
    key = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return f"{key}.json"


def save_report(url: str, report_data: dict) -> None:
    """
    Save a report for a URL as a JSON blob in the 'reports' container.
    Overwrites existing report for the same URL.
    """
    container = _get_reports_container()
    blob_name = _url_to_blob_name(url)

    json_data = json.dumps(report_data, indent=2)

    container.upload_blob(
        name=blob_name,
        data=json_data,
        overwrite=True,
        content_type="application/json",
    )


def get_report(url: str) -> dict | None:
    """
    Fetch a report for a URL from the 'reports' container.
    Returns:
      - dict if the report exists
      - None if it does not exist
    """
    container = _get_reports_container()
    blob_name = _url_to_blob_name(url)

    try:
        blob_client = container.get_blob_client(blob_name)
        data = blob_client.download_blob().readall()
        return json.loads(data)
    except Exception:
        # Blob not found or some other error — return None for now
        return None