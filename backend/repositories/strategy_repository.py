from typing import Optional
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from models import Strategy


def find_by_id(db: Session, strategy_id: UUID) -> Optional[Strategy]:
    return db.query(Strategy).filter(Strategy.id == strategy_id).first()


def find_active_by_id_and_user(db: Session, strategy_id: UUID, user_id: UUID) -> Optional[Strategy]:
    return (
        db.query(Strategy)
        .filter(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id,
            Strategy.deleted_at.is_(None),
        )
        .first()
    )


def find_active_by_user(db: Session, user_id: UUID) -> list[Strategy]:
    return (
        db.query(Strategy)
        .filter(Strategy.user_id == user_id, Strategy.deleted_at.is_(None))
        .order_by(desc(Strategy.created_at))
        .all()
    )


def find_all_by_user(db: Session, user_id: UUID) -> list[Strategy]:
    return (
        db.query(Strategy)
        .filter(Strategy.user_id == user_id)
        .order_by(desc(Strategy.created_at))
        .all()
    )


def save(db: Session, strategy: Strategy) -> Strategy:
    db.add(strategy)
    db.commit()
    db.refresh(strategy)
    return strategy
