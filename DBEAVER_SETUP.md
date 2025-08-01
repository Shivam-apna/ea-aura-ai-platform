# 🦫 DBeaver Database Management Setup Guide

This guide explains how DBeaver (CloudBeaver) has been integrated into your environment for database management across all environments.

## 📋 Table of Contents

- [What is DBeaver?](#what-is-dbeaver)
- [Architecture Overview](#architecture-overview)
- [Environment Setup](#environment-setup)
- [Access URLs](#access-urls)
- [Database Connections](#database-connections)
- [Features & Capabilities](#features--capabilities)
- [Troubleshooting](#troubleshooting)

## 🦫 What is DBeaver?

**DBeaver** is a free, open-source universal database management tool that supports:
- **PostgreSQL** (your primary database)
- **MySQL**, **MariaDB**
- **SQLite**, **Oracle**
- **SQL Server**, **DB2**
- **MongoDB**, **Redis**
- And 80+ other databases

**CloudBeaver** is the web-based version of DBeaver, perfect for containerized environments.

## 🏗️ Architecture Overview

### **DBeaver + PostgreSQL Integration**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   Nginx         │    │   DBeaver       │
│   (Browser)     │───▶│   (Port 80)     │───▶│   (Port 8978)   │
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

## ⚙️ Environment Setup

### **Development Environment**
```yaml
dbeaver:
  image: dbeaver/cloudbeaver:latest
  container_name: dbeaver-dev
  ports:
    - "8978:8978"
  environment:
    - CB_DATABASE=./data/cloudbeaver.db
    - CB_CUSTOM_CONFIG=./conf/cloudbeaver.conf
  volumes:
    - dbeaver_data_dev:/opt/cloudbeaver/workspace
    - dbeaver_logs_dev:/opt/cloudbeaver/logs
  networks:
    - ea-aura-dev
  restart: unless-stopped
```

### **Testing Environment**
```yaml
dbeaver:
  image: dbeaver/cloudbeaver:latest
  container_name: dbeaver-test
  ports:
    - "8979:8978"
  environment:
    - CB_DATABASE=./data/cloudbeaver.db
    - CB_CUSTOM_CONFIG=./conf/cloudbeaver.conf
  volumes:
    - dbeaver_data_test:/opt/cloudbeaver/workspace
    - dbeaver_logs_test:/opt/cloudbeaver/logs
  networks:
    - ea-aura-test
  restart: unless-stopped
```

### **Production Environment**
```yaml
dbeaver:
  image: dbeaver/cloudbeaver:latest
  container_name: dbeaver-prod
  ports:
    - "8980:8978"
  environment:
    - CB_DATABASE=./data/cloudbeaver.db
    - CB_CUSTOM_CONFIG=./conf/cloudbeaver.conf
  volumes:
    - dbeaver_data_prod:/opt/cloudbeaver/workspace
    - dbeaver_logs_prod:/opt/cloudbeaver/logs
  networks:
    - ea-aura-prod
  restart: unless-stopped
```

## 🌐 Access URLs

### **Development Environment**
```bash
# DBeaver Web Interface
http://localhost:8081/dbeaver/

# Direct DBeaver Access (bypass Nginx)
http://localhost:8978/
```

### **Testing Environment**
```bash
# DBeaver Web Interface
http://localhost:8082/dbeaver/

# Direct DBeaver Access (bypass Nginx)
http://localhost:8979/
```

### **Production Environment**
```bash
# DBeaver Web Interface
https://your-domain.com/dbeaver/

# Direct DBeaver Access (bypass Nginx)
https://your-domain.com:8980/
```

## 🗄️ Database Connections

### **PostgreSQL Connection Settings**

#### **Development Environment**
```
Host: postgres-dev
Port: 5432
Database: keycloak
Username: keycloak
Password: keycloak123
```

#### **Testing Environment**
```
Host: postgres-test
Port: 5432
Database: keycloak
Username: keycloak
Password: keycloak123
```

#### **Production Environment**
```
Host: postgres-prod
Port: 5432
Database: keycloak
Username: keycloak
Password: your-production-postgres-password
```

### **How to Connect in DBeaver**

1. **Access DBeaver**: Navigate to the DBeaver URL for your environment
2. **Create Connection**: Click "New Connection" → "PostgreSQL"
3. **Enter Details**:
   - **Server Host**: `postgres-dev` (or `postgres-test`, `postgres-prod`)
   - **Port**: `5432`
   - **Database**: `keycloak`
   - **Username**: `keycloak`
   - **Password**: `keycloak123` (or production password)
4. **Test Connection**: Click "Test Connection"
5. **Save**: Click "Finish"

## 🚀 Features & Capabilities

### **Database Management**
- **Schema Browser**: Navigate tables, views, functions
- **SQL Editor**: Write and execute SQL queries
- **Data Viewer**: Browse and edit table data
- **Query Builder**: Visual query construction
- **ER Diagrams**: Visualize database relationships

### **Keycloak Database Features**
```sql
-- View all Keycloak tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Common Keycloak tables:
-- user_entity (users)
-- realm (realms)
-- client (clients)
-- role_entity (roles)
-- group_entity (groups)
-- user_session (sessions)
-- event_entity (audit logs)
```

### **Useful Queries for Keycloak**
```sql
-- Count users per realm
SELECT r.name as realm_name, COUNT(u.id) as user_count
FROM realm r
LEFT JOIN user_entity u ON r.id = u.realm_id
GROUP BY r.id, r.name;

-- View active sessions
SELECT u.username, s.user_id, s.last_session_refresh
FROM user_session s
JOIN user_entity u ON s.user_id = u.id
WHERE s.last_session_refresh > NOW() - INTERVAL '1 hour';

-- Check client configurations
SELECT client_id, name, enabled, public_client
FROM client
WHERE realm_id = 'your-realm-id';
```

### **Advanced Features**
- **Query History**: Track all executed queries
- **Export Data**: Export to CSV, JSON, XML
- **Import Data**: Import from various formats
- **Backup/Restore**: Database backup management
- **Performance Monitoring**: Query execution plans
- **Schema Comparison**: Compare database schemas

## 🔧 Initial Setup

### **First Time Access**
1. **Access DBeaver**: Navigate to your environment's DBeaver URL
2. **Create Admin Account**: Set up your admin credentials
3. **Add Database Connection**: Connect to PostgreSQL
4. **Explore Interface**: Familiarize yourself with the UI

### **Security Considerations**
- **Development**: Open access for debugging
- **Testing**: Limited access for testing
- **Production**: 
  - IP restrictions
  - SSL/TLS encryption
  - Strong authentication
  - Audit logging

## 🚨 Troubleshooting

### **Common Issues**

#### 1. Connection Refused
```bash
# Check if DBeaver is running
docker ps | grep dbeaver

# Check DBeaver logs
docker logs dbeaver-dev

# Test PostgreSQL connection
docker exec postgres-dev pg_isready -U keycloak
```

#### 2. Database Connection Issues
```bash
# Verify PostgreSQL is accessible
docker exec dbeaver-dev ping postgres-dev

# Check network connectivity
docker network ls
docker network inspect ea-aura-dev
```

#### 3. Performance Issues
```bash
# Check DBeaver resource usage
docker stats dbeaver-dev

# Monitor PostgreSQL performance
docker exec postgres-dev psql -U keycloak -d keycloak -c "SELECT * FROM pg_stat_activity;"
```

### **Health Checks**
```bash
# DBeaver health
curl http://localhost:8978/api/health

# PostgreSQL health
docker exec postgres-dev pg_isready -U keycloak

# Network connectivity
docker exec dbeaver-dev nc -zv postgres-dev 5432
```

### **Log Locations**
- **DBeaver logs**: `docker logs dbeaver-dev`
- **PostgreSQL logs**: `docker logs postgres-dev`
- **Nginx logs**: `docker logs nginx-dev`

### **Backup DBeaver Configuration**
```bash
# Backup DBeaver workspace
docker exec dbeaver-dev tar -czf /tmp/dbeaver-backup.tar.gz /opt/cloudbeaver/workspace

# Copy backup to host
docker cp dbeaver-dev:/tmp/dbeaver-backup.tar.gz ./dbeaver-backup.tar.gz
```

## 📚 Additional Resources

- [DBeaver Documentation](https://dbeaver.com/docs/)
- [CloudBeaver Documentation](https://cloudbeaver.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Keycloak Database Schema](https://www.keycloak.org/docs/latest/server_installation/#database-schema)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review DBeaver logs: `docker logs dbeaver-dev`
3. Test database connectivity: `docker exec postgres-dev pg_isready -U keycloak`
4. Check network connectivity: `docker network inspect ea-aura-dev`
5. Contact the development team

## 🎯 Quick Start Commands

```bash
# Start development environment with DBeaver
.\scripts\docker-dev.ps1 dev

# Access DBeaver
http://localhost:8081/dbeaver/

# Connect to PostgreSQL in DBeaver
Host: postgres-dev
Port: 5432
Database: keycloak
Username: keycloak
Password: keycloak123
``` 