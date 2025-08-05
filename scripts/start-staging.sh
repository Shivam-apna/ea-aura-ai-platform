#!/bin/bash

# EA Aura AI Platform - Staging Environment Startup Script

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting EA Aura AI Platform - Staging Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Change to project root directory
cd "$PROJECT_ROOT"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p kafka/staging-data
mkdir -p backend/app/logs
mkdir -p nginx/ssl

# Check and generate SSL certificates if needed
echo "🔐 Checking SSL certificates..."
if [ ! -f "nginx/ssl/staging.crt" ] || [ ! -f "nginx/ssl/staging.key" ]; then
    echo "📜 Generating SSL certificates for staging..."
    if [ -f "scripts/setup-staging-ssl.sh" ]; then
        chmod +x scripts/setup-staging-ssl.sh
        ./scripts/setup-staging-ssl.sh
    else
        echo "⚠️  SSL setup script not found. Please run: ./scripts/setup-staging-ssl.sh"
    fi
else
    echo "✅ SSL certificates found"
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f docker-compose.staging.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.staging.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
docker-compose -f docker-compose.staging.yml ps

echo "✅ Staging environment is starting up!"
echo "🌐 Access your application at: https://localhost (HTTPS)"
echo "🔑 Keycloak Admin: https://localhost/auth"
echo "📊 Kibana: http://localhost:5601"
echo "🗄️  DBeaver: https://localhost/dbeaver"
echo "📦 MinIO Console: http://localhost:9001"
echo "🔐 Vault: http://localhost:8200"

echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.staging.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.staging.yml down"
echo "   Restart services: docker-compose -f docker-compose.staging.yml restart" 