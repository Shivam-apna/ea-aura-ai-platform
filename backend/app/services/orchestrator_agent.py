from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from app.dao.agent_memory_dao import agent_memory_dao
from app.dao.sub_agent_chain_dao import sub_agent_chain_dao
from app.utils.agent_config_loader import get_all_agent_configs
from app.services.general_agent import GeneralAgent
from app.groq_config import get_groq_config
from datetime import datetime
import uuid
from transformers import AutoTokenizer


def count_tokens_with_transformers(text: str, model_name: str = "NousResearch/Llama-2-7b-hf"):
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
    except OSError:
        tokenizer = AutoTokenizer.from_pretrained("NousResearch/Llama-2-7b-hf")
    tokens = tokenizer.encode(text, add_special_tokens=False)
    return len(tokens)


def match_agent_by_keywords(user_input: str):
    configs = get_all_agent_configs()
    for agent_name, agent_data in configs.items():
        if "keywords" in agent_data:
            for kw in agent_data["keywords"]:
                if kw.lower() in user_input.lower():
                    return agent_name, agent_data
    return None, None


def run_autogen_agent(input_text: str, tenant_id: str):
    job_id = str(uuid.uuid4())
    step_index = -1
    groq_config = get_groq_config()

    selected_agent, agent_data = match_agent_by_keywords(input_text)

    if not selected_agent:
        general_agent = GeneralAgent()
        general_response = general_agent.run(input_text)
        full_output = "No matching agent found. Handing over to my general agent friend...\n\n" + general_response

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

    # === Matching Agent Found ===
    prompt_template = agent_data.get("prompt_template", "Analyze this:\n\n{{input}} Always respond in clear natural language.")

    if selected_agent == "SalesAgent":
        prompt_template = (
            "You are a helpful financial analyst assistant. Given the following business data, answer the user's query in clear, conversational language. "
            "Be precise, use relevant numbers, and never include code or ask what the user wants — just answer what they asked based on data.\n\n"
            "{{input}}\n\nUser Question: " + input_text
        )
        from app.services.es_search import query_sales_data
        business_name = "PILKHAN TREE (Retail Entrepreneur)"
        sales_data = query_sales_data(business_name=business_name, query_text=input_text)
        final_input = sales_data
    else:
        final_input = input_text

    final_prompt = prompt_template.replace("{{input}}", final_input)

    # === Models ===
    agent_model = agent_data.get("model", "llama3-70b-8192")
    orchestrator_model = "llama3-8b-8192"

    agent_config_list = [{
        "model": agent_model,
        "api_key": groq_config["api_key"],
        "base_url": groq_config["base_url"]
    }]
    orchestrator_config_list = [{
        "model": orchestrator_model,
        "api_key": groq_config["api_key"],
        "base_url": groq_config["base_url"]
    }]

    # === Token Count for Selected Agent ===
    selected_input_tokens = count_tokens_with_transformers(final_prompt, model_name=agent_model)

    # === AutoGen Setup ===
    assistant = AssistantAgent(name=selected_agent, llm_config={"config_list": agent_config_list})
    user_proxy = UserProxyAgent(name="user", human_input_mode="NEVER")
    group_chat = GroupChat(agents=[user_proxy, assistant], messages=[], max_round=2)
    manager = GroupChatManager(groupchat=group_chat, llm_config={"config_list": orchestrator_config_list})

    user_proxy.initiate_chat(manager, message=final_prompt)
    last_response = group_chat.messages[-1]["content"]

    # === Token Counts ===
    selected_output_tokens = count_tokens_with_transformers(last_response, model_name=agent_model)
    selected_total_tokens = selected_input_tokens + selected_output_tokens

    orchestrator_input_tokens = count_tokens_with_transformers(final_prompt, model_name=orchestrator_model)
    orchestrator_output_tokens = count_tokens_with_transformers(last_response, model_name=orchestrator_model)
    orchestrator_total_tokens = orchestrator_input_tokens + orchestrator_output_tokens

    print("\n--- TOKEN USAGE SUMMARY ---")
    print(f"Selected agent: {selected_agent} (model={agent_model})")
    print(f"  • Input tokens:  {selected_input_tokens}")
    print(f"  • Output tokens: {selected_output_tokens}")
    print(f"  • Total:         {selected_total_tokens}")
    print(f"Orchestrator (model={orchestrator_model}):")
    print(f"  • Input tokens:  {orchestrator_input_tokens}")
    print(f"  • Output tokens: {orchestrator_output_tokens}")
    print(f"  • Total:         {orchestrator_total_tokens}")
    print("----------------------------\n")

    # === Save Logs ===
    agent_memory_dao.save({
        "agent_job_id": job_id,
        "agent_id": "autogen_orchestrator",
        "tenant_id": tenant_id,
        "timestamp": datetime.utcnow(),
        "step": -1,
        "input": input_text,
        "output": last_response,
        "memory_type": "contextual",
        "token_count": orchestrator_total_tokens
    })
    sub_agent_chain_dao.save({
        "chain_id": f"{job_id}_-1",
        "job_id": job_id,
        "step": -1,
        "agent_name": "autogen_orchestrator",
        "parent_agent": None,
        "status": "COMPLETED",
        "log": last_response
    })

    agent_memory_dao.save({
        "agent_job_id": job_id,
        "agent_id": selected_agent,
        "tenant_id": tenant_id,
        "timestamp": datetime.utcnow(),
        "step": 0,
        "input": final_prompt,
        "output": last_response,
        "memory_type": "contextual",
        "token_count": selected_total_tokens
    })
    sub_agent_chain_dao.save({
        "chain_id": f"{job_id}_0",
        "job_id": job_id,
        "step": 0,
        "agent_name": selected_agent,
        "parent_agent": "autogen_orchestrator",
        "status": "COMPLETED",
        "log": last_response
    })

    return {
        "job_id": job_id,
        "selected_agent": selected_agent,
        "response": last_response,
    }
