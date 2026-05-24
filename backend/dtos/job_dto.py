from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class RunBacktestRequest(BaseModel):
    strategyId: UUID


class JobResultDTO(BaseModel):
    totalTrades: Optional[int] = None
    wins: Optional[int] = None
    losses: Optional[int] = None
    winRate: Optional[float] = None
    profitFactor: Optional[float] = None
    maxDrawdownPct: Optional[float] = None
    sharpeRatio: Optional[float] = None
    equityCurve: Any = None
    trades: Any = None


class JobStatusResponse(BaseModel):
    jobId: UUID
    status: str
    submittedAt: Optional[str] = None
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    errorMessage: Optional[str] = None
    strategyId: Optional[UUID] = None
    strategyName: Optional[str] = None
    ticker: Optional[str] = None
    interval: Optional[str] = None
    period: Optional[str] = None
    rr: Optional[float] = None
    result: Optional[JobResultDTO] = None


class SaveJobResultRequest(BaseModel):
    totalTrades: int = 0
    wins: int = 0
    losses: int = 0
    winRate: float = 0
    profitFactor: float = 0
    maxDrawdownPct: float = 0
    sharpeRatio: float = 0
    equityCurve: Any = None
    trades: Any = None
