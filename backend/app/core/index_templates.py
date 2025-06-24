INDEX_TEMPLATES = {
    "agent_job": {
        "mappings": {
            "properties": {
                "job_id": {"type": "keyword"},
                "status": {"type": "keyword"},
                "tenant_id": {"type": "keyword"},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"},
                "input": {"type": "text"},
                "output": {"type": "text"}
            }
        }
    },
    "sub_agent_chain": {
        "mappings": {
            "properties": {
                "chain_id": {"type": "keyword"},
                "job_id": {"type": "keyword"},
                "step": {"type": "integer"},
                "agent_name": {"type": "keyword"},
                "status": {"type": "keyword"},
                "log": {"type": "text"}
            }
        }
    },
    "agent_memory_log": {
        "mappings": {
            "properties": {
                "agent_job_id": {"type": "keyword"},
                "agent_id": {"type": "keyword"},
                "tenant_id": {"type": "keyword"},
                "timestamp": {"type": "date"},
                "step": {"type": "keyword"},
                "input": {"type": "text"},
                "output": {"type": "text"},
                "summary": {"type": "text"},
                "memory_type": {"type": "keyword"}
            }
        }
    },
    "token_usage_log": {
        "mappings": {
            "properties": {
                "tenant_id": {"type": "keyword"},
                "agent_id": {"type": "keyword"},
                "timestamp": {"type": "date"},
                "tokens_used": {"type": "integer"},
                "job_id": {"type": "keyword"}
            }
        }
    },
    "tenant_config": {
        "mappings": {
            "properties": {
                "tenant_id": {"type": "keyword"},
                "limits": {"type": "object"},
                "features": {"type": "object"},
                "created_at": {"type": "date"}
            }
        }
    },
"agent_memory_log": {
    "mappings": {
        "properties": {
            "agent_job_id": {"type": "keyword"},
            "agent_id": {"type": "keyword"},
            "tenant_id": {"type": "keyword"},
            "timestamp": {"type": "date"},
            "step": {"type": "keyword"},
            "input": {"type": "text"},
            "output": {"type": "text"},
            "summary": {"type": "text"},
            "agent_name": { "type": "keyword" },
            "parent_agent": { "type": "keyword" },
            "memory_type": {"type": "keyword"}
        }
    }
}


}
