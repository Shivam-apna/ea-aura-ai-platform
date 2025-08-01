from typing import Optional, List, Dict, Any
from elasticsearch import Elasticsearch
from pydantic import BaseModel
from app.core.elastic import es  # your existing elasticsearch client

class BaseDAO:
    def __init__(self, index: str, model: BaseModel):
        self.index = index
        self.model = model
        self.client: Elasticsearch = es

    def save(self, doc):
        if hasattr(doc, "dict"):
            body = doc.dict()
        else:
            body = doc

        self.client.index(index=self.index, document=body)



    def get_by_id(self, doc_id: str) -> Optional[dict]:
        try:
            result = self.client.get(index=self.index, id=doc_id)
            return result["_source"]
        except Exception:
            return None

    def search(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        sort: Optional[List[Dict[str, str]]] = None
    ) -> List[dict]:
        query = {"match_all": {}} if not filters else {"bool": {"must": []}}

        if filters:
            for field, value in filters.items():
                query["bool"]["must"].append({"term": {field: value}})

        body = {
            "query": query,
            "size": limit,
        }

        if sort:
            body["sort"] = sort

        results = self.client.search(index=self.index, body=body)
        return [hit["_source"] for hit in results["hits"]["hits"]]

    def delete(self, doc_id: str):
        return self.client.delete(index=self.index, id=doc_id)
