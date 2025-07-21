"""
Agent execution utilities with caching and token tracking
"""
import json
import hashlib
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from openai import BadRequestError

from app.groq_config import get_groq_config
from app.core.core_log import agent_logger as logger
from app.services.es_cache import search_cache, save_to_cache
from app.services.token_tracker import token_tracker
from app.services.memory_manager import memory_manager
from .agent_matcher import get_enhanced_data_for_agent, prepare_agent_prompt


def create_cache_key(user_input: str, agent_name: str, enhanced_data_hash: str = None) -> str:
    """Create a cache key based on user input and agent context"""
    key_components = [user_input, agent_name]
    if enhanced_data_hash:
        key_components.append(enhanced_data_hash)
    
    cache_key = "|".join(key_components)
    return cache_key


def get_enhanced_data_hash(enhanced_data: str) -> str:
    """Get a hash of enhanced data to detect changes"""
    return hashlib.md5(enhanced_data.encode()).hexdigest()[:8]  # Short hash


def execute_single_agent(agent_name: str, agent_data: dict, input_text: str, job_id: str, tenant_id: str):
    """Execute a single agent with enhanced token tracking"""
    groq_config = get_groq_config()
    
    # Get enhanced data for the agent
    enhanced_data = get_enhanced_data_for_agent(agent_name, input_text)
    enhanced_data_hash = get_enhanced_data_hash(enhanced_data)
    
    # Create cache key based on user input + agent + data context
    cache_key = create_cache_key(input_text, agent_name, enhanced_data_hash)
    
    # Check cache with the cache key
    cached_response = search_cache(cache_key)
    if cached_response:
        logger.info(f"✅ Cache hit for agent {agent_name}. Skipping LLM call.")
        return cached_response, None
    
    # Prepare agent prompt
    agent_prompt = prepare_agent_prompt(agent_data, input_text, enhanced_data)

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
        save_to_cache(cache_key, response)
        
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
    enhanced_data = get_enhanced_data_for_agent(parent_agent, input_text)
    enhanced_data_hash = get_enhanced_data_hash(enhanced_data)
    
    # Create cache key for sub-agent
    cache_key = create_cache_key(input_text, agent_name, enhanced_data_hash)
    
    # Check cache with the cache key
    cached_response = search_cache(cache_key)
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
        save_to_cache(cache_key, subagent_response)
        
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