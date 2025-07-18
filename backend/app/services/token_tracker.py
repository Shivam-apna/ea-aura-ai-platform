from datetime import datetime
from typing import Dict, List
from dataclasses import dataclass
from transformers import AutoTokenizer
from app.core.core_log import agent_logger as logger


@dataclass
class TokenUsage:
    """Data class to track token usage for each agent"""
    agent_id: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    model_name: str
    timestamp: datetime
    step: int


class TokenTracker:
    """Centralized token tracking system"""
    
    def __init__(self):
        self.token_usage: Dict[str, List[TokenUsage]] = {}
        self.job_token_summary: Dict[str, Dict[str, int]] = {}
    
    def count_tokens_with_transformers(self, text: str, model_name: str = "NousResearch/Llama-2-7b-hf") -> int:
        """Count tokens using transformers library"""
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_name)
        except OSError:
            tokenizer = AutoTokenizer.from_pretrained("NousResearch/Llama-2-7b-hf")
        tokens = tokenizer.encode(text, add_special_tokens=False)
        return len(tokens)
    
    def track_agent_tokens(self, agent_id: str, input_text: str, output_text: str, 
                          model_name: str, step: int = 0) -> TokenUsage:
        """Track tokens for a specific agent"""
        input_tokens = self.count_tokens_with_transformers(input_text, model_name)
        output_tokens = self.count_tokens_with_transformers(output_text, model_name)
        total_tokens = input_tokens + output_tokens
        
        token_usage = TokenUsage(
            agent_id=agent_id,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            model_name=model_name,
            timestamp=datetime.utcnow(),
            step=step
        )
        
        # Store in tracking dictionary
        if agent_id not in self.token_usage:
            self.token_usage[agent_id] = []
        self.token_usage[agent_id].append(token_usage)
        
        logger.info(f"🔢 Token usage tracked for {agent_id}", extra={
            "agent_id": agent_id,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "model": model_name,
            "step": step
        })
        
        return token_usage
    
    def get_agent_token_summary(self, agent_id: str) -> Dict[str, int]:
        """Get token summary for a specific agent"""
        if agent_id not in self.token_usage:
            return {"total_tokens": 0, "input_tokens": 0, "output_tokens": 0, "calls": 0}
        
        usage_list = self.token_usage[agent_id]
        return {
            "total_tokens": sum(usage.total_tokens for usage in usage_list),
            "input_tokens": sum(usage.input_tokens for usage in usage_list),
            "output_tokens": sum(usage.output_tokens for usage in usage_list),
            "calls": len(usage_list)
        }
    
    def get_job_token_summary(self, job_id: str) -> Dict[str, Dict[str, int]]:
        """Get comprehensive token summary for entire job"""
        summary = {}
        total_job_tokens = 0
        
        for agent_id, usage_list in self.token_usage.items():
            agent_summary = self.get_agent_token_summary(agent_id)
            summary[agent_id] = agent_summary
            total_job_tokens += agent_summary["total_tokens"]
        
        summary["job_total"] = {"total_tokens": total_job_tokens}
        return summary
    
    def reset_tracking(self):
        """Reset token tracking for new job"""
        self.token_usage.clear()
        self.job_token_summary.clear()


# Global token tracker instance
token_tracker = TokenTracker()


def count_tokens_with_transformers(text: str, model_name: str = "NousResearch/Llama-2-7b-hf"):
    """Legacy function - now uses TokenTracker"""
    return token_tracker.count_tokens_with_transformers(text, model_name)


def get_token_usage_by_job(job_id: str) -> Dict[str, any]:
    """Get token usage summary for a specific job from database"""
    try:
        from app.dao.agent_memory_dao import agent_memory_dao
        
        memories = agent_memory_dao.get_by_job_id(job_id)
        
        token_summary = {}
        total_tokens = 0
        
        for memory in memories:
            agent_id = memory.get("agent_id", "unknown")
            if agent_id not in token_summary:
                token_summary[agent_id] = {
                    "total_tokens": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "calls": 0,
                    "model": memory.get("model_name", "unknown")
                }
            
            token_summary[agent_id]["total_tokens"] += memory.get("token_count", 0)
            token_summary[agent_id]["input_tokens"] += memory.get("input_tokens", 0)
            token_summary[agent_id]["output_tokens"] += memory.get("output_tokens", 0)
            token_summary[agent_id]["calls"] += 1
            total_tokens += memory.get("token_count", 0)
        
        return {
            "job_id": job_id,
            "agents": token_summary,
            "total_tokens": total_tokens
        }
    except Exception as e:
        logger.error(f"Error getting token usage for job {job_id}: {str(e)}")
        return {"error": str(e)}


def get_token_usage_by_agent(agent_id: str, start_date: datetime = None, end_date: datetime = None) -> Dict[str, any]:
    """Get token usage summary for a specific agent across multiple jobs"""
    try:
        from app.dao.agent_memory_dao import agent_memory_dao
        
        memories = agent_memory_dao.get_by_agent_id(agent_id, start_date, end_date)
        
        total_tokens = 0
        total_input_tokens = 0
        total_output_tokens = 0
        total_calls = 0
        jobs = set()
        
        for memory in memories:
            total_tokens += memory.get("token_count", 0)
            total_input_tokens += memory.get("input_tokens", 0)
            total_output_tokens += memory.get("output_tokens", 0)
            total_calls += 1
            jobs.add(memory.get("agent_job_id"))
        
        return {
            "agent_id": agent_id,
            "total_tokens": total_tokens,
            "input_tokens": total_input_tokens,
            "output_tokens": total_output_tokens,
            "total_calls": total_calls,
            "unique_jobs": len(jobs),
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            }
        }
    except Exception as e:
        logger.error(f"Error getting token usage for agent {agent_id}: {str(e)}")
        return {"error": str(e)}


def get_token_usage_report(tenant_id: str, start_date: datetime = None, end_date: datetime = None) -> Dict[str, any]:
    """Generate comprehensive token usage report for a tenant"""
    try:
        from app.dao.agent_memory_dao import agent_memory_dao
        
        memories = agent_memory_dao.get_by_tenant_id(tenant_id, start_date, end_date)
        
        agent_summary = {}
        job_summary = {}
        total_tokens = 0
        
        for memory in memories:
            agent_id = memory.get("agent_id", "unknown")
            job_id = memory.get("agent_job_id", "unknown")
            tokens = memory.get("token_count", 0)
            input_tokens = memory.get("input_tokens", 0)
            output_tokens = memory.get("output_tokens", 0)
            
            # Agent summary
            if agent_id not in agent_summary:
                agent_summary[agent_id] = {
                    "total_tokens": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "calls": 0,
                    "jobs": set()
                }
            
            agent_summary[agent_id]["total_tokens"] += tokens
            agent_summary[agent_id]["input_tokens"] += input_tokens
            agent_summary[agent_id]["output_tokens"] += output_tokens
            agent_summary[agent_id]["calls"] += 1
            agent_summary[agent_id]["jobs"].add(job_id)
            
            # Job summary
            if job_id not in job_summary:
                job_summary[job_id] = {
                    "total_tokens": 0,
                    "agents": set(),
                    "timestamp": memory.get("timestamp")
                }
            
            job_summary[job_id]["total_tokens"] += tokens
            job_summary[job_id]["agents"].add(agent_id)
            
            total_tokens += tokens
        
        # Convert sets to counts for JSON serialization
        for agent_id in agent_summary:
            agent_summary[agent_id]["unique_jobs"] = len(agent_summary[agent_id]["jobs"])
            del agent_summary[agent_id]["jobs"]
        
        for job_id in job_summary:
            job_summary[job_id]["unique_agents"] = len(job_summary[job_id]["agents"])
            del job_summary[job_id]["agents"]
        
        return {
            "tenant_id": tenant_id,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            },
            "summary": {
                "total_tokens": total_tokens,
                "total_jobs": len(job_summary),
                "total_agents": len(agent_summary),
                "average_tokens_per_job": total_tokens / len(job_summary) if job_summary else 0
            },
            "agents": agent_summary,
            "jobs": job_summary
        }
    except Exception as e:
        logger.error(f"Error generating token usage report for tenant {tenant_id}: {str(e)}")
        return {"error": str(e)}