import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from db import Base


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # No longer unique on job_id alone: a multi-stock job produces one result
    # row per symbol. Uniqueness is now (job_id, symbol) — see migration 0002.
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("backtest_jobs.id")
    )
    symbol: Mapped[Optional[str]] = mapped_column(Text)
    total_trades: Mapped[Optional[int]] = mapped_column(Integer)
    wins: Mapped[Optional[int]] = mapped_column(Integer)
    losses: Mapped[Optional[int]] = mapped_column(Integer)
    win_rate: Mapped[Optional[float]] = mapped_column(Numeric(5, 2))
    profit_factor: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    max_drawdown_pct: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    sharpe_ratio: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    equity_curve: Mapped[Optional[list]] = mapped_column(JSONB)
    trades: Mapped[Optional[list]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
