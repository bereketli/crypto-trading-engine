# Berko — Crypto Trading Engine

A production-style cryptocurrency exchange backend and dashboard, built as an educational project inspired by Binance. FastAPI + PostgreSQL on the backend, Next.js on the frontend — no real cryptocurrency, blockchain, or fiat involved anywhere.

> **Disclaimer:** This project is for educational and practice purposes only. It simulates the backend of a crypto exchange and does not handle real cryptocurrency, blockchain transactions, or fiat payments.

## Screenshots

| Dashboard | Markets |
|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Markets](docs/screenshots/markets.png) |

| Trading | Settings |
|---|---|
| ![Trading](docs/screenshots/trading.png) | ![Settings](docs/screenshots/settings.png) |

All prices, sparklines, and 24h stats shown above are computed live from rows in PostgreSQL — nothing on screen is hardcoded.

## What's built so far

| Area | Status |
|---|---|
| Auth (register, login, refresh, logout, change password) | ✅ |
| User profiles, KYC self-service | ✅ |
| Admin user management (list/search/filter, role & KYC control) | ✅ |
| Wallets, portfolio valuation, transaction ledger | ✅ (read-only) |
| Market data (tickers, 24h stats, sparklines, recent trades) | ✅ (read-only) |
| Order placement & matching engine | ⏳ not yet implemented |
| Deposits / withdrawals | ⏳ not yet implemented |
| WebSockets, Redis, Kafka | ⏳ not yet implemented |

See [docuemnt.txt](docuemnt.txt) for the full original spec and phased roadmap.

## Tech stack

**Backend**
- Python 3.11+, FastAPI, Uvicorn
- SQLAlchemy 2.0 (async, `psycopg` v3 driver) + Alembic migrations
- PostgreSQL — `NUMERIC(36,18)` everywhere money is involved, native enum types, DB-level `CHECK` constraints
- JWT access tokens + hashed, rotating, single-use refresh tokens
- Argon2 password hashing (via `passlib`)

**Frontend**
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 — custom mint/slate-green theme, no UI kit
- No client-side state library — a small `fetch` wrapper + React context handles auth and token refresh

## Project structure

```
app/
├── api/            # FastAPI routers — HTTP concerns only
├── auth/           # Password hashing, JWT, get_current_user dependency
├── config/         # Pydantic settings (reads .env)
├── database/       # SQLAlchemy engine, session, declarative base
├── models/         # ORM tables (users, wallets, orders, trades, transactions, ...)
├── repositories/   # Raw DB queries — no business logic
├── schemas/        # Pydantic request/response models
├── services/       # Business logic — no HTTP or raw SQL knowledge
└── main.py

alembic/            # DB migrations
scripts/seed.py     # Demo data generator (see below)
frontend/src/
├── app/            # One folder per route (dashboard, markets, trading, ...)
├── components/     # Sidebar, Topbar, charts, shared UI primitives
└── lib/            # API client, auth context, formatting helpers
```

Each backend layer only talks to the layer directly below it: routers call services, services call repositories, repositories touch the database. Services raise plain Python exceptions (`InvalidCredentialsError`, `UserNotFoundError`, ...); only the API layer translates those into HTTP responses.

## Getting started

### Prerequisites

- Python 3.11+ with a virtualenv
- PostgreSQL running locally (no Docker required — see `docker-compose.yml` if you'd rather containerize it)
- Node.js 20+ (Next.js 16 requires ≥18.17; this repo has been run against Node 22)

### 1. Backend

```bash
# from the repo root
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a database and point `.env` at it:

```bash
createdb crypto_trading_engine
cp .env.example .env   # then edit DATABASE_URL / SECRET_KEY as needed
```

`.env` needs at minimum:

```
SECRET_KEY=change-me
DATABASE_URL=postgresql+psycopg://postgres:PASSWORD@localhost:5432/crypto_trading_engine
SYNC_DATABASE_URL=postgresql+psycopg2://postgres:PASSWORD@localhost:5432/crypto_trading_engine  # used by Alembic
```

Create the tables and load demo data in one step:

```bash
python -m scripts.seed --reset
```

This creates every table (via SQLAlchemy metadata) and populates:
- 8 users spanning every KYC/active state (see table below)
- 11 assets, 9 trading pairs
- 17 wallets with realistic balances
- ~435 trades of generated 24h price history (so tickers/sparklines/charts have real data)
- Sample orders (open, partially filled, cancelled, filled) and a transaction ledger

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:8000
npm run dev
```

Open `http://localhost:3000`.

### Demo accounts

Every seeded user shares the password `Password123!`.

| Email | Role | KYC status | Active |
|---|---|---|---|
| admin@cryptoengine.dev | admin | verified | ✅ |
| alice@example.com | user | verified | ✅ |
| bob@example.com | user | verified | ✅ |
| carol@example.com | user | pending | ✅ |
| dave@example.com | user | unverified | ✅ |
| erin@example.com | user | rejected | ✅ |
| frank@example.com | user | unverified | ❌ disabled |
| grace@example.com | user | verified | ✅ |

Log in as `admin@cryptoengine.dev` to see the **Users** section in the sidebar.

## API overview

```
Auth
  POST   /auth/register
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout
  POST   /auth/change-password

Users
  GET    /users/me
  PUT    /users/me
  POST   /users/me/kyc
  GET    /users                 (admin — search, filter, paginate)
  GET    /users/{id}            (admin)
  PATCH  /users/{id}            (admin — role, kyc_status, is_active, is_verified)

Wallets (authenticated)
  GET    /wallets
  GET    /wallets/{asset}
  GET    /wallets/portfolio     (balances valued at last traded price)
  GET    /wallets/transactions

Market (public)
  GET    /market/assets
  GET    /market/tickers        (24h stats computed from the trades table)
  GET    /market/tickers/{symbol}
  GET    /market/trades/{symbol}
```

Full schemas and a "Try it out" console are at `/docs`.

## Security notes

- Passwords are hashed with Argon2, never stored or logged in plaintext.
- Refresh tokens are opaque random strings; only their SHA-256 hash is persisted. They rotate (single-use) on every `/auth/refresh` call.
- Disabling a user via the admin panel immediately revokes all of that user's refresh tokens.
- An admin cannot demote or disable their own account, and the system always keeps at least one active admin — both enforced server-side, not just in the UI.
- CORS is restricted to the configured frontend origin(s) (`cors_origins` in `app/config/settings.py`).

## Re-seeding

The seed script is idempotent by natural key (re-running it updates existing rows rather than duplicating them) and supports a clean slate:

```bash
python -m scripts.seed --reset
```

## Attribution

Built with [Claude Code](https://claude.com/claude-code).
