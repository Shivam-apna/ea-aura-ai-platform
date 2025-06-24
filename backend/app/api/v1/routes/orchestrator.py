from fastapi import APIRouter
from pydantic import BaseModel
from autogen import UserProxyAgent
from app.agent.orchestrator import create_groq_orchestrator
from app.data_connector.http_tools import http_request_tool
from typing import Optional, Dict, Any
import json

router = APIRouter()

class OrchestratorRequest(BaseModel):
    user_input: str
    http_request_config: Optional[Dict[str, Any]] = None

@router.post("/orchestrator")
async def run_orchestrator(req: OrchestratorRequest):
    http_result = None

    # Perform HTTP request if config provided
    if req.http_request_config:
        try:
            url = req.http_request_config.get("url")
            method = req.http_request_config.get("method", "GET").upper()
            headers = req.http_request_config.get("headers", {})
            body = req.http_request_config.get("body")

            http_result = http_request_tool(url, method, headers, body)

            # Pretty-print if JSON
            if http_result.startswith("SUCCESS: "):
                data_part = http_result[len("SUCCESS: "):].strip()
                try:
                    json_data = json.loads(data_part)  # Ensure valid JSON
                    compact_http = json.dumps(json_data, separators=(',', ':'))  # Compact JSON (no extra spaces)
                    http_result = f"SUCCESS:{compact_http}"
                except Exception:
                    # If JSON parsing fails, leave http_result as is
                    pass


        except Exception as e:
            http_result = f"HTTP tool error: {str(e)}"

    # Create the orchestrator agent (no extra_context!)
    orchestrator = create_groq_orchestrator()

    # Create the user proxy agent
    user_proxy = UserProxyAgent(
        name="Founder",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=0,
        code_execution_config=False,
        is_termination_msg=lambda x: True,
        system_message="You are a founder seeking advice."
    )

    # Capture response
    response_content = None
    def capture_response(recipient, messages, sender, config):
        nonlocal response_content
        if messages:
            response_content = messages[-1].get("content", "")
        return True, None

    user_proxy.register_reply(
        trigger=lambda sender: sender.name == "OrchestratorAgent",
        reply_func=capture_response
    )

    # Include http_result in the user message
    combined_input = req.user_input
    if http_result:
        combined_input += f"\n\nHere is external data fetched via HTTP tool:\n{http_result}"

    try:
        chat_result = user_proxy.initiate_chat(
            orchestrator,
            message=combined_input,
            max_turns=1
        )

        if not response_content and chat_result:
            if hasattr(chat_result, 'chat_history') and chat_result.chat_history:
                for msg in reversed(chat_result.chat_history):
                    if msg.get('name') == 'OrchestratorAgent' or msg.get('role') == 'assistant':
                        response_content = msg.get('content', '')
                        break
            elif hasattr(chat_result, 'summary'):
                response_content = chat_result.summary

    except Exception as e:
        print(f"Chat error: {e}")
        response_content = f"Error: {str(e)}"

    return {
        "success": bool(response_content),
        "response": response_content or "No response generated",
        "http_result": http_result
    }
