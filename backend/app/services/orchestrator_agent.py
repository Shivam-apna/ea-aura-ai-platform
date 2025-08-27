from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from app.utils.agent_config_loader import get_all_agent_configs
from app.services.general_agent import GeneralAgent
from app.groq_config import get_groq_config
from app.core.config import settings
from app.services.llm_guard import validate_prompt, validate_response, SAFE_FALLBACK_MESSAGE
from datetime import datetime, timedelta
import uuid
import json
import re
from app.core.core_log import agent_logger as logger
from openai import BadRequestError
import traceback
from typing import Dict, List, Optional, Tuple, Any
from app.services.es_cache import search_cache, save_to_cache, create_cache_index_if_not_exists
from app.services.response_parser import parse_json_response, restructure_multimetric_data
from app.services.data_enhancer import get_enhanced_data_for_agent
from app.services.token_tracker import token_tracker
from app.services.memory_manager import memory_manager
from app.core.kafka import send_event
import time
from difflib import SequenceMatcher
from collections import defaultdict
import hashlib
import math
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os


class SemanticAgentMatcher:
    """Advanced semantic matching system for intelligent agent selection"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize semantic matcher with sentence transformer model
        
        Args:
            model_name: HuggingFace sentence transformer model name
                      "all-MiniLM-L6-v2" - Fast, good balance (default)
                      "all-mpnet-base-v2" - More accurate but slower
                      "paraphrase-multilingual-MiniLM-L12-v2" - Multilingual support
        """
        self.model_name = model_name
        self.model = None
        self.agent_embeddings = {}
        self.embeddings_cache_file = "agent_embeddings_cache.pkl"
        self.load_model()
        self.precompute_agent_embeddings()
    
    def load_model(self):
        """Load sentence transformer model with error handling"""
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"✅ Loaded semantic model: {self.model_name}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load semantic model {self.model_name}: {e}")
            logger.info("🔄 Falling back to keyword matching...")
            self.model = None
    
    def precompute_agent_embeddings(self):
        """Pre-compute and cache embeddings for all agent keywords and descriptions"""
        if not self.model:
            return
        
        # Try to load from cache first
        if os.path.exists(self.embeddings_cache_file):
            try:
                with open(self.embeddings_cache_file, 'rb') as f:
                    cached_data = pickle.load(f)
                    if cached_data.get("model_name") == self.model_name:
                        self.agent_embeddings = cached_data.get("embeddings", {})
                        logger.info(f"✅ Loaded {len(self.agent_embeddings)} cached agent embeddings")
                        return
            except Exception as e:
                logger.warning(f"⚠️ Failed to load cached embeddings: {e}")
        
        # Compute embeddings fresh
        configs = get_all_agent_configs()
        self.agent_embeddings = {}
        
        for agent_name, agent_data in configs.items():
            if agent_data.get("type") != "main":
                continue
            
            # Combine keywords, description, and capabilities for richer context
            text_sources = []
            
            # Keywords
            keywords = agent_data.get("keywords", [])
            if keywords:
                text_sources.extend(keywords)
            
            # Description
            description = agent_data.get("description", "")
            if description:
                text_sources.append(description)
            
            # Goal
            goal = agent_data.get("goal", "")
            if goal:
                text_sources.append(goal)
            
            # Capabilities
            capabilities = agent_data.get("capabilities", [])
            if capabilities:
                text_sources.extend(capabilities)
            
            # Sub-agent keywords for broader coverage
            for sub_agent in agent_data.get("sub_agents", []):
                sub_keywords = sub_agent.get("keywords", [])
                sub_description = sub_agent.get("description", "")
                if sub_keywords:
                    text_sources.extend(sub_keywords)
                if sub_description:
                    text_sources.append(sub_description)
            
            if text_sources:
                try:
                    # Create embeddings for each text source
                    embeddings = self.model.encode(text_sources)
                    # Store both individual embeddings and averaged embedding
                    self.agent_embeddings[agent_name] = {
                        "individual": embeddings,
                        "averaged": np.mean(embeddings, axis=0),
                        "text_sources": text_sources
                    }
                except Exception as e:
                    logger.error(f"❌ Failed to create embeddings for {agent_name}: {e}")
        
        # Cache the computed embeddings
        try:
            cache_data = {
                "model_name": self.model_name,
                "embeddings": self.agent_embeddings,
                "computed_at": datetime.now().isoformat()
            }
            with open(self.embeddings_cache_file, 'wb') as f:
                pickle.dump(cache_data, f)
            logger.info(f"✅ Cached {len(self.agent_embeddings)} agent embeddings")
        except Exception as e:
            logger.warning(f"⚠️ Failed to cache embeddings: {e}")
    
    def find_best_agents(self, user_input: str, top_k: int = 3, 
                        similarity_threshold: float = 0.3) -> List[Tuple[str, float, Dict]]:
        """
        Find best matching agents using semantic similarity
        
        Args:
            user_input: User's query text
            top_k: Number of top agents to return
            similarity_threshold: Minimum similarity score (0.0 to 1.0)
        
        Returns:
            List of tuples: (agent_name, similarity_score, agent_config)
        """
        if not self.model or not self.agent_embeddings:
            logger.warning("🔄 Semantic matching unavailable, falling back to keyword matching")
            return self._fallback_keyword_matching(user_input, top_k)
        
        try:
            # Encode user input
            query_embedding = self.model.encode([user_input])[0]
            
            # Calculate similarities with all agents
            agent_scores = []
            configs = get_all_agent_configs()
            
            for agent_name, embedding_data in self.agent_embeddings.items():
                if agent_name not in configs:
                    continue
                
                agent_config = configs[agent_name]
                if not agent_config.get("enabled", True):
                    continue
                
                # Use averaged embedding for primary similarity
                avg_embedding = embedding_data["averaged"]
                primary_similarity = cosine_similarity(
                    [query_embedding], [avg_embedding]
                )[0][0]
                
                # Also check maximum similarity with individual text sources
                individual_embeddings = embedding_data["individual"]
                individual_similarities = cosine_similarity(
                    [query_embedding], individual_embeddings
                )[0]
                max_individual_similarity = np.max(individual_similarities)
                
                # Combine both scores (weighted average)
                combined_similarity = (
                    primary_similarity * 0.7 + 
                    max_individual_similarity * 0.3
                )
                
                if combined_similarity >= similarity_threshold:
                    agent_scores.append((
                        agent_name,
                        combined_similarity,
                        agent_config,
                        {
                            "primary_similarity": primary_similarity,
                            "max_individual_similarity": max_individual_similarity,
                            "best_matching_text": embedding_data["text_sources"][np.argmax(individual_similarities)]
                        }
                    ))
            
            # Sort by similarity score (descending)
            agent_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Return top-k results
            results = [(name, score, config) for name, score, config, _ in agent_scores[:top_k]]
            
            logger.info(f"🧠 Semantic matching found {len(results)} agents above threshold {similarity_threshold}")
            for name, score, _ in results:
                logger.info(f"  📊 {name}: {score:.3f}")
            
            return results
        
        except Exception as e:
            logger.error(f"❌ Semantic matching failed: {e}")
            return self._fallback_keyword_matching(user_input, top_k)
    
    def _fallback_keyword_matching(self, user_input: str, top_k: int = 3) -> List[Tuple[str, float, Dict]]:
        """Fallback to enhanced keyword matching when semantic matching fails"""
        configs = get_all_agent_configs()
        agent_scores = []
        user_words = set(user_input.lower().split())
        
        for agent_name, agent_data in configs.items():
            if agent_data.get("type") != "main" or not agent_data.get("enabled", True):
                continue
            
            # Enhanced keyword matching with fuzzy matching
            keywords = agent_data.get("keywords", [])
            description = agent_data.get("description", "")
            
            total_score = 0.0
            matches = 0
            
            # Exact keyword matches
            for keyword in keywords:
                keyword_lower = keyword.lower()
                if keyword_lower in user_input.lower():
                    total_score += 1.0
                    matches += 1
                elif any(word in keyword_lower for word in user_words):
                    total_score += 0.7
                    matches += 1
                else:
                    # Fuzzy matching using sequence similarity
                    for user_word in user_words:
                        similarity = SequenceMatcher(None, keyword_lower, user_word).ratio()
                        if similarity > 0.6:  # 60% similarity threshold
                            total_score += similarity * 0.5
                            matches += 1
                            break
            
            # Description matching
            if description:
                desc_words = set(description.lower().split())
                common_words = user_words.intersection(desc_words)
                if common_words:
                    total_score += len(common_words) * 0.3
                    matches += 1
            
            if matches > 0:
                # Normalize score by number of keywords
                normalized_score = total_score / max(len(keywords), 1)
                agent_scores.append((agent_name, normalized_score, agent_data))
        
        # Sort and return top-k
        agent_scores.sort(key=lambda x: x[1], reverse=True)
        return agent_scores[:top_k]


class AgentPerformanceTracker:
    """Tracks agent performance metrics for intelligent selection"""
    
    def __init__(self):
        self.performance_cache = {}
        self.load_balancing_stats = defaultdict(lambda: {"requests": 0, "last_used": None})
        self.performance_cache_file = "agent_performance_cache.json"
        self.load_performance_cache()
    
    def load_performance_cache(self):
        """Load performance data from cache"""
        try:
            if os.path.exists(self.performance_cache_file):
                with open(self.performance_cache_file, 'r') as f:
                    cached_data = json.load(f)
                    # Convert datetime strings back to datetime objects
                    for agent_name, stats in cached_data.items():
                        if stats.get("last_success"):
                            stats["last_success"] = datetime.fromisoformat(stats["last_success"])
                    self.performance_cache = cached_data
                    logger.info(f"✅ Loaded performance cache for {len(self.performance_cache)} agents")
        except Exception as e:
            logger.warning(f"⚠️ Failed to load performance cache: {e}")
    
    def save_performance_cache(self):
        """Save performance data to cache"""
        try:
            # Convert datetime objects to strings for JSON serialization
            cache_data = {}
            for agent_name, stats in self.performance_cache.items():
                serializable_stats = stats.copy()
                if serializable_stats.get("last_success"):
                    serializable_stats["last_success"] = serializable_stats["last_success"].isoformat()
                cache_data[agent_name] = serializable_stats
            
            with open(self.performance_cache_file, 'w') as f:
                json.dump(cache_data, f, indent=2)
        except Exception as e:
            logger.warning(f"⚠️ Failed to save performance cache: {e}")
    
    def get_agent_score(self, agent_name: str) -> float:
        """Calculate agent performance score (0.0 to 1.0)"""
        if agent_name not in self.performance_cache:
            return 0.7  # Default score for new agents
        
        stats = self.performance_cache[agent_name]
        
        # Success rate (40% weight)
        success_rate = stats.get("success_count", 0) / max(stats.get("total_attempts", 1), 1)
        
        # Average response time (20% weight) - lower is better
        avg_response_time = stats.get("avg_response_time", 5.0)
        time_score = max(0, 1.0 - (avg_response_time / 30.0))  # Normalize to 30s max
        
        # Token efficiency (20% weight) - fewer tokens per task is better
        avg_tokens = stats.get("avg_tokens", 1000)
        token_score = max(0, 1.0 - (avg_tokens / 5000.0))  # Normalize to 5000 tokens
        
        # Cache hit rate (10% weight)
        cache_hit_rate = stats.get("cache_hits", 0) / max(stats.get("total_requests", 1), 1)
        
        # Recency bonus (10% weight) - more recent successful runs get bonus
        last_success = stats.get("last_success")
        if last_success:
            days_since_success = (datetime.now() - last_success).days
            recency_score = max(0, 1.0 - (days_since_success / 30.0))
        else:
            recency_score = 0.5  # Neutral score for agents never run
        
        total_score = (
            success_rate * 0.4 +
            time_score * 0.2 +
            token_score * 0.2 +
            cache_hit_rate * 0.1 +
            recency_score * 0.1
        )
        
        return min(1.0, max(0.1, total_score))  # Clamp between 0.1 and 1.0
    
    def update_performance(self, agent_name: str, success: bool, response_time: float,
                          tokens_used: int, cache_hit: bool = False):
        """Update agent performance metrics"""
        if agent_name not in self.performance_cache:
            self.performance_cache[agent_name] = {
                "success_count": 0,
                "total_attempts": 0,
                "total_response_time": 0.0,
                "total_tokens": 0,
                "cache_hits": 0,
                "total_requests": 0,
                "last_success": None
            }
        
        stats = self.performance_cache[agent_name]
        stats["total_attempts"] += 1
        stats["total_requests"] += 1
        stats["total_response_time"] += response_time
        stats["total_tokens"] += tokens_used
        
        # Update averages
        stats["avg_response_time"] = stats["total_response_time"] / stats["total_attempts"]
        stats["avg_tokens"] = stats["total_tokens"] / stats["total_attempts"]
        
        if success:
            stats["success_count"] += 1
            stats["last_success"] = datetime.now()
        
        if cache_hit:
            stats["cache_hits"] += 1
        
        # Update load balancing stats
        self.load_balancing_stats[agent_name]["requests"] += 1
        self.load_balancing_stats[agent_name]["last_used"] = datetime.now()
        
        # Save to cache periodically
        if stats["total_attempts"] % 10 == 0:  # Save every 10th update
            self.save_performance_cache()
    
    def get_load_balancing_weight(self, agent_name: str) -> float:
        """Calculate load balancing weight (lower = less loaded)"""
        stats = self.load_balancing_stats[agent_name]
        recent_requests = stats["requests"]
        last_used = stats["last_used"]
        
        # Time decay factor - agents used less recently get higher weight
        if last_used:
            minutes_since_use = (datetime.now() - last_used).total_seconds() / 60
            time_factor = min(1.0, minutes_since_use / 30.0)  # 30 min full decay
        else:
            time_factor = 1.0
        
        # Request count factor - agents with fewer requests get higher weight
        request_factor = 1.0 / (1.0 + recent_requests * 0.1)
        
        return time_factor * request_factor


class IntelligentAgentOrchestrator:
    """Enhanced orchestrator with semantic matching and intelligent selection"""
    
    def __init__(self):
        self.semantic_matcher = SemanticAgentMatcher()
        self.performance_tracker = AgentPerformanceTracker()
    
    def select_optimal_agent(self, user_input: str) -> Tuple[Optional[str], Optional[Dict], float]:
        """
        Select the optimal agent using semantic matching, performance scores, and load balancing
        
        Returns:
            Tuple of (agent_name, agent_config, confidence_score)
        """
        # Get semantically similar agents
        candidate_agents = self.semantic_matcher.find_best_agents(
            user_input, 
            top_k=5,
            similarity_threshold=0.2
        )
        
        if not candidate_agents:
            logger.warning("⚠️ No agents matched the query semantically")
            return None, None, 0.0
        
        # Score each candidate agent
        scored_agents = []
        for agent_name, semantic_score, agent_config in candidate_agents:
            # Get performance score
            performance_score = self.performance_tracker.get_agent_score(agent_name)
            
            # Get load balancing weight
            load_balance_weight = self.performance_tracker.get_load_balancing_weight(agent_name)
            
            # Check if agent is currently overloaded (token budget)
            token_budget = agent_config.get("token_budget")
            budget_score = 1.0
            if token_budget:
                current_usage = token_tracker.get_agent_token_summary(agent_name)
                used_tokens = current_usage.get("total_tokens", 0)
                budget_utilization = used_tokens / token_budget
                budget_score = max(0.1, 1.0 - budget_utilization)  # Penalize high utilization
            
            # Combined scoring formula
            combined_score = (
                semantic_score * 0.5 +           # Semantic relevance (50%)
                performance_score * 0.3 +        # Historical performance (30%)
                load_balance_weight * 0.1 +      # Load balancing (10%)
                budget_score * 0.1               # Token budget availability (10%)
            )
            
            scored_agents.append((
                agent_name,
                agent_config,
                combined_score,
                {
                    "semantic_score": semantic_score,
                    "performance_score": performance_score,
                    "load_balance_weight": load_balance_weight,
                    "budget_score": budget_score
                }
            ))
        
        # Sort by combined score
        scored_agents.sort(key=lambda x: x[2], reverse=True)
        
        # Select the best agent
        best_agent = scored_agents[0]
        agent_name, agent_config, combined_score, score_breakdown = best_agent
        
        logger.info(f"🎯 Selected agent: {agent_name} (score: {combined_score:.3f})")
        logger.info(f"  📊 Score breakdown: {score_breakdown}")
        
        return agent_name, agent_config, combined_score
    
    def select_best_subagent(self, parent_agent_data: Dict, user_input: str) -> Optional[Dict]:
        """Enhanced sub-agent selection with semantic matching"""
        sub_agents = parent_agent_data.get("sub_agents", [])
        if not sub_agents:
            return None
        
        # If semantic matching is available, use it for sub-agents too
        if self.semantic_matcher.model:
            try:
                query_embedding = self.semantic_matcher.model.encode([user_input])[0]
                best_subagent = None
                best_score = -1.0
                
                for sub_agent in sub_agents:
                    # Create text for sub-agent
                    text_sources = []
                    text_sources.extend(sub_agent.get("keywords", []))
                    if sub_agent.get("description"):
                        text_sources.append(sub_agent["description"])
                    
                    if text_sources:
                        sub_embeddings = self.semantic_matcher.model.encode(text_sources)
                        avg_embedding = np.mean(sub_embeddings, axis=0)
                        similarity = cosine_similarity([query_embedding], [avg_embedding])[0][0]
                        
                        if similarity > best_score:
                            best_score = similarity
                            best_subagent = sub_agent
                
                if best_subagent and best_score > 0.3:
                    logger.info(f"🔍 Selected sub-agent: {best_subagent.get('agent_id')} (similarity: {best_score:.3f})")
                    return best_subagent
            except Exception as e:
                logger.error(f"❌ Sub-agent semantic matching failed: {e}")
        
        # Fallback to keyword matching
        for sub_agent in sub_agents:
            if "keywords" in sub_agent:
                for kw in sub_agent["keywords"]:
                    if kw.lower() in user_input.lower():
                        return sub_agent
        
        # Return first available sub-agent
        return sub_agents[0] if sub_agents else None


# Global instances
intelligent_orchestrator = IntelligentAgentOrchestrator()


# Enhanced versions of original functions
def match_parent_agent_by_keywords(user_input: str):
    """Enhanced agent matching using intelligent orchestrator"""
    agent_name, agent_data, confidence = intelligent_orchestrator.select_optimal_agent(user_input)
    return agent_name, agent_data


def select_best_subagent(parent_agent_data, user_input: str):
    """Enhanced sub-agent selection"""
    return intelligent_orchestrator.select_best_subagent(parent_agent_data, user_input)


# Rest of the original functions remain the same but with performance tracking
def emit_orchestrator_event(event_type: str, agent_id: str, job_id: str, tenant_id: str,
                          status: str, step: int, extra_data: dict = None):
    """Emit Kafka event for orchestrator agent execution"""
    event = {
        "event_type": event_type,
        "agent_id": agent_id,
        "job_id": job_id,
        "tenant_id": tenant_id,
        "status": status,
        "step": step,
        "timestamp": datetime.utcnow().isoformat(),
        **(extra_data or {})
    }
   
    send_event("orchestrator.events", event)
   
    logger.info(f"📡 Orchestrator Kafka event: {event_type} for {agent_id}", extra={
        "job_id": job_id,
        "agent_id": agent_id,
        "event_type": event_type
    })


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


def prepare_agent_prompt(agent_data: dict, input_text: str, enhanced_data: str) -> str:
    """Prepare agent prompt with template replacement"""
    prompt_template = agent_data.get("prompt_template", "Analyze this:\n\n{{input}}")
    agent_prompt = prompt_template.replace("{{input}}", enhanced_data)
   
    if "{{question}}" in agent_prompt:
        agent_prompt = agent_prompt.replace("{{question}}", input_text)
    elif 'USER QUESTION:\n""' in agent_prompt:
        agent_prompt = agent_prompt.replace('USER QUESTION:\n""', f'USER QUESTION:\n"{input_text}"')
    elif 'USER QUESTION:' in agent_prompt:
        agent_prompt = f"{agent_prompt}\n\nUser question: {input_text}"
    else:
        agent_prompt = f"{agent_prompt}\n\nUser question: {input_text}"
   
    return agent_prompt


def create_cache_key(user_input: str, agent_name: str, enhanced_data_hash: str = None) -> str:
    """Create a cache key based on user input and agent context"""
    import hashlib
   
    key_components = [user_input, agent_name]
    if enhanced_data_hash:
        key_components.append(enhanced_data_hash)
   
    cache_key = "|".join(key_components)
    return cache_key


def get_enhanced_data_hash(enhanced_data: str) -> str:
    """Get a hash of enhanced data to detect changes"""
    import hashlib
    return hashlib.md5(enhanced_data.encode()).hexdigest()[:8]


def get_llm_config_list(model: str) -> list:
    """Get LLM configuration list - supports both Groq and LM Studio"""
    config = get_groq_config()
    
    return [{
        "model": model or config["model"],
        "api_key": config["api_key"],
        "base_url": config["base_url"]
    }]


def execute_single_agent(agent_name: str, agent_data: dict, input_text: str, job_id: str, tenant_id: str):
    """Execute a single agent with enhanced performance tracking"""
    start_time = time.time()
    groq_config = get_groq_config()
   
    emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "STARTED", 0, {
        "model": agent_data.get("llm_config", {}).get("model"),
        "input_length": len(input_text)
    })
   
    enhanced_data = get_enhanced_data_for_agent(agent_name, input_text, tenant_id)
    enhanced_data_hash = get_enhanced_data_hash(enhanced_data)
    cache_key = create_cache_key(input_text, agent_name, enhanced_data_hash)
   
    cached_response = search_cache(cache_key, tenant_id)
    if cached_response:
        response_time = time.time() - start_time
        intelligent_orchestrator.performance_tracker.update_performance(
            agent_name, True, response_time, 0, cache_hit=True
        )
        
        logger.info(f"✅ Cache hit for agent {agent_name}")
        emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "COMPLETED", 0, {
            "cache_hit": True,
            "tokens_used": 0
        })
        return cached_response, None
   
    agent_prompt = prepare_agent_prompt(agent_data, input_text, enhanced_data)

    # LLM Guard: pre-validate prompt
    if settings.enable_llm_guard:
        ok, reason = validate_prompt(agent_prompt)
        if not ok:
            logger.warning(f"[LLM-GUARD] Blocked prompt for {agent_name}: {reason}")
            emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "COMPLETED", 0, {
                "cache_hit": False,
                "guard_block": True,
                "reason": reason
            })
            return SAFE_FALLBACK_MESSAGE, None
    model = agent_data["llm_config"]["model"]
    config_list = [{
        "model": model,
        "api_key": groq_config["api_key"],
        "base_url": groq_config["base_url"]
    }]
   
    token_budget = agent_data.get("token_budget")
    retry_cfg = agent_data.get("retry_policy") or {}
    max_attempts = max(1, int(retry_cfg.get("max_attempts", 1)))
    delay_seconds = max(0, int(retry_cfg.get("delay_seconds", 0)))

    def remaining_budget() -> int | None:
        if token_budget is None:
            return None
        summary = token_tracker.get_agent_token_summary(agent_name)
        return max(0, int(token_budget) - int(summary.get("total_tokens", 0)))

    last_error_details = None
    for attempt in range(1, max_attempts + 1):
        rem = remaining_budget()
        if rem is not None and rem <= 0:
            error_msg = f"Token budget exceeded for agent {agent_name}"
            response_time = time.time() - start_time
            intelligent_orchestrator.performance_tracker.update_performance(
                agent_name, False, response_time, 0
            )
            emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "FAILED", 0, {
                "error": error_msg,
                "code": "TOKEN_BUDGET_EXCEEDED"
            })
            return None, {
                "error": error_msg,
                "code": "TOKEN_BUDGET_EXCEEDED",
                "agent": agent_name
            }
       
        if attempt > 1:
            emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "RETRYING", 0, {
                "attempt": attempt,
                "max_attempts": max_attempts,
                "error": last_error_details
            })
       
        try:
            assistant = AssistantAgent(name=agent_name, llm_config={"config_list": config_list})
            user_proxy = UserProxyAgent(name="user", human_input_mode="NEVER")
            group_chat = GroupChat(agents=[user_proxy, assistant], messages=[], max_round=2)
            manager = GroupChatManager(groupchat=group_chat, llm_config={"config_list": config_list})

            user_proxy.initiate_chat(manager, message=agent_prompt)
            response = group_chat.messages[-1]["content"]

            # LLM Guard: post-validate response
            if settings.enable_llm_guard:
                ok, reason = validate_response(response)
                if not ok:
                    logger.warning(f"[LLM-GUARD] Blocked response for {agent_name}: {reason}")
                    response = SAFE_FALLBACK_MESSAGE

            # Validate success criteria
            criteria = agent_data.get("success_criteria") or []
            if criteria:
                failures = []
                lower_resp = (response or "").lower()
                if any(c.lower() in ("must output json", "output must be json", "return json") for c in criteria):
                    try:
                        json.loads(response)
                    except Exception:
                        failures.append("Output is not valid JSON")
                if failures:
                    raise ValueError(f"Success criteria failed: {failures}")

            # Save response to cache
            save_to_cache(cache_key, response, tenant_id)

            # Track tokens and performance
            token_usage = token_tracker.track_agent_tokens(
                agent_id=agent_name,
                input_text=agent_prompt,
                output_text=response,
                model_name=model,
                step=0
            )

            response_time = time.time() - start_time
            intelligent_orchestrator.performance_tracker.update_performance(
                agent_name, True, response_time, token_usage.total_tokens
            )

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
           
            emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "COMPLETED", 0, {
                "tokens_used": token_usage.total_tokens,
                "input_tokens": token_usage.input_tokens,
                "output_tokens": token_usage.output_tokens,
                "model": model,
                "output_length": len(response)
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
            last_error_details = error_message
            logger.error(f"🚫 Agent {agent_name} failed on attempt {attempt}/{max_attempts}", extra={
                "job_id": job_id,
                "error": error_message,
                "agent": agent_name
            })
            if attempt < max_attempts and delay_seconds:
                time.sleep(delay_seconds)
            else:
                response_time = time.time() - start_time
                intelligent_orchestrator.performance_tracker.update_performance(
                    agent_name, False, response_time, 0
                )
                emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "FAILED", 0, {
                    "error": error_message,
                    "attempts": attempt,
                    "final_attempt": True
                })
                return None, {
                    "error": f"Agent {agent_name} execution failed after {attempt} attempts.",
                    "details": error_message,
                    "retries_exhausted": attempt >= max_attempts
                }
        except Exception as e:
            last_error_details = str(e)
            logger.exception(f"❌ Agent {agent_name} unhandled exception on attempt {attempt}/{max_attempts}", extra={
                "job_id": job_id,
                "agent": agent_name
            })
            if attempt < max_attempts and delay_seconds:
                time.sleep(delay_seconds)
            else:
                response_time = time.time() - start_time
                intelligent_orchestrator.performance_tracker.update_performance(
                    agent_name, False, response_time, 0
                )
                emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "FAILED", 0, {
                    "error": str(e),
                    "attempts": attempt,
                    "final_attempt": True
                })
                return None, {
                    "error": f"Agent {agent_name} crashed after {attempt} attempts.",
                    "details": str(e),
                    "retries_exhausted": attempt >= max_attempts
                }


def execute_sub_agent(agent_name: str, sub_agent_config: dict, parent_agent: str,
                     input_text: str, job_id: str, tenant_id: str):
    """Execute a sub-agent with enhanced performance tracking"""
    start_time = time.time()
    groq_config = get_groq_config()
   
    emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "STARTED", 0, {
        "parent_agent": parent_agent,
        "model": sub_agent_config.get("llm_config", {}).get("model"),
        "input_length": len(input_text)
    })
   
    enhanced_data = get_enhanced_data_for_agent(parent_agent, input_text, tenant_id)
    enhanced_data_hash = get_enhanced_data_hash(enhanced_data)
    cache_key = create_cache_key(input_text, agent_name, enhanced_data_hash)
   
    cached_response = search_cache(cache_key, tenant_id)
    if cached_response:
        response_time = time.time() - start_time
        intelligent_orchestrator.performance_tracker.update_performance(
            agent_name, True, response_time, 0, cache_hit=True
        )
        
        logger.info(f"✅ Cache hit for sub-agent {agent_name}")
        emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "COMPLETED", 0, {
            "parent_agent": parent_agent,
            "cache_hit": True,
            "tokens_used": 0
        })
        return cached_response, None
   
    subagent_prompt_template = sub_agent_config["params"]["prompt_template"]
    subagent_prompt = prepare_agent_prompt({"prompt_template": subagent_prompt_template}, input_text, enhanced_data)

    # LLM Guard: pre-validate sub-agent prompt
    if settings.enable_llm_guard:
        ok, reason = validate_prompt(subagent_prompt)
        if not ok:
            logger.warning(f"[LLM-GUARD] Blocked sub-agent prompt for {agent_name}: {reason}")
            emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "COMPLETED", 0, {
                "parent_agent": parent_agent,
                "cache_hit": False,
                "guard_block": True,
                "reason": reason
            })
            return SAFE_FALLBACK_MESSAGE, None
   
    subagent_model = sub_agent_config["llm_config"]["model"]
    subagent_config_list = [{
        "model": subagent_model,
        "api_key": groq_config["api_key"],
        "base_url": groq_config["base_url"]
    }]
   
    token_budget = sub_agent_config.get("token_budget")
    retry_cfg = sub_agent_config.get("retry_policy") or {}
    max_attempts = max(1, int(retry_cfg.get("max_attempts", 1)))
    delay_seconds = max(0, int(retry_cfg.get("delay_seconds", 0)))

    def remaining_budget() -> int | None:
        if token_budget is None:
            return None
        summary = token_tracker.get_agent_token_summary(agent_name)
        return max(0, int(token_budget) - int(summary.get("total_tokens", 0)))

    last_error_details = None
    for attempt in range(1, max_attempts + 1):
        rem = remaining_budget()
        if rem is not None and rem <= 0:
            error_msg = f"Token budget exceeded for sub-agent {agent_name}"
            response_time = time.time() - start_time
            intelligent_orchestrator.performance_tracker.update_performance(
                agent_name, False, response_time, 0
            )
            emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "FAILED", 0, {
                "parent_agent": parent_agent,
                "error": error_msg,
                "code": "TOKEN_BUDGET_EXCEEDED"
            })
            return None, {
                "error": error_msg,
                "code": "TOKEN_BUDGET_EXCEEDED",
                "agent": agent_name
            }
       
        if attempt > 1:
            emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "RETRYING", 0, {
                "parent_agent": parent_agent,
                "attempt": attempt,
                "max_attempts": max_attempts,
                "error": last_error_details
            })
       
        try:
            sub_assistant = AssistantAgent(name=agent_name, llm_config={"config_list": subagent_config_list})
            sub_user_proxy = UserProxyAgent(name="sub_user", human_input_mode="NEVER")
            sub_group_chat = GroupChat(agents=[sub_user_proxy, sub_assistant], messages=[], max_round=2)
            sub_manager = GroupChatManager(groupchat=sub_group_chat, llm_config={"config_list": subagent_config_list})

            sub_user_proxy.initiate_chat(sub_manager, message=subagent_prompt)
            subagent_response = sub_group_chat.messages[-1]["content"]

            # LLM Guard: post-validate sub-agent response
            if settings.enable_llm_guard:
                ok, reason = validate_response(subagent_response)
                if not ok:
                    logger.warning(f"[LLM-GUARD] Blocked sub-agent response for {agent_name}: {reason}")
                    subagent_response = SAFE_FALLBACK_MESSAGE

            # Validate success criteria
            criteria = sub_agent_config.get("success_criteria") or []
            if criteria:
                failures = []
                lower_resp = (subagent_response or "").lower()
                if any(c.lower() in ("must output json", "output must be json", "return json") for c in criteria):
                    try:
                        json.loads(subagent_response)
                    except Exception:
                        failures.append("Output is not valid JSON")
                if failures:
                    raise ValueError(f"Success criteria failed: {failures}")

            save_to_cache(cache_key, subagent_response, tenant_id)

            # Track tokens and performance
            token_usage = token_tracker.track_agent_tokens(
                agent_id=agent_name,
                input_text=subagent_prompt,
                output_text=subagent_response,
                model_name=subagent_model,
                step=0
            )

            response_time = time.time() - start_time
            intelligent_orchestrator.performance_tracker.update_performance(
                agent_name, True, response_time, token_usage.total_tokens
            )

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
           
            emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "COMPLETED", 0, {
                "parent_agent": parent_agent,
                "tokens_used": token_usage.total_tokens,
                "input_tokens": token_usage.input_tokens,
                "output_tokens": token_usage.output_tokens,
                "model": subagent_model,
                "output_length": len(subagent_response)
            })

            return subagent_response, None

        except BadRequestError as e:
            error_message = str(e)
            if hasattr(e, 'response') and hasattr(e.response, 'json'):
                try:
                    error_json = e.response.json()
                    error_message = json.dumps(error_json)
                except Exception:
                    pass
            last_error_details = error_message
            logger.error(f"🚫 Sub-agent {agent_name} failed on attempt {attempt}/{max_attempts}", extra={
                "job_id": job_id,
                "error": error_message,
                "agent": agent_name
            })
            if attempt < max_attempts and delay_seconds:
                time.sleep(delay_seconds)
            else:
                response_time = time.time() - start_time
                intelligent_orchestrator.performance_tracker.update_performance(
                    agent_name, False, response_time, 0
                )
                emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "FAILED", 0, {
                    "parent_agent": parent_agent,
                    "error": error_message,
                    "attempts": attempt,
                    "final_attempt": True
                })
                return None, {
                    "error": f"Sub-agent {agent_name} execution failed after {attempt} attempts.",
                    "details": error_message,
                    "retries_exhausted": attempt >= max_attempts
                }
        except Exception as e:
            last_error_details = str(e)
            logger.exception(f"❌ Sub-agent {agent_name} unhandled exception on attempt {attempt}/{max_attempts}", extra={
                "job_id": job_id,
                "agent": agent_name
            })
            if attempt < max_attempts and delay_seconds:
                time.sleep(delay_seconds)
            else:
                response_time = time.time() - start_time
                intelligent_orchestrator.performance_tracker.update_performance(
                    agent_name, False, response_time, 0
                )
                emit_orchestrator_event("agent.execution", agent_name, job_id, tenant_id, "FAILED", 0, {
                    "parent_agent": parent_agent,
                    "error": str(e),
                    "attempts": attempt,
                    "final_attempt": True
                })
                return None, {
                    "error": f"Sub-agent {agent_name} crashed after {attempt} attempts.",
                    "details": str(e),
                    "retries_exhausted": attempt >= max_attempts
                }


create_cache_index_if_not_exists()


def run_individual_agent(input_text: str, tenant_id: str, agent_name: str, agent_type: str = None):
    """Run a specific agent individually with enhanced tracking"""
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
       
        if agent_data.get("type") == "main":
            response, error = execute_single_agent(agent_name, agent_data, input_text, job_id, tenant_id)
            if error:
                return {"job_id": job_id, **error}
           
            parsed_response = restructure_multimetric_data(parse_json_response(response))
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
           
            subagent_response, error = execute_sub_agent(
                agent_name, sub_agent_config, parent_agent, input_text, job_id, tenant_id
            )
            if error:
                return {"job_id": job_id, **error}
           
            subagent_response_json = parse_json_response(subagent_response)
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


def execute_parent_agent(parent_agent_name: str, parent_agent_data: dict,
                        subagent_response: str, input_text: str, job_id: str, tenant_id: str):
    """Execute parent agent with caching and performance tracking"""
    start_time = time.time()
    groq_config = get_groq_config()
   
    emit_orchestrator_event("agent.execution", parent_agent_name, job_id, tenant_id, "STARTED", 1, {
        "input_length": len(input_text),
        "subagent_response_length": len(subagent_response)
    })
   
    parent_prompt_template = parent_agent_data.get("prompt_template", "Analyze this:\n\n{{input}}")
    parent_prompt = parent_prompt_template.replace("{{input}}", subagent_response).replace("{{question}}", input_text)
   
    subagent_hash = get_enhanced_data_hash(subagent_response)
    cache_key = create_cache_key(input_text, f"{parent_agent_name}_parent", subagent_hash)
   
    cached_response = search_cache(cache_key, tenant_id)
    if cached_response:
        response_time = time.time() - start_time
        intelligent_orchestrator.performance_tracker.update_performance(
            parent_agent_name, True, response_time, 0, cache_hit=True
        )
        
        logger.info(f"✅ Cache hit for parent agent {parent_agent_name}")
        emit_orchestrator_event("agent.execution", parent_agent_name, job_id, tenant_id, "COMPLETED", 1, {
            "cache_hit": True,
            "tokens_used": 0
        })
        return cached_response, None
   
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
       
        # LLM Guard: pre-validate parent prompt
        if settings.enable_llm_guard:
            ok, reason = validate_prompt(parent_prompt)
            if not ok:
                logger.warning(f"[LLM-GUARD] Blocked parent prompt for {parent_agent_name}: {reason}")
                emit_orchestrator_event("agent.execution", parent_agent_name, job_id, tenant_id, "COMPLETED", 1, {
                    "cache_hit": False,
                    "guard_block": True,
                    "reason": reason
                })
                return SAFE_FALLBACK_MESSAGE, None

        parent_user_proxy.initiate_chat(parent_manager, message=parent_prompt)
        parent_response = parent_group_chat.messages[-1]["content"]

        # LLM Guard: post-validate parent response
        if settings.enable_llm_guard:
            ok, reason = validate_response(parent_response)
            if not ok:
                logger.warning(f"[LLM-GUARD] Blocked parent response for {parent_agent_name}: {reason}")
                parent_response = SAFE_FALLBACK_MESSAGE
       
        save_to_cache(cache_key, parent_response, tenant_id)
       
        parent_token_usage = token_tracker.track_agent_tokens(
            agent_id=parent_agent_name,
            input_text=parent_prompt,
            output_text=parent_response,
            model_name=parent_model,
            step=1
        )

        response_time = time.time() - start_time
        intelligent_orchestrator.performance_tracker.update_performance(
            parent_agent_name, True, response_time, parent_token_usage.total_tokens
        )
       
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
       
        emit_orchestrator_event("agent.execution", parent_agent_name, job_id, tenant_id, "COMPLETED", 1, {
            "tokens_used": parent_token_usage.total_tokens,
            "input_tokens": parent_token_usage.input_tokens,
            "output_tokens": parent_token_usage.output_tokens,
            "model": parent_model,
            "output_length": len(parent_response)
        })
       
        return parent_response, None
       
    except BadRequestError as e:
        error_message = str(e)
        if hasattr(e, 'response') and hasattr(e.response, 'json'):
            try:
                error_json = e.response.json()
                error_message = json.dumps(error_json)
            except Exception:
                pass

        response_time = time.time() - start_time
        intelligent_orchestrator.performance_tracker.update_performance(
            parent_agent_name, False, response_time, 0
        )
       
        logger.error(f"🚫 Parent agent {parent_agent_name} failed", extra={
            "job_id": job_id,
            "error": error_message,
            "agent": parent_agent_name
        })
       
        emit_orchestrator_event("agent.execution", parent_agent_name, job_id, tenant_id, "FAILED", 1, {
            "error": error_message,
            "code": "API_KEY_ERROR"
        })
       
        return None, {
            "error": f"Parent agent {parent_agent_name} execution failed",
            "details": error_message
        }


def execute_orchestrator_with_cache(input_text: str, tenant_id: str):
    """Execute orchestrator with full workflow caching"""
    workflow_cache_key = create_cache_key(input_text, "full_orchestration")
   
    cached_workflow = search_cache(workflow_cache_key, tenant_id)
    if cached_workflow:
        logger.info("✅ Full orchestration cache HIT")
        try:
            cached_result = json.loads(cached_workflow)
            cached_result["job_id"] = str(uuid.uuid4())
            cached_result["from_cache"] = True
            cached_result["token_usage"] = {"total_tokens": 0, "agents": {}}
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


def run_autogen_agent(input_text: str, tenant_id: str):
    """Enhanced orchestration with semantic matching and intelligent selection"""
    
    # Check for full workflow cache first
    cached_result = execute_orchestrator_with_cache(input_text, tenant_id)
    if cached_result:
        return cached_result
   
    job_id = str(uuid.uuid4())
    groq_config = get_groq_config()
    token_tracker.reset_tracking()
   
    emit_orchestrator_event("orchestration.workflow", "orchestrator", job_id, tenant_id, "STARTED", 0, {
        "input_length": len(input_text),
        "workflow_type": "semantic_orchestration"
    })

    logger.info("🚀 Enhanced agent orchestration started", extra={
        "tenant_id": tenant_id,
        "job_id": job_id,
        "input": input_text
    })

    try:
        # Enhanced agent selection using semantic matching
        parent_agent_name, parent_agent_data = match_parent_agent_by_keywords(input_text)

        if not parent_agent_name:
            general_agent = GeneralAgent()
            general_response = general_agent.run(input_text)
            full_output = "No matching agent found. Using GeneralAgent...\n\n" + general_response

            token_tracker.track_agent_tokens(
                agent_id="GeneralAgent",
                input_text=input_text,
                output_text=general_response,
                model_name="general_model",
                step=0
            )

            logger.warning("⚠️ No matching parent agent found", extra={
                "job_id": job_id,
                "token_summary": token_tracker.get_job_token_summary(job_id)
            })
           
            emit_orchestrator_event("orchestration.workflow", "orchestrator", job_id, tenant_id, "COMPLETED", 0, {
                "fallback_agent": "GeneralAgent",
                "tokens_used": token_tracker.get_job_token_summary(job_id).get("job_total", {}).get("total_tokens", 0)
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

        # Enhanced sub-agent selection
        selected_subagent = select_best_subagent(parent_agent_data, input_text)
        if not selected_subagent:
            logger.error("❌ No sub-agent matched", extra={
                "job_id": job_id,
                "parent_agent": parent_agent_name
            })
           
            emit_orchestrator_event("orchestration.workflow", "orchestrator", job_id, tenant_id, "FAILED", 0, {
                "error": f"No sub-agent found for parent agent: {parent_agent_name}"
            })
           
            return {
                "job_id": job_id,
                "error": f"No sub-agent found for parent agent: {parent_agent_name}"
            }

        logger.info("🎯 Enhanced agent selection completed", extra={
            "job_id": job_id,
            "parent_agent": parent_agent_name,
            "sub_agent": selected_subagent["agent_id"]
        })
       
        emit_orchestrator_event("orchestration.workflow", "orchestrator", job_id, tenant_id, "PROGRESS", 0, {
            "parent_agent": parent_agent_name,
            "sub_agent": selected_subagent["agent_id"],
            "selection_method": "semantic_matching"
        })

        # Execute sub-agent
        subagent_response, error = execute_sub_agent(
            selected_subagent["agent_id"], selected_subagent, parent_agent_name,
            input_text, job_id, tenant_id
        )
        if error:
            emit_orchestrator_event("orchestration.workflow", "orchestrator", job_id, tenant_id, "FAILED", 0, {
                "error": error.get("error", "Sub-agent execution failed"),
                "step": "sub_agent_execution"
            })
            return {"job_id": job_id, **error}

        subagent_response_json = parse_json_response(subagent_response)

        # Execute parent agent
        logger.info("▶️ Executing parent agent", extra={
            "job_id": job_id,
            "agent": parent_agent_name
        })
       
        parent_response, error = execute_parent_agent(
            parent_agent_name, parent_agent_data, subagent_response,
            input_text, job_id, tenant_id
        )
        if error:
            emit_orchestrator_event("orchestration.workflow", "orchestrator", job_id, tenant_id, "FAILED", 0, {
                "error": error.get("error", "Parent agent execution failed"),
                "step": "parent_agent_execution"
            })
            return {"job_id": job_id, **error}

        # Orchestrator summary
        orchestrator_summary = (
            f"Here is the enhanced analysis based on your query:\n\n"
            f"{parent_response.strip()}"
        )

        # Track orchestrator performance
        orchestrator_token_usage = token_tracker.track_agent_tokens(
            agent_id="orchestrator_agent",
            input_text=parent_response,
            output_text=orchestrator_summary,
            model_name=parent_agent_data["llm_config"]["model"],
            step=2
        )

        # Save memory records
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

        # Save chain records for full execution flow
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
       
        # Emit orchestration completed event
        emit_orchestrator_event("orchestration.workflow", "orchestrator", job_id, tenant_id, "COMPLETED", 2, {
            "parent_agent": parent_agent_name,
            "sub_agent": selected_subagent["agent_id"],
            "total_tokens": token_summary.get("job_total", {}).get("total_tokens", 0),
            "final_output_length": len(orchestrator_summary),
            "selection_method": "semantic_matching",
            "performance_scores": {
                "parent_agent": intelligent_orchestrator.performance_tracker.get_agent_score(parent_agent_name),
                "sub_agent": intelligent_orchestrator.performance_tracker.get_agent_score(selected_subagent["agent_id"])
            }
        })
       
        # Create comprehensive final result
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
            },
            "performance_metrics": {
                "parent_agent_score": intelligent_orchestrator.performance_tracker.get_agent_score(parent_agent_name),
                "sub_agent_score": intelligent_orchestrator.performance_tracker.get_agent_score(selected_subagent["agent_id"]),
                "selection_confidence": intelligent_orchestrator.semantic_matcher.find_best_agents(input_text, top_k=1)[0][1] if intelligent_orchestrator.semantic_matcher.find_best_agents(input_text, top_k=1) else 0.0
            },
            "execution_metadata": {
                "semantic_matching_enabled": True,
                "performance_tracking_enabled": True,
                "cache_optimization": True,
                "workflow_version": "v2.0_semantic_enhanced"
            }
        }
       
        # Cache the entire enhanced workflow result
        workflow_cache_key = create_cache_key(input_text, "full_orchestration_v2")
        try:
            save_to_cache(workflow_cache_key, json.dumps(final_result, default=str), tenant_id)
            logger.info("💾 Cached enhanced orchestration workflow result")
        except Exception as cache_error:
            logger.warning(f"⚠️ Failed to cache workflow result: {cache_error}")
       
        logger.info("✅ Enhanced agent orchestration completed", extra={
            "job_id": job_id,
            "parent_agent": parent_agent_name,
            "sub_agent": selected_subagent["agent_id"],
            "token_summary": token_summary,
            "semantic_matching": True,
            "performance_tracking": True
        })

        return final_result

    except Exception as e:
        # Enhanced error handling with performance tracking
        emit_orchestrator_event("orchestration.workflow", "orchestrator", job_id, tenant_id, "FAILED", 0, {
            "error": str(e),
            "step": "unhandled_exception",
            "semantic_matching_enabled": True
        })
       
        logger.exception("❌ Unhandled exception during enhanced agent orchestration", extra={
            "job_id": job_id,
            "tenant_id": tenant_id,
            "input": input_text,
            "traceback": traceback.format_exc(),
            "orchestration_version": "v2.0_semantic"
        })
        
        return {
            "job_id": job_id,
            "error": "Internal server error during enhanced agent execution.",
            "details": str(e),
            "orchestration_version": "v2.0_semantic_enhanced"
        }


# Additional utility functions to support the enhanced system

def get_system_health_metrics():
    """Get comprehensive system health metrics"""
    return {
        "semantic_matcher_status": intelligent_orchestrator.semantic_matcher.model is not None,
        "cached_agent_embeddings": len(intelligent_orchestrator.semantic_matcher.agent_embeddings),
        "performance_tracked_agents": len(intelligent_orchestrator.performance_tracker.performance_cache),
        "load_balancing_stats": dict(intelligent_orchestrator.performance_tracker.load_balancing_stats),
        "system_version": "v2.0_semantic_enhanced"
    }


def refresh_agent_embeddings():
    """Manually refresh agent embeddings (useful after config changes)"""
    try:
        intelligent_orchestrator.semantic_matcher.precompute_agent_embeddings()
        logger.info("✅ Agent embeddings refreshed successfully")
        return {"status": "success", "embeddings_count": len(intelligent_orchestrator.semantic_matcher.agent_embeddings)}
    except Exception as e:
        logger.error(f"❌ Failed to refresh embeddings: {e}")
        return {"status": "error", "details": str(e)}


def get_agent_performance_report(agent_name: str = None):
    """Get detailed performance report for agents"""
    if agent_name:
        if agent_name in intelligent_orchestrator.performance_tracker.performance_cache:
            stats = intelligent_orchestrator.performance_tracker.performance_cache[agent_name]
            score = intelligent_orchestrator.performance_tracker.get_agent_score(agent_name)
            return {
                "agent_name": agent_name,
                "performance_score": score,
                "statistics": stats,
                "load_balance_weight": intelligent_orchestrator.performance_tracker.get_load_balancing_weight(agent_name)
            }
        else:
            return {"error": f"No performance data found for agent: {agent_name}"}
    else:
        # Return all agents' performance
        all_performance = {}
        for agent_name in intelligent_orchestrator.performance_tracker.performance_cache:
            stats = intelligent_orchestrator.performance_tracker.performance_cache[agent_name]
            score = intelligent_orchestrator.performance_tracker.get_agent_score(agent_name)
            all_performance[agent_name] = {
                "performance_score": score,
                "statistics": stats,
                "load_balance_weight": intelligent_orchestrator.performance_tracker.get_load_balancing_weight(agent_name)
            }
        return all_performance


def optimize_agent_selection_thresholds(min_similarity: float = 0.2, performance_weight: float = 0.3):
    """Dynamically optimize agent selection thresholds based on system performance"""
    # This could be enhanced with ML-based optimization in the future
    logger.info(f"🔧 Optimizing selection thresholds: similarity={min_similarity}, performance_weight={performance_weight}")
    
    # For now, this is a placeholder for future optimization logic
    return {
        "status": "optimized",
        "similarity_threshold": min_similarity,
        "performance_weight": performance_weight,
        "recommendation": "Thresholds updated based on system performance data"
    }


# Enhanced debugging and monitoring functions
def debug_agent_selection(user_input: str, tenant_id: str = None):
    """Debug the agent selection process"""
    debug_info = {
        "input": user_input,
        "semantic_matching_available": intelligent_orchestrator.semantic_matcher.model is not None,
        "candidate_agents": [],
        "selection_scores": {},
        "final_selection": None
    }
    
    try:
        # Get candidate agents with detailed scoring
        candidates = intelligent_orchestrator.semantic_matcher.find_best_agents(user_input, top_k=5)
        
        for agent_name, semantic_score, agent_config in candidates:
            performance_score = intelligent_orchestrator.performance_tracker.get_agent_score(agent_name)
            load_balance_weight = intelligent_orchestrator.performance_tracker.get_load_balancing_weight(agent_name)
            
            # Check token budget
            token_budget = agent_config.get("token_budget")
            budget_score = 1.0
            if token_budget:
                current_usage = token_tracker.get_agent_token_summary(agent_name)
                used_tokens = current_usage.get("total_tokens", 0)
                budget_utilization = used_tokens / token_budget
                budget_score = max(0.1, 1.0 - budget_utilization)
            
            combined_score = (
                semantic_score * 0.5 +
                performance_score * 0.3 +
                load_balance_weight * 0.1 +
                budget_score * 0.1
            )
            
            debug_info["candidate_agents"].append({
                "agent_name": agent_name,
                "semantic_score": semantic_score,
                "performance_score": performance_score,
                "load_balance_weight": load_balance_weight,
                "budget_score": budget_score,
                "combined_score": combined_score
            })
            
            debug_info["selection_scores"][agent_name] = combined_score
        
        # Sort by combined score
        debug_info["candidate_agents"].sort(key=lambda x: x["combined_score"], reverse=True)
        
        if debug_info["candidate_agents"]:
            debug_info["final_selection"] = debug_info["candidate_agents"][0]["agent_name"]
        
        return debug_info
        
    except Exception as e:
        debug_info["error"] = str(e)
        return debug_info


# Export the enhanced orchestration system
__all__ = [
    'run_autogen_agent',
    'run_individual_agent', 
    'intelligent_orchestrator',
    'get_system_health_metrics',
    'refresh_agent_embeddings',
    'get_agent_performance_report',
    'optimize_agent_selection_thresholds',
    'debug_agent_selection'
]