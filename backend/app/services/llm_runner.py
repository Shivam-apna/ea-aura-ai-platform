import httpx
from app.groq_config import get_groq_config
from app.utils.agent_config_loader import get_agent_config

def real_agent_response(agent_name: str, input_text: str, model: str = None) -> str:
    try:
        agent_cfg = get_agent_config(agent_name)
        prompt_template = agent_cfg.get("prompt_template", "Analyze:\n\n{{input}}")
        print()
        config = get_groq_config()

        # Resolve llm config (model, temperature, max_tokens)
        llm_cfg = agent_cfg.get("llm_config") or {}
        resolved_model = model or llm_cfg.get("model") or "gemma2-9b-it"
        resolved_max_tokens = int(llm_cfg.get("max_tokens", 1000))
        resolved_temperature = float(llm_cfg.get("temperature", 0.7))

        prompt = prompt_template.replace("{{input}}", input_text)

        headers = {
            "Authorization": f"Bearer {config['api_key']}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": resolved_model,
            "messages": [
                {"role": "system", "content": "You are a specialized sub-agent in the EA-AURA AI system."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": resolved_max_tokens,
            "temperature": resolved_temperature
        }

        # Ensure correct URL - Groq uses this exact format
        api_url = "https://api.groq.com/openai/v1/chat/completions"
        
        print(f"[DEBUG] Making request to: {api_url}")
        print(f"[DEBUG] Model: {resolved_model}")
        print(f"[DEBUG] API Key present: {'api_key' in config and bool(config['api_key'])}")
        
        response = httpx.post(api_url, headers=headers, json=payload, timeout=30.0)
        
        print(f"[DEBUG] Response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"[DEBUG] Response content: {response.text}")
            
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
        
    except httpx.HTTPStatusError as e:
        print(f"[❌ Groq HTTP Error] {e.response.status_code}: {e.response.text}")
        return f"[Error: HTTP {e.response.status_code}]"
    except Exception as e:
        print(f"[❌ Groq Error] {e}")
        return "[Error: LLM call failed]"