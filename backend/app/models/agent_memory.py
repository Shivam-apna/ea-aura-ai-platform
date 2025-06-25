from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AgentMemoryLog(BaseModel):
    agent_job_id: str
    agent_id: str
    tenant_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    step: str
    input: str
    output: str
    summary: Optional[str] = None
    memory_type: Optional[str] = "contextual"
