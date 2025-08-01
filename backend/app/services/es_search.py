from elasticsearch import Elasticsearch
from langchain_community.embeddings import HuggingFaceEmbeddings
import re
import dateparser

es = Elasticsearch("http://elasticsearch:9200")
embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def extract_date(text: str):
    """Try to parse a date from natural language"""
    parsed = dateparser.parse(text)
    if parsed:
        return parsed.strftime('%Y-%m-%d')
    return None



def build_dynamic_filters(query_text: str, sample_doc: dict):
    """
    Dynamically builds filters based on values in query_text that match fields in sample_doc
    """
    filters = []
    for field, value in sample_doc.items():
        if isinstance(value, str):
            if value.lower() in query_text.lower():
                filters.append({"match": {field: value}})
        elif isinstance(value, (int, float)):
            numbers = re.findall(r'\d+(?:\.\d+)?', query_text)
            for n in numbers:
                if str(value) == n:
                    filters.append({"match": {field: value}})
        elif "date" in field.lower() or isinstance(value, str) and re.match(r"\d{4}-\d{2}-\d{2}", value):
            date_str = extract_date(query_text)
            if date_str:
                filters.append({"match": {field: date_str}})
    return filters

""" Business Vitality Subagents Dataset"""
def query_sales_data(
    query_text: str,
    tenant_id: str,
    index_name: str = "agent_dataset",
    sub_index: str = "sales_dataset",
    
    size: int = 10
) -> str:
    try:
        # Get vector for semantic match
        query_vector = embedding_model.embed_query(query_text)

        # Sample a doc to get fields
        sample = es.search(index=index_name, body={
            "query": {"match": {"sub_index": sub_index}},
            "size": 1
        })

        sample_doc = sample["hits"]["hits"][0]["_source"]["row_data"] if sample["hits"]["hits"] else {}

        # Always include sub_index match
        filters = [{"match": {"tenant_id": tenant_id}}, {"match": {"sub_index": sub_index}}]
        print("tenant_id4444444444444444444444444",sub_index,tenant_id)

        # Add dynamic filters based on content
        filters.extend(build_dynamic_filters(query_text, sample_doc))

        # Final search body
        body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": filters,
                            "should": [
                                {"match": {"combined_text": query_text}}
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {
                            "query_vector": query_vector
                        }
                    }
                }
            }
        }

        result = es.search(index=index_name, body=body)
        hits = result["hits"]["hits"]

        if not hits:
            return "No relevant sales data found."

        return "\n".join([
            f"Score: {hit['_score']:.2f} | {hit['_source']['combined_text']}"
            for hit in hits
        ])

    except Exception as e:
        return f"Error: {str(e)}"


def query_marketing_dataset(
    query_text: str,
    tenant_id: str,
    index_name: str = "agent_dataset",
    sub_index: str = "marketing_dataset",
    size: int = 10
) -> str:
    try:
        # Get vector for semantic match
        query_vector = embedding_model.embed_query(query_text)

        # Sample a doc to get fields
        sample = es.search(index=index_name, body={
            "query": {"match": {"sub_index": sub_index}},
            "size": 1
        })

        sample_doc = sample["hits"]["hits"][0]["_source"]["row_data"] if sample["hits"]["hits"] else {}

        # Always include sub_index match
        filters = [{"match": {"tenant_id": tenant_id}}, {"match": {"sub_index": sub_index}}]


        # Add dynamic filters based on content
        filters.extend(build_dynamic_filters(query_text, sample_doc))

        # Final search body
        body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": filters,
                            "should": [
                                {"match": {"combined_text": query_text}}
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {
                            "query_vector": query_vector
                        }
                    }
                }
            }
        }

        result = es.search(index=index_name, body=body)
        hits = result["hits"]["hits"]

        if not hits:
            return "No relevant brand data found."

        return "\n".join([
            f"Score: {hit['_score']:.2f} | {hit['_source']['combined_text']}"
            for hit in hits
        ])

    except Exception as e:
        return f"Error: {str(e)}"
 

""" Customer Analyzer Agent Dataset"""
def query_customer_survey_data(
    query_text: str,
    tenant_id: str,
    index_name: str = "agent_dataset",
    sub_index: str = "customer_survey_dataset",
    size: int = 10
) -> str:
    try:
        # Get vector for semantic match
        query_vector = embedding_model.embed_query(query_text)

        # Sample a doc to get fields
        sample = es.search(index=index_name, body={
            "query": {"match": {"sub_index": sub_index}},
            "size": 1
        })

        sample_doc = sample["hits"]["hits"][0]["_source"]["row_data"] if sample["hits"]["hits"] else {}

        # Always include sub_index match
        filters = [{"match": {"tenant_id": tenant_id}}, {"match": {"sub_index": sub_index}}]

        
        

        # Add dynamic filters based on content
        filters.extend(build_dynamic_filters(query_text, sample_doc))

        # Final search body
        body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": filters,
                            "should": [
                                {"match": {"combined_text": query_text}}
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {
                            "query_vector": query_vector
                        }
                    }
                }
            }
        }

        result = es.search(index=index_name, body=body)
        hits = result["hits"]["hits"]

        if not hits:
            return "No relevant sales data found."

        return "\n".join([
            f"Score: {hit['_score']:.2f} | {hit['_source']['combined_text']}"
            for hit in hits
        ])

    except Exception as e:
        return f"Error: {str(e)}"

def query_support_tickets_dataset(
    query_text: str,
    tenant_id: str,
    index_name: str = "agent_dataset",
    sub_index: str = "support_tickets_dataset",
    size: int = 10
) -> str:
    try:
        # Get vector for semantic match
        query_vector = embedding_model.embed_query(query_text)

        # Sample a doc to get fields
        sample = es.search(index=index_name, body={
            "query": {"match": {"sub_index": sub_index}},
            "size": 1
        })

        sample_doc = sample["hits"]["hits"][0]["_source"]["row_data"] if sample["hits"]["hits"] else {}

        # Always include sub_index match
        filters = [{"match": {"tenant_id": tenant_id}}, {"match": {"sub_index": sub_index}}]

        # Add dynamic filters based on content
        filters.extend(build_dynamic_filters(query_text, sample_doc))

        # Final search body
        body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": filters,
                            "should": [
                                {"match": {"combined_text": query_text}}
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {
                            "query_vector": query_vector
                        }
                    }
                }
            }
        }

        result = es.search(index=index_name, body=body)
        hits = result["hits"]["hits"]

        if not hits:
            return "No relevant brand data found."

        return "\n".join([
            f"Score: {hit['_score']:.2f} | {hit['_source']['combined_text']}"
            for hit in hits
        ])

    except Exception as e:
        return f"Error: {str(e)}"
   

def query_social_media_dataset(
    query_text: str,
    tenant_id: str,
    index_name: str = "agent_dataset",
    sub_index: str = "social_media_dataset",
    size: int = 10
) -> str:
    try:
        # Get vector for semantic match
        query_vector = embedding_model.embed_query(query_text)

        # Sample a doc to get fields
        sample = es.search(index=index_name, body={
            "query": {"match": {"sub_index": sub_index}},
            "size": 1
        })

        sample_doc = sample["hits"]["hits"][0]["_source"]["row_data"] if sample["hits"]["hits"] else {}

        # Always include sub_index match
        filters = [{"match": {"tenant_id": tenant_id}}, {"match": {"sub_index": sub_index}}]

        # Add dynamic filters based on content
        filters.extend(build_dynamic_filters(query_text, sample_doc))

        # Final search body
        body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": filters,
                            "should": [
                                {"match": {"combined_text": query_text}}
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {
                            "query_vector": query_vector
                        }
                    }
                }
            }
        }

        result = es.search(index=index_name, body=body)
        hits = result["hits"]["hits"]

        if not hits:
            return "No relevant brand data found."

        return "\n".join([
            f"Score: {hit['_score']:.2f} | {hit['_source']['combined_text']}"
            for hit in hits
        ])

    except Exception as e:
        return f"Error: {str(e)}"
   
"""Strategic Alignment Agent Dataset"""
def query_mission_alignment_data(
    query_text: str,
    tenant_id: str,
    index_name: str = "agent_dataset",
    sub_index: str = "mission_alignment_dataset",
    size: int = 10
) -> str:
    try:
        # Get vector for semantic match
        query_vector = embedding_model.embed_query(query_text)

        # Sample a doc to get fields
        sample = es.search(index=index_name, body={
            "query": {"match": {"sub_index": sub_index}},
            "size": 1
        })

        sample_doc = sample["hits"]["hits"][0]["_source"]["row_data"] if sample["hits"]["hits"] else {}

        # Always include sub_index match
        filters = [{"match": {"tenant_id": tenant_id}}, {"match": {"sub_index": sub_index}}]

        # Add dynamic filters based on content
        filters.extend(build_dynamic_filters(query_text, sample_doc))

        # Final search body
        body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": filters,
                            "should": [
                                {"match": {"combined_text": query_text}}
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {
                            "query_vector": query_vector
                        }
                    }
                }
            }
        }

        result = es.search(index=index_name, body=body)
        hits = result["hits"]["hits"]

        if not hits:
            return "No relevant mission alignment data found."

        return "\n".join([
            f"Score: {hit['_score']:.2f} | {hit['_source']['combined_text']}"
            for hit in hits
        ])

    except Exception as e:
        return f"Error: {str(e)}"
    
""" Brand Index Agent Dataset """
def query_brand_audit_data(
    query_text: str,
    tenant_id: str,
    index_name: str = "agent_dataset",
    sub_index: str = "brand_audit_dataset",
    size: int = 10
) -> str:
    try:
        # Get vector for semantic match
        query_vector = embedding_model.embed_query(query_text)

        # Sample a doc to get fields
        sample = es.search(index=index_name, body={
            "query": {"match": {"sub_index": sub_index}},
            "size": 1
        })

        sample_doc = sample["hits"]["hits"][0]["_source"]["row_data"] if sample["hits"]["hits"] else {}

        # Always include sub_index match
        filters = [{"match": {"tenant_id": tenant_id}}, {"match": {"sub_index": sub_index}}]

        # Add dynamic filters based on content
        filters.extend(build_dynamic_filters(query_text, sample_doc))

        # Final search body
        body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": filters,
                            "should": [
                                {"match": {"combined_text": query_text}}
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {
                            "query_vector": query_vector
                        }
                    }
                }
            }
        }

        result = es.search(index=index_name, body=body)
        hits = result["hits"]["hits"]

        if not hits:
            return "No relevant brand data found."

        return "\n".join([
            f"Score: {hit['_score']:.2f} | {hit['_source']['combined_text']}"
            for hit in hits
        ])

    except Exception as e:
        return f"Error: {str(e)}"
   
  
def query_social_media_engagement_dataset(
    query_text: str,
    tenant_id: str,
    index_name: str = "agent_dataset",
    sub_index: str = "social_media_engagement_dataset",
    size: int = 10
) -> str:
    try:
        # Get vector for semantic match
        query_vector = embedding_model.embed_query(query_text)

        # Sample a doc to get fields
        sample = es.search(index=index_name, body={
            "query": {"match": {"sub_index": sub_index}},
            "size": 1
        })

        sample_doc = sample["hits"]["hits"][0]["_source"]["row_data"] if sample["hits"]["hits"] else {}

        # Always include sub_index match
        filters = [{"match": {"tenant_id": tenant_id}}, {"match": {"sub_index": sub_index}}]

        # Add dynamic filters based on content
        filters.extend(build_dynamic_filters(query_text, sample_doc))

        # Final search body
        body = {
            "size": size,
            "query": {
                "script_score": {
                    "query": {
                        "bool": {
                            "must": filters,
                            "should": [
                                {"match": {"combined_text": query_text}}
                            ]
                        }
                    },
                    "script": {
                        "source": "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        "params": {
                            "query_vector": query_vector
                        }
                    }
                }
            }
        }

        result = es.search(index=index_name, body=body)
        hits = result["hits"]["hits"]

        if not hits:
            return "No relevant brand data found."

        return "\n".join([
            f"Score: {hit['_score']:.2f} | {hit['_source']['combined_text']}"
            for hit in hits
        ])

    except Exception as e:
        return f"Error: {str(e)}"
   
