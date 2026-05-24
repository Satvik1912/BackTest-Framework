from typing import Optional
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request, status

from security.jwt_util import decode_token


class CurrentUser:
    def __init__(self, user_id: UUID, email: str, role: str):
        self.user_id = user_id
        self.email = email
        self.role = role


def _extract_bearer(request: Request) -> Optional[str]:
    header = request.headers.get("Authorization")
    if not header or not header.startswith("Bearer "):
        return None
    return header[len("Bearer ") :]


def get_current_user(request: Request) -> CurrentUser:
    token = _extract_bearer(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    try:
        claims = decode_token(token)
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}"
        ) from e

    return CurrentUser(
        user_id=UUID(claims["sub"]),
        email=claims.get("email", ""),
        role=claims.get("role", "USER"),
    )


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return user
