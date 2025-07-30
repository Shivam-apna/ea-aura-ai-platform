# Environment Setup Guide

This document explains how to set up and use different environments (Development, Testing, Production) for the EA-AURA AI Platform.

## Environment Types

### 1. Development Environment
- **Purpose**: Local development and debugging
- **API Endpoint**: `http://localhost:8081`
- **Features**: Full debugging, detailed logging, source maps
- **Build Command**: `npm run build:dev`

### 2. Testing Environment
- **Purpose**: Staging and testing before production
- **API Endpoint**: `https://test-api.ea-aura.ai`
- **Features**: Performance monitoring, limited logging
- **Build Command**: `npm run build:test`

### 3. Production Environment
- **Purpose**: Live production deployment
- **API Endpoint**: `https://api.ea-aura.ai`
- **Features**: Optimized builds, error-only logging, analytics
- **Build Command**: `npm run build:prod`

## Setup Instructions

### 1. Environment Variables

Create the following environment files in your project root:

#### `.env.development`
```bash
VITE_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:8081
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=ea_aura
VITE_KEYCLOAK_CLIENT_ID=ea_aura
```

#### `.env.testing`
```bash
VITE_ENVIRONMENT=testing
VITE_API_BASE_URL=https://test-api.ea-aura.ai
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=warn
VITE_KEYCLOAK_URL=https://test-auth.ea-aura.ai
VITE_KEYCLOAK_REALM=ea_aura_test
VITE_KEYCLOAK_CLIENT_ID=ea_aura_test
```

#### `.env.production`
```bash
VITE_ENVIRONMENT=production
VITE_API_BASE_URL=https://api.ea-aura.ai
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
VITE_KEYCLOAK_URL=https://auth.ea-aura.ai
VITE_KEYCLOAK_REALM=ea_aura
VITE_KEYCLOAK_CLIENT_ID=ea_aura
```

### 2. Available Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build:dev             # Build for development
npm run preview:dev           # Preview development build

# Testing
npm run build:test            # Build for testing
npm run preview:test          # Preview testing build

# Production
npm run build:prod            # Build for production
npm run preview:prod          # Preview production build
```

### 3. Environment Configuration

The application uses a centralized configuration system located in `src/config/environment.ts`. This file automatically detects the current environment and applies the appropriate settings.

## Usage Examples

### Development
```bash
npm run dev
# Uses localhost endpoints, full debugging enabled
```

### Testing
```bash
npm run build:test
npm run preview:test
# Uses test endpoints, performance monitoring enabled
```

### Production
```bash
npm run build:prod
npm run preview:prod
# Uses production endpoints, optimized for performance
```

## Environment-Specific Features

### Development
- ✅ Full console logging
- ✅ Source maps enabled
- ✅ Debug mode enabled
- ✅ Local API endpoints
- ✅ Hot module replacement

### Testing
- ⚠️ Limited logging (warnings and errors only)
- ✅ Performance monitoring
- ✅ Test API endpoints
- ✅ Optimized for testing speed

### Production
- ❌ No debug logging
- ✅ Error-only logging
- ✅ Analytics enabled
- ✅ Production API endpoints
- ✅ Optimized bundle size
- ✅ Performance monitoring

## API Endpoints

The application automatically uses the correct API endpoints based on the environment:

- **Development**: `http://localhost:8081`
- **Testing**: `https://test-api.ea-aura.ai`
- **Production**: `https://api.ea-aura.ai`

## Logging

Different log levels are used per environment:

- **Development**: `debug` - All logs
- **Testing**: `warn` - Warnings and errors
- **Production**: `error` - Errors only

## Security Considerations

- Development and testing environments may have relaxed security settings
- Production environment enforces strict security policies
- API keys and sensitive data should be managed through environment variables
- Never commit `.env` files to version control

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify the correct environment is set
   - Check API endpoint configuration
   - Ensure backend services are running

2. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check environment variable syntax
   - Verify Vite configuration

3. **Environment Detection Issues**
   - Ensure VITE_ENVIRONMENT is set correctly
   - Check for conflicting environment variables
   - Verify build mode matches environment

### Debug Commands

```bash
# Check current environment
echo $VITE_ENVIRONMENT

# Verify API endpoint
curl $VITE_API_BASE_URL/health

# Check build configuration
npm run build:dev -- --debug
``` 