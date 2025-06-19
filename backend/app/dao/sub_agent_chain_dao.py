# backend/app/dao/sub_agent_chain_dao.py

from app.core.elastic import get_es_client
from app.models.sub_agent_chain import SubAgentChain
from uuid import uuid4
from datetime import datetime

INDEX_NAME = "sub_agent_chain"

def insert_doc(data: dict):
    doc_id = str(uuid4())
    data["created_at"] = datetime.utcnow().isoformat()
    get_es_client.index(index=INDEX_NAME, id=doc_id, body=data)
    return {"id": doc_id, **data}

def get_by_id(doc_id: str):
    try:
        res = get_es_client.get(index=INDEX_NAME, id=doc_id)
        return res["_source"]
    except Exception as e:
        return {"error": str(e)}
