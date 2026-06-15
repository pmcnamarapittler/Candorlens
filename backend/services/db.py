import os
from azure.cosmos import CosmosClient, exceptions

_client = CosmosClient(
    os.environ["COSMOS_ENDPOINT"],
    credential=os.environ["COSMOS_KEY"]
)
_db = _client.get_database_client(os.environ["COSMOS_DB"])
_container = _db.get_container_client(os.environ["COSMOS_CONTAINER"])


def save_audit(audit: dict) -> dict:
    """Upsert an audit result. audit must have 'id' and 'url_hash' keys."""
    return _container.upsert_item(audit)


def get_audit(audit_id: str) -> dict | None:
    """Retrieve a single audit by id. Returns None if not found."""
    try:
        return _container.read_item(item=audit_id, partition_key=audit_id)
    except exceptions.CosmosResourceNotFoundError:
        return None


def list_audits(limit: int = 50) -> list[dict]:
    """Return the most recent audits."""
    query = f"SELECT TOP {limit} * FROM c ORDER BY c._ts DESC"
    return list(_container.query_items(query=query, enable_cross_partition_query=True))
