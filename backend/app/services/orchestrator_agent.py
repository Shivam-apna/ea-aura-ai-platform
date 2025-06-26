from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from app.dao.agent_memory_dao import agent_memory_dao
from app.dao.sub_agent_chain_dao import sub_agent_chain_dao
from app.groq_config import get_groq_config
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)


def run_autogen_agent(input_text: str, tenant_id: str):
    print("555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555555")
    job_id = str(uuid.uuid4())
    step_index = -1  # ✅ Use integer for Elasticsearch compatibility

    # Load Groq LLM config
    groq_config = get_groq_config()
    config_list = [{
        "model": "gemma2-9b-it",
        "api_key": groq_config["api_key"],
        "base_url": groq_config["base_url"]
    }]

    # Create AutoGen agents
    assistant = AssistantAgent(name="assistant", llm_config={"config_list": config_list})
    user_proxy = UserProxyAgent(name="user", human_input_mode="NEVER")

    # Create a group chat with agents
    group_chat = GroupChat(agents=[user_proxy, assistant], messages=[], max_round=2)
    manager = GroupChatManager(groupchat=group_chat, llm_config={"config_list": config_list})

    # Start the interaction
    user_proxy.initiate_chat(manager, message=input_text)

    # Get the last message content as response
    last_response = group_chat.messages[-1]["content"]


    print("[✅] 88888888888888888888888888888888888888888888888888888Saving memory log for AutoGen...")

    # Save to agent memory (Elasticsearch)
    agent_memory_dao.save({
        "agent_job_id": job_id,
        "agent_id": "autogen_orchestrator",
        "tenant_id": tenant_id,
        "timestamp": datetime.utcnow(),
        "step": step_index,
        "input": input_text,
        "output": last_response,
        "memory_type": "contextual"
    })

    print("[✅] 999999999999999999999999999999999999999999999999Saving sub_agent_chain log for AutoGen...")

    # Save orchestration step (Elasticsearch)
    sub_agent_chain_dao.save({
        "chain_id": f"{job_id}_{step_index}",
        "job_id": job_id,
        "step": step_index,
        "agent_name": "autogen_orchestrator",
        "parent_agent": None,
        "status": "COMPLETED",
        "log": last_response
    })

    return {
        "job_id": job_id,
        "response": last_response
    }
