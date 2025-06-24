from autogen import AssistantAgent
from app.groq_config import get_groq_config
from app.data_connector.http_tools import http_request_tool
import json
import os

# Build absolute path to config
config_path = os.path.join(
    os.path.dirname(__file__),
    "orchestrator_config.json"
)
config_path = os.path.abspath(config_path)

# Load orchestrator config
with open(config_path) as f:
    orchestrator_config = json.load(f)

def create_groq_orchestrator():
    groq_config = get_groq_config()

    llm_config = {
        "model": groq_config["model"],
        "api_key": groq_config["api_key"],
        "base_url": groq_config["base_url"],
    }

    # Prepare configuration summary
    config_summary = json.dumps(
        orchestrator_config["orchestrator"]["configuration"]["triggers"], 
        indent=2
    )

    # Compose system message
    system_message = (
        "You are the Central Orchestrator Agent — the conductor that coordinates all other agents in the AI platform ecosystem. "
        "Do not provide info if querty not found related to the dataset or any http request"
        "Your role is to manage agent workflows, maintain shared context, and ensure mission alignment. "
        "When provided JSON data via HTTP tool, you must parse the JSON, extract requested fields (e.g., all usernames), and output only those fields as requested. "
        "Respond with ONLY the extracted data — no extra text. "
        f"Here is your configuration context:\n{config_summary}\n"
    )


    # Create the assistant agent
    agent = AssistantAgent(
        name="OrchestratorAgent",
        system_message=system_message,
        llm_config=llm_config,
    )

    # Register the HTTP request tool (correct usage)
    agent.register_function({
        "http_request_tool": http_request_tool
    })

    return agent
