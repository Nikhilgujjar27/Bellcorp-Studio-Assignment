# Prompt: ATM Banking Dashboard & Cash Withdrawal

Create a modern ATM Banking Terminal dashboard for **"Bellcorp Studio — ATM Simulation Application"**.

## Visual Theme:
- Light fintech UI with high clarity and contrast.
- Colors: Slate 900 `#0F172A`, Blue 600 `#2563EB`, Emerald 600 `#059669`, Background `#F8FAFC`.

## Layout & Components:
1. **Top Navigation Bar:**
   - Brand logo with shield icon: "ATM Simulation" + "Bellcorp Studio" badge.
   - Live system status pill: Green pulsing dot + "Operational".
   - User account tag: "Demo User (10000001)".
   - Logout button in soft rose red pill style.

2. **Metrics Section (2-Column Cards):**
   - **Card 1 (Account Balance):**
     - Label: "Available Account Balance".
     - Large number: "₹10,000.00".
     - Badge: "Redis Cached (60s TTL)".
     - Subtext: "Account #10000001 • Demo User".
   - **Card 2 (ATM Vault Cash):**
     - Label: "ATM Vault Available Cash".
     - Large number: "₹50,000.00".
     - Status: "Vault Operational • Dispenser Ready".
     - Subtext: "Terminal ID: ATM-01".

3. **Cash Withdrawal Panel (Central Action Area):**
   - Heading: "Fast Cash Withdrawal".
   - **Denomination Selector Pills (Clickable Grid):**
     - ₹500, ₹1,000, ₹2,000, ₹5,000, ₹10,000.
   - **Custom Amount Field:** Number input with "₹" prefix.
   - **Primary Action Button:** "Dispense Cash" (`bg-blue-600 hover:bg-blue-700 text-white rounded-2xl`).
   - **Secondary Reset Button:** "Reset Demo State" (Refresh icon, resets balances to ₹10k/₹50k without deleting history).
