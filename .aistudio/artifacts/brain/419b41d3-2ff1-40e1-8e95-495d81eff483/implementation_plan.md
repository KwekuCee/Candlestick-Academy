# Premium Client & Admin Dashboard Suite + Full Supabase Database Integration

This plan upgrades the Candlesticks Academy Client Dashboard and Founder Admin Console into a live, database-driven trading terminal and learning platform backed by Supabase—eliminating all hardcoded demo metrics, removing the student-side "Admin demo" button, and adding course video uploads, auto-generated quizzes, live screen-share/RTMP streaming with real-time chat, signal publishing, 10-per-page trade analytics, profile photo uploads, and direct mentor messaging.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All product choices from your clarification answers have been locked into this plan, and the complete **Supabase SQL Upgrade Schema** is provided below so you can run it directly in your Supabase SQL Editor (and it will also be available via a one-click copy/push button inside your Admin Console).

- **Confirmed Decision 1 — Live Session Broadcasting**: Hybrid **Browser Screen Share / Webcam (WebRTC/Live Canvas Relay)** plus **RTMP Ingest & HLS/Stream URL support**, allowing you to share your trading screen directly from the browser or stream via OBS/RTMP while students watch live and chat in real time.
- **Confirmed Decision 2 — Course Video Hosting**: Supports **both direct video file uploads to Supabase Storage (`course-videos` bucket) and external video URLs** (MP4, HLS, YouTube, Vimeo) with support for unlimited lessons (12, 16, 20+ per course track) across all 4 tracks.
- **Confirmed Decision 3 — My Trades Feed (10 Per Page)**: Combines **live Exness Partner API account sync** (volume, reward, account status) with **student trade logging & one-click signal execution tracking**, strictly paginated at **10 trades per page** with live pair search and status/direction filtering.
- **Confirmed Decision 4 — All 5 Premium Client-Admin Upgrades Included**:
  1. **Interactive Lot Size & Risk Calculator + Signal Execution Tracker**
  2. **Verified Course Completion Certificates** (claimable at 100% completion, managed by Admin)
  3. **Direct 1-on-1 Mentor Q&A & Support Messaging** between Student and Admin
  4. **Custom Trading Risk Profile, Goals & Session Alert Preferences** in Settings
  5. **High-Impact Forex Economic Calendar** on the Client Dashboard Overview

---

## 1. Complete Supabase SQL Upgrade Schema

> [!NOTE]
> Copy and run the SQL block below in your **Supabase SQL Editor** to create all new tables, columns, indexes, and storage buckets (`student-avatars` and `course-videos`) required by the Client and Admin Dashboards.

```sql
-- ============================================================================
-- CANDLESTICKS ACADEMY — FULL CLIENT & ADMIN DASHBOARD SUPABASE UPGRADE SCHEMA
-- Safe to run multiple times (idempotent)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. UPGRADE public.students WITH PROFILE AVATAR, STREAK & TRADING PREFERENCES
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS telegram_handle TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS preferred_session TEXT DEFAULT 'New York',
  ADD COLUMN IF NOT EXISTS risk_per_trade_pct NUMERIC(5,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS account_balance_usd NUMERIC(12,2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS target_monthly_return_pct NUMERIC(6,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS trading_style TEXT DEFAULT 'Intraday Structure',
  ADD COLUMN IF NOT EXISTS auto_copy_signals BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notify_signals BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_sessions BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_streak_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- 2. COURSES TABLE (The 4 Core Tracks + Any Additional Admin Tracks)
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'Beginner',
  description TEXT NOT NULL DEFAULT '',
  cover_color TEXT NOT NULL DEFAULT 'gold',
  sort_order INTEGER NOT NULL DEFAULT 1,
  certificate_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.courses (id, title, level, description, cover_color, sort_order)
VALUES
  ('forex-foundations', 'Forex Foundations', 'Beginner', 'Master currency pairs, pips, lots, leverage, market sessions, and foundational candlestick structure.', 'gold', 1),
  ('technical-analysis', 'Technical Analysis', 'Intermediate', 'Identify multi-timeframe market structure, liquidity sweeps, supply and demand zones, and high-probability entries.', 'blue', 2),
  ('risk-psychology', 'Risk & Psychology', 'Essential', 'Protect your capital with strict position sizing, drawdown rules, and emotional discipline under live market pressure.', 'violet', 3),
  ('price-action', 'Advanced Price Action', 'Advanced', 'Institutional order flow, session liquidity raids, displacement candles, and precision execution models.', 'green', 4)
ON CONFLICT (id) DO NOTHING;

-- 3. COURSE LESSONS TABLE (Unlimited Video Lessons + Auto-Generated Quizzes)
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 12,
  video_url TEXT NOT NULL DEFAULT '',
  video_source_type TEXT NOT NULL DEFAULT 'url', -- 'supabase_storage' | 'url'
  pair_tag TEXT DEFAULT 'EUR/USD · 15M',
  key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
  auto_quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course_order
  ON public.course_lessons(course_id, lesson_number ASC);

-- 4. STUDENT LESSON PROGRESS TABLE (Real Completion %, Hours & Streak Tracking)
CREATE TABLE IF NOT EXISTS public.student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  student_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  watch_minutes NUMERIC(6,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_email, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_email
  ON public.student_lesson_progress(student_email);

-- 5. STUDENT QUIZ ATTEMPTS TABLE (Real Quiz Average & Assessment History)
CREATE TABLE IF NOT EXISTS public.student_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  student_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  quiz_title TEXT NOT NULL,
  score_percent NUMERIC(5,2) NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_quiz_attempts_email
  ON public.student_quiz_attempts(student_email);

-- 6. LIVE SESSIONS TABLE (Admin Scheduling, RTMP/Screen Share & Replays)
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'live' | 'ended'
  stream_mode TEXT NOT NULL DEFAULT 'screen_share', -- 'screen_share' | 'rtmp_hls' | 'embed'
  rtmp_ingest_url TEXT DEFAULT 'rtmp://live.candlesticks.academy/live',
  rtmp_stream_key TEXT DEFAULT '',
  stream_playback_url TEXT DEFAULT '',
  screen_share_snapshot TEXT DEFAULT '',
  focus_pair TEXT DEFAULT 'EUR/USD · XAU/USD',
  viewers_count INTEGER NOT NULL DEFAULT 0,
  pinned_resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. LIVE SESSION CHAT MESSAGES TABLE (Real-Time Student & Host Chat)
CREATE TABLE IF NOT EXISTS public.live_session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT DEFAULT '',
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_session_messages_session
  ON public.live_session_messages(session_id, created_at ASC);

-- 8. TRADING SIGNALS TABLE (Admin Signal Publishing -> Student Dashboard & Feed)
CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'HIT TP' | 'HIT SL' | 'CLOSED'
  entry_price TEXT NOT NULL,
  stop_loss TEXT NOT NULL,
  take_profit TEXT NOT NULL,
  risk_reward TEXT NOT NULL DEFAULT '1 : 2.5',
  timeframe TEXT NOT NULL DEFAULT '15M',
  thesis TEXT NOT NULL DEFAULT '',
  mentor_quote TEXT DEFAULT 'Patience is part of the setup. Wait for price to confirm structure.',
  current_price TEXT DEFAULT '',
  floating_pnl_text TEXT DEFAULT '',
  created_by TEXT DEFAULT 'Pastor Mike',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_signals_created
  ON public.trading_signals(created_at DESC);

-- 9. STUDENT TRADES TABLE (My Trades — Paginated 10 Per Page, Real P&L & Filters)
CREATE TABLE IF NOT EXISTS public.student_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL,
  trading_account_id TEXT NOT NULL,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('Buy', 'Sell')),
  lot_size NUMERIC(8,2) NOT NULL DEFAULT 0.10,
  open_price TEXT NOT NULL,
  close_price TEXT NOT NULL,
  pnl_usd NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  return_pct NUMERIC(7,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Closed', -- 'Open' | 'Closed' | 'Verified'
  source TEXT NOT NULL DEFAULT 'exness_sync', -- 'exness_sync' | 'manual' | 'signal_copy'
  notes TEXT DEFAULT '',
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_trades_email_account
  ON public.student_trades(student_email, trading_account_id, executed_at DESC);

-- 10. DIRECT MENTOR Q&A / SUPPORT MESSAGES TABLE (Student <-> Admin Messaging)
CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_avatar TEXT DEFAULT '',
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'admin')),
  subject TEXT DEFAULT 'Trading & Mentorship Question',
  message TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentor_messages_student
  ON public.mentor_messages(student_email, created_at ASC);

-- 11. STUDENT COURSE CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.student_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT NOT NULL,
  certificate_code TEXT UNIQUE NOT NULL,
  quiz_average NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  approved_by_admin BOOLEAN NOT NULL DEFAULT TRUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_email, course_id)
);

-- 12. SUPABASE STORAGE BUCKETS FOR PROFILE AVATARS & COURSE VIDEOS
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('student-avatars', 'student-avatars', true),
  ('course-videos', 'course-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS with permissive policies for anon/authenticated client operations
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'courses', 'course_lessons', 'student_lesson_progress',
    'student_quiz_attempts', 'live_sessions', 'live_session_messages',
    'trading_signals', 'student_trades', 'mentor_messages', 'student_certificates'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow full access to %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow full access to %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public Access student-avatars" ON storage.objects;
CREATE POLICY "Public Access student-avatars"
  ON storage.objects FOR ALL
  USING (bucket_id IN ('student-avatars', 'course-videos'))
  WITH CHECK (bucket_id IN ('student-avatars', 'course-videos'));
```

---

## 2. User Experience & Visual Design

### Visual Identity & Theme
- **Aesthetic Direction**: Institutional Dark Trading Terminal & Executive Mentorship Suite. Deep obsidian canvas (`#0b0d12`), elevated slate surfaces (`#131720`), crisp 1px structural borders (`rgba(255,255,255,0.08)`), and high-intent Candlesticks Gold (`#ffde02`) accents.
- **Navigation Clean-Up**:
  - The **"Admin demo"** link is **completely removed** from the student sidebar (`PortalLayout`).
  - Students see their uploaded **Profile Avatar** (or monogram fallback), live Exness verification status, and clean navigation links (`Overview`, `Courses`, `Live sessions`, `Signals`, `My trades`, `Progress`, `Mentor Q&A`, `Settings`).
  - Admins have a dedicated **Founder Console** (`Overview`, `Students`, `Courses & Videos`, `Live Studio`, `Post a Signal`, `Mentor Inbox`, `Verification`, `Payments & Tiers`).
- **Typography & Tabular Discipline**:
  - `Manrope` for crisp headings and UI controls, paired with `DM Mono` / `tabular-nums` for all prices, P&L figures, countdown clocks, lot calculations, and percentages.

### Key User Flows
1. **Overview (`/dashboard`) — Zero Demo Data**:
   - Displays the student's **real Course Progress %**, **real Learning Streak (days)**, and **real Quiz Average %** computed directly from `student_lesson_progress` and `student_quiz_attempts`.
   - **Next Live Session Banner**: Shows a live, second-by-second countdown (`HH:MM:SS`) to the next scheduled session in `public.live_sessions` (or a pulsing `LIVE NOW` entry button when the admin starts streaming).
   - **Latest Signal Snapshot**: Displays the newest signal posted by the Admin from `public.trading_signals` with one-click actions to calculate lot size or log the trade.
   - **Interactive Lot Size & Risk Calculator + High-Impact Economic Calendar**: Embedded directly on the Overview for daily pre-session preparation.
2. **Courses, Unlimited Video Uploads & Auto-Generated Quizzes (`/courses`, `/admin/courses`)**:
   - Retains the 4 core tracks (**Forex Foundations**, **Technical Analysis**, **Risk & Psychology**, **Advanced Price Action**).
   - In **Admin Course & Video Manager (`/admin/courses`)**, you can select any of the 4 tracks and upload unlimited lessons (12, 16, 20+ videos) via direct Supabase Storage video file upload (`course-videos`) or video URL, along with lesson notes/key takeaways.
   - **Auto-Generated Quizzes**: Saving a lesson/course automatically generates multiple-choice quiz questions from the course/lesson title, description, and key takeaways. Students take quizzes at `/quiz/:courseId`, recording real scores to `public.student_quiz_attempts`.
   - **Verified Course Certificates**: Unlock at 100% course completion with a printable/downloadable certificate view.
3. **Live Sessions, Screen Share / RTMP Broadcast & Live Chat (`/sessions`, `/sessions/live/:sessionId`, `/admin/sessions`)**:
   - **Admin Live Studio**: Schedule sessions, configure RTMP Server URL + Stream Key or HLS/Embed URL, or click **"Go Live & Share Screen"** directly in the browser using `navigator.mediaDevices.getDisplayMedia`.
   - **Student Live Room**: Real-time countdown until live; once live, students watch the shared screen / video stream and participate in the **Live Chat** (`public.live_session_messages`) with real-time message delivery, student avatars, and host highlights.
4. **Signals (`/signals`, `/admin/signals/new`)**:
   - Publishing a signal from the Admin Console inserts directly into `public.trading_signals` and updates all student dashboards immediately.
   - Students can filter signals (`All`, `Active`, `Closed`, `Wins`), toggle **Automatic Signal Copying** (persisted to `public.students`), calculate position size, or log the trade to `My Trades`.
5. **My Trades (`/trades`) — Capped at 10 Per Page**:
   - Syncs live account volume and reward summaries from `public.exness_partner_clients` alongside individual trade records in `public.student_trades`.
   - Students can log trades manually or from signals; the table enforces **10 trades per page** with pagination controls, pair search, and status/direction filters.
6. **Settings & Profile Photo Upload (`/settings`)**:
   - Students upload their profile photo to `student-avatars` (with instant preview and persistent URL in `public.students.avatar_url`), visible to Admin in the Student Roster and Verification tables.
   - Includes **Trading Risk Profile & Goals**, **Notification & Auto-Copy Toggles**, **Direct Mentor Q&A Messenger**, and **Security / Password Update**.

---

## 3. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        CANDLESTICKS ACADEMY FRONTEND                         │
│                                                                              │
│  ┌───────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │       STUDENT PORTAL VIEWS        │  │      FOUNDER ADMIN CONSOLE      │  │
│  │ • Overview (Real KPIs + Calc)     │  │ • Admin Overview & Roster       │  │
│  │ • Courses (4 Tracks + Videos)     │  │   (Shows Student Uploaded Photo)│  │
│  │ • Auto-Quiz & Certificates        │  │ • Course & Video Upload Studio  │  │
│  │ • Live Room (Stream + Live Chat)  │  │   (12+ Lessons + Auto-Quiz Gen) │  │
│  │ • Signal Feed & Detail            │  │ • Live Broadcast & RTMP Studio  │  │
│  │ • My Trades (10/Page + Filters)   │  │   (Screen Share + RTMP + Chat)  │  │
│  │ • Progress (Real Heatmap/Scores)  │  │ • Signal Publisher & Status Mgr │  │
│  │ • Settings (Avatar + Risk + Q&A)  │  │ • Mentor Q&A Inbox & Replies    │  │
│  └─────────────────┬─────────────────┘  └────────────────┬────────────────┘  │
└────────────────────┼─────────────────────────────────────┼───────────────────┘
                     │                                     │
                     ▼                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 DATA & REALTIME SYNC LAYER (src/app/portalDataStore.ts)      │
│  • Real-time Supabase CRUD + Realtime Channel Subscriptions                  │
│  • Auto-Quiz Generator Engine (derives MCQs from uploaded course lessons)    │
│  • Supabase Storage Uploader (`student-avatars` & `course-videos` buckets)   │
│  • Exness Partner API Sync (`/api/exness/auto-sync`)                         │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE POSTGRESQL & STORAGE                        │
│  Tables: students, exness_partner_clients, courses, course_lessons,          │
│          student_lesson_progress, student_quiz_attempts, live_sessions,      │
│          live_session_messages, trading_signals, student_trades,             │
│          mentor_messages, student_certificates                               │
│  Buckets: student-avatars, course-videos                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Overview & Progress Engine**: Queries `student_lesson_progress`, `course_lessons`, and `student_quiz_attempts` for the logged-in student's email/ID. Calculates exact completion percentages per track, total hours learned, consecutive daily activity streak, and mean quiz score.
- **Course Video & Auto-Quiz Engine**: Admin form in `/admin/courses` uploads video files to Supabase Storage `course-videos` (or saves external URLs) and invokes the quiz generator to create 5–10 domain-accurate multiple-choice questions from the lesson title, description, and key takeaways.
- **Live Broadcast & Chat Engine**: Admin `/admin/sessions` creates/updates rows in `public.live_sessions`, provides WebRTC `getDisplayMedia` screen capture with live preview + frame broadcast or RTMP/HLS stream playback, and syncs chat messages through `public.live_session_messages`.
- **Trades Pagination & Filtering**: Queries `public.student_trades` for the student's `exnessId` / `email`, applies client-side search (`pair`) and filters (`All`, `Open`, `Closed`, `Buy`, `Sell`, `Profitable`), and slices strictly at `10` rows per page with page navigation.
- **Avatar Upload Flow**: In `/settings`, selecting an image uploads to `supabase.storage.from('student-avatars')` (with automatic compressed data-URL fallback if the bucket hasn't been created yet) and updates `public.students.avatar_url`, immediately reflecting in the Admin Student Roster and Drawer.
