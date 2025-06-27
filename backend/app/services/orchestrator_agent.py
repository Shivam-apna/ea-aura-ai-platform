from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from app.dao.agent_memory_dao import agent_memory_dao
from app.dao.sub_agent_chain_dao import sub_agent_chain_dao
from app.utils.agent_config_loader import get_agent_config, get_all_agent_configs
from app.services.general_agent import GeneralAgent
from app.groq_config import get_groq_config
from datetime import datetime
import uuid


def match_agent_by_keywords(user_input: str):
    configs = get_all_agent_configs()
    matches = []
    for agent_name, agent_data in configs.items():
        if "keywords" in agent_data:
            for kw in agent_data["keywords"]:
                if kw.lower() in user_input.lower():
                    matches.append((agent_name, agent_data))
                    break
    return matches[0] if matches else (None, None)

# orchestrator agent logic
def run_autogen_agent(input_text: str, tenant_id: str):
    job_id = str(uuid.uuid4())
    step_index = -1  # orchestrator step

    # Load LLM config for fallback general agent
    groq_config = get_groq_config()

    # Match agent dynamically
    selected_agent, agent_data = match_agent_by_keywords(input_text)

    # =====================
    #  No matching agent → fallback to general agent
    # =====================
    if not selected_agent:

        # Load Groq config
        general_agent = GeneralAgent()
        general_response = general_agent.run(input_text)

        orchestrator_note = "No matching agent found. Handing over to my general agent friend..."
        full_output = f"{orchestrator_note}\n\n{general_response}"

        # Save orchestrator fallback log
        agent_memory_dao.save({
            "agent_job_id": job_id,
            "agent_id": "autogen_orchestrator",
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow(),
            "step": step_index,
            "input": input_text,
            "output": full_output,
            "memory_type": "contextual"
        })

        sub_agent_chain_dao.save({
            "chain_id": f"{job_id}_{step_index}",
            "job_id": job_id,
            "step": step_index,
            "agent_name": "autogen_orchestrator",
            "parent_agent": None,
            "status": "COMPLETED",
            "log": full_output
        })

        # Save general agent response
        step_index = 0
        agent_memory_dao.save({
            "agent_job_id": job_id,
            "agent_id": "GeneralAgent",
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow(),
            "step": step_index,
            "input": input_text,
            "output": general_response,
            "memory_type": "contextual"
        })

        sub_agent_chain_dao.save({
            "chain_id": f"{job_id}_{step_index}",
            "job_id": job_id,
            "step": step_index,
            "agent_name": "GeneralAgent",
            "parent_agent": "autogen_orchestrator",
            "status": "COMPLETED",
            "log": general_response
        })

        return {
            "job_id": job_id,
            "selected_agent": "GeneralAgent",
            "response": general_response
        }


    # =====================
    # ✅ Matching sub-agent found → proceed with AutoGen
    # =====================
    prompt_template = agent_data.get("prompt_template", "Analyze this:\n\n{{input}}")
    final_prompt = prompt_template.replace("{{input}}", input_text)

    config_list = [{
        "model": agent_data.get("model", "gemma2-9b-it"),
        "api_key": groq_config["api_key"],
        "base_url": groq_config["base_url"]
    }]

    assistant = AssistantAgent(name=selected_agent, llm_config={"config_list": config_list})
    user_proxy = UserProxyAgent(name="user", human_input_mode="NEVER")
    group_chat = GroupChat(agents=[user_proxy, assistant], messages=[], max_round=2)
    manager = GroupChatManager(groupchat=group_chat, llm_config={"config_list": config_list})

    user_proxy.initiate_chat(manager, message=final_prompt)
    last_response = group_chat.messages[-1]["content"]

    # Save orchestrator step
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

    sub_agent_chain_dao.save({
        "chain_id": f"{job_id}_{step_index}",
        "job_id": job_id,
        "step": step_index,
        "agent_name": "autogen_orchestrator",
        "parent_agent": None,
        "status": "COMPLETED",
        "log": last_response
    })

    # Save matched agent step
    step_index = 0
    agent_memory_dao.save({
        "agent_job_id": job_id,
        "agent_id": selected_agent,
        "tenant_id": tenant_id,
        "timestamp": datetime.utcnow(),
        "step": step_index,
        "input": final_prompt,
        "output": last_response,
        "memory_type": "contextual"
    })

    sub_agent_chain_dao.save({
        "chain_id": f"{job_id}_{step_index}",
        "job_id": job_id,
        "step": step_index,
        "agent_name": selected_agent,
        "parent_agent": "autogen_orchestrator",
        "status": "COMPLETED",
        "log": last_response
    })

    return {
        "job_id": job_id,
        "selected_agent": selected_agent,
        "response": last_response
    }
