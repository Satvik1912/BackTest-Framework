import os
import re
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://backtest:secret@postgres:5432/backtest"
    jwt_secret: str = "default-secret-change-in-production"
    jwt_expiry_seconds: int = 24 * 60 * 60
    refresh_token_days: int = 30
    admin_key: str = "392172"
    engine_max_workers: int = 2
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ]


def _build_db_url_from_spring_env() -> Optional[str]:
    raw = os.getenv("SPRING_DATASOURCE_URL")
    if not raw:
        return None
    m = re.match(r"jdbc:postgresql://([^:/]+):(\d+)/(.+)", raw)
    if not m:
        return None
    host, port, db = m.group(1), m.group(2), m.group(3)
    user = os.getenv("SPRING_DATASOURCE_USERNAME", "backtest")
    pw = os.getenv("SPRING_DATASOURCE_PASSWORD", "secret")
    return f"postgresql+psycopg2://{user}:{pw}@{host}:{port}/{db}"


def _load() -> Settings:
    defaults = Settings()
    cors_env = os.getenv("CORS_ORIGINS")
    cors_origins = (
        [o.strip() for o in cors_env.split(",") if o.strip()]
        if cors_env
        else defaults.cors_origins
    )
    return Settings(
        database_url=os.getenv("DATABASE_URL") or _build_db_url_from_spring_env() or defaults.database_url,
        jwt_secret=os.getenv("JWT_SECRET", defaults.jwt_secret),
        admin_key=os.getenv("ADMIN_KEY", defaults.admin_key),
        engine_max_workers=int(os.getenv("ENGINE_MAX_WORKERS", str(defaults.engine_max_workers))),
        cors_origins=cors_origins,
    )


settings = _load()
