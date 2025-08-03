# EA Aura AI Platform - Staging Environment Setup (Azure)

This guide will help you set up and deploy the EA Aura AI Platform staging environment on Azure.

## 🌐 Staging URLs
- **Main Application**: https://staging.ea-aura.ai
- **Keycloak Admin**: https://staging.ea-aura.ai/auth
- **Kibana**: http://localhost:5601 (local access)
- **DBeaver**: http://localhost:8978 (local access)
- **MinIO Console**: http://localhost:9001 (local access)
- **Vault**: http://localhost:8200 (local access)

## 📋 Prerequisites

### Required Software
- Docker Desktop or Docker Engine
- Docker Compose
- Git
- SSL certificates for staging.ea-aura.ai

### Azure Requirements
- Azure subscription
- Azure Container Registry (ACR)
- Azure Key Vault
- Azure Storage Account
- Azure App Service or Azure Container Instances

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd ea-aura-ai-platform
```

### 2. SSL Certificates
Place your SSL certificates in the `ssl/` directory:
```bash
mkdir -p ssl
# Copy your certificates:
# - ssl/staging.ea-aura.ai.crt
# - ssl/staging.ea-aura.ai.key
```

For testing, you can generate self-signed certificates:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/staging.ea-aura.ai.key \
  -out ssl/staging.ea-aura.ai.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=staging.ea-aura.ai"
```

### 3. Environment Configuration

#### Backend Configuration
Edit `backend/env.staging` and update the following values:
```bash
# Azure-specific configurations
AZURE_STORAGE_CONNECTION_STRING=your-azure-storage-connection-string
AZURE_KEY_VAULT_URL=https://your-key-vault.vault.azure.net/
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id

# AI/LLM Configuration
OPENAI_API_KEY=your-openai-api-key-here
GROQ_API_KEY=your-groq-api-key-here
```

#### Frontend Configuration
The frontend staging configuration is already set to use `https://staging.ea-aura.ai` in `frontend/src/config/environments/staging.ts`.

### 4. Start Staging Environment

#### On Linux/macOS:
```bash
chmod +x scripts/start-staging.sh
./scripts/start-staging.sh
```

#### On Windows:
```powershell
.\scripts\start-staging.ps1
```

#### Manual Start:
```bash
docker-compose -f docker-compose.staging.yml up --build -d
```

## 🔧 Azure Deployment

### 1. Azure Container Registry Setup
```bash
# Create ACR
az acr create --resource-group your-rg --name your-acr --sku Basic

# Login to ACR
az acr login --name your-acr

# Build and push images
docker-compose -f docker-compose.staging.yml build
docker tag ea-aura-ai-platform_backend your-acr.azurecr.io/ea-aura-backend:staging
docker push your-acr.azurecr.io/ea-aura-backend:staging
```

### 2. Azure Key Vault Configuration
```bash
# Create Key Vault
az keyvault create --name your-key-vault --resource-group your-rg --location eastus

# Store secrets
az keyvault secret set --vault-name your-key-vault --name "postgres-password" --value "staging-postgres-password"
az keyvault secret set --vault-name your-key-vault --name "elasticsearch-password" --value "staging-elasticsearch-password"
az keyvault secret set --vault-name your-key-vault --name "keycloak-password" --value "staging-keycloak-password"
az keyvault secret set --vault-name your-key-vault --name "vault-token" --value "staging-vault-token"
```

### 3. Azure App Service Deployment
```bash
# Create App Service Plan
az appservice plan create --name ea-aura-staging-plan --resource-group your-rg --sku B1 --is-linux

# Create Web App
az webapp create --resource-group your-rg --plan ea-aura-staging-plan --name ea-aura-staging --deployment-container-image-name your-acr.azurecr.io/ea-aura-backend:staging

# Configure environment variables
az webapp config appsettings set --resource-group your-rg --name ea-aura-staging --settings \
  ENVIRONMENT=staging \
  AZURE_KEY_VAULT_URL=https://your-key-vault.vault.azure.net/ \
  AZURE_CLIENT_ID=your-azure-client-id \
  AZURE_CLIENT_SECRET=your-azure-client-secret \
  AZURE_TENANT_ID=your-azure-tenant-id
```

## 🔐 Security Configuration

### Default Credentials
- **Keycloak Admin**: admin/staging-keycloak-password
- **PostgreSQL**: keycloak/staging-postgres-password
- **Elasticsearch**: No authentication (disabled for staging)
- **Vault**: staging-vault-token
- **MinIO**: staging-minio-user/staging-minio-password
- **Basic Auth**: admin/password

### Security Headers
The staging environment includes the following security headers:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Referrer-Policy: strict-origin-when-cross-origin

## 📊 Monitoring and Logging

### Log Aggregation
- **Filebeat**: Collects logs from backend services
- **Elasticsearch**: Stores and indexes logs
- **Kibana**: Visualizes logs and metrics

### Health Checks
- Backend: `https://staging.ea-aura.ai/health`
- Elasticsearch: `http://localhost:9200/_cluster/health`
- Keycloak: `https://staging.ea-aura.ai/auth/health`

## 🔄 Environment Differences

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| Debug Mode | ✅ Enabled | ❌ Disabled | ❌ Disabled |
| Log Level | DEBUG | INFO | WARNING |
| SSL | ❌ HTTP only | ✅ HTTPS required | ✅ HTTPS required |
| Rate Limiting | 10r/s | 20r/s | 50r/s |
| Resource Limits | Minimal | Medium | High |
| Authentication | Basic | Enhanced | Full |

## 🛠️ Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/staging.ea-aura.ai.crt -text -noout
   ```

2. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :80
   netstat -tulpn | grep :443
   ```

3. **Container Health Issues**
   ```bash
   # Check container logs
   docker-compose -f docker-compose.staging.yml logs backend
   docker-compose -f docker-compose.staging.yml logs nginx
   ```

4. **Database Connection Issues**
   ```bash
   # Test PostgreSQL connection
   docker exec -it postgres-staging psql -U keycloak -d keycloak
   ```

### Useful Commands

```bash
# View all logs
docker-compose -f docker-compose.staging.yml logs -f

# View specific service logs
docker-compose -f docker-compose.staging.yml logs -f backend

# Restart specific service
docker-compose -f docker-compose.staging.yml restart backend

# Access container shell
docker exec -it backend-staging /bin/bash

# Check service health
docker-compose -f docker-compose.staging.yml ps

# Stop all services
docker-compose -f docker-compose.staging.yml down

# Remove volumes (WARNING: This will delete all data)
docker-compose -f docker-compose.staging.yml down -v
```

## 📝 Environment Variables Reference

### Backend Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name | staging |
| `APP_NAME` | Application name | EA-AURA Backend (Staging) |
| `DEBUG` | Debug mode | false |
| `HOST` | Server host | 0.0.0.0 |
| `PORT` | Server port | 8081 |
| `ELASTICSEARCH_URL` | Elasticsearch URL | http://elasticsearch:9200 |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka servers | kafka:9092 |
| `VAULT_ADDR` | Vault address | http://vault:8200 |
| `CORS_ORIGINS` | Allowed CORS origins | ["https://staging.ea-aura.ai"] |

### Azure-Specific Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage connection | DefaultEndpointsProtocol=https;... |
| `AZURE_KEY_VAULT_URL` | Key Vault URL | https://your-key-vault.vault.azure.net/ |
| `AZURE_CLIENT_ID` | Service Principal ID | 12345678-1234-1234-1234-123456789012 |
| `AZURE_CLIENT_SECRET` | Service Principal Secret | your-secret-value |
| `AZURE_TENANT_ID` | Azure Tenant ID | 12345678-1234-1234-1234-123456789012 |

## 🚀 Next Steps

1. **Configure Azure DNS**: Point staging.ea-aura.ai to your Azure App Service
2. **Set up CI/CD**: Configure GitHub Actions or Azure DevOps for automated deployments
3. **Monitor Performance**: Set up Azure Application Insights for monitoring
4. **Security Hardening**: Implement additional security measures as needed
5. **Backup Strategy**: Configure automated backups for databases and storage

## 📞 Support

For issues or questions regarding the staging environment setup:
- Check the troubleshooting section above
- Review the logs using the provided commands
- Contact the development team for assistance

---

**Note**: This staging environment is designed to closely mirror the production environment while maintaining a balance between security and ease of development. Always test thoroughly in staging before deploying to production. 