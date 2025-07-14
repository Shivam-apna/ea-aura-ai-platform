from elasticsearch import Elasticsearch

es = Elasticsearch("http://elasticsearch:9200")

def query_sales_data(
    business_name: str,
    query_text: str,
    index_name: str = "agent_dataset",
    sub_index: str = "saledataset",
    size: int = 10
) -> str:
    try:
        result = es.search(index=index_name, body={
            "size": size,
            "query": {
                "bool": {
                    "must": [
                        {"match": {"business_name.keyword": business_name}},
                        {"match": {"sub_index": sub_index}},
                        {
                            "match": {
                                "combined_text": query_text  # Safe text field
                            }
                        }
                    ]
                }
            }
        })

        hits = result["hits"]["hits"]
        if not hits:
            return "No relevant sales data found."

        return "\n".join([
            hit["_source"]["combined_text"]
            for hit in hits if "combined_text" in hit["_source"]
        ])
    except Exception as e:
        return f"Error: {str(e)}"



    
def query_customer_survey_data(
    business_name: str,
    query_text: str,
    index_name: str = "agent_dataset",
    sub_index: str = "customersurvey",
    size: int = 10
) -> str:
    try:
        result = es.search(index=index_name, body={
            "size": size,
            "query": {
                "bool": {
                    "must": [
                        {"match": {"business_name.keyword": business_name}},
                        {"match": {"sub_index": sub_index}},
                        {"match": {"combined_text": query_text}}
                    ]
                }
            }
        })

        hits = result["hits"]["hits"]
        if not hits:
            return "No relevant customer survey data found."

        # Use full combined_text to give LLM full view of structured + unstructured fields
        return "\n".join([
            hit["_source"]["combined_text"]
            for hit in hits if "combined_text" in hit["_source"]
        ])

    except Exception as e:
        return f"Error: {str(e)}"
    

def query_mission_alignment_data(
    business_name: str,
    query_text: str,
    index_name: str = "agent_dataset",
    sub_index: str = "missiondataset",
    size: int = 10
) -> str:
    try:
        result = es.search(index=index_name, body={
            "size": size,
            "query": {
                "bool": {
                    "must": [
                        {"match": {"business_name.keyword": business_name}},
                        {"match": {"sub_index": sub_index}},
                        {"match": {"combined_text": query_text}}
                    ]
                }
            }
        })

        hits = result["hits"]["hits"]
        if not hits:
            return "No relevant customer survey data found."

        # Use full combined_text to give LLM full view of structured + unstructured fields
        return "\n".join([
            hit["_source"]["combined_text"]
            for hit in hits if "combined_text" in hit["_source"]
        ])

    except Exception as e:
        return f"Error: {str(e)}"
    

def query_brand_audit_data(
    business_name: str,
    query_text: str,
    index_name: str = "agent_dataset",
    sub_index: str = "brandaudit",
    size: int = 10
) -> str:
    try:
        result = es.search(index=index_name, body={
            "size": size,
            "query": {
                "bool": {
                    "must": [
                        {"match": {"business_name.keyword": business_name}},
                        {"match": {"sub_index": sub_index}},
                        {"match": {"combined_text": query_text}}
                    ]
                }
            }
        })

        hits = result["hits"]["hits"]
        if not hits:
            return "No relevant customer survey data found."

        # Use full combined_text to give LLM full view of structured + unstructured fields
        return "\n".join([
            hit["_source"]["combined_text"]
            for hit in hits if "combined_text" in hit["_source"]
        ])

    except Exception as e:
        return f"Error: {str(e)}"

