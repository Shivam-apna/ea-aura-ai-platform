from elasticsearch import Elasticsearch

def get_es_client() -> Elasticsearch:
    return Elasticsearch("http://elasticsearch:9200")