from app.core.base_dao import BaseDAO
from app.models.sub_agent_chain import SubAgentChain

sub_agent_chain_dao = BaseDAO(index="sub_agent_chain", model=SubAgentChain)
