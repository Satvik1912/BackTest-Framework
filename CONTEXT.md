# Profit Life — Repo Context

Profit Life is a full-stack platform for systematic traders. The first app is **BackTest** (research strategies on historical Indian-equity data); **AutoTrade** and **Live Signals** are on the roadmap. This file is the working snapshot of how everything fits together — read it first when picking up work.

> **Architecture note (important):** The backtest engine now runs **in-process** inside the FastAPI backend via a bounded `ThreadPoolExecutor`. The old standalone **Redis-queued worker** service has been removed. If you see references to Redis, `BLPOP`, `backtest:queue`, a `worker/` service, or `X-Internal-Secret` in `README.md` or older docs, they are **stale** — the live design is described below.

## 1. Architecture (high level)

```
┌──────────┐   HTTPS    ┌───────────────────────────┐   psycopg2  ┌──────────┐
│ frontend │ ─────────▶ │          backend          │ ──────────▶ │ postgres │
│  (React) │            │         (FastAPI)         │             └──────────┘
└──────────┘            │  ┌─────────────────────┐  │
                        │  │ in-process runner   │  │   yfinance (Yahoo)
                        │  │ ThreadPoolExecutor  │ ─┼──────────────▶ internet
                        │  │  → JobExecutor      │  │
                        │  └─────────────────────┘  │
                        └───────────────────────────┘
```

Services run together via `docker compose up --build`:

| Service  | Tech                                     | Port | Role |
|----------|------------------------------------------|------|------|
| frontend | React 18 + TS + Tailwind + Recharts (Vite) | 3000 | UI: home, login, strategy builder, jobs, admin |
| backend  | Python 3.11 + FastAPI + SQLAlchemy 2     | 8080 | REST API, auth, strategy CRUD, **and** in-process backtest execution |
| postgres | Postgres 16                              | 5432 | Users, strategies, jobs, results |
| pgadmin  | dpage/pgadmin4:8                         | 5050 | Web UI for browsing the DB |

There is **no separate worker and no Redis**. Backtests execute on a `ThreadPoolExecutor` (default 2 threads, `ENGINE_MAX_WORKERS`) living inside the backend process — see `backend/runner/job_runner.py`.

**On-disk layout:** the API service directory is `backend/` (docs sometimes say `api/`). It is organized as a layered app: `controllers/` (HTTP) → `services/` (business logic) → `repositories/` (data access) → `models/` (SQLAlchemy) + `dtos/` (Pydantic) + `engine/` (backtest math) + `runner/` (thread pool) + `security/` + `config/` + `db/`.

## 2. Tech stack details

**Backend** (`backend/requirements.txt`):
- FastAPI 0.115 + uvicorn[standard] 0.32
- SQLAlchemy 2.0 (sync) + psycopg2-binary
- Alembic 1.13 for migrations (`backend/alembic/`)
- Pydantic v2 + pydantic-settings
- PyJWT 2.9 (HS256), passlib[bcrypt] + bcrypt for password hashing
- **yfinance + pandas 2.2 + numpy 1.26** — the backtest engine runs here now (no separate worker)

**Frontend** (`frontend/package.json`):
- React 18, react-router-dom 6, axios 1.7, recharts 2.13
- Tailwind + Vite (`npm run dev` → :5173; `npm run build` → static served by nginx on :3000)

## 3. Auth model — JWT + refresh token

All auth is user-facing. There is **no** worker/internal-secret scheme anymore (the internal endpoints were removed with the worker). Auth is enforced by FastAPI dependencies in `backend/security/dependencies.py`.

- **JWT** (`security.generate_token` / `jwt_util`): HS256, signed with `JWT_SECRET`, 24-hour expiry. Carries `sub = userId`, `email`, `role`.
- **Refresh token** (`auth_service._issue_tokens`): random UUID, stored in `refresh_tokens` table, 30-day expiry (`refresh_token_days`). **Reused on refresh (not rotated).**
- On every protected request, `get_current_user` reads `Authorization: Bearer <token>`, validates with PyJWT, and injects a `CurrentUser(user_id, email, role)`. Missing/invalid → 401.
- `require_admin` wraps `get_current_user` and asserts `role == "ADMIN"` (403 otherwise).

**Endpoints** (`controllers/auth_controller.py` → `services/auth_service.py`):
- `POST /api/auth/register` → bcrypt password, save user (role=USER, `is_approved=false`), return `{email, userId, role}` **(no tokens — user must wait for admin approval)**
- `POST /api/auth/login` → verify password; reject if role≠USER or not approved; **delete all old refresh tokens for that user**; mint new pair
- `POST /api/auth/admin/register` → verify `adminKey == ADMIN_KEY`, create user (role=ADMIN, approved+verified), mint tokens
- `POST /api/auth/admin/login` → verify password, require role=ADMIN, wipe refresh tokens, mint new pair
- `POST /api/auth/refresh` → look up refresh token, check expiry, mint new JWT (refresh value reused)
- `POST /api/auth/logout` → delete the refresh token row (204)

**Public routes**: register, login, refresh, admin register, admin login, `GET /api/indicators`, `GET /actuator/health`.

### Frontend wiring
- `frontend/src/api/client.ts` — axios instance; request interceptor attaches `Authorization: Bearer <token>` from `localStorage`. On a 401 it clears storage and redirects to `/login` (or `/admin/login` if the stored user was an admin). Base URL from `VITE_API_URL`, defaulting to `http://localhost:8080`.
- `frontend/src/context/AuthContext.tsx` holds the in-memory `(user, token)` and persists to localStorage. `ProtectedRoute` gates routes on `isAuthenticated` and optional `requiredRole`.

## 4. Data model (Postgres)

Five tables. Alembic baseline `0001_baseline.py` creates them all idempotently. New installs run `alembic upgrade head`; an existing DB uses `alembic stamp head` once to mark itself current.

- `users(id UUID, email UNIQUE, password_hash, is_verified, role TEXT default 'USER', is_approved BOOLEAN, last_login, created_at)`
- `refresh_tokens(id UUID, user_id FK ON DELETE CASCADE, token UNIQUE, expires_at, created_at)`
- `strategies(id UUID, user_id FK ON DELETE CASCADE, name, definition JSONB, created_at, updated_at, deleted_at TIMESTAMPTZ)`
  - Soft-delete via `deleted_at`. Partial index `idx_strategies_user_active ON strategies(user_id) WHERE deleted_at IS NULL`.
- `backtest_jobs(id UUID, strategy_id FK, user_id FK, status, submitted_at, started_at, completed_at, error_message)`. Status flow: `PENDING → RUNNING → DONE | FAILED`.
- `backtest_results(id UUID, job_id UNIQUE FK, total_trades, wins, losses, win_rate, profit_factor, max_drawdown_pct, sharpe_ratio, equity_curve JSONB, trades JSONB, created_at)`.

`Strategy.definition` is the full `StrategyDefinitionDTO` (`dto.model_dump()`) serialized to JSONB — ticker, interval, period, rr, direction, SL/target config, and entry conditions all live inside it. SQLAlchemy's `JSONB` column maps directly to a `dict`.

## 5. The strategy / job flow (all in-process)

1. **User builds a strategy** in `StrategyBuilder.tsx` → `POST /api/strategies`.
   `strategy_service.create` runs `strategy_validator.validate` (every `entryConditions[].indicatorKey` must be a registered indicator), then saves the row with `definition = dto.model_dump()`.

2. **User runs a backtest** → `POST /api/backtest/run` with `{ strategyId }`.
   `job_controller.submit` → `job_service.submit_job`:
   - Loads the user's active (non-deleted) strategy (`find_active_by_id_and_user`)
   - `enqueue_for_strategy`: creates a `BacktestJob` row with status `PENDING`, then calls `get_runner().submit(job.id)` — hands the job id to the `ThreadPoolExecutor`
   - Returns a `JobStatusResponse` immediately (status `PENDING`)

3. **A pool thread runs the job** (`runner/job_runner.py` → `engine/job_executor.py::JobExecutor.execute`):
   - Loads job + strategy in a short DB session, reads `ticker/interval/period/rr` from the definition
   - Sets status `RUNNING` (isolated short-lived session — the connection is **not** held during the slow work)
   - `YFinanceProvider.fetch(ticker, period, interval)` → normalized pandas DataFrame (`datetime, open, high, low, close, volume`, tz `Asia/Kolkata`)
   - `signal_func.build(definition)` → per-bar entry closure; `signal_func.build_manage_func(definition)` → per-bar trade manager (trailing SL + time exit)
   - `BacktestEngine(df, rr, signal_func, manage_func).run()` → list of trades
   - `stats.compute(trades, rr)` → win rate, profit factor, max drawdown, Sharpe, equity curve
   - `job_service.save_job_result` upserts a `BacktestResult` and sets job status `DONE`
   - Any exception → `JobExecutor` marks the job `FAILED` with the error message (isolated session)

4. **Frontend polls** `GET /api/backtest/jobs/{jobId}` → when status is `DONE`, `JobStatusResponse.result` carries the stats/trades/equity curve, rendered in `JobDetailPage.tsx`.

**Startup recovery** (`services/recovery_service.reconcile_in_flight_jobs`, run in `main.py` lifespan): any `RUNNING` job left over from a previous process is marked `FAILED` ("Interrupted by backend restart"); any `PENDING` job is re-submitted to the pool. This replaces the durability the external queue used to provide.

**Admin variant**: `POST /api/admin/strategies/{strategyId}/run` → `job_service.submit_job_as_admin` enqueues using the strategy's actual `user_id` (can run any user's strategy, including soft-deleted ones — it uses `find_by_id`, not the active-only lookup). Result fetched via `GET /api/admin/jobs/{jobId}` (no owner check), rendered by `AdminJobDetailPage.tsx`.

## 6. Indicators — auto-registered plugin classes

Indicators live under `backend/engine/indicators/`, one class per file. `engine/indicators/base.py::Indicator` is an ABC; every subclass auto-registers into `Indicator._registry` via `__init_subclass__` keyed by its `key`. **No if/elif chain and no manual registry list** — dropping a new module in the folder is enough.

- **Metadata → frontend**: `engine/indicators/registry.metadata()` builds the `IndicatorMetadata` list from the registered classes (key, displayName, description, category, `executionSide="PYTHON"`, params). `engine/__init__.py` exposes it as `INDICATORS`; `GET /api/indicators` returns it, and `StrategyBuilder` renders the form from it.
- **Evaluation**: `signal_func._evaluate` looks the indicator up via `registry.get(key)` and calls `indicator.evaluate(i, df, params, operator, threshold) -> bool`.
- **Validation**: `strategy_validator.validate` checks each entry-condition key against `engine.valid_keys()` (alias for `all_keys()`).

**20 indicators today**, across 5 categories:
- **TREND** — EMA, SMA, ADX, PSAR, SUPERTREND
- **MOMENTUM** — RSI, MACD, STOCHASTIC, CCI, ROC, WILLIAMS_R
- **VOLATILITY** — BOLLINGER, KELTNER, DONCHIAN
- **PATTERN** — HAMMER, ENGULFING (bullish)
- **VOLUME** — VOLUME_MA, OBV, MFI, VWAP

**To add a new indicator**: create `engine/indicators/<name>.py` with a class extending `Indicator` that sets `key`, `display_name`, `description`, `category`, `params`, and implements `evaluate(...)`. That's it — metadata, validation, and dispatch all pick it up automatically.

**Operators** (`engine/operators.py`): `OVER`, `UNDER`, `EQUALS`, `CROSSES_ABOVE`, `CROSSES_BELOW` (plus `crossed_above`/`crossed_below` helpers for indicators that track the previous bar).

## 7. Stoploss & target — also plugin registries

Both mirror the indicator pattern (ABC + `__init_subclass__`, resolved by key with a default fallback).

**Stoploss** (`engine/stoploss/`, default `SWING_LOW`): `SWING_LOW`, `ATR_MULTIPLE`, `FIXED_PCT`, `CHANDELIER_EXIT`.
- Calculators expose `compute(i, df, strategy_def)` for the entry SL and `update(i, df, trade, strategy_def)` for trailing (used by the manage func).

**Target** (`engine/targets/`, default `R_MULTIPLE`): `R_MULTIPLE`, `ATR_MULTIPLE`, `FIXED_PCT`, `PRIOR_SWING_HIGH`.
- `compute(i, df, entry, sl, strategy_def)`. `R_MULTIPLE` = `entry + rr * (entry - sl)` (mirrored for SHORT).

**Trade management** (`signal_func.build_manage_func` + `BacktestEngine`): per bar it can (a) trail the stop (only tightening, and only if it stays on the correct side of price), and (b) force a `TIME_EXIT` once `maxBarsInTrade` bars have elapsed. Exits are checked as STOPLOSS / TARGET / TIME_EXIT.

**Direction**: the engine supports both **LONG and SHORT** (`direction` in the strategy definition). SHORT inverts the SL/target sides and the stop/target hit checks. One position at a time.

## 8. REST API surface

```
Auth (public):
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  POST   /api/auth/refresh
  POST   /api/auth/admin/register
  POST   /api/auth/admin/login

Indicators (public):
  GET    /api/indicators

Strategies (auth required):
  POST   /api/strategies
  GET    /api/strategies
  GET    /api/strategies/{id}
  PUT    /api/strategies/{id}
  DELETE /api/strategies/{id}              (soft delete — sets deleted_at)

Jobs (auth required):
  POST   /api/backtest/run
  GET    /api/backtest/jobs
  GET    /api/backtest/jobs/{jobId}

Admin (auth required, role=ADMIN):
  GET    /api/admin/users
  POST   /api/admin/users/{id}/approve
  DELETE /api/admin/users/{id}
  GET    /api/admin/users/{id}/strategies  (includes soft-deleted)
  POST   /api/admin/strategies/{id}/run
  GET    /api/admin/jobs/{id}

Health:
  GET    /actuator/health                  ({"status":"UP"})

OpenAPI docs:
  GET    /docs                             (FastAPI Swagger UI; redoc disabled)
```

There are **no `/api/internal/*` endpoints** — those belonged to the removed worker.

## 9. Configuration / environment variables

Settings load in `backend/config/settings.py` (pydantic-settings, reads a `backend/.env` if present):

| Var                 | Default (local)                                             | Purpose |
|---------------------|------------------------------------------------------------|---------|
| `DATABASE_URL`      | `postgresql+psycopg2://backtest:secret@postgres:5432/backtest` | SQLAlchemy DSN. Also derivable from `SPRING_DATASOURCE_URL/_USERNAME/_PASSWORD` (JDBC form) for compose. |
| `JWT_SECRET`        | `default-secret-change-in-production`                      | JWT signing key |
| `ADMIN_KEY`         | `392172`                                                   | Required to register an admin account |
| `ENGINE_MAX_WORKERS`| `2`                                                        | ThreadPoolExecutor size for backtests |
| `CORS_ORIGINS`      | `http://localhost:3000,:5173,:5174`                        | Comma-separated allowed origins (parsed to a list) |

> Note: `render.yaml` still declares an `INTERNAL_SECRET` env var — it is **vestigial** (the app no longer reads it) and can be removed.

**Local dev without Docker:** point `DATABASE_URL` at `localhost` and run against a dockerized Postgres, e.g. `postgresql+psycopg2://backtest:secret@localhost:5432/backtest`.

## 10. Frontend routes (`frontend/src/App.tsx`)

```
/                               RootGate — public HomePage, or redirect authed users to /dashboard | /admin
/products/backtest              public BackTestInfoPage (how-it-works + indicators)
/login                          public
/register                       public
/admin/login                    public
/admin/register                 public (requires admin key on submit)

/dashboard                      protected (USER) — DashboardLayout
  ├─ index                      DashboardHome
  ├─ /strategies                StrategiesListPage
  ├─ /strategies/new            StrategyBuilder
  ├─ /jobs                      JobsPage
  └─ /jobs/:jobId               JobDetailPage

/admin                          protected (ADMIN) — AdminLayout
  ├─ index                      AdminHome
  ├─ /users                     AdminUsersPage (approve, delete, view strategies)
  ├─ /users/:userId/strategies  AdminUserStrategiesPage (per-card Run)
  └─ /jobs/:jobId               AdminJobDetailPage

*                               redirect to /
```

API modules: `src/api/{auth,strategies,jobs,admin}.ts` all use the shared `client.ts` axios instance. Reusable UI: `Navbar`, `Logo`, `AuthLayout` (dark-hero / light-form split), `CandlestickBackdrop`, `QuotesMarquee`, `ProtectedRoute`.

## 11. Dev vs prod / deployment

**Local dev (each service separately):**
- `docker compose up -d postgres` (and `pgadmin` if you want the DB UI)
- backend: `cd backend && python -m uvicorn main:app --reload --port 8080` (with a local `.env` pointing `DATABASE_URL` at `localhost`)
- frontend: `cd frontend && npm run dev` → http://localhost:5173 (Vite)

**Full docker:** `docker compose up --build` → frontend on http://localhost:3000 (nginx serves the built static bundle).

**Deployed:**
- **Backend → Render** (`render.yaml`): Docker web service `profitlife-api`, Singapore region, free plan, `healthCheckPath: /actuator/health`, auto-deploy from `main`. `DATABASE_URL`/`ADMIN_KEY` set manually; `JWT_SECRET` generated; `CORS_ORIGINS = https://profitlife.in,https://www.profitlife.in`.
- **Frontend → Cloudflare** (`wrangler.jsonc`, project `profitlife`): static assets served from `frontend/`. Set `VITE_API_URL` to the Render API hostname at build time.

## 12. Known things worth fixing later

- **Login kills all other sessions** — `auth_service.login`/`login_admin` delete *all* refresh tokens on every login. Multi-device support is a small change.
- **Refresh tokens don't rotate** — the same token value is reused after `/refresh`.
- **No tests yet** — neither backend logic nor the engine has a test suite. The indicator/stoploss/target classes are pure and easy to pin — start there.
- **In-process execution is not durable across crashes mid-run** — startup recovery re-runs PENDING jobs and fails orphaned RUNNING ones, but a job in flight when the process dies is lost (marked FAILED on restart). Fine for the current scale; revisit if backtests get long or volume grows.
- **yfinance is a third-party scraper** — rate-limited and breaks on Yahoo's whims. `MarketDataProvider` is the seam to swap in a paid source (Polygon, Alpha Vantage, Kite Connect) without touching the engine.
- **`README.md` is stale** — it still documents the Redis + worker architecture and an `api/` layout. Update it to match this file.
