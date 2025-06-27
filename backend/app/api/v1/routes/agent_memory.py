from fastapi import APIRouter
from app.models.agent_memory import AgentMemoryLog
from app.dao.agent_memory_dao import agent_memory_dao

router = APIRouter(prefix="/memory", tags=["Memory"])

@router.post("/")
def store_memory(log: AgentMemoryLog):
    agent_memory_dao.save(log)
    return {"status": "stored"}

@router.get("/{agent_id}")
def get_memory(agent_id: str):
    return agent_memory_dao.search(filters={"agent_id": agent_id})


@router.get("/agent-memory/tenant/{tenant_id}")
def get_memory_by_tenant(tenant_id: str):
    return agent_memory_dao.search(filters={"tenant_id": tenant_id})
