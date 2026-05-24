import os
import re
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://backtest:secret@postgres:5432/backtest"
    jwt_secret: str = "default-secret-change-in-production"
    jwt_expiry_seconds: int = 24 * 60 * 60
    refresh_token_days: int = 30
    admin_key: str = "392172"
    engine_max_workers: int = 2
    # str (not list) so pydantic-settings reads the env var verbatim instead of
    # JSON-decoding it. Comma-separated origins; split via cors_origins property.
    cors_origins_raw: str = Field(
        default="http://localhost:3000,http://localhost:5173,http://localhost:5174",
        alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]


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
    return Settings(
        database_url=os.getenv("DATABASE_URL") or _build_db_url_from_spring_env() or defaults.database_url,
        jwt_secret=os.getenv("JWT_SECRET", defaults.jwt_secret),
        admin_key=os.getenv("ADMIN_KEY", defaults.admin_key),
        engine_max_workers=int(os.getenv("ENGINE_MAX_WORKERS", str(defaults.engine_max_workers))),
        CORS_ORIGINS=defaults.cors_origins_raw,
    )


settings = _load()
