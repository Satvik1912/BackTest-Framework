from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from models import BacktestResult


def find_by_job_id(db: Session, job_id: UUID) -> Optional[BacktestResult]:
    return db.query(BacktestResult).filter(BacktestResult.job_id == job_id).first()


def find_all_by_job_id(db: Session, job_id: UUID) -> list[BacktestResult]:
    return (
        db.query(BacktestResult)
        .filter(BacktestResult.job_id == job_id)
        .order_by(BacktestResult.symbol.asc())
        .all()
    )


def find_by_job_and_symbol(
    db: Session, job_id: UUID, symbol: Optional[str]
) -> Optional[BacktestResult]:
    return (
        db.query(BacktestResult)
        .filter(BacktestResult.job_id == job_id, BacktestResult.symbol == symbol)
        .first()
    )


def delete_by_job_ids(db: Session, job_ids: list[UUID]) -> int:
    if not job_ids:
        return 0
    deleted = (
        db.query(BacktestResult)
        .filter(BacktestResult.job_id.in_(job_ids))
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted


def save(db: Session, result: BacktestResult) -> BacktestResult:
    db.add(result)
    db.commit()
    db.refresh(result)
    return result
