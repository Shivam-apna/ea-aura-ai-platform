# agent_config_loader.py

import json
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "agents/agent_configs.json")

with open(CONFIG_PATH) as f:
    AGENT_CONFIGS = json.load(f)

def get_agent_config(agent_name: str):
    return AGENT_CONFIGS.get(agent_name, {})

def get_all_agent_configs():
    return AGENT_CONFIGS
