#!/bin/bash

# Docker Development Environment Management Script

ENVIRONMENT=${1:-dev}

case $ENVIRONMENT in
    "dev"|"development")
        echo "🚀 Starting Development Environment with Docker..."
        docker compose -f docker-compose.dev.yml up --build -d
        echo "✅ Development environment started!"
        echo "📊 Services:"
        echo "   - Backend: http://localhost:8000"
        echo "   - Elasticsearch: http://localhost:9200"
        echo "   - Kibana: http://localhost:5601"
        echo "   - Keycloak: http://localhost:8080"
        echo "   - Vault: http://localhost:8200"
        echo "   - MinIO: http://localhost:9001"
        ;;
    "test"|"testing")
        echo "🧪 Starting Testing Environment with Docker..."
        docker compose -f docker-compose.test.yml up --build -d
        echo "✅ Testing environment started!"
        echo "📊 Services:"
        echo "   - Backend: http://localhost:8001"
        echo "   - Elasticsearch: http://localhost:9201"
        echo "   - Vault: http://localhost:8201"
        ;;
    "prod"|"production")
        echo "🏭 Starting Production Environment with Docker..."
        docker compose -f docker-compose.prod.yml up --build -d
        echo "✅ Production environment started!"
        echo "📊 Services:"
        echo "   - Backend: http://localhost:8000"
        echo "   - Elasticsearch: http://localhost:9200"
        echo "   - Kibana: http://localhost:5601"
        echo "   - Vault: http://localhost:8200"
        echo "   - MinIO: http://localhost:9001"
        ;;
    *)
        echo "❌ Invalid environment. Use: dev, test, or prod"
        echo "Usage: $0 [dev|test|prod]"
        exit 1
        ;;
esac 
