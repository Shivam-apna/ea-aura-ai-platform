from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from app.utils.agent_config_loader import get_all_agent_configs
from app.services.general_agent import GeneralAgent
from app.groq_config import get_groq_config
from datetime import datetime
import uuid
import json
import re
import threading
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.core.core_log import agent_logger as logger
from openai import BadRequestError
import traceback
from typing import Dict, List, Optional, Tuple
from app.services.es_cache import search_cache, save_to_cache, create_cache_index_if_not_exists
from app.services.response_parser import parse_json_response, restructure_multimetric_data
from app.services.data_enhancer import get_enhanced_data_for_agent
from fuzzywuzzy import fuzz, process
from functools import lru_cache

# Import the new modules
from app.services.token_tracker import token_tracker
from app.services.memory_manager import memory_manager

# Thread pool for background caching operations
cache_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="cache_worker")


@lru_cache(maxsize=1000)
def normalize_text(text: str) -> str:
    """Normalize text for better matching"""
    text = re.sub(r'\s+', ' ', text.lower().strip())
    text = re.sub(r'[^\w\s]', ' ', text)
    return text


def fuzzy_match_keywords(user_input: str, keywords: List[str], threshold: int = 70) -> Tuple[bool, int, str]:
    """Fuzzy match user input against keywords"""
    if not keywords:
        return False, 0, ""
    
    normalized_input = normalize_text(user_input)
    normalized_keywords = [normalize_text(kw) for kw in keywords]
    
    best_match = process.extractOne(normalized_input, normalized_keywords, scorer=fuzz.token_sort_ratio)
    
    if best_match and best_match[1] >= threshold:
        original_keyword = keywords[normalized_keywords.index(best_match[0])]
        return True, best_match[1], original_keyword
    
    for i, keyword in enumerate(normalized_keywords):
        partial_score = fuzz.partial_ratio(normalized_input, keyword)
        if partial_score >= threshold:
            return True, partial_score, keywords[i]
    
    return False, 0, ""


def match_parent_agent_by_keywords(user_input: str):
    """Enhanced parent agent matching with fuzzy logic and scoring"""
    configs = get_all_agent_configs()
    agent_scores = []
    
    for agent_name, agent_data in configs.items():
        if agent_data.get("type") == "main" and "keywords" in agent_data:
            keywords = agent_data["keywords"]
            is_match, score, matched_keyword = fuzzy_match_keywords(user_input, keywords, threshold=60)
            
            if is_match:
                agent_scores.append((score, agent_name, agent_data, matched_keyword))
    
    if agent_scores:
        agent_scores.sort(key=lambda x: x[0], reverse=True)
        best_score, best_name, best_data, best_keyword = agent_scores[0]
        
        logger.info(f"Agent matched: {best_name} (score: {best_score}, keyword: '{best_keyword}')")
        return best_name, best_data
    
    return None, None


def select_best_subagent(parent_agent_data, user_input: str):
    """Enhanced sub-agent selection with fuzzy matching and scoring"""
    sub_agents = parent_agent_data.get("sub_agents", [])
    subagent_scores = []
    
    for sub_agent in sub_agents:
        if "keywords" in sub_agent:
            keywords = sub_agent["keywords"]
            is_match, score, matched_keyword = fuzzy_match_keywords(user_input, keywords, threshold=50)
            
            if is_match:
                subagent_scores.append((score, sub_agent, matched_keyword))
    
    if subagent_scores:
        subagent_scores.sort(key=lambda x: x[0], reverse=True)
        best_score, best_subagent, best_keyword = subagent_scores[0]
        
        logger.info(f"Sub-agent matched: {best_subagent['agent_id']} (score: {best_score}, keyword: '{best_keyword}')")
        return best_subagent
    
    if sub_agents:
        logger.warning(f"No keyword match for sub-agents, using fallback: {sub_agents[0]['agent_id']}")
        return sub_agents[0]
    
    return None


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
    """Create a normalized cache key for better cache hits"""
    import hashlib
    
    normalized_input = normalize_text(user_input)
    
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'}
    words = [w for w in normalized_input.split() if w not in stop_words and len(w) > 2]
    normalized_input = ' '.join(sorted(words))
    
    key_components = [normalized_input, agent_name]
    if enhanced_data_hash:
        key_components.append(enhanced_data_hash)
    
    cache_key = "|".join(key_components)
    return hashlib.md5(cache_key.encode()).hexdigest()[:16]


def get_enhanced_data_hash(enhanced_data: str) -> str:
    """Get a hash of enhanced data to detect changes"""
    import hashlib
    return hashlib.md5(enhanced_data.encode()).hexdigest()[:8]


def get_llm_config_list(model: str) -> list:
    """Get LLM configuration list"""
    config = get_groq_config()
    
    return [{
        "model": model or config["model"],
        "api_key": config["api_key"],
        "base_url": config["base_url"]
    }]


def save_to_cache_background(cache_key: str, response: str, tenant_id: str):
    """Save to cache in background thread to avoid blocking main response"""
    try:
        save_to_cache(cache_key, response, tenant_id)
        logger.debug(f"Background cache save completed for key: {cache_key[:8]}...")
    except Exception as e:
        logger.warning(f"Background cache save failed: {e}")


def execute_single_agent_fast(agent_name: str, agent_data: dict, input_text: str, 
                             job_id: str, tenant_id: str) -> Tuple[str, Optional[dict], dict]:
    """Execute single agent optimized for speed - returns cache info for background saving"""
    
    enhanced_data = get_enhanced_data_for_agent(agent_name, input_text, tenant_id)
    enhanced_data_hash = get_enhanced_data_hash(enhanced_data)
    
    cache_key = create_cache_key(input_text, agent_name, enhanced_data_hash)
    
    # Quick cache check only
    cached_response = search_cache(cache_key, tenant_id)
    if cached_response:
        logger.info(f"✅ Cache hit for agent {agent_name}")
        return cached_response, None, {"cache_hit": True}
    
    agent_prompt = prepare_agent_prompt(agent_data, input_text, enhanced_data)
    model = agent_data["llm_config"]["model"]
    config_list = get_llm_config_list(model)
    
    try:
        # Execute agent
        assistant = AssistantAgent(name=agent_name, llm_config={"config_list": config_list})
        user_proxy = UserProxyAgent(name="user", human_input_mode="NEVER")
        group_chat = GroupChat(agents=[user_proxy, assistant], messages=[], max_round=2)
        manager = GroupChatManager(groupchat=group_chat, llm_config={"config_list": config_list})
        
        user_proxy.initiate_chat(manager, message=agent_prompt)
        response = group_chat.messages[-1]["content"]
        
        # Track tokens
        token_usage = token_tracker.track_agent_tokens(
            agent_id=agent_name,
            input_text=agent_prompt,
            output_text=response,
            model_name=model,
            step=0
        )
        
        # Save to memory immediately (this is fast)
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
        
        # Return cache info for background processing
        cache_info = {
            "cache_key": cache_key,
            "response": response,
            "tenant_id": tenant_id,
            "cache_hit": False
        }
        
        return response, None, cache_info
        
    except BadRequestError as e:
        error_message = str(e)
        if hasattr(e, 'response') and hasattr(e.response, 'json'):
            try:
                error_json = e.response.json()
                error_message = json.dumps(error_json)
            except Exception:
                pass
        
        logger.error(f"🚫 Agent {agent_name} failed due to LLM API issue", extra={
            "job_id": job_id,
            "error": error_message,
            "agent": agent_name
        })
        
        return None, {
            "error": f"Agent {agent_name} execution failed due to an issue with the LLM API.",
            "details": error_message
        }, {"cache_hit": False}


def execute_sub_agent_fast(agent_name: str, sub_agent_config: dict, parent_agent: str, 
                          input_text: str, job_id: str, tenant_id: str) -> Tuple[str, Optional[dict], dict]:
    """Execute sub-agent optimized for speed"""
    
    enhanced_data = get_enhanced_data_for_agent(parent_agent, input_text, tenant_id)
    enhanced_data_hash = get_enhanced_data_hash(enhanced_data)
    
    cache_key = create_cache_key(input_text, agent_name, enhanced_data_hash)
    
    # Quick cache check
    cached_response = search_cache(cache_key, tenant_id)
    if cached_response:
        logger.info(f"✅ Cache hit for sub-agent {agent_name}")
        return cached_response, None, {"cache_hit": True}
    
    subagent_prompt_template = sub_agent_config["params"]["prompt_template"]
    subagent_prompt = prepare_agent_prompt({"prompt_template": subagent_prompt_template}, input_text, enhanced_data)
    
    subagent_model = sub_agent_config["llm_config"]["model"]
    subagent_config_list = get_llm_config_list(subagent_model)
    
    try:
        sub_assistant = AssistantAgent(name=agent_name, llm_config={"config_list": subagent_config_list})
        sub_user_proxy = UserProxyAgent(name="sub_user", human_input_mode="NEVER")
        sub_group_chat = GroupChat(agents=[sub_user_proxy, sub_assistant], messages=[], max_round=2)
        sub_manager = GroupChatManager(groupchat=sub_group_chat, llm_config={"config_list": subagent_config_list})
        
        sub_user_proxy.initiate_chat(sub_manager, message=subagent_prompt)
        subagent_response = sub_group_chat.messages[-1]["content"]
        
        # Track tokens
        token_usage = token_tracker.track_agent_tokens(
            agent_id=agent_name,
            input_text=subagent_prompt,
            output_text=subagent_response,
            model_name=subagent_model,
            step=0
        )
        
        # Save to memory immediately
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
        
        # Return cache info for background processing
        cache_info = {
            "cache_key": cache_key,
            "response": subagent_response,
            "tenant_id": tenant_id,
            "cache_hit": False
        }
        
        return subagent_response, None, cache_info
        
    except BadRequestError as e:
        error_message = str(e)
        if hasattr(e, 'response') and hasattr(e.response, 'json'):
            try:
                error_json = e.response.json()
                error_message = json.dumps(error_json)
            except Exception:
                pass
        
        logger.error(f"🚫 Sub-agent {agent_name} failed due to LLM API issue", extra={
            "job_id": job_id,
            "error": error_message,
            "agent": agent_name
        })
        
        return None, {
            "error": f"Sub-agent {agent_name} execution failed due to an issue with the LLM API.",
            "details": error_message
        }, {"cache_hit": False}


def execute_parent_agent_fast(parent_agent_name: str, parent_agent_data: dict, 
                             subagent_response: str, input_text: str, job_id: str, 
                             tenant_id: str) -> Tuple[str, Optional[dict], dict]:
    """Execute parent agent optimized for speed"""
    
    parent_prompt_template = parent_agent_data.get("prompt_template", "Analyze this:\n\n{{input}}")
    parent_prompt = parent_prompt_template.replace("{{input}}", subagent_response).replace("{{question}}", input_text)
    
    subagent_hash = get_enhanced_data_hash(subagent_response)
    cache_key = create_cache_key(input_text, f"{parent_agent_name}_parent", subagent_hash)
    
    # Quick cache check
    cached_response = search_cache(cache_key, tenant_id)
    if cached_response:
        logger.info(f"✅ Cache hit for parent agent {parent_agent_name}")
        return cached_response, None, {"cache_hit": True}
    
    parent_model = parent_agent_data["llm_config"]["model"]
    parent_config_list = get_llm_config_list(parent_model)
    
    try:
        parent_assistant = AssistantAgent(name=parent_agent_name, llm_config={"config_list": parent_config_list})
        parent_user_proxy = UserProxyAgent(name="parent_user", human_input_mode="NEVER")
        parent_group_chat = GroupChat(agents=[parent_user_proxy, parent_assistant], messages=[], max_round=2)
        parent_manager = GroupChatManager(groupchat=parent_group_chat, llm_config={"config_list": parent_config_list})
        
        parent_user_proxy.initiate_chat(parent_manager, message=parent_prompt)
        parent_response = parent_group_chat.messages[-1]["content"]
        
        # Track tokens
        parent_token_usage = token_tracker.track_agent_tokens(
            agent_id=parent_agent_name,
            input_text=parent_prompt,
            output_text=parent_response,
            model_name=parent_model,
            step=1
        )
        
        # Save to memory immediately
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
        
        # Return cache info for background processing
        cache_info = {
            "cache_key": cache_key,
            "response": parent_response,
            "tenant_id": tenant_id,
            "cache_hit": False
        }
        
        return parent_response, None, cache_info
        
    except BadRequestError as e:
        error_message = str(e)
        if hasattr(e, 'response') and hasattr(e.response, 'json'):
            try:
                error_json = e.response.json()
                error_message = json.dumps(error_json)
            except Exception:
                pass
        
        logger.error(f"🚫 Parent agent {parent_agent_name} failed due to LLM API issue", extra={
            "job_id": job_id,
            "error": error_message,
            "agent": parent_agent_name
        })
        
        return None, {
            "error": f"Parent agent {parent_agent_name} execution failed due to an issue with the LLM API.",
            "details": error_message
        }, {"cache_hit": False}


def process_background_caching(cache_infos: List[dict], workflow_cache_key: str, 
                              final_result: dict, tenant_id: str):
    """Process all caching operations in background"""
    def background_cache_worker():
        try:
            # Save individual agent responses
            for cache_info in cache_infos:
                if not cache_info.get("cache_hit", False):
                    save_to_cache_background(
                        cache_info["cache_key"], 
                        cache_info["response"], 
                        cache_info["tenant_id"]
                    )
            
            # Save workflow cache
            save_to_cache_background(workflow_cache_key, json.dumps(final_result), tenant_id)
            
            logger.debug(f"Background caching completed for {len(cache_infos)} items")
            
        except Exception as e:
            logger.warning(f"Background caching failed: {e}")
    
    # Submit to background thread
    cache_executor.submit(background_cache_worker)


def execute_orchestrator_with_cache_fast(input_text: str, tenant_id: str):
    """Quick cache check for full orchestration workflow"""
    workflow_cache_key = create_cache_key(input_text, "full_orchestration")
    
    cached_workflow = search_cache(workflow_cache_key, tenant_id)
    if cached_workflow:
        logger.info("✅ Full orchestration cache HIT - returning complete cached workflow")
        try:
            cached_result = json.loads(cached_workflow)
            cached_result["job_id"] = str(uuid.uuid4())
            cached_result["from_cache"] = True
            
            # Reset token usage for cached results
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
            return {
                "job_id": str(uuid.uuid4()),
                "response": cached_workflow,
                "from_cache": True
            }
    
    return None


create_cache_index_if_not_exists()


def get_agent_by_name(agent_name: str):
    """Get agent configuration by name (supports both main and sub-agents)"""
    configs = get_all_agent_configs()

    if agent_name in configs:
        return configs[agent_name]

    for parent_name, parent_data in configs.items():
        if parent_data.get("type") == "main":
            for sub_agent in parent_data.get("sub_agents", []):
                if sub_agent.get("agent_id") == agent_name:
                    return sub_agent

    return None


def run_individual_agent(input_text: str, tenant_id: str, agent_name: str, agent_type: str = None):
    """Run a specific agent individually with fast caching"""
    job_id = str(uuid.uuid4())
    
    token_tracker.reset_tracking()
    
    logger.info("🚀 Individual agent execution started", extra={
        "tenant_id": tenant_id, 
        "job_id": job_id, 
        "agent_name": agent_name,
        "agent_type": agent_type,
        "input": input_text
    })
    
    try:
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
        
        cache_infos = []
        
        if agent_data.get("type") == "main":
            response, error, cache_info = execute_single_agent_fast(
                agent_name, agent_data, input_text, job_id, tenant_id
            )
            if error:
                return {"job_id": job_id, **error}
            
            cache_infos.append(cache_info)
            
            parsed_response = restructure_multimetric_data(parse_json_response(response))
            token_summary = token_tracker.get_job_token_summary(job_id)
            
            result = {
                "job_id": job_id,
                "agent_name": agent_name,
                "agent_type": "main",
                "response": response,
                "parsed_response": parsed_response,
                "token_usage": token_summary
            }
            
            # Process background caching
            if not cache_info.get("cache_hit", False):
                cache_executor.submit(save_to_cache_background, cache_info["cache_key"], 
                                    cache_info["response"], cache_info["tenant_id"])
            
            logger.info("✅ Individual main agent completed", extra={
                "job_id": job_id,
                "agent_name": agent_name,
                "token_summary": token_summary
            })
            
            return result
        
        elif agent_data.get("type") == "sub":
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
            
            subagent_response, error, cache_info = execute_sub_agent_fast(
                agent_name, sub_agent_config, parent_agent, input_text, job_id, tenant_id
            )
            if error:
                return {"job_id": job_id, **error}
            
            cache_infos.append(cache_info)
            
            subagent_response_json = parse_json_response(subagent_response)
            token_summary = token_tracker.get_job_token_summary(job_id)
            
            result = {
                "job_id": job_id,
                "agent_name": agent_name,
                "agent_type": "sub",
                "parent_agent": parent_agent,
                "response": subagent_response,
                "parsed_response": subagent_response_json,
                "token_usage": token_summary
            }
            
            # Process background caching
            if not cache_info.get("cache_hit", False):
                cache_executor.submit(save_to_cache_background, cache_info["cache_key"], 
                                    cache_info["response"], cache_info["tenant_id"])
            
            logger.info("✅ Individual sub-agent completed", extra={
                "job_id": job_id,
                "agent_name": agent_name,
                "parent_agent": parent_agent,
                "token_summary": token_summary
            })
            
            return result
        
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
    """Main orchestration function optimized for speed with deferred caching"""
    
    # Quick cache check first
    cached_result = execute_orchestrator_with_cache_fast(input_text, tenant_id)
    if cached_result:
        return cached_result
    
    job_id = str(uuid.uuid4())
    token_tracker.reset_tracking()

    logger.info("🚀 Agent orchestration started", extra={
        "tenant_id": tenant_id, 
        "job_id": job_id, 
        "input": input_text
    })

    cache_infos = []  # Collect cache information for background processing

    try:
        # Step 1: Match Parent Agent
        parent_agent_name, parent_agent_data = match_parent_agent_by_keywords(input_text)

        if not parent_agent_name:
            general_agent = GeneralAgent()
            general_response = general_agent.run(input_text)

            token_tracker.track_agent_tokens(
                agent_id="GeneralAgent",
                input_text=input_text,
                output_text=general_response,
                model_name="general_model",
                step=0
            )

            logger.info("🤖 No matching parent agent found. Using GeneralAgent fallback.", extra={
                "job_id": job_id,
                "token_summary": token_tracker.get_job_token_summary(job_id)
            })

            memory_manager.save_orchestrator_memory(
                job_id=job_id,
                tenant_id=tenant_id,
                step=-1,
                input_text=input_text,
                output_text=general_response
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

        # Step 3: Execute Sub-Agent (fast)
        subagent_response, error, subagent_cache_info = execute_sub_agent_fast(
            selected_subagent["agent_id"], selected_subagent, parent_agent_name, 
            input_text, job_id, tenant_id
        )
        if error:
            return {"job_id": job_id, **error}

        cache_infos.append(subagent_cache_info)
        subagent_response_json = parse_json_response(subagent_response)

        # Step 4: Execute Parent Agent (fast)
        logger.info("▶️ Executing parent agent", extra={
            "job_id": job_id, 
            "agent": parent_agent_name
        })
        
        parent_response, error, parent_cache_info = execute_parent_agent_fast(
            parent_agent_name, parent_agent_data, subagent_response, 
            input_text, job_id, tenant_id
        )
        if error:
            return {"job_id": job_id, **error}

        cache_infos.append(parent_cache_info)

        # Step 5: Orchestrator Agent Summary (fast)
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

        # Step 6: Save Memory Records (immediate - these are fast operations)
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

        # Save chain records (immediate)
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
        
        # ⚡ CRITICAL PERFORMANCE IMPROVEMENT ⚡
        # Schedule all caching operations to run in background AFTER response is sent
        workflow_cache_key = create_cache_key(input_text, "full_orchestration")
        process_background_caching(cache_infos, workflow_cache_key, final_result, tenant_id)
        
        logger.info("✅ Agent orchestration completed", extra={
            "job_id": job_id,
            "parent_agent": parent_agent_name,
            "sub_agent": selected_subagent["agent_id"],
            "token_summary": token_summary
        })

        # Return immediately - caching happens in background
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


# Additional utility functions for monitoring background operations
def get_cache_executor_status():
    """Get status of background caching operations"""
    return {
        "active_threads": cache_executor._threads,
        "queue_size": cache_executor._work_queue.qsize() if hasattr(cache_executor._work_queue, 'qsize') else 0,
        "max_workers": cache_executor._max_workers
    }


def shutdown_cache_executor():
    """Gracefully shutdown background cache executor"""
    cache_executor.shutdown(wait=True)
    logger.info("Cache executor shutdown completed")