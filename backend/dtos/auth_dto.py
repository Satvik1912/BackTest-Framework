from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class AdminRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    adminKey: str


class RefreshTokenRequest(BaseModel):
    refreshToken: str


class AuthResponse(BaseModel):
    token: Optional[str] = None
    refreshToken: Optional[str] = None
    email: str
    userId: UUID
    role: str
