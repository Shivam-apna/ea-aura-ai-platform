#!/bin/bash

# Setup SSL certificates for staging environment
# This script generates self-signed certificates for staging.ea-aura.ai

echo "Setting up SSL certificates for staging environment..."

# Create SSL directory if it doesn't exist
mkdir -p nginx/ssl

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "Error: OpenSSL is not installed. Please install OpenSSL first."
    exit 1
fi

# Generate private key
echo "Generating private key..."
openssl genrsa -out nginx/ssl/staging.key 2048

# Generate certificate signing request
echo "Generating certificate signing request..."
openssl req -new -key nginx/ssl/staging.key -out nginx/ssl/staging.csr -subj "/C=US/ST=State/L=City/O=EA-AURA/OU=IT/CN=staging.ea-aura.ai"

# Generate self-signed certificate
echo "Generating self-signed certificate..."
openssl x509 -req -days 365 -in nginx/ssl/staging.csr -signkey nginx/ssl/staging.key -out nginx/ssl/staging.crt

# Set proper permissions
chmod 600 nginx/ssl/staging.key
chmod 644 nginx/ssl/staging.crt

# Clean up CSR file
rm nginx/ssl/staging.csr

echo "SSL certificates generated successfully!"
echo "Certificate: nginx/ssl/staging.crt"
echo "Private Key: nginx/ssl/staging.key"
echo ""
echo "Note: These are self-signed certificates for staging only."
echo "For production, use proper SSL certificates from a trusted CA."
echo ""
echo "You can now restart your staging environment with:"
echo "docker-compose -f docker-compose.staging.yml down"
echo "docker-compose -f docker-compose.staging.yml up -d" 