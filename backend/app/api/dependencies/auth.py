from __future__ import annotations

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.auth import AuthenticatedAdmin
from app.services.auth import AdminAuthenticationError, AuthService

bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service() -> AuthService:
    return AuthService()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthenticatedAdmin:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing authentication token")
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Unsupported authentication scheme")

    try:
        admin = auth_service.decode_token(credentials.credentials)
    except AdminAuthenticationError as exc:
        raise HTTPException(
            status_code=401, detail="Invalid authentication token"
        ) from exc

    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role is required")

    return admin
