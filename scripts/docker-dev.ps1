# Docker Development Environment Management Script (PowerShell)

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "development", "test", "testing", "prod", "production")]
    [string]$Environment = "dev"
)

# Change to parent directory where docker-compose files are located
Set-Location -Path ".."

switch ($Environment) {
    { $_ -in @("dev", "development") } {
        Write-Host "🚀 Starting Development Environment with Docker..." -ForegroundColor Green
        docker-compose -f docker-compose.dev.yml up --build -d
        Write-Host "✅ Development environment started!" -ForegroundColor Green
        Write-Host "📊 Services:" -ForegroundColor Cyan
        Write-Host "   - Main App: http://localhost:8081/" -ForegroundColor White
        Write-Host "   - API Health: http://localhost:8081/health" -ForegroundColor White
        Write-Host "   - Elasticsearch: http://localhost:8081/elasticsearch/" -ForegroundColor White
        Write-Host "   - Vault: http://localhost:8081/vault/" -ForegroundColor White
        Write-Host "   - Keycloak: http://localhost:8081/auth/" -ForegroundColor White
        Write-Host "   - DBeaver: http://localhost:8081/dbeaver/" -ForegroundColor White
    }
    { $_ -in @("test", "testing") } {
        Write-Host "🧪 Starting Testing Environment with Docker..." -ForegroundColor Yellow
        docker-compose -f docker-compose.test.yml up --build -d
        Write-Host "✅ Testing environment started!" -ForegroundColor Green
        Write-Host "📊 Services:" -ForegroundColor Cyan
        Write-Host "   - Main App: http://localhost:8082/" -ForegroundColor White
        Write-Host "   - API Health: http://localhost:8082/health" -ForegroundColor White
        Write-Host "   - Elasticsearch: http://localhost:8082/elasticsearch/" -ForegroundColor White
        Write-Host "   - Vault: http://localhost:8082/vault/" -ForegroundColor White
        Write-Host "   - DBeaver: http://localhost:8082/dbeaver/" -ForegroundColor White
    }
    { $_ -in @("prod", "production") } {
        Write-Host "🏭 Starting Production Environment with Docker..." -ForegroundColor Red
        docker-compose -f docker-compose.prod.yml up --build -d
        Write-Host "✅ Production environment started!" -ForegroundColor Green
        Write-Host "📊 Services:" -ForegroundColor Cyan
        Write-Host "   - Main App: https://your-domain.com/" -ForegroundColor White
        Write-Host "   - API Health: https://your-domain.com/health" -ForegroundColor White
        Write-Host "   - Elasticsearch: https://your-domain.com/elasticsearch/" -ForegroundColor White
        Write-Host "   - Kibana: https://your-domain.com/kibana/" -ForegroundColor White
        Write-Host "   - Vault: https://your-domain.com/vault/" -ForegroundColor White
        Write-Host "   - Keycloak: https://your-domain.com/auth/" -ForegroundColor White
        Write-Host "   - DBeaver: https://your-domain.com/dbeaver/" -ForegroundColor White
        Write-Host "   - MinIO Console: https://your-domain.com/minio-console/" -ForegroundColor White
    }
    default {
        Write-Host "❌ Invalid environment. Use: dev, test, or prod" -ForegroundColor Red
        Write-Host "Usage: .\docker-dev.ps1 [dev|test|prod]" -ForegroundColor Yellow
        exit 1
    }
} 