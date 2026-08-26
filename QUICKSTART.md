# �hrG� Quick Start Guide — Bellcorp Studio ATM Simulation

Welcome! This guide provides everything required to run and evaluate the **Bellcorp Studio ATM Simulation Application**.

---

## ➡ 1-Command Startup (Full Docker Mode — Recommended)

To launch the complete application stack (Frontend + Backend + PostgreSQL + MongoDB + Redis) in one command:

```bash
docker compose up --build
```

### 🌐 Access URLs:
- Frontend Client: http://localhost:5173 (or http://localhost:3000)
- Backend API: http://localhost:5000 (Healthcheck: http://localhost:5000/health)
- PostgreSQL Database: Port 5432 (`postgres://postgres:postgrespassword@localhost:5432/atm_db`)
- MongoDB Audit Database: Port 27017 (`mongodb://localhost:27017/atm_audit`)
- Redis Cache & Limiter: Port 6379 (`redis://localhost:6379`)

---

## 💻 Alternative: Local Development Mode

If you prefer running Node.js natively on your machine:

### 1. Start Database Containers:
```bash
docker compose up -d postgres mongodb redis
```

### 2. Start Backend API Server:
```bash
cd server
npm install
npm run dev
```
*(Runs on http://localhost:5000)*

### 3. Start Frontend Client (in a new terminal):
```bash
cd client
npm install
npm run dev
```
*(Runs on http://localhost:5173)*

---

## 🔑 Demo Login Credentials

Open http://localhost:5173 in your browser:

| Account Holder | Account Number | PIN | Initial Balance | Purpose |
-|---|:---:|:---:|:---:|---|
| **Demo User** | `10000001` | `1234` | **₹10,000.00** | Primary demo account (1-click login button available) |
`| **Sarah Jenkins** | `10000003` | `1234` | **₹25,000.00** | High-balance account for larger withdrawal tests |
| **Rajesh Kumar** | `10000004` | `1234` | **₹5,000.00** | Boundary testing account |
| **Concurrency Sandbox** | `10000002` | `1234` | **x��3,000.00** | Isolated sandbox for race condition testing |

---


## 🗚 How to Evaluate Key Assignment Features

### 1. The ₹3,000 Concurrency Race Condition Test (15% of Grade)
1. Log in to the application at http://localhost:5173.
2. Click the **`Concurrency Lab`** tab in the left navigation sidebar.
3. Click **`Dispatch 2x ₹2,000 Simultaneous Requests`**.
4. *Observe the result*:
   - **Request A (Thread 1)**: `Status: 200 OK` (Withdrew ₹3,000.00)
   - **Request B (Thread 2)**: `Status: 409 Conflict` (Blocked then Rejected: Insufficient Funds)
   - **Final Balance**: Strictly **₹1,000.00** (Zero Overdraft)
   - **User Account #1**: Completely isolated and untouched at ₹10,000.00.
5. Click **`Reset Sandbox (₹3,000)`** to re-run the test as many times as you like.


### 2. Redis Caching & Invalidation (10% of Grade)
- On the **Dashboard**, observe the **"Redis Cached (60s TTL)"** badge on the Available Balance card.
- Perform a cash withdrawal (e.g. ₹2,000).
- Notice that the balance updates immediately and the Redis cache is automatically invalidated (`DEL`) on write.


### 3. PostgreSQL Transaction History & Printable Receipts (20% of Grade)
- Click the **PTransactions** tab to view the immutable ledger of all successful and failed attempts.
- Click on any transaction row to inspect the monospace **ATM Receipt Slip** and click **Print Receipt**.


---


## 🗚 Run Automated Tests (Jest & Supertest)

To run the complete automated test suite (9 unit, integration, and concurrency tests):

```bash
cd server
npm test
```

Expected Output:
```
Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total (100% PASS)
```

---

## 📜 Documentation Deliverables

- **System Design Document (6-page PDF)**: [`Bellcorp_ATM_Design_Document.pdf`](./Bellcorp_ATM_Design_Document.pdf)
- **Detailed Architecture & Schema Design**: [`DESIGN.md`](./DESIGN.md)
- **GitHub Repository**: https://github.com/Nikhilgujjar27/Bellcorp-Studio-Assignment
