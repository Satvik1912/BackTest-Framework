# Profit Life

A platform for systematic traders. The first app is **BackTest** (research strategies on historical Indian-equity data); **AutoTrade** and **Live Signals** are on the roadmap.

## Tech Stack
- Frontend: React 18 + TypeScript + Tailwind + Recharts
- API: Python 3.11 + FastAPI + SQLAlchemy 2 + Alembic
- Worker: Python 3.11 + pandas + yfinance
- Queue: Redis 7
- Database: PostgreSQL 16
- DB UI: pgAdmin 4 (browser, port 5050)

## Prerequisites
- Docker Desktop
- Node 18+ (for frontend development)
- Python 3.11 (for api / worker development)

## Quick Start (Docker)
1. Copy `.env.example` to `.env` and update secrets (at minimum `JWT_SECRET`, `INTERNAL_SECRET`, `ADMIN_KEY`, `POSTGRES_PASSWORD`).
2. Run:
   ```
   docker compose up --build
   ```
3. Open: http://localhost:3000

First run on an existing database — tell Alembic the schema is current (no data is touched):
```
docker exec -it backtest-backend bash -lc "cd /app && alembic stamp head"
```

## Development Mode

Start datastores + pgAdmin:
```
docker compose up postgres redis pgadmin
```

Start api (with a local `.env`):
```
cd api
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

Start frontend (Vite proxies `/api/*` to `localhost:8080`):
```
cd frontend
npm install
npm run dev
```

Start worker:
```
cd worker
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python worker_main.py
```

## Browse the DB
Open http://localhost:5050 (pgAdmin), login `admin@profitlife.com` / `admin`. The "Profit Life Postgres" connection is pre-registered — enter the Postgres password (`secret` by default) on first connect.

## How to Add a New Indicator
1. Add an entry (key, displayName, category, params) to `api/indicator_registry.INDICATORS`.
2. Add the math function to `worker/indicators.py`.
3. Handle the new key in `worker/strategy_runner.evaluate_condition`.

No other files need to change — the API auto-validates strategies against the registry and the frontend builder renders the new params from the metadata.

## API Endpoints (summary)
```
Auth:        POST /api/auth/{register, login, logout, refresh,
                            admin/register, admin/login}
Indicators:  GET  /api/indicators
Strategies:  POST/GET/PUT/DELETE /api/strategies[/{id}]
Jobs:        POST /api/backtest/run
             GET  /api/backtest/jobs[/{jobId}]
Admin:       GET  /api/admin/users
             POST /api/admin/users/{id}/approve
             DELETE /api/admin/users/{id}
             GET  /api/admin/users/{id}/strategies
             POST /api/admin/strategies/{id}/run
             GET  /api/admin/jobs/{id}
Internal:    PATCH /api/internal/jobs/{jobId}/status   (X-Internal-Secret)
             POST  /api/internal/jobs/{jobId}/results  (X-Internal-Secret)
```

Full interactive API docs: http://localhost:8080/docs (FastAPI Swagger UI).

## Frontend API URL configuration
- `frontend/.env.development` — leave `VITE_API_URL` empty so the Vite dev server proxies `/api/*` to `localhost:8080` (avoids CORS in dev).
- `frontend/.env.production` — empty by default; the docker production image uses nginx to proxy `/api/*` to the `backend` service. For a real public deployment behind a custom domain, set `VITE_API_URL=https://api.your-domain.com`.

## Project layout
```
api/         FastAPI backend (routes, models, security, alembic migrations)
worker/      Python backtest worker (BLPOPs from Redis, runs the strategy)
frontend/    React app (landing page, dashboard, admin console)
pgadmin/     pgAdmin server pre-registration
docker-compose.yml
CONTEXT.md   maintained architecture snapshot — read this when picking up work
```
