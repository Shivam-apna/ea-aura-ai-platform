import pandas as pd
from elasticsearch import Elasticsearch, helpers
from datetime import datetime
import hashlib
import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from langchain_community.embeddings import HuggingFaceEmbeddings
import json
import os
import time
import numpy as np

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExcelToElasticsearch:
    def __init__(self,
                 es_host: str = "http://elasticsearch:9200",
                 index_name: str = "agent_dataset",
                 sub_index: str = "customer_survey_dataset",
                 embedding_model: str = "all-MiniLM-L6-v2",
                 tenant_id: Optional[str] = None,
                 max_text_length: int = 8000,
                 batch_size: int = 100):
        
        self.es_host = es_host
        self.index_name = index_name
        self.sub_index = sub_index
        self.embedding_model_name = embedding_model
        self.max_text_length = max_text_length
        self.batch_size = batch_size
        
        # Initialize Elasticsearch - ALIGNED with es_search.py
        self.es = Elasticsearch([es_host])
        
        # Initialize embedding model - SAME as es_search.py
        try:
            self.embedding_model = HuggingFaceEmbeddings(model_name=embedding_model)
            
            # Test embedding to get dimensions
            test_vector = self.embedding_model.embed_query("test")
            self.embedding_dims = len(test_vector)
            logger.info(f"Embedding model loaded successfully. Dimensions: {self.embedding_dims}")
            
        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {str(e)}")
            raise

        # Generate tenant ID - ALIGNED with expected format
        if tenant_id:
            self.tenant_id = tenant_id.strip('"').strip()
        else:
            self.tenant_id = str(uuid.uuid4())

        logger.info(f"Initialized ExcelToElasticsearch:")
        logger.info(f"  - Index: {self.index_name}")
        logger.info(f"  - Sub-index: {self.sub_index}")
        logger.info(f"  - Tenant ID: {self.tenant_id}")

    def validate_elasticsearch_connection(self) -> bool:
        """ALIGNED with es_search.py test_elasticsearch_connection()"""
        try:
            return self.es.ping()
        except Exception as e:
            logger.error(f"Elasticsearch connection test failed: {e}")
            return False

    def create_index(self) -> bool:
        """EXACTLY ALIGNED with es_search.py expectations"""
        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "refresh_interval": "30s",
                "max_result_window": 50000
            },
            "mappings": {
                "properties": {
                    "sheet_name": {"type": "keyword"},
                    "row_id": {"type": "integer"},
                    # CRITICAL: combined_text must support multi_match queries
                    "combined_text": {
                        "type": "text",
                        "fields": {
                            "keyword": {"type": "keyword", "ignore_above": 256}
                        }
                    },
                    # CRITICAL: row_data must be searchable by smart filters
                    "row_data": {"type": "object", "dynamic": True},
                    # CRITICAL: embedding must support script_score cosine similarity
                    "embedding": {
                        "type": "dense_vector",
                        "dims": self.embedding_dims,
                        "index": True,
                        "similarity": "cosine"
                    },
                    "file_hash": {"type": "keyword"},
                    # CRITICAL: Must have .keyword field for exact matching
                    "tenant_id": {
                        "type": "text",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "timestamp": {"type": "date"},
                    "embedding_model": {"type": "keyword"},
                    # CRITICAL: Must have .keyword field for exact matching  
                    "sub_index": {
                        "type": "text",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "data_types": {"type": "object"}
                }
            }
        }
        
        try:
            if not self.es.indices.exists(index=self.index_name):
                self.es.indices.create(index=self.index_name, body=mapping)
                logger.info(f"Index '{self.index_name}' created successfully.")
            else:
                logger.info(f"Index '{self.index_name}' already exists.")
                    
            return True
            
        except Exception as e:
            logger.error(f"Failed to create index: {str(e)}")
            return False

    def calculate_file_hash(self, file_path: str) -> str:
        """SAME as original - no changes needed"""
        try:
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception as e:
            logger.error(f"Failed to calculate file hash: {str(e)}")
            raise

    def clean_data_for_elasticsearch(self, data: Any) -> Any:
        """ALIGNED - maintains searchability for smart filters"""
        if isinstance(data, dict):
            cleaned = {}
            for key, value in data.items():
                # IMPORTANT: Keep column names search-friendly but ES-compatible
                clean_key = str(key).strip().replace('.', '_').replace(' ', '_')
                # Don't over-transform - search needs to recognize these
                cleaned_value = self.clean_data_for_elasticsearch(value)
                if cleaned_value is not None:
                    cleaned[clean_key] = cleaned_value
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

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """EXACTLY SAME as es_search.py cached version"""
        return self.embedding_model.embed_documents(texts)

    def process_excel(self, file_path: str, header_row: int = 0) -> Dict[str, Any]:
        """ALIGNED to return format expected by upload endpoint"""
        start_time = time.time()
        
        try:
            # Create index
            if not self.create_index():
                raise Exception("Failed to create Elasticsearch index")

            file_hash = self.calculate_file_hash(file_path)
            logger.info(f"Processing file with hash: {file_hash}")

            # Load all sheets - SAME as original
            xls = pd.read_excel(file_path, sheet_name=None, header=header_row)
            all_docs = []
            total_rows = 0
            processed_rows = 0

            for sheet_name, df in xls.items():
                if df.empty:
                    logger.warning(f"Skipping empty sheet: {sheet_name}")
                    continue
                    
                logger.info(f"Processing sheet: {sheet_name} with {len(df)} rows")
                total_rows += len(df)

                # Clean the dataframe - KEEP ORIGINAL LOGIC for compatibility
                df = df.fillna("")
                df.columns = [str(c).strip().replace('.', '_').replace(' ', '_') for c in df.columns]

                data_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
                texts = []
                docs = []

                for idx, row in df.iterrows():
                    try:
                        # CRITICAL: Clean row data but keep it searchable
                        row_dict = {}
                        for col, val in row.items():
                            cleaned_val = self.clean_data_for_elasticsearch(val)
                            if cleaned_val not in [None, '', 'nan']:
                                row_dict[col] = cleaned_val

                        # SAME combined text logic as original
                        combined = " | ".join(f"{k}: {v}" for k, v in row_dict.items() if v not in [None, '', 'nan'])
                        
                        if not combined.strip():
                            continue
                            
                        texts.append(combined)

                        # EXACTLY SAME document structure as original
                        doc = {
                            "sheet_name": sheet_name,
                            "row_id": int(idx),
                            "row_data": row_dict,  # CRITICAL: Must be searchable by smart filters
                            "combined_text": combined,  # CRITICAL: Must support multi_match
                            "data_types": data_types,
                            "file_hash": file_hash,
                            "tenant_id": self.tenant_id,  # CRITICAL: Will create .keyword field
                            "timestamp": datetime.now().isoformat(),
                            "embedding_model": self.embedding_model_name,
                            "sub_index": self.sub_index  # CRITICAL: Will create .keyword field
                        }
                        
                        docs.append(doc)
                        processed_rows += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing row {idx} in sheet '{sheet_name}': {str(e)}")
                        continue

                if docs:
                    # Generate embeddings - SAME as original
                    logger.info(f"Generating embeddings for {len(texts)} texts in sheet '{sheet_name}'")
                    embeddings = self.generate_embeddings(texts)
                    
                    for doc, vec in zip(docs, embeddings):
                        doc["embedding"] = [float(x) for x in vec]  # CRITICAL: Must be float list
                        
                    all_docs.extend(docs)

            if not all_docs:
                raise Exception("No valid documents were processed from the Excel file")

            # Bulk index - SAME as original but with better stats
            logger.info(f"Indexing {len(all_docs)} documents...")
            indexing_result = self.bulk_index(all_docs)
            
            processing_time = round(time.time() - start_time, 2)
            
            # RETURN FORMAT ALIGNED with upload endpoint expectations
            return {
                "total_rows": total_rows,
                "processed_rows": processed_rows,
                "indexed_documents": len(all_docs),
                "processing_time_seconds": processing_time,
                "sheets_processed": len([name for name, df in xls.items() if not df.empty]),
                "file_hash": file_hash
            }

        except Exception as e:
            processing_time = round(time.time() - start_time, 2)
            logger.error(f"Excel processing failed after {processing_time}s: {str(e)}")
            raise

    def bulk_index(self, docs: List[Dict[str, Any]], batch_size: int = 100) -> Dict[str, Any]:
        """EXACTLY SAME as original - proven to work with search"""
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
                continue

        if not actions:
            raise Exception("No valid actions to index")

        success_count = 0
        fail_count = 0
        failed_docs = []

        try:
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

        if failed_docs and fail_count > len(docs) * 0.1:  # More than 10% failed
            raise Exception(f"{fail_count} document(s) failed to index. Check logs for details.")

        # CRITICAL: Refresh the index to make documents searchable immediately
        try:
            self.es.indices.refresh(index=self.index_name)
            logger.info("Index refreshed successfully")
        except Exception as e:
            logger.warning(f"Failed to refresh index: {str(e)}")

        return {
            "indexed_documents": success_count,
            "failed_documents": fail_count
        }