# 🗄️ PostgreSQL + Keycloak Setup Guide

This guide explains how PostgreSQL has been configured as the primary database for Keycloak across all environments.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Database Configuration](#database-configuration)
- [Environment Setup](#environment-setup)
- [Access URLs](#access-urls)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

### **PostgreSQL + Keycloak Integration**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   Nginx         │    │   Keycloak      │
│   (Browser)     │───▶│   (Port 80)     │───▶│   (Port 8080)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              │                        ▼
                              │              ┌─────────────────┐
                              │              │   PostgreSQL    │
                              │              │   (Port 5432)   │
                              │              └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Backend       │
                       │   (Port 8081)   │
                       └─────────────────┘
```

## ⚙️ Database Configuration

### **PostgreSQL Settings**
- **Database**: `keycloak`
- **Username**: `keycloak`
- **Password**: 
  - Development: `keycloak123`
  - Testing: `keycloak123`
  - Production: `your-production-postgres-password`

### **Keycloak Database Configuration**
```yaml
environment:
  - KC_DB=postgres
  - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
  - KC_DB_USERNAME=keycloak
  - KC_DB_PASSWORD=keycloak123
```

## 🌍 Environment Setup

### **Development Environment**
```yaml
postgres:
  image: postgres:15
  environment:
    POSTGRES_DB: keycloak
    POSTGRES_USER: keycloak
    POSTGRES_PASSWORD: keycloak123
  volumes:
    - postgres_data_dev:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U keycloak"]

keycloak:
  image: quay.io/keycloak/keycloak:latest
  environment:
    - KC_DB=postgres
    - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
    - KC_DB_USERNAME=keycloak
    - KC_DB_PASSWORD=keycloak123
  command: start-dev
  depends_on:
    postgres:
      condition: service_healthy
```

### **Testing Environment**
```yaml
postgres:
  image: postgres:15
  environment:
    POSTGRES_DB: keycloak
    POSTGRES_USER: keycloak
    POSTGRES_PASSWORD: keycloak123
  volumes:
    - postgres_data_test:/var/lib/postgresql/data

keycloak:
  image: quay.io/keycloak/keycloak:latest
  environment:
    - KC_DB=postgres
    - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
    - KC_DB_USERNAME=keycloak
    - KC_DB_PASSWORD=keycloak123
  command: start-dev
```

### **Production Environment**
```yaml
postgres:
  image: postgres:15
  environment:
    POSTGRES_DB: keycloak
    POSTGRES_USER: keycloak
    POSTGRES_PASSWORD: your-production-postgres-password
  volumes:
    - postgres_data_prod:/var/lib/postgresql/data

keycloak:
  image: quay.io/keycloak/keycloak:latest
  environment:
    - KC_DB=postgres
    - KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
    - KC_DB_USERNAME=keycloak
    - KC_DB_PASSWORD=your-production-postgres-password
  command: start
```

## 🌐 Access URLs

### **Development Environment**
```bash
# Keycloak Admin Console
http://localhost:8081/auth/

# PostgreSQL (internal only)
postgresql://keycloak:keycloak123@postgres:5432/keycloak
```

### **Testing Environment**
```bash
# Keycloak Admin Console
http://localhost:8082/auth/

# PostgreSQL (internal only)
postgresql://keycloak:keycloak123@postgres:5432/keycloak
```

### **Production Environment**
```bash
# Keycloak Admin Console
https://your-domain.com/auth/

# PostgreSQL (internal only)
postgresql://keycloak:your-production-postgres-password@postgres:5432/keycloak
```

## 🗄️ Database Management

### **Connect to PostgreSQL**
```bash
# Development
docker exec -it postgres-dev psql -U keycloak -d keycloak

# Testing
docker exec -it postgres-test psql -U keycloak -d keycloak

# Production
docker exec -it postgres-prod psql -U keycloak -d keycloak
```

### **Backup Database**
```bash
# Development
docker exec postgres-dev pg_dump -U keycloak keycloak > backup_dev.sql

# Testing
docker exec postgres-test pg_dump -U keycloak keycloak > backup_test.sql

# Production
docker exec postgres-prod pg_dump -U keycloak keycloak > backup_prod.sql
```

### **Restore Database**
```bash
# Development
docker exec -i postgres-dev psql -U keycloak -d keycloak < backup_dev.sql

# Testing
docker exec -i postgres-test psql -U keycloak -d keycloak < backup_test.sql

# Production
docker exec -i postgres-prod psql -U keycloak -d keycloak < backup_prod.sql
```

### **View Keycloak Tables**
```sql
-- Connect to PostgreSQL and run:
\dt

-- Keycloak creates tables like:
-- user_entity
-- realm
-- client
-- role_entity
-- group_entity
-- etc.
```

## 🔧 Keycloak Initial Setup

### **First Time Access**
1. **Access Keycloak**: `http://localhost:8081/auth/`
2. **Login**: 
   - Username: `admin`
   - Password: `admin`
3. **Create Realm**: Create your application realm
4. **Create Client**: Set up your application client
5. **Create Users**: Add users to your realm

### **Keycloak Configuration**
```bash
# Keycloak environment variables
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=keycloak123
KC_HOSTNAME_STRICT=false
KC_HOSTNAME_STRICT_HTTPS=false
```

## 🚨 Troubleshooting

### **Common Issues**

#### 1. PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs postgres-dev

# Test connection
docker exec postgres-dev pg_isready -U keycloak
```

#### 2. Keycloak Database Migration
```bash
# If Keycloak fails to start, it might need to migrate from H2
# Check Keycloak logs
docker logs keycloak-dev

# Keycloak will automatically create tables on first run
```

#### 3. Database Performance
```bash
# Check PostgreSQL performance
docker exec postgres-dev psql -U keycloak -d keycloak -c "SELECT * FROM pg_stat_activity;"

# Check table sizes
docker exec postgres-dev psql -U keycloak -d keycloak -c "SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE schemaname = 'public';"
```

### **Health Checks**
```bash
# PostgreSQL health
docker exec postgres-dev pg_isready -U keycloak

# Keycloak health
curl http://localhost:8081/auth/health

# Database connection test
docker exec postgres-dev psql -U keycloak -d keycloak -c "SELECT 1;"
```

### **Log Locations**
- **PostgreSQL logs**: `docker logs postgres-dev`
- **Keycloak logs**: `docker logs keycloak-dev`
- **Nginx logs**: `docker logs nginx-dev`

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Keycloak Database Setup](https://www.keycloak.org/server/containers#_database)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review PostgreSQL logs: `docker logs postgres-dev`
3. Review Keycloak logs: `docker logs keycloak-dev`
4. Test database connectivity: `docker exec postgres-dev pg_isready -U keycloak`
5. Contact the development team 