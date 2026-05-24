"""baseline schema (mirrors old Flyway V1-V5)

Revision ID: 0001_baseline
Revises:
Create Date: 2026-05-24

For an existing DB already migrated by Flyway:
    alembic stamp head
For a fresh DB:
    alembic upgrade head
"""
from alembic import op


revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_verified BOOLEAN DEFAULT false,
            role TEXT NOT NULL DEFAULT 'USER',
            is_approved BOOLEAN NOT NULL DEFAULT false,
            last_login TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved);")

    op.execute("""
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS strategies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            definition JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            deleted_at TIMESTAMPTZ
        );
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_strategies_user_active
            ON strategies(user_id) WHERE deleted_at IS NULL;
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS backtest_jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            strategy_id UUID REFERENCES strategies(id),
            user_id UUID REFERENCES users(id),
            status TEXT NOT NULL DEFAULT 'PENDING',
            submitted_at TIMESTAMPTZ DEFAULT now(),
            started_at TIMESTAMPTZ,
            completed_at TIMESTAMPTZ,
            error_message TEXT
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_jobs_user ON backtest_jobs(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON backtest_jobs(status);")

    op.execute("""
        CREATE TABLE IF NOT EXISTS backtest_results (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            job_id UUID UNIQUE REFERENCES backtest_jobs(id),
            total_trades INT,
            wins INT,
            losses INT,
            win_rate NUMERIC(5,2),
            profit_factor NUMERIC(8,4),
            max_drawdown_pct NUMERIC(6,3),
            sharpe_ratio NUMERIC(6,3),
            equity_curve JSONB,
            trades JSONB,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_results_job ON backtest_results(job_id);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS backtest_results CASCADE;")
    op.execute("DROP TABLE IF EXISTS backtest_jobs CASCADE;")
    op.execute("DROP TABLE IF EXISTS strategies CASCADE;")
    op.execute("DROP TABLE IF EXISTS refresh_tokens CASCADE;")
    op.execute("DROP TABLE IF EXISTS users CASCADE;")
