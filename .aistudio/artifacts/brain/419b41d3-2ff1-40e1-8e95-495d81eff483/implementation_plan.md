# Candlesticks Trading Academy — Live Market Telemetry, Multi-TP Signals, PDF Quiz Engine & Certificate Studio

This upgrade refines the Client Dashboard and Founder Admin Console to eliminate all remaining demo fallback records, fix card typography and spacing alignments, wire the notification bell to real client-specific audit and trade alerts, enable AI-assisted multi-question quizzes from uploaded level PDFs, connect signals to live market prices with up to 5 Take-Profit targets (TP1–TP5), provide an interactive Copy & Log Trade execution modal for Exness, and introduce an Admin Certificate Template Studio with customizable student name placement.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> All four architectural decisions below have been confirmed from your answers and integrated into this plan:

- **Confirmed Decision 1 — AI-Assisted Level PDF Quiz Generation**: In the Admin Course Studio, you can upload four level PDFs (**Beginner**, **Intermediate**, **Essential**, and **Advanced**) or per-lesson PDFs. A server-side Gemini endpoint (`gemini-3.8-flash`) extracts the curriculum concepts from the uploaded PDF and generates a multi-question assessment for that level, which you can review, edit, or regenerate before publishing.
- **Confirmed Decision 2 — Live Market Price Feed + Admin Override for Multi-TP Signals (TP1–TP5)**: Signals support up to **5 Take-Profit levels (`TP1` through `TP5`)**. A real-time market price engine streams live Forex, Gold (`XAU/USD`), and Crypto prices (with manual Admin override controls) to automatically detect and update when a signal hits `TP1`, `TP2`, `TP3`, `TP4`, `TP5` (Partial TP vs. All TPs Hit) or `SL`, firing instant client alerts.
- **Confirmed Decision 3 — Interactive Copy & Log Trade Modal + Exness WebTerminal Bridge**: Clicking **Copy & Log Trade** on any signal opens an execution modal where the student configures their custom **Lot Size**, selects their target **Take-Profit level (`TP1`–`TP5` or custom price)** and **Stop-Loss**, logs the trade to their database ledger, and optionally launches the Exness WebTerminal with pre-copied order parameters.
- **Confirmed Decision 4 — Admin Certificate Template Upload with Adjustable Name Coordinates**: Removes raw database labels (`.public.student_certificates`) from the Progress UI, aligns certificate cards cleanly, and adds a **Certificate Template Designer** in the Admin Console where you upload your official certificate artwork, position the student's name (`X/Y` coordinates, font size, color) with a live preview, and automatically render downloadable personalized certificates as students complete each track.

---

### 1. Overview & Core Concept

- **What It Does**: Transforms the client portal into a 100% database-driven institutional trading terminal and academy where every course video, PDF-derived multi-question quiz, scheduled/live broadcast, multi-TP market signal, copied Exness trade, notification bell alert, and downloadable completion certificate is controlled from the Founder Admin Console.
- **Target Audience / Persona**:
  - **Students / Clients**: Funded and onboarding Exness traders studying structured tracks, taking level PDF assessments, copying multi-TP signals with custom risk parameters, and downloading personalized certificates.
  - **Founder / Admin (Pastor Mike)**: Uploads course videos and level PDFs, schedules or broadcasts live sessions, posts multi-TP signals connected to live market prices, monitors client audit/trade alerts, and manages the official certificate template.
- **Key Value**: Eradicates all static/demo placeholders, fixes card layout and whitespace imbalances, and automates real-time trade target tracking (`TP1`–`TP5`), client notifications, and credential issuance.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Overview & Client Alert Bell**:
     - The **High-Impact Macroeconomic Calendar** card header and 5-column event strip use balanced typography, clean spacing, tabular numerals, and uncrowded metadata rows.
     - Clicking the **Alert Bell** in the top bar opens a dedicated **Client Notifications & Audit Log Popover** displaying all alerts relevant to that student (new signals posted, `TP1`–`TP5` hits, copied trade executions, deposit verifications, and certificate issuances). Clicking an individual notification marks it as read; clicking **Mark All as Read** clears the unread badge and syncs with the database.
     - Uploading a profile photo in **Settings & Profile** immediately updates the avatar beside the Alert Bell in the top header, in the sidebar profile card, and in the Admin Student Roster.
  2. **Courses & 4-Level PDF Auto-Quiz Engine**:
     - Retains the 4 signature level tracks (**Forex Foundations · Beginner**, **Technical Analysis · Intermediate**, **Risk & Psychology · Essential**, **Advanced Price Action · Advanced**) while removing all hardcoded demo lessons so only videos named and uploaded by Admin in Supabase are shown.
     - Admin uploads a **Course Level PDF** (for Beginner, Intermediate, Essential, or Advanced) in the Admin Course Studio. The AI-assisted PDF parser generates a 5-to-10 question multiple-choice quiz with explanations for that level, stored in Supabase.
  3. **Live Sessions (Real Scheduled & Live Broadcasts Only)**:
     - Removes all demo sessions. Displays only sessions scheduled by Admin in `public.live_sessions` with a live ticking countdown until broadcast, or an active live badge and stream player when Admin is live.
  4. **Signals Feed,Redesigned Risk Calculator & Multi-TP Auto-Tracking**:
     - Redesigns the **Interactive Position Size & Risk Calculator** card with a structured 2-tier layout, aligned input labels, tabular numeric inputs, and a clear recommended lot size output panel.
     - Displays only Admin-posted signals (zero demo signals). Admin can define **TP1, TP2, TP3, TP4, and TP5** when posting a signal.
     - Live market prices stream continuously next to each active signal. As live market price crosses each target, the signal status automatically updates (`TP1 HIT · PARTIAL`, `TP2 HIT · PARTIAL`, ..., `ALL TPS HIT`) and dispatches an audit notification to the student's Alert Bell.
  5. **Copy & Log Trade Modal & My Trades Ledger**:
     - Clicking **Copy & Log Trade** on a signal opens an interactive configuration modal pre-filled with the signal's Entry, SL, and `TP1`–`TP5` choices plus the student's recommended Lot Size. The student can customize their Lot Size, custom TP, and SL, then click **Execute & Copy to Exness** to record the trade in `public.student_trades` and open the Exness terminal bridge.
     - **My Trades** displays real copied and synced Exness trades (capped at 10 per page with working filters) and updates live P&L against the market price feed.
  6. **Progress & Customizable Certificate Template Studio**:
     - Removes `.public.student_certificates` and other technical table names from section headers, and aligns card text and actions cleanly.
     - In Admin, a new **Certificate Template Studio** lets you upload a custom certificate background image, drag/adjust the student name vertical/horizontal offset, font style, and color with a live preview, and save it to Supabase so completed students see their own name rendered directly onto your official certificate template and can download it as a high-resolution PNG/PDF.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Institutional dark financial terminal (`#0B0D12` canvas, `#12161F` elevated cards, subtle `1px solid rgba(255,255,255,0.08)` borders).
  - *Color Palette & Mood*: High-contrast gold accent (`#FFDE02` with `#0B0D0F` ink) for primary actions, emerald (`#16A34A`) for TP hits and verified status, and crimson (`#F6465D`) for stop-loss/high-impact warnings.
  - *Typography & Hierarchy*: Clean sans-serif headers with `text-wrap: balance`, paired with `JetBrains Mono` / `tabular-nums` for all prices, countdowns, lot sizes, and P&L figures.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Multi-TP State Machine (`TP1`–`TP5`)**:
  - *Chosen Approach*: Store both a primary `take_profit` and a structured `tp_levels` JSONB array (`[{ level: 1, price: "2350.00", hit: true, hitAt: "..." }, ...]`) on `public.trading_signals`.
  - *Why*: Allows Admin to specify anywhere from 1 to 5 Take-Profit targets per signal while preserving backward compatibility with existing single-TP queries, and enables granular status badges (`TP1 HIT`, `PARTIAL TP (2/4)`, `ALL TPS HIT`).
- **Decision 2 — Live Market Price Engine with Dual Feed + Admin Override**:
  - *Chosen Approach*: Poll live public Forex/Gold/Crypto spot rates (via public market ticker endpoints for `XAU/USD`, `EUR/USD`, `GBP/USD`, `USD/JPY`, `BTC/USD`, etc.) every 5 seconds in a live price service, paired with an Admin price override control in the Signal Studio.
  - *Why*: Guarantees real-time automatic TP1–TP5 detection during market hours while giving Pastor Mike instant manual control to trigger or test TP1–TP5 hits anytime.
- **Decision 3 — Client Notification Bell Linked to Audit Logs**:
  - *Chosen Approach*: Create a unified `public.client_notifications` / audit log stream filtered by `student_email` (plus global broadcast alerts like new signals and TP hits) with per-item `is_read` and bulk `Mark All as Read` persistence.
  - *Why*: Ensures every trade copy, TP hit, deposit verification, and certificate update pertinent to that specific client appears in their bell dropdown and syncs with the Admin Audit Log.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE POSTGRES & STORAGE                           │
│  • courses & course_lessons (level_pdf_url, level_quiz_questions JSONB)      │
│  • trading_signals (tp_levels JSONB [TP1..TP5], live_price, tp_hit_count)    │
│  • student_trades (custom_tp, custom_sl, lot_size, exness_ticket, live_pnl)  │
│  • client_notifications (student_email, category, title, detail, is_read)    │
│  • certificate_templates & student_certificates (template_url, name_x/y)     │
└──────────────────┬────────────────────────────────────────┬──────────────────┘
                   │                                        │
        ┌──────────▼──────────┐                  ┌──────────▼──────────┐
        │   EXPRESS SERVER    │                  │ LIVE PRICE MONITOR  │
        │ /api/quiz/from-pdf  │                  │ Real-time FX / XAU  │
        │ (Gemini 3.8 Flash)  │                  │ Auto TP1–TP5 Engine │
        └──────────┬──────────┘                  └──────────┬──────────┘
                   │                                        │
┌──────────────────▼────────────────────────────────────────▼──────────────────┐
│                 CLIENT TRADING TERMINAL & ADMIN CONSOLE                      │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌───────────────┐ │
│  │ Portal Topbar           │  │ VIP Signals & Copy Modal│  │ Progress &    │ │
│  │ • Alert Bell Dropdown   │  │ • Redesigned Risk Calc  │  │ Certificates  │ │
│  │   (Read / Mark All Read)│  │ • Multi-TP (TP1–TP5)    │  │ • Canvas PNG  │ │
│  │ • Live Profile Avatar   │  │ • Custom TP/Lot Modal   │  │   Renderer    │ │
│  └─────────────────────────┘  └─────────────────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & Schema Upgrades (`CLIENT_DASHBOARD_UPGRADE_SQL`)**:
  - `public.courses`: Add `level_pdf_url TEXT`, `level_pdf_name TEXT`, and `level_quiz_questions JSONB DEFAULT '[]'::jsonb` for the 4 course levels (`Beginner`, `Intermediate`, `Essential`, `Advanced`).
  - `public.trading_signals`: Add `tp_levels JSONB DEFAULT '[]'::jsonb` (supporting up to 5 TPs), `hit_tps INTEGER[] DEFAULT '{}'`, and `market_price_source TEXT DEFAULT 'live'`.
  - `public.student_trades`: Add `signal_id TEXT`, `selected_tp_level INTEGER`, `take_profit_price TEXT`, and `stop_loss_price TEXT`.
  - `public.client_notifications`: Table storing client-specific and broadcast audit alerts (`id`, `student_email`, `title`, `message`, `type`, `read_by JSONB`, `is_read BOOLEAN`, `created_at`) synced with Admin audit logs.
  - `public.certificate_templates`: Stores Admin's uploaded certificate template image URL, student name `x_pct`, `y_pct`, `font_size`, `font_color`, and signature metadata.
  - Storage Buckets: Add `course-pdfs` and `certificate-templates` alongside `student-avatars` and `course-videos`.

- **Interactive Component & State Mapping**:
  - **Topbar Alert Bell (`PortalLayout`)**: Clicking the bell toggles a glassmorphic popover listing notifications for `student.email`. Clicking an item calls `markNotificationReadInDb(id, student.email)` and navigates to the relevant trade/signal/certificate; clicking "Mark all as read" calls `markAllNotificationsReadInDb(student.email)`.
  - **Macroeconomic Calendar & Risk Calculator Cards**: Rebuilt with CSS Grid alignment, consistent `p-5` inner spacing, `tabular-nums` data columns, and zero text overlap or awkward wrapping.
  - **Admin Level PDF Quiz Generator (`AdminCoursesPage`)**: Admin selects any of the 4 tracks, uploads a PDF file (or pastes curriculum text), and triggers `/api/quiz/generate-from-pdf` using `@google/genai` (`gemini-3.8-flash` with `responseSchema`) to extract 5–10 structured multiple-choice questions for that level.
  - **Copy & Log Trade Modal (`SignalFeedPage` & `SignalDetailPage`)**: Opens when clicking "Copy & Log Trade", allowing custom Lot Size, SL, and TP1–TP5 selection, saving to `public.student_trades`, firing a client alert, and offering a direct "Launch Exness WebTerminal" action.
  - **Admin Certificate Designer & Student Canvas Download (`AdminCoursesPage` & `ProgressPage`)**: Admin uploads a certificate background image and adjusts name placement sliders with live preview; students who complete a track see their name rendered onto the template via HTML5 `<canvas>` and can download a crisp PNG/PDF certificate with one click.
