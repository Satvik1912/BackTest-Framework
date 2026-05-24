from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db import get_db
from dtos import AdminUserDTO, JobStatusResponse, StrategyResponseDTO
from security import CurrentUser, require_admin
from services import admin_service, job_service, strategy_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserDTO])
def list_users(db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)):
    return admin_service.list_users(db)


@router.post("/users/{user_id}/approve", response_model=AdminUserDTO)
def approve_user(
    user_id: UUID, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)
):
    return admin_service.approve_user(db, user_id)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID, db: Session = Depends(get_db), admin: CurrentUser = Depends(require_admin)
):
    admin_service.delete_user(db, admin.user_id, user_id)


@router.get("/users/{user_id}/strategies", response_model=list[StrategyResponseDTO])
def user_strategies(
    user_id: UUID, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)
):
    return strategy_service.get_all_for_user_as_admin(db, user_id)


@router.post("/strategies/{strategy_id}/run", response_model=JobStatusResponse)
def run_strategy(
    strategy_id: UUID,
    db: Session = Depends(get_db),
    _admin: CurrentUser = Depends(require_admin),
):
    return job_service.submit_job_as_admin(db, strategy_id)


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job(
    job_id: UUID, db: Session = Depends(get_db), _admin: CurrentUser = Depends(require_admin)
):
    return job_service.get_job_as_admin(db, job_id)
