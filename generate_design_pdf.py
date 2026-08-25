import os
import sys
import pymupdf
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# ----------------------------------------------------------------------
# 1. Register TrueType Fonts for Unicode Rupee (₹) & Clean Typography
# ----------------------------------------------------------------------
pdfmetrics.registerFont(TTFont('SegoeUI', 'C:/Windows/Fonts/segoeui.ttf'))
pdfmetrics.registerFont(TTFont('SegoeUI-Bold', 'C:/Windows/Fonts/segoeuib.ttf'))
pdfmetrics.registerFont(TTFont('SegoeUI-Italic', 'C:/Windows/Fonts/segoeuii.ttf'))
pdfmetrics.registerFont(TTFont('Consolas', 'C:/Windows/Fonts/consola.ttf'))
pdfmetrics.registerFont(TTFont('Consolas-Bold', 'C:/Windows/Fonts/consolab.ttf'))

# ----------------------------------------------------------------------
# 2. Numbered Canvas for Running Headers & Dynamic Page Numbers
# ----------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont('SegoeUI', 8)
        self.setFillColor(colors.HexColor('#64748B'))

        # Running Header (on pages after page 1)
        if self._pageNumber > 1:
            self.drawString(36, 810, "Bellcorp Studio • ATM Simulation Application — System Design Document")
            self.setStrokeColor(colors.HexColor('#CBD5E1'))
            self.setLineWidth(0.5)
            self.line(36, 804, 559, 804)

        # Running Footer (on all pages)
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.5)
        self.line(36, 34, 559, 34)
        
        self.drawString(36, 22, "BELLCORP STUDIO ASSIGNMENT SUBMISSION")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(559, 22, page_str)
        self.restoreState()

# ----------------------------------------------------------------------
# 3. Document Builder
# ----------------------------------------------------------------------
def build_pdf():
    pdf_filename = "Bellcorp_ATM_Design_Document.pdf"
    
    # Printable area: A4 is 595.27 x 841.89 pt. Margin: 36pt (width = 523.27 pt)
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=44,
        bottomMargin=44
    )

    # Professional Palette
    C_PRIMARY = colors.HexColor('#0F172A')   # Slate 900
    C_SECONDARY = colors.HexColor('#1E3A8A') # Blue 900
    C_ACCENT = colors.HexColor('#2563EB')    # Blue 600
    C_TEXT = colors.HexColor('#334155')      # Slate 700
    C_MUTED = colors.HexColor('#64748B')     # Slate 500
    C_BG_LIGHT = colors.HexColor('#F8FAFC')  # Slate 50
    C_BG_BLUE = colors.HexColor('#EFF6FF')   # Blue 50
    C_BORDER = colors.HexColor('#CBD5E1')    # Slate 300
    C_SUCCESS = colors.HexColor('#065F46')   # Emerald 800
    C_SUCCESS_BG = colors.HexColor('#ECFDF5')# Emerald 50

    # Typography Styles
    styles = getSampleStyleSheet()
    
    style_doc_title = ParagraphStyle(
        'DocTitle',
        fontName='SegoeUI-Bold',
        fontSize=18,
        leading=22,
        textColor=C_PRIMARY,
        spaceAfter=3
    )
    
    style_doc_subtitle = ParagraphStyle(
        'DocSubtitle',
        fontName='SegoeUI',
        fontSize=10,
        leading=13,
        textColor=C_ACCENT,
        spaceAfter=10
    )

    style_h1 = ParagraphStyle(
        'H1',
        fontName='SegoeUI-Bold',
        fontSize=11.5,
        leading=15,
        textColor=C_PRIMARY,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'H2',
        fontName='SegoeUI-Bold',
        fontSize=9.5,
        leading=13,
        textColor=C_SECONDARY,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'Body',
        fontName='SegoeUI',
        fontSize=8.5,
        leading=11.8,
        textColor=C_TEXT,
        spaceAfter=5
    )

    style_bullet = ParagraphStyle(
        'Bullet',
        fontName='SegoeUI',
        fontSize=8.2,
        leading=11.5,
        textColor=C_TEXT,
        leftIndent=10,
        firstLineIndent=-6,
        spaceAfter=2.5
    )

    style_code_block = ParagraphStyle(
        'CodeBlock',
        fontName='Consolas',
        fontSize=7.2,
        leading=9.5,
        textColor=colors.HexColor('#0F172A'),
        backColor=C_BG_LIGHT,
        borderColor=C_BORDER,
        borderWidth=0.5,
        borderPadding=5,
        spaceBefore=3,
        spaceAfter=5
    )

    style_th = ParagraphStyle(
        'TableHeader',
        fontName='SegoeUI-Bold',
        fontSize=7.8,
        leading=10,
        textColor=colors.white
    )

    style_td = ParagraphStyle(
        'TableCell',
        fontName='SegoeUI',
        fontSize=7.8,
        leading=10.5,
        textColor=C_TEXT
    )

    style_td_bold = ParagraphStyle(
        'TableCellBold',
        fontName='SegoeUI-Bold',
        fontSize=7.8,
        leading=10.5,
        textColor=C_PRIMARY
    )

    style_td_code = ParagraphStyle(
        'TableCellCode',
        fontName='Consolas',
        fontSize=7.2,
        leading=9.5,
        textColor=C_SECONDARY
    )

    story = []

    # ==================================================================
    # PAGE 1: TITLE, METADATA, PROBLEM UNDERSTANDING, HLD
    # ==================================================================
    story.append(Paragraph("Bellcorp Studio — ATM Simulation Application", style_doc_title))
    story.append(Paragraph("System Design Document • ACID Concurrency Control & Engineering Specification", style_doc_subtitle))
    
    meta_data = [
        [
            Paragraph("<b>Application:</b> ATM Simulation Application", style_td),
            Paragraph("<b>Stack:</b> React 18 • Node/Express (TS) • PostgreSQL 15 • Redis 7 • MongoDB 6.0", style_td),
        ],
        [
            Paragraph("<b>Assignment:</b> Bellcorp Studio Batch 08", style_td),
            Paragraph("<b>Verification:</b> 9/9 Automated Tests PASS • Docker Services Verified • Concurrency Verified", style_td),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[180, 343.27])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_BG_BLUE),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#93C5FD')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("1. Problem Understanding & Concurrency Challenge", style_h1))
    story.append(Paragraph(
        "An Automated Teller Machine (ATM) executes financial transactions where account balances "
        "and physical vault inventory must remain strictly consistent and never become negative under concurrent traffic. "
        "The system supports complete banking workflows: secure PIN authentication, live balance inquiries, cash withdrawals, "
        "immutable transaction history lookup, and vault cash monitoring.",
        style_body
    ))
    story.append(Paragraph("<b>Concurrency Race Condition:</b>", style_h2))
    story.append(Paragraph(
        "Consider an account holding <b>₹3,000.00</b> that receives two simultaneous withdrawal requests of "
        "<b>₹2,000.00</b> (Request A and Request B) within the same millisecond:",
        style_body
    ))
    story.append(Paragraph("• <b>Without Concurrency Control (Naive Architecture):</b> Both requests read ₹3,000, both pass balance threshold checks (₹3,000 ≥ ₹2,000), and both commit deductions. The final balance drops to <b>₹-1,000.00</b>, causing an illegal overdraft and direct financial loss.", style_bullet))
    story.append(Paragraph("• <b>Our ACID Solution (Pessimistic Row-Level Locking):</b> Native PostgreSQL <code>SELECT ... FOR UPDATE</code> locks serialize execution at the database engine level. Request A acquires the lock, validates funds, deducts ₹2,000.00, and commits (leaving ₹1,000.00). Request B unblocks, reads the committed ₹1,000.00, fails validation (₹1,000 &lt; ₹2,000), commits a permanent <code>FAILED</code> record in the ledger with reason <code>INSUFFICIENT_BALANCE</code>, and returns <code>HTTP 409 Conflict</code>. Final balance is strictly <b>₹1,000.00</b>.", style_bullet))
    story.append(Spacer(1, 4))

    story.append(Paragraph("2. High-Level Architecture & Storage Separation", style_h1))
    story.append(Paragraph(
        "The application employs a decoupled, multi-tiered architecture strictly separating transactional consistency from auxiliary concerns:",
        style_body
    ))

    arch_rows = [
        [Paragraph("Tier / Technology", style_th), Paragraph("Role & Architectural Responsibility", style_th), Paragraph("Consistency & Failure Behavior", style_th)],
        [
            Paragraph("<b>Frontend Tier</b><br/>React 18 + Vite + TypeScript", style_td),
            Paragraph("Responsive banking terminal dashboard, quick denomination pills, live transaction ledger, and real-time Concurrency Safety Lab.", style_td),
            Paragraph("Stateless client consuming REST APIs with JWT Bearer authentication.", style_td)
        ],
        [
            Paragraph("<b>Backend API</b><br/>Node.js + Express (TS)", style_td),
            Paragraph("RESTful API gateway, Zod input validation, JWT verification, rate limiting, and ACID transaction orchestrator.", style_td),
            Paragraph("Stateless Node.js processes easily scaled horizontally behind load balancers.", style_td)
        ],
        [
            Paragraph("<b>Primary DB</b><br/>PostgreSQL 15 (Docker)", style_td),
            Paragraph("<b>Authoritative Financial Source of Truth:</b> Manages <code>accounts</code>, <code>atm</code> vault, and <code>withdrawals</code> ledger.", style_td),
            Paragraph("Strict ACID compliance, native <code>SELECT FOR UPDATE</code> row locks, and <code>CHECK (balance &gt;= 0)</code> constraints.", style_td)
        ],
        [
            Paragraph("<b>Cache Layer</b><br/>Redis 7 (Docker)", style_td),
            Paragraph("High-speed read cache for balance queries (<code>atm:balance:&lt;id&gt;</code>, 60s TTL) and sliding-window rate limiter (10 req/min).", style_td),
            Paragraph("Cache-aside with instant <code>DEL</code> invalidation on commit. Transparent fallback to PostgreSQL on Redis outage.", style_td)
        ],
        [
            Paragraph("<b>Audit Store</b><br/>MongoDB 6.0 (Docker)", style_td),
            Paragraph("Audit event store capturing asynchronous activity and compliance events (<code>WITHDRAWAL_SUCCESS</code>, <code>WITHDRAWAL_FAILED</code>, etc.).", style_td),
            Paragraph("Asynchronous, non-blocking post-commit emission. MongoDB failure never rolls back committed financial transactions.", style_td)
        ],
    ]
    arch_table = Table(arch_rows, colWidths=[105, 225, 193.27])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
    ]))
    story.append(arch_table)

    story.append(PageBreak())

    # ==================================================================
    # PAGE 2: TWO-ACCOUNT ARCHITECTURE & DATABASE SCHEMA
    # ==================================================================
    story.append(Paragraph("3. Two-Account Architecture & State Isolation", style_h1))
    story.append(Paragraph(
        "To guarantee that real database concurrency demonstrations never corrupt normal user banking sessions, "
        "the database is seeded with a deterministic two-account model:",
        style_body
    ))

    acc_rows = [
        [Paragraph("Property", style_th), Paragraph("Account #1 (Demo User)", style_th), Paragraph("Account #2 (Concurrency Sandbox)", style_th)],
        [Paragraph("<b>Account Number</b>", style_td), Paragraph("<code>10000001</code>", style_td_code), Paragraph("<code>10000002</code>", style_td_code)],
        [Paragraph("<b>Holder Name</b>", style_td), Paragraph("Demo User", style_td), Paragraph("Concurrency Sandbox", style_td)],
        [Paragraph("<b>Baseline Balance</b>", style_td), Paragraph("<b>₹10,000.00</b>", style_td), Paragraph("<b>₹3,000.00</b>", style_td)],
        [Paragraph("<b>Primary Purpose</b>", style_td), Paragraph("Standard banking operations (login, ₹1,000 withdrawals, balance checks, transaction history)", style_td), Paragraph("Dedicated sandbox for live concurrent stress testing (2x ₹2,000 simultaneous calls)", style_td)],
        [Paragraph("<b>User Access</b>", style_td), Paragraph("User-facing PIN authentication (<code>1234</code>)", style_td), Paragraph("Internal test account only; no user login flow", style_td)],
        [Paragraph("<b>Runtime Isolation</b>", style_td), Paragraph("Balance updates dynamically on user actions (e.g. ₹10,000 → ₹9,000)", style_td), Paragraph("Concurrency test executes real row locks against Account #2 without affecting Account #1", style_td)],
    ]
    acc_table = Table(acc_rows, colWidths=[95, 214.13, 214.13])
    acc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
    ]))
    story.append(acc_table)
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Real Database Execution Guarantee:</b> The Concurrency Safety Lab dispatches real parallel HTTP requests executing <code>WithdrawalService.withdraw</code> with native PostgreSQL <code>SELECT ... FOR UPDATE</code> row locks. It is not an animation or simulated mock.", style_body))
    story.append(Spacer(1, 4))

    story.append(Paragraph("4. Database Schema & Index Design", style_h1))
    story.append(Paragraph(
        "PostgreSQL 15 serves as the single transactional source of truth. Integrity is enforced via foreign keys and database constraints.",
        style_body
    ))
    
    sql_code = (
        "-- 1. Accounts Table\n"
        "CREATE TABLE accounts (\n"
        "    id SERIAL PRIMARY KEY,\n"
        "    account_number VARCHAR(20) UNIQUE NOT NULL,\n"
        "    holder_name VARCHAR(100) NOT NULL,\n"
        "    pin_hash VARCHAR(255) NOT NULL,\n"
        "    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),\n"
        "    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n"
        "    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n"
        ");\n\n"
        "-- 2. ATM Vault Inventory Table\n"
        "CREATE TABLE atm (\n"
        "    id SERIAL PRIMARY KEY,\n"
        "    available_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (available_cash >= 0),\n"
        "    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n"
        ");\n\n"
        "-- 3. Withdrawals Ledger Table (Records all SUCCESS and FAILED transactions)\n"
        "CREATE TABLE withdrawals (\n"
        "    id SERIAL PRIMARY KEY,\n"
        "    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,\n"
        "    atm_id INTEGER NOT NULL REFERENCES atm(id) ON DELETE CASCADE,\n"
        "    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),\n"
        "    status VARCHAR(20) NOT NULL, -- 'SUCCESS' or 'FAILED'\n"
        "    failure_reason VARCHAR(255),\n"
        "    balance_before NUMERIC(12, 2),\n"
        "    balance_after NUMERIC(12, 2),\n"
        "    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n"
        ");\n\n"
        "-- Performance Indexes\n"
        "CREATE INDEX idx_accounts_account_number ON accounts(account_number);\n"
        "CREATE INDEX idx_withdrawals_account_created ON withdrawals(account_id, created_at DESC);\n"
        "CREATE INDEX idx_withdrawals_status ON withdrawals(status);"
    )
    story.append(Paragraph(sql_code.replace('\n', '<br/>').replace(' ', '&nbsp;'), style_code_block))
    story.append(Paragraph("<b>Composite Index Optimization:</b> <code>idx_withdrawals_account_created</code> enables high-speed bounded index scans for <code>WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2</code> without in-memory sorting.", style_body))

    story.append(PageBreak())

    # ==================================================================
    # PAGE 3: API CONTRACT & WITHDRAWAL TRANSACTION FLOW
    # ==================================================================
    story.append(Paragraph("5. API Contract & Endpoint Specification", style_h1))
    
    api_rows = [
        [Paragraph("Method & Route", style_th), Paragraph("Auth / Guard", style_th), Paragraph("Purpose & Request Payload", style_th), Paragraph("Response & Status", style_th)],
        [
            Paragraph("<code>POST /api/auth/login</code>", style_td_code),
            Paragraph("Public", style_td),
            Paragraph("Authenticate user PIN.<br/><code>{ accountNumber, pin }</code>", style_td),
            Paragraph("<b>200 OK:</b> JWT token & account profile.<br/><b>401:</b> Invalid credentials.", style_td)
        ],
        [
            Paragraph("<code>GET /api/account/balance</code>", style_td_code),
            Paragraph("JWT Bearer", style_td),
            Paragraph("Fetch live balance via Redis cache-aside (60s TTL).", style_td),
            Paragraph("<b>200 OK:</b> <code>{ balance, isCached }</code>", style_td)
        ],
        [
            Paragraph("<code>POST /api/withdraw</code>", style_td_code),
            Paragraph("JWT + Limiter", style_td),
            Paragraph("Execute row-locked withdrawal.<br/><code>{ amount, atmId? }</code>", style_td),
            Paragraph("<b>200 OK:</b> New balance.<br/><b>409:</b> INSUFFICIENT_BALANCE.", style_td)
        ],
        [
            Paragraph("<code>GET /api/transactions</code>", style_td_code),
            Paragraph("JWT Bearer", style_td),
            Paragraph("Retrieve bounded history.<br/>Query: <code>?limit=20</code>", style_td),
            Paragraph("<b>200 OK:</b> List of SUCCESS & FAILED records.", style_td)
        ],
        [
            Paragraph("<code>GET /api/atm/status</code>", style_td_code),
            Paragraph("Public", style_td),
            Paragraph("Query physical ATM vault available cash.", style_td),
            Paragraph("<b>200 OK:</b> <code>{ availableCash, id }</code>", style_td)
        ],
        [
            Paragraph("<code>POST /api/dev/reset-seed</code>", style_td_code),
            Paragraph("devGuard", style_td),
            Paragraph("Restore Account #1 (₹10k), #2 (₹3k), ATM (₹50k).", style_td),
            Paragraph("<b>200 OK:</b> (Returns 404 in production).", style_td)
        ],
        [
            Paragraph("<code>POST /api/dev/concurrency-test</code>", style_td_code),
            Paragraph("devGuard", style_td),
            Paragraph("Execute 2x ₹2,000 parallel calls on Account #2.", style_td),
            Paragraph("<b>200 OK:</b> Execution metrics report.", style_td)
        ],
        [
            Paragraph("<code>GET /health</code>", style_td_code),
            Paragraph("Public", style_td),
            Paragraph("Server uptime and container health status check.", style_td),
            Paragraph("<b>200 OK:</b> <code>{ status: 'ok' }</code>", style_td)
        ],
    ]
    api_table = Table(api_rows, colWidths=[125, 65, 175, 158.27])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("6. Withdrawal Transaction Flow & Deterministic Locking", style_h1))
    story.append(Paragraph(
        "To prevent deadlocks and eliminate race conditions across multiple ATMs and concurrent digital channels, "
        "all withdrawal requests follow a strict, deterministic lock acquisition lifecycle:",
        style_body
    ))

    tx_steps = [
        Paragraph("<b>Step 1 (BEGIN):</b> Start PostgreSQL ACID transaction.", style_bullet),
        Paragraph("<b>Step 2 (Pessimistic Account Lock):</b> <code>SELECT balance FROM accounts WHERE id = $1 FOR UPDATE;</code> — Locks the target account row exclusively. Concurrent requests for this account wait.", style_bullet),
        Paragraph("<b>Step 3 (Pessimistic ATM Vault Lock):</b> <code>SELECT available_cash FROM atm WHERE id = $2 FOR UPDATE;</code> — Locks the ATM inventory row in identical global sequence to eliminate deadlocks.", style_bullet),
        Paragraph("<b>Step 4 (Validation & Rejection Branch):</b> If <code>balance &lt; amount</code> or <code>available_cash &lt; amount</code>:<br/>"
                  "• Execute <code>INSERT INTO withdrawals ... ('FAILED', reason, balance, balance);</code><br/>"
                  "• Execute <code>COMMIT;</code> to permanently preserve the failure attempt in the ledger.<br/>"
                  "• Return <code>HTTP 409 Conflict</code> (Account balance and ATM cash remain untouched).", style_bullet),
        Paragraph("<b>Step 5 (Mutation & Success Branch):</b> If funds and cash are sufficient:<br/>"
                  "• <code>UPDATE accounts SET balance = balance - $amount WHERE id = $1;</code><br/>"
                  "• <code>UPDATE atm SET available_cash = available_cash - $amount WHERE id = $2;</code><br/>"
                  "• <code>INSERT INTO withdrawals ... ('SUCCESS', NULL, balanceBefore, balanceAfter);</code><br/>"
                  "• Execute <code>COMMIT;</code> (Releases all PostgreSQL row locks).", style_bullet),
        Paragraph("<b>Step 6 (Post-Commit Cache Invalidation):</b> Call Redis <code>DEL atm:balance:$accountId</code> so subsequent reads fetch fresh PostgreSQL data.", style_bullet),
        Paragraph("<b>Step 7 (Asynchronous Audit Emit):</b> Emit non-blocking audit event to MongoDB. Return <code>HTTP 200 OK</code> to client.", style_bullet),
    ]
    for step in tx_steps:
        story.append(step)

    story.append(PageBreak())

    # ==================================================================
    # PAGE 4: CONCURRENCY TIMELINE, REDIS, MONGODB, SECURITY
    # ==================================================================
    story.append(Paragraph("7. Concurrency Protection & Race Condition Analysis", style_h1))
    story.append(Paragraph(
        "The following timeline traces two simultaneous ₹2,000.00 withdrawal requests on Sandbox Account #2 (Initial balance ₹3,000.00):",
        style_body
    ))

    conc_trace = [
        [Paragraph("Timeline", style_th), Paragraph("Request A (₹2,000.00)", style_th), Paragraph("Request B (₹2,000.00)", style_th), Paragraph("PostgreSQL Balance", style_th)],
        [
            Paragraph("<b>T0</b>", style_td_bold),
            Paragraph("Arrives at API Gateway", style_td),
            Paragraph("Arrives simultaneously at API Gateway", style_td),
            Paragraph("₹3,000.00 (Initial)", style_td)
        ],
        [
            Paragraph("<b>T1</b>", style_td_bold),
            Paragraph("Acquires <code>SELECT ... FOR UPDATE</code> lock on Account #2", style_td),
            Paragraph("Blocked waiting for Account #2 row lock", style_td),
            Paragraph("₹3,000.00 (Locked by Req A)", style_td)
        ],
        [
            Paragraph("<b>T2</b>", style_td_bold),
            Paragraph("Validates ₹3,000 ≥ ₹2,000 (Passes). Deducts ₹2,000.", style_td),
            Paragraph("Waiting...", style_td),
            Paragraph("₹1,000.00 (Uncommitted)", style_td)
        ],
        [
            Paragraph("<b>T3</b>", style_td_bold),
            Paragraph("Inserts SUCCESS row & executes <b>COMMIT</b>. Returns <b>HTTP 200</b>.", style_td),
            Paragraph("Unblocks & acquires lock. Reads committed balance (₹1,000).", style_td),
            Paragraph("<b>₹1,000.00 (Committed)</b>", style_td_bold)
        ],
        [
            Paragraph("<b>T4</b>", style_td_bold),
            Paragraph("Complete.", style_td),
            Paragraph("Validates ₹1,000 &lt; ₹2,000 (Fails). Inserts FAILED row & commits. Returns <b>HTTP 409</b>.", style_td),
            Paragraph("<b>₹1,000.00 (Strictly Preserved)</b>", style_td_bold)
        ],
    ]
    conc_table = Table(conc_trace, colWidths=[45, 170, 188.27, 120])
    conc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_SECONDARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
    ]))
    story.append(conc_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("8. Redis Caching & Rate Limiting Strategy", style_h1))
    story.append(Paragraph(
        "<b>Cache-Aside Flow:</b> Balance inquiries check Redis key <code>atm:balance:&lt;id&gt;</code> first. "
        "Cache hits return directly from Redis without querying PostgreSQL. Cache misses query PostgreSQL and populate Redis with a 60-second TTL. "
        "Upon successful cash withdrawal, Redis cache is invalidated immediately via <code>DEL</code>. "
        "A sliding-window rate limiter restricts <code>POST /api/withdraw</code> to 10 requests/minute. "
        "<i>Fault Behavior:</i> If Redis is offline, balance reads transparently query PostgreSQL directly, "
        "and the rate limiter fails open, ensuring banking cash availability is never blocked by cache outages.",
        style_body
    ))

    story.append(Paragraph("9. MongoDB Asynchronous Audit Strategy", style_h1))
    story.append(Paragraph(
        "<b>Audit Trail Decoupling:</b> Compliance events (<code>WITHDRAWAL_SUCCESS</code>, <code>WITHDRAWAL_FAILED</code>, "
        "<code>BALANCE_CHECK</code>, <code>LOGIN</code>) are logged to MongoDB collection <code>activitylogs</code>. "
        "<i>Failure Isolation Guarantee:</i> MongoDB writes execute asynchronously post-commit. "
        "MongoDB downtime or network latency never blocks, corrupts, or rolls back committed PostgreSQL transactions.",
        style_body
    ))

    story.append(Paragraph("10. Security & Defensive Engineering", style_h1))
    sec_points = [
        Paragraph("• <b>Bcrypt PIN Hashing:</b> Account PINs are salted and hashed (10 rounds). Plaintext PINs are never persisted, logged, or exposed.", style_bullet),
        Paragraph("• <b>Stateless JWT Tokens:</b> Authenticated sessions utilize signed HMAC-SHA256 JSON Web Tokens with 24-hour expiration.", style_bullet),
        Paragraph("• <b>SQL Injection Defense:</b> All PostgreSQL interactions utilize strict parameterized queries (<code>$1, $2</code>).", style_bullet),
        Paragraph("• <b>Development Endpoint Gating:</b> <code>POST /api/dev/reset-seed</code> and <code>POST /api/dev/concurrency-test</code> are guarded by <code>devGuard</code> middleware and return HTTP 404 in production mode.", style_bullet),
    ]
    for p in sec_points:
        story.append(p)

    story.append(PageBreak())

    # ==================================================================
    # PAGE 5: TRANSACTION HISTORY, RESET DEMO STATE, 100x SCALABILITY
    # ==================================================================
    story.append(Paragraph("11. Transaction History & Reset Demo State Semantics", style_h1))
    story.append(Paragraph(
        "<b>Immutable Financial Ledger:</b> The PostgreSQL <code>withdrawals</code> table maintains a permanent historical record of every transaction attempt. "
        "Successful withdrawals record the balance transition (e.g. ₹10,000 → ₹9,000), while failed withdrawals record the failure reason "
        "(e.g. <code>INSUFFICIENT_BALANCE</code>) with balance unchanged. The frontend renders failed transactions with a distinct rose-red badge.",
        style_body
    ))
    story.append(Paragraph(
        "<b>Reset Demo State Semantics:</b> Calling <code>POST /api/dev/reset-seed</code> restores live operational balances "
        "(Account #1 to ₹10,000.00, Account #2 to ₹3,000.00, ATM Vault to ₹50,000.00) and clears Redis balance caches. "
        "<b>Crucially, Reset Demo State NEVER deletes historical transaction ledger records or MongoDB audit logs</b>, "
        "preserving financial compliance audit integrity. The UI automatically resets form inputs, deselects denominations, and clears temporary alerts.",
        style_body
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("12. 100x Horizontal Scalability Strategy (Architectural Roadmap)", style_h1))
    story.append(Paragraph(
        "<i>Note: This section outlines the architectural scale-out strategy for 100x traffic (thousands of concurrent transactions/sec) "
        "and is distinguished from the verified single-node Docker setup.</i>",
        style_body
    ))

    scale_rows = [
        [Paragraph("Scaling Dimension", style_th), Paragraph("Current Baseline (Docker Dev)", style_th), Paragraph("100x Production Scale-Out Strategy", style_th)],
        [
            Paragraph("<b>Application Tier</b>", style_td),
            Paragraph("Single Node.js/Express instance.", style_td),
            Paragraph("Stateless Node.js cluster deployed across autoscaling container groups behind an Application Load Balancer (ALB/Nginx).", style_td)
        ],
        [
            Paragraph("<b>Connection Pooling</b>", style_td),
            Paragraph("Direct <code>pg.Pool</code> connection management.", style_td),
            Paragraph("<b>PgBouncer Cluster:</b> Multiplexes thousands of client requests over a compact pool of dedicated PostgreSQL connections via Transaction Pooling.", style_td)
        ],
        [
            Paragraph("<b>Primary DB Writes</b>", style_td),
            Paragraph("Single PostgreSQL 15 container.", style_td),
            Paragraph("<b>Strict Financial Consistency Rule:</b> All cash withdrawals and balance updates MUST execute on the Primary PostgreSQL instance with <code>SELECT ... FOR UPDATE</code>. Authoritative balance writes are never routed to read replicas.", style_td)
        ],
        [
            Paragraph("<b>Read Replicas</b>", style_td),
            Paragraph("Not deployed in dev baseline.", style_td),
            Paragraph("PostgreSQL streaming read replicas offload non-authoritative read traffic (e.g. historical statement exports and analytical reporting).", style_td)
        ],
        [
            Paragraph("<b>Ledger Partitioning</b>", style_td),
            Paragraph("Single <code>withdrawals</code> table.", style_td),
            Paragraph("<b>Declarative Range Partitioning:</b> Partition <code>withdrawals</code> table by date (monthly/quarterly) to maintain fast index scans as data grows by millions of rows.", style_td)
        ],
        [
            Paragraph("<b>Cache Tier</b>", style_td),
            Paragraph("Single Redis 7 container.", style_td),
            Paragraph("<b>Redis Cluster:</b> Master-replica sharding across availability zones for high-throughput distributed caching and rate limiting.", style_td)
        ],
        [
            Paragraph("<b>Audit Pipeline</b>", style_td),
            Paragraph("Direct async Mongoose insert.", style_td),
            Paragraph("<b>Kafka / RabbitMQ Message Queue:</b> Express instances emit events to message queues; worker services batch-consume records into sharded MongoDB.", style_td)
        ],
    ]
    scale_table = Table(scale_rows, colWidths=[95, 145, 283.27])
    scale_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
    ]))
    story.append(scale_table)

    story.append(PageBreak())

    # ==================================================================
    # PAGE 6: ARCHITECTURAL TRADE-OFFS & TESTING RESULTS
    # ==================================================================
    story.append(Paragraph("13. Architectural Trade-offs Matrix", style_h1))
    
    tradeoff_rows = [
        [Paragraph("Architectural Decision", style_th), Paragraph("Chosen Strategy", style_th), Paragraph("Alternative Considered", style_th), Paragraph("Rationale & Impact", style_th)],
        [
            Paragraph("<b>Concurrency Control</b>", style_td),
            Paragraph("Pessimistic Row Locking (<code>SELECT FOR UPDATE</code>)", style_td),
            Paragraph("Optimistic Locking (version column)", style_td),
            Paragraph("Pessimistic locking eliminates transaction retry storms under high contention and guarantees deterministic ordering for financial withdrawals.", style_td)
        ],
        [
            Paragraph("<b>Cache Consistency</b>", style_td),
            Paragraph("Immediate <code>DEL</code> Invalidation on Commit", style_td),
            Paragraph("Write-Through Cache Mutation", style_td),
            Paragraph("Invalidation prevents race conditions where asynchronous write-through cache mutations overwrite fresh data with stale states.", style_td)
        ],
        [
            Paragraph("<b>Audit Resilience</b>", style_td),
            Paragraph("Asynchronous Non-Blocking MongoDB", style_td),
            Paragraph("Synchronous Distributed 2PC", style_td),
            Paragraph("Financial withdrawals must never abort or experience latency due to secondary audit store outages.", style_td)
        ],
        [
            Paragraph("<b>Rate Limiter Failure</b>", style_td),
            Paragraph("Fail Open", style_td),
            Paragraph("Fail Closed (Block All Withdrawals)", style_td),
            Paragraph("In banking terminals, critical availability of cash access is prioritized over auxiliary rate-limit enforcement during cache node downtime.", style_td)
        ],
    ]
    tradeoff_table = Table(tradeoff_rows, colWidths=[95, 120, 110, 198.27])
    tradeoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_SECONDARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
    ]))
    story.append(tradeoff_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("14. Testing & Runtime Verification Results", style_h1))
    story.append(Paragraph(
        "The system has undergone automated testing, container health audits, and live runtime verification against real Docker services:",
        style_body
    ))

    test_rows = [
        [Paragraph("Verification Category", style_th), Paragraph("Test Target & Scenario", style_th), Paragraph("Observed Runtime Result", style_th), Paragraph("Status", style_th)],
        [
            Paragraph("<b>Docker Services</b>", style_td),
            Paragraph("PostgreSQL 15, MongoDB 6.0, Redis 7", style_td),
            Paragraph("All 3 containers healthy on ports 5432, 27017, 6379.", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
        [
            Paragraph("<b>Authentication</b>", style_td),
            Paragraph("POST /api/auth/login (10000001 / 1234)", style_td),
            Paragraph("Bcrypt verified; signed JWT Bearer issued.", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
        [
            Paragraph("<b>Normal Withdrawal</b>", style_td),
            Paragraph("Withdraw ₹1,000 on Account #1 (₹10,000 balance)", style_td),
            Paragraph("Balance becomes ₹9,000; ATM cash drops to ₹49,000; ledger recorded.", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
        [
            Paragraph("<b>Overdraft Rejection</b>", style_td),
            Paragraph("Withdraw ₹11,000 on Account #1 (₹10,000 balance)", style_td),
            Paragraph("HTTP 409 INSUFFICIENT_BALANCE; balance preserved at ₹10,000; FAILED ledger row inserted.", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
        [
            Paragraph("<b>Real Concurrency Test</b>", style_td),
            Paragraph("2x ₹2,000 simultaneous calls on Account #2 (₹3,000)", style_td),
            Paragraph("<b>1 SUCCESS, 1 FAILED</b>; final balance strictly ₹1,000; ATM deducted ₹2,000; Account #1 unaffected.", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
        [
            Paragraph("<b>Account Isolation</b>", style_td),
            Paragraph("Inspect Account #1 after Account #2 Concurrency Test", style_td),
            Paragraph("Account #1 balance strictly preserved (100% isolated).", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
        [
            Paragraph("<b>Reset Demo State</b>", style_td),
            Paragraph("POST /api/dev/reset-seed", style_td),
            Paragraph("Restores Account #1 (₹10k), Account #2 (₹3k), ATM (₹50k); preserves all historical transaction records.", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
        [
            Paragraph("<b>Redis Cache Cycle</b>", style_td),
            Paragraph("1st Read (Miss) → 2nd Read (Hit) → Withdraw (Invalidate)", style_td),
            Paragraph("Redis cache invalidated; next read queries PostgreSQL.", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
        [
            Paragraph("<b>Automated Test Suite</b>", style_td),
            Paragraph("Jest backend test runner (npm test)", style_td),
            Paragraph("<b>9/9 tests passed</b> across atm.test.ts and concurrency.test.ts.", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
        [
            Paragraph("<b>Production Build</b>", style_td),
            Paragraph("Vite client compiler (npm run build)", style_td),
            Paragraph("Compiled successfully in 3.18s with <b>0 errors</b>.", style_td),
            Paragraph("<b>PASS</b>", style_td_bold)
        ],
    ]
    test_table = Table(test_rows, colWidths=[90, 155, 228.27, 50])
    test_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
    ]))
    story.append(test_table)

    # Build Document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF Generated successfully: {pdf_filename}")

if __name__ == '__main__':
    build_pdf()
