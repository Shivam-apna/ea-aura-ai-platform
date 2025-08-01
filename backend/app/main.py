from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys

# API v1 routes
from app.dao.job_index import index_job
from app.api.v1.routes import health, agent_job, sub_agent_chain, agent_memory, test_agent_run
from app.core.index_manager import IndexManager
from app.core.elastic import get_es_client
from app.core.core_log import logger
from app.core.config import settings, get_environment_config

# Configure logging based on environment
env_config = get_environment_config()
logging.basicConfig(
    level=getattr(logging, env_config["log_level"]),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app/logs/app.log')
    ]
)

logger.info(f"✅ EA-AURA backend logging initialized for {settings.environment} environment")
logger.info(f"🔧 Environment: {settings.environment}")
logger.info(f"🐛 Debug mode: {settings.debug}")
logger.info(f"📊 Log level: {env_config['log_level']}")

# Create FastAPI app with environment-specific settings
app = FastAPI(
    title=settings.app_name,
    description="EA AURA AI Platform Backend API",
    version="1.0.0",
    debug=env_config["debug"]
)

# Include all API routers
app.include_router(health.router, prefix="/api/v1/health", tags=["Health"])
app.include_router(agent_job.router, prefix="/api/v1")
app.include_router(sub_agent_chain.router, prefix="/api/v1")
app.include_router(agent_memory.router, prefix="/api/v1")

# Only include test routes in development and testing
if settings.is_development or settings.is_testing:
    app.include_router(test_agent_run.router, tags=["Debug"])
    logger.info("🧪 Test routes enabled for development/testing")

# Startup event for ES + Index init
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting up EA AURA Backend...")
    try:
        get_es_client()
        IndexManager.create_indices()
        logger.info("✅ Elasticsearch and indices initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Elasticsearch: {e}")
        if settings.is_production:
            raise e

# CORS middleware with environment-specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=env_config["cors_origins"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "EA AURA AI Platform",
        "environment": settings.environment,
        "version": "1.0.0",
        "status": "running"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.environment,
        "timestamp": "2024-01-01T00:00:00Z"
    }


