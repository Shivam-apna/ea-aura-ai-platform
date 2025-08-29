import os
import base64
import json
import time
import httpx
from fastapi import APIRouter, Request, Response, Header, HTTPException

router = APIRouter(prefix="/keycloak", tags=["Keycloak"])

# ---------- Config ----------
KEYCLOAK_BASE_URL = os.getenv("KEYCLOAK_BASE_URL", "http://localhost:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "ea_aura")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "ea_aura")
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET", "vVnUg5MjAZeurop0lhXGuTNaeKjzxqQt")

# ---------- Token Cache ----------
cached_service_token = None
service_token_expires_at = 0

async def get_service_account_token():
    global cached_service_token, service_token_expires_at
    now = time.time()

    if cached_service_token and now < service_token_expires_at - 5:
        return cached_service_token

    url = f"{KEYCLOAK_BASE_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    data = {
        "grant_type": "client_credentials",
        "client_id": KEYCLOAK_CLIENT_ID,
        "client_secret": KEYCLOAK_CLIENT_SECRET,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, data=data)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        body = resp.json()
        cached_service_token = body["access_token"]
        service_token_expires_at = now + body["expires_in"]
        return cached_service_token


# ---------- Routes ----------

@router.get("/test-token")
async def test_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No token provided")

    user_token = authorization.replace("Bearer ", "")
    userinfo_url = f"{KEYCLOAK_BASE_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/userinfo"

    async with httpx.AsyncClient() as client:
        resp = await client.get(userinfo_url, headers={"Authorization": f"Bearer {user_token}"})

    if resp.status_code == 200:
        userinfo = resp.json()
        try:
            payload = json.loads(base64.urlsafe_b64decode(user_token.split(".")[1] + "=="))
        except Exception:
            payload = {}
        return {
            "valid": True,
            "user": userinfo,
            "roles": {
                "realm_access": payload.get("realm_access"),
                "resource_access": payload.get("resource_access"),
            },
            "message": "Token is valid",
        }
    else:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {resp.status_code}")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_keycloak(path: str, request: Request, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token")

    # Ensure /admin prefix
    target_path = path if path.startswith("admin") else f"admin/{path}"
    keycloak_url = f"{KEYCLOAK_BASE_URL}/{target_path}"

    body = await request.body()
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            request.method,
            keycloak_url,
            headers={
                "Authorization": authorization,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            content=body if body else None,
            params=request.query_params,
        )

    return Response(content=resp.content, status_code=resp.status_code, headers=dict(resp.headers))


@router.get("/health")
async def health():
    return {
        "status": "OK",
        "realm": KEYCLOAK_REALM,
        "clientId": KEYCLOAK_CLIENT_ID,
        "hasClientSecret": bool(KEYCLOAK_CLIENT_SECRET),
    }
