from elasticsearch import Elasticsearch
from langchain_community.embeddings import HuggingFaceEmbeddings
import hashlib
import json
from app.core.core_log import agent_logger as logger

es = Elasticsearch("http://elasticsearch:9200")
embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
CACHE_INDEX = "agent_cache"

def create_cache_index_if_not_exists():
    if not es.indices.exists(index=CACHE_INDEX):
        es.indices.create(index=CACHE_INDEX, body={
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "refresh_interval": "1s",
                "index.max_result_window": 50000
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
    # Add debug logging for hash generation
    hash_value = hashlib.sha256(query_text.encode()).hexdigest()[:16]
    logger.debug(f"[HASH DEBUG] Input: '{query_text}' -> Hash: {hash_value}")
    return hash_value

def debug_cache_state(tenant_id: str):
    """Debug function to check cache state"""
    try:
        # Check if index exists
        if not es.indices.exists(index=CACHE_INDEX):
            logger.error(f"[DEBUG] Index {CACHE_INDEX} does not exist!")
            return
        
        # Get total count
        total_count = es.count(index=CACHE_INDEX)['count']
        logger.info(f"[DEBUG] Total cache entries: {total_count}")
        
        # Get count for specific tenant
        tenant_count = es.count(index=CACHE_INDEX, body={
            "query": {"term": {"tenant_id": tenant_id}}
        })['count']
        logger.info(f"[DEBUG] Entries for tenant '{tenant_id}': {tenant_count}")
        
        # Show sample entries for this tenant
        result = es.search(index=CACHE_INDEX, body={
            "size": 5,
            "query": {"term": {"tenant_id": tenant_id}},
            "_source": ["query_text", "query_hash", "tenant_id"]
        })
        
        logger.info(f"[DEBUG] Sample entries for tenant '{tenant_id}':")
        for i, hit in enumerate(result["hits"]["hits"], 1):
            source = hit["_source"]
            logger.info(f"  {i}. Hash: {source['query_hash']} | Text: '{source['query_text'][:100]}'")
            
    except Exception as e:
        logger.error(f"[DEBUG ERROR] {e}")

def search_cache(query_text: str, tenant_id: str, threshold: float = 0.85) -> str:
    logger.info(f"[CACHE CHECK] USER QUESTION (first 100 chars): {query_text[:100]}")
    logger.info(f"[CACHE CHECK] Tenant ID: '{tenant_id}'")
    
    # Add debug information
    debug_cache_state(tenant_id)
    
    query_hash = get_query_hash(query_text)
    logger.info(f"[CACHE CHECK] Generated hash: {query_hash}")

    # 1. Exact hash + tenant match
    try:
        search_body = {
            "query": {
                "bool": {
                    "must": [
                        {"term": {"query_hash": query_hash}},
                        {"term": {"tenant_id": tenant_id}}
                    ]
                }
            }
        }
        logger.debug(f"[HASH SEARCH] Query body: {json.dumps(search_body, indent=2)}")
        
        result = es.search(index=CACHE_INDEX, body=search_body)
        hits = result["hits"]["hits"]
        
        logger.info(f"[HASH SEARCH] Found {len(hits)} exact hash matches")
        
        if hits:
            logger.info("✅ Exact hash match cache HIT.")
            return hits[0]["_source"]["response"]
        else:
            logger.info("❌ No exact hash match found.")
            
            # Additional debug: check if hash exists for any tenant
            hash_any_tenant = es.search(index=CACHE_INDEX, body={
                "query": {"term": {"query_hash": query_hash}}
            })
            if hash_any_tenant["hits"]["hits"]:
                logger.warning(f"[DEBUG] Hash exists for other tenants: {[h['_source']['tenant_id'] for h in hash_any_tenant['hits']['hits']]}")
            
    except Exception as e:
        logger.error(f"[CACHE HASH MATCH ERROR] {e}")

    # 2. Exact phrase match + tenant
    try:
        search_body = {
            "query": {
                "bool": {
                    "must": [
                        {"match_phrase": {"query_text": query_text}},
                        {"term": {"tenant_id": tenant_id}}
                    ]
                }
            }
        }
        logger.debug(f"[PHRASE SEARCH] Query body: {json.dumps(search_body, indent=2)}")
        
        result = es.search(index=CACHE_INDEX, body=search_body)
        hits = result["hits"]["hits"]
        
        logger.info(f"[PHRASE SEARCH] Found {len(hits)} phrase matches")
        
        if hits:
            logger.info("✅ Exact phrase match cache HIT.")
            return hits[0]["_source"]["response"]
        else:
            logger.info("❌ No exact phrase match found.")
    except Exception as e:
        logger.error(f"[CACHE EXACT MATCH ERROR] {e}")

    # 3. Embedding similarity match + tenant
    try:
        logger.info("[EMBEDDING SEARCH] Generating query embedding...")
        query_vector = embedding_model.embed_query(query_text)
        logger.info(f"[EMBEDDING SEARCH] Vector length: {len(query_vector)}")
        
        search_body = {
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
        }
        logger.debug(f"[EMBEDDING SEARCH] Query body (without vector): {json.dumps({k: v for k, v in search_body.items() if k != 'query'}, indent=2)}")
        
        result = es.search(index=CACHE_INDEX, body=search_body)
        hits = result["hits"]["hits"]
        
        if hits:
            logger.info(f"📊 Found {len(hits)} embedding matches:")
            for i, hit in enumerate(hits):
                logger.info(f"  {i+1}. Score: {hit['_score']:.4f} | Query: {hit['_source']['query_text'][:100]}...")

            top_hit = hits[0]
            top_score = top_hit["_score"]
            
            logger.info(f"[EMBEDDING] Top score: {top_score:.4f}, Threshold: {threshold + 1.0:.4f}")

            if top_score >= threshold + 1.0:
                logger.info("✅ Cache HIT with embedding similarity.")
                return top_hit["_source"]["response"]
            else:
                logger.warning(f"⚠️ Best embedding score {top_score:.4f} below threshold {threshold + 1.0:.4f}")
        else:
            logger.info("❌ No embedding matches found.")

    except Exception as e:
        logger.error(f"[CACHE EMBEDDING ERROR] {e}")
        import traceback
        logger.error(f"[CACHE EMBEDDING TRACEBACK] {traceback.format_exc()}")

    return None

def save_to_cache(query_text: str, response: str, tenant_id: str):
    logger.info(f"💾 [CACHE SAVE] Storing prompt in cache. Preview (first 100 chars): {query_text[:100]}")
    logger.info(f"💾 [CACHE SAVE] Tenant ID: '{tenant_id}'")
    
    query_hash = get_query_hash(query_text)

    try:
        logger.info("[CACHE SAVE] Generating embedding...")
        query_vector = embedding_model.embed_query(query_text)
        logger.info(f"[CACHE SAVE] Embedding generated, length: {len(query_vector)}")
        
        doc = {
            "tenant_id": tenant_id,
            "query_text": query_text,
            "query_hash": query_hash,
            "response": response,
            "embedding": query_vector
        }
        
        logger.debug(f"[CACHE SAVE] Document keys: {list(doc.keys())}")
        logger.debug(f"[CACHE SAVE] Tenant ID type: {type(tenant_id)}, value: '{tenant_id}'")
        
        result = es.index(index=CACHE_INDEX, body=doc, refresh='wait_for')
        logger.info(f"✅ Cache save successful. Document ID: {result['_id']}")
        
        # Verify the save
        saved_doc = es.get(index=CACHE_INDEX, id=result['_id'])
        logger.info(f"[SAVE VERIFICATION] Retrieved doc tenant_id: '{saved_doc['_source']['tenant_id']}'")
        
    except Exception as e:
        logger.error(f"[CACHE SAVE ERROR] {e}")
        import traceback
        logger.error(f"[CACHE SAVE TRACEBACK] {traceback.format_exc()}")

def clear_cache(tenant_id: str = None):
    try:
        if tenant_id:
            query = {"term": {"tenant_id": tenant_id}}
            logger.info(f"🗑️ Clearing cache for tenant: {tenant_id}")
        else:
            query = {"match_all": {}}
            logger.info("🗑️ Clearing all cache entries")
            
        result = es.delete_by_query(index=CACHE_INDEX, body={"query": query})
        logger.info(f"🗑️ Cache cleared successfully. Deleted: {result.get('deleted', 0)} entries")
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
            logger.info(f"{i}. [{q['tenant_id']}] Hash: {q['query_hash']} | Query: {q['query_text'][:80]}")
    except Exception as e:
        logger.error(f"[CACHE LIST ERROR] {e}")

# Additional diagnostic function
def diagnose_cache_issues(query_text: str, tenant_id: str):
    """Comprehensive diagnostic function"""
    logger.info("🔍 [DIAGNOSTIC] Starting cache diagnostics...")
    
    # 1. Check Elasticsearch connection
    try:
        info = es.info()
        logger.info(f"[DIAGNOSTIC] ES connection OK, version: {info['version']['number']}")
    except Exception as e:
        logger.error(f"[DIAGNOSTIC] ES connection failed: {e}")
        return
    
    # 2. Check index health
    try:
        health = es.cluster.health(index=CACHE_INDEX)
        logger.info(f"[DIAGNOSTIC] Index health: {health['status']}")
    except Exception as e:
        logger.error(f"[DIAGNOSTIC] Index health check failed: {e}")
    
    # 3. Check embedding model
    try:
        test_embedding = embedding_model.embed_query("test")
        logger.info(f"[DIAGNOSTIC] Embedding model OK, vector dim: {len(test_embedding)}")
    except Exception as e:
        logger.error(f"[DIAGNOSTIC] Embedding model failed: {e}")
    
    # 4. Debug specific query
    debug_cache_state(tenant_id)
    
    logger.info("🔍 [DIAGNOSTIC] Diagnostics complete.")