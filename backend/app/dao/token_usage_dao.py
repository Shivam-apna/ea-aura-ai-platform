from app.core.base_dao import BaseDAO
from app.models.token_usage import TokenUsageRecord
from typing import Dict, List, Any
from datetime import datetime




token_usage_dao = BaseDAO(index="token_usage", model=TokenUsageRecord)




def save_token_usage(tenant_id: str, agent_id: str, job_id: str,
                    input_tokens: int, output_tokens: int, model_name: str):
    """Save token usage record"""
    month = datetime.utcnow().strftime("%Y-%m")
   
    record = {
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "job_id": job_id,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "model_name": model_name,
        "timestamp": datetime.utcnow(),
        "month": month
    }
   
    token_usage_dao.save(record)
    return record




def get_tenant_token_summary(tenant_id: str, month: str = None) -> Dict[str, Any]:
    """Get token usage summary for a tenant, optionally filtered by month"""
    filters = {"tenant_id": tenant_id}
    if month:
        filters["month"] = month
   
    records = token_usage_dao.search(filters=filters, limit=10000)
   
    total_tokens = 0
    total_input = 0
    total_output = 0
    agent_summary = {}
    job_summary = {}
   
    for record in records:
        tokens = record.get("total_tokens", 0)
        input_tokens = record.get("input_tokens", 0)
        output_tokens = record.get("output_tokens", 0)
        agent_id = record.get("agent_id", "unknown")
        job_id = record.get("job_id", "unknown")
       
        total_tokens += tokens
        total_input += input_tokens
        total_output += output_tokens
       
        # Per-agent summary
        if agent_id not in agent_summary:
            agent_summary[agent_id] = {
                "total_tokens": 0,
                "input_tokens": 0,
                "output_tokens": 0,
                "calls": 0
            }
        agent_summary[agent_id]["total_tokens"] += tokens
        agent_summary[agent_id]["input_tokens"] += input_tokens
        agent_summary[agent_id]["output_tokens"] += output_tokens
        agent_summary[agent_id]["calls"] += 1
       
        # Per-job summary
        if job_id not in job_summary:
            job_summary[job_id] = {
                "total_tokens": 0,
                "agents": set()
            }
        job_summary[job_id]["total_tokens"] += tokens
        job_summary[job_id]["agents"].add(agent_id)
   
    # Convert sets to counts for JSON serialization
    for job_id in job_summary:
        job_summary[job_id]["unique_agents"] = len(job_summary[job_id]["agents"])
        job_summary[job_id]["agents"] = list(job_summary[job_id]["agents"])
   
    return {
        "tenant_id": tenant_id,
        "month": month or "all",
        "summary": {
            "total_tokens": total_tokens,
            "input_tokens": total_input,
            "output_tokens": total_output,
            "total_jobs": len(job_summary),
            "total_agents": len(agent_summary)
        },
        "agents": agent_summary,
        "jobs": job_summary
    }




def get_all_tenants_summary() -> List[Dict[str, Any]]:
    """Get token usage summary for all tenants"""
    records = token_usage_dao.search(limit=10000)
   
    tenant_data = {}
    for record in records:
        tenant_id = record.get("tenant_id", "unknown")
        month = record.get("month", "unknown")
        tokens = record.get("total_tokens", 0)
       
        if tenant_id not in tenant_data:
            tenant_data[tenant_id] = {
                "total_tokens": 0,
                "months": set(),
                "last_updated": record.get("timestamp")
            }
       
        tenant_data[tenant_id]["total_tokens"] += tokens
        tenant_data[tenant_id]["months"].add(month)
        tenant_data[tenant_id]["last_updated"] = max(
            tenant_data[tenant_id]["last_updated"],
            record.get("timestamp")
        )
   
    # Convert to list and format
    result = []
    for tenant_id, data in tenant_data.items():
        result.append({
            "tenant_id": tenant_id,
            "total_tokens": data["total_tokens"],
            "months_active": len(data["months"]),
            "last_updated": data["last_updated"]
        })
   
    # Sort by total tokens descending
    result.sort(key=lambda x: x["total_tokens"], reverse=True)
    return result
