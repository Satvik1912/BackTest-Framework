from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db import get_db
from dtos import (
    AdminRegisterRequest,
    AuthResponse,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
)
from services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register(db, req)


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(db, req)


@router.post("/admin/register", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
def register_admin(req: AdminRegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register_admin(db, req)


@router.post("/admin/login", response_model=AuthResponse)
def login_admin(req: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login_admin(db, req)


@router.post("/refresh", response_model=AuthResponse)
def refresh(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    return auth_service.refresh(db, req.refreshToken)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    auth_service.logout(db, req.refreshToken)
