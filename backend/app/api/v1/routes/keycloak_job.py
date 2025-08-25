# backend/app/api/v1/routes/proxy.py

from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.core_log import logger
from typing import Optional, List, Dict, Any
import requests
import asyncio
import json
import base64
import time
import os
from datetime import datetime, timedelta
import tempfile
from urllib.parse import urlencode, urlparse
import aiohttp
import aiofiles
from io import BytesIO

router = APIRouter()

# Configuration
KEYCLOAK_BASE_URL = os.getenv("KEYCLOAK_BASE_URL", "http://localhost:8080")
KEYCLOAK_REALM = "myrealm"
KEYCLOAK_CLIENT_ID = "myclient"
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET", "5ahtCMZjoBpa4YzHzDSj4MAZlRlMPuTO")

# Token cache for service account
cached_service_token = None
service_token_expires_at = 0

logger.info("🚀 Proxy server initializing", extra={
    "keycloak_url": KEYCLOAK_BASE_URL,
    "realm": KEYCLOAK_REALM,
    "client_id": KEYCLOAK_CLIENT_ID,
    "client_secret_status": "SET" if KEYCLOAK_CLIENT_SECRET else "NOT_SET"
})


class KeycloakService:
    """Service class for Keycloak operations"""
    
    @staticmethod
    async def get_service_account_token() -> str:
        """Get service account token with caching"""
        global cached_service_token, service_token_expires_at
        
        now = time.time() * 1000  # Convert to milliseconds
        if cached_service_token and now < service_token_expires_at - 5000:
            return cached_service_token

        logger.info("🔄 Fetching new Keycloak service account token")
        
        url = f"{KEYCLOAK_BASE_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
        
        data = {
            "grant_type": "client_credentials",
            "client_id": KEYCLOAK_CLIENT_ID,
            "client_secret": KEYCLOAK_CLIENT_SECRET
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    data=urlencode(data)
                ) as response:
                    if not response.ok:
                        error_text = await response.text()
                        raise HTTPException(
                            status_code=response.status,
                            detail=f"Keycloak service account token fetch failed: {response.status} {error_text}"
                        )
                    
                    token_data = await response.json()
                    cached_service_token = token_data["access_token"]
                    service_token_expires_at = now + (token_data["expires_in"] * 1000)
                    
                    logger.info("✅ Keycloak service account token obtained successfully")
                    return cached_service_token
                    
        except Exception as e:
            logger.exception("❌ Error getting Keycloak service account token", extra={
                "error": str(e),
                "keycloak_url": KEYCLOAK_BASE_URL
            })
            raise HTTPException(status_code=500, detail=f"Token fetch error: {str(e)}")


def extract_user_token(request: Request) -> Optional[str]:
    """Extract user token from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")
    return None


@router.get("/test-token")
async def test_token(request: Request):
    """Test token endpoint for debugging"""
    user_token = extract_user_token(request)
    
    if not user_token:
        logger.warning("❌ Token test failed - no token provided")
        return JSONResponse(
            status_code=401,
            content={"error": "No token provided"}
        )
    
    try:
        logger.info("🔍 Testing token validity", extra={
            "endpoint": "/api/v1/test-token",
            "method": "GET"
        })
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{KEYCLOAK_BASE_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/userinfo",
                headers={"Authorization": f"Bearer {user_token}"}
            ) as response:
                if response.ok:
                    user_info = await response.json()
                    
                    # Decode token payload
                    token_payload = {}
                    try:
                        # Split token and decode payload
                        token_parts = user_token.split('.')
                        if len(token_parts) >= 2:
                            # Add padding if needed
                            payload_b64 = token_parts[1]
                            padding = 4 - len(payload_b64) % 4
                            if padding != 4:
                                payload_b64 += '=' * padding
                            
                            token_payload = json.loads(base64.b64decode(payload_b64))
                    except Exception as e:
                        logger.warning(f"Failed to decode token: {str(e)}")
                    
                    logger.info("✅ Token test successful", extra={
                        "user_id": user_info.get("sub"),
                        "username": user_info.get("preferred_username")
                    })
                    
                    return {
                        "valid": True,
                        "user": user_info,
                        "roles": {
                            "realm_access": token_payload.get("realm_access"),
                            "resource_access": token_payload.get("resource_access")
                        },
                        "message": "Token is valid"
                    }
                else:
                    logger.warning(f"❌ Token validation failed: {response.status}")
                    return JSONResponse(
                        status_code=401,
                        content={
                            "valid": False,
                            "message": f"Token validation failed: {response.status}"
                        }
                    )
                    
    except Exception as e:
        logger.exception("❌ Token test error", extra={
            "error": str(e)
        })
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@router.api_route("/keycloak/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def keycloak_proxy(path: str, request: Request):
    """Custom Keycloak API handler with proper organization member handling"""
    
    logger.info("📥 Received Keycloak proxy request", extra={
        "endpoint": f"/api/v1/keycloak/{path}",
        "method": request.method,
        "path": path,
        "query_params": dict(request.query_params)
    })
    
    user_token = extract_user_token(request)
    if not user_token:
        logger.warning("❌ No authorization token provided")
        return JSONResponse(
            status_code=401,
            content={"error": "No authorization token"}
        )
    
    # Prepare target path
    target_path = f"/{path}"
    if not target_path.startswith("/admin"):
        target_path = f"/admin{target_path}"
    
    # Build query string
    query_string = ""
    if request.query_params:
        query_string = f"?{urlencode(request.query_params)}"
    
    keycloak_url = f"{KEYCLOAK_BASE_URL}{target_path}{query_string}"
    
    logger.info("🎯 Forwarding to Keycloak", extra={
        "method": request.method,
        "keycloak_url": keycloak_url
    })
    
    try:
        headers = {
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Handle request body
        body = None
        if request.method not in ["GET", "DELETE", "HEAD"]:
            body_bytes = await request.body()
            if body_bytes:
                body_string = body_bytes.decode('utf-8')
                
                # Special handling for Organization Members API
                if (request.method == "POST" and 
                    "/organizations/" in target_path and 
                    target_path.endswith("/members")):
                    
                    logger.info("🔄 Processing Organization AddMember request", extra={
                        "raw_body": body_string
                    })
                    
                    try:
                        # Parse user ID from body
                        if body_string.startswith('"') and body_string.endswith('"'):
                            user_id = json.loads(body_string)
                        else:
                            try:
                                parsed = json.loads(body_string)
                                user_id = parsed if isinstance(parsed, str) else parsed.get("userId") or parsed.get("id")
                            except:
                                user_id = body_string
                        
                        # Format as raw JSON string for Keycloak
                        body = f'"{user_id}"'
                        logger.info("📤 Organization AddMember body prepared", extra={
                            "formatted_body": body
                        })
                    except Exception as e:
                        logger.error("❌ Failed to parse organization member body", extra={
                            "error": str(e),
                            "body": body_string
                        })
                        return JSONResponse(
                            status_code=400,
                            content={"error": "Invalid request body format"}
                        )
                else:
                    # For all other endpoints, use body as-is
                    body = body_string
                    logger.info("📤 Standard request body prepared")
        
        # Make request to Keycloak
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=request.method,
                url=keycloak_url,
                headers=headers,
                data=body
            ) as response:
                
                logger.info("✅ Keycloak response received", extra={
                    "status": response.status,
                    "status_text": response.reason
                })
                
                # Handle 204 No Content
                if response.status == 204:
                    logger.info("✅ Keycloak returned 204 No Content - operation successful")
                    return JSONResponse(
                        status_code=200,
                        content={"ok": True, "message": "Operation successful"}
                    )
                
                # Handle 201 Created
                if response.status == 201:
                    logger.info("✅ Keycloak returned 201 Created - resource created successfully")
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        data = await response.json()
                        logger.info("📥 Created resource response received", extra={
                            "data_keys": list(data.keys()) if isinstance(data, dict) else "non-dict"
                        })
                        return JSONResponse(status_code=201, content=data)
                    else:
                        return JSONResponse(
                            status_code=201,
                            content={"ok": True, "message": "Resource created successfully"}
                        )
                
                # Handle JSON responses
                content_type = response.headers.get('content-type', '')
                if 'application/json' in content_type:
                    data = await response.json()
                    data_size = len(data) if isinstance(data, list) else len(data.keys()) if isinstance(data, dict) else 0
                    logger.info("📥 Keycloak JSON response received", extra={
                        "data_size": data_size,
                        "is_array": isinstance(data, list)
                    })
                    return JSONResponse(status_code=response.status, content=data)
                else:
                    # Handle text responses
                    text = await response.text()
                    logger.info("📥 Keycloak text response received", extra={
                        "text_length": len(text),
                        "text_preview": text[:200] + "..." if len(text) > 200 else text
                    })
                    
                    if response.ok:
                        return JSONResponse(
                            status_code=response.status,
                            content={"ok": True, "message": text or "Operation successful"}
                        )
                    else:
                        logger.warning(f"❌ Keycloak error response: {response.status}")
                        return JSONResponse(
                            status_code=response.status,
                            content={"error": text or f"HTTP {response.status} Error"}
                        )
                        
    except aiohttp.ClientConnectorError:
        logger.error("❌ Cannot connect to Keycloak server", extra={
            "keycloak_url": KEYCLOAK_BASE_URL,
            "error_type": "connection_refused"
        })
        return JSONResponse(
            status_code=503,
            content={
                "error": "Cannot connect to Keycloak server",
                "details": f"Connection refused to {KEYCLOAK_BASE_URL}",
                "suggestion": "Check if Keycloak is running"
            }
        )
    except asyncio.TimeoutError:
        logger.error("❌ Request to Keycloak timed out")
        return JSONResponse(
            status_code=408,
            content={
                "error": "Request timeout",
                "details": "Request to Keycloak timed out"
            }
        )
    except Exception as e:
        logger.exception("❌ Proxy error communicating with Keycloak", extra={
            "error": str(e),
            "keycloak_url": keycloak_url
        })
        return JSONResponse(
            status_code=500,
            content={
                "error": "Proxy error communicating with Keycloak",
                "details": str(e)
            }
        )


@router.post("/upload-batch")
async def upload_batch(
    request: Request,
    files: List[UploadFile] = File(None),
    agent: str = Form(...),
    organizationId: str = Form(...),
    organizationName: str = Form(...),
    dataSourceOption: str = Form(...),
    googleDriveCredentials: Optional[str] = Form(None)
):
    """Endpoint for batch file upload"""
    
    logger.info("📥 Received batch file upload request", extra={
        "endpoint": "/api/v1/upload-batch",
        "method": "POST",
        "agent": agent,
        "organization_id": organizationId,
        "organization_name": organizationName,
        "data_source_option": dataSourceOption,
        "files_count": len(files) if files else 0,
        "has_google_drive_credentials": bool(googleDriveCredentials)
    })
    
    user_token = extract_user_token(request)
    if not user_token:
        logger.warning("❌ No authorization token provided for file upload")
        return JSONResponse(
            status_code=401,
            content={"error": "No authorization token"}
        )
    
    # Validate required fields
    if not organizationId or not agent or (not files and not googleDriveCredentials):
        logger.warning("❌ Missing required fields for upload", extra={
            "organization_id": bool(organizationId),
            "agent": bool(agent),
            "has_files": bool(files),
            "has_google_drive_credentials": bool(googleDriveCredentials)
        })
        return JSONResponse(
            status_code=400,
            content={"error": "Missing required fields for upload."}
        )
    
    try:
        # TODO: Implement actual backend logic here
        # 1. Validate organizationId and agent
        # 2. Store files (S3, Google Cloud Storage, or local disk)
        # 3. Persist file metadata in database
        # 4. Handle Google Drive credentials if needed
        # 5. Ensure transactional integrity
        
        uploaded_file_records = []
        if files:
            for file in files:
                file_content = await file.read()
                record = {
                    "id": f"file-{int(time.time())}-{hash(file.filename) % 1000000}",
                    "filename": file.filename,
                    "uploadDate": datetime.now().isoformat(),
                    "uploadedBy": "current_user_id_from_token",  # Extract from userToken
                    "organizationId": organizationId,
                    "organizationName": organizationName,
                    "agent": agent,
                    "status": "completed",
                    "fileSize": len(file_content),
                    "fileType": file.content_type
                }
                uploaded_file_records.append(record)
                
                logger.info("📄 File processed", extra={
                    "filename": file.filename,
                    "file_size": len(file_content),
                    "content_type": file.content_type
                })
        
        logger.info("✅ Batch upload completed", extra={
            "organization_id": organizationId,
            "agent": agent,
            "files_processed": len(uploaded_file_records),
            "status": "success"
        })
        
        return {
            "message": "Files uploaded and processed successfully (simulated).",
            "uploadedFiles": uploaded_file_records
        }
        
    except Exception as e:
        logger.exception("❌ Batch upload failed", extra={
            "organization_id": organizationId,
            "agent": agent,
            "error": str(e),
            "status": "failed"
        })
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to process batch upload",
                "details": str(e)
            }
        )


@router.get("/uploaded-files")
async def get_uploaded_files(request: Request, organizationId: str, agent: str):
    """Get uploaded files for an organization and agent"""
    
    logger.info("📥 Received request to fetch uploaded files", extra={
        "endpoint": "/api/v1/uploaded-files",
        "method": "GET",
        "organization_id": organizationId,
        "agent": agent
    })
    
    user_token = extract_user_token(request)
    if not user_token:
        logger.warning("❌ No authorization token provided")
        return JSONResponse(
            status_code=401,
            content={"error": "No authorization token"}
        )
    
    if not organizationId or not agent:
        logger.warning("❌ Missing query parameters", extra={
            "organization_id": bool(organizationId),
            "agent": bool(agent)
        })
        return JSONResponse(
            status_code=400,
            content={"error": "Missing organizationId or agent query parameters."}
        )
    
    try:
        # TODO: Implement actual database query here
        # Query database for files associated with organizationId and agent
        
        # Simulate database response
        simulated_files = [
            {
                "id": "file-1",
                "filename": "sales_q1_2023.csv",
                "uploadDate": "2023-01-15T10:00:00Z",
                "uploadedBy": "user1",
                "organizationId": "org-1",
                "organizationName": "Acme Corp",
                "agent": "business-vitality-agent",
                "status": "completed",
                "fileSize": 12345,
                "fileType": "text/csv"
            },
            {
                "id": "file-2",
                "filename": "customer_feedback.json",
                "uploadDate": "2023-02-20T11:30:00Z",
                "uploadedBy": "user2",
                "organizationId": "org-1",
                "organizationName": "Acme Corp",
                "agent": "customer-analyzer-agent",
                "status": "completed",
                "fileSize": 54321,
                "fileType": "application/json"
            }
        ]
        
        filtered_files = [
            file for file in simulated_files
            if file["organizationId"] == organizationId and file["agent"] == agent
        ]
        
        logger.info("✅ Files fetched successfully", extra={
            "organization_id": organizationId,
            "agent": agent,
            "files_count": len(filtered_files),
            "status": "success"
        })
        
        return filtered_files
        
    except Exception as e:
        logger.exception("❌ Failed to fetch uploaded files", extra={
            "organization_id": organizationId,
            "agent": agent,
            "error": str(e),
            "status": "failed"
        })
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to fetch uploaded files",
                "details": str(e)
            }
        )


@router.delete("/uploaded-files/{file_id}")
async def delete_uploaded_file(file_id: str, request: Request):
    """Delete an uploaded file"""
    
    logger.info("📥 Received request to delete file", extra={
        "endpoint": f"/api/v1/uploaded-files/{file_id}",
        "method": "DELETE",
        "file_id": file_id
    })
    
    user_token = extract_user_token(request)
    if not user_token:
        logger.warning("❌ No authorization token provided")
        return JSONResponse(
            status_code=401,
            content={"error": "No authorization token"}
        )
    
    try:
        # TODO: Implement actual file deletion logic here
        # 1. Delete file from storage
        # 2. Remove record from database
        
        logger.info("✅ File deleted successfully", extra={
            "file_id": file_id,
            "status": "success"
        })
        
        return {"message": f"File {file_id} deleted successfully (simulated)."}
        
    except Exception as e:
        logger.exception("❌ Failed to delete file", extra={
            "file_id": file_id,
            "error": str(e),
            "status": "failed"
        })
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to delete file",
                "details": str(e)
            }
        )


@router.get("/uploaded-files/{file_id}/download")
async def download_uploaded_file(file_id: str, request: Request):
    """Download an uploaded file"""
    
    logger.info("📥 Received request to download file", extra={
        "endpoint": f"/api/v1/uploaded-files/{file_id}/download",
        "method": "GET",
        "file_id": file_id
    })
    
    user_token = extract_user_token(request)
    if not user_token:
        logger.warning("❌ No authorization token provided")
        return JSONResponse(
            status_code=401,
            content={"error": "No authorization token"}
        )
    
    try:
        # TODO: Implement actual file download logic here
        # 1. Retrieve file from storage based on file_id
        # 2. Stream file back to client
        
        # Simulate file download
        dummy_content = f"This is a dummy file for {file_id}. Your actual file content would be here."
        
        logger.info("✅ File download initiated", extra={
            "file_id": file_id,
            "content_length": len(dummy_content),
            "status": "success"
        })
        
        return StreamingResponse(
            BytesIO(dummy_content.encode()),
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename=downloaded_file_{file_id}.txt"
            }
        )
        
    except Exception as e:
        logger.exception("❌ Failed to download file", extra={
            "file_id": file_id,
            "error": str(e),
            "status": "failed"
        })
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to download file",
                "details": str(e)
            }
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    
    logger.info("📥 Health check requested", extra={
        "endpoint": "/api/v1/health",
        "method": "GET"
    })
    
    return {
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "keycloakUrl": KEYCLOAK_BASE_URL,
        "realm": KEYCLOAK_REALM,
        "clientId": KEYCLOAK_CLIENT_ID,
        "hasClientSecret": bool(KEYCLOAK_CLIENT_SECRET)
    }


@router.get("/debug/config")
async def debug_config():
    """Debug configuration endpoint"""
    
    logger.info("📥 Debug config requested", extra={
        "endpoint": "/api/v1/debug/config",
        "method": "GET"
    })
    
    return {
        "keycloakBaseUrl": KEYCLOAK_BASE_URL,
        "realm": KEYCLOAK_REALM,
        "clientId": KEYCLOAK_CLIENT_ID,
        "hasClientSecret": bool(KEYCLOAK_CLIENT_SECRET),
        "nodeEnv": os.getenv("NODE_ENV", "development"),
        "pythonVersion": os.sys.version
    }


# Log successful initialization
logger.info("✅ Proxy router initialized successfully", extra={
    "keycloak_url": KEYCLOAK_BASE_URL,
    "realm": KEYCLOAK_REALM,
    "client_id": KEYCLOAK_CLIENT_ID,
    "endpoints": [
        "/health", "/test-token", "/debug/config", "/keycloak/*",
        "/upload-batch", "/uploaded-files", "/uploaded-files/{id}",
        "/uploaded-files/{id}/download"
    ]
})
