# Profit Life — Repo Context

Profit Life is a full-stack platform for systematic traders. The first app is **BackTest** (research strategies on historical Indian-equity data); **AutoTrade** and **Live Signals** are on the roadmap. This file is the working snapshot of how everything fits together — read it first when picking up work.

## 1. Architecture (high level)

```
┌──────────┐   HTTPS    ┌──────────┐   psycopg2  ┌──────────┐
│ frontend │ ─────────▶ │   api    │ ──────────▶ │ postgres │
│  (React) │            │ (FastAPI)│             └──────────┘
└──────────┘            │          │   RPUSH     ┌──────────┐
                        │          │ ──────────▶ │  redis   │
                        └────┬─────┘             └────┬─────┘
                             │ ▲                      │ BLPOP
                             │ │ X-Internal-Secret    ▼
                             │ │                ┌──────────┐
                             └─┴────────────────│  worker  │
                                                │ (Python) │
                                                └──────────┘
```

Six services, all run together via `docker compose up --build`:

| Service  | Tech                                  | Port  | Role |
|----------|---------------------------------------|-------|------|
| frontend | React 18 + TS + Tailwind + Recharts   | 3000  | UI: home, login, strategy builder, jobs, admin |
| api      | Python 3.11 + FastAPI + SQLAlchemy 2  | 8080  | REST API, auth, strategy CRUD, job dispatch |
| worker   | Python 3.11 + pandas + yfinance       | —     | Consumes jobs from Redis, runs backtest, posts results |
| postgres | Postgres 16                           | 5432  | Users, strategies, jobs, results |
| redis    | Redis 7                               | 6379  | Job queue (`backtest:queue` list) |
| pgadmin  | dpage/pgadmin4:8                      | 5050  | Web UI for browsing the DB |

Worker is scaled with `replicas: 2` in `docker-compose.yml` — they share the queue via Redis `BLPOP`, so jobs are naturally load-balanced.

## 2. Tech stack details

**API** (`api/requirements.txt`):
- FastAPI 0.115 + uvicorn[standard]
- SQLAlchemy 2.0 (sync) + psycopg2-binary
- Alembic for migrations (`api/alembic/`)
- Pydantic v2 + pydantic-settings
- PyJWT 2.9 (HS256), passlib[bcrypt] for password hashing
- redis 5 (sync client)

**Frontend** (`frontend/package.json`):
- React 18, react-router-dom 6, axios, recharts
- Tailwind + Vite

**Worker** (`worker/requirements.txt`):
- yfinance 1.3.0 (data source — Yahoo Finance, Indian tickers like `TATASTEEL.NS`)
- pandas 2.2.0, numpy 1.26.4
- redis 5.0.1 (for `BLPOP`)
- requests 2.31.0 (to call api's `/api/internal/*`)

## 3. Auth model — TWO parallel schemes

Both checks happen inside FastAPI dependencies (`api/security.py`). The `JwtAuthFilter` / `InternalSecretFilter` pattern from Spring is replaced by `get_current_user`, `require_admin`, and `require_internal` dependencies attached to routes.

### 3a. User auth — JWT (stateless) + refresh token (stateful)

- **JWT** (`security.generate_token`): HS256, signed with `JWT_SECRET`, 24-hour expiry. Carries `sub = userId`, `email`, `role`.
- **Refresh token** (`routers/auth._issue_tokens`): random UUID, stored in `refresh_tokens` table, 30-day expiry. Reused on refresh (not rotated).
- On every protected request, `get_current_user` reads `Authorization: Bearer <token>`, validates it with PyJWT, and returns a `CurrentUser(user_id, email, role)` object injected into the route.
- If the header is missing or invalid → FastAPI returns 401 via the dependency.
- `require_admin` is a small wrapper that also asserts `role == ADMIN` (403 otherwise).

**Endpoints** (`api/routers/auth.py`):
- `POST /api/auth/register` → bcrypt password, save user (role=USER, is_approved=false), return userId only **(no tokens — user must wait for admin approval)**
- `POST /api/auth/login` → verify password, reject if not approved or role≠USER, **delete all old refresh tokens for that user**, mint new pair
- `POST /api/auth/admin/register` → verify `admin.key` matches `ADMIN_KEY`, create user (role=ADMIN, is_approved=true), mint tokens
- `POST /api/auth/admin/login` → verify password, require role=ADMIN, wipe refresh tokens, mint new pair
- `POST /api/auth/refresh` → look up refresh token, check expiry, mint new JWT (refresh value reused)
- `POST /api/auth/logout` → delete the refresh token row

**Public routes**: register, login, refresh, admin register, admin login, GET `/api/indicators`, `/actuator/health`.

### 3b. Worker auth — shared secret

The worker talks to `/api/internal/**` to update job status and post results. No user, so it sends header `X-Internal-Secret: $INTERNAL_SECRET`. The `require_internal` dependency on the internal router checks the header; mismatch → 403.

Same `INTERNAL_SECRET` env var is passed to both api (`docker-compose.yml`) and worker (`docker-compose.yml`).

### 3c. Frontend wiring

- `frontend/src/api/client.ts` axios instance attaches `Authorization: Bearer <token>` from `localStorage` on every request. On 401 it clears storage and redirects to `/login` (or `/admin/login` if the user was an admin).
- `frontend/src/context/AuthContext.tsx` holds the in-memory `(user, token)` and persists to localStorage. `ProtectedRoute` gates routes on `isAuthenticated` and optional `requiredRole`.

## 4. Data model (Postgres)

Five tables. Alembic baseline `0001_baseline.py` creates them all idempotently (matches the old Flyway V1–V5 SQL). New installs run `alembic upgrade head`; an existing DB uses `alembic stamp head` once to mark itself current.

- `users(id UUID, email UNIQUE, password_hash, is_verified, role TEXT default 'USER', is_approved BOOLEAN, last_login, created_at)`
- `refresh_tokens(id UUID, user_id FK ON DELETE CASCADE, token UNIQUE, expires_at, created_at)`
- `strategies(id UUID, user_id FK ON DELETE CASCADE, name, definition JSONB, created_at, updated_at, deleted_at TIMESTAMPTZ)`
  - Soft-delete via `deleted_at`. Partial index `idx_strategies_user_active ON strategies(user_id) WHERE deleted_at IS NULL`.
- `backtest_jobs(id UUID, strategy_id FK, user_id FK, status, submitted_at, started_at, completed_at, error_message)`. Status flow: `PENDING → RUNNING → DONE | FAILED`.
- `backtest_results(id UUID, job_id UNIQUE FK, total_trades, wins, losses, win_rate, profit_factor, max_drawdown_pct, sharpe_ratio, equity_curve JSONB, trades JSONB, created_at)`.

`Strategy.definition` is the full `StrategyDefinitionDTO` serialized to JSONB. SQLAlchemy's `JSONB` column maps directly to a `dict`, so no manual serialization on read.

## 5. The strategy / job flow

1. **User builds a strategy** in `StrategyBuilder.tsx` → `POST /api/strategies`.
   `routers/strategies.create` validates indicator keys against `INDICATORS` and saves the row.

2. **User runs a backtest** → `POST /api/backtest/run` with `{ strategyId }`.
   `routers/jobs.submit` (`api/routers/jobs.py`):
   - Loads the user's active (non-deleted) strategy
   - Calls `enqueue_for_strategy(db, strategy, user_id)`:
     - Creates a `BacktestJob` row with status `PENDING`
     - Builds payload `{jobId, userId, strategyId, strategyDefinition, ticker, interval, period, rr}`
     - `job_queue.push_job(payload)` → JSON-encodes and `RPUSH`es to Redis `backtest:queue`
   - Returns `JobStatusResponse` immediately

3. **Worker picks it up** (`worker/worker_main.py`):
   - `BLPOP backtest:queue` with 30s timeout
   - `post_status(job_id, "RUNNING")` → `PATCH /api/internal/jobs/{id}/status`
   - `fetch_stock_data(ticker, period, interval)` via yfinance → pandas DataFrame
   - `build_signal_func(strategy_def)` → closure that, given an index `i` and the DataFrame, returns `{enter: bool, sl: float}`
   - `BacktestEngine(data, rr, signal_func).run()` walks the DataFrame bar-by-bar, opens a long when signal fires, exits when `low <= sl` (STOPLOSS) or `high >= target` (TARGET). Long-only, single-position-at-a-time.
   - `compute_stats(trades, rr)` → win rate, profit factor, max drawdown, Sharpe, equity curve
   - `post_results(job_id, results)` → `POST /api/internal/jobs/{id}/results`

4. **API stores the results** (`routers/internal.save_result`):
   - Upserts a `BacktestResult` row
   - Sets job status to `DONE`

5. **Frontend polls** `/api/backtest/jobs/{id}` → when status is `DONE`, renders trades + equity curve in `JobDetailPage.tsx`.

**Admin variant**: `POST /api/admin/strategies/{strategyId}/run` calls `enqueue_for_strategy` with the strategy's actual `user_id` — admin can run any user's strategy, including soft-deleted ones. The result is fetched via `GET /api/admin/jobs/{jobId}` (no owner check) and rendered by `AdminJobDetailPage.tsx`.

## 6. Indicators — metadata + math (separate concerns)

Two halves that must be kept in sync (still in two files, now both Python):

**API side** — metadata only (`api/indicator_registry.py`):
- A static `INDICATORS: list[IndicatorMetadata]` declares each indicator's `key`, `displayName`, `description`, `category`, `executionSide`, `params`.
- `GET /api/indicators` returns this list → the frontend StrategyBuilder uses it to render the form (param fields, dropdowns).
- `routers/strategies._validate` checks every entry condition references a key that exists in `INDICATORS`.

**Worker side** — actual evaluation (`worker/indicators.py` + `worker/strategy_runner.py`):
- `indicators.py` has the math: `compute_rsi`, `compute_ema`, `compute_macd`, `compute_bollinger`, `compute_atr`, `compute_volume_ma`, `is_hammer`, `is_bullish_engulfing`.
- `strategy_runner.evaluate_condition()` is a giant if/elif on the indicator key — this is where you hook a new indicator into the runtime.

**To add a new indicator**:
1. Add an entry to `api/indicator_registry.INDICATORS` (key + display + params).
2. Add the math to `worker/indicators.py`.
3. Handle the key in `worker/strategy_runner.evaluate_condition`.

That's it — no other registration needed.

## 7. Stoploss types (`worker/strategy_runner.compute_sl`)

- `SWING_LOW` — min low over the last N candles (`slLookback`, default 5)
- `ATR_MULTIPLE` — `close - atrMultiple * ATR(14)`
- `FIXED_PCT` — `close * (1 - slPct/100)`

Target is always `entry + rr * (entry - sl)` — risk-reward multiplier set per strategy.

## 8. REST API surface

```
Auth:
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

Internal (worker only, X-Internal-Secret header):
  PATCH  /api/internal/jobs/{jobId}/status
  POST   /api/internal/jobs/{jobId}/results

Health:
  GET    /actuator/health

OpenAPI docs:
  GET    /docs                              (FastAPI Swagger UI)
```

## 9. Environment variables (`.env.example`)

```
JWT_SECRET=...                # api only — JWT signing key
INTERNAL_SECRET=...           # api + worker — shared secret for internal endpoints
ADMIN_KEY=...                 # api only — required to register an admin account
POSTGRES_DB=backtest
POSTGRES_USER=backtest
POSTGRES_PASSWORD=...
PGADMIN_EMAIL=admin@profitlife.com   # optional, pgAdmin login
PGADMIN_PASSWORD=admin               # optional, pgAdmin login
```

CORS in `api/config.py` allows `http://localhost:3000`, `:5173`, `:5174` by default.

## 10. Frontend routes (`App.tsx`)

```
/                               public landing (RootGate redirects authed users)
/products/backtest              public BackTest product page (how-it-works + indicators)
/login                          public
/register                       public
/admin/login                    public
/admin/register                 public (requires admin key on submit)

/dashboard                      protected (USER)
  ├─ /                          DashboardHome
  ├─ /strategies                StrategiesListPage
  ├─ /strategies/new            StrategyBuilder
  ├─ /jobs                      JobsPage
  └─ /jobs/:jobId               JobDetailPage

/admin                          protected (ADMIN)
  ├─ /                          AdminHome
  ├─ /users                     AdminUsersPage (approve, delete, view strategies)
  ├─ /users/:userId/strategies  AdminUserStrategiesPage (per-card Run)
  └─ /jobs/:jobId               AdminJobDetailPage
```

Brand assets:
- Logo at `frontend/public/profit-life.png` (favicon + hero + nav)
- `CandlestickBackdrop` + `QuotesMarquee` reusable decorative components
- `AuthLayout` wraps all auth pages with a dark-hero / light-form split

## 11. Dev vs prod

**Dev** (running each service separately):
- `docker compose up postgres redis pgadmin`
- api: `cd api && uvicorn main:app --reload --port 8080` (with a local `.env`)
- frontend: `cd frontend && npm run dev` → http://localhost:5173, Vite proxies `/api/*` to `:8080`
- worker: `cd worker && python worker_main.py`

**Prod / full docker**:
- `docker compose up --build` → frontend on http://localhost:3000 (nginx serves built static + proxies `/api/*` to api service)
- `frontend/.env.production` leaves `VITE_API_URL` empty; for a real deploy set it to your API hostname.

## 12. Known things worth fixing later

- **Login kills all other sessions** — `routers/auth.login` deletes all refresh tokens on every login. Multi-device support is a one-line change.
- **Refresh tokens don't rotate** — same token value is reused after refresh.
- **No tests yet** — neither `api/` nor `worker/` has a test suite. Pin indicator behavior at minimum.
- **yfinance is a third-party scraper** — gets rate-limited and breaks on Yahoo's whims. For production move to a paid data provider (Polygon, Alpha Vantage, Kite Connect).
- **Indicator math is in `worker/indicators.py` only** — fine today since the api doesn't need to compute, but if any future feature does (e.g. live signals), extract `indicators.py` into a shared package.
