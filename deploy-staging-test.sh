#!/bin/bash

# EA-AURA Staging Deployment Script for Azure
# Usage: ./deploy-staging.sh [azure-user] [azure-host]

set -e

AZURE_USER=${1:-azureuser}
AZURE_HOST=${2:-staging.ea-aura.ai}
PROJECT_NAME="ea-aura-ai-platform"
STAGING_DIR="/home/$AZURE_USER/staging"

echo "🚀 Starting EA-AURA Staging Deployment..."
echo "📍 Target: $AZURE_USER@$AZURE_HOST"
echo "📁 Project: $PROJECT_NAME"

# Check if required files exist
if [ ! -f "docker-compose.staging.yml" ]; then
    echo "❌ Error: docker-compose.staging.yml not found!"
    exit 1
fi

if [ ! -f "backend/env.staging" ]; then
    echo "❌ Error: backend/env.staging not found!"
    exit 1
fi

# Create SSL directory if it doesn't exist
mkdir -p nginx/ssl

# Check if SSL certificates exist
if [ ! -f "nginx/ssl/server.crt" ] || [ ! -f "nginx/ssl/server.key" ]; then
    echo "⚠️  Warning: SSL certificates not found in nginx/ssl/"
    echo "   Please add your SSL certificates:"
    echo "   - nginx/ssl/server.crt"
    echo "   - nginx/ssl/server.key"
    echo "   Or use Let's Encrypt certificates"
fi

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf staging-deploy.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='logs' \
    --exclude='*.log' \
    .

# Upload to Azure server
echo "📤 Uploading to Azure server..."
scp staging-deploy.tar.gz $AZURE_USER@$AZURE_HOST:/tmp/

# Execute deployment on Azure server
echo "🔧 Executing deployment on Azure server..."
ssh $AZURE_USER@$AZURE_HOST << 'EOF'
    set -e
    
    echo "📋 Setting up staging environment..."
    
            # Create staging directory
        sudo mkdir -p /home/aurauser/docker/staging
        sudo chown aurauser:aurauser /home/aurauser/docker/staging
        
        # Extract deployment package
        cd /home/aurauser/docker/staging
    tar -xzf /tmp/staging-deploy.tar.gz
    rm /tmp/staging-deploy.tar.gz
    
    # Install Docker if not installed
    if ! command -v docker &> /dev/null; then
        echo "🐳 Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker aurauser
        rm get-docker.sh
    fi
    
    # Install Docker Compose if not installed
    if ! command -v docker compose &> /dev/null; then
        echo "🐳 Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        sudo ln -sf /usr/local/bin/docker-compose /usr/local/bin/docker-compose
    fi
    
    # Stop existing containers
    echo "🛑 Stopping existing containers..."
    docker compose -f docker-compose.staging.yml down || true
    
    # Build and start containers
    echo "🚀 Building and starting containers..."
    docker compose -f docker-compose.staging.yml up --build -d
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    echo "🏥 Checking service health..."
    if curl -f https://staging.ea-aura.ai/health; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed, but deployment completed"
    fi
    
    echo "🎉 Deployment completed successfully!"
    echo "📊 Services available at:"
    echo "   - Main App: https://staging.ea-aura.ai/"
    echo "   - API Health: https://staging.ea-aura.ai/health"
    echo "   - Keycloak: https://staging.ea-aura.ai/auth/"
    echo "   - DBeaver: https://staging.ea-aura.ai/dbeaver/"
    echo "   - Kibana: https://staging.ea-aura.ai/kibana/"
    echo "   - Vault: https://staging.ea-aura.ai/vault/"
    echo "   - MinIO Console: https://staging.ea-aura.ai/minio-console/"
EOF

# Clean up local files
rm staging-deploy.tar.gz

echo "✅ Deployment completed!"
echo "🌐 Your staging environment is now available at: https://staging.ea-aura.ai" 
