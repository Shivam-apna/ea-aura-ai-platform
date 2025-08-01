#!/bin/bash

# EA Aura AI Platform - Staging Environment Startup Script

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

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p kafka/staging-data
mkdir -p backend/app/logs

# Create .htpasswd file for basic authentication
if [ ! -f "nginx/.htpasswd" ]; then
    echo "🔐 Creating basic authentication file..."
    echo "admin:\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi" > nginx/.htpasswd
    echo "   Default credentials: admin/password"
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
echo "🌐 Access your application at: http://localhost"
echo "🔑 Keycloak Admin: http://localhost:8080"
echo "📊 Kibana: http://localhost:5601"
echo "🗄️  DBeaver: http://localhost:8978"
echo "📦 MinIO Console: http://localhost:9001"
echo "🔐 Vault: http://localhost:8200"

echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.staging.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.staging.yml down"
echo "   Restart services: docker-compose -f docker-compose.staging.yml restart" 