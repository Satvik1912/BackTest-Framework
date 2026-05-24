from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from models import RefreshToken


def find_by_token(db: Session, token: str) -> Optional[RefreshToken]:
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()


def delete_by_user_id(db: Session, user_id: UUID) -> int:
    deleted = db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    db.commit()
    return deleted


def delete_by_token(db: Session, token: str) -> int:
    deleted = db.query(RefreshToken).filter(RefreshToken.token == token).delete()
    db.commit()
    return deleted


def save(db: Session, refresh_token: RefreshToken) -> RefreshToken:
    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)
    return refresh_token
