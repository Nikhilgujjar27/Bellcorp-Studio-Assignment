# Bellcorp Studio — ATM Simulation Application

ATM Simulation Application developed for the Bellcorp Studio Batch 08 engineering assignment. Engineered with strict financial correctness, ACID concurrency safety using PostgreSQL row-level locks (`SELECT ... FOR UPDATE`), Redis balance caching and rate limiting, MongoDB audit logging, and a responsive React + Vite frontend.

---

## Key System Highlights

- **PostgreSQL 15 Row-Level Locking**: Protects account and ATM cash balances with ACID transactions (`SELECT ... FOR UPDATE`), eliminating race conditions and double-spending.
- **Concurrency Test Verification**: Includes automated test suites and an interactive UI test lab demonstrating two simultaneous ₹2,000 withdrawal requests against a ₹3,000 balance—guaranteeing exactly 1 success, 1 failure, and a final balance of ₹1,000 (never ₹-1,000), with ATM cash deducted by exactly ₹2,000.
- **Account State Isolation**: Uses dedicated Account #2 as an isolated Concurrency Sandbox so that running concurrency tests never corrupts or overwrites the normal user account (Account #1).
- **Redis 7 Caching & Invalidation**: Caches balance queries with a 60-second TTL and automatically invalidates cache via `DEL` upon successful cash withdrawal.
- **Redis Rate Limiting**: Protects `POST /api/withdraw` (10 requests/min) with fail-open resiliency if Redis is unreachable.
- **MongoDB 6 Audit Trail**: Asynchronously records immutable audit logs for compliance without blocking financial transactions.
- **Modern React Dashboard**: Restrained fintech interface with 1-click demo credentials, live balance, ATM vault status, denomination pills, transaction history, and live concurrency test runner.
- **9/9 Automated Tests Passing**: Complete unit, integration, and concurrency test suites passing.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons | Responsive ATM Terminal Interface |
| **Backend** | Node.js, Express.js, TypeScript, Zod | RESTful API & Transaction Manager |
| **Primary Database** | PostgreSQL 15 (Docker) | Source of Truth for Accounts, ATM Vault & Financial Ledger |
| **Secondary Database** | MongoDB 6.0 (Docker) | Immutable Audit & Activity Logging |
| **Cache & Limiter** | Redis 7 (Docker) | Balance Caching (60s TTL) & Rate Limiting |
| **Testing** | Jest, Supertest, ts-jest, pg-mem | Automated Unit, Integration & Concurrency Test Suites |
| **Infrastructure** | Docker & Docker Compose | Containerized local infrastructure |

> **Testing Note**: Unit tests in Jest utilize an in-memory SQL mock (`pg-mem`) for sub-second isolated execution, while live integration and server concurrency endpoints execute directly against real PostgreSQL 15 with native `SELECT ... FOR UPDATE` row locks.

---

## Account Architecture & Test Credentials

The database is seeded with two distinct accounts to isolate normal banking transactions from concurrency stress testing:

| Field | Account #1 (Demo User) | Account #2 (Concurrency Sandbox) |
|---|---|---|
| **Account Number** | `10000001` | `10000002` |
| **Holder Name** | `Demo User` | `Concurrency Sandbox` |
| **PIN** | `1234` | `1234` (Internal) |
| **Initial / Reset Balance** | `₹10,000.00` | `₹3,000.00` |
| **Purpose** | Normal ATM user interactions (log in, ₹1,000 withdrawals, balance checks, transaction history) | Dedicated testing sandbox for live concurrency validation |
| **Login Access** | User-facing login via PIN | Internal development/testing account only (not a user login) |

---

## Reset Demo State Semantics

Clicking **Reset Demo State** (or calling `POST /api/dev/reset-seed`) restores the application to baseline demonstration values:

- **Account #1 (Demo User)** balance is restored to **₹10,000.00**.
- **Account #2 (Concurrency Sandbox)** balance is restored to **₹3,000.00**.
- **ATM #1 (Vault Reservoir)** cash is restored to **₹50,000.00**.
- **Redis Caches** for Account #1 and Account #2 are invalidated.

### Immutable Financial Ledger
Reset Demo State **does NOT delete or truncate historical transactions or MongoDB audit logs**. Past successful and failed withdrawal attempts remain permanently recorded in the database to maintain financial audit integrity.

---

## Quick Start Guide

### Prerequisites
- [Node.js (v18+)](https://nodejs.org/) and `npm`
- [Docker Desktop](https://www.docker.com/) (Recommended official infrastructure)

---

### Step 1: Start Infrastructure with Docker Compose

Start the official PostgreSQL 15, MongoDB 6.0, and Redis 7 containers:
```bash
docker compose up -d
```

Verify that all containers are healthy:
```bash
docker compose ps
```

---

### Step 2: Install Dependencies

From the project root:
```bash
npm run install:all
```
*(or run `npm install` inside both `server/` and `client/` directories)*.

---

### Step 3: Run Database Migration & Seed

Apply the PostgreSQL schema and seed Account #1 (₹10,000), Account #2 (₹3,000), and ATM #1 (₹50,000):
```bash
cd server
npm run seed
```

---

### Step 4: Start Backend Server

```bash
cd server
npm run dev
```
The backend starts on `http://localhost:5000`.

---

### Step 5: Start Frontend Client

In a separate terminal:
```bash
cd client
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Environment Configuration

Configuration is located in `server/.env` (and documented in `server/.env.example`):

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/atm_db
MONGODB_URI=mongodb://localhost:27017/atm_audit_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_jwt_key_atm_simulation_2026_dev_prod
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=10
BALANCE_CACHE_TTL_SECONDS=60
```

---

## Automated Testing & Concurrency Verification

### Run Complete Test Suite (9 Tests)
```bash
cd server
npm test
```

### Run Concurrency Test Suite Only
```bash
cd server
npm run test:concurrency
```

### The Critical Concurrency Scenario
```
Target Account = Sandbox Account #2 (Initial Balance: ₹3,000.00)
Request A = ₹2,000.00 (Sent concurrently via Promise.all)
Request B = ₹2,000.00 (Sent concurrently via Promise.all)

Expected & Verified Outcomes:
  - Success Count: 1 (HTTP 200) -> Deducts ₹2,000.00
  - Failure Count: 1 (HTTP 409 INSUFFICIENT_BALANCE)
  - Final Sandbox Balance: Strictly ₹1,000.00 (Overdraft prevented by row lock)
  - ATM Cash Deducted: Exactly ₹2,000.00 (₹50,000.00 -> ₹48,000.00)
  - Account #1 Balance: Strictly unaffected (100% isolated)
```

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/login`
  - Body: `{ "accountNumber": "10000001", "pin": "1234" }`
  - Response: `{ "success": true, "data": { "token": "...", "account": { ... } } }`

### Financial Operations
- `GET /api/account/balance` *(Bearer Token required)*
  - Response: `{ "success": true, "data": { "balance": 10000, "isCached": true, "account": { ... } } }`
- `POST /api/withdraw` *(Bearer Token required, Rate limited)*
  - Body: `{ "amount": 2000, "atmId": 1 }`
  - Response: `{ "success": true, "data": { "withdrawalId": 1, "amount": 2000, "balanceBefore": 10000, "balanceAfter": 8000, "status": "SUCCESS" } }`
- `GET /api/transactions` *(Bearer Token required)*
  - Response: `{ "success": true, "data": [ ...transactions ] }`
- `GET /api/atm/status`
  - Response: `{ "success": true, "data": { "id": 1, "availableCash": 50000 } }`

### Developer & Testing Tools (Dev Only — 404 in Production)
- `POST /api/dev/concurrency-test` - Runs real parallel ₹2,000 withdrawals on Account #2 and returns the execution report.
- `POST /api/dev/reset-seed` - Resets Account #1 (₹10k), Account #2 (₹3k), and ATM (₹50k), and clears Redis cache without deleting transaction history.
- `GET /api/dev/audit-logs` - Inspects MongoDB activity logs collection.

### Health Check
- `GET /health` - Server health check endpoint (`{ "status": "ok" }`).

---

## Concurrency Strategy Explained

```sql
BEGIN;
SELECT id, balance FROM accounts WHERE id = $1 FOR UPDATE;
SELECT id, available_cash FROM atm WHERE id = $2 FOR UPDATE;

-- Application checks:
-- If balance < amount -> INSERT FAILED ledger record -> COMMIT -> return 409 INSUFFICIENT_BALANCE
-- If atmCash < amount -> INSERT FAILED ledger record -> COMMIT -> return 409 ATM_CASH_UNAVAILABLE

UPDATE accounts SET balance = balance - $amount WHERE id = $1;
UPDATE atm SET available_cash = available_cash - $amount WHERE id = $2;
INSERT INTO withdrawals (account_id, atm_id, amount, status, balance_before, balance_after) VALUES (...);

COMMIT;
```

1. **`SELECT ... FOR UPDATE`** places an exclusive row-level lock on the target account row.
2. Concurrent requests targeting the same account row are placed in a wait state at the PostgreSQL database engine level.
3. The first request decrements the balance, logs the success record, and commits.
4. The second request unblocks, reads the committed new balance, fails the balance check, permanently inserts a `FAILED` record with reason `INSUFFICIENT_BALANCE`, commits the ledger transaction, and returns `409 Conflict`.
5. Post-commit cache invalidation hook removes `atm:balance:<id>` from Redis, ensuring subsequent reads immediately query PostgreSQL for the updated balance.

---

## License
MIT
