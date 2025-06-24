import json, os


CONFIG_PATH = os.path.join(os.path.dirname(__file__), "../agents/agent_configs.json")

with open(CONFIG_PATH) as f:
    AGENT_CONFIGS = json.load(f)

def get_agent_config(agent_name: str):
    return AGENT_CONFIGS.get(agent_name, {})
