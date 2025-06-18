from fastapi import FastAPI
from app.dao import job_index

app = FastAPI()

# API v1 routes
app.include_router(health.router, prefix="/api/v1/health", tags=["Health"])
app.include_router(agent_job.router, prefix="/api/v1/")

@app.on_event("startup")
async def startup_event():
    job_index.create_index_if_not_exists()


@app.get("/")
async def root():
    return {"message": "EA AURA AI Platform"}

