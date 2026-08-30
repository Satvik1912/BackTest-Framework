from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from dtos import (
    JobResultDTO,
    JobStatusResponse,
    RunBacktestRequest,
    SaveJobResultRequest,
)
from models import BacktestJob, BacktestResult, Strategy
from repositories import (
    backtest_job_repository,
    backtest_result_repository,
    strategy_repository,
)
from runner import get_runner


def submit_job(db: Session, req: RunBacktestRequest, user_id: UUID) -> JobStatusResponse:
    strategy = strategy_repository.find_active_by_id_and_user(db, req.strategyId, user_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return enqueue_for_strategy(db, strategy, user_id)


def submit_job_as_admin(db: Session, strategy_id: UUID) -> JobStatusResponse:
    strategy = strategy_repository.find_by_id(db, strategy_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return enqueue_for_strategy(db, strategy, strategy.user_id)


def get_all_jobs_for_user(db: Session, user_id: UUID) -> list[JobStatusResponse]:
    return [_to_response(db, j) for j in backtest_job_repository.find_by_user(db, user_id)]


def get_job_status(db: Session, job_id: UUID, user_id: UUID) -> JobStatusResponse:
    job = backtest_job_repository.find_by_id_and_user(db, job_id, user_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _to_response(db, job)


def get_job_as_admin(db: Session, job_id: UUID) -> JobStatusResponse:
    job = backtest_job_repository.find_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _to_response(db, job)


def update_job_status(db: Session, job_id: UUID, status: str, error_message: Optional[str]) -> None:
    job = backtest_job_repository.find_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = status
    now = datetime.now(tz=timezone.utc)
    if status == "RUNNING":
        job.started_at = now
    if status in ("DONE", "FAILED"):
        job.completed_at = now
    if error_message is not None:
        job.error_message = error_message
    backtest_job_repository.save(db, job)


def save_symbol_result(db: Session, job_id: UUID, symbol: str, req: SaveJobResultRequest) -> None:
    """Upsert the backtest result for one symbol of a job.

    Does NOT change job status — a multi-stock job is only DONE once every
    symbol has been processed (the executor sets the terminal status).
    """
    job = backtest_job_repository.find_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    result = backtest_result_repository.find_by_job_and_symbol(db, job_id, symbol)
    if not result:
        result = BacktestResult(
            job_id=job_id, symbol=symbol, created_at=datetime.now(tz=timezone.utc)
        )

    result.symbol = symbol
    result.total_trades = req.totalTrades
    result.wins = req.wins
    result.losses = req.losses
    result.win_rate = req.winRate
    result.profit_factor = req.profitFactor
    result.max_drawdown_pct = req.maxDrawdownPct
    result.sharpe_ratio = req.sharpeRatio
    result.equity_curve = req.equityCurve
    result.trades = req.trades
    backtest_result_repository.save(db, result)


def enqueue_for_strategy(db: Session, strategy: Strategy, owner_user_id: UUID) -> JobStatusResponse:
    job = BacktestJob(
        strategy_id=strategy.id,
        user_id=owner_user_id,
        status="PENDING",
        submitted_at=datetime.now(tz=timezone.utc),
    )
    backtest_job_repository.save(db, job)
    get_runner().submit(job.id)
    return _to_response(db, job)


def _result_to_dto(r: BacktestResult) -> JobResultDTO:
    return JobResultDTO(
        symbol=r.symbol,
        totalTrades=r.total_trades,
        wins=r.wins,
        losses=r.losses,
        winRate=float(r.win_rate) if r.win_rate is not None else None,
        profitFactor=float(r.profit_factor) if r.profit_factor is not None else None,
        maxDrawdownPct=float(r.max_drawdown_pct) if r.max_drawdown_pct is not None else None,
        sharpeRatio=float(r.sharpe_ratio) if r.sharpe_ratio is not None else None,
        equityCurve=r.equity_curve,
        trades=r.trades,
    )


def _to_response(db: Session, job: BacktestJob) -> JobStatusResponse:
    strategy_name: Optional[str] = None
    ticker = interval = period = None
    tickers: list[str] = []
    rr: Optional[float] = None
    definition: Optional[dict] = None

    if job.strategy_id:
        s = strategy_repository.find_by_id(db, job.strategy_id)
        if s:
            strategy_name = s.name
            d = s.definition or {}
            definition = d
            ticker = d.get("ticker")
            tickers = d.get("tickers") or ([ticker] if ticker else [])
            interval = d.get("interval")
            period = d.get("period")
            rr_val = d.get("rr")
            rr = float(rr_val) if rr_val is not None else None

    result_dtos: list[JobResultDTO] = []
    if job.status == "DONE":
        rows = backtest_result_repository.find_all_by_job_id(db, job.id)
        result_dtos = [_result_to_dto(r) for r in rows]

    return JobStatusResponse(
        jobId=job.id,
        status=job.status,
        submittedAt=job.submitted_at.isoformat() if job.submitted_at else None,
        startedAt=job.started_at.isoformat() if job.started_at else None,
        completedAt=job.completed_at.isoformat() if job.completed_at else None,
        errorMessage=job.error_message,
        strategyId=job.strategy_id,
        strategyName=strategy_name,
        ticker=ticker,
        tickers=tickers,
        interval=interval,
        period=period,
        rr=rr,
        result=result_dtos[0] if result_dtos else None,
        results=result_dtos,
        definition=definition,
    )
