#!/bin/bash

# Docker Environment Stop Script

ENVIRONMENT=${1:-all}

case $ENVIRONMENT in
    "dev"|"development")
        echo "🛑 Stopping Development Environment..."
        docker-compose -f docker-compose.dev.yml down
        echo "✅ Development environment stopped!"
        ;;
    "test"|"testing")
        echo "🛑 Stopping Testing Environment..."
        docker-compose -f docker-compose.test.yml down
        echo "✅ Testing environment stopped!"
        ;;
    "prod"|"production")
        echo "🛑 Stopping Production Environment..."
        docker-compose -f docker-compose.prod.yml down
        echo "✅ Production environment stopped!"
        ;;
    "all")
        echo "🛑 Stopping All Environments..."
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.test.yml down
        docker-compose -f docker-compose.prod.yml down
        echo "✅ All environments stopped!"
        ;;
    *)
        echo "❌ Invalid environment. Use: dev, test, prod, or all"
        echo "Usage: $0 [dev|test|prod|all]"
        exit 1
        ;;
esac 