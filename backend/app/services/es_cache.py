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

def search_cache(query_text: str, threshold: float = 0.85) -> str:
    logger.info(f"[CACHE CHECK] USER QUESTION (first 100 chars): {query_text[:100]}")
    
    query_hash = get_query_hash(query_text)
    logger.debug(f"Query hash: {query_hash}")

    try:
        result = es.search(index=CACHE_INDEX, body={
            "query": {
                "term": {
                    "query_hash": query_hash
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

    try:
        result = es.search(index=CACHE_INDEX, body={
            "query": {
                "match_phrase": {
                    "query_text": query_text
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

    try:
        query_vector = embedding_model.embed_query(query_text)
        body = {
            "size": 3,
            "query": {
                "script_score": {
                    "query": {"match_all": {}},
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {"query_vector": query_vector}
                    }
                }
            }
        }

        result = es.search(index=CACHE_INDEX, body=body)
        hits = result["hits"]["hits"]

        if hits:
            logger.info(f"📊 Found {len(hits)} embedding matches:")
            for i, hit in enumerate(hits):
                score = hit["_score"]
                cached_query_preview = hit["_source"]["query_text"][:100]
                logger.debug(f"  {i+1}. Score: {score:.4f} | Query: {cached_query_preview}...")

            top_hit = hits[0]
            top_score = top_hit["_score"]

            if top_score >= threshold + 1.0:
                logger.info(f"✅ Cache HIT with embedding similarity — returning cached response.")
                return top_hit["_source"]["response"]
            else:
                logger.warning(f"⚠️ Best embedding score {top_score:.4f} below threshold {threshold + 1.0:.4f} — skipping.")
        else:
            logger.info("❌ No embedding matches found.")

    except Exception as e:
        logger.error(f"[CACHE EMBEDDING ERROR] {e}")

    try:
        count_result = es.count(index=CACHE_INDEX)
        total_count = count_result["count"]
        logger.info(f"📈 Total cache entries: {total_count}")
    except Exception as e:
        logger.error(f"[CACHE COUNT ERROR] {e}")

    return None

def save_to_cache(query_text: str, response: str):
    logger.info(f"💾 [CACHE SAVE] Storing prompt in cache. Preview (first 100 chars): {query_text[:100]}")
    
    query_hash = get_query_hash(query_text)
    logger.debug(f"Saving with hash: {query_hash}")

    try:
        query_vector = embedding_model.embed_query(query_text)
        doc = {
            "query_text": query_text,
            "query_hash": query_hash,
            "response": response,
            "embedding": query_vector
        }
        result = es.index(index=CACHE_INDEX, body=doc)
        logger.info(f"✅ Cache save successful. Document ID: {result['_id']}")
    except Exception as e:
        logger.error(f"[CACHE SAVE ERROR] {e}")

def clear_cache():
    try:
        es.delete_by_query(index=CACHE_INDEX, body={"query": {"match_all": {}}})
        logger.info("🗑️ Cache cleared successfully.")
    except Exception as e:
        logger.error(f"[CACHE CLEAR ERROR] {e}")

def list_cache_entries(limit: int = 10):
    try:
        result = es.search(index=CACHE_INDEX, body={
            "size": limit,
            "query": {"match_all": {}},
            "_source": ["query_text", "query_hash"]
        })

        hits = result["hits"]["hits"]
        logger.info(f"📋 Cache entries ({len(hits)} of {result['hits']['total']['value']}):")
        for i, hit in enumerate(hits, 1):
            query_text = hit["_source"]["query_text"]
            query_hash = hit["_source"]["query_hash"]
            logger.debug(f"  {i}. Hash: {query_hash} | Query: {query_text[:100]}...")
    except Exception as e:
        logger.error(f"[CACHE LIST ERROR] {e}")
