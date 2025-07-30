#!/bin/bash

# Production Environment Startup Script
echo "🏭 Starting EA AURA Backend in Production Mode..."

# Set environment variables
export ENVIRONMENT=production
export DEBUG=false
export LOG_LEVEL=WARNING

# Copy production environment file
cp env.production .env

# Create logs directory if it doesn't exist
mkdir -p app/logs

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Validate environment variables
echo "🔍 Validating environment configuration..."
python -c "
from app.core.config import settings
print(f'Environment: {settings.environment}')
print(f'Debug: {settings.debug}')
print(f'Log Level: {settings.log_level}')
print('✅ Environment validation passed')
"

# Start the application with production settings
echo "🔧 Starting FastAPI server in production mode..."
uvicorn app.main:app --host 0.0.0.0 --port 8081 --workers 4 --log-level warning 