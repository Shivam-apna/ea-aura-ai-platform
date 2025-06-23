from app.dao.agent_memory_dao import agent_memory_dao
from app.models.agent_memory import AgentMemoryLog
from datetime import datetime
import uuid

def test_agent_memory_crud():
    doc = AgentMemoryLog(
        agent_job_id=str(uuid.uuid4()),
        agent_id="agent-123",
        tenant_id="tenant-abc",
        step="1",
        input="prompt A",
        output="response A",
        timestamp=datetime.utcnow()
    )
    agent_memory_dao.save(doc)
    results = agent_memory_dao.search(filters={"agent_id": "agent-123"})
    assert any(res["input"] == "prompt A" for res in results)
