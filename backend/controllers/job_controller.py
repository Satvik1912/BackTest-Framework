from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import get_db
from dtos import JobStatusResponse, RunBacktestRequest
from security import CurrentUser, get_current_user
from services import job_service

router = APIRouter(prefix="/api/backtest", tags=["jobs"])


@router.post("/run", response_model=JobStatusResponse)
def submit(
    req: RunBacktestRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    return job_service.submit_job(db, req, user.user_id)


@router.get("/jobs", response_model=list[JobStatusResponse])
def list_jobs(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return job_service.get_all_jobs_for_user(db, user.user_id)


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job(job_id: UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return job_service.get_job_status(db, job_id, user.user_id)
