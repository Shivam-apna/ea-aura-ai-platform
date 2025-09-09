from vault.client import get_vault_secret
import os

def get_groq_config():
    """
    Updated configuration to support Groq, hosted LM Studio, and OpenRouter
    """
    # Check which provider to use based on environment variables
    provider = os.getenv("AI_PROVIDER", "openrouter").lower()
    
    if provider == "lm_studio":
        # Hosted LM Studio configuration
        # Try to get API key from vault, fallback to environment variable
        try:
            api_key = get_vault_secret(secret_path="lm_studio", key="api_key")
            print("api_key", api_key)
        except:
            api_key = os.getenv("LM_STUDIO_API_KEY", "lm-studio")
        
        return {
            "model": os.getenv("LM_STUDIO_MODEL", "qwen/qwen3-coder-30b"),
            "api_key": api_key,
            "base_url": os.getenv("LM_STUDIO_BASE_URL", "https://api.pinguaicloud.com/v1")
        }
    elif provider == "openrouter":
        # OpenRouter configuration
        # Try to get API key from vault, fallback to environment variable
        try:
            api_key = get_vault_secret(secret_path="openrouter", key="api_key")
        except:
            api_key = os.getenv("OPENROUTER_API_KEY")
        
        return {
            "model": os.getenv("OPENROUTER_MODEL", "openai/gpt-4.1-mini"),
            "api_key": api_key,
            "base_url": os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        }
    else:
        # Default Groq configuration
        api_key = get_vault_secret(secret_path="groq", key="api_key")
        return {
            "model": os.getenv("GROQ_MODEL", "gemma2-9b-it"),
            "api_key": api_key,
            "base_url": os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        }