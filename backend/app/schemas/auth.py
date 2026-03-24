from __future__ import annotations

from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int


class AuthenticatedAdmin(BaseModel):
    username: str
    role: str = "admin"
