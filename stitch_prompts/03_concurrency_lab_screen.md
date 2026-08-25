# Prompt: Concurrency Safety Lab (Testing Sandbox Account #2)

Create an interactive Concurrency Safety Engineering Lab panel for **"Bellcorp Studio — ATM Simulation Application"**.

## Visual Theme:
- Dark slate/navy card contrast (`#0F172A`) against light terminal canvas.
- Engineering precision, metrics, timestamps, and race condition trace.

## Layout & Components:
1. **Sandbox Header Card (`bg-slate-900 text-white rounded-3xl p-6`):**
   - Header badge: "Sandbox • Account #2 (10000002)".
   - Title: "Concurrency Safety Lab".
   - Subtitle: "Live Stress Test: Real-Time ACID Mutual Exclusion (`SELECT ... FOR UPDATE`)".
   - Baseline Balance Indicator: "Initial Sandbox Balance: ₹3,000.00".

2. **Trigger Action Area:**
   - Big trigger button: "Dispatch 2x ₹2,000 Simultaneous Requests".
   - Subtitle: "Fires two parallel HTTP withdrawal requests in the same millisecond to test double-spending protection".

3. **Real-Time Outcome & Timeline Breakdown:**
   - **Request A (Green Box):** "Status: 200 OK • Withdrew ₹2,000.00 • Row Lock Acquired".
   - **Request B (Red Box):** "Status: 409 Conflict • Blocked then Rejected (Insufficient Funds)".
   - **Final Verification Badge:** "Final Balance: ₹1,000.00 (Strictly Preserved • 0 Overdraft)".
   - **Isolation Guarantee Note:** "Account #1 (Demo User) remained 100% isolated and untouched".
