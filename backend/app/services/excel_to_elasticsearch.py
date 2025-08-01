import pandas as pd
from elasticsearch import Elasticsearch, helpers
from datetime import datetime
import hashlib
import uuid
import logging
from typing import List, Dict, Any, Optional
from langchain_community.embeddings import HuggingFaceEmbeddings
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExcelToElasticsearch:
    def __init__(self,
                 es_host: str = "http://elasticsearch:9200",
                 index_name: str = "agent_dataset",
                 sub_index: str = "customer_survey_dataset",
                 embedding_model: str = "all-MiniLM-L6-v2",
                 tenant_id: Optional[str] = None):
        self.es = Elasticsearch([es_host])
        self.index_name = index_name
        self.sub_index = sub_index
        self.embedding_model_name = embedding_model
        self.embedding_model = HuggingFaceEmbeddings(model_name=embedding_model)

        # Test embedding to get dimensions
        test_vector = self.embedding_model.embed_query("test")
        self.embedding_dims = len(test_vector)

        # Generate tenant ID
        self.tenant_id = tenant_id.strip('"') if tenant_id else str(uuid.uuid4())

        logger.info(f"Initialized with embedding model: {embedding_model}")
        logger.info(f"Embedding dimension: {self.embedding_dims}")
        logger.info(f"Generated tenant_id: {self.tenant_id}")

    def create_index(self):
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                # Add these settings to help with bulk indexing
                "refresh_interval": "30s",
                "max_result_window": 50000
            },
            "mappings": {
                "properties": {
                    "sheet_name": {"type": "keyword"},
                    "row_id": {"type": "integer"},
                    "combined_text": {"type": "text"},
                    "row_data": {"type": "object", "dynamic": True},
                    "embedding": {
                        "type": "dense_vector",
                        "dims": self.embedding_dims,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "file_hash": {"type": "keyword"},
                    "tenant_id": {"type": "keyword"},
                    "timestamp": {"type": "date"},
                    "embedding_model": {"type": "keyword"},
                    "sub_index": {"type": "keyword"},
                    "data_types": {"type": "object"}
                }
            }
        }
        if not self.es.indices.exists(index=self.index_name):
            self.es.indices.create(index=self.index_name, body=mapping)
            logger.info(f"Index '{self.index_name}' created.")
        else:
            logger.info(f"Index '{self.index_name}' already exists.")

    def calculate_file_hash(self, file_path: str) -> str:
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        return self.embedding_model.embed_documents(texts)

    def clean_data_for_elasticsearch(self, data: Any) -> Any:
        """Clean data to ensure compatibility with Elasticsearch"""
        if isinstance(data, dict):
            cleaned = {}
            for key, value in data.items():
                # Clean the key - remove problematic characters
                clean_key = str(key).strip().replace('.', '_').replace(' ', '_')
                cleaned[clean_key] = self.clean_data_for_elasticsearch(value)
            return cleaned
        elif isinstance(data, list):
            return [self.clean_data_for_elasticsearch(item) for item in data]
        elif pd.isna(data) or data is None or str(data).lower() in ['nan', 'none', 'null']:
            return None
        elif isinstance(data, (int, float, bool, str)):
            # Handle special float values
            if isinstance(data, float):
                if pd.isna(data) or data == float('inf') or data == float('-inf'):
                    return None
            return data
        else:
            # Convert other types to string
            return str(data)

    def process_excel(self, file_path: str, header_row: int = 0):
        self.create_index()
        file_hash = self.calculate_file_hash(file_path)
        logger.info(f"File hash: {file_hash}")

        # Load all sheets
        xls = pd.read_excel(file_path, sheet_name=None, header=header_row)
        all_docs = []

        for sheet_name, df in xls.items():
            if df.empty:
                logger.warning(f"Skipping empty sheet: {sheet_name}")
                continue
            logger.info(f"Processing sheet: {sheet_name} with {len(df)} rows")

            # Clean the dataframe
            df = df.fillna("")
            df.columns = [str(c).strip().replace('.', '_').replace(' ', '_') for c in df.columns]

            data_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
            texts = []
            docs = []

            for idx, row in df.iterrows():
                try:
                    # Clean row data
                    row_dict = {}
                    for col, val in row.items():
                        cleaned_val = self.clean_data_for_elasticsearch(val)
                        if cleaned_val not in [None, '', 'nan']:
                            row_dict[col] = cleaned_val

                    # Create combined text
                    combined = " | ".join(f"{k}: {v}" for k, v in row_dict.items() if v not in [None, '', 'nan'])
                    
                    if not combined.strip():  # Skip if no meaningful content
                        logger.warning(f"Skipping row {idx} in sheet '{sheet_name}' - no meaningful content")
                        continue
                        
                    texts.append(combined)

                    doc = {
                        "sheet_name": sheet_name,
                        "row_id": int(idx),  # Ensure it's an integer
                        "row_data": row_dict,
                        "combined_text": combined,
                        "data_types": data_types,
                        "file_hash": file_hash,
                        "tenant_id": self.tenant_id,
                        "timestamp": datetime.now().isoformat(),
                        "embedding_model": self.embedding_model_name,
                        "sub_index": self.sub_index
                    }
                    
                    docs.append(doc)
                    
                except Exception as e:
                    logger.error(f"Error processing row {idx} in sheet '{sheet_name}': {str(e)}")
                    continue

            if not docs:
                logger.warning(f"No valid documents found in sheet: {sheet_name}")
                continue

            try:
                logger.info(f"Generating embeddings for {len(texts)} texts in sheet '{sheet_name}'")
                embeddings = self.generate_embeddings(texts)
                
                for doc, vec in zip(docs, embeddings):
                    # Ensure embedding is a list of floats
                    doc["embedding"] = [float(x) for x in vec]
                    
                all_docs.extend(docs)
                
            except Exception as e:
                logger.error(f"Error generating embeddings for sheet '{sheet_name}': {str(e)}")
                continue

        if not all_docs:
            raise Exception("No valid documents were processed from the Excel file")

        logger.info(f"Indexing {len(all_docs)} documents...")
        self.bulk_index(all_docs)

    def bulk_index(self, docs: List[Dict[str, Any]], batch_size: int = 100):
        """Improved bulk indexing with detailed error reporting"""
        actions = []
        for i, doc in enumerate(docs):
            try:
                # Validate document before adding to actions
                action = {
                    "_index": self.index_name,
                    "_source": doc
                }
                # Test JSON serialization
                json.dumps(doc, default=str)
                actions.append(action)
            except Exception as e:
                logger.error(f"Error preparing document {i}: {str(e)}")
                logger.error(f"Problematic document: {doc}")
                continue

        if not actions:
            raise Exception("No valid actions to index")

        success_count = 0
        fail_count = 0
        failed_docs = []

        try:
            # Use smaller batch size to reduce memory pressure
            for success, info in helpers.streaming_bulk(
                self.es, 
                actions, 
                chunk_size=batch_size,
                request_timeout=60,
                max_retries=3,
                initial_backoff=2,
                max_backoff=600
            ):
                if success:
                    success_count += 1
                else:
                    fail_count += 1
                    failed_docs.append(info)
                    logger.error(f"Failed to index document: {info}")

        except Exception as e:
            logger.error(f"Bulk indexing exception: {str(e)}")
            raise

        logger.info(f"Bulk indexing complete: {success_count} succeeded, {fail_count} failed.")

        if failed_docs:
            logger.error(f"Failed documents details:")
            for i, item in enumerate(failed_docs[:10]):  # Log first 10 failed items
                logger.error(f"Failed doc {i+1}: {item}")
            
            # Don't raise exception if only a few documents failed
            if fail_count > len(docs) * 0.1:  # More than 10% failed
                raise Exception(f"{fail_count} document(s) failed to index. Check logs for details.")
            else:
                logger.warning(f"{fail_count} document(s) failed to index but continuing as success rate is acceptable.")

        # Refresh the index to make documents searchable
        try:
            self.es.indices.refresh(index=self.index_name)
            logger.info("Index refreshed successfully")
        except Exception as e:
            logger.warning(f"Failed to refresh index: {str(e)}")

    def validate_elasticsearch_connection(self):
        """Validate Elasticsearch connection and cluster health"""
        try:
            health = self.es.cluster.health()
            logger.info(f"Elasticsearch cluster health: {health['status']}")
            return health['status'] in ['green', 'yellow']
        except Exception as e:
            logger.error(f"Elasticsearch connection failed: {str(e)}")
            return False