from typing import Optional
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from models import User


def find_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def find_by_id(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def exists_by_email(db: Session, email: str) -> bool:
    return db.query(User).filter(User.email == email).first() is not None


def find_all_by_role(db: Session, role: str) -> list[User]:
    return db.query(User).filter(User.role == role).order_by(desc(User.created_at)).all()


def save(db: Session, user: User) -> User:
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()
