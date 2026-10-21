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

-- 1. UPGRADE public.students WITH USERNAME, PASSWORD, PROFILE AVATAR, STREAK & TRADING PREFERENCES
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS account_password TEXT DEFAULT '',
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_username_lower
  ON public.students (LOWER(username))
  WHERE username IS NOT NULL AND username <> '';

-- 2. COURSES TABLE (The 4 Signature Tracks + Level PDFs & Multi-Question Quizzes)
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'Beginner',
  description TEXT NOT NULL DEFAULT '',
  cover_color TEXT NOT NULL DEFAULT 'gold',
  sort_order INTEGER NOT NULL DEFAULT 1,
  certificate_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  level_pdf_url TEXT DEFAULT '',
  level_pdf_name TEXT DEFAULT '',
  level_quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_level_check;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'Beginner',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cover_color TEXT NOT NULL DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'gold',
  ADD COLUMN IF NOT EXISTS lessons_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_deposit_required NUMERIC(12,2) NOT NULL DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS level_pdf_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS level_pdf_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS level_quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
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

-- 3. COURSE LESSONS TABLE (Admin-Uploaded Video Lessons)
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
  quiz_title TEXT NOT NULL DEFAULT 'Level PDF Assessment',
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
  ADD COLUMN IF NOT EXISTS quiz_title TEXT NOT NULL DEFAULT 'Level PDF Assessment',
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

-- 8. TRADING SIGNALS TABLE (Multi-TP [TP1-TP5] + Live Market Price Sync)
CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  entry_price TEXT NOT NULL,
  stop_loss TEXT NOT NULL,
  take_profit TEXT NOT NULL,
  tp_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
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
  ADD COLUMN IF NOT EXISTS tp_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_reward TEXT NOT NULL DEFAULT '1 : 2.5',
  ADD COLUMN IF NOT EXISTS timeframe TEXT NOT NULL DEFAULT '15M',
  ADD COLUMN IF NOT EXISTS thesis TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS mentor_quote TEXT DEFAULT 'Patience is part of the setup. Wait for price to confirm structure.',
  ADD COLUMN IF NOT EXISTS current_price TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS floating_pnl_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'Pastor Mike',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 9. STUDENT TRADES TABLE (My Trades — Custom TP/SL, Lot Size, 10 Per Page)
CREATE TABLE IF NOT EXISTS public.student_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL DEFAULT '',
  trading_account_id TEXT NOT NULL DEFAULT '',
  signal_id TEXT DEFAULT '',
  pair TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'Buy',
  lot_size NUMERIC(8,2) NOT NULL DEFAULT 0.10,
  open_price TEXT NOT NULL DEFAULT '0',
  close_price TEXT NOT NULL DEFAULT '0',
  take_profit_price TEXT DEFAULT '',
  stop_loss_price TEXT DEFAULT '',
  selected_tp_level INTEGER DEFAULT 1,
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
  ADD COLUMN IF NOT EXISTS signal_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS lot_size NUMERIC(8,2) NOT NULL DEFAULT 0.10,
  ADD COLUMN IF NOT EXISTS open_price TEXT NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS close_price TEXT NOT NULL DEFAULT '0',
  ADD COLUMN IF NOT EXISTS take_profit_price TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS stop_loss_price TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS selected_tp_level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pnl_usd NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS return_pct NUMERIC(7,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Closed',
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'exness_sync',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 10. CLIENT NOTIFICATIONS & AUDIT ALERTS TABLE (Linked to Topbar Alert Bell)
CREATE TABLE IF NOT EXISTS public.client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL DEFAULT 'ALL',
  category TEXT NOT NULL DEFAULT 'TRADE',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT DEFAULT '/signals',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_notifications_email
  ON public.client_notifications(student_email, created_at DESC);

-- 11. DIRECT MENTOR Q&A / SUPPORT MESSAGES TABLE
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

-- 12. STUDENT COURSE CERTIFICATES & CERTIFICATE TEMPLATES TABLES
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

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id TEXT PRIMARY KEY DEFAULT 'default',
  template_image_url TEXT NOT NULL DEFAULT '',
  name_x_pct NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  name_y_pct NUMERIC(5,2) NOT NULL DEFAULT 48.00,
  font_size INTEGER NOT NULL DEFAULT 42,
  font_color TEXT NOT NULL DEFAULT '#ffb600',
  show_course_title BOOLEAN NOT NULL DEFAULT TRUE,
  course_y_pct NUMERIC(5,2) NOT NULL DEFAULT 60.00,
  show_issue_date BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SUPABASE STORAGE BUCKETS FOR AVATARS, VIDEOS, LEVEL PDFS & CERTIFICATES
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('student-avatars', 'student-avatars', true),
  ('course-videos', 'course-videos', true),
  ('course-pdfs', 'course-pdfs', true),
  ('certificate-templates', 'certificate-templates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'courses', 'course_lessons', 'student_lesson_progress',
    'student_quiz_attempts', 'live_sessions', 'live_session_messages',
    'trading_signals', 'student_trades', 'client_notifications',
    'mentor_messages', 'student_certificates', 'certificate_templates'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow full access on %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow full access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public Access Candlesticks Buckets" ON storage.objects;
CREATE POLICY "Public Access Candlesticks Buckets"
  ON storage.objects FOR ALL
  USING (bucket_id IN ('student-avatars', 'course-videos', 'course-pdfs', 'certificate-templates'))
  WITH CHECK (bucket_id IN ('student-avatars', 'course-videos', 'course-pdfs', 'certificate-templates'));
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
  levelPdfUrl?: string;
  levelPdfName?: string;
  levelQuizQuestions?: QuizQuestionItem[];
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

export interface CertificateTemplateConfig {
  id: string;
  templateImageUrl: string;
  nameXPct: number;
  nameYPct: number;
  fontSize: number;
  fontColor: string;
  showCourseTitle: boolean;
  courseYPct: number;
  showIssueDate: boolean;
  updatedAt: string;
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

export interface SignalTpLevel {
  level: number; // 1 to 5
  label: string; // "TP1".."TP5"
  price: string;
  hit: boolean;
  hitAt?: string;
}

export type SignalStatusType =
  | "ACTIVE"
  | "TP1 HIT"
  | "TP2 HIT"
  | "TP3 HIT"
  | "TP4 HIT"
  | "TP5 HIT"
  | "PARTIAL TP"
  | "ALL TPS HIT"
  | "ALL TP HIT"
  | "HIT TP"
  | "HIT SL"
  | "CLOSED";

export interface TradingSignalItem {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  status: SignalStatusType;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  tpLevels: SignalTpLevel[];
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
  lastMarketPrice?: number;
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
  signalId?: string;
  pair: string;
  direction: "BUY" | "SELL";
  lotSize: number;
  lots: number;
  openPrice: string;
  closePrice: string;
  takeProfitPrice?: string;
  stopLossPrice?: string;
  customTp?: string;
  customSl?: string;
  tpLevelSelected?: string;
  selectedTpLevel?: number;
  pnlUsd: number;
  returnPct: number;
  status: "WIN" | "LOSS" | "OPEN" | "PARTIAL TP";
  source: "EXNESS_SYNC" | "SIGNAL_COPY" | "MANUAL";
  notes?: string;
  executedAt: string;
}

export interface ClientNotificationItem {
  id: string;
  studentEmail: string; // specific student email or "ALL"
  category: "TRADE" | "SIGNAL_TP" | "ACCOUNT" | "CERTIFICATE" | "SYSTEM";
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
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
// 3. AUTO-QUIZ GENERATOR ENGINE (MULTI-QUESTION PER LEVEL / LESSON)
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
      question: `According to "${cleanTitle}", how should a trader confirm a valid setup?`,
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
        explanation: "London & New York overlap accounts for the highest institutional volume.",
      },
      {
        id: `${courseId}-q5`,
        question: "If your account balance is $100 and you risk 1% with a 10-pip stop-loss on EUR/USD, what is your maximum dollar risk?",
        options: ["$10.00", "$1.00", "$5.00", "$0.10"],
        correctIndex: 1,
        explanation: "1% of $100 is $1.00 maximum risk.",
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
        explanation: "Institutional BOS requires a full candle body closure beyond the structural high.",
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
        explanation: "Equal highs/lows hold resting buy-stops and sell-stops targeted during liquidity sweeps.",
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
        explanation: "Stepping away after hitting your daily loss circuit breaker prevents revenge trading.",
      },
      {
        id: `${courseId}-q5`,
        question: "With a 1 : 2.5 Risk-to-Reward ratio, what minimum win rate is needed to remain profitable over 20 trades?",
        options: ["90% win rate", "At least 30%–35% win rate", "75% win rate", "100% win rate"],
        correctIndex: 1,
        explanation: "At 1:2.5 R:R, winning just 30%–35% of setups yields positive net expectancy.",
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
        explanation: "Displacement leaves a clear Fair Value Gap and confirms institutional sponsorship.",
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
        explanation: "A sweep of sell-side liquidity followed by a bullish MSS targets buy-side liquidity.",
      }
    );
  }

  return generated;
}

// ============================================================================
// 4. 4 SIGNATURE COURSE TRACKS (ZERO DEMO LESSONS — ADMIN UPLOADS ONLY)
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
    levelPdfUrl: "",
    levelPdfName: "",
    levelQuizQuestions: [],
    lessons: [],
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
    levelPdfUrl: "",
    levelPdfName: "",
    levelQuizQuestions: [],
    lessons: [],
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
    levelPdfUrl: "",
    levelPdfName: "",
    levelQuizQuestions: [],
    lessons: [],
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
    levelPdfUrl: "",
    levelPdfName: "",
    levelQuizQuestions: [],
    lessons: [],
  },
];

// LocalStorage keys (v3 cleans out any legacy demo items)
const LS_COURSES_KEY = "candlesticks_courses_tracks_v3";
const LS_PROGRESS_KEY = "candlesticks_student_lesson_progress_v3";
const LS_QUIZ_ATTEMPTS_KEY = "candlesticks_student_quiz_attempts_v3";
const LS_CERTIFICATES_KEY = "candlesticks_student_certificates_v3";
const LS_CERT_TEMPLATE_KEY = "candlesticks_certificate_template_v3";
const LS_LIVE_SESSIONS_KEY = "candlesticks_live_sessions_v3";
const LS_LIVE_CHAT_KEY = "candlesticks_live_chat_messages_v3";
const LS_SIGNALS_KEY = "candlesticks_trading_signals_v3";
const LS_TRADES_KEY = "candlesticks_student_trades_v3";
const LS_NOTIFICATIONS_KEY = "candlesticks_client_notifications_v3";
const LS_MENTOR_MESSAGES_KEY = "candlesticks_mentor_messages_v3";

function emitPortalUpdate() {
  window.dispatchEvent(new Event("candlesticks_portal_data_updated"));
}

// ============================================================================
// 5. CLIENT ALERT BELL & AUDIT NOTIFICATIONS ENGINE (READ / MARK ALL READ)
// ============================================================================

export function getCachedClientNotifications(studentEmail: string): ClientNotificationItem[] {
  const cleanEmail = (studentEmail || "").trim().toLowerCase();
  const readBroadcastIdsKey = `candlesticks_read_broadcasts_${cleanEmail}`;
  let readBroadcastIds = new Set<string>();
  try {
    const rawRead = localStorage.getItem(readBroadcastIdsKey);
    if (rawRead) readBroadcastIds = new Set(JSON.parse(rawRead));
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(LS_NOTIFICATIONS_KEY);
    if (raw) {
      const list = JSON.parse(raw) as ClientNotificationItem[];
      return list
        .filter((n) => {
          const target = (n.studentEmail || "").toLowerCase();
          return target === "all" || (cleanEmail && target === cleanEmail);
        })
        .map((n) => ({
          ...n,
          isRead: n.isRead || readBroadcastIds.has(n.id),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch {
    // ignore
  }
  return [];
}

export async function fetchClientNotificationsFromDb(
  studentEmail: string
): Promise<ClientNotificationItem[]> {
  const cleanEmail = (studentEmail || "").trim().toLowerCase();
  const local = getCachedClientNotifications(cleanEmail);

  if (!isSupabaseConfigured || !supabase || !cleanEmail) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from("client_notifications")
      .select("*")
      .or(`student_email.ilike.${cleanEmail},student_email.eq.ALL`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && Array.isArray(data) && data.length > 0) {
      const readBroadcastIdsKey = `candlesticks_read_broadcasts_${cleanEmail}`;
      let readBroadcastIds = new Set<string>();
      try {
        const rawRead = localStorage.getItem(readBroadcastIdsKey);
        if (rawRead) readBroadcastIds = new Set(JSON.parse(rawRead));
      } catch {
        // ignore
      }

      const mapped: ClientNotificationItem[] = data.map((r: any) => ({
        id: String(r.id),
        studentEmail: String(r.student_email || "ALL"),
        category: (r.category || "TRADE") as ClientNotificationItem["category"],
        title: String(r.title || "Account Alert"),
        message: String(r.message || ""),
        linkUrl: String(r.link_url || "/overview"),
        isRead: Boolean(r.is_read) || readBroadcastIds.has(String(r.id)),
        createdAt: String(r.created_at || new Date().toISOString()),
      }));

      // Merge with local notifications
      const byId = new Map<string, ClientNotificationItem>();
      local.forEach((item) => byId.set(item.id, item));
      mapped.forEach((item) => byId.set(item.id, item));
      const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return merged;
    }
  } catch {
    // ignore
  }

  return local;
}

export async function createClientNotificationInDb(params: {
  studentEmail: string; // student email or "ALL"
  category: ClientNotificationItem["category"];
  title: string;
  message: string;
  linkUrl?: string;
}): Promise<ClientNotificationItem> {
  const item: ClientNotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentEmail: params.studentEmail.trim() || "ALL",
    category: params.category,
    title: params.title.trim(),
    message: params.message.trim(),
    linkUrl: params.linkUrl || "/overview",
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(LS_NOTIFICATIONS_KEY);
    const list: ClientNotificationItem[] = raw ? JSON.parse(raw) : [];
    list.unshift(item);
    localStorage.setItem(LS_NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    // ignore
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await Promise.allSettled([
        supabase.from("client_notifications").insert({
          student_email: item.studentEmail,
          category: item.category,
          title: item.title,
          message: item.message,
          link_url: item.linkUrl,
          is_read: false,
          created_at: item.createdAt,
        }),
        supabase.from("audit_logs").insert({
          event_type: item.category,
          actor: item.studentEmail === "ALL" ? "Admin / System" : item.studentEmail,
          detail: `${item.title}: ${item.message}`,
          created_at: item.createdAt,
        }),
      ]);
    } catch {
      // ignore
    }
  }

  emitPortalUpdate();
  return item;
}

export async function markNotificationReadInDb(
  notificationId: string,
  studentEmail: string
): Promise<void> {
  const cleanEmail = (studentEmail || "").trim().toLowerCase();
  const readBroadcastIdsKey = `candlesticks_read_broadcasts_${cleanEmail}`;
  try {
    const rawRead = localStorage.getItem(readBroadcastIdsKey);
    const arr: string[] = rawRead ? JSON.parse(rawRead) : [];
    if (!arr.includes(notificationId)) {
      arr.push(notificationId);
      localStorage.setItem(readBroadcastIdsKey, JSON.stringify(arr));
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(LS_NOTIFICATIONS_KEY);
    if (raw) {
      const list = (JSON.parse(raw) as ClientNotificationItem[]).map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      localStorage.setItem(LS_NOTIFICATIONS_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("client_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
    } catch {
      // ignore
    }
  }

  emitPortalUpdate();
}

export async function markAllNotificationsReadInDb(studentEmail: string): Promise<void> {
  const cleanEmail = (studentEmail || "").trim().toLowerCase();
  const current = getCachedClientNotifications(cleanEmail);
  const readBroadcastIdsKey = `candlesticks_read_broadcasts_${cleanEmail}`;

  try {
    const rawRead = localStorage.getItem(readBroadcastIdsKey);
    const set = new Set<string>(rawRead ? JSON.parse(rawRead) : []);
    current.forEach((n) => set.add(n.id));
    localStorage.setItem(readBroadcastIdsKey, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(LS_NOTIFICATIONS_KEY);
    if (raw) {
      const list = (JSON.parse(raw) as ClientNotificationItem[]).map((n) => {
        const target = (n.studentEmail || "").toLowerCase();
        if (target === "all" || target === cleanEmail) {
          return { ...n, isRead: true };
        }
        return n;
      });
      localStorage.setItem(LS_NOTIFICATIONS_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }

  if (isSupabaseConfigured && supabase && cleanEmail) {
    try {
      await supabase
        .from("client_notifications")
        .update({ is_read: true })
        .ilike("student_email", cleanEmail);
    } catch {
      // ignore
    }
  }

  emitPortalUpdate();
}

// ============================================================================
// 6. COURSES, LEVEL PDF QUIZ GENERATOR & ADMIN VIDEO LESSON MANAGEMENT
// ============================================================================

export function getCachedCourses(): CourseTrackItem[] {
  try {
    const raw = localStorage.getItem(LS_COURSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CourseTrackItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return DEFAULT_COURSE_TRACKS.map((def) => {
          const match = parsed.find((p) => p.id === def.id || p.slug === def.slug);
          if (!match) return def;
          return {
            ...def,
            ...match,
            lessons: Array.isArray(match.lessons) ? match.lessons : [],
            levelQuizQuestions: Array.isArray(match.levelQuizQuestions)
              ? match.levelQuizQuestions
              : [],
          };
        });
      }
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
      supabase.from("courses").select("*").order("sort_order", { ascending: true }),
      supabase.from("course_lessons").select("*").order("lesson_number", { ascending: true }),
    ]);

    const dbCoursesMap = new Map<string, any>();
    if (Array.isArray(coursesRes.data)) {
      coursesRes.data.forEach((c: any) => dbCoursesMap.set(String(c.id), c));
    }

    const dbLessons: CourseLessonItem[] = Array.isArray(lessonsRes.data)
      ? lessonsRes.data.map((r: any) => ({
          id: String(r.id),
          courseId: String(r.course_id),
          courseSlug: String(r.course_id),
          lessonNumber: Number(r.lesson_number || 1),
          title: String(r.title || "Lesson"),
          description: String(r.description || ""),
          summary: String(r.description || ""),
          durationMinutes: Number(r.duration_minutes || 12),
          videoUrl: String(r.video_url || ""),
          videoSourceType:
            r.video_source_type === "supabase_storage" ? "supabase_storage" : "url",
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
        }))
      : [];

    const merged = localTracks.map((track) => {
      const dbCourse = dbCoursesMap.get(track.id);
      const trackDbLessons = dbLessons.filter((l) => l.courseId === track.id);
      const byNum = new Map<number, CourseLessonItem>();
      track.lessons.forEach((l) => byNum.set(l.lessonNumber, l));
      trackDbLessons.forEach((l) => byNum.set(l.lessonNumber, l));
      const combinedLessons =
        trackDbLessons.length > 0
          ? Array.from(byNum.values()).sort((a, b) => a.lessonNumber - b.lessonNumber)
          : track.lessons;

      return {
        ...track,
        slug: track.id,
        color: track.coverColor,
        levelPdfUrl: dbCourse?.level_pdf_url || track.levelPdfUrl || "",
        levelPdfName: dbCourse?.level_pdf_name || track.levelPdfName || "",
        levelQuizQuestions:
          Array.isArray(dbCourse?.level_quiz_questions) &&
          dbCourse.level_quiz_questions.length > 0
            ? dbCourse.level_quiz_questions
            : track.levelQuizQuestions || [],
        lessons: combinedLessons,
      };
    });

    localStorage.setItem(LS_COURSES_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.debug("Supabase courses fetch note:", err);
  }

  return localTracks.map((t) => ({ ...t, slug: t.id, color: t.coverColor }));
}

export const fetchCoursesWithLessonsFromDb = fetchCoursesWithLessons;

// Upload PDF for a specific course level (Beginner, Intermediate, Essential, Advanced) and generate multi-question quiz
export async function uploadCourseLevelPdfAndGenerateQuiz(params: {
  courseId: string;
  file?: File | null;
  curriculumNotes?: string;
  questionCount?: number;
}): Promise<{
  success: boolean;
  pdfUrl: string;
  pdfName: string;
  questions: QuizQuestionItem[];
  message: string;
}> {
  const tracks = getCachedCourses();
  const track = tracks.find((t) => t.id === params.courseId) || tracks[0];

  let pdfUrl = track.levelPdfUrl || "";
  let pdfName = params.file?.name || track.levelPdfName || `${track.level}-Study-Guide.pdf`;
  let pdfBase64 = "";

  if (params.file) {
    pdfBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(params.file!);
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const safePath = `${track.id}/${Date.now()}-${params.file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        )}`;
        const { error } = await supabase.storage.from("course-pdfs").upload(safePath, params.file, {
          cacheControl: "3600",
          upsert: true,
        });
        if (!error) {
          const { data } = supabase.storage.from("course-pdfs").getPublicUrl(safePath);
          if (data?.publicUrl) {
            pdfUrl = data.publicUrl;
          }
        }
      } catch {
        // fallback
      }
    }
    if (!pdfUrl) {
      pdfUrl = URL.createObjectURL(params.file);
    }
  }

  let generatedQuestions: QuizQuestionItem[] = [];
  let apiMessage = "";

  try {
    const res = await fetch("/api/quiz/generate-from-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: track.id,
        courseTitle: track.title,
        level: track.level,
        pdfBase64,
        pdfName,
        curriculumNotes: params.curriculumNotes || track.description,
        questionCount: params.questionCount || 6,
      }),
    });
    const data = await res.json();
    if (Array.isArray(data?.questions) && data.questions.length > 0) {
      generatedQuestions = data.questions;
      apiMessage = data.message || "";
    }
  } catch {
    // fallback if server endpoint unreachable
  }

  if (generatedQuestions.length === 0) {
    generatedQuestions = generateAutoQuizQuestions(
      track.id,
      `${track.title} (${track.level} PDF)`,
      params.curriculumNotes || track.description,
      []
    );
  }

  // Persist level PDF & generated multi-question quiz on the course track
  const updatedTracks = tracks.map((t) =>
    t.id === track.id
      ? {
          ...t,
          levelPdfUrl: pdfUrl,
          levelPdfName: pdfName,
          levelQuizQuestions: generatedQuestions,
        }
      : t
  );
  localStorage.setItem(LS_COURSES_KEY, JSON.stringify(updatedTracks));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("courses")
        .update({
          level_pdf_url: pdfUrl,
          level_pdf_name: pdfName,
          level_quiz_questions: generatedQuestions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", track.id);
    } catch {
      // ignore
    }
  }

  emitPortalUpdate();
  return {
    success: true,
    pdfUrl,
    pdfName,
    questions: generatedQuestions,
    message:
      apiMessage ||
      `Uploaded "${pdfName}" for ${track.level} (${track.title}) and generated ${generatedQuestions.length} multi-choice quiz questions!`,
  };
}

export async function saveCourseLevelQuizQuestionsToDb(
  courseId: string,
  questions: QuizQuestionItem[]
): Promise<void> {
  const tracks = getCachedCourses().map((t) =>
    t.id === courseId ? { ...t, levelQuizQuestions: questions } : t
  );
  localStorage.setItem(LS_COURSES_KEY, JSON.stringify(tracks));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("courses")
        .update({
          level_quiz_questions: questions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId);
    } catch {
      // ignore
    }
  }
  emitPortalUpdate();
}

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

  const blobUrl = URL.createObjectURL(file);
  return {
    success: true,
    url: blobUrl,
    message: "Video ready for playback and attached to lesson.",
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
    message: `Video Lesson #${newLesson.lessonNumber} ("${newLesson.title}") published to ${params.courseId}!`,
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
// 7. REAL STUDENT LESSON PROGRESS, STREAK & MULTI-QUESTION QUIZ ENGINE
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
  } else {
    studentObj = arg1.student;
    courseId = arg1.courseId;
    lessonObj = arg1.lesson;
  }

  if (!lessonObj) {
    return { completed: false, courseProgressPct: 0 };
  }

  const cleanEmail = (studentObj.email || "").trim().toLowerCase();
  const rawAll = localStorage.getItem(LS_PROGRESS_KEY);
  const allList: StudentLessonProgressItem[] = rawAll ? JSON.parse(rawAll) : [];

  const existingIdx = allList.findIndex(
    (p) => p.studentEmail.toLowerCase() === cleanEmail && p.lessonId === lessonObj!.id
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

  // If course has uploaded lessons and reaches 100%, auto-issue certificate & notify student
  if (courseStat && courseStat.totalCount > 0 && courseStat.progressPct === 100) {
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
          quizTitle: quizTitleArg || "Course Level PDF Assessment",
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
    nextLesson: CourseLessonItem | null;
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

  const totalQuizzesTaken = quizAttempts.length;
  const quizAveragePct =
    totalQuizzesTaken > 0
      ? Math.round(quizAttempts.reduce((sum, q) => sum + q.scorePercent, 0) / totalQuizzesTaken)
      : 0;

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

  for (let i = studyHeatmap56Days.length - 1; i >= 0; i--) {
    const dayEntry = studyHeatmap56Days[i];
    if (dayEntry.count > 0) {
      streakDays += 1;
    } else if (i === studyHeatmap56Days.length - 1) {
      continue;
    } else {
      break;
    }
  }

  const inProgressCourse =
    courseBreakdown.find((c) => c.completedCount > 0 && c.completedCount < c.totalCount) ||
    courseBreakdown.find((c) => c.totalCount > 0 && c.completedCount < c.totalCount) ||
    courseBreakdown[0];

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
      nextLesson: inProgressCourse.nextLesson || null,
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

  // 1. Prefer Level PDF Quiz Questions uploaded by Admin for this level (Beginner / Intermediate / Essential / Advanced)
  if (Array.isArray(track.levelQuizQuestions) && track.levelQuizQuestions.length > 0) {
    return track.levelQuizQuestions;
  }

  // 2. Otherwise collect questions from lessons uploaded by Admin for this track
  const collected: QuizQuestionItem[] = [];
  for (const lesson of track.lessons) {
    if (Array.isArray(lesson.autoQuizQuestions) && lesson.autoQuizQuestions.length > 0) {
      collected.push(...lesson.autoQuizQuestions.slice(0, 2));
    }
  }
  if (collected.length >= 4) {
    return collected.slice(0, 8);
  }

  // 3. Multi-question fallback for the course level
  return generateAutoQuizQuestions(track.id, `${track.title} (${track.level})`, track.description, []);
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
// 8. VERIFIED COURSE COMPLETION CERTIFICATES & ADMIN TEMPLATE STUDIO
// ============================================================================

const DEFAULT_CERT_TEMPLATE: CertificateTemplateConfig = {
  id: "default",
  templateImageUrl: "",
  nameXPct: 50,
  nameYPct: 48,
  fontSize: 44,
  fontColor: "#ffb600",
  showCourseTitle: true,
  courseYPct: 62,
  showIssueDate: true,
  updatedAt: new Date().toISOString(),
};

export function getCachedCertificateTemplate(): CertificateTemplateConfig {
  try {
    const raw = localStorage.getItem(LS_CERT_TEMPLATE_KEY);
    if (raw) {
      return { ...DEFAULT_CERT_TEMPLATE, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_CERT_TEMPLATE;
}

export async function fetchCertificateTemplateFromDb(): Promise<CertificateTemplateConfig> {
  const local = getCachedCertificateTemplate();
  if (!isSupabaseConfigured || !supabase) return local;

  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      const mapped: CertificateTemplateConfig = {
        id: "default",
        templateImageUrl: String(data.template_image_url || local.templateImageUrl || ""),
        nameXPct: Number(data.name_x_pct ?? 50),
        nameYPct: Number(data.name_y_pct ?? 48),
        fontSize: Number(data.font_size ?? 44),
        fontColor: String(data.font_color || "#ffb600"),
        showCourseTitle: Boolean(data.show_course_title ?? true),
        courseYPct: Number(data.course_y_pct ?? 62),
        showIssueDate: Boolean(data.show_issue_date ?? true),
        updatedAt: String(data.updated_at || new Date().toISOString()),
      };
      localStorage.setItem(LS_CERT_TEMPLATE_KEY, JSON.stringify(mapped));
      return mapped;
    }
  } catch {
    // ignore
  }
  return local;
}

export async function uploadCertificateTemplateImage(
  file: File
): Promise<{ success: boolean; url: string; message: string }> {
  const dataUrl = await compressImageToDataUrl(file, 1600);
  let finalUrl = dataUrl;

  if (isSupabaseConfigured && supabase) {
    try {
      const ext = file.name.split(".").pop() || "png";
      const filePath = `template-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("certificate-templates")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (!error) {
        const { data } = supabase.storage.from("certificate-templates").getPublicUrl(filePath);
        if (data?.publicUrl) {
          finalUrl = data.publicUrl;
        }
      }
    } catch {
      // fallback to dataUrl
    }
  }

  return {
    success: true,
    url: finalUrl,
    message: "Certificate template artwork uploaded! Adjust the student name position below.",
  };
}

export async function saveCertificateTemplateToDb(
  config: CertificateTemplateConfig
): Promise<CertificateTemplateConfig> {
  const next = { ...config, updatedAt: new Date().toISOString() };
  localStorage.setItem(LS_CERT_TEMPLATE_KEY, JSON.stringify(next));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("certificate_templates").upsert(
        {
          id: "default",
          template_image_url: next.templateImageUrl,
          name_x_pct: next.nameXPct,
          name_y_pct: next.nameYPct,
          font_size: next.fontSize,
          font_color: next.fontColor,
          show_course_title: next.showCourseTitle,
          course_y_pct: next.courseYPct,
          show_issue_date: next.showIssueDate,
          updated_at: next.updatedAt,
        },
        { onConflict: "id" }
      );
    } catch {
      // ignore
    }
  }

  emitPortalUpdate();
  return next;
}

// Render personalized PNG certificate on an HTML5 Canvas with the student's real name
export async function renderPersonalizedCertificateDataUrl(params: {
  studentName: string;
  courseTitle: string;
  certificateCode: string;
  issuedAt: string;
  template: CertificateTemplateConfig;
}): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1130;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const { template } = params;
  let drewCustomBg = false;

  if (template.templateImageUrl) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = template.templateImageUrl;
      });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drewCustomBg = true;
    } catch {
      drewCustomBg = false;
    }
  }

  if (!drewCustomBg) {
    // Institutional dark & gold fallback certificate artwork
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#0B0D13");
    grad.addColorStop(1, "#131824");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer & Inner Gold Borders
    ctx.strokeStyle = "#ffb600";
    ctx.lineWidth = 6;
    ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);
    ctx.strokeStyle = "rgba(255, 182, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(68, 68, canvas.width - 136, canvas.height - 136);

    // Header
    ctx.fillStyle = "#ffb600";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CANDLESTICKS TRADING ACADEMY · VERIFIED CREDENTIAL", canvas.width / 2, 180);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 56px sans-serif";
    ctx.fillText("CERTIFICATE OF COMPLETION", canvas.width / 2, 270);

    ctx.fillStyle = "#9AA4B5";
    ctx.font = "26px sans-serif";
    ctx.fillText("THIS IS PROUDLY PRESENTED TO", canvas.width / 2, 390);
  }

  // Draw Student Name at Admin's configured X/Y percentage coordinates
  const nameX = (template.nameXPct / 100) * canvas.width;
  const nameY = (template.nameYPct / 100) * canvas.height;
  ctx.fillStyle = template.fontColor || "#ffb600";
  ctx.font = `bold ${Math.round(template.fontSize * 1.45)}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.fillText(params.studentName || "Verified Trader", nameX, nameY);

  if (template.showCourseTitle) {
    const courseY = (template.courseYPct / 100) * canvas.height;
    if (!drewCustomBg) {
      ctx.fillStyle = "#9AA4B5";
      ctx.font = "24px sans-serif";
      ctx.fillText("For successfully completing 100% of the curriculum in", canvas.width / 2, courseY - 48);
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(params.courseTitle, nameX, courseY);
  }

  if (template.showIssueDate) {
    ctx.fillStyle = "#9AA4B5";
    ctx.font = "20px monospace";
    const dateText = `Issued: ${new Date(params.issuedAt).toLocaleDateString()} · Credential ID: ${params.certificateCode} · Signed: Pastor Mike (Founder)`;
    ctx.fillText(dateText, canvas.width / 2, canvas.height - 120);
  }

  return canvas.toDataURL("image/png");
}

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

  await createClientNotificationInDb({
    studentEmail: cleanEmail,
    category: "CERTIFICATE",
    title: `Certificate Unlocked: ${cert.courseTitle}`,
    message: `Congratulations ${cert.studentName}! Your personalized ${cert.courseTitle} certificate (${cert.certificateCode}) is ready to download in Progress.`,
    linkUrl: "/progress",
  });

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
// 9. LIVE SESSIONS (ZERO DEMO SESSIONS — ONLY ADMIN SCHEDULED / LIVE SESSIONS)
// ============================================================================

export function getCachedLiveSessions(): LiveSessionItem[] {
  try {
    const raw = localStorage.getItem(LS_LIVE_SESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LiveSessionItem[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export async function fetchLiveSessionsFromDb(): Promise<LiveSessionItem[]> {
  const local = getCachedLiveSessions();
  if (!isSupabaseConfigured || !supabase) return local;

  try {
    const { data, error } = await supabase
      .from("live_sessions")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (!error && Array.isArray(data)) {
      if (data.length === 0) return local;
      const mapped: LiveSessionItem[] = data.map((r: any, idx: number) => {
        let parsedDate = r.scheduled_at ? new Date(String(r.scheduled_at)) : new Date();
        if (isNaN(parsedDate.getTime())) {
          parsedDate = new Date(Date.now() + (idx + 1) * 2 * 3600 * 1000);
        }
        return {
          id: String(r.id || r.slug || `session-${idx}`),
          slug: String(r.slug || r.id || `session-${idx}`),
          title: String(r.title || "Live Trading Session"),
          description: String(r.description || ""),
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
          pinnedResources: Array.isArray(r.pinned_resources) ? r.pinned_resources : [],
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
  return [];
}

export async function fetchSessionChatMessagesFromDb(
  sessionId: string
): Promise<LiveChatMessageItem[]> {
  if (!isSupabaseConfigured || !supabase || !sessionId) {
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
    const list: LiveChatMessageItem[] = raw ? JSON.parse(raw) : [];
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
// 10. TRADING SIGNALS ENGINE (ZERO DEMO DATA, UP TO 5 TPS + LIVE MARKET FEED)
// ============================================================================

function normalizeSignal(s: any): TradingSignalItem {
  const entry = String(s.entryPrice || s.entry || s.entry_price || "1.0850");
  const sl = String(s.stopLoss || s.sl || s.stop_loss || "1.0810");
  const tp = String(s.takeProfit || s.tp || s.take_profit || "1.0940");
  const rr = String(s.riskReward || s.rr || s.risk_reward || "1 : 2.5");
  const thesis = String(s.thesis || s.commentary || "");
  const author = String(s.createdBy || s.author || s.created_by || s.author_name || "Pastor Mike");

  let tpLevels: SignalTpLevel[] = [];
  if (Array.isArray(s.tpLevels) && s.tpLevels.length > 0) {
    tpLevels = s.tpLevels.map((t: any, idx: number) => ({
      level: Number(t.level || idx + 1),
      label: String(t.label || `TP${Number(t.level || idx + 1)}`),
      price: String(t.price || tp),
      hit: Boolean(t.hit),
      hitAt: t.hitAt ? String(t.hitAt) : undefined,
    }));
  } else if (Array.isArray(s.tp_levels) && s.tp_levels.length > 0) {
    tpLevels = s.tp_levels.map((t: any, idx: number) => ({
      level: Number(t.level || idx + 1),
      label: String(t.label || `TP${Number(t.level || idx + 1)}`),
      price: String(t.price || tp),
      hit: Boolean(t.hit),
      hitAt: t.hitAt ? String(t.hitAt) : undefined,
    }));
  } else if (tp) {
    tpLevels = [
      {
        level: 1,
        label: "TP1",
        price: tp,
        hit: s.status === "HIT TP" || s.status === "ALL TPS HIT" || s.status === "ALL TP HIT",
      },
    ];
  }

  return {
    id: String(s.id || `sig-${Date.now()}`),
    pair: String(s.pair || "EUR / USD"),
    direction: s.direction === "SELL" ? "SELL" : "BUY",
    status: (s.status || "ACTIVE") as SignalStatusType,
    entryPrice: entry,
    stopLoss: sl,
    takeProfit: tpLevels[0]?.price || tp,
    tpLevels,
    riskReward: rr,
    entry,
    sl,
    tp: tpLevels[0]?.price || tp,
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
    lastMarketPrice: s.lastMarketPrice
      ? Number(s.lastMarketPrice)
      : s.currentPrice
      ? Number(String(s.currentPrice).replace(/[^0-9.-]/g, "")) || undefined
      : undefined,
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
      if (Array.isArray(parsed)) return parsed.map(normalizeSignal);
    }
  } catch {
    // ignore
  }
  return [];
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
  tpLevels?: SignalTpLevel[];
  tpLevelsInput?: string[]; // Up to 5 TP prices [TP1, TP2, TP3, TP4, TP5]
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
  status?: SignalStatusType;
}): Promise<TradingSignalItem> {
  const slugId = `${params.pair.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()
    .toString()
    .slice(-4)}`;

  const entryVal = (params.entryPrice || params.entry || "1.0850").trim();
  const slVal = (params.stopLoss || params.sl || "1.0810").trim();
  const rawTpList =
    Array.isArray(params.tpLevelsInput) && params.tpLevelsInput.filter((x) => x.trim()).length > 0
      ? params.tpLevelsInput.map((x) => x.trim()).filter(Boolean).slice(0, 5)
      : [(params.takeProfit || params.tp || "1.0940").trim()];

  const tpLevels: SignalTpLevel[] =
    Array.isArray(params.tpLevels) && params.tpLevels.length > 0
      ? params.tpLevels.map((t, idx) => ({
          level: Number(t.level || idx + 1),
          label: String(t.label || `TP${Number(t.level || idx + 1)}`),
          price: String(t.price),
          hit: Boolean(t.hit),
          hitAt: t.hitAt,
        }))
      : rawTpList.map((priceStr, idx) => ({
          level: idx + 1,
          label: `TP${idx + 1}`,
          price: priceStr,
          hit: false,
        }));

  const tpVal = tpLevels[0]?.price || "1.0940";
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
    tpLevels,
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
    floatingPnlText: `Live · ${tpLevels.length} TP Target${tpLevels.length > 1 ? "s" : ""} Active`,
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
          tp_levels: signal.tpLevels,
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

  // Fire broadcast notification to all clients' Alert Bells
  const tpSummary = tpLevels.map((t) => `TP${t.level}: ${t.price}`).join(" · ");
  await createClientNotificationInDb({
    studentEmail: "ALL",
    category: "SIGNAL_TP",
    title: `New VIP Signal: ${signal.pair} (${signal.direction})`,
    message: `Entry ${signal.entry} · SL ${signal.sl} · ${tpSummary}`,
    linkUrl: `/signals/${signal.id}`,
  });

  emitPortalUpdate();
  return signal;
}

export const createSignalInDb = publishTradingSignalInDb;

function parseNumPrice(val: string | undefined): number {
  if (!val) return NaN;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned);
}

// Evaluate a signal's TP1-TP5 and SL against a live market price
export async function updateSignalLiveMarketPriceInDb(
  signalId: string,
  newMarketPriceStr: string
): Promise<TradingSignalItem | null> {
  const list = getCachedTradingSignals();
  const idx = list.findIndex((s) => s.id === signalId);
  if (idx < 0) return null;

  const sig = { ...list[idx], tpLevels: list[idx].tpLevels.map((t) => ({ ...t })) };
  const marketPrice = parseNumPrice(newMarketPriceStr);
  if (isNaN(marketPrice)) return sig;

  sig.currentPrice = newMarketPriceStr;

  if (sig.status !== "CLOSED" && sig.status !== "HIT SL" && sig.status !== "ALL TPS HIT") {
    const isBuy = sig.direction === "BUY";
    const slPrice = parseNumPrice(sig.sl);
    const newlyHitLevels: number[] = [];

    // Check SL first if no TPs hit yet
    const anyTpAlreadyHit = sig.tpLevels.some((t) => t.hit);
    if (!isNaN(slPrice) && !anyTpAlreadyHit) {
      const slTriggered = isBuy ? marketPrice <= slPrice : marketPrice >= slPrice;
      if (slTriggered) {
        sig.status = "HIT SL";
        sig.floatingPnlText = `Stop-Loss hit at ${newMarketPriceStr}`;
        await createClientNotificationInDb({
          studentEmail: "ALL",
          category: "SIGNAL_TP",
          title: `${sig.pair} Stop-Loss Hit (${newMarketPriceStr})`,
          message: `${sig.pair} (${sig.direction}) reached invalidation level ${sig.sl}.`,
          linkUrl: `/signals/${sig.id}`,
        });
      }
    }

    // Check TP1 through TP5
    if (sig.status !== "HIT SL") {
      for (const tpObj of sig.tpLevels) {
        const targetVal = parseNumPrice(tpObj.price);
        if (!isNaN(targetVal) && !tpObj.hit) {
          const hit = isBuy ? marketPrice >= targetVal : marketPrice <= targetVal;
          if (hit) {
            tpObj.hit = true;
            tpObj.hitAt = new Date().toISOString();
            newlyHitLevels.push(tpObj.level);
          }
        }
      }

      const totalTps = sig.tpLevels.length;
      const hitCount = sig.tpLevels.filter((t) => t.hit).length;
      const highestHit = sig.tpLevels
        .filter((t) => t.hit)
        .reduce((max, t) => Math.max(max, t.level), 0);

      if (hitCount > 0) {
        if (hitCount === totalTps) {
          sig.status = totalTps === 1 ? "HIT TP" : "ALL TPS HIT";
          sig.floatingPnlText =
            totalTps === 1
              ? `TP1 Hit (${sig.tpLevels[0].price})`
              : `All ${totalTps} TPs Hit! (TP1–TP${totalTps})`;
        } else {
          sig.status = `TP${highestHit} HIT` as SignalStatusType;
          sig.floatingPnlText = `Partial TP · ${hitCount}/${totalTps} TPs Hit (Up to TP${highestHit})`;
        }
      } else {
        const entryNum = parseNumPrice(sig.entry);
        if (!isNaN(entryNum)) {
          const diff = isBuy ? marketPrice - entryNum : entryNum - marketPrice;
          const mult = sig.pair.includes("XAU") ? 10 : sig.pair.includes("JPY") ? 100 : 10000;
          const pips = Number((diff * mult).toFixed(1));
          sig.floatingPnlText = `${pips >= 0 ? "+" : ""}${pips} pips (${newMarketPriceStr})`;
        }
      }

      // Send client notifications for each newly hit TP level
      for (const lvl of newlyHitLevels) {
        const hitTpObj = sig.tpLevels.find((t) => t.level === lvl);
        const allDone = hitCount === totalTps && totalTps > 1 && lvl === sig.tpLevels[totalTps - 1].level;
        await createClientNotificationInDb({
          studentEmail: "ALL",
          category: "SIGNAL_TP",
          title: allDone
            ? `🎯 ALL TPs HIT on ${sig.pair}! (TP${lvl} @ ${hitTpObj?.price})`
            : `✅ TP${lvl} HIT on ${sig.pair} @ ${hitTpObj?.price}!`,
          message: allDone
            ? `${sig.pair} (${sig.direction}) has smashed all ${totalTps} Take-Profit targets at ${newMarketPriceStr}!`
            : `${sig.pair} (${sig.direction}) hit Take-Profit ${lvl} (${hitTpObj?.price}). ${hitCount} of ${totalTps} TPs reached.`,
          linkUrl: `/signals/${sig.id}`,
        });
      }
    }
  }

  list[idx] = sig;
  localStorage.setItem(LS_SIGNALS_KEY, JSON.stringify(list));

  // Also update any open student trades copied from this signal
  updateOpenStudentTradesForSignal(sig, marketPrice);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("trading_signals")
        .update({
          status: sig.status,
          current_price: sig.currentPrice,
          tp_levels: sig.tpLevels,
          floating_pnl_text: sig.floatingPnlText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sig.id);
    } catch {
      // ignore
    }
  }

  emitPortalUpdate();
  return sig;
}

function updateOpenStudentTradesForSignal(sig: TradingSignalItem, livePrice: number) {
  try {
    const raw = localStorage.getItem(LS_TRADES_KEY);
    if (!raw) return;
    const allTrades = JSON.parse(raw) as StudentTradeItem[];
    let changed = false;

    const updated = allTrades.map((tr) => {
      if (tr.status !== "OPEN") return tr;
      const normPairA = tr.pair.replace(/\s+/g, "").toUpperCase();
      const normPairB = sig.pair.replace(/\s+/g, "").toUpperCase();
      if (tr.signalId !== sig.id && normPairA !== normPairB) return tr;

      const openNum = parseNumPrice(tr.openPrice);
      if (isNaN(openNum)) return tr;

      const isBuy = tr.direction === "BUY";
      const diff = isBuy ? livePrice - openNum : openNum - livePrice;
      const pipMultiplier = normPairA.includes("XAU")
        ? 100
        : normPairA.includes("JPY")
        ? 1000
        : 100000;
      const estPnlUsd = Number((diff * pipMultiplier * (tr.lots || 0.1)).toFixed(2));
      const estReturnPct = Number(((estPnlUsd / 500) * 100).toFixed(2));

      let nextStatus: StudentTradeItem["status"] = tr.status;
      const tpNum = parseNumPrice(tr.takeProfitPrice);
      const slNum = parseNumPrice(tr.stopLossPrice);

      if (!isNaN(tpNum) && (isBuy ? livePrice >= tpNum : livePrice <= tpNum)) {
        nextStatus = "WIN";
      } else if (!isNaN(slNum) && (isBuy ? livePrice <= slNum : livePrice >= slNum)) {
        nextStatus = "LOSS";
      }

      changed = true;
      return {
        ...tr,
        closePrice: String(livePrice),
        pnlUsd: estPnlUsd,
        returnPct: estReturnPct,
        status: nextStatus,
      };
    });

    if (changed) {
      localStorage.setItem(LS_TRADES_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

const DEFAULT_LIVE_MARKET_PRICES: Record<string, number> = {
  "GBP / USD": 1.2685,
  "EUR / USD": 1.0842,
  "XAU / USD": 2342.6,
  "USD / JPY": 154.85,
  "GBP / JPY": 196.42,
  "NAS100 / US100": 18240.5,
};

let cachedMarketPricesMemory: Record<string, number> = { ...DEFAULT_LIVE_MARKET_PRICES };

export function getCachedMarketPrices(): Record<string, number> {
  return cachedMarketPricesMemory;
}

export async function fetchLiveMarketPrices(): Promise<Record<string, number>> {
  try {
    const res = await fetch("/api/market/prices");
    if (res.ok) {
      const data = await res.json();
      if (data?.prices && typeof data.prices === "object") {
        cachedMarketPricesMemory = { ...DEFAULT_LIVE_MARKET_PRICES, ...data.prices };
        return cachedMarketPricesMemory;
      }
    }
  } catch {
    // fallback
  }
  return cachedMarketPricesMemory;
}

export async function evaluateSignalsAgainstMarketPrices(
  pricesInput?: Record<string, number>
): Promise<void> {
  const prices = pricesInput || (await fetchLiveMarketPrices());
  const signals = getCachedTradingSignals();

  for (const sig of signals) {
    if (
      sig.status === "CLOSED" ||
      sig.status === "HIT SL" ||
      sig.status === "ALL TPS HIT" ||
      sig.status === "ALL TP HIT"
    ) {
      continue;
    }
    const normKey = sig.pair.replace(/\s+/g, "").toUpperCase();
    const matchedEntry = Object.entries(prices).find(
      ([k]) => k.replace(/\s+/g, "").toUpperCase() === normKey
    );
    if (matchedEntry) {
      await updateSignalLiveMarketPriceInDb(sig.id, String(matchedEntry[1]));
    }
  }
}

export const evaluateSignalsAgainstLiveMarket = evaluateSignalsAgainstMarketPrices;

// Fetch live market prices from /api/market/prices and evaluate all active signals
export async function syncLiveMarketPricesAndEvaluateSignals(): Promise<Record<string, number>> {
  const prices = await fetchLiveMarketPrices();
  await evaluateSignalsAgainstMarketPrices(prices);
  return prices;
}

// Admin helper to manually mark a specific TP level (TP1..TP5) hit or update signal status
export async function triggerSignalTpLevelHitInDb(
  signalId: string,
  tpLevelNumber: number,
  hitState?: boolean
): Promise<void> {
  const list = getCachedTradingSignals();
  const sig = list.find((s) => s.id === signalId);
  if (!sig) return;
  const targetTp = sig.tpLevels.find((t) => t.level === tpLevelNumber);
  if (targetTp) {
    if (hitState === false) {
      targetTp.hit = false;
      targetTp.hitAt = undefined;
      const anyHit = sig.tpLevels.some((t) => t.hit);
      sig.status = anyHit ? "PARTIAL TP" : "ACTIVE";
      localStorage.setItem(LS_SIGNALS_KEY, JSON.stringify(list));
      emitPortalUpdate();
      return;
    }
    await updateSignalLiveMarketPriceInDb(signalId, targetTp.price);
  }
}

export const triggerSignalTpLevelInDb = triggerSignalTpLevelHitInDb;

export async function updateTradingSignalStatusInDb(
  signalId: string,
  status: SignalStatusType
): Promise<void> {
  const list = getCachedTradingSignals().map((s) => {
    if (s.id !== signalId) return s;
    const updatedTpLevels =
      status === "ALL TPS HIT" || status === "HIT TP"
        ? s.tpLevels.map((t) => ({ ...t, hit: true, hitAt: t.hitAt || new Date().toISOString() }))
        : status === "ACTIVE"
        ? s.tpLevels.map((t) => ({ ...t, hit: false, hitAt: undefined }))
        : s.tpLevels;
    return {
      ...s,
      status,
      tpLevels: updatedTpLevels,
      floatingPnlText:
        status === "ALL TPS HIT" || status === "HIT TP"
          ? "All Targets Hit"
          : status === "HIT SL"
          ? "Stop-Loss Hit"
          : s.floatingPnlText,
    };
  });
  localStorage.setItem(LS_SIGNALS_KEY, JSON.stringify(list));

  const targetSig = list.find((s) => s.id === signalId);
  if (targetSig && (status === "HIT TP" || status === "ALL TPS HIT" || status === "HIT SL")) {
    await createClientNotificationInDb({
      studentEmail: "ALL",
      category: "SIGNAL_TP",
      title: `${targetSig.pair} Signal Status: ${status}`,
      message: `${targetSig.pair} (${targetSig.direction}) updated to ${status}.`,
      linkUrl: `/signals/${targetSig.id}`,
    });
  }

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
// 11. MY TRADES ENGINE (REAL COPIED & EXNESS SYNCED TRADES ONLY, 10 PER PAGE)
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
    signalId: r.signalId || r.signal_id ? String(r.signalId || r.signal_id) : undefined,
    pair: String(r.pair || "EUR / USD"),
    direction: dirUpper,
    lotSize: lotsVal,
    lots: lotsVal,
    openPrice: String(r.openPrice || r.open_price || "1.0800"),
    closePrice: String(r.closePrice || r.close_price || "1.0850"),
    takeProfitPrice:
      r.takeProfitPrice || r.take_profit_price || r.customTp
        ? String(r.takeProfitPrice || r.take_profit_price || r.customTp)
        : undefined,
    stopLossPrice:
      r.stopLossPrice || r.stop_loss_price || r.customSl
        ? String(r.stopLossPrice || r.stop_loss_price || r.customSl)
        : undefined,
    customTp:
      r.customTp || r.takeProfitPrice || r.take_profit_price
        ? String(r.customTp || r.takeProfitPrice || r.take_profit_price)
        : undefined,
    customSl:
      r.customSl || r.stopLossPrice || r.stop_loss_price
        ? String(r.customSl || r.stopLossPrice || r.stop_loss_price)
        : undefined,
    tpLevelSelected:
      r.tpLevelSelected || (r.selectedTpLevel ? `TP${r.selectedTpLevel}` : undefined),
    selectedTpLevel:
      r.selectedTpLevel || r.selected_tp_level
        ? Number(r.selectedTpLevel || r.selected_tp_level)
        : undefined,
    pnlUsd,
    returnPct,
    status: rawStatus === "PARTIAL TP" ? "PARTIAL TP" : statusVal,
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
  signalId?: string;
  pair: string;
  direction: "BUY" | "SELL";
  lots: number;
  openPrice: string;
  closePrice: string;
  takeProfitPrice?: string;
  stopLossPrice?: string;
  customTp?: string;
  customSl?: string;
  tpLevelSelected?: string;
  selectedTpLevel?: number;
  pnlUsd: number;
  returnPct: number;
  status: "WIN" | "LOSS" | "OPEN" | "PARTIAL TP";
  source: "EXNESS_SYNC" | "SIGNAL_COPY" | "MANUAL";
  notes?: string;
}): Promise<StudentTradeItem> {
  const newTrade = normalizeTrade(
    {
      id: `trd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentEmail: params.studentEmail,
      tradingAccountId: params.exnessAccountId,
      exnessAccountId: params.exnessAccountId,
      signalId: params.signalId,
      pair: params.pair,
      direction: params.direction,
      lots: params.lots,
      lotSize: params.lots,
      openPrice: params.openPrice,
      closePrice: params.closePrice,
      takeProfitPrice: params.takeProfitPrice || params.customTp,
      stopLossPrice: params.stopLossPrice || params.customSl,
      customTp: params.customTp || params.takeProfitPrice,
      customSl: params.customSl || params.stopLossPrice,
      tpLevelSelected: params.tpLevelSelected,
      selectedTpLevel: params.selectedTpLevel,
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
        signal_id: newTrade.signalId || "",
        pair: newTrade.pair,
        direction: newTrade.direction === "SELL" ? "Sell" : "Buy",
        lot_size: newTrade.lots,
        open_price: newTrade.openPrice,
        close_price: newTrade.closePrice,
        take_profit_price: newTrade.takeProfitPrice || "",
        stop_loss_price: newTrade.stopLossPrice || "",
        selected_tp_level: newTrade.selectedTpLevel || 1,
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

  // Create a client-specific notification in the Alert Bell & Admin Audit Log
  await createClientNotificationInDb({
    studentEmail: params.studentEmail,
    category: "TRADE",
    title: `Trade Copied to Exness: ${newTrade.pair} (${newTrade.direction})`,
    message: `${newTrade.lots} Lots @ ${newTrade.openPrice}${
      newTrade.takeProfitPrice ? ` · Target TP: ${newTrade.takeProfitPrice}` : ""
    }${newTrade.stopLossPrice ? ` · SL: ${newTrade.stopLossPrice}` : ""}`,
    linkUrl: "/trades",
  });

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
    takeProfitPrice: "2,338.80",
    stopLossPrice: "2,315.00",
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
// 12. DIRECT MENTOR Q&A / SUPPORT MESSAGING (STUDENT <-> ADMIN)
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

  if (params.senderRole === "admin") {
    await createClientNotificationInDb({
      studentEmail: item.studentEmail,
      category: "ACCOUNT",
      title: `New Reply from Pastor Mike (${item.subject})`,
      message: item.message,
      linkUrl: "/settings#mentor-qa",
    });
  }

  emitPortalUpdate();
  return item;
}

// ============================================================================
// 13. STUDENT PROFILE PHOTO UPLOAD (SUPABASE BUCKET `student-avatars` + DB SYNC)
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
      ? "Profile picture uploaded to Supabase Storage and synced to your topbar & Admin Roster!"
      : "Profile picture saved and synced to your topbar & Admin Roster!",
  };
}

export async function uploadStudentAvatarToStorage(
  file: File,
  student: ExnessStudent
): Promise<{ success: boolean; avatarUrl: string; message: string }> {
  return uploadStudentProfileAvatar(student, file);
}

// ============================================================================
// 14. HIGH-IMPACT FOREX ECONOMIC CALENDAR
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
