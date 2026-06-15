import os
from datetime import datetime, timedelta, timezone
from azure.storage.blob import (
    BlobServiceClient,
    generate_blob_sas,
    BlobSasPermissions,
)


def upload_report(pdf_bytes: bytes, filename: str) -> str:
    """Upload a PDF report to Blob Storage and return a 24hr SAS URL."""
    conn_str = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
    container = os.environ["AZURE_BLOB_CONTAINER"]

    service = BlobServiceClient.from_connection_string(conn_str)
    blob = service.get_blob_client(container=container, blob=filename)
    blob.upload_blob(pdf_bytes, overwrite=True)

    account_name = service.account_name
    account_key = service.credential.account_key

    sas = generate_blob_sas(
        account_name=account_name,
        container_name=container,
        blob_name=filename,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    return f"https://{account_name}.blob.core.windows.net/{container}/{filename}?{sas}"
