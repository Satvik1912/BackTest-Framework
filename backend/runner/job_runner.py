"""Bounded in-process job runner.

Backtests are I/O-heavy (yfinance) plus pandas math (GIL-friendly), so a
ThreadPoolExecutor is the right shape: bounded concurrency, shared process
memory, simple lifecycle. Replaces the external Redis-backed worker.
"""
from __future__ import annotations

import threading
from concurrent.futures import ThreadPoolExecutor
from typing import Optional
from uuid import UUID

from engine.job_executor import JobExecutor


class JobRunner:
    def __init__(self, executor: JobExecutor, max_workers: int = 2):
        self._executor = executor
        self._pool = ThreadPoolExecutor(
            max_workers=max_workers,
            thread_name_prefix="backtest",
        )

    def submit(self, job_id: UUID) -> None:
        self._pool.submit(self._executor.execute, job_id)

    def shutdown(self) -> None:
        self._pool.shutdown(wait=False, cancel_futures=False)


# Module-level singleton, initialised at app startup.
_runner: Optional[JobRunner] = None
_lock = threading.Lock()


def init_runner(executor: JobExecutor, max_workers: int) -> JobRunner:
    global _runner
    with _lock:
        if _runner is None:
            _runner = JobRunner(executor, max_workers=max_workers)
    return _runner


def get_runner() -> JobRunner:
    if _runner is None:
        raise RuntimeError("Job runner has not been initialised yet")
    return _runner


def shutdown_runner() -> None:
    global _runner
    with _lock:
        if _runner is not None:
            _runner.shutdown()
            _runner = None
