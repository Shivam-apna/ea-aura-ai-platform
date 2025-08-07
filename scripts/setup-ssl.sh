#!/bin/bash

# Setup Let's Encrypt SSL certificates for staging environment only
# This replaces the self-signed certificate generation for staging

set -e

DOMAIN="staging.ea-aura.ai"
EMAIL="sksingh@aapnainfotech.com"  # Replace with your actual email
STAGING=0  # Set to 1 for testing with Let's Encrypt staging environment

echo "Setting up Let's Encrypt SSL certificates for staging environment..."

# Validate email
if [ "$EMAIL" = "your-email@example.com" ]; then
    echo "Error: Please edit this script and replace 'your-email@example.com' with your actual email address"
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Create directories for Let's Encrypt
echo "Creating certbot directories..."
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Set proper permissions
chmod 755 ./certbot/conf
chmod 755 ./certbot/www

echo "Downloading Let's Encrypt recommended configurations..."

# Download recommended TLS parameters
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "./certbot/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "./certbot/conf/ssl-dhparams.pem"

# Create temporary nginx config for certificate generation
echo "Creating temporary nginx configuration for certificate verification..."
cat > ./nginx/nginx.temp.conf << 'EOF'
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;

  server {
    listen 80;
    server_name staging.ea-aura.ai;

    location /.well-known/acme-challenge/ {
      root /var/www/certbot;
    }

    location / {
      return 200 'Let\'s Encrypt certificate verification in progress...';
      add_header Content-Type text/plain;
    }
  }
}
EOF

# Stop any existing staging containers
echo "Stopping any existing staging containers..."
docker-compose -f docker-compose.staging.yml down 2>/dev/null || true

# Start nginx with temporary config for certificate generation
echo "Starting temporary nginx for certificate verification..."
docker run --rm -d \
  --name nginx-temp-staging \
  -p 80:80 \
  -v $(pwd)/nginx/nginx.temp.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/certbot/www:/var/www/certbot:ro \
  nginx:latest

# Wait for nginx to start
sleep 5

# Request certificate from Let's Encrypt
echo "Requesting SSL certificate from Let's Encrypt for $DOMAIN..."
if [ $STAGING -eq 1 ]; then
    echo "Using Let's Encrypt staging environment (for testing)..."
    STAGING_FLAG="--staging"
else
    STAGING_FLAG=""
fi

docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  $STAGING_FLAG \
  -d $DOMAIN

# Stop temporary nginx
echo "Stopping temporary nginx..."
docker stop nginx-temp-staging

# Clean up temporary config
rm -f ./nginx/nginx.temp.conf

# Verify certificate was created
if [ -d "./certbot/conf/live/$DOMAIN" ]; then
    echo "✅ Let's Encrypt SSL certificate successfully obtained!"
    echo ""
    echo "Certificate details:"
    echo "  Domain: $DOMAIN"
    echo "  Certificate: ./certbot/conf/live/$DOMAIN/fullchain.pem"
    echo "  Private Key: ./certbot/conf/live/$DOMAIN/privkey.pem"
    echo "  Expires: $(date -d '+90 days' '+%Y-%m-%d')"
    echo ""
    echo "✅ SSL certificates setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update your nginx/nginx.staging.conf to use Let's Encrypt certificates"
    echo "2. Update your docker-compose.staging.yml to mount certbot volumes"
    echo "3. Start your staging services: docker-compose -f docker-compose.staging.yml up -d"
    echo ""
    echo "The certificates will be automatically renewed by the certbot container."
else
    echo "❌ Failed to obtain Let's Encrypt SSL certificate"
    echo "Common issues:"
    echo "  - Make sure $DOMAIN points to this server's public IP"
    echo "  - Check that ports 80 and 443 are open in your firewall"
    echo "  - Verify your domain is accessible from the internet"
    exit 1
fi