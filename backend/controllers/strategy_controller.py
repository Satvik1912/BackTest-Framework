from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db import get_db
from dtos import StrategyDefinitionDTO, StrategyResponseDTO
from security import CurrentUser, get_current_user
from services import strategy_service

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=StrategyResponseDTO)
def create(
    dto: StrategyDefinitionDTO,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    return strategy_service.create(db, dto, user.user_id)


@router.get("", response_model=list[StrategyResponseDTO])
def list_all(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return strategy_service.get_all_for_user(db, user.user_id)


@router.get("/{sid}", response_model=StrategyResponseDTO)
def get_one(sid: UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    return strategy_service.get_by_id_for_user(db, sid, user.user_id)


@router.put("/{sid}", response_model=StrategyResponseDTO)
def update(
    sid: UUID,
    dto: StrategyDefinitionDTO,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    return strategy_service.update(db, sid, dto, user.user_id)


@router.delete("/{sid}", status_code=status.HTTP_204_NO_CONTENT)
def delete(sid: UUID, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    strategy_service.soft_delete(db, sid, user.user_id)
