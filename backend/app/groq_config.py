from vault.client import get_vault_secret
import os

def get_groq_config():
    """
    Updated configuration to support both Groq and hosted LM Studio
    """
    # Check if we're using LM Studio or Groq
    use_lm_studio = os.getenv("USE_LM_STUDIO", "false").lower() == "true"
    
    if use_lm_studio:
        # Hosted LM Studio configuration
        # Try to get API key from vault, fallback to environment variable
        try:
            api_key = get_vault_secret(secret_path="lm_studio", key="api_key")
            print("api_key", api_key)
        except:
            api_key = os.getenv("LM_STUDIO_API_KEY", "lm-studio")
        
        return {
            "model": os.getenv("LM_STUDIO_MODEL", "llama-3.3-70b-instruct"),
            "api_key": api_key,
            "base_url": os.getenv("LM_STUDIO_BASE_URL", "https://api.pinguaicloud.com/v1")
        }
    else:
        # Original Groq configuration
        api_key = get_vault_secret(secret_path="groq", key="api_key")
        return {
            "model": os.getenv("GROQ_MODEL", "gemma2-9b-it"),
            "api_key": api_key,
            "base_url": os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        }