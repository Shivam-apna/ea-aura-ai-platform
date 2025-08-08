from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
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

# Aggressive Header Override Middleware
class AggressiveHeaderOverrideMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.environment = settings.environment
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Very permissive CSP that allows everything we need
        permissive_csp = (
            "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; "
            "script-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; "
            "connect-src 'self' https: data:; "
            "font-src 'self' https: data:; "
            "img-src 'self' https: data: blob:; "
            "frame-src 'self' https:; "
            "frame-ancestors 'self' https:; "
            "object-src 'none';"
        )
        
        # Force override ALL security headers
        response.headers["Content-Security-Policy"] = permissive_csp
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Log what we're setting (for debugging)
        logger.info(f"🔒 Setting CSP header: {permissive_csp[:100]}...")
        
        return response

# Alternative: Use HTTP middleware decorator (sometimes more reliable)
@app.middleware("http")
async def force_header_override(request: Request, call_next):
    response = await call_next(request)
    
    # This is a backup - will run after the class-based middleware
    if not response.headers.get("Content-Security-Policy"):
        logger.warning("⚠️ CSP header not set by middleware, setting now...")
        response.headers["Content-Security-Policy"] = (
            "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; "
            "font-src 'self' https: data:; "
            "style-src 'self' https: data: 'unsafe-inline'; "
            "connect-src 'self' https: data:; "
            "img-src 'self' https: data: blob:;"
        )
    
    return response

# Add the aggressive header override middleware FIRST
app.add_middleware(AggressiveHeaderOverrideMiddleware)

# CORS middleware with environment-specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=env_config["cors_origins"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# Debug endpoint - ALWAYS available for now to troubleshoot
@app.get("/debug/headers")
async def debug_headers(request: Request, response: Response):
    """Debug endpoint to check what headers are being sent"""
    
    # Manually set CSP on this response too
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; "
        "font-src 'self' https: data:; "
        "style-src 'self' https: data: 'unsafe-inline'; "
        "connect-src 'self' https: data:; "
        "img-src 'self' https: data: blob:;"
    )
    
    return {
        "environment": settings.environment,
        "request_headers": dict(request.headers),
        "message": "Check browser Network tab for response headers",
        "csp_override": "ACTIVE",
        "manual_csp_set": True,
        "debug_time": "Check logs for CSP setting messages"
    }

# Test endpoint to verify external resources
@app.get("/test/external-resources")
async def test_external_resources(response: Response):
    """Test endpoint to check if external resources work"""
    
    # Set very permissive CSP
    response.headers["Content-Security-Policy"] = (
        "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; "
        "style-src * 'unsafe-inline'; connect-src *; font-src *; img-src * data: blob:;"
    )
    
    return {
        "google_fonts_test": "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
        "image_test": "https://i.postimg.cc/PrSCLDq0/ea-aura-image.jpg",
        "api_test": "https://newsdata.io/api/1/news",
        "csp_policy": "completely_permissive",
        "message": "Try accessing these resources from frontend"
    }

# Startup event for ES + Index init
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting up EA AURA Backend...")
    logger.info("🔒 AGGRESSIVE Security header override middleware enabled")
    logger.info("🌐 Google Fonts, PostImg, and NewsData should now work")
    try:
        get_es_client()
        IndexManager.create_indices()
        logger.info("✅ Elasticsearch and indices initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Elasticsearch: {e}")
        if settings.is_production:
            raise e

# Root endpoint
@app.get("/")
async def root(response: Response):
    # Set CSP on root endpoint too
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; "
        "font-src 'self' https: data:; "
        "style-src 'self' https: data: 'unsafe-inline'; "
        "connect-src 'self' https: data:; "
        "img-src 'self' https: data: blob:;"
    )
    
    return {
        "message": "EA AURA AI Platform",
        "environment": settings.environment,
        "version": "1.0.0",
        "status": "running",
        "fonts_enabled": True,
        "external_resources_enabled": True
    }

# Health check endpoint
@app.get("/health")
async def health_check(response: Response):
    # Set CSP on health endpoint too
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; "
        "font-src 'self' https: data:; "
        "style-src 'self' https: data: 'unsafe-inline'; "
        "connect-src 'self' https: data:; "
        "img-src 'self' https: data: blob:;"
    )
    
    return {
        "status": "healthy",
        "environment": settings.environment,
        "timestamp": "2024-01-01T00:00:00Z",
        "google_fonts_enabled": True,
        "external_resources_enabled": True
    }