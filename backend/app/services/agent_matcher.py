"""
Agent matching and configuration utilities
"""
from app.utils.agent_config_loader import get_all_agent_configs
from app.services.es_search import (
    query_sales_data,
    query_customer_survey_data,
    query_mission_alignment_data,
    query_brand_audit_data
)


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
    # Map agent names to data queries
    agent_data_mapping = {
        "business_vitality_agent": lambda: query_sales_data(query_text=input_text),
        "customer_analyzer_agent": lambda: query_customer_survey_data(query_text=input_text),
        "strategic_alignment_agent": lambda: query_mission_alignment_data(query_text=input_text),
        "brand_index_agent": lambda: query_brand_audit_data(query_text=input_text)
    }
    
    return agent_data_mapping.get(agent_name, lambda: input_text)()


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