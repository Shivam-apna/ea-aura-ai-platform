# Stop and remove any running containers
Write-Output "Stopping and removing existing containers..."
docker compose down

# Build Docker images
Write-Output "Building Docker images..."
docker compose build

# Start Docker containers
Write-Output "Starting Docker containers..."
docker compose up
