from fastapi import APIRouter
from typing import Dict, Any
from app.dao.sub_agent_chain_dao import sub_agent_chain_dao
from app.dao.agent_memory_dao import agent_memory_dao


router = APIRouter(prefix="/status", tags=["Status"]) 


@router.get("/job/{job_id}")
def get_job_status(job_id: str) -> Dict[str, Any]:
	records = sub_agent_chain_dao.search(filters={"job_id": job_id}, limit=1000)
	# Sort by step and then agent name for readability
	steps = sorted(records, key=lambda r: (r.get("step", 0), r.get("agent_name", "")))

	# Determine overall status
	statuses = [s.get("status", "UNKNOWN") for s in steps]
	if any(s == "FAILED" for s in statuses):
		overall = "FAILED"
	elif any(s == "RUNNING" for s in statuses):
		overall = "RUNNING"
	elif steps:
		overall = "COMPLETED"
	else:
		overall = "PENDING"

	return {
		"job_id": job_id,
		"status": overall,
		"steps": steps,
	}


@router.get("/tenant/{tenant_id}/token-usage")
def get_tenant_token_usage(tenant_id: str) -> Dict[str, Any]:
	# Pull memories for tenant and aggregate token fields
	memories = agent_memory_dao.search(filters={"tenant_id": tenant_id}, limit=10000)

	per_agent: Dict[str, Dict[str, Any]] = {}
	per_job: Dict[str, Dict[str, Any]] = {}
	total_tokens = 0

	for m in memories:
		agent_id = m.get("agent_id", "unknown")
		job_id = m.get("agent_job_id", "unknown")
		input_tokens = int(m.get("input_tokens", 0) or 0)
		output_tokens = int(m.get("output_tokens", 0) or 0)
		model = m.get("model_name", "unknown")
		tokens = int(m.get("token_count", input_tokens + output_tokens) or 0)

		# Per-agent aggregation
		agent_bucket = per_agent.setdefault(agent_id, {
			"total_tokens": 0,
			"input_tokens": 0,
			"output_tokens": 0,
			"calls": 0,
			"model": model,
		})
		agent_bucket["total_tokens"] += tokens
		agent_bucket["input_tokens"] += input_tokens
		agent_bucket["output_tokens"] += output_tokens
		agent_bucket["calls"] += 1

		# Per-job aggregation
		job_bucket = per_job.setdefault(job_id, {
			"total_tokens": 0,
			"agents": set(),
		})
		job_bucket["total_tokens"] += tokens
		job_bucket["agents"].add(agent_id)

		total_tokens += tokens

	# Convert sets to counts for JSON safety
	per_job_serialized = {
		jid: {**data, "unique_agents": len(data["agents"])} | {"agents": sorted(list(data["agents"]))}
		for jid, data in per_job.items()
	}

	return {
		"tenant_id": tenant_id,
		"summary": {
			"total_tokens": total_tokens,
			"total_jobs": len(per_job_serialized),
			"total_agents": len(per_agent),
		},
		"agents": per_agent,
		"jobs": per_job_serialized,
	}


