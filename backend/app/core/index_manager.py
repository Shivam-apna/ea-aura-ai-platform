from app.core.elastic import es
from app.core.index_templates import INDEX_TEMPLATES
from elasticsearch import Elasticsearch

class IndexManager:
    @staticmethod
    def create_indices():
        for index_name, template in INDEX_TEMPLATES.items():
            if not es.indices.exists(index=index_name):
                es.indices.create(index=index_name, body=template)
                print(f"[✓] Created index: {index_name}")
            else:
                print(f"[•] Index exists: {index_name}")

    @staticmethod
    def check_health(index_name: str) -> bool:
        try:
            return es.indices.exists(index=index_name)
        except Exception as e:
            print(f"[!] Health check failed for {index_name}: {str(e)}")
            return False
