import os
from typing import Optional
from pydantic_settings import BaseSettings
from enum import Enum
from pydantic import Field

class Environment(str, Enum):
    DEVELOPMENT = "development"
    TESTING = "testing"
    PRODUCTION = "production"

class Settings(BaseSettings):
    # Environment Configuration
    environment: Environment = Field(
        default=Environment.DEVELOPMENT,
        env="ENVIRONMENT"
    )
    app_name: str = Field(default="EA-AURA Backend", env="APP_NAME")
    debug: bool = Field(default=True, env="DEBUG")
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Database Configuration
    elasticsearch_url: str = Field(
        default="http://elasticsearch:9200",
        env="ELASTICSEARCH_URL"
    )
    elasticsearch_username: Optional[str] = Field(
        default=None, env="ELASTICSEARCH_USERNAME"
    )
    elasticsearch_password: Optional[str] = Field(
        default=None, env="ELASTICSEARCH_PASSWORD"
    )
    
    # Kafka Configuration
    kafka_bootstrap_servers: str = Field(
        default="kafka:9092",
        env="KAFKA_BOOTSTRAP_SERVERS"
    )
    kafka_topic_prefix: str = Field(
        default="ea-aura",
        env="KAFKA_TOPIC_PREFIX"
    )
    
    # Vault Configuration
    vault_addr: str = Field(
        default="http://vault:8200",
        env="VAULT_ADDR"
    )
    vault_token: str = Field(
        default="demo",
        env="VAULT_TOKEN"
    )
    
    # Keycloak Configuration
    keycloak_url: str = Field(
        default="http://keycloak:8080",
        env="KEYCLOAK_URL"
    )
    keycloak_realm: str = Field(
        default="master",
        env="KEYCLOAK_REALM"
    )
    keycloak_client_id: str = Field(
        default="admin-cli",
        env="KEYCLOAK_CLIENT_ID"
    )
    keycloak_client_secret: Optional[str] = Field(
        default=None,
        env="KEYCLOAK_CLIENT_SECRET"
    )
    keycloak_admin_username: str = Field(
        default="admin",
        env="KEYCLOAK_ADMIN_USERNAME"
    )
    keycloak_admin_password: str = Field(
        default="admin",
        env="KEYCLOAK_ADMIN_PASSWORD"
    )
    
    # AI/LLM Configuration
    openai_api_key: Optional[str] = Field(
        default=None, env="OPENAI_API_KEY"
    )
    groq_api_key: Optional[str] = Field(
        default=None, env="GROQ_API_KEY"
    )
    
    # Logging Configuration
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(
        default="json",
        env="LOG_FORMAT"
    )
    
    # CORS Configuration
    cors_origins: list = Field(
        default=["http://localhost:5000", "http://localhost:3000"],
        env="CORS_ORIGINS"
    )
    
    # Security Configuration
    secret_key: str = Field(
        default="your-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    
    # Performance Configuration
    max_workers: int = Field(default=4, env="MAX_WORKERS")
    worker_timeout: int = Field(default=30, env="WORKER_TIMEOUT")
    
    # Feature Flags
    enable_agent_chaining: bool = Field(default=True, env="ENABLE_AGENT_CHAINING")
    enable_memory_management: bool = Field(default=True, env="ENABLE_MEMORY_MANAGEMENT")
    enable_token_tracking: bool = Field(default=True, env="ENABLE_TOKEN_TRACKING")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def is_development(self) -> bool:
        return self.environment == Environment.DEVELOPMENT
    
    @property
    def is_testing(self) -> bool:
        return self.environment == Environment.TESTING
    
    @property
    def is_production(self) -> bool:
        return self.environment == Environment.PRODUCTION
    
    def get_elasticsearch_config(self):
        """Get Elasticsearch configuration based on environment"""
        config = {
            "hosts": [self.elasticsearch_url],
            "timeout": 30,
            "max_retries": 3,
            "retry_on_timeout": True
        }
        
        if self.elasticsearch_username and self.elasticsearch_password:
            config["http_auth"] = (self.elasticsearch_username, self.elasticsearch_password)
        
        if self.is_production:
            config["verify_certs"] = True
            config["ssl_show_warn"] = True
        else:
            config["verify_certs"] = False
            config["ssl_show_warn"] = False
        
        return config

# Create settings instance
settings = Settings()

# Environment-specific configurations
def get_environment_config():
    """Get environment-specific configuration"""
    if settings.is_development:
        return {
            "debug": True,
            "log_level": "DEBUG",
            "cors_origins": ["http://localhost:5000", "http://localhost:3000", "http://localhost:8080"],
            "max_workers": 2,
            "worker_timeout": 60
        }
    elif settings.is_testing:
        return {
            "debug": True,
            "log_level": "INFO",
            "cors_origins": ["http://localhost:5000"],
            "max_workers": 1,
            "worker_timeout": 30
        }
    else:  # Production
        return {
            "debug": False,
            "log_level": "WARNING",
            "cors_origins": settings.cors_origins,
            "max_workers": settings.max_workers,
            "worker_timeout": settings.worker_timeout
        }
