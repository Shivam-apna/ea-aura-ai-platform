from fastapi import APIRouter
from app.services.chaining_controller import execute_chain
from uuid import uuid4
from datetime import datetime

router = APIRouter()

@router.post("/test-agent-run")
def test_agent_run():
    test_job_id = str(uuid4())
    test_input = "Sales declined by 30% and user churn increased last week."
    tenant_id = "tenant-xyz"

    agent_chain = ["BusinessVitalityAgent", "MissionAlignmentAgent"]

    execute_chain(job_id=test_job_id, job_input=test_input, agent_chain=agent_chain, tenant_id=tenant_id)

    return {
        "message": "Test agent run triggered.",
        "job_id": test_job_id,
        "timestamp": str(datetime.utcnow())
    }
