# backend/app/models/sub_agent_chain.py

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SubAgent(BaseModel):
    id: str
    name: str
    prompt: Optional[str] = None
    created_at: datetime  # individual subagent creation time
    parent_agent: Optional[str] = None 

class SubAgentChain(BaseModel):
    id: Optional[str]
    tenant_id: str
    job_id: str
    agent_id: str
    subagents: List[SubAgent]
    created_at: datetime  # timestamp of the whole chain creation
