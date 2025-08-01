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
from fastapi import UploadFile, File, Form, APIRouter
import pandas as pd
from elasticsearch import Elasticsearch, helpers
import os
from app.services.excel_to_elasticsearch import ExcelToElasticsearch
import tempfile


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
    


@router.post("/uploadfile")
async def upload_file(
    file: UploadFile = File(...),
    sub_index: str = Form(...),
    index_name: str = Form(...),
    tenant_id: str = Form(...)
):
    temp_path = None
    try:
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls')):
            return JSONResponse(
                status_code=400,
                content={"error": "Only Excel files (.xlsx, .xls) are supported"}
            )

        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        logger.info(f"Processing file: {file.filename}, size: {len(content)} bytes")

        # Initialize and validate Elasticsearch connection
        pipeline = ExcelToElasticsearch(index_name=index_name, sub_index=sub_index,tenant_id=tenant_id)
        
        if not pipeline.validate_elasticsearch_connection():
            return JSONResponse(
                status_code=503,
                content={"error": "Elasticsearch connection failed"}
            )

        # Process the Excel file
        pipeline.process_excel(temp_path)

        return {
            "message": f"File '{file.filename}' processed and indexed successfully.",
            "index_name": index_name,
            "sub_index": sub_index,
            "tenant_id": pipeline.tenant_id
        }

    except Exception as e:
        logger.exception(f"Error processing file {file.filename}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Failed to process file: {str(e)}",
                "file": file.filename
            }
        )
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.info(f"Temporary file {temp_path} cleaned up")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {str(e)}")