from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.auth import AdminLoginRequest, AdminTokenResponse
from app.services.auth import AdminAuthenticationError, AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service() -> AuthService:
    return AuthService()


@router.post("/admin/login", response_model=AdminTokenResponse, summary="Admin login")
def admin_login(
    payload: AdminLoginRequest, auth_service: AuthService = Depends(get_auth_service)
) -> AdminTokenResponse:
    try:
        admin = auth_service.authenticate_admin(
            username=payload.username, password=payload.password
        )
    except AdminAuthenticationError as exc:
        raise HTTPException(status_code=401, detail="Invalid credentials") from exc
    token, expires_in_seconds = auth_service.create_access_token(admin)
    return AdminTokenResponse(access_token=token, expires_in_seconds=expires_in_seconds)
