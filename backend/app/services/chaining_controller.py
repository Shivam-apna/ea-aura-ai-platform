from app.dao.agent_memory_dao import agent_memory_dao
from app.dao.sub_agent_chain_dao import sub_agent_chain_dao
from app.utils.agent_config_loader import get_agent_config
from app.services.llm_runner import real_agent_response
from datetime import datetime
import time
import uuid

def execute_chain(job_id: str, job_input: str, agent_chain: list[str], tenant_id: str):
    current_input = job_input

    for step_index, agent_name in enumerate(agent_chain):
        agent_config = get_agent_config(agent_name)

        if agent_config.get("type") == "agent":
            sub_agents = agent_config.get("sub_agents", [])
            for sub_agent_name in sub_agents:
                sub_output = real_agent_response(sub_agent_name, current_input)

                # Save to memory
                agent_memory_dao.save({
                    "agent_job_id": job_id,
                    "agent_id": sub_agent_name,
                    "tenant_id": tenant_id,
                    "timestamp": datetime.utcnow(),
                    "step": f"{step_index}.{sub_agent_name}",
                    "input": current_input,
                    "output": sub_output,
                    "memory_type": "contextual"
                })

                # Save to sub_agent_chain with parent reference
                sub_agent_chain_dao.save({
                    "chain_id": f"{job_id}_{step_index}_{sub_agent_name}",
                    "job_id": job_id,
                    "step": step_index,
                    "agent_name": sub_agent_name,
                    "parent_agent": agent_name,  # ✅ NEW FIELD
                    "status": "COMPLETED",
                    "log": sub_output
                })

                current_input = sub_output
                time.sleep(0.2)

        else:
            # Handle sub-agent or direct agent
            output = real_agent_response(agent_name, current_input)

            agent_memory_dao.save({
                "agent_job_id": job_id,
                "agent_id": agent_name,
                "tenant_id": tenant_id,
                "timestamp": datetime.utcnow(),
                "step": str(step_index),
                "input": current_input,
                "output": output,
                "memory_type": "contextual"
            })

            sub_agent_chain_dao.save({
                "chain_id": f"{job_id}_{step_index}",
                "job_id": job_id,
                "step": step_index,
                "agent_name": agent_name,
                "parent_agent": None,  # ✅ Clearly mark it as top-level
                "status": "COMPLETED",
                "log": output
            })

            current_input = output
            time.sleep(0.2)
