from fastapi import FastAPI
# API v1 routes
from app.dao.job_index import index_job
from app.api.v1.routes import health, agent_job, sub_agent_chain, agent_memory, test_agent_run
from app.core.index_manager import IndexManager
from app.core.elastic import get_es_client
from app.api.v1.routes import orchestrator

app = FastAPI()

#Include all API routers

app.include_router(health.router, prefix="/api/v1/health", tags=["Health"])
app.include_router(orchestrator.router, prefix="/api/v1", tags=["Orchestrator"])
app.include_router(agent_job.router, prefix="/api/v1")
app.include_router(sub_agent_chain.router, prefix="/api/v1")
app.include_router(agent_memory.router, prefix="/api/v1")
app.include_router(test_agent_run.router, tags=["Debug"])

#One startup event for both ES + Index init
@app.on_event("startup")
async def startup_event():
    get_es_client()
    IndexManager.create_indices()

#Root endpoint
@app.get("/")
async def root():
    return {"message": "EA AURA AI Platform"}
