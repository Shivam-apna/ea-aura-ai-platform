#!/bin/bash

# Development Environment Startup Script
echo "🚀 Starting EA AURA Backend in Development Mode..."

# Set environment variables
export ENVIRONMENT=development
export DEBUG=true
export LOG_LEVEL=DEBUG

# Copy development environment file
cp env.development .env

# Create logs directory if it doesn't exist
mkdir -p app/logs

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Start the application
echo "🔧 Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload --log-level debug 