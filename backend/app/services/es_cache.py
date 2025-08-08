from elasticsearch import Elasticsearch
from langchain_community.embeddings import HuggingFaceEmbeddings
import hashlib
from app.core.core_log import agent_logger as logger

es = Elasticsearch("http://elasticsearch:9200")
embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
CACHE_INDEX = "agent_cache"

def create_cache_index_if_not_exists():
    if not es.indices.exists(index=CACHE_INDEX):
        es.indices.create(index=CACHE_INDEX, body={
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            },
            "mappings": {
                "properties": {
                    "tenant_id": {"type": "keyword"},
                    "query_text": {"type": "text"},
                    "query_hash": {"type": "keyword"},
                    "response": {"type": "text"},
                    "embedding": {
                        "type": "dense_vector",
                        "dims": 384,
                        "index": True,
                        "similarity": "cosine"
                    }
                }
            }
        })
        logger.info(f"✅ Created cache index: {CACHE_INDEX}")
    else:
        logger.info(f"ℹ️ Cache index '{CACHE_INDEX}' already exists.")

def get_query_hash(query_text: str) -> str:
    return hashlib.sha256(query_text.encode()).hexdigest()[:16]

def search_cache(query_text: str, tenant_id: str, threshold: float = 0.15) -> str:
    logger.info(f"[CACHE CHECK] USER QUESTION (first 100 chars): {query_text[:100]}")
    logger.info(f"tenantid: {tenant_id}")
    query_hash = get_query_hash(query_text)

    # 1. Exact hash + tenant
    try:
        result = es.search(index=CACHE_INDEX, body={
            "query": {
                "bool": {
                    "must": [
                        {"term": {"query_hash": query_hash}},
                        {"term": {"tenant_id": tenant_id}}
                    ]
                }
            }
        })
        hits = result["hits"]["hits"]
        if hits:
            logger.info("✅ Exact hash match cache HIT.")
            return hits[0]["_source"]["response"]
        else:
            logger.info("❌ No exact hash match found.")
    except Exception as e:
        logger.error(f"[CACHE HASH MATCH ERROR] {e}")

    # 2. Phrase match + tenant
    try:
        result = es.search(index=CACHE_INDEX, body={
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"query_text": query_text}},
                        {"term": {"tenant_id": tenant_id}}
                    ]
                }
            }
        })
        hits = result["hits"]["hits"]
        if hits:
            logger.info("✅ Exact phrase match cache HIT.")
            return hits[0]["_source"]["response"]
        else:
            logger.info("❌ No exact phrase match found.")
    except Exception as e:
        logger.error(f"[CACHE EXACT MATCH ERROR] {e}")

    # 3. Embedding match + tenant
    try:
        query_vector = embedding_model.embed_query(query_text)
        result = es.search(index=CACHE_INDEX, body={
            "size": 3,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": [
                                {"term": {"tenant_id": tenant_id}}
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {"query_vector": query_vector}
                    }
                }
            }
        })

        hits = result["hits"]["hits"]
        if hits:
            logger.info(f"📊 Found {len(hits)} embedding matches:")
            for i, hit in enumerate(hits):
                logger.debug(f"  {i+1}. Score: {hit['_score']:.4f} | Query: {hit['_source']['query_text'][:100]}...")

            top_hit = hits[0]
            top_score = top_hit["_score"]

            if top_score >= threshold + 1.0:
                logger.info("✅ Cache HIT with embedding similarity.")
                return top_hit["_source"]["response"]
            else:
                logger.warning(f"⚠️ Best embedding score {top_score:.4f} below threshold.")
        else:
            logger.info("❌ No embedding matches found.")

    except Exception as e:
        logger.error(f"[CACHE EMBEDDING ERROR] {e}")

    try:
        total_count = es.count(index=CACHE_INDEX)['count']
        logger.info(f"📈 Total cache entries: {total_count}")
    except Exception as e:
        logger.error(f"[CACHE COUNT ERROR] {e}")

    return None

def save_to_cache(query_text: str, response: str, tenant_id: str):
    logger.info(f"💾 [CACHE SAVE] Storing prompt in cache. Preview (first 100 chars): {query_text[:100]}")
    query_hash = get_query_hash(query_text)

    try:
        query_vector = embedding_model.embed_query(query_text)
        doc = {
            "tenant_id": tenant_id,
            "query_text": query_text,
            "query_hash": query_hash,
            "response": response,
            "embedding": query_vector
        }
        result = es.index(index=CACHE_INDEX, body=doc)
        logger.info(f"✅ Cache save successful. Document ID: {result['_id']}")
    except Exception as e:
        logger.error(f"[CACHE SAVE ERROR] {e}")

def clear_cache(tenant_id: str = None):
    try:
        if tenant_id:
            query = {"term": {"tenant_id": tenant_id}}
        else:
            query = {"match_all": {}}
        es.delete_by_query(index=CACHE_INDEX, body={"query": query})
        logger.info("🗑️ Cache cleared successfully.")
    except Exception as e:
        logger.error(f"[CACHE CLEAR ERROR] {e}")

def list_cache_entries(tenant_id: str = None, limit: int = 10):
    try:
        query = {"match_all": {}} if not tenant_id else {"term": {"tenant_id": tenant_id}}
        result = es.search(index=CACHE_INDEX, body={
            "size": limit,
            "query": query,
            "_source": ["query_text", "query_hash", "tenant_id"]
        })

        hits = result["hits"]["hits"]
        logger.info(f"📋 Cache entries ({len(hits)}):")
        for i, hit in enumerate(hits, 1):
            q = hit["_source"]
            logger.debug(f"{i}. [{q['tenant_id']}] Hash: {q['query_hash']} | Query: {q['query_text'][:80]}")
    except Exception as e:
        logger.error(f"[CACHE LIST ERROR] {e}")
