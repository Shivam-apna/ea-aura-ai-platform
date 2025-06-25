from vault.client import get_vault_secret
import os


def get_groq_config():
    # Retrieve the Groq API key securely from Vault
    api_key = get_vault_secret(secret_path="groq", key="api_key")

    return {
        "model": os.getenv("GROQ_MODEL", "gemma2-9b-it"),
        "api_key": api_key,
        "base_url": os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    }