# backend/app/api/v1/routes/sub_agent_chain.py

from fastapi import APIRouter
from app.models.sub_agent_chain import SubAgentChain
from app.dao import sub_agent_chain_dao

router = APIRouter()

@router.post("/sub-agent-chain")
def create_chain(chain: SubAgentChain):
    return sub_agent_chain_dao.insert_doc(chain.dict())

@router.get("/sub-agent-chain/{chain_id}")
def get_chain(chain_id: str):
    return sub_agent_chain_dao.get_by_id(chain_id)
