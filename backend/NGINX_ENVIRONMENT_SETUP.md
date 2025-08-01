# 🌐 Nginx Environment Setup Guide

This guide explains how to set up and manage different environments using **Nginx as a reverse proxy** for the EA AURA AI Platform Backend.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Nginx Configuration](#nginx-configuration)
- [Environment Access](#environment-access)
- [Quick Start](#quick-start)
- [Service Routing](#service-routing)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

### **Nginx as Reverse Proxy**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   Nginx         │    │   Backend       │
│   (Browser)     │───▶│   (Port 80/443) │───▶│   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ├───▶ Elasticsearch (Port 9200)
                              ├───▶ Kibana (Port 5601)
                              ├───▶ Keycloak (Port 8080)
                              ├───▶ Vault (Port 8200)
                              └───▶ MinIO (Port 9000/9001)
```

### **Environment-Specific Configurations**

| Environment | Nginx Config | Port | Features |
|-------------|--------------|------|----------|
| **Development** | `nginx.dev.conf` | 80 | Full access, debug logging |
| **Testing** | `nginx.test.conf` | 8081 | Limited access, test data |
| **Production** | `nginx.prod.conf` | 80/443 | SSL, security, performance |

## ⚙️ Nginx Configuration

### **Development Configuration** (`nginx.dev.conf`)
- **Purpose**: Full development access with debugging
- **Features**:
  - All services accessible via Nginx
  - Debug logging enabled
  - Rate limiting: 10 req/s
  - CORS for localhost
  - Hot reload support

### **Testing Configuration** (`nginx.test.conf`)
- **Purpose**: Isolated testing environment
- **Features**:
  - Minimal service access
  - Test-specific routing
  - Rate limiting: 5 req/s
  - Isolated data volumes

### **Production Configuration** (`nginx.prod.conf`)
- **Purpose**: Secure production deployment
- **Features**:
  - SSL/TLS encryption
  - Security headers
  - Rate limiting: 20 req/s
  - Gzip compression
  - Performance optimization

## 🌐 Environment Access

### **Development Environment**
```bash
# Main application
http://localhost/

# API endpoints
http://localhost/api/v1/health
http://localhost/api/v1/agent_job

# Services (development access)
http://localhost/elasticsearch/    # Elasticsearch
http://localhost/kibana/           # Kibana
http://localhost/auth/             # Keycloak
http://localhost/vault/            # Vault
http://localhost/minio/            # MinIO API
http://localhost/minio-console/    # MinIO Console
```

### **Testing Environment**
```bash
# Main application
http://localhost:8081/

# API endpoints
http://localhost:8081/api/v1/health
http://localhost:8081/api/v1/agent_job

# Services (testing access)
http://localhost:8081/elasticsearch/  # Elasticsearch
http://localhost:8081/vault/          # Vault
```

### **Production Environment**
```bash
# Main application (HTTPS)
https://your-domain.com/

# API endpoints
https://your-domain.com/api/v1/health
https://your-domain.com/api/v1/agent_job

# Services (restricted access)
https://your-domain.com/elasticsearch/  # Elasticsearch
https://your-domain.com/kibana/         # Kibana
https://your-domain.com/vault/          # Vault
https://your-domain.com/minio/          # MinIO API
https://your-domain.com/minio-console/  # MinIO Console
```

## 🚀 Quick Start

### **Using Docker (Recommended)**

```powershell
# Start development environment
.\scripts\docker-dev.ps1 dev

# Start testing environment
.\scripts\docker-dev.ps1 test

# Start production environment
.\scripts\docker-dev.ps1 prod

# Stop environments
.\scripts\docker-stop.ps1 dev
.\scripts\docker-stop.ps1 test
.\scripts\docker-stop.ps1 prod
```

### **Access URLs After Startup**

#### Development Environment
- **Main App**: http://localhost/
- **API Health**: http://localhost/health
- **API Docs**: http://localhost/docs
- **Elasticsearch**: http://localhost/elasticsearch/
- **Kibana**: http://localhost/kibana/
- **Keycloak**: http://localhost/auth/
- **Vault**: http://localhost/vault/
- **MinIO Console**: http://localhost/minio-console/

#### Testing Environment
- **Main App**: http://localhost:8081/
- **API Health**: http://localhost:8081/health
- **API Docs**: http://localhost:8081/docs
- **Elasticsearch**: http://localhost:8081/elasticsearch/
- **Vault**: http://localhost:8081/vault/

#### Production Environment
- **Main App**: https://your-domain.com/
- **API Health**: https://your-domain.com/health
- **API Docs**: https://your-domain.com/docs
- **Services**: Restricted access with authentication

## 🔄 Service Routing

### **API Routes**
```nginx
# All API requests go to backend
location /api/ {
    proxy_pass http://backend_app;
    # Rate limiting and security headers
}
```

### **Service Routes**
```nginx
# Elasticsearch
location /elasticsearch/ {
    proxy_pass http://elasticsearch/;
}

# Kibana
location /kibana/ {
    proxy_pass http://kibana/;
}

# Keycloak
location /auth/ {
    proxy_pass http://keycloak/;
}

# Vault
location /vault/ {
    proxy_pass http://vault/;
}

# MinIO
location /minio/ {
    proxy_pass http://minio/;
}
```

### **Health Checks**
```nginx
# Application health
location /health {
    proxy_pass http://backend_app/health;
}
```

## 🔒 Security Features

### **Development Security**
- Basic rate limiting
- CORS for localhost
- Debug logging
- No SSL (HTTP only)

### **Testing Security**
- Reduced rate limiting
- Isolated network
- Test-specific access
- No SSL (HTTP only)

### **Production Security**
- **SSL/TLS Encryption**
- **Security Headers**:
  - X-Frame-Options
  - X-Content-Type-Options
  - X-XSS-Protection
  - Strict-Transport-Security
  - Content-Security-Policy
- **Rate Limiting**: 20 req/s
- **IP Restrictions** (configurable)
- **Basic Auth** (configurable)

## 🔧 Configuration Details

### **Development Nginx Features**
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# CORS headers
add_header Access-Control-Allow-Origin "*";
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
add_header Access-Control-Allow-Headers "Content-Type, Authorization";
```

### **Production Nginx Features**
```nginx
# SSL Configuration
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
ssl_protocols TLSv1.2 TLSv1.3;

# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Gzip Compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
```

## 🚨 Troubleshooting

### **Common Issues**

#### 1. Nginx Not Starting
```bash
# Check Nginx logs
docker-compose -f docker-compose.dev.yml logs nginx

# Check configuration syntax
docker exec nginx-dev nginx -t

# Restart Nginx
docker-compose -f docker-compose.dev.yml restart nginx
```

#### 2. Services Not Accessible
```bash
# Check if services are running
docker-compose -f docker-compose.dev.yml ps

# Check service logs
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs elasticsearch

# Test service connectivity
docker exec nginx-dev curl -f http://backend:8000/health
```

#### 3. SSL Issues (Production)
```bash
# Check SSL certificate
docker exec nginx-prod ls -la /etc/nginx/ssl/

# Test SSL configuration
docker exec nginx-prod nginx -t

# Check SSL certificate validity
openssl x509 -in ssl/cert.pem -text -noout
```

#### 4. Rate Limiting Issues
```bash
# Check rate limiting logs
docker exec nginx-dev tail -f /var/log/nginx/error.log

# Test rate limiting
for i in {1..25}; do curl http://localhost/api/v1/health; done
```

### **Health Checks**

#### Application Health
```bash
# Development
curl http://localhost/health

# Testing
curl http://localhost:8081/health

# Production
curl -k https://your-domain.com/health
```

#### Service Health
```bash
# Elasticsearch
curl http://localhost/elasticsearch/_cluster/health

# Backend API
curl http://localhost/api/v1/health

# All services status
docker-compose -f docker-compose.dev.yml ps
```

### **Log Locations**
- **Nginx Access Logs**: `/var/log/nginx/access.log`
- **Nginx Error Logs**: `/var/log/nginx/error.log`
- **Application Logs**: `backend/app/logs/app.log`
- **Docker Logs**: `docker-compose logs <service-name>`

### **Performance Monitoring**
```bash
# Check Nginx performance
docker exec nginx-dev nginx -V

# Monitor connections
docker exec nginx-dev netstat -an | grep :80

# Check memory usage
docker stats nginx-dev
```

## 📚 Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Reverse Proxy Best Practices](https://www.nginx.com/resources/library/nginx-reverse-proxy/)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Nginx logs: `docker-compose logs nginx`
3. Check service logs: `docker-compose logs <service>`
4. Verify configuration: `docker exec nginx-dev nginx -t`
5. Test connectivity: `curl http://localhost/health`
6. Contact the development team 