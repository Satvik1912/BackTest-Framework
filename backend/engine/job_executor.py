"""End-to-end orchestration of a single backtest job.

Composes the engine, signal builder, data provider and stats — but knows
nothing of HTTP, Redis or thread pools. Pure business logic that any caller
(test, runner, ad-hoc script) can invoke.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable
from uuid import UUID

from sqlalchemy.orm import Session

from constants import MAX_TICKERS
from dtos import SaveJobResultRequest
from engine.backtest_engine import BacktestEngine
from engine.data_provider import MarketDataProvider, YFinanceProvider
from engine.signal_func import build as build_signal_func, build_manage_func
from engine.stats import compute as compute_stats
from repositories import backtest_job_repository, strategy_repository
from services import job_service

SessionFactory = Callable[[], Session]


class JobExecutor:
    def __init__(
        self,
        session_factory: SessionFactory,
        data_provider: MarketDataProvider | None = None,
    ):
        self._session_factory = session_factory
        self._data_provider = data_provider or YFinanceProvider()

    def execute(self, job_id: UUID) -> None:
        """Run one job to completion. Always terminates the job in DONE or FAILED."""
        try:
            self._run(job_id)
        except Exception as exc:  # noqa: BLE001 — final safety net for the worker thread
            self._mark_failed(job_id, str(exc))

    # ---------- private ----------

    def _run(self, job_id: UUID) -> None:
        with self._session_factory() as db:
            job = backtest_job_repository.find_by_id(db, job_id)
            if job is None:
                return
            strategy = strategy_repository.find_by_id(db, job.strategy_id) if job.strategy_id else None
            if strategy is None:
                job_service.update_job_status(db, job_id, "FAILED", "Strategy not found")
                return

            definition = strategy.definition or {}
            symbols = self._resolve_symbols(definition)
            interval = definition.get("interval", "5m")
            period = definition.get("period", "60d")
            rr = float(definition.get("rr", 2.0))

        if not symbols:
            job_service_update_status_isolated(
                self._session_factory, job_id, "FAILED", "No ticker configured"
            )
            return

        # Heavy I/O + CPU work runs outside the DB session so we don't hold a
        # connection while yfinance and pandas churn for seconds.
        job_service_update_status_isolated(self._session_factory, job_id, "RUNNING", None)

        # Signal/manage closures depend only on the definition, so build once
        # and reuse across every symbol.
        signal = build_signal_func(definition)
        manage = build_manage_func(definition)

        succeeded = 0
        failures: list[str] = []
        for symbol in symbols:
            try:
                df = self._data_provider.fetch(symbol, period, interval)
                trades = BacktestEngine(data=df, rr=rr, signal_func=signal, manage_func=manage).run()
                stats = compute_stats(trades, rr)
                with self._session_factory() as db:
                    job_service.save_symbol_result(
                        db, job_id, symbol, SaveJobResultRequest(**stats)
                    )
                succeeded += 1
            except Exception as exc:  # noqa: BLE001 — isolate one bad symbol
                failures.append(f"{symbol}: {exc}")

        # The job is DONE if at least one symbol produced a result; only a total
        # wipeout is a FAILED job. Partial failures are surfaced via the message.
        if succeeded == 0:
            message = "; ".join(failures) or "No results produced"
            job_service_update_status_isolated(self._session_factory, job_id, "FAILED", message)
            return

        message = f"Some symbols failed — {'; '.join(failures)}" if failures else None
        job_service_update_status_isolated(self._session_factory, job_id, "DONE", message)

    @staticmethod
    def _resolve_symbols(definition: dict) -> list[str]:
        raw = definition.get("tickers") or [definition.get("ticker", "")]
        seen: set[str] = set()
        out: list[str] = []
        for t in raw:
            sym = (t or "").strip().upper()
            if sym and sym not in seen:
                seen.add(sym)
                out.append(sym)
        return out[:MAX_TICKERS]

    def _mark_failed(self, job_id: UUID, message: str) -> None:
        try:
            job_service_update_status_isolated(self._session_factory, job_id, "FAILED", message)
        except Exception:  # noqa: BLE001
            # Last-resort: nothing more we can do
            pass


def job_service_update_status_isolated(
    session_factory: SessionFactory, job_id: UUID, status: str, error: str | None
) -> None:
    """Status update in its own short-lived session — keeps the long-running
    backtest off the DB connection pool."""
    with session_factory() as db:
        job_service.update_job_status(db, job_id, status, error)
