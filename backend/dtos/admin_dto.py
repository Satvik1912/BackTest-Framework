from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class AdminUserDTO(BaseModel):
    id: UUID
    email: str
    role: str
    isApproved: bool
    createdAt: Optional[str] = None
    lastLogin: Optional[str] = None
