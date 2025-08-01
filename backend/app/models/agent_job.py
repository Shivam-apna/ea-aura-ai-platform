from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AgentJob(BaseModel):
    id: Optional[str]
    tenant_id: str
    job_type: str
    status: str
    created_at: datetime
