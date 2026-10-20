-- =============================================================================
-- CANDLESTICKS ACADEMY — COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Project: https://vkedjjibvyjrixnhqwtr.supabase.co
-- Partner Link: https://one.exnessonelink.com/a/qgcrue4rqj (Code: qgcrue4rqj)
-- Partner Account ID: 1064144938140187556
-- =============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. STUDENTS / PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  full_name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Ghana',
  email TEXT NOT NULL UNIQUE,
  has_exness_account BOOLEAN NOT NULL DEFAULT TRUE,
  exness_id TEXT DEFAULT '',
  exness_email TEXT DEFAULT '',
  exness_client_uid TEXT,
  partner_code TEXT NOT NULL DEFAULT 'qgcrue4rqj',
  partner_linked BOOLEAN NOT NULL DEFAULT FALSE,
  partner_linked_at TIMESTAMPTZ,
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  deposit_verified BOOLEAN NOT NULL DEFAULT FALSE,
  deposit_verified_at TIMESTAMPTZ,
  client_balance NUMERIC(12, 2) DEFAULT 0.00,
  client_equity NUMERIC(12, 2) DEFAULT 0.00,
  volume_lots NUMERIC(12, 4) DEFAULT 0.0000,
  reward_usd NUMERIC(12, 2) DEFAULT 0.00,
  kyc_passed BOOLEAN DEFAULT FALSE,
  ftd_received BOOLEAN DEFAULT FALSE,
  ticket_status TEXT NOT NULL DEFAULT 'none' CHECK (ticket_status IN ('none', 'submitted', 'verified')),
  ticket_details JSONB,
  tier TEXT NOT NULL DEFAULT 'free_month' CHECK (tier IN ('free_month', 'funded_student', 'mentorship', 'admin')),
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  course_progress INTEGER NOT NULL DEFAULT 0,
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_exness_id ON public.students(exness_id);
CREATE INDEX IF NOT EXISTS idx_students_exness_client_uid ON public.students(exness_client_uid);

-- -----------------------------------------------------------------------------
-- 2. EXNESS PARTNER API VERIFICATION LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exness_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  trading_account TEXT NOT NULL,
  client_uid TEXT,
  partner_code TEXT NOT NULL DEFAULT 'qgcrue4rqj',
  affiliation BOOLEAN NOT NULL DEFAULT FALSE,
  matched_accounts JSONB DEFAULT '[]'::jsonb,
  deposit_amount NUMERIC(12, 2) DEFAULT 0.00,
  client_balance NUMERIC(12, 2) DEFAULT 0.00,
  is_funded BOOLEAN NOT NULL DEFAULT FALSE,
  raw_response JSONB,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exness_verifications_email ON public.exness_verifications(email);
CREATE INDEX IF NOT EXISTS idx_exness_verifications_account ON public.exness_verifications(trading_account);

-- -----------------------------------------------------------------------------
-- 3. EXNESS PARTNER CLIENTS & TRADING ACCOUNTS TABLE
-- Includes client_account_id, client_id, trading_account_id, client_uid, and partner_account
-- Synced from Exness Partner API (/api/v2/reports/clients/ & /api/v2/reports/rewards/)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.exness_partner_clients CASCADE;

CREATE TABLE public.exness_partner_clients (
  id TEXT PRIMARY KEY,
  client_account_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  trading_account_id TEXT NOT NULL,
  client_uid TEXT NOT NULL,
  partner_account TEXT NOT NULL DEFAULT '1064144938140187556',
  link_code TEXT NOT NULL DEFAULT 'qgcrue4rqj',
  account_type TEXT DEFAULT 'Standard',
  platform TEXT DEFAULT 'MT5',
  reg_date TEXT,
  client_country TEXT,
  volume_lots NUMERIC(12, 4) DEFAULT 0,
  volume_mln_usd NUMERIC(12, 4) DEFAULT 0,
  reward_usd NUMERIC(12, 2) DEFAULT 0,
  client_status TEXT DEFAULT 'ACTIVE',
  kyc_passed BOOLEAN DEFAULT FALSE,
  ftd_received BOOLEAN DEFAULT FALSE,
  ftt_made BOOLEAN DEFAULT FALSE,
  client_balance NUMERIC(12, 2) DEFAULT 0,
  client_equity NUMERIC(12, 2) DEFAULT 0,
  deposit_amount NUMERIC(12, 2) DEFAULT 0,
  ftd_amount NUMERIC(12, 2) DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exness_partner_clients_trading_account ON public.exness_partner_clients(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_exness_partner_clients_client_account ON public.exness_partner_clients(client_account_id);
CREATE INDEX IF NOT EXISTS idx_exness_partner_clients_client_id ON public.exness_partner_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_exness_partner_clients_client_uid ON public.exness_partner_clients(client_uid);

-- -----------------------------------------------------------------------------
-- 4. SUPPORT TICKETS TABLE (FOR EXISTING EXNESS ACCOUNT TRANSFERS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_ref TEXT NOT NULL UNIQUE,
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  exness_email TEXT NOT NULL,
  trading_account_id TEXT NOT NULL,
  partner_code TEXT NOT NULL DEFAULT 'qgcrue4rqj',
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 5. COURSES & LESSONS TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Essential', 'Advanced')),
  lessons_count INTEGER NOT NULL DEFAULT 12,
  color TEXT NOT NULL DEFAULT 'gold',
  description TEXT NOT NULL,
  min_deposit_required NUMERIC(12, 2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 12,
  video_url TEXT,
  summary TEXT,
  is_assessment BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  quiz_score INTEGER,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- -----------------------------------------------------------------------------
-- 6. MARKET SIGNALS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signals (
  id TEXT PRIMARY KEY,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HIT TP', 'HIT SL', 'CLOSED')),
  entry_price TEXT NOT NULL,
  stop_loss TEXT NOT NULL,
  take_profit TEXT NOT NULL,
  risk_reward TEXT NOT NULL DEFAULT '1 : 2.4',
  commentary TEXT,
  author_name TEXT NOT NULL DEFAULT 'Pastor Mike',
  min_deposit_required NUMERIC(12, 2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. LIVE TRADING SESSIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'live' CHECK (session_type IN ('live', 'upcoming', 'replay')),
  scheduled_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  registered_count INTEGER NOT NULL DEFAULT 124,
  host_name TEXT NOT NULL DEFAULT 'Pastor Mike',
  min_deposit_required NUMERIC(12, 2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. STUDENT TRADES & MENTORSHIP PAYMENTS TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('Buy', 'Sell')),
  open_price TEXT NOT NULL,
  close_price TEXT NOT NULL,
  pnl_usd TEXT NOT NULL,
  return_pct TEXT NOT NULL,
  traded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'MENTORSHIP',
  amount_usd NUMERIC(12, 2) NOT NULL DEFAULT 150.00,
  status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'PENDING', 'OVERDUE')),
  next_billing_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. SEED REAL EXNESS PARTNER CLIENTS & TRADING ACCOUNTS (PARTNER #1064144938140187556)
-- Includes client_account_id, client_id, trading_account_id, client_uid, partner_account
-- -----------------------------------------------------------------------------
INSERT INTO public.exness_partner_clients (
  id, client_account_id, client_id, trading_account_id, client_uid, partner_account,
  link_code, account_type, platform, reg_date, client_country, volume_lots,
  volume_mln_usd, reward_usd, client_status, kyc_passed, ftd_received, ftt_made,
  client_balance, client_equity, deposit_amount, ftd_amount
)
VALUES
  ('acct-16544022', '16544022', 'c117236d', '16544022', 'c117236d-2944-475a-8687-f066c59c0cb1', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2024-08-22', 'GH', 0.4800, 0.0977, 2.50, 'ACTIVE', true, true, true, 1, 1, 5, 5),
  ('acct-168421982', '168421982', 'c117236d', '168421982', 'c117236d-2944-475a-8687-f066c59c0cb1', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2024-08-22', 'GH', 4.0500, 0.8240, 25.42, 'ACTIVE', true, true, true, 1, 1, 5, 5),
  ('acct-173174690', '173174690', 'c117236d', '173174690', 'c117236d-2944-475a-8687-f066c59c0cb1', '1064144938140187556', 'qgcrue4rqj', 'Pro', 'MT4/MT5', '2024-08-22', 'GH', 109.7200, 22.3283, 219.55, 'ACTIVE', true, true, true, 1, 1, 5, 5),
  ('acct-161719649', '161719649', 'bcbe5865', '161719649', 'bcbe5865-ab11-47c2-b4c6-2bbf97dce90c', '1064144938140187556', 'qgcrue4rqj', 'Standard Cent', 'MT5', '2026-09-01', 'GH', 0.0340, 0.0132, 0.22, 'ACTIVE', false, true, true, 1, 1, 2, 3),
  ('acct-410934771', '410934771', 'bcbe5865', '410934771', 'bcbe5865-ab11-47c2-b4c6-2bbf97dce90c', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT5', '2026-09-01', 'GH', 0.3600, 0.1395, 1.04, 'ACTIVE', false, true, true, 1, 1, 2, 3),
  ('acct-171396502', '171396502', '81b02ffb', '171396502', '91592684-51a4-4f29-bf16-77b59a74c67a', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2025-05-19', 'GH', 70.5400, 19.7280, 234.71, 'ACTIVE', true, true, true, 1, 1, 5, 4),
  ('acct-174597498', '174597498', '81b02ffb', '174597498', '91592684-51a4-4f29-bf16-77b59a74c67a', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2025-05-19', 'GH', 0.3800, 0.1070, 1.63, 'ACTIVE', true, true, true, 1, 1, 5, 4),
  ('acct-171192597', '171192597', 'd8e89780', '171192597', 'd8e89780-4757-46b6-a677-fc79293d25ec', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2024-07-18', 'GH', 101.9700, 24.1921, 343.25, 'ACTIVE', true, true, true, 1, 1, 5, 4),
  ('acct-167224676', '167224676', 'b954f4a0', '167224676', 'b954f4a0-1215-4f0a-a967-ac6a154e62ba', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2024-04-09', 'GH', 0.0900, 0.0167, 0.23, 'ACTIVE', true, true, true, 1, 1, 2, 2),
  ('acct-43602964', '43602964', '661c3ab9', '43602964', '661c3ab9-2367-40a7-a388-3693f0389e88', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2023-10-02', 'GH', 0.1600, 0.0437, 0.69, 'ACTIVE', false, true, true, 1, 1, 2, 2),
  ('acct-59864023', '59864023', 'eaeae957', '59864023', 'eaeae957-384c-443b-9b0e-5df177b8d43c', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT5', '2024-08-16', 'JP', 58.7300, 13.5184, 260.77, 'ACTIVE', true, true, true, 4, 4, 4, 4),
  ('acct-233155788', '233155788', 'eaeae957', '233155788', 'eaeae957-384c-443b-9b0e-5df177b8d43c', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT5', '2024-08-16', 'JP', 9.4700, 2.9451, 33.31, 'ACTIVE', true, true, true, 4, 4, 4, 4),
  ('acct-59788116', '59788116', 'eebe9eb9', '59788116', 'eebe9eb9-cbf1-45e8-9f29-1721a49c0e6c', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2024-06-08', 'JP', 77.5400, 15.2500, 365.32, 'ACTIVE', true, true, true, 1, 1, 6, 3),
  ('acct-59788363', '59788363', 'eebe9eb9', '59788363', 'eebe9eb9-cbf1-45e8-9f29-1721a49c0e6c', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2024-06-08', 'JP', 129.7800, 25.5227, 420.35, 'ACTIVE', true, true, true, 1, 1, 6, 3),
  ('acct-59873010', '59873010', 'eebe9eb9', '59873010', 'eebe9eb9-cbf1-45e8-9f29-1721a49c0e6c', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT4/MT5', '2024-06-08', 'JP', 72.6900, 14.3000, 364.16, 'ACTIVE', true, true, true, 1, 1, 6, 3),
  ('client-476ab026', '476ab026', '476ab026', '476ab026', '476ab026-c7cf-4b60-9732-9c62c252f68d', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT5', '2024-08-14', 'GH', 0.0000, 0.0000, 0.00, 'INACTIVE', true, false, false, 1, 1, 1, 1),
  ('client-2388cad3', '2388cad3', '2388cad3', '2388cad3', '2388cad3-9815-456c-b938-4875499a4f8d', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT5', '2024-07-16', 'GH', 0.0000, 0.0000, 0.00, 'INACTIVE', true, false, false, 1, 1, 1, 1),
  ('client-dd3c5860', 'dd3c5860', 'dd3c5860', 'dd3c5860', 'dd3c5860-0eb0-4c6e-a165-5319b083e214', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT5', '2024-03-22', 'GH', 0.0000, 0.0000, 0.00, 'INACTIVE', true, false, false, 1, 1, 1, 1),
  ('client-2d0326bb', '2d0326bb', '2d0326bb', '2d0326bb', '2d0326bb-3f13-4cc7-993f-1c17b279b3fe', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT5', '2024-03-07', 'GH', 0.0000, 0.0000, 0.00, 'INACTIVE', false, false, false, 1, 1, 1, 1),
  ('client-fe7ab27e', 'fe7ab27e', 'fe7ab27e', 'fe7ab27e', 'fe7ab27e-6c55-4c2e-b8a7-d9ba9acf2db9', '1064144938140187556', 'qgcrue4rqj', 'Standard', 'MT5', '2023-10-02', 'GH', 0.0000, 0.0000, 0.00, 'INACTIVE', false, false, false, 1, 1, 1, 1)
ON CONFLICT (id) DO UPDATE SET
  client_account_id = EXCLUDED.client_account_id,
  client_id = EXCLUDED.client_id,
  trading_account_id = EXCLUDED.trading_account_id,
  volume_lots = EXCLUDED.volume_lots,
  reward_usd = EXCLUDED.reward_usd,
  client_status = EXCLUDED.client_status,
  synced_at = NOW();

-- -----------------------------------------------------------------------------
-- 10. SEED INITIAL STUDENTS, COURSES, SIGNALS & LIVE SESSIONS
-- -----------------------------------------------------------------------------
INSERT INTO public.students (
  id, full_name, country, email, has_exness_account, exness_id, exness_email,
  exness_client_uid, partner_code, partner_linked, partner_linked_at,
  deposit_amount, deposit_verified, deposit_verified_at, volume_lots, reward_usd,
  kyc_passed, ftd_received, ticket_status, tier
)
VALUES
  ('std-1', 'Ama Mensah', 'Ghana', 'ama@example.com', true, '173174690', 'ama@example.com', 'c117236d-2944-475a-8687-f066c59c0cb1', 'qgcrue4rqj', true, '2026-10-14T09:30:00Z', 150.00, true, '2026-10-14T11:20:00Z', 114.2500, 247.47, true, true, 'verified', 'funded_student'),
  ('std-2', 'Kofi Owusu', 'Ghana', 'kofi@example.com', true, '171192597', 'kofi@example.com', 'd8e89780-4757-46b6-a677-fc79293d25ec', 'qgcrue4rqj', true, '2026-10-15T14:10:00Z', 85.00, true, '2026-10-15T16:00:00Z', 101.9700, 343.25, true, true, 'verified', 'funded_student'),
  ('std-3', 'Yaw Asante', 'Ghana', 'yaw@example.com', true, '410934771', 'yaw@example.com', 'bcbe5865-ab11-47c2-b4c6-2bbf97dce90c', 'qgcrue4rqj', true, '2026-10-18T08:15:00Z', 32.00, false, NULL, 0.3940, 1.26, false, true, 'none', 'free_month'),
  ('std-4', 'Esi Boateng', 'Nigeria', 'esi@example.com', false, '', '', '476ab026-c7cf-4b60-9732-9c62c252f68d', 'qgcrue4rqj', false, NULL, 0.00, false, NULL, 0.0000, 0.00, true, false, 'none', 'free_month'),
  ('std-5', 'Nana Adjei', 'Kenya', 'nana@example.com', true, '59788363', 'nana@example.com', 'eebe9eb9-cbf1-45e8-9f29-1721a49c0e6c', 'qgcrue4rqj', true, '2026-10-12T16:20:00Z', 250.00, true, '2026-10-12T17:00:00Z', 280.0100, 1149.83, true, true, 'verified', 'mentorship')
ON CONFLICT (id) DO UPDATE SET
  exness_id = EXCLUDED.exness_id,
  exness_client_uid = EXCLUDED.exness_client_uid;

INSERT INTO public.courses (id, title, level, lessons_count, color, description, min_deposit_required)
VALUES
  ('forex-foundations', 'Forex Foundations', 'Beginner', 12, 'gold', 'Build practical market skill through clear, guided lessons and examples.', 50.00),
  ('technical-analysis', 'Technical Analysis', 'Intermediate', 16, 'blue', 'Master market structure, liquidity sweeps, and high-probability candlestick setups.', 50.00),
  ('risk-psychology', 'Risk & Psychology', 'Essential', 9, 'violet', 'Protect your capital with institutional position sizing and trading discipline.', 50.00),
  ('price-action', 'Advanced Price Action', 'Advanced', 14, 'green', 'Execute multi-timeframe entries during London and New York session overlaps.', 50.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.signals (id, pair, direction, status, entry_price, stop_loss, take_profit, risk_reward, commentary)
VALUES
  ('gbp-usd', 'GBP / USD', 'BUY', 'ACTIVE', '1.2674', '1.2620', '1.2740', '1 : 2.4', 'Price swept the London low before reclaiming four-hour demand. Clean bullish shift with momentum supporting continuation.'),
  ('xau-usd', 'XAU / USD', 'SELL', 'HIT TP', '2,341.20', '2,352.00', '2,326.50', '1 : 2.8', 'Rejection from NY session supply zone following CPI volatility spike.'),
  ('eur-usd', 'EUR / USD', 'BUY', 'CLOSED', '1.0784', '1.0740', '1.0860', '1 : 2.2', 'Higher-timeframe order block retest with 15m bullish engulfing confirmation.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.live_sessions (id, title, description, session_type, scheduled_at, duration_minutes, registered_count)
VALUES
  ('new-york', 'New York Session: Live Market Breakdown', 'Live analysis of EUR/USD, GBP/USD, and gold as New York opens.', 'live', 'Today, 2:00 PM GMT', 90, 124),
  ('risk-clinic', 'Risk Clinic: Protecting Your Capital', 'Practical live workshop with questions, examples, and guided analysis.', 'upcoming', 'Wed, 21 Oct · 6:00 PM GMT', 60, 88),
  ('weekly-outlook', 'Weekly Outlook & Key Levels', 'Preparing the weekly trading plan and marking institutional liquidity zones.', 'upcoming', 'Sun, 25 Oct · 6:00 PM GMT', 90, 142)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exness_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exness_partner_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'students', 'exness_verifications', 'exness_partner_clients', 'support_tickets',
    'courses', 'lessons', 'student_progress', 'signals', 'live_sessions',
    'student_trades', 'payments'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow full access on %I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "Allow full access on %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END
$$;
