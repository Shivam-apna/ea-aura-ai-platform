from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from app.dao.agent_memory_dao import agent_memory_dao
from app.dao.sub_agent_chain_dao import sub_agent_chain_dao
from app.utils.agent_config_loader import get_all_agent_configs
from app.services.general_agent import GeneralAgent
from app.groq_config import get_groq_config
from datetime import datetime
import uuid
from transformers import AutoTokenizer
import json
import re
from app.core.core_log import agent_logger as logger 
from openai import BadRequestError
import traceback


def count_tokens_with_transformers(text: str, model_name: str = "NousResearch/Llama-2-7b-hf"):
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
    except OSError:
        tokenizer = AutoTokenizer.from_pretrained("NousResearch/Llama-2-7b-hf")
    tokens = tokenizer.encode(text, add_special_tokens=False)
    return len(tokens)


def match_parent_agent_by_keywords(user_input: str):
    """Match parent agent based on keywords"""
    configs = get_all_agent_configs()
    for agent_name, agent_data in configs.items():
        if agent_data.get("type") == "main" and "keywords" in agent_data:
            for kw in agent_data["keywords"]:
                if kw.lower() in user_input.lower():
                    return agent_name, agent_data
    return None, None


def get_agent_by_name(agent_name: str):
    """Get agent configuration by name (supports both main and sub-agents)"""
    configs = get_all_agent_configs()

    # First check if it's a main agent
    if agent_name in configs:
        return configs[agent_name]

    # Now check within sub-agents of each main agent
    for parent_name, parent_data in configs.items():
        if parent_data.get("type") == "main":
            for sub_agent in parent_data.get("sub_agents", []):
                if sub_agent.get("agent_id") == agent_name:
                    return sub_agent  # Return sub-agent config

    # Not found
    return None


def select_best_subagent(parent_agent_data, user_input: str):
    """Select the best sub-agent based on user input keywords"""
    sub_agents = parent_agent_data.get("sub_agents", [])
    
    # Try to match sub-agent keywords first
    for sub_agent in sub_agents:
        if "keywords" in sub_agent:
            for kw in sub_agent["keywords"]:
                if kw.lower() in user_input.lower():
                    return sub_agent
    
    # If no specific match, return the first available sub-agent
    return sub_agents[0] if sub_agents else None


def get_enhanced_data_for_agent(agent_name: str, input_text: str):
    """Get enhanced data based on agent type"""
    from app.services.es_search import (
        query_sales_data,
        query_customer_survey_data,
        query_mission_alignment_data,
        query_brand_audit_data
    )
    
    business_name = "PILKHAN TREE (Retail Entrepreneur)"
    
    # Map agent names to data queries
    agent_data_mapping = {
        "business_vitality_agent": lambda: query_sales_data( query_text=input_text),
        "customer_survey_agent": lambda: query_customer_survey_data( query_text=input_text),
        "mission_alignment_agent": lambda: query_mission_alignment_data( query_text=input_text),
        "brand_index_agent": lambda: query_brand_audit_data( query_text=input_text)
    }
    
    return agent_data_mapping.get(agent_name, lambda: input_text)()


def execute_single_agent(agent_name: str, agent_data: dict, input_text: str, job_id: str, tenant_id: str):
    """Execute a single agent with the given input"""
    groq_config = get_groq_config()
    
    # Get enhanced data for the agent
    enhanced_data = get_enhanced_data_for_agent(agent_name, input_text)
    
    # Prepare agent prompt
    prompt_template = agent_data.get("prompt_template", "Analyze this:\n\n{{input}}")
    agent_prompt = prompt_template.replace("{{input}}", enhanced_data)
    
    if "{{question}}" in agent_prompt:
        agent_prompt = agent_prompt.replace("{{question}}", input_text)
    elif 'USER QUESTION:\n""' in agent_prompt:
        agent_prompt = agent_prompt.replace('USER QUESTION:\n""', f'USER QUESTION:\n"{input_text}"')
    elif 'USER QUESTION:' in agent_prompt:
        agent_prompt = f"{agent_prompt}\n\"{input_text}\""
    else:
        agent_prompt = f"{agent_prompt}\n\nUser question: {input_text}"
    
    # Configure agent
    model = agent_data["llm_config"]["model"]
    config_list = [{
        "model": model,
        "api_key": groq_config["api_key"],
        "base_url": groq_config["base_url"]
    }]
    
    try:
        # Execute agent
        assistant = AssistantAgent(name=agent_name, llm_config={"config_list": config_list})
        user_proxy = UserProxyAgent(name="user", human_input_mode="NEVER")
        group_chat = GroupChat(agents=[user_proxy, assistant], messages=[], max_round=2)
        manager = GroupChatManager(groupchat=group_chat, llm_config={"config_list": config_list})
        
        user_proxy.initiate_chat(manager, message=agent_prompt)
        response = group_chat.messages[-1]["content"]
        
        # Save to memory
        agent_memory_dao.save({
            "agent_job_id": job_id,
            "agent_id": agent_name,
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow(),
            "step": 0,
            "input": agent_prompt,
            "output": response,
            "memory_type": "contextual",
            "token_count": count_tokens_with_transformers(agent_prompt + response, model)
        })
        
        return response, None
        
    except BadRequestError as e:
        error_message = str(e)
        if hasattr(e, 'response') and hasattr(e.response, 'json'):
            try:
                error_json = e.response.json()
                error_message = json.dumps(error_json)
            except Exception:
                pass
        
        logger.error(f"🚫 Agent {agent_name} failed due to OpenAI org/API key issue", extra={
            "job_id": job_id,
            "error": error_message,
            "agent": agent_name
        })
        
        return None, {
            "error": f"Agent {agent_name} execution failed due to an issue with the API key or organization.",
            "details": error_message
        }


def run_individual_agent(input_text: str, tenant_id: str, agent_name: str, agent_type: str = None):
    """Run a specific agent individually"""
    job_id = str(uuid.uuid4())
    
    logger.info("🚀 Individual agent execution started", extra={
        "tenant_id": tenant_id, 
        "job_id": job_id, 
        "agent_name": agent_name,
        "agent_type": agent_type,
        "input": input_text
    })
    
    try:
        # Get agent configuration
        agent_data = get_agent_by_name(agent_name)
        if not agent_data:
            logger.error("❌ Agent not found", extra={
                "job_id": job_id,
                "agent_name": agent_name
            })
            return {
                "job_id": job_id,
                "error": f"Agent '{agent_name}' not found in configuration"
            }
        
        # Handle different agent types
        if agent_data.get("type") == "main":
            # If it's a main agent, run it directly
            response, error = execute_single_agent(agent_name, agent_data, input_text, job_id, tenant_id)
            if error:
                return {"job_id": job_id, **error}
            
            # Parse JSON response if possible
            parsed_response = parse_json_response(response)
            
            logger.info("✅ Individual main agent completed", extra={
                "job_id": job_id,
                "agent_name": agent_name
            })
            
            return {
                "job_id": job_id,
                "agent_name": agent_name,
                "agent_type": "main",
                "response": response,
                "parsed_response": parsed_response
            }
        
        elif agent_data.get("type") == "sub":
            # If it's a sub-agent, we need to find it within parent agents
            configs = get_all_agent_configs()
            parent_agent = None
            sub_agent_config = None
            
            for parent_name, parent_data in configs.items():
                if parent_data.get("type") == "main":
                    for sub_agent in parent_data.get("sub_agents", []):
                        if sub_agent.get("agent_id") == agent_name:
                            parent_agent = parent_name
                            sub_agent_config = sub_agent
                            break
                    if sub_agent_config:
                        break
            
            if not sub_agent_config:
                return {
                    "job_id": job_id,
                    "error": f"Sub-agent '{agent_name}' not found in any parent agent configuration"
                }
            
            # Execute sub-agent
            groq_config = get_groq_config()
            enhanced_data = get_enhanced_data_for_agent(parent_agent, input_text)
            
            subagent_prompt_template = sub_agent_config["params"]["prompt_template"]
            subagent_prompt = subagent_prompt_template.replace("{{input}}", enhanced_data)
            
            if "{{question}}" in subagent_prompt:
                subagent_prompt = subagent_prompt.replace("{{question}}", input_text)
            elif 'USER QUESTION:\n""' in subagent_prompt:
                subagent_prompt = subagent_prompt.replace('USER QUESTION:\n""', f'USER QUESTION:\n"{input_text}"')
            elif 'USER QUESTION:' in subagent_prompt:
                subagent_prompt = f"{subagent_prompt}\n\"{input_text}\""
            else:
                subagent_prompt = f"{subagent_prompt}\n\nUser question: {input_text}"
            
            subagent_model = sub_agent_config["llm_config"]["model"]
            subagent_config_list = [{
                "model": subagent_model,
                "api_key": groq_config["api_key"],
                "base_url": groq_config["base_url"]
            }]
            
            try:
                sub_assistant = AssistantAgent(name=agent_name, llm_config={"config_list": subagent_config_list})
                sub_user_proxy = UserProxyAgent(name="sub_user", human_input_mode="NEVER")
                sub_group_chat = GroupChat(agents=[sub_user_proxy, sub_assistant], messages=[], max_round=2)
                sub_manager = GroupChatManager(groupchat=sub_group_chat, llm_config={"config_list": subagent_config_list})
                
                sub_user_proxy.initiate_chat(sub_manager, message=subagent_prompt)
                subagent_response = sub_group_chat.messages[-1]["content"]
                subagent_response_json = parse_json_response(subagent_response)
                
                # Save to memory
                agent_memory_dao.save({
                    "agent_job_id": job_id,
                    "agent_id": agent_name,
                    "tenant_id": tenant_id,
                    "timestamp": datetime.utcnow(),
                    "step": 0,
                    "input": subagent_prompt,
                    "output": subagent_response,
                    "memory_type": "contextual",
                    "token_count": count_tokens_with_transformers(subagent_prompt + subagent_response, subagent_model)
                })
                
                logger.info("✅ Individual sub-agent completed", extra={
                    "job_id": job_id,
                    "agent_name": agent_name,
                    "parent_agent": parent_agent
                })
                
                return {
                    "job_id": job_id,
                    "agent_name": agent_name,
                    "agent_type": "sub",
                    "parent_agent": parent_agent,
                    "response": subagent_response,
                    "parsed_response": subagent_response_json
                }
                
            except BadRequestError as e:
                error_message = str(e)
                if hasattr(e, 'response') and hasattr(e.response, 'json'):
                    try:
                        error_json = e.response.json()
                        error_message = json.dumps(error_json)
                    except Exception:
                        pass
                
                logger.error("🚫 Sub-agent failed due to OpenAI org/API key issue", extra={
                    "job_id": job_id,
                    "error": error_message,
                    "agent": agent_name
                })
                
                return {
                    "job_id": job_id,
                    "agent": agent_name,
                    "error": "Sub-agent execution failed due to an issue with the API key or organization.",
                    "details": error_message
                }
        
        else:
            return {
                "job_id": job_id,
                "error": f"Unknown agent type for '{agent_name}'"
            }
    
    except Exception as e:
        logger.exception("❌ Unhandled exception during individual agent execution", extra={
            "job_id": job_id,
            "tenant_id": tenant_id,
            "agent_name": agent_name,
            "input": input_text,
            "traceback": traceback.format_exc()
        })
        return {
            "job_id": job_id,
            "error": "Internal server error during agent execution.",
            "details": str(e)
        }


def run_autogen_agent(input_text: str, tenant_id: str):
    job_id = str(uuid.uuid4())
    groq_config = get_groq_config()

    logger.info("🚀 Agent orchestration started", extra={"tenant_id": tenant_id, "job_id": job_id, "input": input_text})

    try:
        # Step 1: Match Parent Agent
        parent_agent_name, parent_agent_data = match_parent_agent_by_keywords(input_text)

        if not parent_agent_name:
            general_agent = GeneralAgent()
            general_response = general_agent.run(input_text)
            full_output = "No matching agent found. Handing over to my general agent friend...\n\n" + general_response

            logger.warning("⚠️ No matching parent agent found. Using GeneralAgent fallback.", extra={"job_id": job_id})

            agent_memory_dao.save({
                "agent_job_id": job_id,
                "agent_id": "autogen_orchestrator",
                "tenant_id": tenant_id,
                "timestamp": datetime.utcnow(),
                "step": -1,
                "input": input_text,
                "output": full_output,
                "memory_type": "contextual"
            })

            return {
                "job_id": job_id,
                "selected_agent": "GeneralAgent",
                "response": general_response
            }

        # Step 2: Select Sub-Agent
        selected_subagent = select_best_subagent(parent_agent_data, input_text)
        if not selected_subagent:
            logger.error("❌ No sub-agent matched for selected parent agent.", extra={"job_id": job_id, "parent_agent": parent_agent_name})
            return {
                "job_id": job_id,
                "error": f"No sub-agent found for parent agent: {parent_agent_name}"
            }

        logger.info("🧠 Agents selected", extra={"job_id": job_id, "parent_agent": parent_agent_name, "sub_agent": selected_subagent["agent_id"]})

        # Step 3: Get Enhanced Data
        enhanced_data = get_enhanced_data_for_agent(parent_agent_name, input_text)

        # Step 4: Prepare Sub-Agent Prompt
        subagent_prompt_template = selected_subagent["params"]["prompt_template"]
        subagent_prompt = subagent_prompt_template.replace("{{input}}", enhanced_data)

        if "{{question}}" in subagent_prompt:
            subagent_prompt = subagent_prompt.replace("{{question}}", input_text)
        elif 'USER QUESTION:\n""' in subagent_prompt:
            subagent_prompt = subagent_prompt.replace('USER QUESTION:\n""', f'USER QUESTION:\n"{input_text}"')
        elif 'USER QUESTION:' in subagent_prompt:
            subagent_prompt = f"{subagent_prompt}\n\"{input_text}\""
        else:
            subagent_prompt = f"{subagent_prompt}\n\nUser question: {input_text}"

        # Step 5: Execute Sub-Agent
        subagent_model = selected_subagent["llm_config"]["model"]
        subagent_config_list = [{
            "model": subagent_model,
            "api_key": groq_config["api_key"],
            "base_url": groq_config["base_url"]
        }]

        logger.info("▶️ Executing sub-agent", extra={"job_id": job_id, "agent": selected_subagent["agent_id"]})

        try:
            sub_assistant = AssistantAgent(name=selected_subagent["agent_id"], llm_config={"config_list": subagent_config_list})
            sub_user_proxy = UserProxyAgent(name="sub_user", human_input_mode="NEVER")
            sub_group_chat = GroupChat(agents=[sub_user_proxy, sub_assistant], messages=[], max_round=2)
            sub_manager = GroupChatManager(groupchat=sub_group_chat, llm_config={"config_list": subagent_config_list})

            sub_user_proxy.initiate_chat(sub_manager, message=subagent_prompt)
            subagent_response = sub_group_chat.messages[-1]["content"]
            subagent_response_json = parse_json_response(subagent_response)

        except BadRequestError as e:
            # Attempt to extract full error JSON (if available)
            error_message = str(e)
            if hasattr(e, 'response') and hasattr(e.response, 'json'):
                try:
                    error_json = e.response.json()
                    error_message = json.dumps(error_json)  # stringified full error
                except Exception:
                    pass

            logger.error("🚫 Sub-agent failed due to OpenAI org/API key issue", extra={
                "job_id": job_id,
                "error": error_message,
                "agent": selected_subagent["agent_id"]
            })

            return {
                "job_id": job_id,
                "agent": selected_subagent["agent_id"],
                "error": "Sub-agent execution failed due to an issue with the API key or organization.",
                "details": error_message
            }

        # Step 6: Prepare Parent Agent Prompt
        parent_prompt_template = parent_agent_data.get("prompt_template", "Analyze this:\n\n{{input}}")
        parent_prompt = parent_prompt_template.replace("{{input}}", subagent_response).replace("{{question}}", input_text)

        logger.info("▶️ Executing parent agent", extra={"job_id": job_id, "agent": parent_agent_name})

        # Step 7: Execute Parent Agent
        parent_model = parent_agent_data["llm_config"]["model"]
        parent_config_list = [{
            "model": parent_model,
            "api_key": groq_config["api_key"],
            "base_url": groq_config["base_url"]
        }]

        try:
            parent_assistant = AssistantAgent(name=parent_agent_name, llm_config={"config_list": parent_config_list})
            parent_user_proxy = UserProxyAgent(name="parent_user", human_input_mode="NEVER")
            parent_group_chat = GroupChat(agents=[parent_user_proxy, parent_assistant], messages=[], max_round=2)
            parent_manager = GroupChatManager(groupchat=parent_group_chat, llm_config={"config_list": parent_config_list})

            parent_user_proxy.initiate_chat(parent_manager, message=parent_prompt)
            parent_response = parent_group_chat.messages[-1]["content"]

        except BadRequestError as e:
            error_message = str(e)
            if hasattr(e, 'response') and hasattr(e.response, 'json'):
                try:
                    error_json = e.response.json()
                    error_message = json.dumps(error_json)
                except Exception:
                    pass

            logger.error("🚫 Parent agent failed due to OpenAI org/API key issue", extra={
                "job_id": job_id,
                "error": error_message,
                "agent": parent_agent_name
            })

            return {
                "job_id": job_id,
                "agent": parent_agent_name,
                "error": "Parent agent execution failed due to an issue with the API key or organization.",
                "details": error_message
            }


        # Step 8: Orchestrator Agent Summary
        orchestrator_summary = (
            f"Here is the final summary based on your query:\n\n"
            f"{parent_response.strip()}"
        )

        parent_group_chat.messages.append({
            "role": "assistant",
            "name": "orchestrator_agent",
            "content": orchestrator_summary
        })

        # Step 9: Save Logs
        agent_memory_dao.save({
            "agent_job_id": job_id,
            "agent_id": "autogen_orchestrator",
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow(),
            "step": -1,
            "input": input_text,
            "output": f"Selected Parent: {parent_agent_name}, Selected Sub-Agent: {selected_subagent['agent_id']}",
            "memory_type": "contextual"
        })

        agent_memory_dao.save({
            "agent_job_id": job_id,
            "agent_id": selected_subagent["agent_id"],
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow(),
            "step": 0,
            "input": subagent_prompt,
            "output": subagent_response,
            "memory_type": "contextual",
            "token_count": count_tokens_with_transformers(subagent_prompt + subagent_response, subagent_model)
        })

        agent_memory_dao.save({
            "agent_job_id": job_id,
            "agent_id": parent_agent_name,
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow(),
            "step": 1,
            "input": parent_prompt,
            "output": parent_response,
            "memory_type": "contextual",
            "token_count": count_tokens_with_transformers(parent_prompt + parent_response, parent_model)
        })

        agent_memory_dao.save({
            "agent_job_id": job_id,
            "agent_id": "orchestrator_agent",
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow(),
            "step": 2,
            "input": parent_response,
            "output": orchestrator_summary,
            "memory_type": "contextual",
            "token_count": count_tokens_with_transformers(parent_response + orchestrator_summary, parent_model)
        })

        sub_agent_chain_dao.save({
            "chain_id": f"{job_id}_0",
            "job_id": job_id,
            "step": 0,
            "agent_name": selected_subagent["agent_id"],
            "parent_agent": "autogen_orchestrator",
            "status": "COMPLETED",
            "log": subagent_response
        })

        sub_agent_chain_dao.save({
            "chain_id": f"{job_id}_1",
            "job_id": job_id,
            "step": 1,
            "agent_name": parent_agent_name,
            "parent_agent": selected_subagent["agent_id"],
            "status": "COMPLETED",
            "log": parent_response
        })

        sub_agent_chain_dao.save({
            "chain_id": f"{job_id}_2",
            "job_id": job_id,
            "step": 2,
            "agent_name": "orchestrator_agent",
            "parent_agent": parent_agent_name,
            "status": "COMPLETED",
            "log": orchestrator_summary
        })

        # Step 10: Build Final Chat Turn List
        chat_turns = [
            {"speaker": m.get("name", "unknown"), "message": m["content"]}
            for m in parent_group_chat.messages
        ]

        return {
            "job_id": job_id,
            "parent_agent": parent_agent_name,
            "sub_agent": selected_subagent["agent_id"],
            "sub_agent_response": subagent_response_json,
            "final_response": parent_response,
            "orchestrator_response": orchestrator_summary,
            "chat_turns": chat_turns,
            "response": orchestrator_summary
        }

    except Exception as e:
        logger.exception("❌ Unhandled exception during agent orchestration", extra={
            "job_id": job_id,
            "tenant_id": tenant_id,
            "input": input_text,
            "traceback": traceback.format_exc()
        })
        return {
            "job_id": job_id,
            "error": "Internal server error during agent execution.",
            "details": str(e)
        }


def parse_json_response(raw_response: str):
    """Parse JSON response from agent output, including double-encoded JSON."""
    # Try to extract JSON from code blocks
    code_block_match = re.search(r"```(?:json|python)?\s*(\{.*?\})\s*```", raw_response, re.DOTALL)
    if code_block_match:
        json_str = code_block_match.group(1)
    else:
        # Try to find any JSON-like string
        loose_json_match = re.search(r"(\{.*\})", raw_response, re.DOTALL)
        if loose_json_match:
            json_str = loose_json_match.group(1)
        else:
            return {"response": raw_response, "error": "No JSON found"}

    # Attempt to load it
    try:
        parsed = json.loads(json_str)
        # If response itself is a JSON string, parse again
        if isinstance(parsed, dict) and "response" in parsed and isinstance(parsed["response"], str):
            try:
                nested = json.loads(parsed["response"])
                return nested
            except json.JSONDecodeError:
                return parsed  # outer JSON is still useful
        return parsed
    except json.JSONDecodeError:
        return {"response": raw_response, "error": "Could not parse JSON"}