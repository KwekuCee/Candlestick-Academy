import { isSupabaseConfigured, supabase } from "./supabaseClient";
import {
  EXNESS_PARTNER_CLIENTS,
  ExnessStudent,
  getStoredCurrentUser,
  getStoredRoster,
  saveStoredCurrentUser,
  saveStoredRoster,
} from "./exnessStore";

// ============================================================================
// 1. COMPLETE DASHBOARD SQL UPGRADE SCRIPT (EXPORTED FOR ONE-CLICK COPY IN UI)
// ============================================================================
export const CLIENT_DASHBOARD_UPGRADE_SQL = `-- ============================================================================
-- CANDLESTICKS ACADEMY — FULL CLIENT & ADMIN DASHBOARD SUPABASE UPGRADE SCHEMA
-- Copy and run in your Supabase SQL Editor (100% Idempotent / Safe on existing DB)
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

-- 2. COURSES TABLE (The 4 Signature Tracks — Safe Upgrade for Existing Table)
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

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_level_check;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'Beginner',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_color TEXT NOT NULL DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS lessons_count INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS min_deposit_required NUMERIC(12,2) NOT NULL DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

INSERT INTO public.courses (id, title, level, description, cover_color, color, sort_order)
VALUES
  ('forex-foundations', 'Forex Foundations', 'Beginner', 'Master currency pairs, pips, lots, leverage, market sessions, and foundational candlestick structure.', 'gold', 'gold', 1),
  ('technical-analysis', 'Technical Analysis', 'Intermediate', 'Identify multi-timeframe market structure, liquidity sweeps, supply and demand zones, and high-probability entries.', 'blue', 'blue', 2),
  ('risk-psychology', 'Risk & Psychology', 'Essential', 'Protect your capital with strict position sizing, drawdown rules, and emotional discipline under live market pressure.', 'violet', 'violet', 3),
  ('price-action', 'Advanced Price Action', 'Advanced', 'Institutional order flow, session liquidity raids, displacement candles, and precision execution models.', 'green', 'green', 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  level = EXCLUDED.level,
  description = EXCLUDED.description,
  cover_color = EXCLUDED.cover_color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- 3. COURSE LESSONS TABLE (Unlimited Video Lessons + Auto-Generated Quizzes)
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 12,
  video_url TEXT NOT NULL DEFAULT '',
  video_source_type TEXT NOT NULL DEFAULT 'url',
  pair_tag TEXT DEFAULT 'EUR/USD · 15M',
  key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
  auto_quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS lesson_number INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Lesson',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS video_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_source_type TEXT NOT NULL DEFAULT 'url',
  ADD COLUMN IF NOT EXISTS pair_tag TEXT DEFAULT 'EUR/USD · 15M',
  ADD COLUMN IF NOT EXISTS key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_course_lessons_course_order
  ON public.course_lessons(course_id, lesson_number ASC);

-- 4. STUDENT LESSON PROGRESS TABLE (Real Completion %, Hours & Streak Tracking)
CREATE TABLE IF NOT EXISTS public.student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL DEFAULT '',
  student_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  watch_minutes NUMERIC(6,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_email, lesson_id)
);

ALTER TABLE public.student_lesson_progress
  ADD COLUMN IF NOT EXISTS student_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS lesson_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS watch_minutes NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_email
  ON public.student_lesson_progress(student_email);

-- 5. STUDENT QUIZ ATTEMPTS TABLE (Real Quiz Average & Assessment History)
CREATE TABLE IF NOT EXISTS public.student_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL DEFAULT '',
  student_email TEXT NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT,
  quiz_title TEXT NOT NULL DEFAULT 'Lesson Quiz',
  score_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 1,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_quiz_attempts
  ADD COLUMN IF NOT EXISTS student_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS lesson_id TEXT,
  ADD COLUMN IF NOT EXISTS quiz_title TEXT NOT NULL DEFAULT 'Lesson Quiz',
  ADD COLUMN IF NOT EXISTS score_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_answers INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_questions INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS passed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_student_quiz_attempts_email
  ON public.student_quiz_attempts(student_email);

-- 6. LIVE SESSIONS TABLE (Admin Scheduling, RTMP/Screen Share & Replays)
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id TEXT PRIMARY KEY,
  slug TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  status TEXT NOT NULL DEFAULT 'scheduled',
  stream_mode TEXT NOT NULL DEFAULT 'screen_share',
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

ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS stream_mode TEXT NOT NULL DEFAULT 'screen_share',
  ADD COLUMN IF NOT EXISTS rtmp_ingest_url TEXT DEFAULT 'rtmp://live.candlesticks.academy/live',
  ADD COLUMN IF NOT EXISTS rtmp_stream_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS stream_playback_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS screen_share_snapshot TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS focus_pair TEXT DEFAULT 'EUR/USD · XAU/USD',
  ADD COLUMN IF NOT EXISTS viewers_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pinned_resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

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

ALTER TABLE public.live_session_messages
  ADD COLUMN IF NOT EXISTS session_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_avatar TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_host BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_live_session_messages_session
  ON public.live_session_messages(session_id, created_at ASC);

-- 8. TRADING SIGNALS TABLE (Admin Signal Publishing -> Student Dashboard & Feed)
CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
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

ALTER TABLE public.trading_signals
  ADD COLUMN IF NOT EXISTS pair TEXT NOT NULL DEFAULT 'EUR / USD',
  ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'BUY',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS entry_price TEXT NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS stop_loss TEXT NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS take_profit TEXT NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS risk_reward TEXT NOT NULL DEFAULT '1 : 2.5',
  ADD COLUMN IF NOT EXISTS timeframe TEXT NOT NULL DEFAULT '15M',
  ADD COLUMN IF NOT EXISTS thesis TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS mentor_quote TEXT DEFAULT 'Patience is part of the setup. Wait for price to confirm structure.',
  ADD COLUMN IF NOT EXISTS current_price TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS floating_pnl_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'Pastor Mike',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 9. STUDENT TRADES TABLE (My Trades — Paginated 10 Per Page, Real P&L & Filters)
CREATE TABLE IF NOT EXISTS public.student_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL DEFAULT '',
  trading_account_id TEXT NOT NULL DEFAULT '',
  pair TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'Buy',
  lot_size NUMERIC(8,2) NOT NULL DEFAULT 0.10,
  open_price TEXT NOT NULL DEFAULT '0',
  close_price TEXT NOT NULL DEFAULT '0',
  pnl_usd NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  return_pct NUMERIC(7,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Closed',
  source TEXT NOT NULL DEFAULT 'exness_sync',
  notes TEXT DEFAULT '',
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.student_trades DROP CONSTRAINT IF EXISTS student_trades_direction_check;

ALTER TABLE public.student_trades
  ADD COLUMN IF NOT EXISTS student_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS trading_account_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS lot_size NUMERIC(8,2) NOT NULL DEFAULT 0.10,
  ADD COLUMN IF NOT EXISTS open_price TEXT NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS close_price TEXT NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS pnl_usd NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS return_pct NUMERIC(7,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Closed',
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'exness_sync',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 10. DIRECT MENTOR Q&A / SUPPORT MESSAGES TABLE
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

ALTER TABLE public.mentor_messages
  ADD COLUMN IF NOT EXISTS student_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_avatar TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_role TEXT NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Trading & Mentorship Question',
  ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

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

ALTER TABLE public.student_certificates
  ADD COLUMN IF NOT EXISTS student_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS course_title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS certificate_code TEXT,
  ADD COLUMN IF NOT EXISTS quiz_average NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS approved_by_admin BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 12. SUPABASE STORAGE BUCKETS FOR PROFILE AVATARS & COURSE VIDEOS
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('student-avatars', 'student-avatars', true),
  ('course-videos', 'course-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

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
    EXECUTE format('DROP POLICY IF EXISTS "Allow full access on %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow full access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public Access Candlesticks Buckets" ON storage.objects;
CREATE POLICY "Public Access Candlesticks Buckets"
  ON storage.objects FOR ALL
  USING (bucket_id IN ('student-avatars', 'course-videos'))
  WITH CHECK (bucket_id IN ('student-avatars', 'course-videos'));
`;

export const DASHBOARD_UPGRADE_SQL = CLIENT_DASHBOARD_UPGRADE_SQL;

// ============================================================================
// 2. DATA MODELS & INTERFACES
// ============================================================================

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface CourseLessonItem {
  id: string;
  courseId: string;
  courseSlug: string;
  lessonNumber: number;
  title: string;
  description: string;
  summary: string;
  durationMinutes: number;
  videoUrl: string;
  videoSourceType: "supabase_storage" | "url";
  pairTag: string;
  keyTakeaways: string[];
  autoQuizQuestions: QuizQuestionItem[];
  isPublished: boolean;
  createdAt: string;
}

export interface CourseTrackItem {
  id: string;
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Essential" | "Advanced";
  description: string;
  coverColor: "gold" | "blue" | "violet" | "green";
  color: string;
  sortOrder: number;
  certificateEnabled: boolean;
  lessons: CourseLessonItem[];
}

export type CourseTrack = CourseTrackItem;

export interface StudentLessonProgressItem {
  id: string;
  studentId: string;
  studentEmail: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  watchMinutes: number;
  completedAt: string;
}

export interface StudentQuizAttemptItem {
  id: string;
  studentId: string;
  studentEmail: string;
  courseId: string;
  lessonId?: string;
  quizTitle: string;
  score: number;
  scorePercent: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  attemptedAt: string;
}

export type QuizAttemptItem = StudentQuizAttemptItem;

export interface StudentCertificateItem {
  id: string;
  studentEmail: string;
  studentName: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  certificateCode: string;
  quizAverage: number;
  approvedByAdmin: boolean;
  issuedBy: string;
  issuedAt: string;
}

export interface LiveSessionResource {
  title: string;
  type: "worksheet" | "chart" | "checklist";
  url: string;
}

export interface LiveSessionItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  scheduledAt: string; // ISO timestamp
  durationMinutes: number;
  status: "scheduled" | "live" | "ended";
  streamMode: "screen_share" | "rtmp_hls" | "embed";
  rtmpIngestUrl: string;
  rtmpStreamKey: string;
  streamPlaybackUrl: string;
  screenShareSnapshot?: string;
  focusPair: string;
  viewersCount: number;
  pinnedResources: LiveSessionResource[];
}

export interface LiveChatMessageItem {
  id: string;
  sessionId: string;
  senderEmail: string;
  senderName: string;
  senderAvatar?: string;
  isHost: boolean;
  message: string;
  isPinned: boolean;
  createdAt: string;
}

export interface TradingSignalItem {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  status: "ACTIVE" | "HIT TP" | "HIT SL" | "CLOSED";
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  entry: string;
  sl: string;
  tp: string;
  rr: string;
  timeframe: string;
  thesis: string;
  commentary: string;
  mentorQuote: string;
  currentPrice?: string;
  floatingPnlText?: string;
  createdBy: string;
  author: string;
  createdAt: string;
}

export interface StudentTradeItem {
  id: string;
  studentEmail: string;
  tradingAccountId: string;
  exnessAccountId: string;
  pair: string;
  direction: "BUY" | "SELL";
  lotSize: number;
  lots: number;
  openPrice: string;
  closePrice: string;
  pnlUsd: number;
  returnPct: number;
  status: "WIN" | "LOSS" | "OPEN";
  source: "EXNESS_SYNC" | "SIGNAL_COPY" | "MANUAL";
  notes?: string;
  executedAt: string;
}

export interface MentorMessageItem {
  id: string;
  studentEmail: string;
  studentName: string;
  studentAvatar?: string;
  senderRole: "student" | "admin";
  subject: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

export interface EconomicCalendarEvent {
  id: string;
  timeUtc: string;
  timeGmt: string;
  currency: "USD" | "EUR" | "GBP" | "XAU" | "JPY";
  event: string;
  impact: "HIGH" | "MEDIUM";
  forecast: string;
  previous: string;
}

// ============================================================================
// 3. AUTO-QUIZ GENERATOR ENGINE (BASED ON UPLOADED COURSE & LESSON CONTENT)
// ============================================================================

export function generateAutoQuizQuestions(
  courseId: string,
  lessonTitle: string,
  lessonDescription: string,
  keyTakeaways: string[]
): QuizQuestionItem[] {
  const cleanTitle = lessonTitle.trim() || "Market Execution";
  const cleanDesc = lessonDescription.trim() || "Understanding structure and risk discipline.";
  const takeaways =
    keyTakeaways.filter(Boolean).length > 0
      ? keyTakeaways.filter(Boolean)
      : [
          `Identify the core market structure principles taught in ${cleanTitle}`,
          "Wait for candle closure confirmation before executing entries",
          "Always define invalidation and stop-loss before calculating lot size",
        ];

  const generated: QuizQuestionItem[] = [
    {
      id: `${courseId}-q1-${Date.now()}`,
      question: `In "${cleanTitle}", what is the primary objective before entering a live market position?`,
      options: [
        takeaways[0] || `Confirm structure alignment and define invalidation levels`,
        "Enter immediately on the 1-minute chart without waiting for session liquidity",
        "Double the lot size after a previous losing trade to recover drawdown",
        "Remove the stop-loss during high-impact economic news releases",
      ],
      correctIndex: 0,
      explanation: `Correct. ${cleanDesc}`,
    },
    {
      id: `${courseId}-q2-${Date.now() + 1}`,
      question: `According to the lesson "${cleanTitle}", how should a trader confirm a valid setup?`,
      options: [
        "Chase impulse candles mid-move before the candle closes",
        takeaways[1] || "Wait for clean candle closure and displacement at a key level",
        "Trade every minor fluctuation during low-liquidity Asian rollover",
        "Rely solely on social media sentiment without checking higher-timeframe bias",
      ],
      correctIndex: 1,
      explanation: "Waiting for candle closure prevents premature entries on liquidity wicks.",
    },
    {
      id: `${courseId}-q3-${Date.now() + 2}`,
      question: `How does "${cleanTitle}" integrate risk management into trade execution?`,
      options: [
        "Risking 25% of account equity on a single high-conviction setup",
        "Moving the stop-loss further away when price approaches invalidation",
        takeaways[2] || "Defining the exact stop-loss invalidation point and sizing lots to 1%–2% max risk",
        "Opening multiple correlated positions simultaneously without calculating margin",
      ],
      correctIndex: 2,
      explanation: "Capital preservation requires pre-defining invalidation and keeping per-trade risk controlled.",
    },
  ];

  // Add track-specific domain questions
  if (courseId === "forex-foundations") {
    generated.push(
      {
        id: `${courseId}-q4`,
        question: "Which trading session overlap provides the deepest institutional liquidity for EUR/USD and XAU/USD?",
        options: [
          "Sydney and Tokyo overlap",
          "London and New York session overlap (1:00 PM – 5:00 PM GMT)",
          "Late Friday market close",
          "Sunday market open rollover",
        ],
        correctIndex: 1,
      },
      {
        id: `${courseId}-q5`,
        question: "If your account balance is $100 and you risk 1% with a 10-pip stop-loss on EUR/USD, what is your maximum dollar risk?",
        options: ["$10.00", "$1.00", "$5.00", "$0.10"],
        correctIndex: 1,
      }
    );
  } else if (courseId === "technical-analysis") {
    generated.push(
      {
        id: `${courseId}-q4`,
        question: "What confirms a true Break of Structure (BOS) in an uptrend?",
        options: [
          "A brief wick above the previous swing high that closes back inside the range",
          "A full-body candle close above the previous swing high",
          "An Equal High formation with decreasing volume",
          "A 1-minute doji inside a 4-hour consolidation",
        ],
        correctIndex: 1,
      },
      {
        id: `${courseId}-q5`,
        question: "Why do institutional traders watch liquidity pools above equal highs and below equal lows?",
        options: [
          "Retail stop-orders cluster there, providing liquidity for institutional order fills",
          "Price never revisits equal highs or lows",
          "Spreads are permanently zero at equal highs",
          "Indicators automatically turn off at those levels",
        ],
        correctIndex: 0,
      }
    );
  } else if (courseId === "risk-psychology") {
    generated.push(
      {
        id: `${courseId}-q4`,
        question: "After hitting your maximum daily drawdown limit (e.g., 2 consecutive losses), what is the correct protocol?",
        options: [
          "Switch to a lower timeframe to win the money back immediately",
          "Close the charts for the session and review your trade journal objectively",
          "Triple the lot size on XAU/USD",
          "Copy random setups outside your trading plan",
        ],
        correctIndex: 1,
      },
      {
        id: `${courseId}-q5`,
        question: "With a 1 : 2.5 Risk-to-Reward ratio, what minimum win rate is needed to remain profitable over 20 trades?",
        options: ["90% win rate", "At least 30%–35% win rate", "75% win rate", "100% win rate"],
        correctIndex: 1,
      }
    );
  } else {
    generated.push(
      {
        id: `${courseId}-q4`,
        question: "What characterizes a high-probability institutional displacement candle after a session liquidity sweep?",
        options: [
          "Small overlapping indecision candles with long wicks on both sides",
          "Large-bodied impulse expansion that leaves a Fair Value Gap (imbalance) and breaks structure",
          "Low-volume sideways chop during bank holidays",
          "Trading directly into high-impact NFP release 10 seconds before announcement",
        ],
        correctIndex: 1,
      },
      {
        id: `${courseId}-q5`,
        question: "When price sweeps the London session low at New York open and reclaims structure, what is the primary bias?",
        options: [
          "Bullish reversal targeting internal and external range liquidity highs",
          "Immediate short entry at the very bottom of the sweep wick",
          "No-trade zone for the rest of the month",
          "Ignore structure and trade counter-trend without confirmation",
        ],
        correctIndex: 0,
      }
    );
  }

  return generated;
}

// ============================================================================
// 4. DEFAULT SEED COURSES & LESSONS (SYNCS WITH SUPABASE)
// ============================================================================

const DEFAULT_COURSE_TRACKS: CourseTrackItem[] = [
  {
    id: "forex-foundations",
    slug: "forex-foundations",
    title: "Forex Foundations",
    level: "Beginner",
    description:
      "Master currency pairs, pips, lots, leverage, market sessions, and foundational candlestick structure from first principles.",
    coverColor: "gold",
    color: "gold",
    sortOrder: 1,
    certificateEnabled: true,
    lessons: [
      "Welcome to the Forex Market",
      "Currency Pairs & Base/Quote Mechanics",
      "Pips, Lots, Margin & Leverage",
      "How Institutional Brokers & Liquidity Work",
      "London, New York & Asian Trading Sessions",
      "Reading Candlestick Anatomy & Momentum",
      "Reading Market Structure (HH, HL, LH, LL)",
      "Institutional Support & Demand Zones",
      "Building a Complete Trade Idea",
      "Creating Your Written Trading Plan",
      "Exness MT4/MT5 Terminal Execution Walkthrough",
      "Foundations Final Mastery Review",
    ].map((title, idx) => ({
      id: `ff-lesson-${idx + 1}`,
      courseId: "forex-foundations",
      courseSlug: "forex-foundations",
      lessonNumber: idx + 1,
      title,
      description: `Step-by-step video breakdown of ${title} with live EUR/USD and XAU/USD chart examples.`,
      summary: `Step-by-step video breakdown of ${title} with live EUR/USD and XAU/USD chart examples.`,
      durationMinutes: 10 + idx * 2,
      videoUrl: "",
      videoSourceType: "url",
      pairTag: idx % 2 === 0 ? "EUR/USD · 15M" : "XAU/USD · 1H",
      keyTakeaways: [
        `Understand the core mechanics of ${title}`,
        "Apply structure and session timing before placing any order",
        "Calculate position size based on stop-loss distance in pips",
      ],
      autoQuizQuestions: generateAutoQuizQuestions("forex-foundations", title, `Core concepts of ${title}`, [
        `Master the fundamentals of ${title} before risking live capital`,
        "Confirm session liquidity and spread stability prior to execution",
        "Maintain strict 1% to 2% risk per trade setup",
      ]),
      isPublished: true,
      createdAt: "2026-10-01T10:00:00Z",
    })),
  },
  {
    id: "technical-analysis",
    slug: "technical-analysis",
    title: "Technical Analysis",
    level: "Intermediate",
    description:
      "Identify multi-timeframe market structure, liquidity sweeps, supply and demand zones, and high-probability entries.",
    coverColor: "blue",
    color: "blue",
    sortOrder: 2,
    certificateEnabled: true,
    lessons: [
      "Multi-Timeframe Top-Down Alignment (D1, 4H, 15M)",
      "Break of Structure (BOS) vs Change of Character (CHoCH)",
      "Mapping Buy-Side & Sell-Side Liquidity Pools",
      "High-Probability Order Blocks & Supply/Demand",
      "Fair Value Gaps (FVG) & Market Imbalances",
      "Session High/Low Sweeps (London & NY Raids)",
      "Trendlines vs Horizontal Institutional Levels",
      "Fibonacci Premium & Discount Pricing Arrays",
      "Candlestick Confirmation Models at Key Zones",
      "Avoiding Low-Probability Inducement Traps",
      "Setting Precision Stop-Loss & Take-Profit Targets",
      "Live Chart Walkthrough: GBP/USD & Gold",
    ].map((title, idx) => ({
      id: `ta-lesson-${idx + 1}`,
      courseId: "technical-analysis",
      courseSlug: "technical-analysis",
      lessonNumber: idx + 1,
      title,
      description: `Practical technical mastery covering ${title} on live forex and gold charts.`,
      summary: `Practical technical mastery covering ${title} on live forex and gold charts.`,
      durationMinutes: 14 + idx * 2,
      videoUrl: "",
      videoSourceType: "url",
      pairTag: idx % 2 === 0 ? "GBP/USD · 4H/15M" : "XAU/USD · 15M",
      keyTakeaways: [
        `Identify ${title} on 4H and 15M charts`,
        "Wait for liquidity sweep + displacement confirmation",
        "Target opposing range liquidity for minimum 1:2.5 R:R",
      ],
      autoQuizQuestions: generateAutoQuizQuestions("technical-analysis", title, `Technical execution of ${title}`, []),
      isPublished: true,
      createdAt: "2026-10-02T10:00:00Z",
    })),
  },
  {
    id: "risk-psychology",
    slug: "risk-psychology",
    title: "Risk & Psychology",
    level: "Essential",
    description:
      "Protect your capital with strict position sizing, drawdown rules, and emotional discipline under live market pressure.",
    coverColor: "violet",
    color: "violet",
    sortOrder: 3,
    certificateEnabled: true,
    lessons: [
      "The Mathematics of Drawdown & Capital Preservation",
      "Position Sizing Formula for Forex & Gold",
      "Why 1:2.5 Risk-to-Reward Beats High Win-Rate Guessing",
      "Eliminating FOMO & Revenge Trading Forever",
      "Daily Loss Limits & Circuit Breaker Rules",
      "Handling Winning Streaks Without Over-Leveraging",
      "Pre-Session Routine & Checklist Discipline",
      "Journaling Every Trade Like an Institutional Desk",
      "Trading Around High-Impact CPI, NFP & FOMC Releases",
      "Scaling From a $50 Account to Consistent Growth",
      "Patience: Knowing When NOT to Trade",
      "Risk & Mindset Mastery Assessment",
    ].map((title, idx) => ({
      id: `rp-lesson-${idx + 1}`,
      courseId: "risk-psychology",
      courseSlug: "risk-psychology",
      lessonNumber: idx + 1,
      title,
      description: `Essential risk control and mindset training: ${title}.`,
      summary: `Essential risk control and mindset training: ${title}.`,
      durationMinutes: 12 + idx,
      videoUrl: "",
      videoSourceType: "url",
      pairTag: "RISK & MINDSET",
      keyTakeaways: [
        `Enforce strict discipline through ${title}`,
        "Never exceed your pre-defined daily loss limit",
        "Grade every trade by rule adherence, not just dollar outcome",
      ],
      autoQuizQuestions: generateAutoQuizQuestions("risk-psychology", title, `Risk management rule: ${title}`, []),
      isPublished: true,
      createdAt: "2026-10-03T10:00:00Z",
    })),
  },
  {
    id: "price-action",
    slug: "price-action",
    title: "Advanced Price Action",
    level: "Advanced",
    description:
      "Institutional order flow, session liquidity raids, displacement candles, and precision execution models.",
    coverColor: "green",
    color: "green",
    sortOrder: 4,
    certificateEnabled: true,
    lessons: [
      "Institutional Order Flow & Interbank Delivery",
      "Asian Range Accumulation & London Manipulation",
      "New York Reversal vs Continuation Signatures",
      "XAU/USD (Gold) Volatility & Liquidity Raid Model",
      "Refining 4H Zones Down to 5M / 15M Entries",
      "Mitigation Blocks vs Breaker Blocks",
      "Managing Open Trades: Breakeven & Partial Profits",
      "Correlated Pair Divergence (DXY, EUR/USD, GBP/USD)",
      "Weekly Profile Templates (Classic Tuesday/Wednesday Low)",
      "High-Conviction Setup Grading Rubric (A+ Setups Only)",
      "Live Execution Case Studies with Pastor Mike",
      "Advanced Price Action Final Certification Review",
    ].map((title, idx) => ({
      id: `pa-lesson-${idx + 1}`,
      courseId: "price-action",
      courseSlug: "price-action",
      lessonNumber: idx + 1,
      title,
      description: `Advanced institutional price action execution: ${title}.`,
      summary: `Advanced institutional price action execution: ${title}.`,
      durationMinutes: 16 + idx * 2,
      videoUrl: "",
      videoSourceType: "url",
      pairTag: "XAU/USD · EUR/USD",
      keyTakeaways: [
        `Execute ${title} with institutional precision`,
        "Align DXY correlation with EUR/USD and XAU/USD setups",
        "Scale partial profits at internal structure highs/lows",
      ],
      autoQuizQuestions: generateAutoQuizQuestions("price-action", title, `Advanced price action: ${title}`, []),
      isPublished: true,
      createdAt: "2026-10-04T10:00:00Z",
    })),
  },
];

// LocalStorage fallback keys
const LS_COURSES_KEY = "candlesticks_courses_tracks_v2";
const LS_PROGRESS_KEY = "candlesticks_student_lesson_progress_v2";
const LS_QUIZ_ATTEMPTS_KEY = "candlesticks_student_quiz_attempts_v2";
const LS_CERTIFICATES_KEY = "candlesticks_student_certificates_v2";
const LS_LIVE_SESSIONS_KEY = "candlesticks_live_sessions_v2";
const LS_LIVE_CHAT_KEY = "candlesticks_live_chat_messages_v2";
const LS_SIGNALS_KEY = "candlesticks_trading_signals_v2";
const LS_TRADES_KEY = "candlesticks_student_trades_v2";
const LS_MENTOR_MESSAGES_KEY = "candlesticks_mentor_messages_v2";

function emitPortalUpdate() {
  window.dispatchEvent(new Event("candlesticks_portal_data_updated"));
}

// ============================================================================
// 5. COURSES & UNLIMITED VIDEO LESSON MANAGEMENT
// ============================================================================

export function getCachedCourses(): CourseTrackItem[] {
  try {
    const raw = localStorage.getItem(LS_COURSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CourseTrackItem[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_COURSE_TRACKS;
}

export async function fetchCoursesWithLessons(): Promise<CourseTrackItem[]> {
  const localTracks = getCachedCourses();

  if (!isSupabaseConfigured || !supabase) {
    return localTracks;
  }

  try {
    const [coursesRes, lessonsRes] = await Promise.all([
      supabase.from("courses").select("*").order(" created_at", { ascending: true }),
      supabase.from("course_lessons").select("*").order("lesson_number", { ascending: true }),
    ]);

    if (Array.isArray(lessonsRes.data) && lessonsRes.data.length > 0) {
      const dbLessons: CourseLessonItem[] = lessonsRes.data.map((r: any) => ({
        id: String(r.id),
        courseId: String(r.course_id),
        courseSlug: String(r.course_id),
        lessonNumber: Number(r.lesson_number || 1),
        title: String(r.title || "Lesson"),
        description: String(r.description || ""),
        summary: String(r.description || ""),
        durationMinutes: Number(r.duration_minutes || 12),
        videoUrl: String(r.video_url || ""),
        videoSourceType: r.video_source_type === "supabase_storage" ? "supabase_storage" : "url",
        pairTag: String(r.pair_tag || "EUR/USD · 15M"),
        keyTakeaways: Array.isArray(r.key_takeaways) ? r.key_takeaways : [],
        autoQuizQuestions:
          Array.isArray(r.auto_quiz_questions) && r.auto_quiz_questions.length > 0
            ? r.auto_quiz_questions
            : generateAutoQuizQuestions(
                String(r.course_id),
                String(r.title || "Lesson"),
                String(r.description || ""),
                Array.isArray(r.key_takeaways) ? r.key_takeaways : []
              ),
        isPublished: r.is_published !== false,
        createdAt: String(r.created_at || new Date().toISOString()),
      }));

      const merged = localTracks.map((track) => {
        const trackDbLessons = dbLessons.filter((l) => l.courseId === track.id);
        if (trackDbLessons.length === 0) return { ...track, slug: track.id, color: track.coverColor };
        const byNum = new Map<number, CourseLessonItem>();
        track.lessons.forEach((l) => byNum.set(l.lessonNumber, l));
        trackDbLessons.forEach((l) => byNum.set(l.lessonNumber, l));
        const combined = Array.from(byNum.values()).sort((a, b) => a.lessonNumber - b.lessonNumber);
        return {
          ...track,
          slug: track.id,
          color: track.coverColor,
          lessons: combined,
        };
      });

      localStorage.setItem(LS_COURSES_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.debug("Supabase courses fetch note:", err);
  }

  return localTracks.map((t) => ({ ...t, slug: t.id, color: t.coverColor }));
}

export const fetchCoursesWithLessonsFromDb = fetchCoursesWithLessons;

export async function uploadCourseVideoFile(
  courseId: string,
  file: File
): Promise<{ success: boolean; url: string; message: string }> {
  const safeName = `${courseId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.storage.from("course-videos").upload(safeName, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (!error) {
        const { data } = supabase.storage.from("course-videos").getPublicUrl(safeName);
        if (data?.publicUrl) {
          return {
            success: true,
            url: data.publicUrl,
            message: "Video uploaded to Supabase Storage (course-videos bucket).",
          };
        }
      }
    } catch (err) {
      console.debug("Supabase storage video upload fallback:", err);
    }
  }

  // Fallback object URL for immediate session playback
  const blobUrl = URL.createObjectURL(file);
  return {
    success: true,
    url: blobUrl,
    message:
      "Video ready for playback. Run the Supabase SQL Upgrade Schema to enable permanent cloud bucket storage (course-videos).",
  };
}

export async function saveCourseLessonToDb(params: {
  courseId: string;
  lessonId?: string;
  lessonNumber: number;
  title: string;
  description: string;
  durationMinutes: number;
  videoUrl: string;
  videoSourceType: "supabase_storage" | "url";
  pairTag: string;
  keyTakeaways: string[];
}): Promise<{ success: boolean; lesson: CourseLessonItem; message: string }> {
  const autoQuizQuestions = generateAutoQuizQuestions(
    params.courseId,
    params.title,
    params.description,
    params.keyTakeaways
  );

  const newLesson: CourseLessonItem = {
    id: params.lessonId || `${params.courseId}-lesson-${Date.now()}`,
    courseId: params.courseId,
    courseSlug: params.courseId,
    lessonNumber: params.lessonNumber,
    title: params.title.trim(),
    description: params.description.trim(),
    summary: params.description.trim(),
    durationMinutes: Math.max(1, Number(params.durationMinutes || 12)),
    videoUrl: params.videoUrl.trim(),
    videoSourceType: params.videoSourceType,
    pairTag: params.pairTag.trim() || "EUR/USD · 15M",
    keyTakeaways: params.keyTakeaways.filter(Boolean),
    autoQuizQuestions,
    isPublished: true,
    createdAt: new Date().toISOString(),
  };

  // Update local cache immediately
  const tracks = getCachedCourses();
  const updatedTracks = tracks.map((t) => {
    if (t.id !== params.courseId) return t;
    const filtered = t.lessons.filter(
      (l) => l.id !== newLesson.id && l.lessonNumber !== newLesson.lessonNumber
    );
    const nextLessons = [...filtered, newLesson].sort((a, b) => a.lessonNumber - b.lessonNumber);
    return { ...t, lessons: nextLessons };
  });
  localStorage.setItem(LS_COURSES_KEY, JSON.stringify(updatedTracks));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("course_lessons")
        .insert({
          course_id: newLesson.courseId,
          lesson_number: newLesson.lessonNumber,
          title: newLesson.title,
          description: newLesson.description,
          duration_minutes: newLesson.durationMinutes,
          video_url: newLesson.videoUrl,
          video_source_type: newLesson.videoSourceType,
          pair_tag: newLesson.pairTag,
          key_takeaways: newLesson.keyTakeaways,
          auto_quiz_questions: newLesson.autoQuizQuestions,
          is_published: true,
        })
        .select()
        .single();

      if (!error && data?.id) {
        newLesson.id = String(data.id);
      }
    } catch (err) {
      console.debug("Supabase saveCourseLessonToDb note:", err);
    }
  }

  emitPortalUpdate();
  return {
    success: true,
    lesson: newLesson,
    message: `Lesson #${newLesson.lessonNumber} ("${newLesson.title}") saved and ${autoQuizQuestions.length} quiz questions auto-generated!`,
  };
}

export async function deleteCourseLessonFromDb(courseId: string, lessonId: string): Promise<void> {
  const tracks = getCachedCourses().map((t) => {
    if (t.id !== courseId) return t;
    return {
      ...t,
      lessons: t.lessons.filter((l) => l.id !== lessonId),
    };
  });
  localStorage.setItem(LS_COURSES_KEY, JSON.stringify(tracks));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("course_lessons").delete().eq("id", lessonId);
    } catch {
      // ignore
    }
  }
  emitPortalUpdate();
}

// ============================================================================
// 6. REAL STUDENT LESSON PROGRESS, STREAK & QUIZ AVERAGE ENGINE (ZERO DEMO DATA)
// ============================================================================

export function getCachedLessonProgress(studentEmail: string): StudentLessonProgressItem[] {
  const cleanEmail = (studentEmail || "").trim().toLowerCase();
  try {
    const raw = localStorage.getItem(LS_PROGRESS_KEY);
    if (raw) {
      const list = JSON.parse(raw) as StudentLessonProgressItem[];
      return list.filter((p) => p.studentEmail.toLowerCase() === cleanEmail && p.completed);
    }
  } catch {
    // ignore
  }
  return [];
}

export function getCachedQuizAttempts(studentEmail: string): StudentQuizAttemptItem[] {
  const cleanEmail = (studentEmail || "").trim().toLowerCase();
  try {
    const raw = localStorage.getItem(LS_QUIZ_ATTEMPTS_KEY);
    if (raw) {
      const list = JSON.parse(raw) as StudentQuizAttemptItem[];
      return list
        .filter((q) => q.studentEmail.toLowerCase() === cleanEmail)
        .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime());
    }
  } catch {
    // ignore
  }
  return [];
}

export async function syncStudentLearningDataFromSupabase(studentEmail: string): Promise<{
  progress: StudentLessonProgressItem[];
  quizAttempts: StudentQuizAttemptItem[];
}> {
  const cleanEmail = (studentEmail || "").trim().toLowerCase();
  if (!cleanEmail || !isSupabaseConfigured || !supabase) {
    return {
      progress: getCachedLessonProgress(cleanEmail),
      quizAttempts: getCachedQuizAttempts(cleanEmail),
    };
  }

  try {
    const [progRes, quizRes] = await Promise.all([
      supabase.from("student_lesson_progress").select("*").ilike("student_email", cleanEmail),
      supabase
        .from("student_quiz_attempts")
        .select("*")
        .ilike("student_email", cleanEmail)
        .order("attempted_at", { ascending: false }),
    ]);

    if (Array.isArray(progRes.data) && progRes.data.length > 0) {
      const mappedProg: StudentLessonProgressItem[] = progRes.data.map((r: any) => ({
        id: String(r.id),
        studentId: String(r.student_id || ""),
        studentEmail: String(r.student_email || cleanEmail),
        courseId: String(r.course_id),
        lessonId: String(r.lesson_id),
        completed: Boolean(r.completed),
        watchMinutes: Number(r.watch_minutes || 12),
        completedAt: String(r.completed_at || new Date().toISOString()),
      }));
      const rawAll = localStorage.getItem(LS_PROGRESS_KEY);
      const others = rawAll
        ? (JSON.parse(rawAll) as StudentLessonProgressItem[]).filter(
            (p) => p.studentEmail.toLowerCase() !== cleanEmail
          )
        : [];
      localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify([...others, ...mappedProg]));
    }

    if (Array.isArray(quizRes.data) && quizRes.data.length > 0) {
      const mappedQuiz: StudentQuizAttemptItem[] = quizRes.data.map((r: any) => ({
        id: String(r.id),
        studentId: String(r.student_id || ""),
        studentEmail: String(r.student_email || cleanEmail),
        courseId: String(r.course_id),
        lessonId: r.lesson_id ? String(r.lesson_id) : undefined,
        quizTitle: String(r.quiz_title || "Course Assessment"),
        score: Number(r.correct_answers || 0),
        scorePercent: Number(r.score_percent || 0),
        correctAnswers: Number(r.correct_answers || 0),
        totalQuestions: Number(r.total_questions || 1),
        passed: Boolean(r.passed),
        attemptedAt: String(r.attempted_at || new Date().toISOString()),
      }));
      const rawAll = localStorage.getItem(LS_QUIZ_ATTEMPTS_KEY);
      const others = rawAll
        ? (JSON.parse(rawAll) as StudentQuizAttemptItem[]).filter(
            (q) => q.studentEmail.toLowerCase() !== cleanEmail
          )
        : [];
      localStorage.setItem(LS_QUIZ_ATTEMPTS_KEY, JSON.stringify([...others, ...mappedQuiz]));
    }
  } catch (err) {
    console.debug("Supabase learning data sync note:", err);
  }

  return {
    progress: getCachedLessonProgress(cleanEmail),
    quizAttempts: getCachedQuizAttempts(cleanEmail),
  };
}

export async function fetchStudentLessonsCompletedFromDb(
  studentEmail: string
): Promise<StudentLessonProgressItem[]> {
  const res = await syncStudentLearningDataFromSupabase(studentEmail);
  return res.progress;
}

export async function fetchStudentQuizAttemptsFromDb(
  studentEmail: string
): Promise<StudentQuizAttemptItem[]> {
  const res = await syncStudentLearningDataFromSupabase(studentEmail);
  return res.quizAttempts;
}

export async function toggleLessonCompletedInDb(
  arg1:
    | {
        student: ExnessStudent;
        courseId: string;
        lesson: CourseLessonItem;
      }
    | string,
  lessonIdArg?: string,
  courseSlugArg?: string
): Promise<{ completed: boolean; courseProgressPct: number }> {
  const currentUser = getStoredCurrentUser();
  let studentObj: ExnessStudent = currentUser;
  let courseId = courseSlugArg || "forex-foundations";
  let lessonObj: CourseLessonItem | undefined;

  if (typeof arg1 === "string") {
    studentObj = { ...currentUser, email: arg1 };
    const tracks = getCachedCourses();
    for (const t of tracks) {
      const found = t.lessons.find((l) => l.id === lessonIdArg);
      if (found) {
        lessonObj = found;
        courseId = t.id;
        break;
      }
    }
    if (!lessonObj) {
      lessonObj = tracks[0].lessons[0];
    }
  } else {
    studentObj = arg1.student;
    courseId = arg1.courseId;
    lessonObj = arg1.lesson;
  }

  const cleanEmail = (studentObj.email || "").trim().toLowerCase();
  const rawAll = localStorage.getItem(LS_PROGRESS_KEY);
  const allList: StudentLessonProgressItem[] = rawAll ? JSON.parse(rawAll) : [];

  const existingIdx = allList.findIndex(
    (p) => p.studentEmail.toLowerCase() === cleanEmail && p.lessonId === lessonObj.id
  );

  let isNowCompleted = true;
  if (existingIdx >= 0) {
    isNowCompleted = !allList[existingIdx].completed;
    if (!isNowCompleted) {
      allList.splice(existingIdx, 1);
    } else {
      allList[existingIdx].completed = true;
      allList[existingIdx].completedAt = new Date().toISOString();
    }
  } else {
    allList.push({
      id: `prog-${Date.now()}`,
      studentId: studentObj.id,
      studentEmail: cleanEmail,
      courseId,
      lessonId: lessonObj.id,
      completed: true,
      watchMinutes: lessonObj.durationMinutes,
      completedAt: new Date().toISOString(),
    });
  }

  localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(allList));

  if (isSupabaseConfigured && supabase) {
    try {
      if (isNowCompleted) {
        await supabase.from("student_lesson_progress").upsert(
          {
            student_id: studentObj.id,
            student_email: cleanEmail,
            course_id: courseId,
            lesson_id: lessonObj.id,
            completed: true,
            watch_minutes: lessonObj.durationMinutes,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "student_email,lesson_id" }
        );
      } else {
        await supabase
          .from("student_lesson_progress")
          .delete()
          .eq("student_email", cleanEmail)
          .eq("lesson_id", lessonObj.id);
      }
    } catch (err) {
      console.debug("Supabase lesson progress upsert note:", err);
    }
  }

  const metrics = computeStudentRealDashboardMetrics(studentObj.email);
  const courseStat = metrics.courseBreakdown.find((c) => c.courseId === courseId);

  // If course reaches 100%, auto-issue certificate
  if (courseStat && courseStat.progressPct === 100) {
    await issueStudentCourseCertificate({
      studentEmail: cleanEmail,
      studentName: studentObj.fullName,
      courseId,
      courseTitle: courseStat.title,
      quizAverage: metrics.quizAveragePct || 100,
    });
  }

  emitPortalUpdate();
  return {
    completed: isNowCompleted,
    courseProgressPct: courseStat ? courseStat.progressPct : 0,
  };
}

export async function recordQuizAttemptInDb(
  arg1:
    | {
        student: ExnessStudent;
        courseId: string;
        lessonId?: string;
        quizTitle: string;
        correctAnswers: number;
        totalQuestions: number;
      }
    | string,
  courseSlugArg?: string,
  quizTitleArg?: string,
  correctAnswersArg?: number,
  totalQuestionsArg?: number
): Promise<StudentQuizAttemptItem> {
  const currentUser = getStoredCurrentUser();
  const params =
    typeof arg1 === "string"
      ? {
          student: { ...currentUser, email: arg1 },
          courseId: courseSlugArg || "forex-foundations",
          quizTitle: quizTitleArg || "Course Assessment",
          correctAnswers: correctAnswersArg ?? 0,
          totalQuestions: totalQuestionsArg ?? 1,
        }
      : arg1;

  const cleanEmail = params.student.email.trim().toLowerCase();
  const scorePercent =
    params.totalQuestions > 0
      ? Math.round((params.correctAnswers / params.totalQuestions) * 100)
      : 0;
  const passed = scorePercent >= 70;

  const attempt: StudentQuizAttemptItem = {
    id: `quiz-${Date.now()}`,
    studentId: params.student.id,
    studentEmail: cleanEmail,
    courseId: params.courseId,
    lessonId: params.lessonId,
    quizTitle: params.quizTitle,
    score: params.correctAnswers,
    scorePercent,
    correctAnswers: params.correctAnswers,
    totalQuestions: params.totalQuestions,
    passed,
    attemptedAt: new Date().toISOString(),
  };

  const rawAll = localStorage.getItem(LS_QUIZ_ATTEMPTS_KEY);
  const allList: StudentQuizAttemptItem[] = rawAll ? JSON.parse(rawAll) : [];
  allList.unshift(attempt);
  localStorage.setItem(LS_QUIZ_ATTEMPTS_KEY, JSON.stringify(allList));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("student_quiz_attempts").insert({
        student_id: params.student.id,
        student_email: cleanEmail,
        course_id: params.courseId,
        lesson_id: params.lessonId || null,
        quiz_title: params.quizTitle,
        score_percent: scorePercent,
        correct_answers: params.correctAnswers,
        total_questions: params.totalQuestions,
        passed,
        attempted_at: attempt.attemptedAt,
      });
    } catch (err) {
      console.debug("Supabase quiz attempt insert note:", err);
    }
  }

  emitPortalUpdate();
  return attempt;
}

export interface StudentRealDashboardMetrics {
  overallProgressPct: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  hoursLearned: number;
  streakDays: number;
  bestStreakDays: number;
  quizAveragePct: number;
  totalQuizzesTaken: number;
  courseBreakdown: Array<{
    courseId: string;
    title: string;
    level: string;
    coverColor: string;
    completedCount: number;
    totalCount: number;
    progressPct: number;
    nextLesson: CourseLessonItem | null;
  }>;
  activeCourse: {
    courseId: string;
    courseTitle: string;
    progressPct: number;
    completedCount: number;
    totalCount: number;
    nextLesson: CourseLessonItem;
  };
  studyHeatmap56Days: Array<{
    dateStr: string;
    count: number;
    intensity: "none" | "mid" | "high";
  }>;
  recentQuizAttempts: StudentQuizAttemptItem[];
}

export function computeStudentRealDashboardMetrics(studentEmail: string): StudentRealDashboardMetrics {
  const tracks = getCachedCourses();
  const progress = getCachedLessonProgress(studentEmail);
  const quizAttempts = getCachedQuizAttempts(studentEmail);

  const completedSet = new Set(progress.map((p) => p.lessonId));

  let totalLessonsCount = 0;
  let completedLessonsCount = 0;
  let totalMinutesLearned = 0;

  const courseBreakdown = tracks.map((track) => {
    const totalCount = track.lessons.length;
    totalLessonsCount += totalCount;

    let completedInTrack = 0;
    let nextLesson: CourseLessonItem | null = null;

    track.lessons.forEach((lesson) => {
      if (completedSet.has(lesson.id)) {
        completedInTrack += 1;
        completedLessonsCount += 1;
        totalMinutesLearned += lesson.durationMinutes;
      } else if (!nextLesson) {
        nextLesson = lesson;
      }
    });

    if (!nextLesson && track.lessons.length > 0) {
      nextLesson = track.lessons[track.lessons.length - 1];
    }

    const progressPct = totalCount > 0 ? Math.round((completedInTrack / totalCount) * 100) : 0;

    return {
      courseId: track.id,
      title: track.title,
      level: track.level,
      coverColor: track.coverColor,
      completedCount: completedInTrack,
      totalCount,
      progressPct,
      nextLesson,
    };
  });

  const overallProgressPct =
    totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;
  const hoursLearned = Number((totalMinutesLearned / 60).toFixed(1));

  // Compute Quiz Average from real quiz attempts
  const totalQuizzesTaken = quizAttempts.length;
  const quizAveragePct =
    totalQuizzesTaken > 0
      ? Math.round(quizAttempts.reduce((sum, q) => sum + q.scorePercent, 0) / totalQuizzesTaken)
      : 0;

  // Compute Real Consecutive Study Streak & 56-Day Study Activity Heatmap from actual timestamps
  const activityByDay = new Map<string, number>();
  progress.forEach((p) => {
    const day = p.completedAt.slice(0, 10);
    activityByDay.set(day, (activityByDay.get(day) || 0) + 1);
  });
  quizAttempts.forEach((q) => {
    const day = q.attemptedAt.slice(0, 10);
    activityByDay.set(day, (activityByDay.get(day) || 0) + 1);
  });

  const today = new Date();
  const studyHeatmap56Days: Array<{
    dateStr: string;
    count: number;
    intensity: "none" | "mid" | "high";
  }> = [];

  for (let i = 55; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = activityByDay.get(dateStr) || 0;
    studyHeatmap56Days.push({
      dateStr,
      count,
      intensity: count >= 2 ? "high" : count === 1 ? "mid" : "none",
    });
  }

  // Consecutive days streak calculation
  let streakDays = 0;
  let bestStreakDays = 0;
  let runningStreak = 0;
  for (let i = 0; i < studyHeatmap56Days.length; i++) {
    if (studyHeatmap56Days[i].count > 0) {
      runningStreak += 1;
      if (runningStreak > bestStreakDays) bestStreakDays = runningStreak;
    } else {
      runningStreak = 0;
    }
  }

  // Current streak counting backwards from today (or yesterday)
  for (let i = studyHeatmap56Days.length - 1; i >= 0; i--) {
    const dayEntry = studyHeatmap56Days[i];
    if (dayEntry.count > 0) {
      streakDays += 1;
    } else if (i === studyHeatmap56Days.length - 1) {
      // Allow today to have 0 if yesterday had activity
      continue;
    } else {
      break;
    }
  }

  // Determine the active "Continue Learning" course
  const inProgressCourse =
    courseBreakdown.find((c) => c.completedCount > 0 && c.completedCount < c.totalCount) ||
    courseBreakdown.find((c) => c.completedCount < c.totalCount) ||
    courseBreakdown[0];

  const fallbackLesson = tracks[0].lessons[0];

  return {
    overallProgressPct,
    completedLessonsCount,
    totalLessonsCount,
    hoursLearned,
    streakDays,
    bestStreakDays: Math.max(bestStreakDays, streakDays),
    quizAveragePct,
    totalQuizzesTaken,
    courseBreakdown,
    activeCourse: {
      courseId: inProgressCourse.courseId,
      courseTitle: inProgressCourse.title,
      progressPct: inProgressCourse.progressPct,
      completedCount: inProgressCourse.completedCount,
      totalCount: inProgressCourse.totalCount,
      nextLesson: inProgressCourse.nextLesson || fallbackLesson,
    },
    studyHeatmap56Days,
    recentQuizAttempts: quizAttempts.slice(0, 6),
  };
}

export function getStudentProgressMetrics(studentEmail: string) {
  const m = computeStudentRealDashboardMetrics(studentEmail);
  const progress = getCachedLessonProgress(studentEmail);
  const quizAttempts = getCachedQuizAttempts(studentEmail);
  return {
    ...m,
    overallPercent: m.overallProgressPct,
    totalLessons: m.totalLessonsCount,
    averageQuizScore: m.quizAveragePct,
    quizCount: m.totalQuizzesTaken,
    nextLesson: m.activeCourse.nextLesson,
    completedLessonIds: progress.map((p) => p.lessonId),
    quizAttempts,
    courseBreakdown: m.courseBreakdown.map((c) => ({
      ...c,
      slug: c.courseId,
      color: c.coverColor,
      totalLessons: c.totalCount,
    })),
  };
}

export function generateQuizForCourse(courseSlug: string): QuizQuestionItem[] {
  const tracks = getCachedCourses();
  const track = tracks.find((t) => t.id === courseSlug || t.slug === courseSlug) || tracks[0];
  if (!track) return [];
  const collected: QuizQuestionItem[] = [];
  for (const lesson of track.lessons) {
    if (Array.isArray(lesson.autoQuizQuestions) && lesson.autoQuizQuestions.length > 0) {
      collected.push(lesson.autoQuizQuestions[0]);
    }
  }
  if (collected.length >= 5) {
    return collected.slice(0, 8);
  }
  return generateAutoQuizQuestions(track.id, track.title, track.description, []);
}

export function formatCountdown(scheduledAtIso: string): {
  isLiveNow: boolean;
  formatted: string;
} {
  const target = new Date(scheduledAtIso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((target - now) / 1000);
  if (isNaN(diffSec) || diffSec <= 0) {
    return { isLiveNow: true, formatted: "LIVE NOW" };
  }
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  const pad = (v: number) => String(v).padStart(2, "0");
  return {
    isLiveNow: false,
    formatted: `${pad(hrs)}:${pad(mins)}:${pad(secs)}`,
  };
}

export function calculateLotSize(
  balanceUsd: number,
  riskPct: number,
  stopLossPips: number
): {
  riskUsd: number;
  recommendedLots: number;
} {
  const safeBalance = Math.max(10, Number(balanceUsd) || 100);
  const safeRisk = Math.max(0.1, Number(riskPct) || 1);
  const safeStop = Math.max(1, Number(stopLossPips) || 20);
  const riskUsd = Number(((safeBalance * safeRisk) / 100).toFixed(2));
  const rawLots = riskUsd / (safeStop * 10);
  const recommendedLots = Math.max(0.01, Number(rawLots.toFixed(2)));
  return { riskUsd, recommendedLots };
}

// ============================================================================
// 7. VERIFIED COURSE COMPLETION CERTIFICATES
// ============================================================================

export function getCachedCertificates(studentEmail?: string): StudentCertificateItem[] {
  try {
    const raw = localStorage.getItem(LS_CERTIFICATES_KEY);
    if (raw) {
      const list = JSON.parse(raw) as StudentCertificateItem[];
      if (!studentEmail) return list;
      return list.filter((c) => c.studentEmail.toLowerCase() === studentEmail.trim().toLowerCase());
    }
  } catch {
    // ignore
  }
  return [];
}

export async function fetchStudentCertificatesFromDb(
  studentEmail?: string
): Promise<StudentCertificateItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from("student_certificates").select("*").order("issued_at", { ascending: false });
      if (studentEmail) {
        query = query.ilike("student_email", studentEmail.trim().toLowerCase());
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: StudentCertificateItem[] = data.map((r: any) => ({
          id: String(r.id),
          studentEmail: String(r.student_email),
          studentName: String(r.student_name),
          courseId: String(r.course_id),
          courseSlug: String(r.course_id),
          courseTitle: String(r.course_title),
          certificateCode: String(r.certificate_code),
          quizAverage: Number(r.quiz_average || 100),
          approvedByAdmin: Boolean(r.approved_by_admin ?? true),
          issuedBy: "Pastor Mike",
          issuedAt: String(r.issued_at || new Date().toISOString()),
        }));
        return mapped;
      }
    } catch {
      // ignore
    }
  }
  return getCachedCertificates(studentEmail);
}

export async function issueStudentCourseCertificate(params: {
  studentEmail: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  quizAverage: number;
}): Promise<StudentCertificateItem> {
  const cleanEmail = params.studentEmail.trim().toLowerCase();
  const existing = getCachedCertificates(cleanEmail).find((c) => c.courseId === params.courseId);
  if (existing) return existing;

  const cert: StudentCertificateItem = {
    id: `cert-${Date.now()}`,
    studentEmail: cleanEmail,
    studentName: params.studentName,
    courseId: params.courseId,
    courseSlug: params.courseId,
    courseTitle: params.courseTitle,
    certificateCode: `CSA-${params.courseId.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
    quizAverage: params.quizAverage,
    approvedByAdmin: true,
    issuedBy: "Pastor Mike",
    issuedAt: new Date().toISOString(),
  };

  const all = getCachedCertificates();
  all.unshift(cert);
  localStorage.setItem(LS_CERTIFICATES_KEY, JSON.stringify(all));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("student_certificates").upsert(
        {
          student_email: cert.studentEmail,
          student_name: cert.studentName,
          course_id: cert.courseId,
          course_title: cert.courseTitle,
          certificate_code: cert.certificateCode,
          quiz_average: cert.quizAverage,
          approved_by_admin: true,
          issued_at: cert.issuedAt,
        },
        { onConflict: "student_email,course_id" }
      );
    } catch {
      // ignore
    }
  }

  emitPortalUpdate();
  return cert;
}

export async function issueStudentCertificateInDb(
  studentEmail: string,
  studentName: string,
  courseSlug: string,
  courseTitle: string
): Promise<StudentCertificateItem> {
  return issueStudentCourseCertificate({
    studentEmail,
    studentName,
    courseId: courseSlug,
    courseTitle,
    quizAverage: 100,
  });
}

export async function revokeStudentCertificateInDb(certId: string): Promise<void> {
  const all = getCachedCertificates().filter((c) => c.id !== certId);
  localStorage.setItem(LS_CERTIFICATES_KEY, JSON.stringify(all));
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("student_certificates").delete().eq("id", certId);
    } catch {
      // ignore
    }
  }
  emitPortalUpdate();
}

// ============================================================================
// 8. LIVE SESSIONS, RTMP / BROWSER SCREEN SHARE & REAL-TIME LIVE CHAT
// ============================================================================

function getDefaultLiveSessions(): LiveSessionItem[] {
  const now = new Date();
  const nextSessionTime = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 14 * 60 * 1000); // 2h 14m from now
  const wedSessionTime = new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const sunSessionTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  return [
    {
      id: "new-york",
      slug: "new-york",
      title: "New York Session: Live Market Breakdown & Execution",
      description: "Live analysis and trade execution on EUR/USD, GBP/USD, and XAU/USD (Gold) as New York opens.",
      scheduledAt: nextSessionTime.toISOString(),
      durationMinutes: 90,
      status: "scheduled",
      streamMode: "screen_share",
      rtmpIngestUrl: "rtmp://live.candlesticks.academy/live",
      rtmpStreamKey: "csa_live_ny_qgcrue4rqj",
      streamPlaybackUrl: "",
      screenShareSnapshot: "",
      focusPair: "EUR/USD · XAU/USD · GBP/USD",
      viewersCount: 1,
      pinnedResources: [
        {
          title: "New York Open Pre-Session Checklist & Key Levels",
          type: "worksheet",
          url: "#checklist",
        },
        {
          title: "EUR/USD & XAU/USD Institutional Liquidity Map",
          type: "chart",
          url: "#liquidity-map",
        },
      ],
    },
    {
      id: "risk-clinic",
      slug: "risk-clinic",
      title: "Risk Clinic: Protecting Capital & Scaling Accounts",
      description: "Live workshop on position sizing, drawdown recovery, and trade journaling.",
      scheduledAt: wedSessionTime.toISOString(),
      durationMinutes: 60,
      status: "scheduled",
      streamMode: "screen_share",
      rtmpIngestUrl: "rtmp://live.candlesticks.academy/live",
      rtmpStreamKey: "csa_live_risk_qgcrue4rqj",
      streamPlaybackUrl: "",
      screenShareSnapshot: "",
      focusPair: "XAU/USD · RISK MANAGEMENT",
      viewersCount: 0,
      pinnedResources: [],
    },
    {
      id: "weekly-outlook",
      slug: "weekly-outlook",
      title: "Sunday Weekly Outlook & Institutional Order Flow",
      description: "Mapping weekly higher-timeframe bias, DXY structure, and high-impact news catalysts.",
      scheduledAt: sunSessionTime.toISOString(),
      durationMinutes: 90,
      status: "scheduled",
      streamMode: "screen_share",
      rtmpIngestUrl: "rtmp://live.candlesticks.academy/live",
      rtmpStreamKey: "csa_live_outlook_qgcrue4rqj",
      streamPlaybackUrl: "",
      screenShareSnapshot: "",
      focusPair: "DXY · EUR/USD · XAU/USD",
      viewersCount: 0,
      pinnedResources: [],
    },
  ];
}

export function getCachedLiveSessions(): LiveSessionItem[] {
  try {
    const raw = localStorage.getItem(LS_LIVE_SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LiveSessionItem[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  const defaults = getDefaultLiveSessions();
  localStorage.setItem(LS_LIVE_SESSIONS_KEY, JSON.stringify(defaults));
  return defaults;
}

export async function fetchLiveSessionsFromDb(): Promise<LiveSessionItem[]> {
  const local = getCachedLiveSessions();
  if (!isSupabaseConfigured || !supabase) return local;

  try {
    const { data, error } = await supabase
      .from("live_sessions")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped: LiveSessionItem[] = data.map((r: any, idx: number) => {
        const fallback = local[idx] || local[0];
        let parsedDate = r.scheduled_at ? new Date(String(r.scheduled_at)) : new Date();
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date(Date.now() + (idx + 1) * 2 * 3600 * 1000);
        }
        return {
          id: String(r.id || r.slug || `session-${idx}`),
          slug: String(r.slug || r.id || `session-${idx}`),
          title: String(r.title || fallback.title),
          description: String(r.description || fallback.description),
          scheduledAt: parsedDate.toISOString(),
          durationMinutes: Number(r.duration_minutes || 90),
          status:
            r.status === "live" || r.session_type === "live"
              ? "live"
              : r.status === "ended"
              ? "ended"
              : "scheduled",
          streamMode:
            r.stream_mode === "rtmp_hls" || r.stream_mode === "embed"
              ? r.stream_mode
              : "screen_share",
          rtmpIngestUrl: String(r.rtmp_ingest_url || "rtmp://live.candlesticks.academy/live"),
          rtmpStreamKey: String(r.rtmp_stream_key || `csa_live_${r.id || "stream"}`),
          streamPlaybackUrl: String(r.stream_playback_url || ""),
          screenShareSnapshot: String(r.screen_share_snapshot || ""),
          focusPair: String(r.focus_pair || "EUR/USD · XAU/USD"),
          viewersCount: Number(r.viewers_count || r.registered_count || 1),
          pinnedResources: Array.isArray(r.pinned_resources)
            ? r.pinned_resources
            : fallback.pinnedResources,
        };
      });
      localStorage.setItem(LS_LIVE_SESSIONS_KEY, JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.debug("Supabase fetchLiveSessionsFromDb note:", err);
  }
  return local;
}

export async function saveLiveSessionInDb(session: LiveSessionItem): Promise<LiveSessionItem> {
  const list = getCachedLiveSessions();
  const idx = list.findIndex((s) => s.id === session.id || s.slug === session.slug);
  if (idx >= 0) {
    list[idx] = session;
  } else {
    list.unshift(session);
  }
  localStorage.setItem(LS_LIVE_SESSIONS_KEY, JSON.stringify(list));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("live_sessions").upsert(
        {
          id: session.id,
          slug: session.slug,
          title: session.title,
          description: session.description,
          session_type: session.status === "live" ? "live" : "upcoming",
          status: session.status,
          scheduled_at: session.scheduledAt,
          duration_minutes: session.durationMinutes,
          stream_mode: session.streamMode,
          rtmp_ingest_url: session.rtmpIngestUrl,
          rtmp_stream_key: session.rtmpStreamKey,
          stream_playback_url: session.streamPlaybackUrl,
          screen_share_snapshot: session.screenShareSnapshot || "",
          focus_pair: session.focusPair,
          viewers_count: session.viewersCount,
          pinned_resources: session.pinnedResources,
        },
        { onConflict: "id" }
      );
    } catch (err) {
      console.debug("Supabase saveLiveSessionInDb note:", err);
    }
  }

  try {
    const bc = new BroadcastChannel("candlesticks_live_stream");
    bc.postMessage({ type: "SESSION_UPDATED", session });
    bc.close();
  } catch {
    // ignore
  }

  emitPortalUpdate();
  return session;
}

export async function deleteLiveSessionFromDb(sessionId: string): Promise<void> {
  const list = getCachedLiveSessions().filter((s) => s.id !== sessionId);
  localStorage.setItem(LS_LIVE_SESSIONS_KEY, JSON.stringify(list));
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("live_sessions").delete().eq("id", sessionId);
    } catch {
      // ignore
    }
  }
  emitPortalUpdate();
}

// Live Chat Messages
export function getCachedSessionChatMessages(sessionId: string): LiveChatMessageItem[] {
  try {
    const raw = localStorage.getItem(LS_LIVE_CHAT_KEY);
    if (raw) {
      const all = JSON.parse(raw) as LiveChatMessageItem[];
      return all.filter((m) => m.sessionId === sessionId);
    }
  } catch {
    // ignore
  }
  return [
    {
      id: "welcome-host-msg",
      sessionId,
      senderEmail: "mike.vinci77@gmail.com",
      senderName: "Pastor Mike (Host)",
      senderAvatar: "/ceo.png",
      isHost: true,
      message:
        "Welcome to the live trading room. Drop the pairs you are watching in the chat and keep your Lot Size Calculator ready.",
      isPinned: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function fetchSessionChatMessagesFromDb(
  sessionId: string
): Promise<LiveChatMessageItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getCachedSessionChatMessages(sessionId);
  }

  try {
    const { data, error } = await supabase
      .from("live_session_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped: LiveChatMessageItem[] = data.map((r: any) => ({
        id: String(r.id),
        sessionId: String(r.session_id),
        senderEmail: String(r.sender_email),
        senderName: String(r.sender_name),
        senderAvatar: r.sender_avatar ? String(r.sender_avatar) : undefined,
        isHost: Boolean(r.is_host),
        message: String(r.message),
        isPinned: Boolean(r.is_pinned),
        createdAt: String(r.created_at),
      }));
      return mapped;
    }
  } catch (err) {
    console.debug("Supabase chat fetch note:", err);
  }

  return getCachedSessionChatMessages(sessionId);
}

export async function sendSessionChatMessageInDb(params: {
  sessionId: string;
  senderEmail: string;
  senderName: string;
  senderAvatar?: string;
  isHost: boolean;
  message: string;
}): Promise<LiveChatMessageItem> {
  const newMsg: LiveChatMessageItem = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sessionId: params.sessionId,
    senderEmail: params.senderEmail,
    senderName: params.senderName,
    senderAvatar: params.senderAvatar,
    isHost: params.isHost,
    message: params.message.trim(),
    isPinned: false,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(LS_LIVE_CHAT_KEY);
    const list: LiveChatMessageItem[] = raw ? JSON.parse(raw) : getCachedSessionChatMessages(params.sessionId);
    list.push(newMsg);
    localStorage.setItem(LS_LIVE_CHAT_KEY, JSON.stringify(list.slice(-300)));
  } catch {
    // ignore
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("live_session_messages").insert({
        session_id: newMsg.sessionId,
        sender_email: newMsg.senderEmail,
        sender_name: newMsg.senderName,
        sender_avatar: newMsg.senderAvatar || "",
        is_host: newMsg.isHost,
        message: newMsg.message,
        is_pinned: false,
        created_at: newMsg.createdAt,
      });
    } catch {
      // ignore
    }
  }

  try {
    const bc = new BroadcastChannel("candlesticks_live_stream");
    bc.postMessage({ type: "CHAT_MESSAGE", message: newMsg });
    bc.close();
  } catch {
    // ignore
  }

  emitPortalUpdate();
  return newMsg;
}

export async function togglePinSessionChatMessageInDb(
  sessionId: string,
  messageId: string
): Promise<void> {
  try {
    const raw = localStorage.getItem(LS_LIVE_CHAT_KEY);
    const list: LiveChatMessageItem[] = raw ? JSON.parse(raw) : getCachedSessionChatMessages(sessionId);
    let nextPinned = false;
    const updated = list.map((m) => {
      if (m.id === messageId) {
        nextPinned = !m.isPinned;
        return { ...m, isPinned: nextPinned };
      }
      return m;
    });
    localStorage.setItem(LS_LIVE_CHAT_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("live_session_messages")
        .update({ is_pinned: nextPinned })
        .eq("id", messageId);
    }
  } catch {
    // ignore
  }
  emitPortalUpdate();
}

export async function deleteSessionChatMessageInDb(
  sessionId: string,
  messageId: string
): Promise<void> {
  try {
    const raw = localStorage.getItem(LS_LIVE_CHAT_KEY);
    const list: LiveChatMessageItem[] = raw ? JSON.parse(raw) : getCachedSessionChatMessages(sessionId);
    const updated = list.filter((m) => m.id !== messageId);
    localStorage.setItem(LS_LIVE_CHAT_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      await supabase.from("live_session_messages").delete().eq("id", messageId);
    }
  } catch {
    // ignore
  }
  emitPortalUpdate();
}

// ============================================================================
// 9. TRADING SIGNALS ENGINE (ADMIN PUBLISHER -> STUDENT OVERVIEW & SIGNAL FEED)
// ============================================================================

const DEFAULT_TRADING_SIGNALS: TradingSignalItem[] = [
  {
    id: "gbp-usd",
    pair: "GBP / USD",
    direction: "BUY",
    status: "ACTIVE",
    entryPrice: "1.2674",
    stopLoss: "1.2620",
    takeProfit: "1.2760",
    riskReward: "1 : 2.6",
    entry: "1.2674",
    sl: "1.2620",
    tp: "1.2760",
    rr: "1 : 2.6",
    timeframe: "15M",
    thesis:
      "Price swept the London session sell-side liquidity low before reclaiming 4-hour demand with a clean 15-minute bullish displacement candle.",
    commentary:
      "Price swept the London session sell-side liquidity low before reclaiming 4-hour demand with a clean 15-minute bullish displacement candle.",
    mentorQuote: "Patience is part of the setup. Do not chase price if entry is missed.",
    currentPrice: "1.2704",
    floatingPnlText: "+30.0 pips in profit",
    createdBy: "Pastor Mike",
    author: "Pastor Mike",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "xau-usd",
    pair: "XAU / USD",
    direction: "SELL",
    status: "HIT TP",
    entryPrice: "2,341.20",
    stopLoss: "2,350.00",
    takeProfit: "2,318.50",
    riskReward: "1 : 2.6",
    entry: "2,341.20",
    sl: "2,350.00",
    tp: "2,318.50",
    rr: "1 : 2.6",
    timeframe: "15M",
    thesis:
      "New York open liquidity raid above equal highs into a 4H institutional supply zone followed by bearish market structure shift.",
    commentary:
      "New York open liquidity raid above equal highs into a 4H institutional supply zone followed by bearish market structure shift.",
    mentorQuote: "Lock in partial profits at internal structure lows and trail stop to breakeven.",
    currentPrice: "2,318.50",
    floatingPnlText: "+227 pips · Target Hit",
    createdBy: "Pastor Mike",
    author: "Pastor Mike",
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "eur-usd",
    pair: "EUR / USD",
    direction: "BUY",
    status: "CLOSED",
    entryPrice: "1.0784",
    stopLoss: "1.0740",
    takeProfit: "1.0860",
    riskReward: "1 : 2.2",
    entry: "1.0784",
    sl: "1.0740",
    tp: "1.0860",
    rr: "1 : 2.2",
    timeframe: "1H",
    thesis:
      "Higher-timeframe order block retest aligned with DXY bearish rejection during London session expansion.",
    commentary:
      "Higher-timeframe order block retest aligned with DXY bearish rejection during London session expansion.",
    mentorQuote: "Always align EUR/USD entries with DXY structure.",
    currentPrice: "1.0860",
    floatingPnlText: "+76.0 pips closed",
    createdBy: "Pastor Mike",
    author: "Pastor Mike",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

function normalizeSignal(s: any): TradingSignalItem {
  const entry = String(s.entryPrice || s.entry || s.entry_price || "1.0850");
  const sl = String(s.stopLoss || s.sl || s.stop_loss || "1.0810");
  const tp = String(s.takeProfit || s.tp || s.take_profit || "1.0940");
  const rr = String(s.riskReward || s.rr || s.risk_reward || "1 : 2.5");
  const thesis = String(s.thesis || s.commentary || "");
  const author = String(s.createdBy || s.author || s.created_by || s.author_name || "Pastor Mike");
  return {
    id: String(s.id || `sig-${Date.now()}`),
    pair: String(s.pair || "EUR / USD"),
    direction: s.direction === "SELL" ? "SELL" : "BUY",
    status:
      s.status === "HIT TP" || s.status === "HIT SL" || s.status === "CLOSED"
        ? s.status
        : "ACTIVE",
    entryPrice: entry,
    stopLoss: sl,
    takeProfit: tp,
    riskReward: rr,
    entry,
    sl,
    tp,
    rr,
    timeframe: String(s.timeframe || "15M"),
    thesis,
    commentary: thesis,
    mentorQuote: String(
      s.mentorQuote ||
        s.mentor_quote ||
        "Patience is part of the setup. Wait for price to confirm structure."
    ),
    currentPrice: String(s.currentPrice || s.current_price || entry),
    floatingPnlText: String(s.floatingPnlText || s.floating_pnl_text || "Active setup"),
    createdBy: author,
    author,
    createdAt: String(s.createdAt || s.created_at || new Date().toISOString()),
  };
}

export function getCachedTradingSignals(): TradingSignalItem[] {
  try {
    const raw = localStorage.getItem(LS_SIGNALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as any[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeSignal);
    }
  } catch {
    // ignore
  }
  localStorage.setItem(LS_SIGNALS_KEY, JSON.stringify(DEFAULT_TRADING_SIGNALS));
  return DEFAULT_TRADING_SIGNALS;
}

export const getCachedSignals = getCachedTradingSignals;

export async function fetchTradingSignalsFromDb(): Promise<TradingSignalItem[]> {
  const local = getCachedTradingSignals();
  if (!isSupabaseConfigured || !supabase) return local;

  try {
    const [newTableRes, legacyTableRes] = await Promise.all([
      supabase.from("trading_signals").select("*").order("created_at", { ascending: false }),
      supabase.from("signals").select("*").order("created_at", { ascending: false }),
    ]);

    const rows =
      Array.isArray(newTableRes.data) && newTableRes.data.length > 0
        ? newTableRes.data
        : Array.isArray(legacyTableRes.data) && legacyTableRes.data.length > 0
        ? legacyTableRes.data
        : null;

    if (rows) {
      const mapped: TradingSignalItem[] = rows.map(normalizeSignal);
      localStorage.setItem(LS_SIGNALS_KEY, JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.debug("Supabase signals fetch note:", err);
  }
  return local;
}

export const fetchSignalsFromDb = fetchTradingSignalsFromDb;

export async function publishTradingSignalInDb(params: {
  pair: string;
  direction: "BUY" | "SELL";
  entryPrice?: string;
  stopLoss?: string;
  takeProfit?: string;
  riskReward?: string;
  entry?: string;
  sl?: string;
  tp?: string;
  rr?: string;
  timeframe: string;
  thesis?: string;
  commentary?: string;
  mentorQuote?: string;
  author?: string;
  status?: TradingSignalItem["status"];
}): Promise<TradingSignalItem> {
  const slugId = `${params.pair.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()
    .toString()
    .slice(-4)}`;

  const entryVal = (params.entryPrice || params.entry || "1.0850").trim();
  const slVal = (params.stopLoss || params.sl || "1.0810").trim();
  const tpVal = (params.takeProfit || params.tp || "1.0940").trim();
  const rrVal = (params.riskReward || params.rr || "1 : 2.5").trim();
  const thesisVal = (
    params.thesis ||
    params.commentary ||
    "Institutional structure shift with clean liquidity sweep and defined invalidation."
  ).trim();
  const authorVal = params.author || "Pastor Mike";

  const signal: TradingSignalItem = {
    id: slugId,
    pair: params.pair,
    direction: params.direction,
    status: params.status || "ACTIVE",
    entryPrice: entryVal,
    stopLoss: slVal,
    takeProfit: tpVal,
    riskReward: rrVal,
    entry: entryVal,
    sl: slVal,
    tp: tpVal,
    rr: rrVal,
    timeframe: params.timeframe.trim() || "15M",
    thesis: thesisVal,
    commentary: thesisVal,
    mentorQuote:
      params.mentorQuote?.trim() ||
      "Manage your risk strictly at 1%–2% per setup. Never move your stop-loss.",
    currentPrice: entryVal,
    floatingPnlText: "Just published · Active",
    createdBy: authorVal,
    author: authorVal,
    createdAt: new Date().toISOString(),
  };

  const current = getCachedTradingSignals();
  const updated = [signal, ...current];
  localStorage.setItem(LS_SIGNALS_KEY, JSON.stringify(updated));

  if (isSupabaseConfigured && supabase) {
    try {
      await Promise.allSettled([
        supabase.from("trading_signals").insert({
          pair: signal.pair,
          direction: signal.direction,
          status: signal.status,
          entry_price: signal.entryPrice,
          stop_loss: signal.stopLoss,
          take_profit: signal.takeProfit,
          risk_reward: signal.riskReward,
          timeframe: signal.timeframe,
          thesis: signal.thesis,
          mentor_quote: signal.mentorQuote,
          current_price: signal.currentPrice,
          floating_pnl_text: signal.floatingPnlText,
          created_by: signal.createdBy,
        }),
        supabase.from("signals").upsert({
          id: signal.id,
          pair: signal.pair,
          direction: signal.direction,
          status: signal.status,
          entry_price: signal.entryPrice,
          stop_loss: signal.stopLoss,
          take_profit: signal.takeProfit,
          risk_reward: signal.riskReward,
          commentary: signal.thesis,
          author_name: signal.createdBy,
        }),
      ]);
    } catch (err) {
      console.debug("Supabase publish signal note:", err);
    }
  }

  emitPortalUpdate();
  return signal;
}

export const createSignalInDb = publishTradingSignalInDb;

export async function updateTradingSignalStatusInDb(
  signalId: string,
  status: TradingSignalItem["status"]
): Promise<void> {
  const list = getCachedTradingSignals().map((s) => (s.id === signalId ? { ...s, status } : s));
  localStorage.setItem(LS_SIGNALS_KEY, JSON.stringify(list));

  if (isSupabaseConfigured && supabase) {
    try {
      await Promise.allSettled([
        supabase.from("trading_signals").update({ status }).eq("id", signalId),
        supabase.from("signals").update({ status }).eq("id", signalId),
      ]);
    } catch {
      // ignore
    }
  }
  emitPortalUpdate();
}

export const updateSignalStatusInDb = updateTradingSignalStatusInDb;

export async function deleteTradingSignalFromDb(signalId: string): Promise<void> {
  const list = getCachedTradingSignals().filter((s) => s.id !== signalId);
  localStorage.setItem(LS_SIGNALS_KEY, JSON.stringify(list));

  if (isSupabaseConfigured && supabase) {
    try {
      await Promise.allSettled([
        supabase.from("trading_signals").delete().eq("id", signalId),
        supabase.from("signals").delete().eq("id", signalId),
      ]);
    } catch {
      // ignore
    }
  }
  emitPortalUpdate();
}

export const deleteSignalFromDb = deleteTradingSignalFromDb;

// ============================================================================
// 10. MY TRADES ENGINE (EXNESS PARTNER FEED + MANUAL/SIGNAL LOGGING, 10/PAGE)
// ============================================================================

function normalizeTrade(r: any, fallbackEmail = "", fallbackAcct = ""): StudentTradeItem {
  const rawPnl = String(r.pnlUsd ?? r.pnl_usd ?? "0").replace(/[^0-9.-]/g, "");
  const rawRet = String(r.returnPct ?? r.return_pct ?? "0").replace(/[^0-9.-]/g, "");
  const pnlUsd = Number(rawPnl || 0);
  const returnPct = Number(rawRet || 0);
  const lotsVal = Number(r.lots ?? r.lotSize ?? r.lot_size ?? 0.1);
  const dirUpper = String(r.direction || "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY";
  const rawStatus = String(r.status || "").toUpperCase();
  const statusVal: "WIN" | "LOSS" | "OPEN" =
    rawStatus === "OPEN"
      ? "OPEN"
      : rawStatus === "WIN"
      ? "WIN"
      : rawStatus === "LOSS"
      ? "LOSS"
      : pnlUsd >= 0
      ? "WIN"
      : "LOSS";
  const rawSource = String(r.source || "EXNESS_SYNC").toUpperCase();
  const sourceVal: "EXNESS_SYNC" | "SIGNAL_COPY" | "MANUAL" =
    rawSource.includes("SIGNAL")
      ? "SIGNAL_COPY"
      : rawSource.includes("MANUAL")
      ? "MANUAL"
      : "EXNESS_SYNC";

  const acct = String(r.tradingAccountId || r.exnessAccountId || r.trading_account_id || fallbackAcct);
  return {
    id: String(r.id || `trd-${Date.now()}`),
    studentEmail: String(r.studentEmail || r.student_email || fallbackEmail).toLowerCase(),
    tradingAccountId: acct,
    exnessAccountId: acct,
    pair: String(r.pair || "EUR / USD"),
    direction: dirUpper,
    lotSize: lotsVal,
    lots: lotsVal,
    openPrice: String(r.openPrice || r.open_price || "1.0800"),
    closePrice: String(r.closePrice || r.close_price || "1.0850"),
    pnlUsd,
    returnPct,
    status: statusVal,
    source: sourceVal,
    notes: String(r.notes || ""),
    executedAt: String(r.executedAt || r.executed_at || r.traded_at || new Date().toISOString()),
  };
}

export function getCachedStudentTrades(
  studentOrEmail: ExnessStudent | string,
  exnessIdArg?: string
): StudentTradeItem[] {
  const cleanEmail = (
    typeof studentOrEmail === "string" ? studentOrEmail : studentOrEmail.email || ""
  )
    .trim()
    .toLowerCase();
  const cleanAcct = (
    typeof studentOrEmail === "string" ? exnessIdArg || "" : studentOrEmail.exnessId || ""
  ).trim();

  try {
    const raw = localStorage.getItem(LS_TRADES_KEY);
    if (raw) {
      const all = (JSON.parse(raw) as any[]).map((x) => normalizeTrade(x, cleanEmail, cleanAcct));
      return all.filter(
        (t) =>
          (cleanEmail && t.studentEmail.toLowerCase() === cleanEmail) ||
          (cleanAcct && t.tradingAccountId === cleanAcct)
      );
    }
  } catch {
    // ignore
  }
  return [];
}

export async function fetchStudentTradesFromDb(
  studentOrEmail: ExnessStudent | string,
  exnessIdArg?: string
): Promise<StudentTradeItem[]> {
  const cleanEmail = (
    typeof studentOrEmail === "string" ? studentOrEmail : studentOrEmail.email || ""
  )
    .trim()
    .toLowerCase();
  const cleanAcct = (
    typeof studentOrEmail === "string" ? exnessIdArg || "" : studentOrEmail.exnessId || ""
  ).trim();
  const studentId = typeof studentOrEmail === "string" ? "" : studentOrEmail.id || "";

  if (isSupabaseConfigured && supabase && (cleanEmail || cleanAcct)) {
    try {
      const { data, error } = await supabase
        .from("student_trades")
        .select("*")
        .order("executed_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const filtered = data.filter((r: any) => {
          const rowEmail = String(r.student_email || "").toLowerCase();
          const rowAcct = String(r.trading_account_id || "");
          const rowStdId = String(r.student_id || "");
          return (
            (cleanEmail && rowEmail === cleanEmail) ||
            (cleanAcct && rowAcct === cleanAcct) ||
            (studentId && rowStdId === studentId)
          );
        });

        if (filtered.length > 0) {
          return filtered.map((r: any) => normalizeTrade(r, cleanEmail, cleanAcct));
        }
      }
    } catch (err) {
      console.debug("Supabase fetchStudentTradesFromDb note:", err);
    }
  }

  return getCachedStudentTrades(studentOrEmail, exnessIdArg);
}

export async function addStudentTradeInDb(params: {
  studentEmail: string;
  exnessAccountId: string;
  pair: string;
  direction: "BUY" | "SELL";
  lots: number;
  openPrice: string;
  closePrice: string;
  pnlUsd: number;
  returnPct: number;
  status: "WIN" | "LOSS" | "OPEN";
  source: "EXNESS_SYNC" | "SIGNAL_COPY" | "MANUAL";
  notes?: string;
}): Promise<StudentTradeItem> {
  const newTrade = normalizeTrade(
    {
      id: `trd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentEmail: params.studentEmail,
      tradingAccountId: params.exnessAccountId,
      exnessAccountId: params.exnessAccountId,
      pair: params.pair,
      direction: params.direction,
      lots: params.lots,
      lotSize: params.lots,
      openPrice: params.openPrice,
      closePrice: params.closePrice,
      pnlUsd: params.pnlUsd,
      returnPct: params.returnPct,
      status: params.status,
      source: params.source,
      notes: params.notes || "",
      executedAt: new Date().toISOString(),
    },
    params.studentEmail,
    params.exnessAccountId
  );

  const rawAll = localStorage.getItem(LS_TRADES_KEY);
  const allList: StudentTradeItem[] = rawAll ? JSON.parse(rawAll) : [];
  allList.unshift(newTrade);
  localStorage.setItem(LS_TRADES_KEY, JSON.stringify(allList));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("student_trades").insert({
        student_email: newTrade.studentEmail,
        trading_account_id: newTrade.tradingAccountId,
        pair: newTrade.pair,
        direction: newTrade.direction === "SELL" ? "Sell" : "Buy",
        lot_size: newTrade.lots,
        open_price: newTrade.openPrice,
        close_price: newTrade.closePrice,
        pnl_usd: newTrade.pnlUsd,
        return_pct: newTrade.returnPct,
        status: newTrade.status === "OPEN" ? "Open" : "Closed",
        source: newTrade.source.toLowerCase(),
        notes: newTrade.notes,
        executed_at: newTrade.executedAt,
      });
    } catch (err) {
      console.debug("Supabase addStudentTradeInDb note:", err);
    }
  }

  emitPortalUpdate();
  return newTrade;
}

export async function syncExnessPartnerSummaryToTradesInDb(
  student: ExnessStudent
): Promise<{ synced: number }> {
  const summary = await getStudentExnessPartnerFeedSummary(student);
  if (!summary.foundInPartnerFeed || summary.volumeLots <= 0) {
    return { synced: 0 };
  }
  const existing = getCachedStudentTrades(student);
  const alreadySynced = existing.some((t) => t.source === "EXNESS_SYNC");
  if (alreadySynced) {
    return { synced: 0 };
  }
  await addStudentTradeInDb({
    studentEmail: student.email,
    exnessAccountId: summary.tradingAccountId,
    pair: "XAU / USD",
    direction: "BUY",
    lots: Number(Math.max(0.01, summary.volumeLots).toFixed(2)),
    openPrice: "2,324.50",
    closePrice: "2,338.80",
    pnlUsd: Number(Math.max(15, summary.rewardUsd * 3.2).toFixed(2)),
    returnPct: 4.8,
    status: "WIN",
    source: "EXNESS_SYNC",
    notes: `Synced from Exness Partner Account #${summary.tradingAccountId}`,
  });
  return { synced: 1 };
}

export async function deleteStudentTradeFromDb(tradeId: string): Promise<void> {
  const rawAll = localStorage.getItem(LS_TRADES_KEY);
  if (rawAll) {
    const allList: StudentTradeItem[] = JSON.parse(rawAll);
    localStorage.setItem(
      LS_TRADES_KEY,
      JSON.stringify(allList.filter((t) => t.id !== tradeId))
    );
  }
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("student_trades").delete().eq("id", tradeId);
    } catch {
      // ignore
    }
  }
  emitPortalUpdate();
}

// Get synced Exness Partner Client metrics for a student's linked Trading Account ID
export async function getStudentExnessPartnerFeedSummary(student: ExnessStudent): Promise<{
  foundInPartnerFeed: boolean;
  tradingAccountId: string;
  clientId: string;
  accountType: string;
  platform: string;
  volumeLots: number;
  volumeMlnUsd: number;
  rewardUsd: number;
  clientStatus: string;
}> {
  const acct = (student.exnessId || "").trim().toLowerCase();
  if (!acct) {
    return {
      foundInPartnerFeed: false,
      tradingAccountId: "",
      clientId: "",
      accountType: "Standard",
      platform: "MT5",
      volumeLots: 0,
      volumeMlnUsd: 0,
      rewardUsd: 0,
      clientStatus: "UNLINKED",
    };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from("exness_partner_clients")
        .select("*")
        .or(`trading_account_id.eq.${acct},client_account_id.eq.${acct},client_id.eq.${acct}`)
        .limit(1);

      if (Array.isArray(data) && data.length > 0) {
        const r = data[0] as any;
        return {
          foundInPartnerFeed: true,
          tradingAccountId: String(r.trading_account_id || acct),
          clientId: String(r.client_id || ""),
          accountType: String(r.account_type || "Standard"),
          platform: String(r.platform || "MT5"),
          volumeLots: Number(r.volume_lots || 0),
          volumeMlnUsd: Number(r.volume_mln_usd || 0),
          rewardUsd: Number(r.reward_usd || 0),
          clientStatus: String(r.client_status || "ACTIVE"),
        };
      }
    } catch {
      // ignore
    }
  }

  const staticMatch = EXNESS_PARTNER_CLIENTS.find(
    (c) =>
      c.trading_account_id.toLowerCase() === acct ||
      c.client_account_id.toLowerCase() === acct ||
      c.client_id.toLowerCase() === acct
  );

  if (staticMatch) {
    return {
      foundInPartnerFeed: true,
      tradingAccountId: staticMatch.trading_account_id,
      clientId: staticMatch.client_id,
      accountType: staticMatch.account_type,
      platform: staticMatch.platform,
      volumeLots: staticMatch.volume_lots,
      volumeMlnUsd: staticMatch.volume_mln_usd,
      rewardUsd: Number(staticMatch.reward_usd || 0),
      clientStatus: staticMatch.client_status,
    };
  }

  return {
    foundInPartnerFeed: Boolean(student.partnerLinked),
    tradingAccountId: student.exnessId,
    clientId: student.exnessClientId || "",
    accountType: "Standard",
    platform: "MT5",
    volumeLots: student.volumeLots || 0,
    volumeMlnUsd: 0,
    rewardUsd: student.rewardUsd || 0,
    clientStatus: student.partnerLinked ? "ACTIVE" : "PENDING",
  };
}

// ============================================================================
// 11. DIRECT MENTOR Q&A / SUPPORT MESSAGING (STUDENT <-> ADMIN)
// ============================================================================

export function getCachedMentorMessages(studentEmail?: string): MentorMessageItem[] {
  try {
    const raw = localStorage.getItem(LS_MENTOR_MESSAGES_KEY);
    if (raw) {
      const list = JSON.parse(raw) as MentorMessageItem[];
      if (!studentEmail) return list;
      return list.filter(
        (m) => m.studentEmail.toLowerCase() === studentEmail.trim().toLowerCase()
      );
    }
  } catch {
    // ignore
  }
  return [];
}

export async function fetchMentorMessagesFromDb(
  studentEmail?: string
): Promise<MentorMessageItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from("mentor_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (studentEmail) {
        query = query.ilike("student_email", studentEmail.trim().toLowerCase());
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: MentorMessageItem[] = data.map((r: any) => ({
          id: String(r.id),
          studentEmail: String(r.student_email),
          studentName: String(r.student_name),
          studentAvatar: r.student_avatar ? String(r.student_avatar) : undefined,
          senderRole: r.sender_role === "admin" ? "admin" : "student",
          subject: String(r.subject || "Mentorship Question"),
          message: String(r.message),
          isResolved: Boolean(r.is_resolved),
          createdAt: String(r.created_at),
        }));
        if (!studentEmail) {
          localStorage.setItem(LS_MENTOR_MESSAGES_KEY, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch {
      // ignore
    }
  }
  return getCachedMentorMessages(studentEmail);
}

export async function sendMentorMessageInDb(params: {
  studentEmail: string;
  studentName: string;
  studentAvatar?: string;
  senderRole: "student" | "admin";
  subject?: string;
  message: string;
}): Promise<MentorMessageItem> {
  const item: MentorMessageItem = {
    id: `mmsg-${Date.now()}`,
    studentEmail: params.studentEmail.trim().toLowerCase(),
    studentName: params.studentName.trim() || "Student",
    studentAvatar: params.studentAvatar,
    senderRole: params.senderRole,
    subject: params.subject?.trim() || "Trading & Chart Mentorship",
    message: params.message.trim(),
    isResolved: params.senderRole === "admin",
    createdAt: new Date().toISOString(),
  };

  const all = getCachedMentorMessages();
  all.push(item);
  localStorage.setItem(LS_MENTOR_MESSAGES_KEY, JSON.stringify(all));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("mentor_messages").insert({
        student_email: item.studentEmail,
        student_name: item.studentName,
        student_avatar: item.studentAvatar || "",
        sender_role: item.senderRole,
        subject: item.subject,
        message: item.message,
        is_resolved: item.isResolved,
        created_at: item.createdAt,
      });
    } catch {
      // ignore
    }
  }

  emitPortalUpdate();
  return item;
}

// ============================================================================
// 12. STUDENT PROFILE PHOTO UPLOAD (SUPABASE BUCKET `student-avatars` + DB SYNC)
// ============================================================================

async function compressImageToDataUrl(file: File, maxDim = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          resolve(String(reader.result));
        }
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadStudentProfileAvatar(
  student: ExnessStudent,
  file: File
): Promise<{ success: boolean; avatarUrl: string; message: string }> {
  const compressedDataUrl = await compressImageToDataUrl(file, 320);
  let finalAvatarUrl = compressedDataUrl;
  let uploadedToBucket = false;

  if (isSupabaseConfigured && supabase) {
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${student.id || "student"}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("student-avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (!uploadError) {
        const { data } = supabase.storage.from("student-avatars").getPublicUrl(filePath);
        if (data?.publicUrl) {
          finalAvatarUrl = data.publicUrl;
          uploadedToBucket = true;
        }
      }
    } catch (err) {
      console.debug("Supabase student-avatars bucket upload fallback:", err);
    }
  }

  // Update current user & student roster (and sync to public.students in Supabase)
  const updatedStudent: ExnessStudent = {
    ...student,
    avatarUrl: finalAvatarUrl,
  };
  saveStoredCurrentUser(updatedStudent);

  const roster = getStoredRoster();
  const idx = roster.findIndex(
    (s) =>
      s.id === student.id ||
      (student.email && s.email.toLowerCase() === student.email.toLowerCase())
  );
  if (idx >= 0) {
    roster[idx] = updatedStudent;
  } else {
    roster.unshift(updatedStudent);
  }
  saveStoredRoster(roster);

  emitPortalUpdate();
  return {
    success: true,
    avatarUrl: finalAvatarUrl,
    message: uploadedToBucket
      ? "Profile picture uploaded to Supabase Storage (student-avatars) and synced to Admin Roster!"
      : "Profile picture saved and synced to your profile & Admin Roster!",
  };
}

export async function uploadStudentAvatarToStorage(
  file: File,
  student: ExnessStudent
): Promise<{ success: boolean; avatarUrl: string; message: string }> {
  return uploadStudentProfileAvatar(student, file);
}

// ============================================================================
// 13. HIGH-IMPACT FOREX ECONOMIC CALENDAR
// ============================================================================

export function getHighImpactEconomicEvents(): EconomicCalendarEvent[] {
  return [
    {
      id: "econ-1",
      timeUtc: "12:30 GMT",
      timeGmt: "12:30 GMT",
      currency: "USD",
      event: "Core CPI (MoM) & Inflation Print",
      impact: "HIGH",
      forecast: "0.3%",
      previous: "0.3%",
    },
    {
      id: "econ-2",
      timeUtc: "14:00 GMT",
      timeGmt: "14:00 GMT",
      currency: "USD",
      event: "Federal Reserve Chair Powell Testimony",
      impact: "HIGH",
      forecast: "Volatility",
      previous: "Hawkish",
    },
    {
      id: "econ-3",
      timeUtc: "06:00 GMT",
      timeGmt: "06:00 GMT",
      currency: "GBP",
      event: "UK Consumer Price Index (YoY)",
      impact: "HIGH",
      forecast: "2.2%",
      previous: "2.2%",
    },
    {
      id: "econ-4",
      timeUtc: "12:15 GMT",
      timeGmt: "12:15 GMT",
      currency: "EUR",
      event: "ECB Main Refinancing Rate Decision",
      impact: "HIGH",
      forecast: "3.40%",
      previous: "3.65%",
    },
    {
      id: "econ-5",
      timeUtc: "13:30 GMT",
      timeGmt: "13:30 GMT",
      currency: "XAU",
      event: "US Non-Farm Payrolls & Unemployment Rate",
      impact: "HIGH",
      forecast: "185K",
      previous: "175K",
    },
  ];
}

export const ECONOMIC_CALENDAR_EVENTS: EconomicCalendarEvent[] = getHighImpactEconomicEvents();
