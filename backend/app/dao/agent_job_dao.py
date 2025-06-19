# backend/app/dao/agent_job_dao.py

from app.core.elastic import get_es_client
from app.models.agent_job import AgentJob
from uuid import uuid4
from datetime import datetime

INDEX_NAME = "agent_job"

def insert_doc(job_data: dict):
    job_id = str(uuid4())
    job_data["created_at"] = datetime.utcnow().isoformat()
    get_es_client.index(index=INDEX_NAME, id=job_id, body=job_data)
    return {"id": job_id, **job_data}

def get_by_id(job_id: str):
    try:
        res = get_es_client.get(index=INDEX_NAME, id=job_id)
        return res["_source"]
    except Exception as e:
        return {"error": str(e)}

def search_jobs_by_status(status: str):
    query = {
        "query": {
            "match": {
                "status": status
            }
        }
    }
    res = get_es_client.search(index=INDEX_NAME, body=query)
    return [hit["_source"] for hit in res["hits"]["hits"]]
