# Prompt: Immutable Transaction History & Receipts

Create a clean financial transaction history ledger table and receipt details card for **"Bellcorp Studio — ATM Simulation Application"**.

## Visual Theme:
- Light, scannable table layout with clear status badges and monospace amounts.
- Primary colors: Slate 700 `#334155`, Emerald 600 `#059669` for success, Rose 600 `#E11D48` for failed attempts.

## Layout & Components:
1. **Ledger Header:**
   - Title: "Transaction History".
   - Subtitle: "Authoritative PostgreSQL ledger recording all SUCCESS and FAILED withdrawal attempts".
   - Refresh button with counter pill showing total recorded items.

2. **Transaction Table / List Feed:**
   - **Column 1 (Date & Time):** "25 Aug 2026, 09:30 PM" (Monospace / subtle gray).
   - **Column 2 (Type & ID):** "Cash Withdrawal • ATM-01" (with withdrawal icon).
   - **Column 3 (Status Badge):**
     - `SUCCESS` (Emerald green badge: `bg-emerald-50 text-emerald-800 border-emerald-200`).
     - `FAILED` (Rose red badge: `bg-rose-50 text-rose-800 border-rose-200` with reason e.g. "INSUFFICIENT_BALANCE").
   - **Column 4 (Amount):** "- ₹1,000.00" (Bold font).
   - **Column 5 (Balance Transition):** "₹10,000.00 → ₹9,000.00" (or "₹10,000.00 → Unchanged").

3. **Receipt Modal / Drawer (Optional Detail View):**
   - Clean printable ATM receipt card with transaction reference ID, terminal ID, timestamp, dispensed notes breakdown, and remaining account balance.
