# Docker Environment Stop Script (PowerShell)

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "development", "test", "testing", "prod", "production", "all")]
    [string]$Environment = "all"
)

# Change to parent directory where docker-compose files are located
Set-Location -Path ".."

switch ($Environment) {
    { $_ -in @("dev", "development") } {
        Write-Host "🛑 Stopping Development Environment..." -ForegroundColor Yellow
        docker-compose -f docker-compose.dev.yml down
        Write-Host "✅ Development environment stopped!" -ForegroundColor Green
    }
    { $_ -in @("test", "testing") } {
        Write-Host "🛑 Stopping Testing Environment..." -ForegroundColor Yellow
        docker-compose -f docker-compose.test.yml down
        Write-Host "✅ Testing environment stopped!" -ForegroundColor Green
    }
    { $_ -in @("prod", "production") } {
        Write-Host "🛑 Stopping Production Environment..." -ForegroundColor Yellow
        docker-compose -f docker-compose.prod.yml down
        Write-Host "✅ Production environment stopped!" -ForegroundColor Green
    }
    "all" {
        Write-Host "🛑 Stopping All Environments..." -ForegroundColor Red
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.test.yml down
        docker-compose -f docker-compose.prod.yml down
        Write-Host "✅ All environments stopped!" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid environment. Use: dev, test, prod, or all" -ForegroundColor Red
        Write-Host "Usage: .\docker-stop.ps1 [dev|test|prod|all]" -ForegroundColor Yellow
        exit 1
    }
} 