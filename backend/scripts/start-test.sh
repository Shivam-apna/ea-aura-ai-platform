#!/bin/bash

# Testing Environment Startup Script
echo "🧪 Starting EA AURA Backend in Testing Mode..."

# Set environment variables
export ENVIRONMENT=testing
export DEBUG=true
export LOG_LEVEL=INFO

# Copy testing environment file
cp env.testing .env

# Create logs directory if it doesn't exist
mkdir -p app/logs

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run tests first
echo "🧪 Running tests..."
python -m pytest test/ -v

# Start the application
echo "🔧 Starting FastAPI server for testing..."
uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload --log-level info 