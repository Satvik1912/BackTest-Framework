from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IndicatorConditionDTO(BaseModel):
    model_config = ConfigDict(extra="allow")
    indicatorKey: str
    params: dict[str, Any] = {}
    operator: str
    threshold: float = 0


class ExitConditionDTO(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: str
    value: float


class StrategyDefinitionDTO(BaseModel):
    model_config = ConfigDict(extra="allow")
    name: str
    # `tickers` is the source of truth (up to MAX_TICKERS symbols). `ticker` is
    # kept for backward compatibility / display and mirrors tickers[0]; it is
    # normalized in strategy_validator so both stay in sync.
    ticker: str = ""
    tickers: list[str] = []
    interval: str
    period: str
    rr: float
    direction: str = "LONG"
    slType: Optional[str] = None
    slLookback: Optional[int] = None
    atrMultiple: Optional[float] = None
    slPct: Optional[float] = None
    chandelierMultiple: Optional[float] = None
    chandelierPeriod: Optional[int] = None
    targetType: Optional[str] = None
    targetPct: Optional[float] = None
    targetAtrMultiple: Optional[float] = None
    targetSwingLookback: Optional[int] = None
    maxBarsInTrade: Optional[int] = None
    conditionLogic: str = "AND"
    entryConditions: list[IndicatorConditionDTO] = []
    exitConditions: list[ExitConditionDTO] = []


class StrategyResponseDTO(BaseModel):
    id: UUID
    name: str
    ticker: str
    tickers: list[str] = []
    interval: str
    period: str
    rr: float
    direction: str = "LONG"
    slType: Optional[str] = None
    slLookback: Optional[int] = None
    atrMultiple: Optional[float] = None
    slPct: Optional[float] = None
    chandelierMultiple: Optional[float] = None
    chandelierPeriod: Optional[int] = None
    targetType: Optional[str] = None
    targetPct: Optional[float] = None
    targetAtrMultiple: Optional[float] = None
    targetSwingLookback: Optional[int] = None
    maxBarsInTrade: Optional[int] = None
    conditionLogic: str
    entryConditions: list[IndicatorConditionDTO]
    exitConditions: list[ExitConditionDTO]
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    deletedAt: Optional[str] = None
