from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from app.utils.agent_config_loader import get_all_agent_configs
from app.services.general_agent import GeneralAgent
from app.groq_config import get_groq_config
from datetime import datetime
import uuid
import json
import re
from app.core.core_log import agent_logger as logger
from openai import BadRequestError
import traceback
from typing import Dict, List, Optional, Tuple
from app.services.es_cache import search_cache, save_to_cache, create_cache_index_if_not_exists
from app.services.response_parser import parse_json_response, restructure_multimetric_data
from app.services.data_enhancer import get_enhanced_data_for_agent

# Import the new modules
from app.services.token_tracker import token_tracker
from app.services.memory_manager import memory_manager


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

def prepare_agent_prompt(agent_data: dict, input_text: str, enhanced_data: str) -> str:
    """Prepare agent prompt with template replacement"""
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
    
    return agent_prompt


def create_cache_key(user_input: str, agent_name: str, enhanced_data_hash: str = None) -> str:
    """Create a cache key based on user input and agent context"""
    import hashlib
    
    # Create a unique key combining user input and agent context
    key_components = [user_input, agent_name]
    if enhanced_data_hash:
        key_components.append(enhanced_data_hash)
    
    cache_key = "|".join(key_components)
    return cache_key

def get_enhanced_data_hash(enhanced_data: str) -> str:
    """Get a hash of enhanced data to detect changes"""
    import hashlib
    return hashlib.md5(enhanced_data.encode()).hexdigest()[:8]  # Short hash

def execute_single_agent(agent_name: str, agent_data: dict, input_text: str, job_id: str, tenant_id: str):
    """Execute a single agent with enhanced token tracking"""
    groq_config = get_groq_config()
    
    # Get enhanced data for the agent
    enhanced_data = get_enhanced_data_for_agent(agent_name, input_text, tenant_id)
    enhanced_data_hash = get_enhanced_data_hash(enhanced_data)
    
    # Create cache key based on user input + agent + data context
    cache_key = create_cache_key(input_text, agent_name, enhanced_data_hash)
    
    # Check cache with the cache key
    cached_response = search_cache(cache_key, tenant_id)
    if cached_response:
        print("1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111")
        logger.info(f"✅ Cache hit for agent {agent_name}. Skipping LLM call.")
        return cached_response, None
    
    # Prepare agent prompt
    agent_prompt = prepare_agent_prompt(agent_data, input_text, enhanced_data)

    print("000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", agent_prompt)

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

        # Save response to cache with the cache key
        save_to_cache(cache_key, response, tenant_id)
        
        # Track tokens for this agent
        token_usage = token_tracker.track_agent_tokens(
            agent_id=agent_name,
            input_text=agent_prompt,
            output_text=response,
            model_name=model,
            step=0
        )
        
        # Save to memory with token info
        memory_manager.save_agent_memory(
            agent_id=agent_name,
            job_id=job_id,
            tenant_id=tenant_id,
            step=0,
            input_text=agent_prompt,
            output_text=response,
            token_usage=token_usage,
            model_name=model
        )
        
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

def execute_sub_agent(agent_name: str, sub_agent_config: dict, parent_agent: str, 
                     input_text: str, job_id: str, tenant_id: str):
    """Execute a sub-agent with token tracking"""
    groq_config = get_groq_config()
    enhanced_data = get_enhanced_data_for_agent(parent_agent, input_text,tenant_id)
    enhanced_data_hash = get_enhanced_data_hash(enhanced_data)
    
    # Create cache key for sub-agent
    cache_key = create_cache_key(input_text, agent_name, enhanced_data_hash)
    
    # Check cache with the cache key
    cached_response = search_cache(cache_key,tenant_id)
    if cached_response:
        logger.info(f"✅ Cache hit for sub-agent {agent_name}. Skipping LLM call.")
        return cached_response, None
    
    # Prepare sub-agent prompt
    subagent_prompt_template = sub_agent_config["params"]["prompt_template"]
    subagent_prompt = prepare_agent_prompt({"prompt_template": subagent_prompt_template}, input_text, enhanced_data)
    
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

        # Save response to cache with the cache key
        save_to_cache(cache_key, subagent_response,tenant_id)
        
        # Track tokens for sub-agent
        token_usage = token_tracker.track_agent_tokens(
            agent_id=agent_name,
            input_text=subagent_prompt,
            output_text=subagent_response,
            model_name=subagent_model,
            step=0
        )
        
        # Save to memory with token info
        memory_manager.save_agent_memory(
            agent_id=agent_name,
            job_id=job_id,
            tenant_id=tenant_id,
            step=0,
            input_text=subagent_prompt,
            output_text=subagent_response,
            token_usage=token_usage,
            model_name=subagent_model
        )
        
        return subagent_response, None
        
    except BadRequestError as e:
        error_message = str(e)
        if hasattr(e, 'response') and hasattr(e.response, 'json'):
            try:
                error_json = e.response.json()
                error_message = json.dumps(error_json)
            except Exception:
                pass
        
        logger.error(f"🚫 Sub-agent {agent_name} failed due to OpenAI org/API key issue", extra={
            "job_id": job_id,
            "error": error_message,
            "agent": agent_name
        })
        
        return None, {
            "error": f"Sub-agent {agent_name} execution failed due to an issue with the API key or organization.",
            "details": error_message
        }


create_cache_index_if_not_exists()
def run_individual_agent(input_text: str, tenant_id: str, agent_name: str, agent_type: str = None):
    """Run a specific agent individually with detailed token tracking"""
    job_id = str(uuid.uuid4())
    
    # Reset token tracking for new job
    token_tracker.reset_tracking()
    
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
            parsed_response = restructure_multimetric_data(parse_json_response(response))
            
            # Get token summary
            token_summary = token_tracker.get_job_token_summary(job_id)
            
            logger.info("✅ Individual main agent completed", extra={
                "job_id": job_id,
                "agent_name": agent_name,
                "token_summary": token_summary
            })
            
            return {
                "job_id": job_id,
                "agent_name": agent_name,
                "agent_type": "main",
                "response": response,
                "parsed_response": parsed_response,
                "token_usage": token_summary
            }
        
        elif agent_data.get("type") == "sub":
            # Handle sub-agent execution with token tracking
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
            subagent_response, error = execute_sub_agent(
                agent_name, sub_agent_config, parent_agent, input_text, job_id, tenant_id
            )
            if error:
                return {"job_id": job_id, **error}
            
            subagent_response_json = parse_json_response(subagent_response)
            
            # Get token summary
            token_summary = token_tracker.get_job_token_summary(job_id)
            
            logger.info("✅ Individual sub-agent completed", extra={
                "job_id": job_id,
                "agent_name": agent_name,
                "parent_agent": parent_agent,
                "token_summary": token_summary
            })
            
            return {
                "job_id": job_id,
                "agent_name": agent_name,
                "agent_type": "sub",
                "parent_agent": parent_agent,
                "response": subagent_response,
                "parsed_response": subagent_response_json,
                "token_usage": token_summary
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

create_cache_index_if_not_exists()
# Add this function to handle parent agent execution with caching
def execute_parent_agent(parent_agent_name: str, parent_agent_data: dict, 
                        subagent_response: str, input_text: str, job_id: str, tenant_id: str):
    """Execute parent agent with caching support"""
    groq_config = get_groq_config()
    
    # Create parent agent prompt
    parent_prompt_template = parent_agent_data.get("prompt_template", "Analyze this:\n\n{{input}}")
    parent_prompt = parent_prompt_template.replace("{{input}}", subagent_response).replace("{{question}}", input_text)
    
    # Create cache key for parent agent (include subagent response in hash)
    subagent_hash = get_enhanced_data_hash(subagent_response)
    cache_key = create_cache_key(input_text, f"{parent_agent_name}_parent", subagent_hash)
    
    # Check cache first
    cached_response = search_cache(cache_key,tenant_id)
    if cached_response:
        logger.info(f"✅ Cache hit for parent agent {parent_agent_name}. Skipping LLM call.")
        return cached_response, None
    
    # Execute parent agent if not in cache
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
        
        # Save to cache
        save_to_cache(cache_key, parent_response,tenant_id)
        
        # Track tokens
        parent_token_usage = token_tracker.track_agent_tokens(
            agent_id=parent_agent_name,
            input_text=parent_prompt,
            output_text=parent_response,
            model_name=parent_model,
            step=1
        )
        
        # Save to memory
        memory_manager.save_agent_memory(
            agent_id=parent_agent_name,
            job_id=job_id,
            tenant_id=tenant_id,
            step=1,
            input_text=parent_prompt,
            output_text=parent_response,
            token_usage=parent_token_usage,
            model_name=parent_model
        )
        
        return parent_response, None
        
    except BadRequestError as e:
        error_message = str(e)
        if hasattr(e, 'response') and hasattr(e.response, 'json'):
            try:
                error_json = e.response.json()
                error_message = json.dumps(error_json)
            except Exception:
                pass
        
        logger.error(f"🚫 Parent agent {parent_agent_name} failed due to OpenAI org/API key issue", extra={
            "job_id": job_id,
            "error": error_message,
            "agent": parent_agent_name
        })
        
        return None, {
            "error": f"Parent agent {parent_agent_name} execution failed due to an issue with the API key or organization.",
            "details": error_message
        }

# Add this function for orchestrator-level caching
def execute_orchestrator_with_cache(input_text: str, tenant_id: str):
    """Execute orchestrator with full workflow caching"""
    # Create a cache key for the entire orchestration workflow
    workflow_cache_key = create_cache_key(input_text, "full_orchestration")
    
    # Check if we have a cached result for the entire workflow
    cached_workflow = search_cache(workflow_cache_key,tenant_id)
    if cached_workflow:
        logger.info("✅ Full orchestration cache HIT - returning complete cached workflow")
        try:
            # Parse the cached result (assuming it's JSON)
            import json
            cached_result = json.loads(cached_workflow)
            # Add a new job_id for this request
            cached_result["job_id"] = str(uuid.uuid4())
            cached_result["from_cache"] = True
            
            # Overwrite token usage fields to indicate no new tokens were used
            cached_result["token_usage"] = {
                "total_tokens": 0,
                "agents": {}
            }
            cached_result["detailed_token_usage"] = {
                "sub_agent": {"total_tokens": 0},
                "parent_agent": {"total_tokens": 0},
                "orchestrator": {"total_tokens": 0}
            }
                        
            return cached_result
        except json.JSONDecodeError:
            # If not JSON, treat as regular response
            return {
                "job_id": str(uuid.uuid4()),
                "response": cached_workflow,
                "from_cache": True
            }
    
    return None  # No cache hit, proceed with normal execution

# Modified run_autogen_agent function
def run_autogen_agent(input_text: str, tenant_id: str):
    """Main orchestration function with comprehensive token tracking and caching"""
    
    # First check for full workflow cache
    cached_result = execute_orchestrator_with_cache(input_text, tenant_id)
    if cached_result:
        return cached_result
    
    job_id = str(uuid.uuid4())
    groq_config = get_groq_config()
    
    # Reset token tracking for new job
    token_tracker.reset_tracking()

    logger.info("🚀 Agent orchestration started", extra={
        "tenant_id": tenant_id, 
        "job_id": job_id, 
        "input": input_text
    })

    try:
        # Step 1: Match Parent Agent
        parent_agent_name, parent_agent_data = match_parent_agent_by_keywords(input_text)

        if not parent_agent_name:
            general_agent = GeneralAgent()
            general_response = general_agent.run(input_text)
            full_output = "No matching agent found. Handing over to my general agent friend...\n\n" + general_response

            # Track tokens for GeneralAgent
            token_tracker.track_agent_tokens(
                agent_id="GeneralAgent",
                input_text=input_text,
                output_text=general_response,
                model_name="general_model",
                step=0
            )

            logger.warning("⚠️ No matching parent agent found. Using GeneralAgent fallback.", extra={
                "job_id": job_id,
                "token_summary": token_tracker.get_job_token_summary(job_id)
            })

            memory_manager.save_orchestrator_memory(
                job_id=job_id,
                tenant_id=tenant_id,
                step=-1,
                input_text=input_text,
                output_text=full_output
            )

            return {
                "job_id": job_id,
                "selected_agent": "GeneralAgent",
                "response": general_response,
                "token_usage": token_tracker.get_job_token_summary(job_id)
            }

        # Step 2: Select Sub-Agent
        selected_subagent = select_best_subagent(parent_agent_data, input_text)
        if not selected_subagent:
            logger.error("❌ No sub-agent matched for selected parent agent.", extra={
                "job_id": job_id, 
                "parent_agent": parent_agent_name
            })
            return {
                "job_id": job_id,
                "error": f"No sub-agent found for parent agent: {parent_agent_name}"
            }

        logger.info("🧠 Agents selected", extra={
            "job_id": job_id, 
            "parent_agent": parent_agent_name, 
            "sub_agent": selected_subagent["agent_id"]
        })

        # Step 3: Execute Sub-Agent (already has caching)
        subagent_response, error = execute_sub_agent(
            selected_subagent["agent_id"], selected_subagent, parent_agent_name, 
            input_text, job_id, tenant_id
        )
        if error:
            return {"job_id": job_id, **error}

        subagent_response_json = parse_json_response(subagent_response)

        # Step 4: Execute Parent Agent (now with caching)
        logger.info("▶️ Executing parent agent", extra={
            "job_id": job_id, 
            "agent": parent_agent_name
        })
        
        parent_response, error = execute_parent_agent(
            parent_agent_name, parent_agent_data, subagent_response, 
            input_text, job_id, tenant_id
        )
        if error:
            return {"job_id": job_id, **error}

        # Step 5: Orchestrator Agent Summary
        orchestrator_summary = (
            f"Here is the final summary based on your query:\n\n"
            f"{parent_response.strip()}"
        )

        # Track tokens for orchestrator
        orchestrator_token_usage = token_tracker.track_agent_tokens(
            agent_id="orchestrator_agent",
            input_text=parent_response,
            output_text=orchestrator_summary,
            model_name=parent_agent_data["llm_config"]["model"],
            step=2
        )

        # Step 6: Save All Memory Records
        memory_manager.save_orchestrator_memory(
            job_id=job_id,
            tenant_id=tenant_id,
            step=-1,
            input_text=input_text,
            output_text=f"Selected Parent: {parent_agent_name}, Selected Sub-Agent: {selected_subagent['agent_id']}"
        )

        memory_manager.save_agent_memory(
            agent_id="orchestrator_agent",
            job_id=job_id,
            tenant_id=tenant_id,
            step=2,
            input_text=parent_response,
            output_text=orchestrator_summary,
            token_usage=orchestrator_token_usage,
            model_name=parent_agent_data["llm_config"]["model"]
        )

        # Save chain records
        memory_manager.save_chain_record(
            job_id=job_id,
            step=0,
            agent_name=selected_subagent["agent_id"],
            parent_agent="autogen_orchestrator",
            log=subagent_response,
            token_usage=token_tracker.get_agent_token_summary(selected_subagent["agent_id"])
        )

        memory_manager.save_chain_record(
            job_id=job_id,
            step=1,
            agent_name=parent_agent_name,
            parent_agent=selected_subagent["agent_id"],
            log=parent_response,
            token_usage=token_tracker.get_agent_token_summary(parent_agent_name)
        )

        memory_manager.save_chain_record(
            job_id=job_id,
            step=2,
            agent_name="orchestrator_agent",
            parent_agent=parent_agent_name,
            log=orchestrator_summary,
            token_usage=token_tracker.get_agent_token_summary("orchestrator_agent")
        )

        # Get comprehensive token summary
        token_summary = token_tracker.get_job_token_summary(job_id)
        
        # Create final result
        final_result = {
            "job_id": job_id,
            "parent_agent": parent_agent_name,
            "sub_agent": selected_subagent["agent_id"],
            "sub_agent_response": subagent_response_json,
            "final_response": parent_response,
            "orchestrator_response": orchestrator_summary,
            "response": orchestrator_summary,
            "token_usage": token_summary,
            "detailed_token_usage": {
                "sub_agent": token_tracker.get_agent_token_summary(selected_subagent["agent_id"]),
                "parent_agent": token_tracker.get_agent_token_summary(parent_agent_name),
                "orchestrator": token_tracker.get_agent_token_summary("orchestrator_agent")
            }
        }
        
        # Cache the entire workflow result
        workflow_cache_key = create_cache_key(input_text, "full_orchestration")
        save_to_cache(workflow_cache_key, json.dumps(final_result),tenant_id)
        
        logger.info("✅ Agent orchestration completed", extra={
            "job_id": job_id,
            "parent_agent": parent_agent_name,
            "sub_agent": selected_subagent["agent_id"],
            "token_summary": token_summary
        })

        return final_result

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
