# app/core/elastic.py

import os
import time
import logging
from elasticsearch import Elasticsearch, ConnectionError

logger = logging.getLogger(__name__)

ES_URL = os.getenv("ES_URL", "http://elasticsearch:9200")

def get_es_client(retries: int = 10, delay: float = 3.0) -> Elasticsearch:
    for attempt in range(retries):
        try:
            es = Elasticsearch(ES_URL)

            if es.ping():
                logger.info(f"✅ Connected to Elasticsearch at {ES_URL}")
                return es
            else:
                logger.warning(f"❌ Attempt {attempt+1}: Ping failed.")
        except ConnectionError as e:
            logger.error(f"❌ Attempt {attempt+1}: ConnectionError - {e}")
        time.sleep(delay)

    raise RuntimeError("❌ Could not connect to Elasticsearch after retries")

# Global client instance (import this)
es = get_es_client()
