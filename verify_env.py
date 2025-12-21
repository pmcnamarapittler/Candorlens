from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv
import os

print("Loading .env...")
load_dotenv()

conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
account = os.getenv("AZURE_STORAGE_ACCOUNT")

print(f"Storage account from .env: {account!r}")

if not conn_str:
    print("❌ AZURE_STORAGE_CONNECTION_STRING is missing.")
    raise SystemExit(1)

try:
    print("Connecting to Azure Blob Storage...")
    blob_service = BlobServiceClient.from_connection_string(conn_str)
    containers = list(blob_service.list_containers())
    print("✅ Connected to Azure Storage.")
    print("Containers found:", [c.name for c in containers])
except Exception as e:
    print("❌ Azure connection failed:")
    print(e)