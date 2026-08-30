from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from dtos import StrategyDefinitionDTO, StrategyResponseDTO
from models import Strategy
from repositories import strategy_repository
from services import strategy_validator


def create(db: Session, dto: StrategyDefinitionDTO, user_id: UUID) -> StrategyResponseDTO:
    strategy_validator.validate(dto)
    now = datetime.now(tz=timezone.utc)
    strategy = Strategy(
        user_id=user_id,
        name=dto.name,
        definition=dto.model_dump(),
        created_at=now,
        updated_at=now,
    )
    return _to_response(strategy_repository.save(db, strategy))


def get_all_for_user(db: Session, user_id: UUID) -> list[StrategyResponseDTO]:
    return [_to_response(s) for s in strategy_repository.find_active_by_user(db, user_id)]


def get_all_for_user_as_admin(db: Session, user_id: UUID) -> list[StrategyResponseDTO]:
    return [_to_response(s) for s in strategy_repository.find_all_by_user(db, user_id)]


def get_by_id_for_user(db: Session, sid: UUID, user_id: UUID) -> StrategyResponseDTO:
    return _to_response(_require_active(db, sid, user_id))


def update(db: Session, sid: UUID, dto: StrategyDefinitionDTO, user_id: UUID) -> StrategyResponseDTO:
    strategy = _require_active(db, sid, user_id)
    strategy_validator.validate(dto)
    strategy.name = dto.name
    strategy.definition = dto.model_dump()
    strategy.updated_at = datetime.now(tz=timezone.utc)
    return _to_response(strategy_repository.save(db, strategy))


def soft_delete(db: Session, sid: UUID, user_id: UUID) -> None:
    strategy = _require_active(db, sid, user_id)
    strategy.deleted_at = datetime.now(tz=timezone.utc)
    strategy_repository.save(db, strategy)


def _require_active(db: Session, sid: UUID, user_id: UUID) -> Strategy:
    strategy = strategy_repository.find_active_by_id_and_user(db, sid, user_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy


def _to_response(s: Strategy) -> StrategyResponseDTO:
    d = s.definition or {}
    tickers = d.get("tickers") or ([d.get("ticker")] if d.get("ticker") else [])
    return StrategyResponseDTO(
        id=s.id,
        name=s.name,
        ticker=d.get("ticker", ""),
        tickers=tickers,
        interval=d.get("interval", ""),
        period=d.get("period", ""),
        rr=float(d.get("rr", 0)),
        direction=d.get("direction", "LONG"),
        slType=d.get("slType"),
        slLookback=d.get("slLookback"),
        atrMultiple=d.get("atrMultiple"),
        slPct=d.get("slPct"),
        chandelierMultiple=d.get("chandelierMultiple"),
        chandelierPeriod=d.get("chandelierPeriod"),
        targetType=d.get("targetType"),
        targetPct=d.get("targetPct"),
        targetAtrMultiple=d.get("targetAtrMultiple"),
        targetSwingLookback=d.get("targetSwingLookback"),
        maxBarsInTrade=d.get("maxBarsInTrade"),
        conditionLogic=d.get("conditionLogic", "AND"),
        entryConditions=d.get("entryConditions", []),
        exitConditions=d.get("exitConditions", []),
        createdAt=s.created_at.isoformat() if s.created_at else None,
        updatedAt=s.updated_at.isoformat() if s.updated_at else None,
        deletedAt=s.deleted_at.isoformat() if s.deleted_at else None,
    )
