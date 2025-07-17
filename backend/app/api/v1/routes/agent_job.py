# backend/app/api/v1/routes/agent_job.py
from app.services.dispatcher import dispatch_agent_job
from fastapi import Body
from fastapi import APIRouter
from app.models.agent_job import AgentJob
from app.services.orchestrator_agent import run_autogen_agent, run_individual_agent
from app.dao import agent_job_dao
from app.core.core_log import logger
from fastapi import Request
from fastapi.responses import JSONResponse

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


@router.post("/run-autogen")
def run_with_autogen(payload: dict = Body(...), request: Request = None):
    """
    Automatic Flow - System automatically chooses the best agent
    Input: input + tenant_id
    Flow: User → Orchestrator → Auto-detect Parent Agent → Auto-select Sub-agent → Response
    """
    input_text = payload.get("input")
    tenant_id = payload.get("tenant_id")

    if not input_text or not tenant_id:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Missing required fields",
                "details": "Both 'input' and 'tenant_id' are required"
            }
        )

    try:
        logger.info("📥 Received /run-autogen request", extra={
            "endpoint": "/api/v1/run-autogen",
            "method": "POST",
            "tenant_id": tenant_id,
            "input_text": input_text
        })

        result = run_autogen_agent(input_text, tenant_id)

        logger.info("✅ /run-autogen completed", extra={
            "tenant_id": tenant_id,
            "job_id": result.get("job_id"),
            "parent_agent": result.get("parent_agent"),
            "sub_agent": result.get("sub_agent"),
            "status": "success"
        })

        return result

    except Exception as e:
        logger.exception("❌ /run-autogen failed", extra={
            "tenant_id": tenant_id,
            "input_text": input_text,
            "error": str(e),
            "status": "failed"
        })

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error during agent execution.",
                "details": str(e)
            }
        )


@router.post("/run-individual-agent")
def run_individual_agent_endpoint(payload: dict = Body(...), request: Request = None):
    """
    Manual Flow - User targets a specific agent directly
    Input: input + tenant_id + agent_name + agent_type (optional)
    Flow: User → Specific Agent → Response
    """
    input_text = payload.get("input")
    tenant_id = payload.get("tenant_id")
    agent_name = payload.get("agent_name")
    agent_type = payload.get("agent_type")  # Optional: "main" or "sub"

    if not input_text or not tenant_id or not agent_name:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Missing required fields",
                "details": "Fields 'input', 'tenant_id', and 'agent_name' are required"
            }
        )

    try:
        logger.info("📥 Received /run-individual-agent request", extra={
            "endpoint": "/api/v1/run-individual-agent",
            "method": "POST",
            "tenant_id": tenant_id,
            "agent_name": agent_name,
            "agent_type": agent_type,
            "input_text": input_text
        })

        result = run_individual_agent(input_text, tenant_id, agent_name, agent_type)

        logger.info("✅ /run-individual-agent completed", extra={
            "tenant_id": tenant_id,
            "job_id": result.get("job_id"),
            "agent_name": agent_name,
            "agent_type": result.get("agent_type"),
            "status": "success" if "error" not in result else "failed"
        })

        return result

    except Exception as e:
        logger.exception("❌ /run-individual-agent failed", extra={
            "tenant_id": tenant_id,
            "agent_name": agent_name,
            "input_text": input_text,
            "error": str(e),
            "status": "failed"
        })

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error during individual agent execution.",
                "details": str(e)
            }
        )