import os
import hvac
import logging

logger = logging.getLogger("uvicorn.error")


def get_vault_secret(secret_path: str, key: str) -> str:
    """
    Retrieve a secret from HashiCorp Vault.
    
    Args:
        secret_path: Path to the secret in Vault (e.g., "groq" for secret/data/groq)
        key: The key within the secret (e.g., "api_key")
    
    Returns:
        The secret value as a string
    """

    #For local
    # vault_addr = os.getenv("VAULT_ADDR", "http://127.0.0.1:8200")
    # vault_token = os.getenv("VAULT_TOKEN", "for local")

    #For Docker
    vault_addr = os.getenv("VAULT_ADDR", "http://vault:8200")
    vault_token = os.getenv("VAULT_TOKEN")

    if not vault_token:
        raise ValueError("VAULT_TOKEN not found in environment variables.")

    client = hvac.Client(url=vault_addr, token=vault_token)

    if not client.is_authenticated():
        raise Exception("Failed to authenticate with Vault")

    try:
        response = client.secrets.kv.v2.read_secret_version(path=secret_path)
        secret_data = response['data']['data']

        if key not in secret_data:
            raise KeyError(f"Key '{key}' not found in secret at path '{secret_path}'")

        return secret_data[key]

    except Exception as e:
        raise Exception(f"Failed to retrieve secret from Vault: {str(e)}")