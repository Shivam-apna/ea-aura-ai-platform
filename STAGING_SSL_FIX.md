# Staging SSL Security Fix

## Issue Description
The staging server was showing as insecure because it was only serving HTTP traffic without SSL/HTTPS encryption.

## Root Cause
1. **Missing SSL Configuration**: The nginx staging configuration only listened on port 80 (HTTP)
2. **No SSL Certificates**: No SSL certificates were configured for the staging environment
3. **Frontend Mismatch**: The frontend was configured to expect HTTPS URLs but nginx was only serving HTTP

## Changes Made

### 1. Updated Nginx Configuration (`nginx/nginx.staging.conf`)
- ✅ Added HTTPS server block listening on port 443
- ✅ Added SSL certificate configuration
- ✅ Added HTTP to HTTPS redirect (port 80 → 443)
- ✅ Added security headers (HSTS, CSP, etc.)
- ✅ Added performance optimizations (gzip, sendfile, etc.)
- ✅ Updated all proxy headers to include `X-Forwarded-Host`

### 2. Created SSL Certificate Generation Script (`scripts/setup-staging-ssl.sh`)
- ✅ Automatic generation of self-signed certificates
- ✅ Proper file permissions (600 for key, 644 for cert)
- ✅ Certificate validity for 365 days
- ✅ Domain-specific certificate for `staging.ea-aura.ai`

### 3. Updated Docker Compose Configuration (`docker-compose.staging.yml`)
- ✅ Added SSL certificate volume mount
- ✅ Nginx now has access to SSL certificates

### 4. Updated Startup Scripts
- ✅ **Linux/macOS** (`scripts/start-staging.sh`): Automatic SSL certificate generation
- ✅ **Windows** (`scripts/start-staging.ps1`): SSL certificate checking and manual generation prompt
- ✅ Updated URLs to use HTTPS in startup messages

### 5. Updated Documentation (`STAGING_SETUP.md`)
- ✅ Added SSL setup instructions
- ✅ Updated troubleshooting section
- ✅ Added certificate generation options

## Security Improvements

### SSL/TLS Configuration
- **Protocols**: TLSv1.2 and TLSv1.3 only
- **Ciphers**: Strong cipher suites (ECDHE-RSA-AES256-GCM-SHA512, etc.)
- **Session Cache**: 10-minute session cache
- **HSTS**: Strict Transport Security header

### Security Headers
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`: Restrictive CSP policy
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## How to Apply the Fix

### Option 1: Automatic Setup (Recommended)
```bash
# Run the staging startup script
./scripts/start-staging.sh
```

### Option 2: Manual Setup
```bash
# 1. Generate SSL certificates
chmod +x scripts/setup-staging-ssl.sh
./scripts/setup-staging-ssl.sh

# 2. Start staging environment
docker-compose -f docker-compose.staging.yml up -d
```

### Option 3: Windows Setup
```powershell
# 1. Generate SSL certificates (in Git Bash or WSL)
bash scripts/setup-staging-ssl.sh

# 2. Start staging environment
.\scripts\start-staging.ps1
```

## Verification

### Check SSL Certificate
```bash
# Verify certificate exists
ls -la nginx/ssl/

# Check certificate details
openssl x509 -in nginx/ssl/staging.crt -text -noout
```

### Test HTTPS Access
- Main application: https://localhost
- Keycloak: https://localhost/auth
- DBeaver: https://localhost/dbeaver

### Check Nginx Configuration
```bash
# Test nginx configuration
docker exec nginx-staging nginx -t

# View nginx logs
docker-compose -f docker-compose.staging.yml logs nginx
```

## Browser Security Warning

Since we're using self-signed certificates for staging, browsers will show a security warning. This is expected and can be safely bypassed for staging environments by:

1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost (unsafe)" or similar
3. The site will work normally after accepting the certificate

## Production Considerations

For production deployment:
1. Replace self-signed certificates with proper SSL certificates from a trusted CA
2. Use Let's Encrypt or similar for free SSL certificates
3. Configure proper DNS records for the staging domain
4. Consider using a reverse proxy or load balancer for additional security

## Troubleshooting

### Common Issues

1. **Certificate Not Found**
   ```bash
   # Regenerate certificates
   ./scripts/setup-staging-ssl.sh
   ```

2. **Nginx Won't Start**
   ```bash
   # Check nginx configuration
   docker exec nginx-staging nginx -t
   
   # View nginx logs
   docker-compose -f docker-compose.staging.yml logs nginx
   ```

3. **Port 443 Already in Use**
   ```bash
   # Check what's using port 443
   netstat -tulpn | grep :443
   
   # Stop conflicting service or change nginx port
   ```

4. **Browser Security Warning**
   - This is normal for self-signed certificates
   - Accept the certificate in your browser
   - For production, use proper SSL certificates

## Files Modified

1. `nginx/nginx.staging.conf` - Added HTTPS configuration
2. `docker-compose.staging.yml` - Added SSL volume mount
3. `scripts/setup-staging-ssl.sh` - New SSL certificate generation script
4. `scripts/start-staging.sh` - Updated to include SSL setup
5. `scripts/start-staging.ps1` - Updated to include SSL setup
6. `STAGING_SETUP.md` - Updated documentation

## Files Created

1. `nginx/ssl/generate-staging-certs.sh` - Alternative certificate generation script
2. `STAGING_SSL_FIX.md` - This documentation file

---

**Status**: ✅ **FIXED** - Staging environment now serves HTTPS traffic with proper SSL encryption 