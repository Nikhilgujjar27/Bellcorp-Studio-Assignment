---
name: Bellcorp Studio ATM Simulation
colors:
  surface: '#F8FAFC'
  surface-dim: '#E2E8F0'
  surface-bright: '#FFFFFF'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F1F5F9'
  surface-container: '#E2E8F0'
  surface-container-high: '#CBD5E1'
  surface-container-highest: '#94A3B8'
  on-surface: '#0F172A'
  on-surface-variant: '#475569'
  inverse-surface: '#0F172A'
  inverse-on-surface: '#F8FAFC'
  outline: '#CBD5E1'
  outline-variant: '#E2E8F0'
  surface-tint: '#2563EB'
  primary: '#2563EB'
  on-primary: '#FFFFFF'
  primary-container: '#EFF6FF'
  on-primary-container: '#1E40AF'
  inverse-primary: '#93C5FD'
  secondary: '#0F172A'
  on-secondary: '#FFFFFF'
  secondary-container: '#F1F5F9'
  on-secondary-container: '#334155'
  tertiary: '#059669'
  on-tertiary: '#FFFFFF'
  tertiary-container: '#ECFDF5'
  on-tertiary-container: '#065F46'
  error: '#DC2626'
  on-error: '#FFFFFF'
  error-container: '#FEF2F2'
  on-error-container: '#991B1B'
  background: '#F8FAFC'
  on-background: '#0F172A'
  surface-variant: '#F1F5F9'
  bg-canvas: '#F8FAFC'
  bg-surface-subtle: '#F1F5F9'
  bg-dark-canvas: '#0F172A'
  text-secondary: '#334155'
  text-muted: '#64748B'
  text-placeholder: '#94A3B8'
  brand-hover: '#1D4ED8'
  brand-active: '#1E40AF'
  brand-tint: '#EFF6FF'
  brand-border: '#BFDBFE'
  status-success-text: '#065F46'
  status-success-bg: '#ECFDF5'
  status-success-border: '#A7F3D0'
  status-fail-text: '#991B1B'
  status-fail-bg: '#FEF2F2'
  status-fail-border: '#FECACA'
typography:
  text-hero:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  text-h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.015em
  text-h2:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  text-body:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  text-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
  text-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.02em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.4'
rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-1: 4px
  space-2: 8px
  space-3: 12px
  space-4: 16px
  space-6: 24px
  space-8: 32px
---

# Bellcorp Studio — ATM Simulation UI Design Specification

A clean, modern, restrained fintech terminal design system for the Bellcorp Studio Batch 08 ATM Simulation Application.

---

## 📱 Screen 1: Secure ATM Login Terminal

### Design Objective
A high-trust, centered authentication card for bank account holders to enter their Account Number and 4-digit PIN.

### Key Visual Components
1. **Brand Eyebrow & Header**:
   - Centered blue shield security icon inside a rounded pill (`bg-blue-50 border-blue-200`).
   - Eyebrow badge: `Bellcorp Studio • Batch 08`.
   - Title: `ATM Simulation Application`.
   - Subtitle: `Enter your account credentials to begin your secure session`.
2. **Elevated Form Card (`bg-white rounded-3xl border-slate-200 shadow-xl`)**:
   - **Account Number Field**: Numeric input with bank card icon, defaulting/pre-filling `10000001`.
   - **Secure PIN Field**: Masked password input with lock icon.
   - **Sign In Securely Button**: Primary bold blue CTA (`bg-blue-600 hover:bg-blue-700 text-white rounded-2xl`).
   - **One-Click Demo Button**: Soft outlined helper button (`bg-blue-50 text-blue-700 border-blue-200 rounded-2xl`) saying `Use Demo Account (10000001 / 1234)`.
3. **Security Footnote**:
   - `256-bit Encrypted Session • Concurrency-Safe PostgreSQL Engine`.

---

## 💳 Screen 2: ATM Dashboard & Quick Cash Withdrawal

### Design Objective
The main banking terminal dashboard displaying live account balance, physical ATM vault cash, quick denomination selectors, custom withdrawal input, and system control actions.

### Key Visual Components
1. **Top Navigation Bar**:
   - Logo: `ATM Simulation` with `Bellcorp Studio` badge.
   - Operational Status Pill: Pulsing green dot with `Operational`.
   - User Profile Pill: `Demo User (10000001)`.
   - Logout button in soft rose styling.
2. **Metric Summary Grid (2-Column)**:
   - **Card 1: Available Account Balance**:
     - Large typography: `₹10,000.00`.
     - Subtext: `Account #10000001 • Demo User`.
     - Cache Badge: `Redis Cached (60s TTL)` or `Fresh DB Read`.
   - **Card 2: Physical ATM Vault Available Cash**:
     - Large typography: `₹50,000.00`.
     - Subtext: `ATM Machine ID: #1`.
     - Status: `Vault Operational • Dispenser Ready`.
3. **Withdrawal Action Panel (`bg-white rounded-3xl border-slate-200`)**:
   - **Section Heading**: `Cash Withdrawal`.
   - **Quick Denomination Pills**: Grid of clickable amount buttons:
     - `₹500`, `₹1,000`, `₹2,000`, `₹5,000`, `₹10,000`.
   - **Custom Amount Field**: Number input with `₹` currency prefix.
   - **Primary Action**: `Dispense Cash` button.
   - **Reset Demo State Button**: Outlined button with refresh icon to restore baseline balances without clearing history.

---

## ⚡ Screen 3: Concurrency Safety Lab (Account #2 Sandbox)

### Design Objective
An interactive engineering laboratory showcasing deterministic ACID concurrency control against real PostgreSQL row-level locks.

### Key Visual Components
1. **Sandbox Header Card (`bg-slate-900 text-white rounded-3xl`)**:
   - Badge: `Testing Sandbox • Account #2 (10000002)`.
   - Title: `Concurrency Safety Lab`.
   - Baseline Balance: `₹3,000.00`.
   - Stress Scenario: `Dispatches 2x simultaneous ₹2,000.00 withdrawal requests in parallel`.
2. **Interactive Action CTA**:
   - Button: `Trigger 2x ₹2,000 Concurrent Withdrawals`.
3. **Live Execution Timeline & Outcome Grid**:
   - **Request A Card**: `SUCCESS (200 OK) • Withdrew ₹2,000.00`.
   - **Request B Card**: `FAILED (409 Conflict) • Insufficient Funds`.
   - **Final Sandbox Balance Badge**: Strictly `₹1,000.00` (Proof of zero double-spending).
   - **State Isolation Confirmation**: Account #1 (Demo User) remained untouched.

---

## 📜 Screen 4: Transaction History & Receipts Ledger

### Design Objective
A paginated, immutable financial ledger showing both successful disbursements and failed attempts with transparent error reasons.

### Key Visual Components
1. **Ledger Header & Filter Controls**:
   - Title: `Recent Transaction History`.
   - Badge: `PostgreSQL Immutable Source of Truth`.
2. **Transaction Table / Card Feed**:
   - **Timestamp**: `25 Aug 2026, 09:30 PM`.
   - **Amount & Flow**: `- ₹1,000.00` (Bold).
   - **Status Badges**:
     - `SUCCESS` (Emerald green badge).
     - `FAILED` (Rose red badge with reason tooltip, e.g. `INSUFFICIENT_BALANCE` or `ATM_CASH_UNAVAILABLE`).
   - **Balance Transition**: `₹10,000.00 → ₹9,000.00` (or `₹10,000.00 → Unchanged`).
3. **Empty / Pagination State**:
   - Clean pagination controls (`Showing 1–10 of X transactions`).
