from datetime import datetime
from typing import Dict, Any
from app.dao.agent_memory_dao import agent_memory_dao
from app.dao.sub_agent_chain_dao import sub_agent_chain_dao
from app.core.core_log import agent_logger as logger


class MemoryManager:
    """Centralized memory management system for agents"""
    
    def __init__(self):
        self.agent_memory_dao = agent_memory_dao
        self.sub_agent_chain_dao = sub_agent_chain_dao
    
    def save_agent_memory(self, agent_id: str, job_id: str, tenant_id: str, 
                         step: int, input_text: str, output_text: str, 
                         token_usage: Any, model_name: str, 
                         memory_type: str = "contextual") -> None:
        """Save agent memory with token information"""
        try:
            memory_data = {
                "agent_job_id": job_id,
                "agent_id": agent_id,
                "tenant_id": tenant_id,
                "timestamp": datetime.utcnow(),
                "step": step,
                "input": input_text,
                "output": output_text,
                "memory_type": memory_type,
                "token_count": token_usage.total_tokens,
                "input_tokens": token_usage.input_tokens,
                "output_tokens": token_usage.output_tokens,
                "model_name": model_name
            }
            
            self.agent_memory_dao.save(memory_data)
            
            logger.info(f"💾 Memory saved for agent {agent_id}", extra={
                "agent_id": agent_id,
                "job_id": job_id,
                "step": step,
                "memory_type": memory_type
            })
            
        except Exception as e:
            logger.error(f"❌ Failed to save memory for agent {agent_id}", extra={
                "agent_id": agent_id,
                "job_id": job_id,
                "error": str(e)
            })
            raise
    
    def save_orchestrator_memory(self, job_id: str, tenant_id: str, 
                               input_text: str, output_text: str, 
                               step: int = -1) -> None:
        """Save orchestrator memory without token tracking"""
        try:
            memory_data = {
                "agent_job_id": job_id,
                "agent_id": "autogen_orchestrator",
                "tenant_id": tenant_id,
                "timestamp": datetime.utcnow(),
                "step": step,
                "input": input_text,
                "output": output_text,
                "memory_type": "contextual"
            }
            
            self.agent_memory_dao.save(memory_data)
            
            logger.info(f"💾 Orchestrator memory saved", extra={
                "job_id": job_id,
                "step": step
            })
            
        except Exception as e:
            logger.error(f"❌ Failed to save orchestrator memory", extra={
                "job_id": job_id,
                "error": str(e)
            })
            raise
    
    def save_sub_agent_chain(self, job_id: str, step: int, agent_name: str, 
                           parent_agent: str, status: str, log: str, 
                           token_usage: Any, model_name: str) -> None:
        """Save sub-agent chain information"""
        try:
            chain_data = {
                "chain_id": f"{job_id}_{step}",
                "job_id": job_id,
                "step": step,
                "agent_name": agent_name,
                "parent_agent": parent_agent,
                "status": status,
                "log": log,
                "token_count": token_usage.total_tokens,
                "input_tokens": token_usage.input_tokens,
                "output_tokens": token_usage.output_tokens,
                "model_name": model_name
            }
            
            self.sub_agent_chain_dao.save(chain_data)
            
            logger.info(f"🔗 Sub-agent chain saved", extra={
                "job_id": job_id,
                "step": step,
                "agent_name": agent_name,
                "parent_agent": parent_agent
            })
            
        except Exception as e:
            logger.error(f"❌ Failed to save sub-agent chain", extra={
                "job_id": job_id,
                "step": step,
                "agent_name": agent_name,
                "error": str(e)
            })
            raise
    
    def save_chain_record(self, job_id: str, step: int, agent_name: str, 
                         parent_agent: str, log: str, token_usage: Dict[str, int]) -> None:
        """Save chain record - wrapper for save_sub_agent_chain with token_usage dict"""
        try:
            # Convert token_usage dict to object-like structure for compatibility
            class TokenUsage:
                def __init__(self, total_tokens, input_tokens, output_tokens):
                    self.total_tokens = total_tokens
                    self.input_tokens = input_tokens
                    self.output_tokens = output_tokens
            
            token_obj = TokenUsage(
                total_tokens=token_usage.get("total_tokens", 0),
                input_tokens=token_usage.get("input_tokens", 0),
                output_tokens=token_usage.get("output_tokens", 0)
            )
            
            self.save_sub_agent_chain(
                job_id=job_id,
                step=step,
                agent_name=agent_name,
                parent_agent=parent_agent,
                status="COMPLETED",
                log=log,
                token_usage=token_obj,
                model_name="unknown"  # Default model name
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to save chain record", extra={
                "job_id": job_id,
                "step": step,
                "agent_name": agent_name,
                "error": str(e)
            })
            raise
    
    def save_complete_agent_flow(self, job_id: str, tenant_id: str, 
                               sub_agent_data: Dict[str, Any], 
                               parent_agent_data: Dict[str, Any], 
                               orchestrator_data: Dict[str, Any]) -> None:
        """Save complete agent flow including sub-agent, parent, and orchestrator"""
        try:
            # Save sub-agent memory
            self.save_agent_memory(
                agent_id=sub_agent_data["agent_id"],
                job_id=job_id,
                tenant_id=tenant_id,
                step=0,
                input_text=sub_agent_data["input"],
                output_text=sub_agent_data["output"],
                token_usage=sub_agent_data["token_usage"],
                model_name=sub_agent_data["model_name"]
            )
            
            # Save parent agent memory
            self.save_agent_memory(
                agent_id=parent_agent_data["agent_id"],
                job_id=job_id,
                tenant_id=tenant_id,
                step=1,
                input_text=parent_agent_data["input"],
                output_text=parent_agent_data["output"],
                token_usage=parent_agent_data["token_usage"],
                model_name=parent_agent_data["model_name"]
            )
            
            # Save orchestrator memory
            self.save_agent_memory(
                agent_id="orchestrator_agent",
                job_id=job_id,
                tenant_id=tenant_id,
                step=2,
                input_text=orchestrator_data["input"],
                output_text=orchestrator_data["output"],
                token_usage=orchestrator_data["token_usage"],
                model_name=orchestrator_data["model_name"]
            )
            
            # Save sub-agent chain records
            self.save_sub_agent_chain(
                job_id=job_id,
                step=0,
                agent_name=sub_agent_data["agent_id"],
                parent_agent="autogen_orchestrator",
                status="COMPLETED",
                log=sub_agent_data["output"],
                token_usage=sub_agent_data["token_usage"],
                model_name=sub_agent_data["model_name"]
            )
            
            self.save_sub_agent_chain(
                job_id=job_id,
                step=1,
                agent_name=parent_agent_data["agent_id"],
                parent_agent=sub_agent_data["agent_id"],
                status="COMPLETED",
                log=parent_agent_data["output"],
                token_usage=parent_agent_data["token_usage"],
                model_name=parent_agent_data["model_name"]
            )
            
            self.save_sub_agent_chain(
                job_id=job_id,
                step=2,
                agent_name="orchestrator_agent",
                parent_agent=parent_agent_data["agent_id"],
                status="COMPLETED",
                log=orchestrator_data["output"],
                token_usage=orchestrator_data["token_usage"],
                model_name=orchestrator_data["model_name"]
            )
            
            logger.info(f"✅ Complete agent flow saved", extra={
                "job_id": job_id,
                "sub_agent": sub_agent_data["agent_id"],
                "parent_agent": parent_agent_data["agent_id"]
            })
            
        except Exception as e:
            logger.error(f"❌ Failed to save complete agent flow", extra={
                "job_id": job_id,
                "error": str(e)
            })
            raise
    
    def get_agent_memory_by_job(self, job_id: str) -> list:
        """Retrieve agent memory for a specific job"""
        try:
            return self.agent_memory_dao.get_by_job_id(job_id)
        except Exception as e:
            logger.error(f"❌ Failed to retrieve memory for job {job_id}", extra={
                "job_id": job_id,
                "error": str(e)
            })
            return []
    
    def get_agent_memory_by_agent(self, agent_id: str, start_date: datetime = None, end_date: datetime = None) -> list:
        """Retrieve agent memory for a specific agent"""
        try:
            return self.agent_memory_dao.get_by_agent_id(agent_id, start_date, end_date)
        except Exception as e:
            logger.error(f"❌ Failed to retrieve memory for agent {agent_id}", extra={
                "agent_id": agent_id,
                "error": str(e)
            })
            return []
    
    def get_agent_memory_by_tenant(self, tenant_id: str, start_date: datetime = None, end_date: datetime = None) -> list:
        """Retrieve agent memory for a specific tenant"""
        try:
            return self.agent_memory_dao.get_by_tenant_id(tenant_id, start_date, end_date)
        except Exception as e:
            logger.error(f"❌ Failed to retrieve memory for tenant {tenant_id}", extra={
                "tenant_id": tenant_id,
                "error": str(e)
            })
            return []


# Global memory manager instance
memory_manager = MemoryManager()