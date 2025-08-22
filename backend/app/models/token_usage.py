from pydantic import BaseModel
from typing import Optional
from datetime import datetime




class TokenUsageRecord(BaseModel):
    id: Optional[str] = None
    tenant_id: str
    agent_id: str
    job_id: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    model_name: str
    timestamp: datetime = datetime.utcnow()
    month: str  # YYYY-MM format for easy aggregation