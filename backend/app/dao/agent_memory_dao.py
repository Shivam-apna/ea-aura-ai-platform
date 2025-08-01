from app.core.base_dao import BaseDAO
from app.models.agent_memory import AgentMemoryLog

agent_memory_dao = BaseDAO(index="agent_memory_log", model=AgentMemoryLog)
