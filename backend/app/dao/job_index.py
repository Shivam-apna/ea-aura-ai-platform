from elasticsearch import Elasticsearch
from app.core.elastic import get_es_client

INDEX_NAME = "agent-jobs"

def create_index_if_not_exists():
    es = get_es_client()
    if not es.indices.exists(index=INDEX_NAME):
        es.indices.create(index=INDEX_NAME, body={
            "mappings": {
                "properties": {
                    "job_id": {"type": "keyword"},
                    "tenant_id": {"type": "keyword"},
                    "status": {"type": "keyword"},
                    "created_at": {"type": "date"},
                    "agent_output": {"type": "text"}
                }
            }
        })

def index_job(job_data: dict):
    es = get_es_client()
    es.index(index=INDEX_NAME, body=job_data)
