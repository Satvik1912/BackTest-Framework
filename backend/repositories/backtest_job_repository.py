from typing import Optional
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from models import BacktestJob


def find_by_id(db: Session, job_id: UUID) -> Optional[BacktestJob]:
    return db.query(BacktestJob).filter(BacktestJob.id == job_id).first()


def find_by_id_and_user(db: Session, job_id: UUID, user_id: UUID) -> Optional[BacktestJob]:
    return (
        db.query(BacktestJob)
        .filter(BacktestJob.id == job_id, BacktestJob.user_id == user_id)
        .first()
    )


def find_by_user(db: Session, user_id: UUID) -> list[BacktestJob]:
    return (
        db.query(BacktestJob)
        .filter(BacktestJob.user_id == user_id)
        .order_by(desc(BacktestJob.submitted_at))
        .all()
    )


def find_ids_by_user(db: Session, user_id: UUID) -> list[UUID]:
    rows = db.query(BacktestJob.id).filter(BacktestJob.user_id == user_id).all()
    return [r[0] for r in rows]


def delete_by_user(db: Session, user_id: UUID) -> int:
    deleted = (
        db.query(BacktestJob).filter(BacktestJob.user_id == user_id).delete(synchronize_session=False)
    )
    db.commit()
    return deleted


def save(db: Session, job: BacktestJob) -> BacktestJob:
    db.add(job)
    db.commit()
    db.refresh(job)
    return job
