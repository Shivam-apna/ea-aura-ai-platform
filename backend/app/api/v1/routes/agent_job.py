# backend/app/api/v1/routes/agent_job.py
from app.services.dispatcher import dispatch_agent_job
from fastapi import Body
from fastapi import APIRouter
from app.models.agent_job import AgentJob
from app.dao import agent_job_dao

router = APIRouter()

@router.post("/agent-job")
def create_job(job: AgentJob):
    return agent_job_dao.insert_doc(job.dict())

@router.get("/agent-job/{job_id}")
def get_job(job_id: str):
    return agent_job_dao.get_by_id(job_id)

@router.get("/agent-jobs/status/{status}")
def get_jobs_by_status(status: str):
    return agent_job_dao.search_jobs_by_status(status)


@router.post("/run")
def run_agent_job(payload: dict = Body(...)):
    input_text = payload["input"]
    tenant_id = payload["tenant_id"]
    chain = payload["agent_chain"]  # List of agent names
    return dispatch_agent_job(input_text, tenant_id, chain)