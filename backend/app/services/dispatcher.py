from app.dao.agent_job_dao import agent_job_dao
from app.dao.sub_agent_chain_dao import sub_agent_chain_dao
from app.services.chaining_controller import execute_chain
from app.models.agent_job import AgentJob
import uuid
from datetime import datetime

def dispatch_agent_job(job_input: str, tenant_id: str, agent_chain: list[str]):
    job_id = str(uuid.uuid4())
    
    job = AgentJob(
        job_id=job_id,
        tenant_id=tenant_id,
        input=job_input,
        output="",
        status="QUEUED",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    agent_job_dao.save(job)

    for i, agent_name in enumerate(agent_chain):
        sub_agent_chain_dao.save({
            "chain_id": f"{job_id}_{i}",
            "job_id": job_id,
            "step": i,
            "agent_name": agent_name,
            "status": "PENDING",
            "log": ""
        })

    execute_chain(job_id, job_input, agent_chain, tenant_id)
    return {"job_id": job_id}
