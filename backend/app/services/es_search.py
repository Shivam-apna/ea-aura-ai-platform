from elasticsearch import Elasticsearch

es = Elasticsearch("http://elasticsearch:9200")

def query_sales_data(business_name: str, query_text: str, index_name="agent_dataset", size=10) -> str:
    try:
        result = es.search(index=index_name, body={
            "size": size,
            "query": {
                "bool": {
                    "must": [
                        {"match": {"business_name.keyword": business_name}},
                        {
                            "multi_match": {
                                "query": query_text,
                                "fields": ["combined_text", "row_data.*"]
                            }
                        }
                    ]
                }
            }
        })

        hits = result["hits"]["hits"]
        if not hits:
            return "No relevant sales data found."

        return "\n".join([hit["_source"]["combined_text"] for hit in hits])
    except Exception as e:
        return f"Error: {str(e)}"
