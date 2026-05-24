from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from controllers import (
    admin_controller,
    auth_controller,
    indicator_controller,
    job_controller,
    strategy_controller,
)
from db import SessionLocal
from engine.job_executor import JobExecutor
from runner import init_runner, shutdown_runner
from services import recovery_service


@asynccontextmanager
async def lifespan(_app: FastAPI):
    print(f"Profit Life API starting · DB={settings.database_url.split('@')[-1]}")
    executor = JobExecutor(session_factory=SessionLocal)
    init_runner(executor, max_workers=settings.engine_max_workers)
    failed, resubmitted = recovery_service.reconcile_in_flight_jobs()
    if failed or resubmitted:
        print(f"Recovery: marked {failed} RUNNING jobs FAILED, resubmitted {resubmitted} PENDING jobs")
    try:
        yield
    finally:
        shutdown_runner()


app = FastAPI(
    title="Profit Life API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/actuator/health")
def health():
    return {"status": "UP"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "message": str(exc)},
    )


app.include_router(auth_controller.router)
app.include_router(indicator_controller.router)
app.include_router(strategy_controller.router)
app.include_router(job_controller.router)
app.include_router(admin_controller.router)
