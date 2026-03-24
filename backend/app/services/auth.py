from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt
from jwt import InvalidTokenError

from app.core.config import get_settings
from app.schemas.auth import AuthenticatedAdmin


class AdminAuthenticationError(ValueError):
    pass


@dataclass(frozen=True)
class AuthTokenPayload:
    sub: str
    role: str
    exp: int


class AuthService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def authenticate_admin(self, username: str, password: str) -> AuthenticatedAdmin:
        if (
            username != self.settings.admin_username
            or password != self.settings.admin_password
        ):
            raise AdminAuthenticationError("Invalid admin credentials")
        return AuthenticatedAdmin(username=username)

    def create_access_token(self, admin: AuthenticatedAdmin) -> tuple[str, int]:
        expires_delta = timedelta(
            minutes=self.settings.auth_access_token_expire_minutes
        )
        expires_at = datetime.now(tz=UTC) + expires_delta
        payload = {
            "sub": admin.username,
            "role": admin.role,
            "exp": expires_at,
        }
        token = jwt.encode(
            payload,
            self.settings.auth_jwt_secret,
            algorithm=self.settings.auth_jwt_algorithm,
        )
        return token, int(expires_delta.total_seconds())

    def decode_token(self, token: str) -> AuthenticatedAdmin:
        try:
            decoded = jwt.decode(
                token,
                self.settings.auth_jwt_secret,
                algorithms=[self.settings.auth_jwt_algorithm],
            )
        except InvalidTokenError as exc:
            raise AdminAuthenticationError("Invalid token") from exc

        username = str(decoded.get("sub", "")).strip()
        role = str(decoded.get("role", "")).strip()
        if username == "" or role == "":
            raise AdminAuthenticationError("Invalid token claims")
        return AuthenticatedAdmin(username=username, role=role)
