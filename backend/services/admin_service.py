from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from dtos import AdminUserDTO
from models import User
from repositories import (
    backtest_job_repository,
    backtest_result_repository,
    user_repository,
)
from services.auth_service import ROLE_ADMIN, ROLE_USER


def list_users(db: Session) -> list[AdminUserDTO]:
    return [_to_dto(u) for u in user_repository.find_all_by_role(db, ROLE_USER)]


def approve_user(db: Session, user_id: UUID) -> AdminUserDTO:
    user = user_repository.find_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != ROLE_USER:
        raise HTTPException(status_code=400, detail="Only USER accounts can be approved")
    user.is_approved = True
    user_repository.save(db, user)
    return _to_dto(user)


def delete_user(db: Session, current_admin_id: UUID, target_user_id: UUID) -> None:
    if current_admin_id == target_user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")
    user = user_repository.find_by_id(db, target_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != ROLE_USER:
        raise HTTPException(status_code=400, detail="Only USER accounts can be deleted")

    job_ids = backtest_job_repository.find_ids_by_user(db, target_user_id)
    backtest_result_repository.delete_by_job_ids(db, job_ids)
    backtest_job_repository.delete_by_user(db, target_user_id)
    user_repository.delete(db, user)


def _to_dto(u: User) -> AdminUserDTO:
    return AdminUserDTO(
        id=u.id,
        email=u.email,
        role=u.role,
        isApproved=bool(u.is_approved),
        createdAt=u.created_at.isoformat() if u.created_at else None,
        lastLogin=u.last_login.isoformat() if u.last_login else None,
    )


# Re-export for callers that only want to type-check role strings
__all__ = ["list_users", "approve_user", "delete_user", "ROLE_USER", "ROLE_ADMIN"]
