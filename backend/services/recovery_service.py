"""Startup recovery for jobs that were in flight when the API last shut down."""
from datetime import datetime, timezone

from db import SessionLocal
from models import BacktestJob


def reconcile_in_flight_jobs() -> tuple[int, int]:
    """Mark any leftover RUNNING jobs as FAILED, resubmit any PENDING jobs.

    Returns (failed_count, resubmitted_count).
    """
    from runner import get_runner

    failed = 0
    resubmitted = 0
    now = datetime.now(tz=timezone.utc)

    with SessionLocal() as db:
        running = db.query(BacktestJob).filter(BacktestJob.status == "RUNNING").all()
        for job in running:
            job.status = "FAILED"
            job.error_message = "Interrupted by backend restart"
            job.completed_at = now
            failed += 1
        db.commit()

        pending_ids = [j.id for j in db.query(BacktestJob).filter(BacktestJob.status == "PENDING").all()]

    for jid in pending_ids:
        get_runner().submit(jid)
        resubmitted += 1

    return failed, resubmitted
