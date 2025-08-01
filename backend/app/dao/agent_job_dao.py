from app.core.base_dao import BaseDAO
from app.models.agent_job import AgentJob

agent_job_dao = BaseDAO(index="agent_job", model=AgentJob)
