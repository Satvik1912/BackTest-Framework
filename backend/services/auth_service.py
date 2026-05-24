import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from config import settings
from dtos import (
    AdminRegisterRequest,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
)
from models import RefreshToken, User
from repositories import refresh_token_repository, user_repository
from security import generate_token, hash_password, verify_password

ROLE_USER = "USER"
ROLE_ADMIN = "ADMIN"


def register(db: Session, req: RegisterRequest) -> AuthResponse:
    if user_repository.exists_by_email(db, req.email):
        raise HTTPException(status_code=400, detail="UserName already registered")

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        is_verified=False,
        role=ROLE_USER,
        is_approved=False,
    )
    user_repository.save(db, user)
    return AuthResponse(email=user.email, userId=user.id, role=user.role)


def register_admin(db: Session, req: AdminRegisterRequest) -> AuthResponse:
    if req.adminKey != settings.admin_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    if user_repository.exists_by_email(db, req.email):
        raise HTTPException(status_code=400, detail="UserName already registered")

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        is_verified=True,
        role=ROLE_ADMIN,
        is_approved=True,
    )
    user_repository.save(db, user)
    return _issue_tokens(db, user)


def login(db: Session, req: LoginRequest) -> AuthResponse:
    user = _authenticate(db, req)
    if user.role != ROLE_USER:
        raise HTTPException(status_code=403, detail="Use the admin login for admin accounts")
    if not user.is_approved:
        raise HTTPException(
            status_code=403,
            detail="Your account is awaiting approval from admin. It will take 1 to 60 mins to get approved.",
        )

    user.last_login = datetime.now(tz=timezone.utc)
    user_repository.save(db, user)
    refresh_token_repository.delete_by_user_id(db, user.id)
    return _issue_tokens(db, user)


def login_admin(db: Session, req: LoginRequest) -> AuthResponse:
    user = _authenticate(db, req)
    if user.role != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Not an admin account")

    user.last_login = datetime.now(tz=timezone.utc)
    user_repository.save(db, user)
    refresh_token_repository.delete_by_user_id(db, user.id)
    return _issue_tokens(db, user)


def refresh(db: Session, refresh_token_value: str) -> AuthResponse:
    rt = refresh_token_repository.find_by_token(db, refresh_token_value)
    if not rt:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if rt.expires_at <= datetime.now(tz=timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = user_repository.find_by_id(db, rt.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_token = generate_token(user.id, user.email, user.role)
    return AuthResponse(
        token=new_token,
        refreshToken=refresh_token_value,
        email=user.email,
        userId=user.id,
        role=user.role,
    )


def logout(db: Session, refresh_token_value: str) -> None:
    refresh_token_repository.delete_by_token(db, refresh_token_value)


def _authenticate(db: Session, req: LoginRequest) -> User:
    user = user_repository.find_by_email(db, req.email)
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


def _issue_tokens(db: Session, user: User) -> AuthResponse:
    token = generate_token(user.id, user.email, user.role)
    refresh_value = str(uuid.uuid4())
    refresh = RefreshToken(
        user_id=user.id,
        token=refresh_value,
        expires_at=datetime.now(tz=timezone.utc) + timedelta(days=settings.refresh_token_days),
    )
    refresh_token_repository.save(db, refresh)
    return AuthResponse(
        token=token,
        refreshToken=refresh_value,
        email=user.email,
        userId=user.id,
        role=user.role,
    )
