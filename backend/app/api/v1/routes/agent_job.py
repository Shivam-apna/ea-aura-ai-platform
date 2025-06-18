# backend/app/api/v1/routes/agent_job.py

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
