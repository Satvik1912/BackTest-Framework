from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class RunBacktestRequest(BaseModel):
    strategyId: UUID


class JobResultDTO(BaseModel):
    symbol: Optional[str] = None
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
    tickers: list[str] = []
    interval: Optional[str] = None
    period: Optional[str] = None
    rr: Optional[float] = None
    # First symbol's result — kept for backward compatibility. `results` is the
    # full per-symbol list a multi-stock job produces.
    result: Optional[JobResultDTO] = None
    results: list[JobResultDTO] = []
    # Full strategy definition (entry conditions, SL/target, direction …) so the
    # results page — and admins — can see exactly what strategy was applied.
    definition: Optional[dict[str, Any]] = None


class SaveJobResultRequest(BaseModel):
    symbol: Optional[str] = None
    totalTrades: int = 0
    wins: int = 0
    losses: int = 0
    winRate: float = 0
    profitFactor: float = 0
    maxDrawdownPct: float = 0
    sharpeRatio: float = 0
    equityCurve: Any = None
    trades: Any = None
