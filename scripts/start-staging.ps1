# EA Aura AI Platform - Staging Environment Startup Script (PowerShell)

Write-Host "🚀 Starting EA Aura AI Platform - Staging Environment..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ docker-compose is not installed. Please install it and try again." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "kafka/staging-data" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/app/logs" | Out-Null
New-Item -ItemType Directory -Force -Path "nginx/ssl" | Out-Null

# Check and generate SSL certificates if needed
Write-Host "🔐 Checking SSL certificates..." -ForegroundColor Yellow
if (-not (Test-Path "nginx/ssl/staging.crt") -or -not (Test-Path "nginx/ssl/staging.key")) {
    Write-Host "📜 Generating SSL certificates for staging..." -ForegroundColor Yellow
    if (Test-Path "scripts/setup-staging-ssl.sh") {
        Write-Host "⚠️  SSL certificates not found. Please run the SSL setup script manually:" -ForegroundColor Red
        Write-Host "   bash scripts/setup-staging-ssl.sh" -ForegroundColor White
    } else {
        Write-Host "⚠️  SSL setup script not found. Please run: bash scripts/setup-staging-ssl.sh" -ForegroundColor Red
    }
} else {
    Write-Host "✅ SSL certificates found" -ForegroundColor Green
}

# Stop any existing containers
Write-Host "🛑 Stopping any existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.staging.yml down

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.staging.yml up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
docker-compose -f docker-compose.staging.yml ps

Write-Host "✅ Staging environment is starting up!" -ForegroundColor Green
Write-Host "🌐 Access your application at: https://localhost (HTTPS)" -ForegroundColor Cyan
Write-Host "🔑 Keycloak Admin: https://localhost/auth" -ForegroundColor Cyan
Write-Host "📊 Kibana: http://localhost:5601" -ForegroundColor Cyan
Write-Host "🗄️  DBeaver: https://localhost/dbeaver" -ForegroundColor Cyan
Write-Host "📦 MinIO Console: http://localhost:9001" -ForegroundColor Cyan
Write-Host "🔐 Vault: http://localhost:8200" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Yellow
Write-Host "   View logs: docker-compose -f docker-compose.staging.yml logs -f" -ForegroundColor White
Write-Host "   Stop services: docker-compose -f docker-compose.staging.yml down" -ForegroundColor White
Write-Host "   Restart services: docker-compose -f docker-compose.staging.yml restart" -ForegroundColor White 