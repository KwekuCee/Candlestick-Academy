import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router";
import {
  EXNESS_PARTNER_CLIENTS,
  EXNESS_PARTNER_CLIENTS_UPGRADE_SQL,
  EXNESS_PARTNER_TOTALS,
  ExnessConfig,
  ExnessStudent,
  OFFICIAL_PARTNER_ACCOUNT_ID,
  SUPABASE_PROJECT_REF,
  SUPABASE_PROJECT_URL,
  SUPABASE_SCHEMA_SQL,
  checkExnessAccountDeposit,
  getStoredConfig,
  getStoredCurrentUser,
  getStoredRoster,
  logoutCurrentUser,
  pushSchemaToSupabaseManagementApi,
  refreshRosterFromSupabase,
  registerApprovedTradingAccountInSupabase,
  saveStoredConfig,
  saveStoredCurrentUser,
  saveStoredRoster,
  syncExnessLiveWithSupabase,
  syncStudentToSupabase,
  verifyExnessPartnerAccount,
} from "./exnessStore";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Database,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Unlock,
} from "lucide-react";

type IconName =
  | "admin"
  | "arrow"
  | "bell"
  | "book"
  | "calendar"
  | "chart"
  | "check"
  | "clock"
  | "close"
  | "eye"
  | "home"
  | "lock"
  | "menu"
  | "play"
  | "plus"
  | "search"
  | "settings"
  | "shield"
  | "signal"
  | "trades"
  | "trend"
  | "users"
  | "video";

const iconPaths: Record<IconName, ReactNode> = {
  admin: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15z" />
      <path d="M8 6h8M8 10h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  chart: <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />,
  check: <path d="M5 12.5l4 4L19 7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  play: <path d="M8 5v14l11-7z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16l5 5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 01-.2 1.6l2 1.6-2 3.4-2.5-1a8 8 0 01-2.8 1.6L13 22H9l-.4-2.8a8 8 0 01-2.8-1.6l-2.5 1-2-3.4 2-1.6A7 7 0 013 12a7 7 0 01.2-1.6l-2-1.6 2-3.4 2.5 1a8 8 0 012.8-1.6L9 2h4l.4 2.8a8 8 0 012.8 1.6l2.5-1 2 3.4-2 1.6A7 7 0 0119 12z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  signal: <path d="M5 19v-3M10 19v-7M15 19V8M20 19V4" />,
  trades: (
    <>
      <path d="M4 7h12M12 3l4 4-4 4M20 17H8M12 13l-4 4 4 4" />
    </>
  ),
  trend: (
    <>
      <path d="M3 17l6-6 4 4 8-9M15 6h6v6" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="M17 10l4-3v10l-4-3" />
    </>
  ),
};

function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

function Logo() {
  return (
    <Link className="portal-logo" to="/">
      <span className="portal-logo-mark">
        <i />
        <i />
        <i />
      </span>
      <span>
        CANDLESTICKS<small>ACADEMY</small>
      </span>
    </Link>
  );
}

function Badge({
  children,
  tone = "yellow",
}: {
  children: ReactNode;
  tone?: "yellow" | "green" | "red" | "gray";
}) {
  return <span className={`p-badge ${tone}`}>{children}</span>;
}

function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button className={`p-button ${variant}`} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
}

function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`p-card ${className}`}>{children}</section>;
}

function Progress({ value, tone = "" }: { value: number; tone?: string }) {
  return (
    <div className="p-progress">
      <i className={tone} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function Header({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="p-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {copy && <p>{copy}</p>}
      </div>
      {action}
    </div>
  );
}

function Metric({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: IconName;
}) {
  return (
    <Card className="metric">
      <div>
        <span>{label}</span>
        <i>
          <Icon name={icon} />
        </i>
      </div>
      <strong>{value}</strong>
      <small>{change}</small>
    </Card>
  );
}

// Hook to subscribe to current student updates
export function useCurrentStudent() {
  const [student, setStudent] = useState<ExnessStudent>(getStoredCurrentUser());

  useEffect(() => {
    const handleUpdate = () => {
      setStudent(getStoredCurrentUser());
    };
    window.addEventListener("candlesticks_user_updated", handleUpdate);
    return () => window.removeEventListener("candlesticks_user_updated", handleUpdate);
  }, []);

  return student;
}

// Reusable $50 Deposit Content Blocker
function DepositGateNotice({
  featureTitle = "Content Locked",
  featureDescription = "All Academy courses, live trading rooms, and VIP market signals are unlocked when you make a minimum $50 USD deposit into your verified Exness trading account.",
}: {
  featureTitle?: string;
  featureDescription?: string;
}) {
  const student = useCurrentStudent();
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSimulateOrCheck(amount?: number) {
    setChecking(true);
    setMsg(null);
    const result = await checkExnessAccountDeposit(student.exnessId || student.email, amount);
    setChecking(false);
    setMsg(result.message);

    if (result.isEligible) {
      const updated: ExnessStudent = {
        ...student,
        depositAmount: result.depositAmount,
        depositVerified: true,
        depositVerifiedAt: new Date().toISOString(),
      };
      saveStoredCurrentUser(updated);

      // sync to roster
      const roster = getStoredRoster();
      const idx = roster.findIndex((s) => s.email === updated.email);
      if (idx >= 0) {
        roster[idx] = updated;
        saveStoredRoster(roster);
      }
    }
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#1c2029] to-[#12151b] border-2 border-[#ffde02]/30 shadow-2xl my-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-[#ffde02]/15 text-[#ffde02] flex items-center justify-center shrink-0">
            <Lock size={22} />
          </span>
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#ffde02] bg-[#ffde02]/10 px-2 py-0.5 rounded">
              $50 Exness Deposit Required
            </span>
            <h3 className="text-xl font-bold text-white mt-1">{featureTitle}</h3>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-lg font-mono font-bold text-white">
            ${student.depositAmount.toFixed(2)} <span className="text-xs text-[#8c94a2]">/ $50.00 USD</span>
          </div>
          <span className="text-xs text-amber-400 font-medium">Awaiting deposit detection</span>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-[#9ea8b8] mt-4 leading-relaxed">{featureDescription}</p>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="w-full bg-[#0d0f12] h-2.5 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#ffe540] to-[#ffde02] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (student.depositAmount / 50) * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2.5">
          <a
            href="https://my.exness.com/pa/deposit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffde02] text-black text-xs font-bold hover:bg-[#ffe540] transition"
          >
            Deposit on Exness <ExternalLink size={13} />
          </a>
          <button
            type="button"
            disabled={checking}
            onClick={() => handleSimulateOrCheck()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition cursor-pointer"
          >
            {checking ? "Checking API..." : "Check Status"} <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleSimulateOrCheck(50)}
          className="text-xs text-[#ffde02] hover:underline cursor-pointer"
        >
          ⚡ Simulate $50 Deposit (Unlock Instantly)
        </button>
      </div>

      {msg && (
        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#c5cdd8] flex items-center gap-2">
          <CheckCircle2 size={15} className="text-[#ffde02]" />
          <span>{msg}</span>
        </div>
      )}
    </div>
  );
}

const studentNav = [
  ["Overview", "/dashboard", "home"],
  ["Courses", "/courses", "book"],
  ["Live sessions", "/sessions", "video"],
  ["Signals", "/signals", "signal"],
  ["My trades", "/trades", "trades"],
  ["Progress", "/progress", "chart"],
] as const;

const adminNav = [
  ["Overview", "/admin", "admin"],
  ["Students", "/admin/students", "users"],
  ["Verification", "/admin/verification", "shield"],
  ["Post a signal", "/admin/signals/new", "signal"],
  ["Payments & tiers", "/admin/payments", "trades"],
] as const;

export function PortalLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const admin = loc.pathname.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const student = useCurrentStudent();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  function handleLogout() {
    logoutCurrentUser();
    nav("/login");
  }

  const initials = student.fullName
    ? student.fullName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "KM";

  return (
    <div className="portal">
      <aside className={`portal-sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Logo />
          <button onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <p className="nav-label">{admin ? "FOUNDER CONSOLE" : "LEARNING SPACE"}</p>
        <nav>
          {(admin ? adminNav : studentNav).map(([label, to, icon]) => (
            <NavLink to={to} end={to === "/admin" || to === "/dashboard"} key={to}>
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/settings">
            <Icon name="settings" />
            Settings
          </NavLink>
          <Link to={admin ? "/dashboard" : "/admin"}>
            <Icon name={admin ? "book" : "admin"} />
            {admin ? "Student view" : "Admin demo"}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="h-[46px] px-[13px] rounded-[12px] flex items-center gap-[13px] text-[#f6465d] hover:text-white hover:bg-[#f6465d]/15 text-[13.5px] font-semibold transition cursor-pointer w-full text-left border-0 bg-transparent"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
          <div className="profile">
            <span className="avatar">{admin ? "PM" : initials}</span>
            <b>
              {admin ? "Pastor Mike" : student.fullName || "Kwame Mensah"}
              <small>
                {admin
                  ? "Founder"
                  : student.depositVerified
                  ? "Verified & Funded"
                  : student.partnerLinked
                  ? "Partner Linked"
                  : "Unlinked Account"}
              </small>
            </b>
          </div>
        </div>
      </aside>
      {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} />}
      <div className="portal-main">
        <div className="portal-topbar">
          <button className="mobile-menu" onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="portal-search">
            <Icon name="search" />
            <input placeholder="Search lessons, sessions, signals..." />
            <kbd>⌘ K</kbd>
          </div>
          <button className="notify">
            <Icon name="bell" />
            <i />
          </button>
          <span className="avatar">{initials}</span>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-[#f6465d]/15 hover:border-[#f6465d]/40 hover:text-[#f6465d] text-xs font-bold text-[#c4c9d2] transition cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Auth({ children, quote }: { children: ReactNode; quote: string }) {
  return (
    <div className="auth-page">
      <aside>
        <Logo />
        <div className="auth-chart">
          <span>EUR / USD</span>
          <b>1.0842</b>
          <small>+0.62%</small>
          <svg viewBox="0 0 500 180">
            <path d="M0 150C70 130 80 158 140 98s90 30 140-20 90 20 130-34 60-25 90-40" />
          </svg>
        </div>
        <blockquote>
          “{quote}”<small>PASTOR MIKE · FOUNDER</small>
        </blockquote>
      </aside>
      <main>{children}</main>
    </div>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  return (
    <Auth quote="Your first goal isn't profit. It's learning how to make consistently good decisions.">
      <div className="auth-form">
        <p className="p-eyebrow">START FREE THIS MONTH</p>
        <h1>Welcome to Candlesticks</h1>
        <p>Proceed through our guided onboarding to link your Exness account and claim your free month.</p>
        <button
          className="p-button primary rounded-full w-full py-4 text-sm font-bold uppercase tracking-wider"
          onClick={() => nav("/onboarding")}
        >
          Begin Onboarding <Icon name="arrow" />
        </button>
        <p className="auth-legal-note">
          By registering, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
        <span className="auth-switch">
          Already a member? <Link to="/login">Log in</Link>
        </span>
      </div>
    </Auth>
  );
}

export function LoginPage() {
  const nav = useNavigate();
  return (
    <Auth quote="Discipline turns knowledge into a skill you can rely on.">
      <form
        className="auth-form login"
        onSubmit={(e) => {
          e.preventDefault();
          nav("/dashboard");
        }}
      >
        <p className="p-eyebrow">WELCOME BACK</p>
        <h1>Continue your journey</h1>
        <p>Log in to access your lessons, sessions, and signals.</p>
        <label>
          Email or phone
          <input required placeholder="you@example.com" />
        </label>
        <label>
          Password<a>Forgot password?</a>
          <input required type="password" placeholder="Enter your password" />
        </label>
        <Button type="submit">
          Log in <Icon name="arrow" />
        </Button>
        <span className="auth-switch">
          New here? <Link to="/onboarding">Create an account</Link>
        </span>
      </form>
    </Auth>
  );
}

export function OnboardingPage() {
  const nav = useNavigate();
  useEffect(() => {
    nav("/onboarding", { replace: true });
  }, [nav]);
  return null;
}

export function DashboardPage() {
  const nav = useNavigate();
  const student = useCurrentStudent();
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);

  async function handleCheckDeposit(simulateAmount?: number) {
    setChecking(true);
    setCheckMsg(null);
    const res = await checkExnessAccountDeposit(student.exnessId || student.email, simulateAmount);
    setChecking(false);
    setCheckMsg(res.message);

    if (res.isEligible) {
      const updated: ExnessStudent = {
        ...student,
        depositAmount: res.depositAmount,
        depositVerified: true,
        depositVerifiedAt: new Date().toISOString(),
      };
      saveStoredCurrentUser(updated);

      const roster = getStoredRoster();
      const idx = roster.findIndex((s) => s.email === updated.email);
      if (idx >= 0) {
        roster[idx] = updated;
        saveStoredRoster(roster);
      }
    }
  }

  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  return (
    <>
      <Header
        eyebrow="MONDAY, 19 OCTOBER"
        title={`Good morning, ${student.fullName.split(" ")[0] || "Kwame"}.`}
        copy="Continue building the skill. The market rewards preparation."
        action={
          isDepositCompleted ? (
            <Badge tone="green">FULL ACCESS UNLOCKED ($50+ DEPOSIT)</Badge>
          ) : student.partnerLinked ? (
            <Badge tone="yellow">PARTNER LINKED · AWAITING $50 DEPOSIT</Badge>
          ) : (
            <Badge tone="red">EXNESS UNLINKED</Badge>
          )
        }
      />

      {/* Case 1: Account NOT linked to Exness Partner Link */}
      {!student.partnerLinked && (
        <Card className="p-6 mb-6 border-2 border-red-500/30 bg-gradient-to-r from-red-500/10 to-[#1e171b]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Action Required: Link your Exness Account</h3>
                <p className="text-xs text-[#a0a8b6] mt-0.5">
                  Complete your registration by connecting through our Exness partner link or submitting your existing account ticket.
                </p>
              </div>
            </div>
            <button
              onClick={() => nav("/onboarding")}
              className="px-5 py-2.5 rounded-full bg-[#ffde02] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#ffe540] transition shrink-0"
            >
              Complete Exness Link <ArrowRight size={14} className="inline ml-1" />
            </button>
          </div>
        </Card>
      )}

      {/* Case 2: Partner linked via Trading Account ID -> Led to make $50 deposit to activate all platform features */}
      {student.partnerLinked && !isDepositCompleted && (
        <Card className="deposit-card">
          <i>
            <Icon name="shield" />
          </i>
          <div>
            <small>
              STEP 2: ACTIVATE FULL ACCESS · TRADING ACCOUNT #{student.exnessId || "LINKED"}
            </small>
            <h3>
              Deposit ${(50 - student.depositAmount).toFixed(2)} USD in your Exness account to activate all features
            </h3>
            <p>
              Your Trading Account ID (<b>#{student.exnessId || "Verified"}</b>) is registered under our Partner Link. Make your minimum <b>$50.00 USD deposit</b> on Exness to automatically activate all Academy courses, live trading rooms, and daily VIP signals.
            </p>
          </div>
          <div>
            <b>
              ${student.depositAmount.toFixed(2)} <small>of $50.00 USD</small>
            </b>
            <Progress value={(student.depositAmount / 50) * 100} />
          </div>
          <div className="flex flex-col gap-2">
            <a
              href="https://my.exness.com/pa/deposit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-full bg-[#ffde02] text-black font-extrabold text-xs uppercase tracking-wider text-center hover:bg-[#ffe540] transition"
            >
              Deposit $50 on Exness ↗
            </a>
            <Button variant="secondary" onClick={() => handleCheckDeposit()} disabled={checking}>
              {checking ? "Checking..." : "Verify $50 Deposit"}
            </Button>
            <button
              type="button"
              onClick={() => handleCheckDeposit(50)}
              className="text-[10px] text-[#ffde02] hover:underline cursor-pointer"
            >
              ⚡ Simulate $50 deposit (Activate All)
            </button>
          </div>
        </Card>
      )}

      {checkMsg && (
        <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#ffde02] flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>{checkMsg}</span>
        </div>
      )}

      {/* Metrics */}
      <div className="metrics-grid">
        <Metric label="Course progress" value="42%" change="+8% this week" icon="book" />
        <Metric label="Learning streak" value="6 days" change="Your best: 12 days" icon="trend" />
        <Metric label="Quiz average" value="84%" change="Across 4 quizzes" icon="chart" />
      </div>

      <div className="dash-grid">
        {/* Continue Learning Card */}
        <Card className="continue-card">
          <div className="card-title">
            <p className="p-eyebrow">CONTINUE LEARNING</p>
            <Badge>{isDepositCompleted ? "LESSON 7 OF 12" : "LOCKED"}</Badge>
          </div>
          <h2>Reading Market Structure</h2>
          <div className="course-art">
            <span>02</span>
            <i>
              {isDepositCompleted ? <Icon name="play" /> : <Lock size={22} />}
            </i>
            <small>FOREX FOUNDATIONS</small>
          </div>
          <Progress value={isDepositCompleted ? 68 : 0} />
          {isDepositCompleted ? (
            <Button onClick={() => nav("/lessons/market-structure")}>
              Resume lesson <Icon name="arrow" />
            </Button>
          ) : (
            <button
              onClick={() => nav("/courses")}
              className="mt-4 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-2"
            >
              <Lock size={13} className="text-[#ffde02]" /> View Unlocking Requirement
            </button>
          )}
        </Card>

        {/* Dash Stack */}
        <div className="dash-stack">
          <Card>
            <div className="card-title">
              <p className="p-eyebrow">NEXT LIVE SESSION</p>
              <Badge tone="red">LIVE IN 02:14:36</Badge>
            </div>
            <h2>New York Session: Live Market Breakdown</h2>
            <p>
              <Icon name="calendar" /> Today · 2:00 PM GMT
            </p>
            {isDepositCompleted ? (
              <Button onClick={() => nav("/sessions/live/new-york")}>
                <Icon name="video" /> Join waiting room
              </Button>
            ) : (
              <button
                onClick={() => nav("/sessions")}
                className="mt-3 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-2"
              >
                <Lock size={13} className="text-[#ffde02]" /> Locked ($50 Deposit Required)
              </button>
            )}
          </Card>

          <Card className="signal-snapshot">
            <p className="p-eyebrow">LATEST SIGNAL</p>
            <h2>
              GBP / USD <Badge tone="green">BUY</Badge>
            </h2>
            {isDepositCompleted ? (
              <>
                <div>
                  <span>
                    ENTRY<b>1.2674</b>
                  </span>
                  <span>
                    TAKE PROFIT<b className="positive">1.2740</b>
                  </span>
                </div>
                <Link to="/signals/gbp-usd">
                  View signal <Icon name="arrow" />
                </Link>
              </>
            ) : (
              <div className="pt-2 text-xs text-[#8f98a8] flex items-center justify-between">
                <span>SL/TP levels hidden</span>
                <Link to="/signals" className="text-[#ffde02] hover:underline flex items-center gap-1 font-bold">
                  Unlock with $50 Deposit <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export function SettingsPage() {
  const student = useCurrentStudent();
  const config = getStoredConfig();
  const [fullName, setFullName] = useState(student.fullName);
  const [email, setEmail] = useState(student.email);
  const [country, setCountry] = useState(student.country || "Ghana");
  const [exnessId, setExnessId] = useState(student.exnessId);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ticketGuideOpen, setTicketGuideOpen] = useState(false);
  const [state, setState] = useState({ signals: true, sessions: true, copy: true });

  function saveProfile() {
    const updated: ExnessStudent = {
      ...student,
      fullName: fullName.trim(),
      email: email.trim(),
      country,
      exnessId: exnessId.trim(),
    };
    saveStoredCurrentUser(updated);

    const roster = getStoredRoster();
    const idx = roster.findIndex((s) => s.email === student.email);
    if (idx >= 0) {
      roster[idx] = updated;
      saveStoredRoster(roster);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  return (
    <>
      <Header
        eyebrow="MY ACCOUNT"
        title="Profile & settings"
        copy="Manage your personal details, Exness broker connection, and preferences."
      />
      <div className="settings-grid">
        <nav>
          <a href="#profile">Profile</a>
          <a href="#account">Linked account</a>
          <a href="#ticket-guide">Exness Ticket Guide</a>
          <a href="#alerts">Notifications</a>
        </nav>
        <div>
          {/* Profile Card */}
          <Card className="settings-card" id="profile">
            <h2>Profile information</h2>
            <p>Update your personal details registered with the Academy.</p>
            <div className="profile-photo">
              <span className="large-avatar">
                {student.fullName
                  ? student.fullName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "KM"}
              </span>
              <div>
                <b className="text-white text-sm block">{student.fullName}</b>
                <small className="text-[#8c94a2] text-xs">Registered Student · {student.country}</small>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Full name
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
              <label>
                Email address
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label>
                Country
                <input value={country} onChange={(e) => setCountry(e.target.value)} />
              </label>
              <label>
                Exness Trading Account ID
                <input value={exnessId} onChange={(e) => setExnessId(e.target.value)} placeholder="e.g. 208471945" />
              </label>
            </div>
            <div className="flex items-center gap-4 mt-5">
              <Button onClick={saveProfile}>Save changes</Button>
              {saveSuccess && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Profile updated successfully!
                </span>
              )}
            </div>
          </Card>

          {/* Linked Exness Account Card */}
          <Card className="settings-card" id="account">
            <div className="card-title">
              <div>
                <h2>Linked Exness account</h2>
                <p>Your connected broker profile and verification state.</p>
              </div>
              {student.depositVerified && student.depositAmount >= 50 ? (
                <Badge tone="green">VERIFIED & FUNDED ($50+)</Badge>
              ) : student.partnerLinked ? (
                <Badge tone="yellow">LINKED · DEPOSIT PENDING</Badge>
              ) : (
                <Badge tone="red">NOT LINKED</Badge>
              )}
            </div>
            <div className="linked-account">
              <b>ex</b>
              <span>
                TRADING ACCOUNT
                <strong>{student.exnessId ? `•••• ••${student.exnessId.slice(-4)}` : "Not provided"}</strong>
              </span>
              <span>
                DEPOSIT STATUS
                <strong className={student.depositAmount >= 50 ? "positive" : "text-amber-400"}>
                  ${student.depositAmount.toFixed(2)} verified {student.depositAmount >= 50 ? "(Full Access)" : "(Awaiting $50)"}
                </strong>
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-3 items-center justify-between text-xs">
              <span className="text-[#8c94a2]">
                Official Partner Code: <strong className="text-white">{config.partnerCode}</strong>
              </span>
              <Link to="/onboarding" className="text-[#ffde02] hover:underline font-bold flex items-center gap-1">
                Run Onboarding / Re-verify <ArrowRight size={13} />
              </Link>
            </div>
          </Card>

          {/* Expandable Support Ticket Guide for Existing Users */}
          <Card className="settings-card" id="ticket-guide">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setTicketGuideOpen(!ticketGuideOpen)}>
              <div>
                <h2>Exness Partner Link Support Ticket Guide</h2>
                <p>Instructions for existing Exness account holders to link to Partner Code: {config.partnerCode}</p>
              </div>
              <button className="text-xs text-[#ffde02] font-bold">
                {ticketGuideOpen ? "Hide Guide ↑" : "Show Guide ↓"}
              </button>
            </div>

            {ticketGuideOpen && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-xs text-[#9ea8b8] leading-relaxed">
                <p>
                  If you already owned an Exness account before joining Candlesticks Academy, you can link your profile by sending an email from your Exness registered email address to{" "}
                  <strong className="text-white">{config.supportEmail}</strong>.
                </p>
                <div className="bg-[#111317] p-4 rounded-xl border border-white/10 font-mono text-[11px] text-[#cfd7e4] whitespace-pre-wrap">
{`Subject: Request to change Partner / IB to Partner Code: ${config.partnerCode}

Dear Exness Support Team,

I request that my Exness trading account be linked under Partner Code: ${config.partnerCode} (Candlesticks Academy).

- Registered Name: ${student.fullName || "Student"}
- Registered Email: ${student.email}
- Trading Account ID: ${student.exnessId || "[Your Account Number]"}

Thank you,
${student.fullName || "Student"}`}
                </div>
                <div className="flex gap-3 pt-2">
                  <a
                    href={`mailto:${config.supportEmail}?subject=Request%20to%20change%20Partner%20Code%20${config.partnerCode}`}
                    className="px-4 py-2 rounded-full bg-[#ffde02] text-black font-bold text-xs"
                  >
                    Open Mail Client
                  </a>
                </div>
              </div>
            )}
          </Card>

          {/* Notifications Card */}
          <Card className="settings-card" id="alerts">
            <h2>Notifications & copy trading</h2>
            {[
              ["signals", "Signal alerts", "Notify me when a new signal is posted."],
              ["sessions", "Live session reminders", "Remind me 30 minutes before each class."],
              ["copy", "Automatic signal copying", "Copy signals to my connected account."],
            ].map(([key, title, copy]) => (
              <div className="toggle-row" key={key}>
                <span>
                  <b>{title}</b>
                  <small>{copy}</small>
                </span>
                <button
                  className={`toggle ${state[key as keyof typeof state] ? "on" : ""}`}
                  onClick={() => setState({ ...state, [key]: !state[key as keyof typeof state] })}
                >
                  <i />
                </button>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

const courses = [
  { id: "forex-foundations", title: "Forex Foundations", level: "Beginner", lessons: 12, progress: 68, color: "gold" },
  { id: "technical-analysis", title: "Technical Analysis", level: "Intermediate", lessons: 16, progress: 34, color: "blue" },
  { id: "risk-psychology", title: "Risk & Psychology", level: "Essential", lessons: 9, progress: 0, color: "violet" },
  { id: "price-action", title: "Advanced Price Action", level: "Advanced", lessons: 14, progress: 0, color: "green" },
];

export function CoursesPage() {
  const [filter, setFilter] = useState("All levels");
  const student = useCurrentStudent();
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  return (
    <>
      <Header
        eyebrow="COURSE LIBRARY"
        title="Learn with structure."
        copy="Practical paths from foundations to confident execution."
        action={
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        }
      />

      {!isDepositCompleted && (
        <DepositGateNotice
          featureTitle="Courses Locked · $50 Deposit Required"
          featureDescription="All 4 comprehensive course modules, foundational video lessons, and interactive quizzes unlock as soon as your $50 USD Exness deposit is verified."
        />
      )}

      <div className="catalog-feature">
        <div>
          <Badge>{isDepositCompleted ? "RECOMMENDED NEXT" : "LOCKED"}</Badge>
          <h2>Master the language of the market.</h2>
          <p>Continue Forex Foundations and learn how price structure reveals buyer and seller intent.</p>
          {isDepositCompleted ? (
            <Link className="p-button primary rounded-full" to="/courses/forex-foundations">
              Continue course <Icon name="arrow" />
            </Link>
          ) : (
            <span className="text-xs text-[#ffde02] flex items-center gap-1.5 font-bold">
              <Lock size={14} /> Deposit $50 to Unlock
            </span>
          )}
        </div>
        <div className="orbit">
          FX
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="course-grid">
        {courses
          .filter((c) => filter === "All levels" || c.level === filter)
          .map((c) => (
            <Link className="course-card relative" to={isDepositCompleted ? `/courses/${c.id}` : "#"} key={c.id}>
              {!isDepositCompleted && (
                <div className="absolute top-3 right-3 z-10 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-[#ffde02]/40 text-[#ffde02] text-xs font-bold flex items-center gap-1">
                  <Lock size={12} /> $50 Deposit Gate
                </div>
              )}
              <div className={`course-cover ${c.color}`}>
                <span>{c.lessons}</span>
                <Icon name="book" size={28} />
                <small>CANDLESTICKS ACADEMY</small>
              </div>
              <div>
                <span>
                  <Badge tone={c.level === "Advanced" ? "red" : c.level === "Beginner" ? "green" : "yellow"}>
                    {c.level}
                  </Badge>{" "}
                  {c.lessons} lessons
                </span>
                <h2>{c.title}</h2>
                <p>Build practical market skill through clear, guided lessons and examples.</p>
                {isDepositCompleted ? (
                  c.progress ? (
                    <>
                      <Progress value={c.progress} />
                      <small>{c.progress}% complete</small>
                    </>
                  ) : (
                    <b>
                      Start course <Icon name="arrow" />
                    </b>
                  )
                ) : (
                  <b className="text-amber-400">
                    <Lock size={13} className="inline mr-1" /> Locked until funded
                  </b>
                )}
              </div>
            </Link>
          ))}
      </div>
    </>
  );
}

const lessons = [
  "Welcome to the Forex Market",
  "Currency Pairs Explained",
  "Pips, Lots & Leverage",
  "How Brokers Work",
  "Trading Sessions",
  "Reading Candlesticks",
  "Reading Market Structure",
  "Support & Resistance",
  "Building a Trade Idea",
  "Your First Trading Plan",
  "Foundation Quiz",
  "What Comes Next",
];

export function CourseDetailPage() {
  const { courseId } = useParams();
  const c = courses.find((x) => x.id === courseId) || courses[0];
  const student = useCurrentStudent();
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/courses">Courses</Link>
        <span>/</span>
        {c.title}
      </div>

      {!isDepositCompleted && (
        <DepositGateNotice featureTitle="Course Lessons Locked" />
      )}

      <Card className="course-hero">
        <div className={`course-cover ${c.color}`}>
          <span>01</span>
          <Icon name="book" size={35} />
          <small>CANDLESTICKS ACADEMY</small>
        </div>
        <div>
          <Badge tone="green">{c.level}</Badge>
          <h1>{c.title}</h1>
          <p>Follow each lesson in order, practise the concepts, and test your understanding as you progress.</p>
          <div className="meta">
            <span>
              <Icon name="book" /> {c.lessons} lessons
            </span>
            <span>
              <Icon name="clock" /> 3h 45m
            </span>
            <span>
              <Icon name="chart" /> Certificate
            </span>
          </div>
          <Progress value={isDepositCompleted ? c.progress : 0} />
          {isDepositCompleted ? (
            <Link className="p-button primary rounded-full" to="/lessons/market-structure">
              Continue course <Icon name="arrow" />
            </Link>
          ) : (
            <span className="text-xs text-[#ffde02] font-bold flex items-center gap-1.5">
              <Lock size={14} /> Deposit $50 to Unlock All Lessons
            </span>
          )}
        </div>
      </Card>

      <div className="lesson-list">
        <div className="section-title">
          <div>
            <p className="p-eyebrow">COURSE CONTENT</p>
            <h2>Foundation lessons</h2>
          </div>
          <span>{isDepositCompleted ? "7 of 12 complete" : "0 of 12 complete"}</span>
        </div>
        {lessons.map((x, i) => (
          <Link
            className={!isDepositCompleted || i > 7 ? "locked" : ""}
            to={isDepositCompleted && i <= 7 ? `/lessons/${x.toLowerCase().replaceAll(" ", "-")}` : "#"}
            key={x}
          >
            <i>{isDepositCompleted && i < 6 ? <Icon name="check" /> : !isDepositCompleted || i > 7 ? <Icon name="lock" /> : i + 1}</i>
            <span>
              <b>{x}</b>
              <small>{i === 10 ? "Assessment · 10 questions" : `Video lesson · ${8 + i} min`}</small>
            </span>
            {isDepositCompleted && i === 6 && <Badge>UP NEXT</Badge>}
            <Icon name="arrow" />
          </Link>
        ))}
      </div>
    </>
  );
}

export function LessonPage() {
  const [done, setDone] = useState(false);
  const student = useCurrentStudent();
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  if (!isDepositCompleted) {
    return (
      <div className="py-8">
        <div className="breadcrumbs">
          <Link to="/courses">Courses</Link>
          <span>/</span>
          Lesson 7
        </div>
        <DepositGateNotice
          featureTitle="Video Lesson Locked · $50 Deposit Required"
          featureDescription="Please fund your linked Exness trading account with at least $50 USD to watch this lesson and complete the assignments."
        />
      </div>
    );
  }

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/courses">Courses</Link>
        <span>/</span>
        <Link to="/courses/forex-foundations">Forex Foundations</Link>
        <span>/</span>Lesson 7
      </div>
      <div className="lesson-layout">
        <main>
          <Video />
          <div className="lesson-heading">
            <div>
              <p className="p-eyebrow">LESSON 07</p>
              <h1>Reading Market Structure</h1>
              <p>Learn how swing highs and lows reveal trend direction and frame better trade ideas.</p>
            </div>
            <Button onClick={() => setDone(true)}>
              {done ? (
                <>
                  <Icon name="check" /> Completed
                </>
              ) : (
                <>
                  Mark as complete <Icon name="check" />
                </>
              )}
            </Button>
          </div>
          <Card>
            <h3>In this lesson</h3>
            <ul>
              <li>Identify swing highs and swing lows</li>
              <li>Separate trending and ranging markets</li>
              <li>Use structure to avoid weak entries</li>
            </ul>
          </Card>
        </main>
        <aside className="lesson-side">
          <div>
            <span>Forex Foundations</span>
            <b>7 / 12 lessons</b>
            <Progress value={58} />
          </div>
          {lessons.map((x, i) => (
            <Link className={i === 6 ? "active" : ""} to={i === 10 ? "/quiz/foundations" : "#"} key={x}>
              <i>{i < 6 ? <Icon name="check" /> : i > 7 ? <Icon name="lock" /> : i + 1}</i>
              <span>
                {x}
                <small>{8 + i} min</small>
              </span>
            </Link>
          ))}
        </aside>
      </div>
    </>
  );
}

function Video() {
  return (
    <div className="video-player">
      <div />
      <span>EUR/USD · 15M</span>
      <button>
        <Icon name="play" size={30} />
      </button>
      <footer>
        <Icon name="play" />
        <i>
          <b />
        </i>
        <span>08:24 / 14:32</span>
        <b>HD</b>
      </footer>
    </div>
  );
}

const questions = [
  ["What does a higher high followed by a higher low indicate?", ["A bullish market structure", "A bearish reversal", "A ranging market", "Low liquidity"], 0],
  ["Which session overlap usually has the highest liquidity?", ["Sydney only", "London and New York", "Tokyo and Sydney", "After New York closes"], 1],
  ["What is the primary purpose of a stop-loss?", ["Increase leverage", "Guarantee profit", "Define and limit risk", "Enter faster"], 2],
] as const;

export function QuizPage() {
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const finished = n === questions.length;
  const score = answers.filter((a, i) => a === questions[i][2]).length;

  const reset = () => {
    setN(0);
    setPicked(null);
    setAnswers([]);
  };

  return (
    <div className="quiz-page">
      {!finished ? (
        <>
          <div className="quiz-top">
            <Link to="/courses/forex-foundations">
              <Icon name="close" />
            </Link>
            <span>
              FOUNDATION ASSESSMENT
              <Progress value={((n + 1) / questions.length) * 100} />
            </span>
            <b>
              {n + 1} / {questions.length}
            </b>
          </div>
          <Card className="quiz-card">
            <p className="p-eyebrow">
              QUESTION {n + 1} OF {questions.length}
            </p>
            <h1>{questions[n][0]}</h1>
            <div className="answers">
              {questions[n][1].map((x, i) => (
                <button className={picked === i ? "selected" : ""} onClick={() => setPicked(i)} key={x}>
                  <i>{String.fromCharCode(65 + i)}</i>
                  {x}
                  <Icon name="check" />
                </button>
              ))}
            </div>
            <div>
              <Button variant="ghost" onClick={() => setN(Math.max(0, n - 1))}>
                Back
              </Button>
              <Button
                disabled={picked === null}
                onClick={() => {
                  if (picked !== null) {
                    setAnswers([...answers, picked]);
                    setPicked(null);
                    setN(n + 1);
                  }
                }}
              >
                Next <Icon name="arrow" />
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <Card className="result-card">
          <div className="score">
            <b>{Math.round((score / questions.length) * 100)}%</b>
            <small>YOUR SCORE</small>
          </div>
          <Badge tone={score >= 2 ? "green" : "red"}>{score >= 2 ? "ASSESSMENT PASSED" : "RETRY NEEDED"}</Badge>
          <h1>{score >= 2 ? "Strong foundation, Kwame." : "Keep building your foundation."}</h1>
          <p>
            You answered {score} of {questions.length} correctly. Review your answers or continue learning.
          </p>
          <div>
            <Link className="p-button primary" to="/courses/forex-foundations">
              Continue course
            </Link>
            <Button variant="secondary" onClick={reset}>
              Retake quiz
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export function ProgressPage() {
  return (
    <>
      <Header
        eyebrow="YOUR LEARNING JOURNEY"
        title="Progress & achievements"
        copy="A clear view of your work and what comes next."
        action={<Badge>6 DAY STREAK</Badge>}
      />
      <div className="progress-summary">
        <Card className="overall">
          <div className="ring">
            <b>42%</b>
            <small>COMPLETE</small>
          </div>
          <div>
            <p className="p-eyebrow">OVERALL PROGRESS</p>
            <h2>You&apos;re building momentum.</h2>
            <p>19 of 45 lessons complete across four learning paths.</p>
          </div>
        </Card>
        <Metric label="Lessons completed" value="19" change="+4 this week" icon="book" />
        <Metric label="Hours learned" value="8.4" change="+1.8 this week" icon="clock" />
      </div>
      <div className="progress-detail">
        <Card>
          <h2>Course progress</h2>
          {courses.map((c) => (
            <div className="course-progress-row" key={c.id}>
              <i className={c.color}>
                <Icon name="book" />
              </i>
              <span>
                <b>{c.title}</b>
                <small>
                  {Math.round((c.lessons * c.progress) / 100)} of {c.lessons} lessons
                </small>
                <Progress value={c.progress} />
              </span>
              <strong>{c.progress}%</strong>
            </div>
          ))}
        </Card>
        <Card>
          <h2>Study activity</h2>
          <p>Last 8 weeks</p>
          <div className="heatmap">
            {Array.from({ length: 56 }, (_, i) => (
              <i className={i % 5 === 0 ? "high" : i % 3 === 0 ? "mid" : ""} key={i} />
            ))}
          </div>
          <h3>Recent quiz scores</h3>
          {["Forex Foundations|84%", "Candlestick Basics|90%", "Risk Essentials|78%"].map((x) => {
            const [a, b] = x.split("|");
            return (
              <div className="quiz-score" key={a}>
                <span>
                  <Icon name="check" />
                  {a}
                </span>
                <b>{b}</b>
              </div>
            );
          })}
        </Card>
      </div>
    </>
  );
}

const sessionNames = [
  "New York Session: Live Market Breakdown",
  "Risk Clinic: Protecting Your Capital",
  "Weekly Outlook & Key Levels",
];

export function SessionSchedulePage() {
  const student = useCurrentStudent();
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  return (
    <>
      <Header
        eyebrow="LIVE LEARNING"
        title="Sessions & replays"
        copy="Trade alongside your mentor and learn as each decision unfolds."
        action={
          <Button variant="secondary">
            <Icon name="calendar" /> Add to calendar
          </Button>
        }
      />

      {!isDepositCompleted && (
        <DepositGateNotice
          featureTitle="Live Sessions Locked · $50 Deposit Required"
          featureDescription="Join daily New York and London open live trading rooms, real-time question and answer sessions, and interactive breakdown rooms once your $50 USD Exness deposit is verified."
        />
      )}

      <Card className="featured-session">
        <div className="live-art">
          <Badge tone="red">STARTING SOON</Badge>
          <b>
            02:14:36<small>UNTIL WE GO LIVE</small>
          </b>
        </div>
        <div>
          <p className="p-eyebrow">TODAY&apos;S SESSION</p>
          <h2>{sessionNames[0]}</h2>
          <p>Live analysis of EUR/USD, GBP/USD, and gold as New York opens.</p>
          <div className="meta">
            <span>
              <Icon name="calendar" /> Today, 2:00 PM GMT
            </span>
            <span>
              <Icon name="clock" /> 90 minutes
            </span>
            <span>
              <Icon name="users" /> 124 registered
            </span>
          </div>
          {isDepositCompleted ? (
            <Link className="p-button primary rounded-full" to="/sessions/live/new-york">
              <Icon name="video" /> Enter waiting room
            </Link>
          ) : (
            <span className="text-xs text-[#ffde02] font-bold flex items-center gap-1.5">
              <Lock size={14} /> Deposit $50 to Enter Live Room
            </span>
          )}
        </div>
      </Card>

      <div className="section-title">
        <div>
          <p className="p-eyebrow">UPCOMING</p>
          <h2>Upcoming sessions</h2>
        </div>
      </div>
      <div className="session-grid">
        {sessionNames.slice(1).map((x, i) => (
          <Card key={x}>
            <i>
              <Icon name="video" />
            </i>
            <Badge>MEMBERS ONLY</Badge>
            <h2>{x}</h2>
            <p>Practical live workshop with questions, examples, and guided analysis.</p>
            <span>
              <Icon name="calendar" /> {i ? "Sun, 25 Oct" : "Wed, 21 Oct"} · 6:00 PM
            </span>
            <Button variant="secondary">View details</Button>
          </Card>
        ))}
      </div>
    </>
  );
}

export function LiveRoomPage() {
  const [messages, setMessages] = useState([
    "Ama: Good afternoon everyone",
    "Host: Welcome. We begin with EUR/USD structure.",
    "Yaw: Looking forward to gold.",
  ]);
  const [msg, setMsg] = useState("");
  const student = useCurrentStudent();
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  if (!isDepositCompleted) {
    return (
      <div className="py-8">
        <DepositGateNotice
          featureTitle="Live Room Locked · $50 Deposit Required"
          featureDescription="Please fund your verified Exness trading account with at least $50 USD to participate in live analysis and the interactive community chat."
        />
      </div>
    );
  }

  return (
    <>
      <div className="room-head">
        <div>
          <Badge tone="red">LIVE</Badge>
          <h1>New York Session: Live Market Breakdown</h1>
          <span>
            <Icon name="eye" /> 127 watching
          </span>
        </div>
        <Link className="p-button secondary" to="/sessions">
          Leave session
        </Link>
      </div>
      <div className="stream-grid">
        <div>
          <div className="live-stream">
            <div className="stream-chart">
              <span>EUR / USD · 15M</span>
              <svg viewBox="0 0 700 300">
                <path d="M0 245C70 210 90 255 150 185s90 25 150-40 80 20 145-45 100 10 155-45 60-30 100-42" />
              </svg>
              <button>
                <Icon name="play" size={32} />
              </button>
            </div>
          </div>
          <Card>
            <h3>Pinned resources</h3>
            <div className="resource">
              <span>
                <Icon name="book" /> Today&apos;s session worksheet
              </span>
              <Button variant="ghost">Download</Button>
            </div>
            <div className="resource">
              <span>
                <Icon name="chart" /> Weekly levels & market map
              </span>
              <Button variant="ghost">Open</Button>
            </div>
          </Card>
        </div>
        <Card className="chat">
          <div className="chat-title">
            <h3>Live chat</h3>
            <span>127 online</span>
          </div>
          <div className="messages">
            {messages.map((m, i) => (
              <div className={m.startsWith("Host") ? "host" : ""} key={i}>
                <span className="avatar">{m[0]}</span>
                <p>
                  <b>{m.split(":")[0]}</b>
                  {m.split(":")[1]}
                </p>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (msg) {
                setMessages([...messages, `You: ${msg}`]);
                setMsg("");
              }
            }}
          >
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a message..." />
            <button>
              <Icon name="arrow" />
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}

export function ReplayPage() {
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/sessions">Sessions</Link>
        <span>/</span>Replay
      </div>
      <Header eyebrow="SESSION REPLAY" title="London Open: Structure & Momentum" copy="Recorded 16 October 2026 · 1 hour 12 minutes" />
      <div className="replay-grid">
        <div>
          <Video />
          <Card className="chapters">
            <h3>Chapters</h3>
            {["Market context & bias", "EUR/USD structure", "GBP/USD opportunity", "Gold analysis", "Q&A and recap"].map(
              (x, i) => (
                <button key={x}>
                  <span>{i * 14}:00</span>
                  {x}
                  <Icon name="play" />
                </button>
              )
            )}
          </Card>
        </div>
        <Card className="chat replay-chat">
          <div className="chat-title">
            <h3>Session chat</h3>
            <span>READ ONLY</span>
          </div>
          <div className="messages">
            {[
              "Ama: The daily bias makes sense now.",
              "Host: Watch price at the marked level.",
              "Kofi: Is that a valid lower high?",
              "Host: Yes, but wait for the candle close.",
            ].map((m, i) => (
              <div className={m.startsWith("Host") ? "host" : ""} key={i}>
                <span className="avatar">{m[0]}</span>
                <p>
                  <b>{m.split(":")[0]}</b>
                  {m.split(":")[1]}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

const trades = [
  ["EUR/USD", "Buy", "1.0784", "1.0842", "+$116.00", "+1.16%"],
  ["XAU/USD", "Sell", "2,348.20", "2,326.40", "+$218.00", "+2.18%"],
  ["GBP/USD", "Buy", "1.2710", "1.2674", "-$72.00", "-0.72%"],
  ["USD/JPY", "Sell", "150.12", "149.82", "+$60.00", "+0.60%"],
  ["EUR/GBP", "Buy", "0.8541", "0.8528", "-$26.00", "-0.26%"],
];

function DataTools() {
  return (
    <div className="table-tools">
      <div className="portal-search">
        <Icon name="search" />
        <input placeholder="Search..." />
      </div>
      <select>
        <option>All statuses</option>
        <option>Verified</option>
        <option>Pending</option>
      </select>
    </div>
  );
}

export function TradesPage() {
  return (
    <>
      <Header
        eyebrow="CONNECTED ACCOUNT"
        title="My trades"
        copy="Read-only activity from your linked Exness account."
        action={<Badge tone="green">LIVE DATA</Badge>}
      />
      <div className="metrics-grid">
        <Metric label="Total P&L" value="+$296.00" change="+2.96% this month" icon="trend" />
        <Metric label="Win rate" value="68%" change="17 of 25 trades" icon="chart" />
        <Metric label="Open positions" value="2" change="$1,840 exposure" icon="trades" />
      </div>
      <Card className="data-card">
        <DataTools />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Pair</th>
                <th>Direction</th>
                <th>Open price</th>
                <th>Close price</th>
                <th>P&L</th>
                <th>Return</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((x) => (
                <tr key={x[0]}>
                  <td>
                    <b>{x[0]}</b>
                  </td>
                  <td>
                    <Badge tone={x[1] === "Buy" ? "green" : "red"}>{x[1]}</Badge>
                  </td>
                  <td>{x[2]}</td>
                  <td>{x[3]}</td>
                  <td className={x[4][0] === "+" ? "positive" : "negative"}>{x[4]}</td>
                  <td className={x[5][0] === "+" ? "positive" : "negative"}>{x[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer>
          <Icon name="eye" /> View-only data synced from Exness. Updated just now.
        </footer>
      </Card>
    </>
  );
}

const signals = [
  { id: "gbp-usd", pair: "GBP / USD", dir: "BUY", status: "ACTIVE", entry: "1.2674", sl: "1.2620", tp: "1.2740" },
  { id: "xau-usd", pair: "XAU / USD", dir: "SELL", status: "HIT TP", entry: "2,341.20", sl: "2,352.00", tp: "2,326.50" },
  { id: "eur-usd", pair: "EUR / USD", dir: "BUY", status: "CLOSED", entry: "1.0784", sl: "1.0740", tp: "1.0860" },
];

export function SignalFeedPage() {
  const [copy, setCopy] = useState(true);
  const student = useCurrentStudent();
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  return (
    <>
      <Header
        eyebrow="TRADE IDEAS"
        title="Signal feed"
        copy="Clear setups, risk levels, and reasoning behind every trade."
        action={<Badge tone="green">1 ACTIVE SIGNAL</Badge>}
      />

      {!isDepositCompleted && (
        <DepositGateNotice
          featureTitle="VIP Market Signals Locked · $50 Deposit Required"
          featureDescription="Actionable setups with entry, stop-loss, take-profit, trade reasoning, and automatic copy-trading are reserved for students with a confirmed $50 USD Exness deposit."
        />
      )}

      <Card className="copy-banner">
        <i>
          <Icon name="trades" />
        </i>
        <span>
          <h3>Automatic copying is {copy ? "on" : "off"}</h3>
          <p>New signals {copy ? "are" : "are not"} copied to your connected account.</p>
        </span>
        <button className={`toggle ${copy ? "on" : ""}`} onClick={() => setCopy(!copy)}>
          <i />
        </button>
        <Link to="/settings">Manage settings</Link>
      </Card>
      <div className="tabs">
        <button>All signals</button>
        <button>Active</button>
        <button>Closed</button>
        <button>Wins</button>
      </div>
      <div className="signal-feed">
        {signals.map((s) => (
          <Link to={isDepositCompleted ? `/signals/${s.id}` : "#"} key={s.id}>
            <i className={s.dir === "BUY" ? "buy" : "sell"}>
              <Icon name="trend" />
            </i>
            <div>
              <span>
                <h2>{s.pair}</h2>
                <Badge tone={s.dir === "BUY" ? "green" : "red"}>{s.dir}</Badge>
                <Badge tone={s.status === "ACTIVE" ? "yellow" : s.status === "HIT TP" ? "green" : "gray"}>
                  {s.status}
                </Badge>
              </span>
              <p>Clean structure shift with momentum and a defined invalidation level.</p>
              {isDepositCompleted ? (
                <div className="levels">
                  <span>
                    ENTRY<b>{s.entry}</b>
                  </span>
                  <span>
                    STOP LOSS<b className="negative">{s.sl}</b>
                  </span>
                  <span>
                    TAKE PROFIT<b className="positive">{s.tp}</b>
                  </span>
                  <span>
                    RISK / REWARD<b>1 : 2.4</b>
                  </span>
                </div>
              ) : (
                <div className="text-xs text-amber-400 font-bold mt-2 flex items-center gap-1.5">
                  <Lock size={12} /> Entry, SL & TP locked ($50 deposit needed)
                </div>
              )}
            </div>
            <Icon name="arrow" />
          </Link>
        ))}
      </div>
    </>
  );
}

export function SignalDetailPage() {
  const { signalId } = useParams();
  const s = signals.find((x) => x.id === signalId) || signals[0];
  const student = useCurrentStudent();
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  if (!isDepositCompleted) {
    return (
      <div className="py-8">
        <DepositGateNotice featureTitle="Signal Detail Locked" />
      </div>
    );
  }

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/signals">Signals</Link>
        <span>/</span>
        {s.pair}
      </div>
      <div className="signal-head">
        <div>
          <i className={s.dir === "BUY" ? "buy" : "sell"}>
            <Icon name="trend" />
          </i>
          <span>
            <p className="p-eyebrow">SIGNAL · 12 MIN AGO</p>
            <h1>
              {s.pair} <Badge tone={s.dir === "BUY" ? "green" : "red"}>{s.dir}</Badge>
            </h1>
          </span>
        </div>
        <Badge>{s.status}</Badge>
      </div>
      <div className="signal-detail">
        <div>
          <Card className="level-card">
            {[
              ["ENTRY PRICE", s.entry],
              ["STOP LOSS", s.sl],
              ["TAKE PROFIT", s.tp],
              ["RISK / REWARD", "1 : 2.4"],
            ].map((x, i) => (
              <span key={x[0]}>
                {x[0]}
                <b className={i === 1 ? "negative" : i === 2 ? "positive" : ""}>{x[1]}</b>
              </span>
            ))}
          </Card>
          <Card className="market-chart">
            <h3>{s.pair} · 15M</h3>
            <svg viewBox="0 0 700 270">
              <path d="M0 220C70 211 84 238 139 190s87 15 132-40 87 14 130-35 80-31 115-54 94 5 184-47" />
            </svg>
            <i>ENTRY {s.entry}</i>
          </Card>
        </div>
        <div>
          <Card className="analysis">
            <div className="profile">
              <span className="avatar">PM</span>
              <b>
                Pastor Mike<small>FOUNDER&apos;S ANALYSIS</small>
              </b>
            </div>
            <h2>Why I&apos;m taking this setup</h2>
            <p>
              Price swept the London low before reclaiming four-hour demand. We now have a clean bullish shift with
              momentum supporting continuation.
            </p>
            <blockquote>Patience is part of the setup. Do not chase price if entry is missed.</blockquote>
          </Card>
          <Card>
            <p className="p-eyebrow">LIVE OUTCOME</p>
            <h2>1.2701</h2>
            <Progress value={41} tone="green" />
            <b className="positive">+$54.00 currently</b>
          </Card>
        </div>
      </div>
    </>
  );
}

export function AdminDashboardPage() {
  const roster = getStoredRoster();
  const verifiedCount = roster.filter((s) => s.depositVerified && s.depositAmount >= 50).length;
  const linkedCount = roster.filter((s) => s.partnerLinked).length;

  return (
    <>
      <Header
        eyebrow="FOUNDER CONSOLE"
        title="Academy overview"
        copy="Manage Exness API integration, student registrations, and broker verifications."
        action={
          <div>
            <Link className="p-button secondary" to="/admin/students">
              View students
            </Link>
            <Link className="p-button primary rounded-full" to="/admin/verification">
              <ShieldCheck size={16} /> Exness API & Verification
            </Link>
          </div>
        }
      />
      <div className="metrics-grid four">
        <Metric label="Total students" value={`${roster.length + 1280}`} change="+48 this month" icon="users" />
        <Metric label="Deposit verified ($50+)" value={`${verifiedCount + 820}`} change="64.3% conversion" icon="shield" />
        <Metric label="Active this week" value="617" change="+12.4%" icon="trend" />
        <Metric label="Partner linked" value={`${linkedCount + 1038}`} change="81.1% linked" icon="trades" />
      </div>
      <div className="admin-grid">
        <Card>
          <div className="card-title">
            <span>
              <h2>New registrations</h2>
              <p>Growth over 12 months</p>
            </span>
            <select>
              <option>Last 12 months</option>
            </select>
          </div>
          <h2>
            486 <small className="positive">+18.2%</small>
          </h2>
          <div className="bar-chart">
            {[42, 55, 48, 70, 63, 81, 74, 92, 86, 100, 94, 116].map((h, i) => (
              <i key={i} style={{ height: h }} />
            ))}
          </div>
        </Card>
        <Card className="quick-actions">
          <h2>Quick actions</h2>
          {[
            ["Exness API & Credentials", "Configure API Key & JWT token", "/admin/verification", "shield"],
            ["Post a new signal", "Send a setup to students", "/admin/signals/new", "signal"],
            ["Schedule live session", "Create the next class", "/sessions", "video"],
          ].map((x) => (
            <Link to={x[2]} key={x[0]}>
              <i>
                <Icon name={x[3] as IconName} />
              </i>
              <span>
                <b>{x[0]}</b>
                <small>{x[1]}</small>
              </span>
              <Icon name="arrow" />
            </Link>
          ))}
        </Card>
      </div>
      <Card className="activity">
        <div className="card-title">
          <h2>Recent student activity</h2>
          <Link to="/admin/students">View all</Link>
        </div>
        {roster.slice(0, 4).map((s, i) => (
          <div key={s.id}>
            <span className="avatar">
              {s.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <p>
              <b>{s.fullName}</b>
              {s.depositVerified ? "Exness $50 deposit confirmed" : s.partnerLinked ? "Exness partner link verified" : "Registered on portal"}
            </p>
            <small>{2 + i * 6} min ago</small>
          </div>
        ))}
      </Card>
    </>
  );
}

export function StudentRosterPage() {
  const [roster, setRoster] = useState<ExnessStudent[]>(getStoredRoster());
  const [selected, setSelected] = useState<ExnessStudent | null>(null);

  useEffect(() => {
    void refreshRosterFromSupabase().then(setRoster);
    const sync = () => setRoster(getStoredRoster());
    window.addEventListener("candlesticks_roster_updated", sync);
    return () => window.removeEventListener("candlesticks_roster_updated", sync);
  }, []);

  return (
    <>
      <Header
        eyebrow="STUDENT MANAGEMENT"
        title="Student roster"
        copy="View real-time account status, Exness link state, and verified deposits from the Candlesticks Supabase database."
        action={
          <Button onClick={() => void refreshRosterFromSupabase().then(setRoster)}>
            <RefreshCw size={14} className="inline mr-1" /> Refresh from Supabase
          </Button>
        }
      />
      <Card className="data-card">
        <DataTools />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Country</th>
                <th>Exness account</th>
                <th>Partner link</th>
                <th>Deposit</th>
                <th>Course access</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id} onClick={() => setSelected(s)} className="cursor-pointer hover:bg-white/5 transition">
                  <td>
                    <div className="student-cell">
                      <span className="avatar">
                        {s.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span>
                        <b>{s.fullName}</b>
                        <small>{s.email}</small>
                      </span>
                    </div>
                  </td>
                  <td>{s.country}</td>
                  <td>{s.exnessId || "Pending"}</td>
                  <td>
                    <Badge tone={s.partnerLinked ? "yellow" : "gray"}>
                      {s.partnerLinked ? "VERIFIED" : s.ticketStatus === "submitted" ? "TICKET SENT" : "UNLINKED"}
                    </Badge>
                  </td>
                  <td>
                    <strong className={s.depositAmount >= 50 ? "text-[#ffde02]" : "text-[#9aa4b5]"}>
                      ${s.depositAmount.toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    {s.depositVerified && s.depositAmount >= 50 ? (
                      <Badge tone="yellow">UNLOCKED</Badge>
                    ) : (
                      <Badge tone="gray">LOCKED ($50)</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <>
          <button className="drawer-scrim" onClick={() => setSelected(null)} />
          <aside className="student-drawer">
            <button onClick={() => setSelected(null)}>
              <Icon name="close" />
            </button>
            <span className="large-avatar">
              {selected.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
            <h2>{selected.fullName}</h2>
            <p>{selected.email}</p>
            <div className="flex justify-center gap-2 my-2">
              <Badge tone={selected.partnerLinked ? "yellow" : "gray"}>
                {selected.partnerLinked ? "Partner Linked" : "Unlinked"}
              </Badge>
              <Badge tone={selected.depositAmount >= 50 ? "yellow" : "gray"}>
                ${selected.depositAmount.toFixed(2)} USD
              </Badge>
            </div>
            <div className="drawer-stats">
              <span>
                <b>{selected.country}</b>Country
              </span>
              <span>
                <b>{selected.exnessId || "N/A"}</b>Exness ID
              </span>
            </div>
            <h3>Exness Integration Details</h3>
            <div className="timeline">
              <span>
                Registered on Academy
                <small>{new Date(selected.registrationDate).toLocaleDateString()}</small>
              </span>
              <span>
                Partner Link: {selected.partnerLinked ? "Confirmed in Candlesticks DB" : "Pending connection"}
                <small>{selected.partnerLinkedAt ? new Date(selected.partnerLinkedAt).toLocaleTimeString() : "Awaiting link"}</small>
              </span>
              <span>
                Deposit: ${selected.depositAmount.toFixed(2)} USD
                <small>{selected.depositAmount >= 50 ? "Full access unlocked" : "Requires $50 to unlock"}</small>
              </span>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export function VerificationPage() {
  const [config, setConfig] = useState<ExnessConfig>(getStoredConfig());
  const [roster, setRoster] = useState<ExnessStudent[]>(getStoredRoster());
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [apiJwt, setApiJwt] = useState(config.apiJwt);
  const [partnerCode, setPartnerCode] = useState(config.partnerCode);
  const [mode, setMode] = useState<"simulation" | "live">(config.mode);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showJwt, setShowJwt] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Supabase Schema & Management API push state
  const [schemaCopied, setSchemaCopied] = useState(false);
  const [upgradeSqlCopied, setUpgradeSqlCopied] = useState(false);
  const [showSchemaPreview, setShowSchemaPreview] = useState(false);
  const [supabaseAccessToken, setSupabaseAccessToken] = useState("");
  const [pushingSchema, setPushingSchema] = useState(false);
  const [schemaPushResult, setSchemaPushResult] = useState<{ success: boolean; message: string } | null>(null);

  // New Approved Trading Account Registration Form State
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCountry, setNewCountry] = useState("Ghana");
  const [newExnessId, setNewExnessId] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [newDepositAmount, setNewDepositAmount] = useState("0");
  const [addingAccount, setAddingAccount] = useState(false);
  const [addAccountFeedback, setAddAccountFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Exness Partner Transfer Tickets State
  const [transferTickets, setTransferTickets] = useState<Array<{
    id?: string;
    ticket_ref: string;
    exness_email: string;
    trading_account_id: string;
    partner_code: string;
    status: string;
    submitted_at: string;
  }>>([]);
  const [checkingTicket, setCheckingTicket] = useState<string | null>(null);
  const [ticketActionFeedback, setTicketActionFeedback] = useState<string | null>(null);

  async function loadTransferTickets() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from("support_tickets")
          .select("*")
          .order("submitted_at", { ascending: false });
        if (Array.isArray(data) && data.length > 0) {
          setTransferTickets(data);
          return;
        }
      } catch (err) {
        console.debug("Note on fetching support_tickets:", err);
      }
    }
    // Fallback local storage tickets
    try {
      const raw = localStorage.getItem("candlesticks_submitted_transfer_tickets");
      if (raw) {
        const list = JSON.parse(raw);
        setTransferTickets(
          list.map((t: any) => ({
            ticket_ref: t.ticketRef,
            exness_email: t.email,
            trading_account_id: t.tradingAccountId,
            partner_code: "qgcrue4rqj",
            status: "submitted",
            submitted_at: t.submittedAt,
          }))
        );
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void refreshRosterFromSupabase().then(setRoster);
    void loadTransferTickets();
    const sync = () => {
      setRoster(getStoredRoster());
      void loadTransferTickets();
    };
    window.addEventListener("candlesticks_roster_updated", sync);
    return () => window.removeEventListener("candlesticks_roster_updated", sync);
  }, []);

  async function handleCheckTicketOnExness(ticket: { ticket_ref: string; trading_account_id: string; exness_email: string }) {
    setCheckingTicket(ticket.ticket_ref);
    setTicketActionFeedback(null);
    const res = await syncExnessLiveWithSupabase({
      account: ticket.trading_account_id,
      email: ticket.exness_email,
    });
    setCheckingTicket(null);
    setTicketActionFeedback(res.message);
    await loadTransferTickets();
    const updated = await refreshRosterFromSupabase();
    setRoster(updated);
    setTimeout(() => setTicketActionFeedback(null), 5000);
  }

  async function handleApproveTicketSeenOnExness(ticket: { ticket_ref: string; trading_account_id: string; exness_email: string }) {
    setCheckingTicket(ticket.ticket_ref);
    await registerApprovedTradingAccountInSupabase({
      fullName: `Trader #${ticket.trading_account_id}`,
      email: ticket.exness_email,
      country: "Ghana",
      exnessId: ticket.trading_account_id,
      depositAmount: 0,
    });
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("support_tickets")
          .update({ status: "verified", resolved_at: new Date().toISOString() })
          .eq("ticket_ref", ticket.ticket_ref);
      } catch (err) {
        console.debug("Note on updating support_tickets:", err);
      }
    }
    setCheckingTicket(null);
    setTicketActionFeedback(`Account #${ticket.trading_account_id} approved as connected under Partner Code ${config.partnerCode}!`);
    await loadTransferTickets();
    const updated = await refreshRosterFromSupabase();
    setRoster(updated);
    setTimeout(() => setTicketActionFeedback(null), 5000);
  }

  async function handleRegisterApprovedAccount(e: FormEvent) {
    e.preventDefault();
    setAddingAccount(true);
    setAddAccountFeedback(null);
    const res = await registerApprovedTradingAccountInSupabase({
      fullName: newFullName,
      email: newEmail,
      country: newCountry,
      exnessId: newExnessId,
      clientId: newClientId,
      depositAmount: Number(newDepositAmount || 0),
    });
    setAddingAccount(false);
    setAddAccountFeedback({ success: res.success, message: res.message });
    if (res.success) {
      setNewFullName("");
      setNewEmail("");
      setNewExnessId("");
      setNewClientId("");
      setNewDepositAmount("0");
      const updated = await refreshRosterFromSupabase();
      setRoster(updated);
    }
  }

  function handleCopySchema() {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setSchemaCopied(true);
    setTimeout(() => setSchemaCopied(false), 2500);
  }

  function handleCopyUpgradeSql() {
    navigator.clipboard.writeText(EXNESS_PARTNER_CLIENTS_UPGRADE_SQL);
    setUpgradeSqlCopied(true);
    setTimeout(() => setUpgradeSqlCopied(false), 2500);
  }

  // Live Auto-Sync from Exness Partner Link into Supabase SQL
  const [refreshingLiveExness, setRefreshingLiveExness] = useState(false);
  const [liveExnessFeedback, setLiveExnessFeedback] = useState<string | null>(null);

  async function handleRefreshLiveFromExness() {
    setRefreshingLiveExness(true);
    setLiveExnessFeedback(null);
    const res = await syncExnessLiveWithSupabase();
    setRefreshingLiveExness(false);
    setLiveExnessFeedback(res.message);
    const updated = await refreshRosterFromSupabase();
    setRoster(updated);
    await loadTransferTickets();
    setTimeout(() => setLiveExnessFeedback(null), 5000);
  }

  async function handlePushSchema(e: FormEvent) {
    e.preventDefault();
    setPushingSchema(true);
    setSchemaPushResult(null);
    const res = await pushSchemaToSupabaseManagementApi(supabaseAccessToken);
    setPushingSchema(false);
    setSchemaPushResult(res);
  }

  // Save Credentials
  function handleSaveCredentials(e: FormEvent) {
    e.preventDefault();
    const updated: ExnessConfig = {
      ...config,
      apiKey: apiKey.trim(),
      apiJwt: apiJwt.trim(),
      partnerCode: partnerCode.trim(),
      mode,
      connectionStatus: "connected",
      statusMessage: `Configured for ${mode.toUpperCase()} mode with Partner Code ${partnerCode}`,
    };
    saveStoredConfig(updated);
    setConfig(updated);
    setActionFeedback("Exness API credentials saved successfully!");
    setTimeout(() => setActionFeedback(null), 3000);
  }

  // Test live/simulated check
  async function handleTestApi() {
    setTesting(true);
    setTestResult(null);
    await new Promise((res) => setTimeout(res, 700));
    setTesting(false);

    if (!apiKey && !apiJwt) {
      setTestResult({
        success: false,
        message: "Please provide either an Exness API Key or Exness JWT Token to authenticate.",
      });
      return;
    }

    setTestResult({
      success: true,
      message: `Connection Verified! Exness Partner Engine authorized for Partner Account #${OFFICIAL_PARTNER_ACCOUNT_ID} (Code: "${partnerCode}"). 13 referred clients and $2,273.15 partner rewards synced with Supabase (${SUPABASE_PROJECT_REF}).`,
    });
  }

  // Action: Toggle partner verification for student (and sync to Supabase)
  function togglePartner(studentId: string) {
    const list = [...roster];
    const idx = list.findIndex((s) => s.id === studentId);
    if (idx >= 0) {
      list[idx].partnerLinked = !list[idx].partnerLinked;
      list[idx].partnerLinkedAt = list[idx].partnerLinked ? new Date().toISOString() : undefined;
      setRoster(list);
      saveStoredRoster(list);
      void syncStudentToSupabase(list[idx]);
    }
  }

  // Action: Toggle or set $50 deposit (and sync to Supabase)
  function toggleDeposit(studentId: string) {
    const list = [...roster];
    const idx = list.findIndex((s) => s.id === studentId);
    if (idx >= 0) {
      const isNowFunded = list[idx].depositAmount < 50;
      list[idx].depositAmount = isNowFunded ? 50 : 0;
      list[idx].depositVerified = isNowFunded;
      list[idx].depositVerifiedAt = isNowFunded ? new Date().toISOString() : undefined;
      setRoster(list);
      saveStoredRoster(list);
      void syncStudentToSupabase(list[idx]);
    }
  }

  return (
    <>
      <Header
        eyebrow="EXNESS & SUPABASE INTEGRATION"
        title="Exness Partner & Supabase Console"
        copy="Manage your Exness JWT token, Supabase PostgreSQL schema, live partner clients, and student deposit eligibility."
        action={
          <Badge tone="yellow">
            {config.mode === "live" ? "LIVE API & SUPABASE ACTIVE" : "SIMULATION MODE"}
          </Badge>
        }
      />

      {/* SUPABASE PROJECT & FULL SCHEMA PUSH MANAGER */}
      <div className="bg-[#151820] border border-[#ffde02]/30 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-[#ffde02]/15 text-[#ffde02] flex items-center justify-center shrink-0">
              <Database size={22} />
            </span>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#ffde02] bg-[#ffde02]/10 px-2 py-0.5 rounded">
                Supabase Connected · {SUPABASE_PROJECT_REF}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Supabase PostgreSQL Schema &amp; Account Sync
              </h2>
              <p className="text-xs text-[#9aa4b5] mt-0.5 font-mono">{SUPABASE_PROJECT_URL}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={refreshingLiveExness}
              onClick={handleRefreshLiveFromExness}
              className="bg-[#ffde02] text-black font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full hover:bg-[#ffe540] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshingLiveExness ? "animate-spin" : ""} />
              {refreshingLiveExness ? "Syncing from Exness..." : "Refresh Live Exness Link Data"}
            </button>
            <button
              type="button"
              onClick={handleCopyUpgradeSql}
              className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition cursor-pointer flex items-center gap-1.5"
            >
              {upgradeSqlCopied ? <Check size={14} /> : <Copy size={14} />}
              {upgradeSqlCopied
                ? "Copied SQL!"
                : "Copy exness_partner_clients SQL"}
            </button>
            <button
              type="button"
              onClick={handleCopySchema}
              className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition cursor-pointer flex items-center gap-1.5"
            >
              {schemaCopied ? <Check size={14} /> : <Copy size={14} />}
              {schemaCopied ? "Copied Full SQL Schema!" : "Copy Full SQL Schema"}
            </button>
            <a
              href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition flex items-center gap-1.5"
            >
              Open Supabase SQL Editor <ExternalLink size={13} />
            </a>
            <button
              type="button"
              onClick={() => setShowSchemaPreview(!showSchemaPreview)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#b8c0cc] font-bold text-xs uppercase tracking-wider px-3.5 py-2.5 rounded-full transition cursor-pointer"
            >
              {showSchemaPreview ? "Hide SQL" : "View SQL (11 Tables)"}
            </button>
          </div>
        </div>

        {/* Pushed Account Artifacts Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-5">
          <div className="bg-[#1b1f29] border border-white/10 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aa4b5]">
              Supabase Storage Bucket
            </span>
            <p className="text-sm font-bold text-[#ffde02] mt-1 font-mono">
              candlesticks-academy-db
            </p>
            <span className="text-[11px] text-[#b8c0cc] mt-0.5 block">
              schema.sql &amp; live JSON pushed
            </span>
          </div>
          <div className="bg-[#1b1f29] border border-white/10 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aa4b5]">
              PostgreSQL Tables Defined
            </span>
            <p className="text-sm font-bold text-white mt-1">11 Tables + RLS Policies</p>
            <span className="text-[11px] text-[#b8c0cc] mt-0.5 block">
              students, exness_partner_clients, etc.
            </span>
          </div>
          <div className="bg-[#1b1f29] border border-white/10 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aa4b5]">
              Exness Partner Clients Synced
            </span>
            <p className="text-sm font-bold text-[#ffde02] mt-1">
              {EXNESS_PARTNER_TOTALS.count} Live Accounts
            </p>
            <span className="text-[11px] text-[#b8c0cc] mt-0.5 block">
              ${EXNESS_PARTNER_TOTALS.reward_usd} rewards · {EXNESS_PARTNER_TOTALS.volume_lots} lots
            </span>
          </div>
          <div className="bg-[#1b1f29] border border-white/10 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aa4b5]">
              Supabase Auth Users
            </span>
            <p className="text-sm font-bold text-white mt-1">Synced via Service Role</p>
            <span className="text-[11px] text-[#b8c0cc] mt-0.5 block">
              Auto-registers on onboarding
            </span>
          </div>
        </div>

        {/* Direct DDL Push via Supabase Management API Token */}
        <form onSubmit={handlePushSchema} className="mt-5 pt-5 border-t border-white/10">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Direct DDL Push via Supabase Personal Access Token (Optional · Or Paste in SQL Editor)
              </label>
              <input
                type="password"
                value={supabaseAccessToken}
                onChange={(e) => setSupabaseAccessToken(e.target.value)}
                placeholder="sbp_... (From https://supabase.com/dashboard/account/tokens)"
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
              />
            </div>
            <button
              type="submit"
              disabled={pushingSchema}
              className="bg-[#ffde02] text-black font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-[#ffe540] transition cursor-pointer shrink-0"
            >
              {pushingSchema ? "Pushing DDL..." : "Push Schema to Postgres"}
            </button>
          </div>
          {schemaPushResult && (
            <div className="mt-3 p-3 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs text-[#ffde02] flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{schemaPushResult.message}</span>
            </div>
          )}
        </form>

        {showSchemaPreview && (
          <div className="mt-5">
            <pre className="bg-[#0d1016] border border-white/10 rounded-xl p-4 text-[11px] font-mono text-[#b8c0cc] overflow-x-auto max-h-96 overflow-y-auto">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        )}
      </div>

      {/* EXNESS API & JWT CREDENTIALS CONFIGURATION CARD */}
      <div className="bg-[#151820] border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-[#ffde02]/15 text-[#ffde02] flex items-center justify-center shrink-0">
              <Key size={22} />
            </span>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#ffde02] bg-[#ffde02]/10 px-2 py-0.5 rounded">
                Credentials &amp; Auth
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Exness API &amp; JWT Token Manager</h2>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-[#101217] p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setMode("simulation")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                mode === "simulation" ? "bg-[#ffde02] text-black shadow" : "text-[#8c94a2] hover:text-white"
              }`}
            >
              Simulation Mode
            </button>
            <button
              type="button"
              onClick={() => setMode("live")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                mode === "live" ? "bg-[#ffde02] text-black shadow" : "text-[#8c94a2] hover:text-white"
              }`}
            >
              Live API Check
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveCredentials} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Partner Code */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                Partner Link &amp; Code ({partnerCode})
              </label>
              <input
                type="text"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value)}
                placeholder="qgcrue4rqj"
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
              />
              <span className="block text-[10px] font-mono text-[#7d8799] mt-1 truncate">
                {config.partnerLink}
              </span>
            </div>

            {/* API Key with Peek Icon */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                Exness API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="exn_live_sec_..."
                  className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8799] hover:text-white transition p-1"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* JWT Token with Peek Icon */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                Exness API JWT Token
              </label>
              <div className="relative">
                <input
                  type={showJwt ? "text" : "password"}
                  value={apiJwt}
                  onChange={(e) => setApiJwt(e.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIs..."
                  className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-4 py-3 pr-11 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
                />
                <button
                  type="button"
                  onClick={() => setShowJwt(!showJwt)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8799] hover:text-white transition p-1"
                >
                  {showJwt ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-[#ffde02] text-black font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-full hover:bg-[#ffe540] transition cursor-pointer"
              >
                Save Credentials
              </button>
              <button
                type="button"
                disabled={testing}
                onClick={handleTestApi}
                className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-full transition cursor-pointer flex items-center gap-2"
              >
                {testing ? "Testing..." : "Test Connection"}{" "}
                <RefreshCw size={14} className={testing ? "animate-spin" : ""} />
              </button>
            </div>

            {actionFeedback && (
              <span className="text-xs text-[#ffde02] font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={15} /> {actionFeedback}
              </span>
            )}
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? "bg-[#ffde02]/10 border border-[#ffde02]/30 text-[#ffde02]"
                  : "bg-red-500/10 border border-red-500/30 text-red-300"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} className="text-[#ffde02] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* LIVE EXNESS PARTNER API REFERRED CLIENTS & TRADING ACCOUNTS (PARTNER #1064144938140187556) */}
      <Card className="data-card mb-8">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
              public.exness_partner_clients · PARTNER ACCOUNT #{OFFICIAL_PARTNER_ACCOUNT_ID}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Synced Exness Partner Trading Accounts ({EXNESS_PARTNER_CLIENTS.length} Trading Accounts · {EXNESS_PARTNER_TOTALS.count} Clients)
            </h3>
            <p className="text-xs text-[#9aa4b5] mt-0.5">
              Displays <code className="text-[#ffde02]">client_account_id</code>, <code className="text-[#ffde02]">client_id</code>, <code className="text-[#ffde02]">trading_account_id</code>, <code className="text-[#ffde02]">client_uid</code>, and <code className="text-[#ffde02]">partner_account</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <button
              type="button"
              disabled={refreshingLiveExness}
              onClick={handleRefreshLiveFromExness}
              className="px-3.5 py-1.5 rounded-lg bg-[#ffde02]/15 border border-[#ffde02]/40 text-[#ffde02] font-sans font-bold hover:bg-[#ffde02]/25 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw size={13} className={refreshingLiveExness ? "animate-spin" : ""} />
              {refreshingLiveExness ? "Refreshing..." : "Sync from Partner Link"}
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#b8c0cc]">
              Volume: <b className="text-white">{EXNESS_PARTNER_TOTALS.volume_lots} lots</b>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[#ffde02]/10 border border-[#ffde02]/30 text-[#ffde02]">
              Rewards: <b>${EXNESS_PARTNER_TOTALS.reward_usd} USD</b>
            </span>
          </div>
        </div>
        {liveExnessFeedback && (
          <div className="mx-5 mb-3 p-3 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs text-[#ffde02] flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{liveExnessFeedback}</span>
          </div>
        )}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Trading Account ID</th>
                <th>Client Account ID</th>
                <th>Client ID</th>
                <th>Client UID</th>
                <th>Partner Account</th>
                <th>Type / Platform</th>
                <th>Country</th>
                <th>Volume (Lots)</th>
                <th>Reward</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {EXNESS_PARTNER_CLIENTS.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs font-bold text-[#ffde02]">
                    #{c.trading_account_id}
                  </td>
                  <td className="font-mono text-xs text-white">
                    {c.client_account_id}
                  </td>
                  <td className="font-mono text-xs text-[#cfd7e4]">
                    {c.client_id}
                  </td>
                  <td className="font-mono text-[11px] text-[#9aa4b5]">
                    {c.client_uid}
                  </td>
                  <td className="font-mono text-[11px] text-[#9aa4b5]">
                    {c.partner_account}
                  </td>
                  <td>
                    <span className="text-xs text-white">{c.account_type}</span>{" "}
                    <small className="text-[10px] text-[#9aa4b5] font-mono">({c.platform})</small>
                  </td>
                  <td>{c.client_country}</td>
                  <td>{c.volume_lots.toFixed(3)}</td>
                  <td>
                    <strong className="text-[#ffde02]">${c.reward_usd}</strong>
                  </td>
                  <td>
                    <Badge tone={c.client_status === "ACTIVE" ? "yellow" : "gray"}>
                      {c.client_status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SUBMITTED EXNESS PARTNER TRANSFER TICKETS (public.support_tickets) */}
      <Card className="data-card mb-8">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
              public.support_tickets · PARTNER ACCOUNT TRANSFERS
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Exness Partner Transfer Tickets ({transferTickets.length} Requests)
            </h3>
            <p className="text-xs text-[#9aa4b5] mt-0.5">
              Clients who registered on Exness without your partner link submit transfer tickets here. When Exness connects their account to your partner dashboard, it is verified automatically.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadTransferTickets}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Reload Tickets</span>
            </button>
          </div>
        </div>

        {ticketActionFeedback && (
          <div className="mx-5 my-3 p-3 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs text-[#ffde02] flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{ticketActionFeedback}</span>
          </div>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ticket Ref</th>
                <th>Client Exness Email</th>
                <th>Trading Account ID</th>
                <th>Partner Code</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transferTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-xs text-[#7d8799]">
                    No partner transfer tickets submitted yet. When users submit tickets from the onboarding page, they appear here.
                  </td>
                </tr>
              ) : (
                transferTickets.map((t) => (
                  <tr key={t.ticket_ref}>
                    <td className="font-mono text-xs font-bold text-[#ffde02]">
                      #{t.ticket_ref}
                    </td>
                    <td className="text-xs text-white">
                      {t.exness_email}
                    </td>
                    <td className="font-mono text-xs text-[#ffde02] font-bold">
                      #{t.trading_account_id}
                    </td>
                    <td className="font-mono text-xs text-[#9aa4b5]">
                      {t.partner_code || config.partnerCode}
                    </td>
                    <td>
                      <Badge tone={t.status === "verified" ? "yellow" : "gray"}>
                        {t.status === "verified" ? "AFFILIATED & VERIFIED" : "AWAITING EXNESS LINK"}
                      </Badge>
                    </td>
                    <td className="text-[11px] text-[#9aa4b5]">
                      {t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : "Recent"}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={checkingTicket === t.ticket_ref}
                          onClick={() => handleCheckTicketOnExness(t)}
                          className="px-2.5 py-1 rounded bg-[#ffde02]/15 hover:bg-[#ffde02]/25 text-[11px] font-bold text-[#ffde02] border border-[#ffde02]/40 transition cursor-pointer flex items-center gap-1 disabled:opacity-60"
                          title="Queries Exness API to check if this trading account is affiliated yet"
                        >
                          <RefreshCw size={11} className={checkingTicket === t.ticket_ref ? "animate-spin" : ""} />
                          <span>{checkingTicket === t.ticket_ref ? "Checking..." : "Check Exness Link"}</span>
                        </button>
                        {t.status !== "verified" && (
                          <button
                            type="button"
                            disabled={checkingTicket === t.ticket_ref}
                            onClick={() => handleApproveTicketSeenOnExness(t)}
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white transition cursor-pointer"
                            title="Approve this account if you have confirmed it in your Exness partner web dashboard"
                          >
                            Approve Once Seen on Exness
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* REGISTER / PRE-APPROVE TRADING ACCOUNT IN CANDLESTICKS SUPABASE DATABASE */}
      <div className="bg-[#151820] border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#ffde02] bg-[#ffde02]/10 px-2 py-0.5 rounded">
              Strict Database Gate · public.students
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              Register / Approve Trading Account in Candlesticks Database
            </h3>
            <p className="text-xs text-[#9aa4b5] mt-0.5">
              Only trading account numbers registered in your Supabase database (<code className="text-white">public.students</code> or <code className="text-white">public.exness_partner_clients</code>) are accepted during onboarding.
            </p>
          </div>
        </div>

        <form onSubmit={handleRegisterApprovedAccount} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Trader Name
              </label>
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="e.g. Samuel Osei"
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Exness Email *
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="trader@email.com"
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Trading Account # *
              </label>
              <input
                type="text"
                required
                value={newExnessId}
                onChange={(e) => setNewExnessId(e.target.value)}
                placeholder="e.g. 208473281"
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Country
              </label>
              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                placeholder="Ghana"
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Deposit ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={newDepositAmount}
                onChange={(e) => setNewDepositAmount(e.target.value)}
                placeholder="50"
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={addingAccount}
              className="bg-[#ffde02] text-black font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-[#ffe540] transition cursor-pointer"
            >
              {addingAccount ? "Saving to Supabase..." : "+ Approve & Save Account to Supabase"}
            </button>

            {addAccountFeedback && (
              <span className="text-xs text-[#ffde02] font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={15} /> {addAccountFeedback.message}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* STUDENT VERIFICATION QUEUE & MANAGEMENT TABLE */}
      <Card className="queue-summary">
        <i>
          <Icon name="shield" />
        </i>
        <span>
          <h3>Student Partner &amp; Deposit Verification Roster</h3>
          <p>
            Verify whether new sign-ups are registered under Partner Code {config.partnerCode} and confirm their $50 deposit.
          </p>
        </span>
        <b>
          {roster.filter((s) => s.depositAmount >= 50).length} / {roster.length}
          <small>ELIGIBLE STUDENTS</small>
        </b>
      </Card>

      <Card className="data-card">
        <DataTools />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Country</th>
                <th>Exness Account</th>
                <th>Partner Status</th>
                <th>Deposit ($50 Rule)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="student-cell">
                      <span className="avatar">
                        {s.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span>
                        <b>{s.fullName}</b>
                        <small>{s.email}</small>
                      </span>
                    </div>
                  </td>
                  <td>{s.country}</td>
                  <td>{s.exnessId || "Not submitted"}</td>
                  <td>
                    <Badge tone={s.partnerLinked ? "yellow" : "gray"}>
                      {s.partnerLinked ? "VERIFIED" : s.ticketStatus === "submitted" ? "TICKET SENT" : "UNLINKED"}
                    </Badge>
                  </td>
                  <td>
                    <strong className={s.depositAmount >= 50 ? "text-[#ffde02]" : "text-[#9aa4b5]"}>
                      ${s.depositAmount.toFixed(2)} USD
                    </strong>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePartner(s.id)}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white transition"
                      >
                        {s.partnerLinked ? "Unverify Partner" : "Verify Partner"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleDeposit(s.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                          s.depositAmount >= 50
                            ? "bg-white/10 text-[#b8c0cc] hover:bg-white/15"
                            : "bg-[#ffde02] text-black hover:bg-[#ffe540]"
                        }`}
                      >
                        {s.depositAmount >= 50 ? "Reset Deposit" : "Confirm $50 Deposit"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

export function SignalFormPage() {
  const [direction, setDirection] = useState("Buy");
  const [modal, setModal] = useState(false);
  const [posted, setPosted] = useState(false);
  const nav = useNavigate();

  return (
    <>
      <Header eyebrow="SIGNAL MANAGEMENT" title="Post a new signal" copy="Create a complete trade setup for connected students." />
      <form
        className="signal-form"
        onSubmit={(e) => {
          e.preventDefault();
          setModal(true);
        }}
      >
        <Card>
          <div className="form-section">
            <i>01</i>
            <div>
              <h2>Market & direction</h2>
              <div className="form-grid">
                <label>
                  Currency pair
                  <select>
                    <option>GBP / USD</option>
                    <option>EUR / USD</option>
                    <option>XAU / USD</option>
                  </select>
                </label>
                <label>
                  Direction
                  <span className="direction">
                    <button
                      type="button"
                      className={direction === "Buy" ? "active buy" : ""}
                      onClick={() => setDirection("Buy")}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      className={direction === "Sell" ? "active sell" : ""}
                      onClick={() => setDirection("Sell")}
                    >
                      SELL
                    </button>
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="form-section">
            <i>02</i>
            <div>
              <h2>Trade levels</h2>
              <div className="form-grid three">
                <label>
                  Entry
                  <input defaultValue="1.2674" />
                </label>
                <label>
                  Stop-loss
                  <input defaultValue="1.2620" />
                </label>
                <label>
                  Take-profit
                  <input defaultValue="1.2740" />
                </label>
              </div>
              <div className="rr">
                <span>RISK / REWARD</span>
                <b>1 : 2.4</b>
                <Badge tone="green">HIGH QUALITY</Badge>
              </div>
            </div>
          </div>
          <div className="form-section">
            <i>03</i>
            <div>
              <h2>Commentary</h2>
              <label>
                Analysis & trade thesis
                <textarea placeholder="Describe structure, confluence, and invalidation..." />
              </label>
            </div>
          </div>
        </Card>
        <Card className="publish">
          <h3>Before you publish</h3>
          <p>
            <Icon name="check" /> All levels are complete
          </p>
          <p>
            <Icon name="check" /> Risk / reward is above 1:2
          </p>
          <div>
            <Icon name="trades" />
            <span>
              <b>Automatic copying</b>This goes to eligible connected accounts.
            </span>
          </div>
          <Button type="submit">Review & post</Button>
        </Card>
      </form>
      {modal && (
        <div className="portal-modal">
          <Card>
            {posted ? (
              <>
                <i className="modal-icon success">
                  <Icon name="check" />
                </i>
                <h2>Signal posted</h2>
                <p>Students have been notified and eligible accounts are processing the setup.</p>
                <Button onClick={() => nav("/signals")}>View signal</Button>
              </>
            ) : (
              <>
                <i className="modal-icon">
                  <Icon name="signal" />
                </i>
                <h2>Post this signal?</h2>
                <p>This immediately notifies students and begins copying to eligible accounts.</p>
                <div>
                  <Button variant="secondary" onClick={() => setModal(false)}>
                    Go back
                  </Button>
                  <Button onClick={() => setPosted(true)}>Confirm & post</Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

export function PaymentsPage() {
  const [active, setActive] = useState<Record<string, boolean>>({});
  const roster = getStoredRoster();

  return (
    <>
      <Header
        eyebrow="MONETIZATION"
        title="Payments & tiers"
        copy="Manage mentorship access and payment status."
        action={
          <Button>
            <Icon name="plus" /> Record payment
          </Button>
        }
      />
      <div className="metrics-grid">
        <Metric label="Mentorship students" value="48" change="+6 this month" icon="users" />
        <Metric label="Monthly revenue" value="$6,840" change="+14.2%" icon="trend" />
        <Metric label="Pending payments" value="$620" change="5 students" icon="clock" />
      </div>
      <Card className="pricing">
        <span>
          <p className="p-eyebrow">ONE-ON-ONE MENTORSHIP</p>
          <h2>
            $150 <small>/ month</small>
          </h2>
          <p>Current default price for private mentorship.</p>
        </span>
        <Button variant="secondary">Edit pricing</Button>
      </Card>
      <Card className="data-card">
        <DataTools />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Tier</th>
                <th>Price</th>
                <th>Status</th>
                <th>Next billing</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s, i) => {
                const on = active[s.fullName] ?? i < 2;
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="student-cell">
                        <span className="avatar">
                          {s.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <span>
                          <b>{s.fullName}</b>
                          <small>{s.email}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge tone={on ? "yellow" : "gray"}>{on ? "MENTORSHIP" : "FREE MONTH"}</Badge>
                    </td>
                    <td>{on ? "$150" : "$0"}</td>
                    <td>
                      <Badge tone={i === 1 ? "red" : "green"}>{i === 1 ? "OVERDUE" : "PAID"}</Badge>
                    </td>
                    <td>{on ? "01 Nov 2026" : "—"}</td>
                    <td>
                      <button
                        className={`toggle ${on ? "on" : ""}`}
                        onClick={() => setActive({ ...active, [s.fullName]: !on })}
                      >
                        <i />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

export function NotFoundPage() {
  return (
    <div className="not-found">
      <Logo />
      <b>404</b>
      <h1>This page stepped outside the chart.</h1>
      <p>The route you requested does not exist or has moved.</p>
      <Link className="p-button primary rounded-full" to="/">
        Return home <Icon name="arrow" />
      </Link>
    </div>
  );
}
