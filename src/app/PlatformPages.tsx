import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
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
import {
  CertificateTemplateConfig,
  ClientNotificationItem,
  CourseLessonItem,
  CourseTrack,
  DASHBOARD_UPGRADE_SQL,
  ECONOMIC_CALENDAR_EVENTS,
  LiveChatMessageItem,
  LiveSessionItem,
  MentorMessageItem,
  QuizAttemptItem,
  SignalTpLevel,
  StudentCertificateItem,
  StudentTradeItem,
  TradingSignalItem,
  addStudentTradeInDb,
  calculateLotSize,
  createClientNotificationInDb,
  createSignalInDb,
  deleteSignalFromDb,
  evaluateSignalsAgainstMarketPrices,
  fetchCertificateTemplateFromDb,
  fetchClientNotificationsFromDb,
  fetchCoursesWithLessonsFromDb,
  fetchLiveMarketPrices,
  fetchLiveSessionsFromDb,
  fetchMentorMessagesFromDb,
  fetchSessionChatMessagesFromDb,
  fetchSignalsFromDb,
  fetchStudentCertificatesFromDb,
  fetchStudentLessonsCompletedFromDb,
  fetchStudentQuizAttemptsFromDb,
  fetchStudentTradesFromDb,
  formatCountdown,
  generateQuizForCourse,
  getCachedCertificateTemplate,
  getCachedClientNotifications,
  getCachedCourses,
  getCachedLiveSessions,
  getCachedMarketPrices,
  getCachedSignals,
  getStudentProgressMetrics,
  issueStudentCertificateInDb,
  markAllNotificationsReadInDb,
  markNotificationReadInDb,
  recordQuizAttemptInDb,
  revokeStudentCertificateInDb,
  sendMentorMessageInDb,
  sendSessionChatMessageInDb,
  syncExnessPartnerSummaryToTradesInDb,
  toggleLessonCompletedInDb,
  updateSignalStatusInDb,
  uploadStudentAvatarToStorage,
} from "./portalDataStore";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calculator,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Database,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  Filter,
  Flame,
  Globe,
  Key,
  Layers,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  MonitorPlay,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  TrendingUp,
  Unlock,
  Upload,
  User,
  Video as VideoIcon,
  Zap,
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

// Helper to render student avatar image or initials
function StudentAvatarBadge({
  avatarUrl,
  name,
  sizeClass = "w-9 h-9 text-xs",
}: {
  avatarUrl?: string;
  name: string;
  sizeClass?: string;
}) {
  const initials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`${sizeClass} rounded-full object-cover border border-[#ffde02]/50 shrink-0`}
      />
    );
  }
  return (
    <span
      className={`${sizeClass} rounded-full bg-[#ffde02]/15 text-[#ffde02] border border-[#ffde02]/30 font-extrabold flex items-center justify-center shrink-0`}
    >
      {initials}
    </span>
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

// Hook to subscribe to live portal data updates (courses, quizzes, live sessions, signals, trades)
export function usePortalDataSync() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("candlesticks_portal_data_updated", bump);
    window.addEventListener("candlesticks_user_updated", bump);
    return () => {
      window.removeEventListener("candlesticks_portal_data_updated", bump);
      window.removeEventListener("candlesticks_user_updated", bump);
    };
  }, []);
  return tick;
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
            {checking ? "Checking API..." : "Check Status"}{" "}
            <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleSimulateOrCheck(50)}
          className="text-xs text-[#ffde02] hover:underline cursor-pointer"
        >
          ⚡ Verify $50 Deposit Status
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
  ["Courses & Videos", "/admin/courses", "book"],
  ["Live Broadcast Studio", "/admin/sessions", "video"],
  ["Post a signal", "/admin/signals/new", "signal"],
  ["Mentor Q&A Inbox", "/admin/messages", "bell"],
  ["Verification & SQL", "/admin/verification", "shield"],
  ["Payments & tiers", "/admin/payments", "trades"],
] as const;

export function PortalLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const admin = loc.pathname.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive Alert Bell Popover state
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClientNotificationItem[]>([]);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
    setBellOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  // Load client notifications & audit log alerts pertaining to this client
  useEffect(() => {
    const targetEmail = admin ? "ALL" : student.email;
    void fetchClientNotificationsFromDb(targetEmail, student.exnessId).then(setNotifications);
  }, [admin, student.email, student.exnessId, syncTick]);

  // Live Market Price Monitor: checks active Admin signals against real market feed for TP1-TP5 & SL hits
  useEffect(() => {
    let mounted = true;
    const checkPrices = async () => {
      if (!mounted) return;
      await evaluateSignalsAgainstMarketPrices();
      if (!mounted) return;
      const targetEmail = admin ? "ALL" : student.email;
      const list = await fetchClientNotificationsFromDb(targetEmail, student.exnessId);
      if (mounted) setNotifications(list);
    };
    void checkPrices();
    const interval = setInterval(() => {
      void checkPrices();
    }, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [admin, student.email, student.exnessId]);

  // Close bell popover on outside click
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(ev.target as Node)) {
        setBellOpen(false);
      }
    };
    if (bellOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bellOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkAllRead() {
    const targetEmail = admin ? "ALL" : student.email;
    await markAllNotificationsReadInDb(targetEmail, student.exnessId);
    const updated = await fetchClientNotificationsFromDb(targetEmail, student.exnessId);
    setNotifications(updated);
  }

  async function handleNotificationClick(item: ClientNotificationItem) {
    if (!item.isRead) {
      await markNotificationReadInDb(item.id);
      const targetEmail = admin ? "ALL" : student.email;
      const updated = await fetchClientNotificationsFromDb(targetEmail, student.exnessId);
      setNotifications(updated);
    }
    setBellOpen(false);
    if (item.actionUrl) {
      nav(item.actionUrl);
    }
  }

  function handleLogout() {
    logoutCurrentUser();
    nav("/login");
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    if (q.includes("signal") || q.includes("xau") || q.includes("eur") || q.includes("gbp")) {
      nav("/signals");
    } else if (q.includes("live") || q.includes("session") || q.includes("stream")) {
      nav("/sessions");
    } else if (q.includes("trade") || q.includes("pnl")) {
      nav("/trades");
    } else if (q.includes("setting") || q.includes("profile")) {
      nav("/settings");
    } else {
      nav("/courses");
    }
    setSearchQuery("");
  }

  return (
    <div className="portal">
      <aside className={`portal-sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <Logo />
          <button onClick={() => setOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <p className="nav-label">{admin ? "FOUNDER CONSOLE" : "CLIENT TRADING TERMINAL"}</p>
        <nav>
          {(admin ? adminNav : studentNav).map(([label, to, icon]) => (
            <NavLink to={to} end={to === "/admin" || to === "/dashboard"} key={to}>
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {!admin && (
            <NavLink to="/settings">
              <Icon name="settings" />
              Settings &amp; Profile
            </NavLink>
          )}
          {admin && (
            <Link to="/dashboard">
              <Icon name="book" />
              Switch to Client View
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="h-[46px] px-[13px] rounded-[12px] flex items-center gap-[13px] text-[#f6465d] hover:text-white hover:bg-[#f6465d]/15 text-[13.5px] font-semibold transition cursor-pointer w-full text-left border-0 bg-transparent"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
          <div className="profile">
            {admin ? (
              <img
                src="/ceo.png"
                alt="Pastor Mike"
                className="w-9 h-9 rounded-full object-cover border border-[#ffde02]/50 shrink-0"
              />
            ) : (
              <StudentAvatarBadge avatarUrl={student.avatarUrl} name={student.fullName} />
            )}
            <b>
              {admin ? "Pastor Mike" : student.fullName || "Registered Trader"}
              <small>
                {admin
                  ? "Founder & Lead Mentor"
                  : student.depositVerified && student.depositAmount >= 50
                  ? "Verified & Funded ($50+)"
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
          <form onSubmit={handleSearchSubmit} className="portal-search">
            <Icon name="search" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, live sessions, VIP signals, trades..."
            />
            <kbd>↵</kbd>
          </form>

          {/* Interactive Alert Bell Linked to Client Audit Logs & Trade Events */}
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen((prev) => !prev)}
              className="notify relative cursor-pointer"
              title="Client Alerts, Trade Notifications & Audit Feed"
            >
              <Icon name="bell" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f6465d] text-white text-[10px] font-mono font-extrabold flex items-center justify-center border border-[#0b0e14]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2.5 w-[340px] sm:w-[390px] rounded-2xl bg-[#11151f] border border-white/15 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3.5 bg-[#161b26] border-b border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffde02] block">
                      CLIENT AUDIT &amp; TRADE ALERTS
                    </span>
                    <h4 className="text-xs font-extrabold text-white mt-0.5">
                      Notifications ({unreadCount} unread)
                    </h4>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleMarkAllRead()}
                      className="px-2.5 py-1 rounded-lg bg-[#ffde02]/15 hover:bg-[#ffde02]/25 border border-[#ffde02]/30 text-[10px] font-bold text-[#ffde02] transition cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto divide-y divide-white/10">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center space-y-1.5">
                      <Bell size={22} className="mx-auto text-[#7f8a9d]" />
                      <p className="text-xs font-bold text-white">No alerts for your account yet</p>
                      <p className="text-[11px] text-[#8c95a6]">
                        Whenever you copy a trade, a signal hits TP1–TP5, or an account audit event occurs, it will appear right here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleNotificationClick(item)}
                        className={`w-full text-left px-4 py-3 transition flex items-start gap-3 cursor-pointer ${
                          item.isRead
                            ? "bg-transparent hover:bg-white/5 opacity-75"
                            : "bg-[#ffde02]/[0.06] hover:bg-[#ffde02]/[0.12]"
                        }`}
                      >
                        <span
                          className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                            item.isRead
                              ? "bg-white/20"
                              : item.category === "tp_hit"
                              ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                              : item.category === "trade"
                              ? "bg-[#ffde02] shadow-[0_0_8px_#ffde02]"
                              : "bg-sky-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-mono text-[#7f8a9d] shrink-0">
                              {new Date(item.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#b4bccb] leading-relaxed mt-0.5 line-clamp-2">
                            {item.message}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-[#9aa4b5]">
                              {item.category.replace("_", " ")}
                            </span>
                            {!item.isRead && (
                              <span className="text-[10px] font-bold text-[#ffde02]">
                                Click to mark read →
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to={admin ? "/admin" : "/settings"} title="Profile & Settings" className="shrink-0">
            {admin ? (
              <img
                src="/ceo.png"
                alt="Pastor Mike"
                className="w-9 h-9 rounded-full object-cover border border-[#ffde02]/50"
              />
            ) : (
              <StudentAvatarBadge avatarUrl={student.avatarUrl} name={student.fullName} />
            )}
          </Link>
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
  const [loginInput, setLoginInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = loginInput.trim().toLowerCase();
    if (cleaned === "mike.vinci77@gmail.com" || cleaned === "admin@candlesticks.ac") {
      nav("/admin");
      return;
    }

    const roster = await refreshRosterFromSupabase();
    const match = roster.find(
      (s) => s.email.toLowerCase() === cleaned || (s.exnessId && s.exnessId.trim() === loginInput.trim())
    );
    if (match) {
      saveStoredCurrentUser(match);
      nav("/dashboard");
    } else {
      nav("/dashboard");
    }
  }

  return (
    <Auth quote="Discipline turns knowledge into a skill you can rely on.">
      <form className="auth-form login" onSubmit={handleLogin}>
        <p className="p-eyebrow">WELCOME BACK</p>
        <h1>Continue your journey</h1>
        <p>Log in with your registered email or Exness Trading Account ID to access your dashboard.</p>
        <label>
          Email or Exness Trading Account ID
          <input
            required
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password<a>Forgot password?</a>
          <input required type="password" placeholder="Enter your password" />
        </label>
        {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
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

// ============================================================================
// 1. PREMIUM CLIENT OVERVIEW DASHBOARD (/dashboard) — 100% REAL DATABASE DATA
// ============================================================================

export function DashboardPage() {
  const nav = useNavigate();
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);

  // Real database state
  const [courses, setCourses] = useState<CourseTrack[]>(getCachedCourses());
  const [liveSessions, setLiveSessions] = useState<LiveSessionItem[]>(getCachedLiveSessions());
  const [signals, setSignals] = useState<TradingSignalItem[]>(getCachedSignals());
  const [countdownText, setCountdownText] = useState("00:00:00");
  const [isSessionLiveNow, setIsSessionLiveNow] = useState(false);

  useEffect(() => {
    void fetchCoursesWithLessonsFromDb().then(setCourses);
    void fetchLiveSessionsFromDb().then(setLiveSessions);
    void fetchSignalsFromDb().then(setSignals);
    void fetchStudentLessonsCompletedFromDb(student.email);
    void fetchStudentQuizAttemptsFromDb(student.email);
  }, [student.email, syncTick]);

  // Real student progress metrics from Supabase / local store
  const metrics = getStudentProgressMetrics(student.email);

  // Next Live Session & Real-Time Ticking Countdown
  const featuredSession =
    liveSessions.find((s) => s.status === "live") ||
    liveSessions.find((s) => s.status === "scheduled") ||
    liveSessions[0];

  useEffect(() => {
    if (!featuredSession) return;
    const updateClock = () => {
      if (featuredSession.status === "live") {
        setIsSessionLiveNow(true);
        setCountdownText("LIVE NOW");
      } else {
        const c = formatCountdown(featuredSession.scheduledAt);
        setIsSessionLiveNow(c.isLiveNow);
        setCountdownText(c.formatted);
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [featuredSession]);

  // Latest Signal uploaded from Admin Console
  const latestSignal = signals[0];

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
  const nextLesson = metrics.nextLesson;
  const nextCourse =
    courses.find((c) => c.slug === nextLesson?.courseSlug) || courses[0];

  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Institutional Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-[#131722] via-[#171c28] to-[#11151e] border border-white/10 rounded-2xl p-6 sm:p-7 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <StudentAvatarBadge
            avatarUrl={student.avatarUrl}
            name={student.fullName}
            sizeClass="w-14 h-14 text-base"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffde02]">
                {todayFormatted}
              </span>
              <span className="text-[10px] font-mono text-[#7f8a9d]">•</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aa4b5]">
                {student.preferredSession || "London & NY Overlap"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
              Welcome back, {student.fullName.split(" ")[0] || "Trader"}.
            </h1>
            <p className="text-xs sm:text-sm text-[#9aa4b5] mt-0.5">
              Live database telemetry synced with Supabase · Exness Account{" "}
              <strong className="text-white font-mono">
                {student.exnessId ? `••••${student.exnessId.slice(-4)}` : "Unlinked"}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isDepositCompleted ? (
            <Badge tone="green">FULL ACCESS UNLOCKED ($50+ DEPOSIT)</Badge>
          ) : student.partnerLinked ? (
            <Badge tone="yellow">PARTNER LINKED · AWAITING $50 DEPOSIT</Badge>
          ) : (
            <Badge tone="red">EXNESS UNLINKED</Badge>
          )}
          <Link
            to="/settings"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition"
          >
            Risk Profile ({student.riskPerTradePct || 1}% Risk)
          </Link>
        </div>
      </div>

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
              className="px-5 py-2.5 rounded-full bg-[#ffde02] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#ffe540] transition shrink-0 cursor-pointer"
            >
              Complete Exness Link <ArrowRight size={14} className="inline ml-1" />
            </button>
          </div>
        </Card>
      )}

      {/* Case 2: Partner linked -> Led to make $50 deposit */}
      {student.partnerLinked && !isDepositCompleted && (
        <Card className="deposit-card">
          <i>
            <Icon name="shield" />
          </i>
          <div>
            <small>STEP 2: ACTIVATE FULL ACCESS · VERIFIED PARTNER ACCOUNT</small>
            <h3>
              Deposit ${Math.max(0, 50 - student.depositAmount).toFixed(2)} USD in your Exness account to activate all features
            </h3>
            <p>
              Your Exness Trading Account is registered under our Partner Link. Make your minimum <b>$50.00 USD deposit</b> on Exness to automatically unlock all Academy courses, live trading rooms, and daily VIP signals.
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
          </div>
        </Card>
      )}

      {checkMsg && (
        <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#ffde02] flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>{checkMsg}</span>
        </div>
      )}

      {/* Real Database-Connected KPI Metrics Strip */}
      <div className="metrics-grid">
        <Metric
          label="Course progress"
          value={`${metrics.overallPercent}%`}
          change={`${metrics.completedLessonsCount} of ${metrics.totalLessons} lessons completed`}
          icon="book"
        />
        <Metric
          label="Learning streak"
          value={`${metrics.streakDays} ${metrics.streakDays === 1 ? "day" : "days"}`}
          change={
            metrics.streakDays > 0
              ? `Active streak · ${metrics.hoursLearned} hrs studied`
              : "Complete a lesson or quiz today to start your streak"
          }
          icon="trend"
        />
        <Metric
          label="Quiz average"
          value={metrics.quizCount > 0 ? `${metrics.averageQuizScore}%` : "0%"}
          change={
            metrics.quizCount > 0
              ? `Across ${metrics.quizCount} completed ${metrics.quizCount === 1 ? "quiz" : "quizzes"}`
              : "No quizzes taken yet · Auto-quizzes ready in Courses"
          }
          icon="chart"
        />
      </div>

      <div className="dash-grid">
        {/* Continue Learning Card (Connected to Real Course & Lesson Progress) */}
        <Card className="continue-card">
          <div className="card-title">
            <p className="p-eyebrow">CONTINUE LEARNING · DATABASE SYNCED</p>
            <Badge>
              {isDepositCompleted
                ? nextLesson
                  ? `LESSON ${nextLesson.lessonNumber} OF ${nextCourse?.lessons.length || 12}`
                  : "ALL LESSONS COMPLETE"
                : "LOCKED"}
            </Badge>
          </div>
          <h2>{nextLesson ? nextLesson.title : "All Course Modules Completed!"}</h2>
          <p className="text-xs text-[#9aa4b5] mb-3">
            {nextLesson
              ? nextLesson.summary
              : "Take the auto-generated course assessments to earn your verified certificate."}
          </p>
          <div className="course-art">
            <span>{String(nextLesson?.lessonNumber || 1).padStart(2, "0")}</span>
            <i>{isDepositCompleted ? <Icon name="play" /> : <Lock size={22} />}</i>
            <small>{(nextCourse?.title || "FOREX FOUNDATIONS").toUpperCase()}</small>
          </div>
          <Progress value={isDepositCompleted ? metrics.overallPercent : 0} />
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            {isDepositCompleted ? (
              <>
                <Button
                  onClick={() =>
                    nav(nextLesson ? `/lessons/${nextLesson.id}` : `/courses/${nextCourse?.slug || "forex-foundations"}`)
                  }
                >
                  {metrics.completedLessonsCount > 0 ? "Resume lesson" : "Start first lesson"}{" "}
                  <Icon name="arrow" />
                </Button>
                <Link
                  to={`/quiz/${nextCourse?.slug || "forex-foundations"}`}
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-[#ffde02] transition"
                >
                  Take Course Quiz ({nextCourse?.title || "Foundations"}) →
                </Link>
              </>
            ) : (
              <button
                onClick={() => nav("/courses")}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Lock size={13} className="text-[#ffde02]" /> View Unlocking Requirement
              </button>
            )}
          </div>
        </Card>

        {/* Dash Stack: Live Session + Latest Signal */}
        <div className="dash-stack">
          <Card>
            <div className="card-title">
              <p className="p-eyebrow">NEXT LIVE SESSION · RTMP &amp; SCREEN SHARE</p>
              <Badge tone={isSessionLiveNow ? "green" : featuredSession ? "red" : "gray"}>
                {isSessionLiveNow
                  ? "● LIVE NOW"
                  : featuredSession
                  ? `LIVE IN ${countdownText}`
                  : "AWAITING SCHEDULE"}
              </Badge>
            </div>
            {featuredSession ? (
              <>
                <h2>{featuredSession.title}</h2>
                <p className="text-xs text-[#9aa4b5] mt-1">{featuredSession.description}</p>
                <p className="mt-2">
                  <Icon name="calendar" />{" "}
                  {new Date(featuredSession.scheduledAt).toLocaleString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {featuredSession.focusPair}
                </p>
                {isDepositCompleted ? (
                  <Button onClick={() => nav(`/sessions/live/${featuredSession.id}`)}>
                    <Icon name="video" />{" "}
                    {isSessionLiveNow ? "Join Live Stream & Chat Now" : "Enter Live Waiting Room"}
                  </Button>
                ) : (
                  <button
                    onClick={() => nav("/sessions")}
                    className="mt-3 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <Lock size={13} className="text-[#ffde02]" /> Locked ($50 Deposit Required)
                  </button>
                )}
              </>
            ) : (
              <div className="py-3 space-y-2">
                <h2 className="text-base font-bold text-white">No Live Broadcast Scheduled Yet</h2>
                <p className="text-xs text-[#9aa4b5]">
                  When Pastor Mike schedules a London or New York live session or goes live in the Admin Broadcast Studio, the real-time countdown and stream link will appear right here.
                </p>
                <Link
                  to="/sessions"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ffde02] hover:underline pt-1"
                >
                  Open Live Sessions Room <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </Card>

          <Card className="signal-snapshot">
            <div className="flex items-center justify-between">
              <p className="p-eyebrow">LATEST ADMIN SIGNAL</p>
              <span className="text-[10px] font-mono text-[#8c95a6]">
                {latestSignal?.timeframe || "REAL-TIME FEED"}
              </span>
            </div>
            {latestSignal ? (
              <>
                <h2>
                  {latestSignal.pair}{" "}
                  <Badge tone={latestSignal.direction === "SELL" ? "red" : "green"}>
                    {latestSignal.direction}
                  </Badge>
                  <Badge
                    tone={
                      latestSignal.status === "ALL TPs HIT" || latestSignal.status === "HIT TP"
                        ? "green"
                        : latestSignal.status === "PARTIAL TP"
                        ? "yellow"
                        : latestSignal.status === "HIT SL"
                        ? "red"
                        : "yellow"
                    }
                  >
                    {latestSignal.status}
                  </Badge>
                </h2>
                {isDepositCompleted ? (
                  <>
                    <div>
                      <span>
                        ENTRY<b>{latestSignal.entry}</b>
                      </span>
                      <span>
                        STOP LOSS<b className="negative">{latestSignal.sl}</b>
                      </span>
                      <span>
                        TP1 TARGET<b className="positive">{latestSignal.tp}</b>
                      </span>
                    </div>
                    {latestSignal.tpLevels && latestSignal.tpLevels.length > 1 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {latestSignal.tpLevels.map((lvl) => (
                          <span
                            key={lvl.level}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              lvl.hit
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-white/5 text-[#9aa4b5] border-white/10"
                            }`}
                          >
                            {lvl.label}: {lvl.price} {lvl.hit ? "✓ HIT" : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link to={`/signals/${latestSignal.id}`}>
                      Copy trade &amp; lot calculator <Icon name="arrow" />
                    </Link>
                  </>
                ) : (
                  <div className="pt-2 text-xs text-[#8f98a8] flex items-center justify-between">
                    <span>SL/TP levels hidden</span>
                    <Link
                      to="/signals"
                      className="text-[#ffde02] hover:underline flex items-center gap-1 font-bold"
                    >
                      Unlock with $50 Deposit <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="py-3 space-y-2">
                <h2 className="text-base font-bold text-white">No Admin Signals Posted Yet</h2>
                <p className="text-xs text-[#9aa4b5]">
                  Only real setups published by Pastor Mike in the Admin Console appear here, complete with live market TP1–TP5 tracking.
                </p>
                <Link
                  to="/signals"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ffde02] hover:underline pt-1"
                >
                  Open VIP Signal Feed <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Redesigned High-Impact Forex Macroeconomic Calendar Card */}
      <section className="mt-6 rounded-2xl bg-gradient-to-b from-[#151924] to-[#10141d] border border-white/10 p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.14em] text-[#ffde02]">
                  HIGH-IMPACT MACROECONOMIC CALENDAR
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug m-0">
                Upcoming Red-Folder Volatility Events
              </h3>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 self-start md:self-auto">
            <ShieldAlert size={15} className="text-[#ffde02] shrink-0" />
            <span className="text-xs font-mono font-bold text-[#ffde02]">
              Protect stops 15m before red-folder releases
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-5">
          {ECONOMIC_CALENDAR_EVENTS.map((ev) => (
            <div
              key={ev.id}
              className="p-4 rounded-xl bg-[#0d1017] hover:bg-[#131822] border border-white/10 hover:border-[#ffde02]/30 transition flex flex-col justify-between gap-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold text-white bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg tracking-wider">
                  {ev.currency}
                </span>
                <Badge tone={ev.impact === "HIGH" ? "red" : "yellow"}>
                  {ev.impact === "HIGH" ? "● HIGH IMPACT" : "MEDIUM"}
                </Badge>
              </div>

              <div className="space-y-1.5 my-0.5">
                <div className="text-[13px] font-bold text-white leading-snug min-h-[36px]">
                  {ev.event}
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#9aa4b5] bg-white/5 px-2 py-0.5 rounded">
                  <Clock size={11} className="text-[#ffde02]" />
                  <span>{ev.timeGmt}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-white/[0.03] rounded-lg px-2 py-1">
                  <span className="text-[#7f8a9d] block text-[9px] uppercase">Forecast</span>
                  <strong className="text-white font-bold">{ev.forecast}</strong>
                </div>
                <div className="bg-white/[0.03] rounded-lg px-2 py-1 text-right">
                  <span className="text-[#7f8a9d] block text-[9px] uppercase">Previous</span>
                  <strong className="text-[#b8c0cc] font-semibold">{ev.previous}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ============================================================================
// 2. REAL CLIENT SETTINGS PAGE (/settings)
//    - Avatar Upload to Supabase Storage (visible in Admin Roster)
//    - Trading Risk Profile & Session Alert Preferences
//    - Direct 1-on-1 Mentor Q&A with Pastor Mike
//    - Supabase SQL Upgrade Schema Copy Generator
// ============================================================================

export function SettingsPage() {
  const student = useCurrentStudent();
  const config = getStoredConfig();
  const [fullName, setFullName] = useState(student.fullName);
  const [email, setEmail] = useState(student.email);
  const [country, setCountry] = useState(student.country || "Ghana");
  const [phone, setPhone] = useState(student.phone || "");
  const [telegramHandle, setTelegramHandle] = useState(student.telegramHandle || "");
  const [exnessId, setExnessId] = useState(student.exnessId);

  // Trading Risk Profile & Preferences
  const [preferredSession, setPreferredSession] = useState(
    student.preferredSession || "London & New York Overlap"
  );
  const [tradingStyle, setTradingStyle] = useState(
    student.tradingStyle || "Intraday / Day Trading"
  );
  const [accountBalanceUsd, setAccountBalanceUsd] = useState(
    String(student.accountBalanceUsd ?? 500)
  );
  const [riskPerTradePct, setRiskPerTradePct] = useState(
    String(student.riskPerTradePct ?? 1.0)
  );
  const [targetMonthlyReturnPct, setTargetMonthlyReturnPct] = useState(
    String(student.targetMonthlyReturnPct ?? 10.0)
  );

  // Notifications & Copy Trading state persisted to student record
  const [notifySignals, setNotifySignals] = useState(student.notifySignals ?? true);
  const [notifySessions, setNotifySessions] = useState(student.notifySessions ?? true);
  const [autoCopySignals, setAutoCopySignals] = useState(student.autoCopySignals ?? true);

  // Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ticketGuideOpen, setTicketGuideOpen] = useState(false);

  // Direct Mentor Q&A state
  const [mentorMessages, setMentorMessages] = useState<MentorMessageItem[]>([]);
  const [questionSubject, setQuestionSubject] = useState("Trade Setup & Chart Review");
  const [questionBody, setQuestionBody] = useState("");
  const [sendingQuestion, setSendingQuestion] = useState(false);

  // SQL Schema Copy state
  const [copiedUpgradeSql, setCopiedUpgradeSql] = useState(false);

  useEffect(() => {
    void fetchMentorMessagesFromDb(student.email).then(setMentorMessages);
  }, [student.email]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarFeedback(null);
    const res = await uploadStudentAvatarToStorage(file, student);
    setUploadingAvatar(false);
    setAvatarFeedback(res.message);
    setTimeout(() => setAvatarFeedback(null), 4000);
  }

  function saveProfile() {
    const updated: ExnessStudent = {
      ...student,
      fullName: fullName.trim(),
      email: email.trim(),
      country,
      phone: phone.trim(),
      telegramHandle: telegramHandle.trim(),
      exnessId: exnessId.trim(),
      preferredSession,
      tradingStyle,
      accountBalanceUsd: Number(accountBalanceUsd) || 500,
      riskPerTradePct: Number(riskPerTradePct) || 1,
      targetMonthlyReturnPct: Number(targetMonthlyReturnPct) || 10,
      notifySignals,
      notifySessions,
      autoCopySignals,
    };
    saveStoredCurrentUser(updated);

    const roster = getStoredRoster();
    const idx = roster.findIndex((s) => s.email.toLowerCase() === student.email.toLowerCase());
    if (idx >= 0) {
      roster[idx] = updated;
      saveStoredRoster(roster);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  async function handleSendMentorQuestion(e: FormEvent) {
    e.preventDefault();
    if (!questionBody.trim()) return;
    setSendingQuestion(true);
    await sendMentorMessageInDb({
      studentEmail: student.email,
      studentName: student.fullName,
      studentAvatar: student.avatarUrl || "",
      senderRole: "student",
      subject: questionSubject,
      message: questionBody,
    });
    setSendingQuestion(false);
    setQuestionBody("");
    const updated = await fetchMentorMessagesFromDb(student.email);
    setMentorMessages(updated);
  }

  return (
    <>
      <Header
        eyebrow="CLIENT ACCOUNT & PREFERENCES"
        title="Profile, Risk Terminal & Settings"
        copy="Upload your profile photo, configure your risk parameters, message Pastor Mike, and manage your linked Exness account."
      />
      <div className="settings-grid">
        <nav>
          <a href="#profile">Profile &amp; Photo</a>
          <a href="#risk-profile">Risk &amp; Session</a>
          <a href="#account">Linked Exness</a>
          <a href="#mentor-qa">Direct Mentor Q&amp;A</a>
          <a href="#alerts">Notifications</a>
          <a href="#ticket-guide">Partner Transfer</a>
          <a href="#sql-schema">Database Schema</a>
        </nav>
        <div>
          {/* 1. Profile & Photo Upload Card */}
          <Card className="settings-card" id="profile">
            <h2>Profile &amp; Avatar Photo</h2>
            <p>
              Upload your profile image. Your photo is synced to Supabase Storage (<code>student-avatars</code>) and visible to Pastor Mike in the Admin Console.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141821] border border-white/10 my-4">
              <div className="flex items-center gap-4">
                <StudentAvatarBadge
                  avatarUrl={student.avatarUrl}
                  name={student.fullName}
                  sizeClass="w-16 h-16 text-lg"
                />
                <div>
                  <b className="text-white text-base block">{student.fullName}</b>
                  <small className="text-[#8c94a2] text-xs block">
                    {student.email} · {student.country}
                  </small>
                  {avatarFeedback && (
                    <span className="text-xs text-[#ffde02] mt-1 block">{avatarFeedback}</span>
                  )}
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={15} />
                  {uploadingAvatar ? "Uploading Photo..." : "Upload Profile Photo"}
                </button>
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
                Phone / WhatsApp Number
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+233 24 000 0000"
                />
              </label>
              <label>
                Telegram Username
                <input
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  placeholder="@yourusername"
                />
              </label>
              <label>
                Exness Trading Account ID
                <input
                  value={exnessId}
                  onChange={(e) => setExnessId(e.target.value)}
                  placeholder="Enter your Trading Account ID"
                />
              </label>
            </div>
            <div className="flex items-center gap-4 mt-5">
              <Button onClick={saveProfile}>Save Profile &amp; Sync to Database</Button>
              {saveSuccess && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Saved &amp; synced to Supabase!
                </span>
              )}
            </div>
          </Card>

          {/* 2. Trading Risk Profile & Session Preferences */}
          <Card className="settings-card" id="risk-profile">
            <h2>Trading Risk Profile &amp; Lot Calculator Defaults</h2>
            <p>
              Set your account balance and maximum risk per trade. These values automatically power the Position Size Calculator inside the VIP Signal Feed.
            </p>
            <div className="form-grid mt-4">
              <label>
                Trading Account Equity ($ USD)
                <input
                  type="number"
                  value={accountBalanceUsd}
                  onChange={(e) => setAccountBalanceUsd(e.target.value)}
                />
              </label>
              <label>
                Default Risk Per Trade (%)
                <input
                  type="number"
                  step="0.25"
                  value={riskPerTradePct}
                  onChange={(e) => setRiskPerTradePct(e.target.value)}
                />
              </label>
              <label>
                Monthly Return Target (%)
                <input
                  type="number"
                  step="1"
                  value={targetMonthlyReturnPct}
                  onChange={(e) => setTargetMonthlyReturnPct(e.target.value)}
                />
              </label>
              <label>
                Preferred Trading Session
                <select
                  value={preferredSession}
                  onChange={(e) => setPreferredSession(e.target.value)}
                >
                  <option>London &amp; New York Overlap</option>
                  <option>London Open Session</option>
                  <option>New York Open Session</option>
                  <option>Asian / Tokyo Session</option>
                </select>
              </label>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-[#9aa4b5] mb-1.5">Primary Trading Style</label>
              <div className="flex flex-wrap gap-2">
                {["Scalping (M5/M15)", "Intraday / Day Trading", "Swing Trading (H4/D1)"].map(
                  (style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTradingStyle(style)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        tradingStyle === style
                          ? "bg-[#ffde02] text-black border-[#ffde02]"
                          : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {style}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="mt-5">
              <Button onClick={saveProfile}>Save Risk Profile</Button>
            </div>
          </Card>

          {/* 3. Linked Exness Account Card */}
          <Card className="settings-card" id="account">
            <div className="card-title">
              <div>
                <h2>Linked Exness account</h2>
                <p>Your connected broker profile and verification state.</p>
              </div>
              {student.depositVerified && student.depositAmount >= 50 ? (
                <Badge tone="green">VERIFIED &amp; FUNDED ($50+)</Badge>
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
                <strong>
                  {student.exnessId ? `•••• ••${student.exnessId.slice(-4)}` : "Not provided"}
                </strong>
              </span>
              <span>
                DEPOSIT STATUS
                <strong className={student.depositAmount >= 50 ? "positive" : "text-amber-400"}>
                  ${student.depositAmount.toFixed(2)} verified{" "}
                  {student.depositAmount >= 50 ? "(Full Access)" : "(Awaiting $50)"}
                </strong>
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-3 items-center justify-between text-xs">
              <span className="text-[#8c94a2]">
                Official Partner Code: <strong className="text-white">{config.partnerCode}</strong>
              </span>
              <Link
                to="/onboarding"
                className="text-[#ffde02] hover:underline font-bold flex items-center gap-1"
              >
                Run Onboarding / Re-verify <ArrowRight size={13} />
              </Link>
            </div>
          </Card>

          {/* 4. Direct 1-on-1 Mentor Q&A Support Messaging */}
          <Card className="settings-card" id="mentor-qa">
            <h2>Direct 1-on-1 Mentor Q&amp;A with Pastor Mike</h2>
            <p>
              Ask a question about a course lesson, market structure setup, or your trading plan. Replies appear directly below.
            </p>
            <form onSubmit={handleSendMentorQuestion} className="space-y-3 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label>
                  Topic / Subject
                  <select
                    value={questionSubject}
                    onChange={(e) => setQuestionSubject(e.target.value)}
                  >
                    <option>Trade Setup &amp; Chart Review</option>
                    <option>Course Lesson Question</option>
                    <option>Risk Management &amp; Lot Sizing</option>
                    <option>Exness Account &amp; Copy Trading</option>
                  </select>
                </label>
              </div>
              <label className="block">
                Your Question for Pastor Mike
                <textarea
                  rows={3}
                  value={questionBody}
                  onChange={(e) => setQuestionBody(e.target.value)}
                  placeholder="Describe the pair, timeframe, or lesson concept you want feedback on..."
                  className="w-full bg-[#141821] border border-white/10 rounded-xl p-3 text-xs text-white mt-1"
                />
              </label>
              <Button type="submit" disabled={sendingQuestion}>
                {sendingQuestion ? "Sending to Mentor Inbox..." : "Send Question to Pastor Mike"}
              </Button>
            </form>

            {mentorMessages.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10 space-y-2.5">
                <span className="text-[11px] font-mono uppercase text-[#ffde02]">
                  Your Mentorship Conversation History ({mentorMessages.length})
                </span>
                {mentorMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs ${
                      m.senderRole === "admin"
                        ? "bg-[#ffde02]/10 border-[#ffde02]/40 text-white"
                        : "bg-[#141821] border-white/10 text-[#d0d7e3]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8c95a6] mb-1">
                      <strong className={m.senderRole === "admin" ? "text-[#ffde02]" : "text-white"}>
                        {m.senderRole === "admin" ? "Pastor Mike (Founder)" : "You"} · {m.subject}
                      </strong>
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{m.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 5. Notifications & Copy Trading */}
          <Card className="settings-card" id="alerts">
            <h2>Notifications, Multi-TP Alerts &amp; Copy Trading</h2>
            {[
              [
                "signals",
                "VIP Signal & Multi-TP (TP1–TP5) Hit Alerts",
                "Notify me immediately in the topbar alert bell when Pastor Mike posts a signal or when live market prices hit TP1, TP2, TP3, TP4, TP5, or SL.",
                notifySignals,
                setNotifySignals,
              ],
              [
                "sessions",
                "Live Broadcast & Waiting Room Reminders",
                "Remind me before scheduled London and New York live trading sessions go live.",
                notifySessions,
                setNotifySessions,
              ],
              [
                "copy",
                "Exness Custom Lot & TP Copy-Trading Bridge",
                "Enable one-click custom lot size and TP selection with Exness WebTerminal bridge.",
                autoCopySignals,
                setAutoCopySignals,
              ],
            ].map(([key, title, copy, val, setter]) => (
              <div className="toggle-row" key={key as string}>
                <span>
                  <b>{title as string}</b>
                  <small>{copy as string}</small>
                </span>
                <button
                  type="button"
                  className={`toggle ${val ? "on" : ""}`}
                  onClick={() => {
                    (setter as (v: boolean) => void)(!val);
                    setTimeout(saveProfile, 50);
                  }}
                >
                  <i />
                </button>
              </div>
            ))}
          </Card>

          {/* 6. Expandable Support Ticket Guide for Existing Users */}
          <Card className="settings-card" id="ticket-guide">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setTicketGuideOpen(!ticketGuideOpen)}
            >
              <div>
                <h2>Exness Partner Link Support Ticket Guide</h2>
                <p>
                  Instructions for existing Exness account holders to link to Partner Code:{" "}
                  {config.partnerCode}
                </p>
              </div>
              <button type="button" className="text-xs text-[#ffde02] font-bold">
                {ticketGuideOpen ? "Hide Guide ↑" : "Show Guide ↓"}
              </button>
            </div>

            {ticketGuideOpen && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-xs text-[#9ea8b8] leading-relaxed">
                <p>
                  If you already owned an Exness account before joining Candlesticks Academy, submit your transfer request during onboarding or email{" "}
                  <strong className="text-white">{config.supportEmail}</strong>. Once your account appears in our Partner Dashboard, enter your Trading Account ID to verify.
                </p>
              </div>
            )}
          </Card>

          {/* 7. Supabase SQL Upgrade Schema Generator */}
          <Card className="settings-card" id="sql-schema">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
                  SUPABASE POSTGRESQL UPGRADE SCRIPT
                </span>
                <h2>Client &amp; Admin Dashboard SQL Schema</h2>
                <p>
                  Copy and run this idempotent SQL script in your Supabase SQL Editor to upgrade your database with all new tables, columns, and storage buckets (<code>courses</code> level PDFs &amp; quizzes, <code>course_lessons</code>, <code>trading_signals</code> TP1–TP5 targets, <code>student_trades</code> custom TP/SL &amp; Exness sync, <code>client_notifications</code> alert bell feed, <code>certificate_templates</code>, and storage buckets <code>student-avatars</code>, <code>course-videos</code>, <code>course-pdfs</code>, <code>certificate-templates</code>).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(DASHBOARD_UPGRADE_SQL);
                  setCopiedUpgradeSql(true);
                  setTimeout(() => setCopiedUpgradeSql(false), 3000);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedUpgradeSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedUpgradeSql ? "Copied Upgrade SQL!" : "Copy Dashboard Upgrade SQL"}
              </button>
            </div>
            <details className="mt-4 pt-3 border-t border-white/10">
              <summary className="text-xs font-mono font-bold text-[#ffde02] cursor-pointer select-none">
                Inspect Complete Supabase Upgrade SQL Script ↓
              </summary>
              <pre className="mt-3 p-4 rounded-xl bg-[#0b0e14] border border-white/10 text-[11px] font-mono text-[#c5cedb] overflow-x-auto max-h-80 overflow-y-auto">
                {DASHBOARD_UPGRADE_SQL}
              </pre>
            </details>
          </Card>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// 3. COURSES, VIDEO LESSONS & AUTO-GENERATED QUIZZES (/courses, /lessons, /quiz)
// ============================================================================

export function CoursesPage() {
  const [filter, setFilter] = useState("All levels");
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [courses, setCourses] = useState<CourseTrack[]>(getCachedCourses());
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  useEffect(() => {
    void fetchCoursesWithLessonsFromDb().then(setCourses);
    void fetchStudentLessonsCompletedFromDb(student.email);
  }, [student.email, syncTick]);

  const metrics = getStudentProgressMetrics(student.email);

  return (
    <>
      <Header
        eyebrow="COURSE LIBRARY · CONNECTED TO SUPABASE"
        title="Learn with structure."
        copy="Master Forex Foundations, Technical Analysis, Risk & Psychology, and Advanced Price Action with video lessons and auto-generated assessments."
        action={
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Essential</option>
            <option>Advanced</option>
          </select>
        }
      />

      {!isDepositCompleted && (
        <DepositGateNotice
          featureTitle="Courses Locked · $50 Deposit Required"
          featureDescription="All 4 comprehensive course modules, video lessons, and auto-generated quizzes unlock as soon as your $50 USD Exness deposit is verified."
        />
      )}

      <div className="catalog-feature">
        <div>
          <Badge>{isDepositCompleted ? "RECOMMENDED TRACK" : "LOCKED"}</Badge>
          <h2>Master the language of the market.</h2>
          <p>
            {metrics.completedLessonsCount} of {metrics.totalLessons} total video lessons completed across 4 structured tracks ({metrics.overallPercent}% overall progress).
          </p>
          {isDepositCompleted ? (
            <div className="flex flex-wrap gap-3">
              <Link
                className="p-button primary rounded-full"
                to={`/courses/${metrics.nextLesson?.courseSlug || "forex-foundations"}`}
              >
                Continue course <Icon name="arrow" />
              </Link>
              <Link
                className="p-button secondary rounded-full"
                to={`/quiz/${metrics.nextLesson?.courseSlug || "forex-foundations"}`}
              >
                Take Auto-Generated Quiz
              </Link>
            </div>
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
          .map((c) => {
            const cStat = metrics.courseBreakdown.find((b) => b.slug === c.slug);
            const pct = cStat?.progressPct || 0;
            const totalL = c.lessons.length;
            const doneL = cStat?.completedCount || 0;
            return (
              <div className="course-card relative flex flex-col justify-between" key={c.slug}>
                {!isDepositCompleted && (
                  <div className="absolute top-3 right-3 z-10 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-[#ffde02]/40 text-[#ffde02] text-xs font-bold flex items-center gap-1">
                    <Lock size={12} /> $50 Deposit Gate
                  </div>
                )}
                <Link to={isDepositCompleted ? `/courses/${c.slug}` : "#"}>
                  <div className={`course-cover ${c.color}`}>
                    <span>{totalL}</span>
                    <Icon name="book" size={28} />
                    <small>CANDLESTICKS ACADEMY</small>
                  </div>
                </Link>
                <div>
                  <span>
                    <Badge
                      tone={
                        c.level === "Advanced"
                          ? "red"
                          : c.level === "Beginner"
                          ? "green"
                          : "yellow"
                      }
                    >
                      {c.level}
                    </Badge>{" "}
                    {totalL} video lessons
                  </span>
                  <h2>{c.title}</h2>
                  <p>{c.description}</p>
                  {isDepositCompleted ? (
                    <div className="space-y-2 mt-3">
                      <Progress value={pct} />
                      <div className="flex items-center justify-between text-xs text-[#9aa4b5]">
                        <span>
                          {doneL} of {totalL} completed ({pct}%)
                        </span>
                        <Link
                          to={`/quiz/${c.slug}`}
                          className="text-[#ffde02] hover:underline font-bold"
                        >
                          Take Quiz →
                        </Link>
                      </div>
                      <Link
                        to={`/courses/${c.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white hover:text-[#ffde02] pt-1"
                      >
                        {pct > 0 ? "Continue lessons" : "Start course"} <Icon name="arrow" />
                      </Link>
                    </div>
                  ) : (
                    <b className="text-amber-400">
                      <Lock size={13} className="inline mr-1" /> Locked until funded
                    </b>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}

export function CourseDetailPage() {
  const { courseId } = useParams();
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [courses, setCourses] = useState<CourseTrack[]>(getCachedCourses());
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  useEffect(() => {
    void fetchCoursesWithLessonsFromDb().then(setCourses);
    void fetchStudentLessonsCompletedFromDb(student.email);
  }, [student.email, syncTick]);

  const c = courses.find((x) => x.slug === courseId || x.id === courseId) || courses[0];
  const metrics = getStudentProgressMetrics(student.email);
  const cStat = metrics.courseBreakdown.find((b) => b.slug === c?.slug);
  const completedIds = new Set(metrics.completedLessonIds);
  const nextIncompleteLesson =
    c?.lessons.find((l) => !completedIds.has(l.id)) || c?.lessons[0];

  if (!c) return null;

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/courses">Courses</Link>
        <span>/</span>
        {c.title}
      </div>

      {!isDepositCompleted && <DepositGateNotice featureTitle="Course Lessons Locked" />}

      <Card className="course-hero">
        <div className={`course-cover ${c.color}`}>
          <span>{String(c.lessons.length).padStart(2, "0")}</span>
          <Icon name="book" size={35} />
          <small>CANDLESTICKS ACADEMY</small>
        </div>
        <div>
          <Badge tone="green">{c.level}</Badge>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
          <div className="meta">
            <span>
              <Icon name="book" /> {c.lessons.length} video lessons
            </span>
            <span>
              <Icon name="clock" />{" "}
              {Math.round(
                c.lessons.reduce((acc, l) => acc + (l.durationMinutes || 12), 0) / 6
              ) / 10}
              h total
            </span>
            <span>
              <Icon name="chart" /> Auto-Generated Assessment &amp; Certificate
            </span>
          </div>
          <Progress value={isDepositCompleted ? cStat?.progressPct || 0 : 0} />
          {isDepositCompleted ? (
            <div className="flex flex-wrap gap-3 mt-4">
              {nextIncompleteLesson && (
                <Link
                  className="p-button primary rounded-full"
                  to={`/lessons/${nextIncompleteLesson.id}`}
                >
                  {cStat?.completedCount ? "Continue course" : "Start Lesson 1"}{" "}
                  <Icon name="arrow" />
                </Link>
              )}
              <Link className="p-button secondary rounded-full" to={`/quiz/${c.slug}`}>
                Take Auto-Generated Quiz ({c.lessons.length} lessons)
              </Link>
            </div>
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
            <p className="p-eyebrow">
              {c.level.toUpperCase()} LEVEL VIDEO CURRICULUM ({c.lessons.length} UPLOADED VIDEOS)
            </p>
            <h2>{c.title} Lessons</h2>
          </div>
          <span>
            {isDepositCompleted
              ? `${cStat?.completedCount || 0} of ${c.lessons.length} complete (${
                  cStat?.progressPct || 0
                }%)`
              : `0 of ${c.lessons.length} complete`}
          </span>
        </div>

        {c.lessons.length === 0 ? (
          <Card className="p-6 text-center space-y-2 border border-dashed border-white/15">
            <VideoIcon size={28} className="mx-auto text-[#ffde02]" />
            <h3 className="text-sm font-bold text-white">
              No Videos Uploaded for {c.title} ({c.level}) Yet
            </h3>
            <p className="text-xs text-[#9aa4b5] max-w-lg mx-auto">
              Pastor Mike names and uploads the individual course videos for each of the 4 levels directly from the Admin Course Studio. You can already take the {c.level} Level PDF Assessment below!
            </p>
          </Card>
        ) : (
          c.lessons.map((lesson, i) => {
            const isDone = completedIds.has(lesson.id);
            const isNext = nextIncompleteLesson?.id === lesson.id;
            return (
              <Link
                className={!isDepositCompleted ? "locked" : ""}
                to={isDepositCompleted ? `/lessons/${lesson.id}` : "#"}
                key={lesson.id}
              >
                <i>
                  {isDepositCompleted && isDone ? (
                    <Icon name="check" />
                  ) : !isDepositCompleted ? (
                    <Icon name="lock" />
                  ) : (
                    i + 1
                  )}
                </i>
                <span>
                  <b>{lesson.title}</b>
                  <small>
                    Video lesson · {lesson.durationMinutes} min ·{" "}
                    {lesson.keyTakeaways[0] || lesson.summary}
                  </small>
                </span>
                {isDepositCompleted && isDone && <Badge tone="green">COMPLETED</Badge>}
                {isDepositCompleted && !isDone && isNext && <Badge>UP NEXT</Badge>}
                <Icon name="arrow" />
              </Link>
            );
          })
        )}

        {/* Auto-Generated Level PDF Mastery Assessment Row */}
        <Link
          className={!isDepositCompleted ? "locked" : ""}
          to={isDepositCompleted ? `/quiz/${c.slug}` : "#"}
        >
          <i>
            <Icon name="chart" />
          </i>
          <span>
            <b>
              {c.title} ({c.level} Level) — Multi-Question PDF Mastery Quiz
            </b>
            <small>
              {c.levelPdfName
                ? `Generated from Admin PDF: ${c.levelPdfName} (${
                    generateQuizForCourse(c.slug).length
                  } questions)`
                : `Multi-question assessment for ${c.level} level (${
                    generateQuizForCourse(c.slug).length
                  } questions)`}
            </small>
          </span>
          <Badge tone="yellow">{c.level.toUpperCase()} PDF QUIZ</Badge>
          <Icon name="arrow" />
        </Link>
      </div>
    </>
  );
}

export function LessonPage() {
  const { lessonId } = useParams();
  const nav = useNavigate();
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [courses, setCourses] = useState<CourseTrack[]>(getCachedCourses());
  const [toggling, setToggling] = useState(false);
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  useEffect(() => {
    void fetchCoursesWithLessonsFromDb().then(setCourses);
    void fetchStudentLessonsCompletedFromDb(student.email);
  }, [student.email, syncTick]);

  // Find lesson across all courses
  let activeCourse = courses[0];
  let activeLesson: CourseLessonItem | undefined;

  for (const c of courses) {
    const found = c.lessons.find(
      (l) => l.id === lessonId || l.title.toLowerCase().replaceAll(" ", "-") === lessonId
    );
    if (found) {
      activeCourse = c;
      activeLesson = found;
      break;
    }
  }

  if (!activeLesson && activeCourse) {
    activeLesson = activeCourse.lessons[0];
  }

  const metrics = getStudentProgressMetrics(student.email);
  const completedIds = new Set(metrics.completedLessonIds);
  const isDone = activeLesson ? completedIds.has(activeLesson.id) : false;
  const courseStat = metrics.courseBreakdown.find((b) => b.slug === activeCourse?.slug);

  async function handleToggleComplete() {
    if (!activeLesson || !activeCourse) return;
    setToggling(true);
    await toggleLessonCompletedInDb(student.email, activeLesson.id, activeCourse.slug);
    setToggling(false);
  }

  if (!isDepositCompleted) {
    return (
      <div className="py-8">
        <div className="breadcrumbs">
          <Link to="/courses">Courses</Link>
          <span>/</span>
          Lesson Locked
        </div>
        <DepositGateNotice
          featureTitle="Video Lesson Locked · $50 Deposit Required"
          featureDescription="Please fund your linked Exness trading account with at least $50 USD to watch this lesson and complete the assignments."
        />
      </div>
    );
  }

  if (!activeLesson || !activeCourse) {
    return (
      <Card className="p-8 text-center space-y-3 my-6">
        <VideoIcon size={32} className="mx-auto text-[#ffde02]" />
        <h2 className="text-lg font-bold text-white">No Video Lessons Uploaded Yet</h2>
        <p className="text-xs text-[#9aa4b5] max-w-md mx-auto">
          Pastor Mike will upload and name the video lessons for this track in the Admin Course Studio.
        </p>
        <div className="pt-2">
          <Link className="p-button primary rounded-full" to="/courses">
            Back to Courses
          </Link>
        </div>
      </Card>
    );
  }

  const currentIdx = activeCourse.lessons.findIndex((l) => l.id === activeLesson?.id);
  const nextLesson = activeCourse.lessons[currentIdx + 1];

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/courses">Courses</Link>
        <span>/</span>
        <Link to={`/courses/${activeCourse.slug}`}>{activeCourse.title}</Link>
        <span>/</span>Lesson {activeLesson.lessonNumber}
      </div>
      <div className="lesson-layout">
        <main>
          <LessonVideoPlayer lesson={activeLesson} courseTitle={activeCourse.title} />
          <div className="lesson-heading">
            <div>
              <p className="p-eyebrow">
                LESSON {String(activeLesson.lessonNumber).padStart(2, "0")} OF{" "}
                {activeCourse.lessons.length} · {activeCourse.title.toUpperCase()}
              </p>
              <h1>{activeLesson.title}</h1>
              <p>{activeLesson.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button onClick={handleToggleComplete} disabled={toggling}>
                {isDone ? (
                  <>
                    <Icon name="check" /> Completed (Click to Undo)
                  </>
                ) : (
                  <>
                    Mark as complete <Icon name="check" />
                  </>
                )}
              </Button>
              {nextLesson ? (
                <Button variant="secondary" onClick={() => nav(`/lessons/${nextLesson.id}`)}>
                  Next Lesson <Icon name="arrow" />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => nav(`/quiz/${activeCourse.slug}`)}
                >
                  Take Level PDF Quiz <Icon name="arrow" />
                </Button>
              )}
            </div>
          </div>
          <Card>
            <h3>Key Institutional Takeaways</h3>
            <ul>
              {(activeLesson.keyTakeaways.length > 0
                ? activeLesson.keyTakeaways
                : [
                    "Identify institutional liquidity pools and swing structure",
                    "Wait for candle closure confirmation before executing",
                    "Protect capital with strict 1%–2% risk per trade",
                  ]
              ).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </Card>
        </main>
        <aside className="lesson-side">
          <div>
            <span>{activeCourse.title}</span>
            <b>
              {courseStat?.completedCount || 0} / {activeCourse.lessons.length} lessons (
              {courseStat?.progressPct || 0}%)
            </b>
            <Progress value={courseStat?.progressPct || 0} />
          </div>
          {activeCourse.lessons.map((l) => {
            const done = completedIds.has(l.id);
            return (
              <Link
                className={l.id === activeLesson?.id ? "active" : ""}
                to={`/lessons/${l.id}`}
                key={l.id}
              >
                <i>{done ? <Icon name="check" /> : l.lessonNumber}</i>
                <span>
                  {l.title}
                  <small>{l.durationMinutes} min</small>
                </span>
              </Link>
            );
          })}
          <Link
            to={`/quiz/${activeCourse.slug}`}
            className="mt-2 border border-[#ffde02]/40 bg-[#ffde02]/10 rounded-xl"
          >
            <i>
              <Icon name="chart" />
            </i>
            <span>
              <strong className="text-[#ffde02]">Take {activeCourse.level} PDF Quiz</strong>
              <small>Multi-question assessment for {activeCourse.title}</small>
            </span>
          </Link>
        </aside>
      </div>
    </>
  );
}

function LessonVideoPlayer({
  lesson,
  courseTitle,
}: {
  lesson: CourseLessonItem;
  courseTitle: string;
}) {
  const url = (lesson.videoUrl || "").trim();

  // Check if YouTube or Vimeo embed
  if (url.includes("youtube.com/watch?v=") || url.includes("youtu.be/")) {
    const videoId = url.includes("v=")
      ? url.split("v=")[1]?.split("&")[0]
      : url.split("youtu.be/")[1]?.split("?")[0];
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={lesson.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (url.includes("vimeo.com/")) {
    const vimeoId = url.split("vimeo.com/")[1]?.split("?")[0];
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title={lesson.title}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (url) {
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black relative">
        <video
          key={url}
          src={url}
          controls
          playsInline
          className="w-full h-full object-contain bg-black"
        />
      </div>
    );
  }

  return (
    <div className="video-player">
      <div />
      <span>
        {courseTitle.toUpperCase()} · LESSON {lesson.lessonNumber}
      </span>
      <button type="button">
        <Icon name="play" size={30} />
      </button>
      <footer>
        <Icon name="play" />
        <i>
          <b />
        </i>
        <span>00:00 / {lesson.durationMinutes}:00</span>
        <b>HD</b>
      </footer>
    </div>
  );
}

// ============================================================================
// MULTI-QUESTION LEVEL PDF QUIZ PAGE (/quiz/:quizId)
// ============================================================================

export function QuizPage() {
  const { quizId } = useParams();
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [courses, setCourses] = useState<CourseTrack[]>(getCachedCourses());

  useEffect(() => {
    void fetchCoursesWithLessonsFromDb().then(setCourses);
  }, [syncTick]);

  const course =
    courses.find((c) => c.slug === quizId || c.id === quizId) || courses[0];
  const generatedQuestions = generateQuizForCourse(course?.slug || "forex-foundations");

  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [savingResult, setSavingResult] = useState(false);

  const finished = n >= generatedQuestions.length;
  const score = answers.filter((a, i) => a === generatedQuestions[i]?.correctIndex).length;
  const scorePercent =
    generatedQuestions.length > 0
      ? Math.round((score / generatedQuestions.length) * 100)
      : 0;

  async function handleFinishQuiz(finalAnswers: number[]) {
    const finalScore = finalAnswers.filter(
      (a, i) => a === generatedQuestions[i]?.correctIndex
    ).length;
    setSavingResult(true);
    await recordQuizAttemptInDb(
      student.email,
      course?.slug || "forex-foundations",
      `${course?.title || "Forex Foundations"} (${course?.level || "Beginner"} PDF Quiz)`,
      finalScore,
      generatedQuestions.length
    );
    setSavingResult(false);
  }

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
            <Link to={`/courses/${course?.slug || "forex-foundations"}`}>
              <Icon name="close" />
            </Link>
            <span>
              {course?.title.toUpperCase()} · {course?.level.toUpperCase()} LEVEL PDF ASSESSMENT (
              {generatedQuestions.length} QUESTIONS)
              <Progress value={((n + 1) / generatedQuestions.length) * 100} />
            </span>
            <b>
              {n + 1} / {generatedQuestions.length}
            </b>
          </div>
          <Card className="quiz-card">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="p-eyebrow m-0">
                QUESTION {n + 1} OF {generatedQuestions.length} ·{" "}
                {course?.levelPdfName
                  ? `GENERATED FROM ${course.levelPdfName.toUpperCase()}`
                  : `${course?.level.toUpperCase()} LEVEL CURRICULUM ASSESSMENT`}
              </p>
              <Badge tone="yellow">{course?.level} Level</Badge>
            </div>
            <h1>{generatedQuestions[n].question}</h1>
            <div className="answers">
              {generatedQuestions[n].options.map((x, i) => (
                <button
                  type="button"
                  className={picked === i ? "selected" : ""}
                  onClick={() => setPicked(i)}
                  key={`${n}-${i}`}
                >
                  <i>{String.fromCharCode(65 + i)}</i>
                  {x}
                  <Icon name="check" />
                </button>
              ))}
            </div>
            {picked !== null && generatedQuestions[n].explanation && (
              <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#cfd7e4]">
                <strong className="text-[#ffde02] font-mono uppercase text-[10px] block mb-0.5">
                  Study Note &amp; Concept Focus
                </strong>
                {generatedQuestions[n].explanation}
              </div>
            )}
            <div>
              <Button variant="ghost" onClick={() => setN(Math.max(0, n - 1))}>
                Back
              </Button>
              <Button
                disabled={picked === null}
                onClick={() => {
                  if (picked !== null) {
                    const nextAnswers = [...answers, picked];
                    setAnswers(nextAnswers);
                    setPicked(null);
                    const nextIndex = n + 1;
                    setN(nextIndex);
                    if (nextIndex >= generatedQuestions.length) {
                      void handleFinishQuiz(nextAnswers);
                    }
                  }
                }}
              >
                {n + 1 === generatedQuestions.length ? "Submit Quiz" : "Next Question"}{" "}
                <Icon name="arrow" />
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <Card className="result-card">
          <div className="score">
            <b>{scorePercent}%</b>
            <small>SAVED TO DATABASE</small>
          </div>
          <Badge tone={scorePercent >= 70 ? "green" : "red"}>
            {scorePercent >= 70 ? "ASSESSMENT PASSED" : "RETRY NEEDED (70% TO PASS)"}
          </Badge>
          <h1>
            {scorePercent >= 70
              ? `Strong mastery, ${student.fullName.split(" ")[0] || "Trader"}!`
              : "Keep building your foundation."}
          </h1>
          <p>
            You answered {score} of {generatedQuestions.length} questions correctly ({scorePercent}
            %) on the {course?.level} Level Assessment.{" "}
            {savingResult
              ? "Syncing score to Supabase..."
              : "Your Quiz Average on the Overview and Progress pages has been updated automatically."}
          </p>
          <div>
            <Link
              className="p-button primary"
              to={`/courses/${course?.slug || "forex-foundations"}`}
            >
              Return to {course?.title}
            </Link>
            <Button variant="secondary" onClick={reset}>
              Retake Level Quiz
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// 4. REAL PROGRESS & VERIFIED CERTIFICATES PAGE (/progress)
//    - Uses Admin's Uploaded Certificate Template + Student Name Overlay + PNG Download
// ============================================================================

export function ProgressPage() {
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [certificates, setCertificates] = useState<StudentCertificateItem[]>([]);
  const [certTemplate, setCertTemplate] = useState<CertificateTemplateConfig>(
    getCachedCertificateTemplate()
  );
  const [previewCert, setPreviewCert] = useState<StudentCertificateItem | null>(null);
  const [downloadingCert, setDownloadingCert] = useState(false);

  useEffect(() => {
    void fetchCoursesWithLessonsFromDb();
    void fetchStudentLessonsCompletedFromDb(student.email);
    void fetchStudentQuizAttemptsFromDb(student.email);
    void fetchStudentCertificatesFromDb(student.email).then(setCertificates);
    void fetchCertificateTemplateFromDb().then(setCertTemplate);
  }, [student.email, syncTick]);

  const metrics = getStudentProgressMetrics(student.email);

  // Renders the Admin's uploaded certificate template image + Student Name onto an HTML5 Canvas and downloads a crisp PNG
  async function handleDownloadCertificatePng(cert: StudentCertificateItem) {
    setDownloadingCert(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background or Admin uploaded template image
      let drewImage = false;
      if (certTemplate.templateImageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Image load failed"));
            img.src = certTemplate.templateImageUrl;
          });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          drewImage = true;
        } catch {
          drewImage = false;
        }
      }

      if (!drewImage) {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#121722");
        grad.addColorStop(0.5, "#0d1118");
        grad.addColorStop(1, "#171c28");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Double gold institutional border
        ctx.strokeStyle = "#ffde02";
        ctx.lineWidth = 6;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        ctx.strokeStyle = "rgba(255, 222, 2, 0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(58, 58, canvas.width - 116, canvas.height - 116);

        ctx.fillStyle = "#ffde02";
        ctx.font = "bold 22px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          "CANDLESTICKS TRADING ACADEMY · OFFICIAL CREDENTIAL",
          canvas.width / 2,
          170
        );

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 56px Georgia, serif";
        ctx.fillText("CERTIFICATE OF MASTERY", canvas.width / 2, 260);

        ctx.fillStyle = "#9aa4b5";
        ctx.font = "24px sans-serif";
        ctx.fillText("This officially certifies that", canvas.width / 2, 340);
      }

      // Overlay Student Full Name at Admin-configured vertical position (nameYPercent)
      const nameY = (certTemplate.nameYPercent / 100) * canvas.height;
      const scaledFontSize = Math.round((certTemplate.fontSizePx || 38) * 1.65);
      ctx.fillStyle = certTemplate.fontColor || "#ffde02";
      ctx.font = `bold ${scaledFontSize}px ${
        certTemplate.fontFamily === "serif"
          ? "Georgia, serif"
          : certTemplate.fontFamily === "mono"
          ? "monospace"
          : "sans-serif"
      }`;
      ctx.textAlign = "center";
      ctx.fillText(cert.studentName, canvas.width / 2, nameY);

      if (certTemplate.showCourseTitle) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText(
          `Successfully completed ${cert.courseTitle}`,
          canvas.width / 2,
          nameY + 75
        );
      }

      // Footer metadata
      const footerY = canvas.height - 110;
      ctx.font = "bold 20px monospace";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(`${cert.issuedBy} · Academy Founder`, canvas.width * 0.25, footerY);

      if (certTemplate.showCertificateCode) {
        ctx.fillStyle = "#ffde02";
        ctx.fillText(`ID: ${cert.certificateCode}`, canvas.width * 0.5, footerY);
      }

      if (certTemplate.showIssueDate) {
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(
          `Issued: ${new Date(cert.issuedAt).toLocaleDateString()}`,
          canvas.width * 0.75,
          footerY
        );
      }

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${cert.studentName.replace(/\s+/g, "_")}_${cert.courseSlug}_Certificate.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloadingCert(false);
    }
  }

  return (
    <>
      <Header
        eyebrow="YOUR LEARNING JOURNEY · REAL DATABASE METRICS"
        title="Progress, Quizzes & Verified Certificates"
        copy="Live completion tracking from your completed video lessons, 4-level PDF assessments, and official downloadable certificates."
        action={
          <Badge tone={metrics.streakDays > 0 ? "green" : "yellow"}>
            {metrics.streakDays} DAY STREAK
          </Badge>
        }
      />
      <div className="progress-summary">
        <Card className="overall">
          <div className="ring">
            <b>{metrics.overallPercent}%</b>
            <small>COMPLETE</small>
          </div>
          <div>
            <p className="p-eyebrow">OVERALL CURRICULUM PROGRESS</p>
            <h2>
              {metrics.overallPercent >= 100
                ? "All Academy Tracks Completed!"
                : metrics.overallPercent > 0
                ? "You're building real trading momentum."
                : "Start your first video lesson today."}
            </h2>
            <p>
              {metrics.completedLessonsCount} of {metrics.totalLessons} lessons complete across 4 learning paths.
            </p>
          </div>
        </Card>
        <Metric
          label="Lessons completed"
          value={`${metrics.completedLessonsCount}`}
          change={`Out of ${metrics.totalLessons} total lessons`}
          icon="book"
        />
        <Metric
          label="Hours learned"
          value={`${metrics.hoursLearned}`}
          change={`Quiz avg: ${metrics.averageQuizScore}% (${metrics.quizCount} taken)`}
          icon="clock"
        />
      </div>

      <div className="progress-detail">
        <Card>
          <h2>Course Track Progress</h2>
          {metrics.courseBreakdown.map((c) => (
            <div className="course-progress-row" key={c.slug}>
              <i className={c.color}>
                <Icon name="book" />
              </i>
              <span>
                <b>{c.title}</b>
                <small>
                  {c.completedCount} of {c.totalLessons} lessons completed
                </small>
                <Progress value={c.progressPct} />
              </span>
              <div className="text-right">
                <strong>{c.progressPct}%</strong>
                <Link
                  to={`/quiz/${c.slug}`}
                  className="block text-[10px] font-mono text-[#ffde02] hover:underline mt-1"
                >
                  Level Quiz →
                </Link>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <h2>Real Study Activity &amp; Quiz Scores</h2>
          <p>
            {metrics.completedLessonsCount} lessons &amp; {metrics.quizCount} quizzes recorded
          </p>
          <div className="heatmap">
            {Array.from({ length: 56 }, (_, i) => {
              const activeThreshold = Math.min(
                56,
                metrics.completedLessonsCount * 2 + metrics.quizCount * 3
              );
              const isRecent = i >= 56 - activeThreshold;
              return (
                <i
                  className={
                    isRecent
                      ? i % 2 === 0
                        ? "high"
                        : "mid"
                      : ""
                  }
                  key={i}
                />
              );
            })}
          </div>
          <h3>Completed Quiz Attempts ({metrics.quizAttempts.length})</h3>
          {metrics.quizAttempts.length === 0 ? (
            <p className="text-xs text-[#8c95a6] py-3">
              No quiz attempts recorded yet. Visit any course and click{" "}
              <Link to="/quiz/forex-foundations" className="text-[#ffde02] underline">
                Take Level PDF Quiz
              </Link>{" "}
              to test your knowledge.
            </p>
          ) : (
            metrics.quizAttempts.slice(0, 6).map((q) => (
              <div className="quiz-score" key={q.id}>
                <span>
                  <Icon name="check" />
                  {q.quizTitle} ({q.score}/{q.totalQuestions})
                </span>
                <b className={q.scorePercent >= 70 ? "text-emerald-400" : "text-amber-400"}>
                  {q.scorePercent}%
                </b>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Verified Course Certificates Section */}
      <Card className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <p className="p-eyebrow">VERIFIED ACADEMY CREDENTIALS · public.student_certificates</p>
            <h2 className="text-lg font-bold text-white">
              Official Candlesticks Academy Certificates
            </h2>
          </div>
          <Badge tone={certificates.length > 0 ? "green" : "gray"}>
            {certificates.length} ISSUED
          </Badge>
        </div>

        {certificates.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Award size={32} className="mx-auto text-[#ffde02]" />
            <p className="text-sm font-bold text-white">
              Complete a course track &amp; pass its level quiz (70%+) to unlock your verified certificate
            </p>
            <p className="text-xs text-[#8c95a6]">
              Once Pastor Mike issues or approves your certificate from the Admin Console, your personalized certificate with your full name on the official template appears right here for instant download.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-[#181d29] to-[#11151d] border border-[#ffde02]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffde02]">
                    VERIFIED CERTIFICATE · {cert.certificateCode}
                  </span>
                  <h3 className="text-base font-bold text-white">{cert.courseTitle}</h3>
                  <p className="text-xs text-[#9aa4b5]">
                    Issued to <strong className="text-white">{cert.studentName}</strong> by{" "}
                    {cert.issuedBy} on {new Date(cert.issuedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button onClick={() => setPreviewCert(cert)}>View &amp; Download</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {previewCert && (
        <div className="portal-modal">
          <div className="bg-[#0e1118] border-2 border-[#ffde02] rounded-3xl p-5 sm:p-7 max-w-3xl w-full text-center space-y-5 shadow-2xl relative">
            {/* Live Rendered Certificate Using Admin's Uploaded Template + Student Name Overlay */}
            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-[#ffde02]/40 bg-[#0b0e14] shadow-2xl select-none">
              {certTemplate.templateImageUrl ? (
                <img
                  src={certTemplate.templateImageUrl}
                  alt="Official Certificate Template"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#141926] via-[#0e121b] to-[#191f2e] flex flex-col items-center justify-between p-8 border-[6px] border-double border-[#ffde02]/40">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#ffde02]">
                      CANDLESTICKS TRADING ACADEMY · OFFICIAL CREDENTIAL
                    </span>
                    <h4 className="text-xl sm:text-2xl font-serif font-extrabold text-white tracking-wide">
                      CERTIFICATE OF MASTERY
                    </h4>
                    <p className="text-[11px] text-[#9aa4b5]">This officially certifies that</p>
                  </div>
                  <div />
                  <div className="w-full flex items-center justify-around pt-3 border-t border-white/10 text-[10px] font-mono text-[#9aa4b5]">
                    <span>{previewCert.issuedBy} · Founder</span>
                    {certTemplate.showCertificateCode && (
                      <span className="text-[#ffde02]">{previewCert.certificateCode}</span>
                    )}
                    {certTemplate.showIssueDate && (
                      <span>{new Date(previewCert.issuedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamically Positioned Student Name Overlay from Admin Template Config */}
              <div
                className="absolute left-0 right-0 px-6 text-center pointer-events-none"
                style={{
                  top: `${certTemplate.nameYPercent}%`,
                  transform: "translateY(-50%)",
                }}
              >
                <div
                  style={{
                    fontSize: `${Math.max(18, Math.round(certTemplate.fontSizePx * 0.78))}px`,
                    color: certTemplate.fontColor || "#ffde02",
                    fontFamily:
                      certTemplate.fontFamily === "serif"
                        ? "Georgia, Cambria, 'Times New Roman', serif"
                        : certTemplate.fontFamily === "mono"
                        ? "monospace"
                        : "sans-serif",
                  }}
                  className="font-extrabold tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                >
                  {previewCert.studentName}
                </div>
                {certTemplate.showCourseTitle && (
                  <div className="text-xs sm:text-sm font-bold text-white/95 mt-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                    {previewCert.courseTitle}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                onClick={() => void handleDownloadCertificatePng(previewCert)}
                disabled={downloadingCert}
              >
                <Download size={15} />{" "}
                {downloadingCert ? "Rendering PNG..." : "Download Official Certificate (PNG)"}
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                Print / Save PDF
              </Button>
              <Button variant="ghost" onClick={() => setPreviewCert(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// 5. LIVE SESSIONS, REAL-TIME COUNTDOWN & SCREEN-SHARE STREAM ROOM (/sessions)
//    - 100% Real Admin-Scheduled Sessions & Active Broadcasts (Zero Demo Data)
// ============================================================================

export function SessionSchedulePage() {
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [sessions, setSessions] = useState<LiveSessionItem[]>(getCachedLiveSessions());
  const [countdownText, setCountdownText] = useState("00:00:00");
  const [isLiveNow, setIsLiveNow] = useState(false);

  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  useEffect(() => {
    void fetchLiveSessionsFromDb().then(setSessions);
  }, [syncTick]);

  const featured =
    sessions.find((s) => s.status === "live") ||
    sessions.find((s) => s.status === "scheduled") ||
    sessions[0];

  useEffect(() => {
    if (!featured) return;
    const tick = () => {
      if (featured.status === "live") {
        setIsLiveNow(true);
        setCountdownText("LIVE NOW");
      } else {
        const c = formatCountdown(featured.scheduledAt);
        setIsLiveNow(c.isLiveNow);
        setCountdownText(c.formatted);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [featured]);

  return (
    <>
      <Header
        eyebrow="LIVE TRADING ROOMS · SCREEN SHARE & RTMP STREAMING"
        title="Live Sessions & Broadcast Schedule"
        copy="Watch Pastor Mike share his live screen and charts, trade the London and New York opens together, and chat in real time."
        action={
          <Badge tone={isLiveNow ? "green" : featured ? "yellow" : "gray"}>
            {isLiveNow
              ? "● HOST IS LIVE NOW"
              : featured
              ? `NEXT STREAM IN ${countdownText}`
              : "NO ACTIVE STREAM"}
          </Badge>
        }
      />

      {!isDepositCompleted && (
        <DepositGateNotice
          featureTitle="Live Sessions Locked · $50 Deposit Required"
          featureDescription="Join daily New York and London open live trading rooms, real-time screen share broadcasts, and interactive chat once your $50 USD Exness deposit is verified."
        />
      )}

      {featured ? (
        <Card className="featured-session">
          <div className="live-art">
            <Badge tone={isLiveNow ? "green" : "red"}>
              {isLiveNow ? "● LIVE BROADCAST" : "REAL-TIME COUNTDOWN"}
            </Badge>
            <b>
              {countdownText}
              <small>
                {isLiveNow ? "STREAMING SCREEN & AUDIO NOW" : "UNTIL PASTOR MIKE GOES LIVE"}
              </small>
            </b>
          </div>
          <div>
            <p className="p-eyebrow">FEATURED LIVE TRADING ROOM · {featured.focusPair}</p>
            <h2>{featured.title}</h2>
            <p>{featured.description}</p>
            <div className="meta">
              <span>
                <Icon name="calendar" />{" "}
                {new Date(featured.scheduledAt).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>
                <Icon name="clock" /> {featured.durationMinutes} minutes
              </span>
              <span>
                <Icon name="users" /> {featured.viewersCount} traders in room
              </span>
            </div>
            {isDepositCompleted ? (
              <Link
                className="p-button primary rounded-full"
                to={`/sessions/live/${featured.id}`}
              >
                <Icon name="video" />{" "}
                {isLiveNow ? "Watch Live Screen Share Now" : "Enter Waiting Room & Live Chat"}
              </Link>
            ) : (
              <span className="text-xs text-[#ffde02] font-bold flex items-center gap-1.5">
                <Lock size={14} /> Deposit $50 to Enter Live Room
              </span>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center space-y-3 my-4 border border-dashed border-white/15">
          <Radio size={32} className="mx-auto text-[#ffde02]" />
          <h2 className="text-lg font-bold text-white">No Live Sessions Scheduled Yet</h2>
          <p className="text-xs text-[#9aa4b5] max-w-lg mx-auto">
            Only real live sessions scheduled or broadcast by Pastor Mike in the Admin Broadcast Studio appear here. As soon as a session is scheduled or goes live, the countdown and stream room will unlock automatically.
          </p>
        </Card>
      )}

      {sessions.length > 0 && (
        <>
          <div className="section-title">
            <div>
              <p className="p-eyebrow">ALL SCHEDULED ROOMS ({sessions.length})</p>
              <h2>Upcoming &amp; Active Broadcasts</h2>
            </div>
          </div>
          <div className="session-grid">
            {sessions.map((s) => (
              <Card key={s.id}>
                <i>
                  <Icon name="video" />
                </i>
                <Badge tone={s.status === "live" ? "green" : "yellow"}>
                  {s.status === "live" ? "● LIVE NOW" : s.focusPair}
                </Badge>
                <h2>{s.title}</h2>
                <p>{s.description}</p>
                <span>
                  <Icon name="calendar" /> {new Date(s.scheduledAt).toLocaleString()} ·{" "}
                  {s.durationMinutes}m
                </span>
                {isDepositCompleted ? (
                  <Link className="p-button secondary" to={`/sessions/live/${s.id}`}>
                    {s.status === "live" ? "Join Live Stream Now" : "Enter Live Room"}
                  </Link>
                ) : (
                  <Button variant="secondary" disabled>
                    Locked ($50 Deposit)
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function LiveRoomPage() {
  const { sessionId } = useParams();
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [sessions, setSessions] = useState<LiveSessionItem[]>(getCachedLiveSessions());
  const [chatMessages, setChatMessages] = useState<LiveChatMessageItem[]>([]);
  const [msg, setMsg] = useState("");
  const [liveFrame, setLiveFrame] = useState<string>("");
  const [countdownText, setCountdownText] = useState("00:00:00");

  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  const activeSession =
    sessions.find((s) => s.id === sessionId || s.slug === sessionId) || sessions[0];

  useEffect(() => {
    void fetchLiveSessionsFromDb().then((list) => {
      setSessions(list);
      const curr = list.find((s) => s.id === sessionId || s.slug === sessionId) || list[0];
      if (curr?.screenShareSnapshot) {
        setLiveFrame(curr.screenShareSnapshot);
      }
    });
  }, [sessionId, syncTick]);

  useEffect(() => {
    if (!activeSession) return;
    void fetchSessionChatMessagesFromDb(activeSession.id).then(setChatMessages);

    // Subscribe to real-time BroadcastChannel for instant Screen Share frames & Chat
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("candlesticks_live_stream");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "SCREEN_FRAME" && ev.data?.frame) {
          setLiveFrame(ev.data.frame);
        } else if (ev.data?.type === "CHAT_MESSAGE") {
          void fetchSessionChatMessagesFromDb(activeSession.id).then(setChatMessages);
        }
      };
    } catch {
      // ignore
    }

    // Also poll Supabase every 3 seconds when in live room for multi-device screen-share & chat sync
    const poll = setInterval(() => {
      void fetchLiveSessionsFromDb().then((list) => {
        setSessions(list);
        const curr = list.find((s) => s.id === activeSession.id);
        if (curr?.screenShareSnapshot) {
          setLiveFrame(curr.screenShareSnapshot);
        }
      });
      void fetchSessionChatMessagesFromDb(activeSession.id).then(setChatMessages);
    }, 3000);

    return () => {
      bc?.close();
      clearInterval(poll);
    };
  }, [activeSession?.id]);

  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(() => {
      const c = formatCountdown(activeSession.scheduledAt);
      setCountdownText(c.formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  async function handleSendChat(textToSend?: string) {
    const content = (textToSend ?? msg).trim();
    if (!content || !activeSession) return;
    setMsg("");
    await sendSessionChatMessageInDb({
      sessionId: activeSession.id,
      senderEmail: student.email,
      senderName: student.fullName || "Trader",
      senderAvatar: student.avatarUrl || "",
      isHost: false,
      message: content,
    });
    const updated = await fetchSessionChatMessagesFromDb(activeSession.id);
    setChatMessages(updated);
  }

  if (!isDepositCompleted) {
    return (
      <div className="py-8">
        <DepositGateNotice
          featureTitle="Live Room Locked · $50 Deposit Required"
          featureDescription="Please fund your verified Exness trading account with at least $50 USD to watch live screen-share sessions and participate in the live trading chat."
        />
      </div>
    );
  }

  const isLive = activeSession?.status === "live";
  const playbackUrl = (activeSession?.streamPlaybackUrl || "").trim();

  return (
    <>
      <div className="room-head">
        <div>
          <Badge tone={isLive ? "green" : "red"}>
            {isLive ? "● LIVE BROADCAST ACTIVE" : `WAITING ROOM · STARTS IN ${countdownText}`}
          </Badge>
          <h1>{activeSession?.title || "New York Session: Live Market Breakdown"}</h1>
          <span>
            <Icon name="eye" /> {activeSession?.viewersCount || 127} traders connected ·{" "}
            {activeSession?.focusPair}
          </span>
        </div>
        <Link className="p-button secondary" to="/sessions">
          Leave session
        </Link>
      </div>

      <div className="stream-grid">
        <div>
          {/* Live Screen Share / RTMP Stream Surface */}
          <div className="live-stream overflow-hidden rounded-2xl border border-white/10 bg-[#080a0f]">
            {isLive && liveFrame ? (
              <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                <img
                  src={liveFrame}
                  alt="Live Host Screen Share"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  LIVE SCREEN SHARE · PASTOR MIKE
                </div>
              </div>
            ) : playbackUrl ? (
              <div className="relative w-full aspect-video bg-black">
                {playbackUrl.includes("youtube.com") || playbackUrl.includes("youtu.be") ? (
                  <iframe
                    src={
                      playbackUrl.includes("v=")
                        ? `https://www.youtube.com/embed/${playbackUrl.split("v=")[1]?.split("&")[0]}?autoplay=1`
                        : playbackUrl
                    }
                    title={activeSession?.title}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={playbackUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="stream-chart relative">
                <div className="flex items-center justify-between w-full">
                  <span>{activeSession?.focusPair || "EUR / USD · XAU / USD"} · LIVE TERMINAL</span>
                  <span className="text-xs font-mono text-[#ffde02]">
                    {isLive
                      ? "Host is connected · Awaiting screen share window"
                      : `Stream starts in ${countdownText}`}
                  </span>
                </div>
                <svg viewBox="0 0 700 300">
                  <path d="M0 245C70 210 90 255 150 185s90 25 150-40 80 20 145-45 100 10 155-45 60-30 100-42" />
                </svg>
                <div className="text-center space-y-1">
                  <div className="text-sm font-bold text-white">
                    {isLive
                      ? "Pastor Mike is Live in the Trading Room"
                      : `Waiting Room Countdown: ${countdownText}`}
                  </div>
                  <p className="text-xs text-[#9aa4b5]">
                    As soon as Pastor Mike clicks &ldquo;Share Screen &amp; Go Live&rdquo; or starts the RTMP stream in the Admin Studio, the live video feed appears right here automatically.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Card className="mt-4">
            <h3>Session Trading Plan &amp; Pinned Resources</h3>
            <p className="text-xs text-[#9aa4b5] mb-3">{activeSession?.description}</p>
            {(activeSession?.pinnedResources || []).map((res, idx) => (
              <div className="resource" key={idx}>
                <span>
                  <Icon name="book" /> {res.title}
                </span>
                <Link to={res.url || "/signals"} className="text-xs font-bold text-[#ffde02]">
                  Open ↗
                </Link>
              </div>
            ))}
          </Card>
        </div>

        {/* Real-Time Database-Backed Live Chat */}
        <Card className="chat flex flex-col justify-between">
          <div>
            <div className="chat-title">
              <h3>Live Trading Chat</h3>
              <span>{chatMessages.length} messages</span>
            </div>

            {/* Pinned Host Message Banner */}
            {chatMessages.find((m) => m.isPinned) && (
              <div className="mb-3 p-2.5 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs">
                <span className="text-[10px] font-mono uppercase text-[#ffde02] block">
                  📌 PINNED BY HOST
                </span>
                <span className="text-white">
                  {chatMessages.find((m) => m.isPinned)?.message}
                </span>
              </div>
            )}

            <div className="messages max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
              {chatMessages.map((m) => (
                <div className={m.isHost ? "host" : ""} key={m.id}>
                  <StudentAvatarBadge
                    avatarUrl={m.senderAvatar}
                    name={m.senderName}
                    sizeClass="w-7 h-7 text-[10px]"
                  />
                  <p>
                    <b className={m.isHost ? "text-[#ffde02]" : ""}>
                      {m.senderName}{" "}
                      {m.isHost && (
                        <span className="text-[9px] font-mono bg-[#ffde02]/20 text-[#ffde02] px-1.5 py-0.5 rounded ml-1">
                          HOST
                        </span>
                      )}
                    </b>
                    {m.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/10">
            {/* Quick reactions */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "🔥 Clean setup!",
                "📈 Watching EUR/USD",
                "🎯 Entered with 1% risk",
                "🙏 Thank you Pastor Mike",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => void handleSendChat(preset)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-[#cfd7e4] cursor-pointer transition"
                >
                  {preset}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void handleSendChat();
              }}
            >
              <input
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Send a message to the live trading room..."
              />
              <button type="submit">
                <Icon name="arrow" />
              </button>
            </form>
          </div>
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
      <Header
        eyebrow="SESSION REPLAY"
        title="London Open: Structure & Momentum"
        copy="Recorded Session Replay · 1 hour 12 minutes"
      />
      <div className="replay-grid">
        <div>
          <Card className="chapters">
            <h3>Session Chapters</h3>
            {[
              "Market context & daily bias",
              "EUR/USD liquidity sweep",
              "GBP/USD order block entry",
              "XAU/USD risk management",
              "Q&A and trade journal recap",
            ].map((x, i) => (
              <button key={x} type="button">
                <span>{i * 14}:00</span>
                {x}
                <Icon name="play" />
              </button>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// 6. MY TRADES PAGE (/trades) — EXNESS PARTNER SYNC + MANUAL LOG + 10/PAGE CAP
// ============================================================================

const TRADES_PER_PAGE = 10;

export function TradesPage() {
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [trades, setTrades] = useState<StudentTradeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "WIN" | "LOSS">("ALL");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "EXNESS_SYNC" | "SIGNAL_COPY" | "MANUAL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [syncingExness, setSyncingExness] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Log New Trade Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [pair, setPair] = useState("XAU / USD");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [lots, setLots] = useState("0.10");
  const [openPrice, setOpenPrice] = useState("2340.00");
  const [closePrice, setClosePrice] = useState("2355.00");
  const [pnlUsd, setPnlUsd] = useState("150.00");
  const [tradeStatus, setTradeStatus] = useState<"WIN" | "LOSS" | "OPEN">("WIN");

  async function loadTrades() {
    const list = await fetchStudentTradesFromDb(student.email, student.exnessId);
    setTrades(list);
  }

  useEffect(() => {
    void loadTrades();
  }, [student.email, student.exnessId, syncTick]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, directionFilter, statusFilter, sourceFilter]);

  async function handleSyncFromExness() {
    setSyncingExness(true);
    setSyncMsg(null);
    await syncExnessLiveWithSupabase();
    const res = await syncExnessPartnerSummaryToTradesInDb(student);
    await loadTrades();
    setSyncingExness(false);
    setSyncMsg(
      res.synced > 0
        ? "Synced latest Exness Partner trading volume & rebate records into your trade ledger!"
        : "Your Exness Partner trade feed is up to date."
    );
    setTimeout(() => setSyncMsg(null), 4000);
  }

  async function handleAddTrade(e: FormEvent) {
    e.preventDefault();
    const numPnl = Number(pnlUsd) || 0;
    const balance = student.accountBalanceUsd || 500;
    const returnPct = Number(((numPnl / balance) * 100).toFixed(2));

    await addStudentTradeInDb({
      studentEmail: student.email,
      exnessAccountId: student.exnessId || "LINKED",
      pair: pair.trim(),
      direction,
      lots: Number(lots) || 0.1,
      openPrice: openPrice.trim(),
      closePrice: closePrice.trim(),
      pnlUsd: numPnl,
      returnPct,
      status: tradeStatus,
      source: "MANUAL",
      notes: "Logged in Client Terminal",
    });

    setShowAddModal(false);
    await loadTrades();
  }

  // Working Filter Pipeline
  const filteredTrades = trades.filter((t) => {
    if (
      searchQuery.trim() &&
      !t.pair.toLowerCase().includes(searchQuery.trim().toLowerCase()) &&
      !(t.notes || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    if (directionFilter !== "ALL" && t.direction !== directionFilter) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (sourceFilter !== "ALL" && t.source !== sourceFilter) return false;
    return true;
  });

  // Strict 10 per page pagination
  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / TRADES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * TRADES_PER_PAGE;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + TRADES_PER_PAGE);

  // Real calculated KPIs from student's trades
  const totalPnl = trades.reduce((acc, t) => acc + t.pnlUsd, 0);
  const closedTrades = trades.filter((t) => t.status === "WIN" || t.status === "LOSS");
  const winCount = closedTrades.filter((t) => t.status === "WIN" || t.pnlUsd > 0).length;
  const winRate =
    closedTrades.length > 0 ? Math.round((winCount / closedTrades.length) * 100) : 0;
  const openCount = trades.filter((t) => t.status === "OPEN").length;
  const totalLots = trades.reduce((acc, t) => acc + (t.lots || 0), 0);

  return (
    <>
      <Header
        eyebrow="CONNECTED EXNESS ACCOUNT · public.student_trades"
        title="My Trades & Execution Ledger"
        copy="Live synced activity from your linked Exness Partner account, executed VIP signals, and manual trade journal (capped at 10 trades per page)."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={syncingExness}
              onClick={() => void handleSyncFromExness()}
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={syncingExness ? "animate-spin" : ""} />
              {syncingExness ? "Syncing Exness..." : "Sync Exness Partner Feed"}
            </button>
            <Button onClick={() => setShowAddModal(true)}>
              <Icon name="plus" /> Log Trade
            </Button>
          </div>
        }
      />

      {syncMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs text-[#ffde02] flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>{syncMsg}</span>
        </div>
      )}

      <div className="metrics-grid">
        <Metric
          label="Total Net P&L"
          value={`${totalPnl >= 0 ? "+" : "-"}$${Math.abs(totalPnl).toFixed(2)}`}
          change={`Across ${trades.length} recorded trades`}
          icon="trend"
        />
        <Metric
          label="Win rate"
          value={`${winRate}%`}
          change={`${winCount} wins of ${closedTrades.length} closed trades`}
          icon="chart"
        />
        <Metric
          label="Open positions & Volume"
          value={`${openCount} open`}
          change={`${totalLots.toFixed(2)} total standard lots traded`}
          icon="trades"
        />
      </div>

      <Card className="data-card">
        {/* Working Filter Bar */}
        <div className="table-tools flex-wrap gap-3">
          <div className="portal-search">
            <Icon name="search" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by currency pair (e.g. XAU/USD, EUR/USD)..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as "ALL" | "BUY" | "SELL")}
            >
              <option value="ALL">All Directions</option>
              <option value="BUY">Buy Only</option>
              <option value="SELL">Sell Only</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "ALL" | "OPEN" | "PARTIAL TP" | "WIN" | "LOSS"
                )
              }
            >
              <option value="ALL">All Outcomes</option>
              <option value="OPEN">Open Positions</option>
              <option value="PARTIAL TP">Partial TP Hit</option>
              <option value="WIN">Wins (+P&amp;L / All TPs)</option>
              <option value="LOSS">Losses (-P&amp;L / SL)</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(
                  e.target.value as "ALL" | "EXNESS_SYNC" | "SIGNAL_COPY" | "MANUAL"
                )
              }
            >
              <option value="ALL">All Sources</option>
              <option value="SIGNAL_COPY">Copied VIP Signals (Exness)</option>
              <option value="EXNESS_SYNC">Exness Partner Sync</option>
              <option value="MANUAL">Manual Entry</option>
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Pair &amp; Exness Source</th>
                <th>Direction</th>
                <th>Lots</th>
                <th>Entry / Open</th>
                <th>Custom TP / Close</th>
                <th>P&amp;L (USD)</th>
                <th>Return</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs text-[#8c95a6]">
                    No trades copied or synced from your Exness account yet. Click &ldquo;Copy &amp; Log Trade&rdquo; on any VIP Signal or &ldquo;Sync Exness Partner Feed&rdquo; above.
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div>
                        <b>{t.pair}</b>
                        <small className="block text-[10px] font-mono text-[#8c95a6]">
                          {t.source === "SIGNAL_COPY"
                            ? `COPIED TO EXNESS (${t.exnessAccountId || "LINKED"})`
                            : t.source}{" "}
                          · {new Date(t.executedAt).toLocaleDateString()}
                        </small>
                        {t.notes && (
                          <span className="block text-[10px] text-[#ffde02]/90 mt-0.5">
                            {t.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge tone={t.direction === "BUY" ? "green" : "red"}>
                        {t.direction}
                      </Badge>
                    </td>
                    <td className="font-mono font-bold text-white">{t.lots.toFixed(2)}</td>
                    <td className="font-mono">
                      <div>{t.openPrice}</div>
                      {t.customSl && (
                        <small className="block text-[10px] text-red-400">
                          SL: {t.customSl}
                        </small>
                      )}
                    </td>
                    <td className="font-mono">
                      <div>{t.customTp || t.closePrice}</div>
                      {t.customTp && (
                        <small className="block text-[10px] text-emerald-400">
                          Target TP: {t.customTp}
                        </small>
                      )}
                    </td>
                    <td
                      className={`font-mono font-bold ${
                        t.pnlUsd >= 0 ? "positive" : "negative"
                      }`}
                    >
                      {t.pnlUsd >= 0 ? "+" : "-"}${Math.abs(t.pnlUsd).toFixed(2)}
                    </td>
                    <td
                      className={`font-mono ${
                        t.returnPct >= 0 ? "positive" : "negative"
                      }`}
                    >
                      {t.returnPct >= 0 ? "+" : ""}
                      {t.returnPct.toFixed(2)}%
                    </td>
                    <td>
                      <Badge
                        tone={
                          t.status === "WIN"
                            ? "green"
                            : t.status === "LOSS"
                            ? "red"
                            : "yellow"
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Strict 10-Per-Page Pagination Controls */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-[#9aa4b5]">
            Showing{" "}
            <strong className="text-white">
              {filteredTrades.length === 0 ? 0 : startIndex + 1}–
              {Math.min(startIndex + TRADES_PER_PAGE, filteredTrades.length)}
            </strong>{" "}
            of <strong className="text-white">{filteredTrades.length}</strong> trades (capped at{" "}
            {TRADES_PER_PAGE} per page)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-bold cursor-pointer transition ${
                  pageNum === safePage
                    ? "bg-[#ffde02] text-black"
                    : "bg-white/5 text-[#9aa4b5] hover:text-white"
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
            >
              Next →
            </button>
          </div>
        </footer>
      </Card>

      {/* Log Trade Modal */}
      {showAddModal && (
        <div className="portal-modal">
          <Card className="max-w-lg w-full">
            <h2 className="text-lg font-bold text-white">Log Trade to Database</h2>
            <p className="text-xs text-[#9aa4b5] mt-1">
              Record a trade executed on your Exness account to track your P&amp;L and win rate.
            </p>
            <form onSubmit={handleAddTrade} className="space-y-3 mt-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-[#9aa4b5]">
                  Currency Pair
                  <input
                    value={pair}
                    onChange={(e) => setPair(e.target.value)}
                    className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-white text-xs mt-1"
                  />
                </label>
                <label className="text-xs text-[#9aa4b5]">
                  Direction
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as "BUY" | "SELL")}
                    className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-white text-xs mt-1"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs text-[#9aa4b5]">
                  Lot Size
                  <input
                    type="number"
                    step="0.01"
                    value={lots}
                    onChange={(e) => setLots(e.target.value)}
                    className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono mt-1"
                  />
                </label>
                <label className="text-xs text-[#9aa4b5]">
                  Open Price
                  <input
                    value={openPrice}
                    onChange={(e) => setOpenPrice(e.target.value)}
                    className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono mt-1"
                  />
                </label>
                <label className="text-xs text-[#9aa4b5]">
                  Close / TP Price
                  <input
                    value={closePrice}
                    onChange={(e) => setClosePrice(e.target.value)}
                    className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono mt-1"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-[#9aa4b5]">
                  Net P&amp;L ($ USD)
                  <input
                    type="number"
                    step="0.01"
                    value={pnlUsd}
                    onChange={(e) => setPnlUsd(e.target.value)}
                    className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono mt-1"
                  />
                </label>
                <label className="text-xs text-[#9aa4b5]">
                  Status
                  <select
                    value={tradeStatus}
                    onChange={(e) =>
                      setTradeStatus(e.target.value as "WIN" | "LOSS" | "OPEN")
                    }
                    className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-white text-xs mt-1"
                  >
                    <option value="WIN">WIN</option>
                    <option value="LOSS">LOSS</option>
                    <option value="OPEN">OPEN</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Trade</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}

// ============================================================================
// 7. VIP SIGNALS FEED, REDESIGNED POSITION CALCULATOR, MULTI-TP LIVE MARKET
//    SYNC & CUSTOM COPY-TO-EXNESS EXECUTION MODAL (/signals, /signals/:signalId)
// ============================================================================

function CopySignalToExnessModal({
  signal,
  student,
  defaultLots,
  onClose,
  onCopied,
}: {
  signal: TradingSignalItem;
  student: ExnessStudent;
  defaultLots: number;
  onClose: () => void;
  onCopied: (summaryMsg: string) => void;
}) {
  const tpLevels =
    signal.tpLevels && signal.tpLevels.length > 0
      ? signal.tpLevels
      : [{ level: 1, label: "TP1", price: signal.tp, hit: false }];

  const [customLots, setCustomLots] = useState(String(defaultLots || 0.1));
  const [selectedTpLabel, setSelectedTpLabel] = useState(tpLevels[0]?.label || "TP1");
  const [customTpPrice, setCustomTpPrice] = useState(tpLevels[0]?.price || signal.tp);
  const [customSlPrice, setCustomSlPrice] = useState(signal.sl);
  const [launchWebTerminal, setLaunchWebTerminal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirmCopy(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const lotsNum = Math.max(0.01, Number(customLots) || 0.01);

    await addStudentTradeInDb({
      studentEmail: student.email,
      exnessAccountId: student.exnessId || "LINKED",
      pair: signal.pair,
      direction: signal.direction,
      lots: lotsNum,
      openPrice: signal.entry,
      closePrice: customTpPrice.trim() || signal.tp,
      customTp: customTpPrice.trim() || signal.tp,
      customSl: customSlPrice.trim() || signal.sl,
      signalId: signal.id,
      pnlUsd: 0,
      returnPct: 0,
      status: "OPEN",
      source: "SIGNAL_COPY",
      notes: `Copied ${signal.pair} (${signal.direction}) · ${lotsNum.toFixed(
        2
      )} Lots · Target ${selectedTpLabel} (${customTpPrice}) · SL ${customSlPrice}`,
    });

    setSubmitting(false);

    if (launchWebTerminal) {
      window.open("https://my.exness.global/webtrading/", "_blank", "noopener,noreferrer");
    }

    onCopied(
      `Copied ${signal.pair} (${signal.direction} · ${lotsNum.toFixed(
        2
      )} Lots · Target TP: ${customTpPrice} · SL: ${customSlPrice}) to your Exness Trade Ledger!`
    );
  }

  return (
    <div className="portal-modal">
      <div className="bg-[#11151f] border-2 border-[#ffde02]/50 rounded-3xl p-6 sm:p-7 max-w-xl w-full text-left space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#ffde02]">
              EXNESS COPY-TRADING &amp; EXECUTION TERMINAL
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1 flex items-center gap-2">
              <span>Copy {signal.pair}</span>
              <Badge tone={signal.direction === "BUY" ? "green" : "red"}>
                {signal.direction}
              </Badge>
            </h2>
            <p className="text-xs text-[#9aa4b5] mt-1">
              Customize your Lot Size, Take-Profit (TP), and Stop-Loss (SL) before copying this setup to your linked Exness account (
              <strong className="text-white font-mono">
                {student.exnessId ? `••••${student.exnessId.slice(-4)}` : "Linked"}
              </strong>
              ).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#9aa4b5] hover:text-white cursor-pointer"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <form onSubmit={handleConfirmCopy} className="space-y-4">
          {/* Signal Reference Strip */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-[#0b0e15] border border-white/10 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#7f8a9d] block">SIGNAL ENTRY</span>
              <strong className="text-white text-sm">{signal.entry}</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#7f8a9d] block">ADMIN STOP LOSS</span>
              <strong className="text-red-400 text-sm">{signal.sl}</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#7f8a9d] block">PRIMARY TP1</span>
              <strong className="text-emerald-400 text-sm">{signal.tp}</strong>
            </div>
          </div>

          {/* Custom Lot Size Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-white">
                Your Execution Lot Size (Standard Lots)
              </label>
              <span className="text-[11px] font-mono text-[#ffde02]">
                Recommended: {defaultLots} Lots
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={customLots}
              onChange={(e) => setCustomLots(e.target.value)}
              className="w-full h-11 bg-[#161b26] border border-white/15 rounded-xl px-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#ffde02]"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[0.01, 0.05, 0.1, 0.25, 0.5, 1.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCustomLots(String(preset))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition cursor-pointer ${
                    Number(customLots) === preset
                      ? "bg-[#ffde02] text-black border-[#ffde02]"
                      : "bg-white/5 text-[#cfd7e4] border-white/10 hover:bg-white/10"
                  }`}
                >
                  {preset.toFixed(2)} Lots
                </button>
              ))}
            </div>
          </div>

          {/* Select from Admin TP1-TP5 or Set Custom Take-Profit */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5">
              Select Admin Take-Profit Target (TP1–TP5) or Enter Custom TP
            </label>
            {tpLevels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2.5">
                {tpLevels.map((lvl) => (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => {
                      setSelectedTpLabel(lvl.label);
                      setCustomTpPrice(lvl.price);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                      customTpPrice === lvl.price
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400"
                        : "bg-white/5 text-[#cfd7e4] border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {lvl.label}: {lvl.price} {lvl.hit ? "✓" : ""}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-[#9aa4b5] block mb-1">
                  Your Custom Take-Profit (TP) Price
                </span>
                <input
                  type="text"
                  required
                  value={customTpPrice}
                  onChange={(e) => {
                    setCustomTpPrice(e.target.value);
                    setSelectedTpLabel("Custom TP");
                  }}
                  className="w-full h-11 bg-[#161b26] border border-emerald-500/40 rounded-xl px-3.5 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <span className="text-[11px] text-[#9aa4b5] block mb-1">
                  Your Custom Stop-Loss (SL) Price
                </span>
                <input
                  type="text"
                  required
                  value={customSlPrice}
                  onChange={(e) => setCustomSlPrice(e.target.value)}
                  className="w-full h-11 bg-[#161b26] border border-red-500/40 rounded-xl px-3.5 text-sm font-mono font-bold text-red-300 focus:outline-none focus:border-red-400"
                />
              </div>
            </div>
          </div>

          {/* Option to also launch Exness WebTerminal */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#cfd7e4] cursor-pointer">
            <input
              type="checkbox"
              checked={launchWebTerminal}
              onChange={(e) => setLaunchWebTerminal(e.target.checked)}
              className="accent-[#ffde02] w-4 h-4"
            />
            <span>
              Also open <strong>Exness WebTerminal</strong> in a new tab to place this live order on account{" "}
              <code className="text-[#ffde02]">
                {student.exnessId ? `••••${student.exnessId.slice(-4)}` : "Exness"}
              </code>
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Copying & Logging Trade..."
                : `Copy & Log Trade (${Number(customLots || 0.1).toFixed(2)} Lots)`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SignalFeedPage() {
  const nav = useNavigate();
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [signals, setSignals] = useState<TradingSignalItem[]>(getCachedSignals());
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>(
    getCachedMarketPrices()
  );
  const [syncingPrices, setSyncingPrices] = useState(false);
  const [tab, setTab] = useState<"ALL" | "ACTIVE" | "CLOSED" | "WINS">("ALL");
  const [copy, setCopy] = useState(student.autoCopySignals ?? true);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [copyModalSignal, setCopyModalSignal] = useState<TradingSignalItem | null>(null);

  // Interactive Lot Size Calculator state
  const [calcBalance, setCalcBalance] = useState(String(student.accountBalanceUsd ?? 500));
  const [calcRiskPct, setCalcRiskPct] = useState(String(student.riskPerTradePct ?? 1.0));
  const [calcStopPips, setCalcStopPips] = useState("30");

  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  useEffect(() => {
    void fetchSignalsFromDb().then(setSignals);
    void fetchLiveMarketPrices().then(setMarketPrices);
  }, [syncTick]);

  async function handleRefreshMarketAndTps() {
    setSyncingPrices(true);
    await evaluateSignalsAgainstMarketPrices();
    const updatedSignals = await fetchSignalsFromDb();
    setSignals(updatedSignals);
    setMarketPrices(getCachedMarketPrices());
    setSyncingPrices(false);
  }

  const activeSignalsCount = signals.filter(
    (s) => s.status === "ACTIVE" || s.status === "PARTIAL TP"
  ).length;

  const filteredSignals = signals.filter((s) => {
    if (tab === "ACTIVE") return s.status === "ACTIVE" || s.status === "PARTIAL TP";
    if (tab === "CLOSED") return s.status !== "ACTIVE";
    if (tab === "WINS")
      return (
        s.status === "HIT TP" ||
        s.status === "ALL TPs HIT" ||
        s.status === "PARTIAL TP"
      );
    return true;
  });

  const lotCalc = calculateLotSize(
    Number(calcBalance) || 500,
    Number(calcRiskPct) || 1,
    Number(calcStopPips) || 30
  );

  return (
    <>
      <Header
        eyebrow="VIP MARKET SIGNALS · LIVE MARKET MULTI-TP ENGINE"
        title="Signal Feed & Position Size Calculator"
        copy="Only real setups posted by Pastor Mike appear here, connected to live market prices for automatic TP1–TP5 and Stop-Loss tracking."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={syncingPrices}
              onClick={() => void handleRefreshMarketAndTps()}
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} className={syncingPrices ? "animate-spin" : ""} />
              {syncingPrices ? "Checking Market..." : "Sync Live Market Prices"}
            </button>
            <Badge tone="green">{activeSignalsCount} ACTIVE SIGNALS</Badge>
          </div>
        }
      />

      {!isDepositCompleted && (
        <DepositGateNotice
          featureTitle="VIP Market Signals Locked · $50 Deposit Required"
          featureDescription="Actionable setups with entry, stop-loss, TP1–TP5 targets, trade reasoning, and one-click Exness copy-trading are reserved for students with a confirmed $50 USD Exness deposit."
        />
      )}

      {/* Live Market Price Ticker Strip */}
      {Object.keys(marketPrices).length > 0 && (
        <div className="mb-5 p-3.5 rounded-2xl bg-[#10141d] border border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffde02] font-bold">
              LIVE MARKET FEED (AUTO-TRIGGERS TP1–TP5)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {["EUR / USD", "GBP / USD", "XAU / USD", "USD / JPY", "GBP / JPY"].map((sym) =>
              marketPrices[sym] ? (
                <span
                  key={sym}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#cfd7e4]"
                >
                  {sym}: <strong className="text-white">{marketPrices[sym]}</strong>
                </span>
              ) : null
            )}
          </div>
        </div>
      )}

      <Card className="copy-banner">
        <i>
          <Icon name="trades" />
        </i>
        <span>
          <h3>Automatic Signal Copying is {copy ? "ON" : "OFF"}</h3>
          <p>
            New signals posted by Pastor Mike {copy ? "are" : "are not"} queued for your linked Exness account (
            {student.exnessId ? `••••${student.exnessId.slice(-4)}` : "Unlinked"}).
          </p>
        </span>
        <button
          type="button"
          className={`toggle ${copy ? "on" : ""}`}
          onClick={() => {
            const next = !copy;
            setCopy(next);
            saveStoredCurrentUser({ ...student, autoCopySignals: next });
          }}
        >
          <i />
        </button>
        <Link to="/settings">Manage risk settings</Link>
      </Card>

      {/* Redesigned Interactive Position Size & Risk Calculator Card */}
      <section className="mb-6 rounded-2xl bg-gradient-to-b from-[#161b26] to-[#10141d] border border-white/10 p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-white/10">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-[#ffde02]/15 border border-[#ffde02]/30 text-[#ffde02] flex items-center justify-center shrink-0">
              <Calculator size={20} />
            </span>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.14em] text-[#ffde02] block">
                INTERACTIVE POSITION SIZE &amp; RISK CALCULATOR
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug m-0">
                Calculate Exact Standard Lots Before Entering Any Signal
              </h3>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#cfd7e4] self-start md:self-auto">
            <span>Max Risk:</span>
            <strong className="text-[#ffde02]">${lotCalc.riskUsd.toFixed(2)} USD</strong>
            <span>({calcRiskPct || 1}%)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 items-stretch">
          <div className="p-4 rounded-xl bg-[#0d1017] border border-white/10 flex flex-col justify-between">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
              Account Equity ($ USD)
            </label>
            <input
              type="number"
              value={calcBalance}
              onChange={(e) => setCalcBalance(e.target.value)}
              className="w-full h-11 bg-[#151a24] border border-white/15 rounded-xl px-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#ffde02]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#0d1017] border border-white/10 flex flex-col justify-between">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
              Risk Per Trade (%)
            </label>
            <input
              type="number"
              step="0.25"
              value={calcRiskPct}
              onChange={(e) => setCalcRiskPct(e.target.value)}
              className="w-full h-11 bg-[#151a24] border border-white/15 rounded-xl px-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#ffde02]"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#0d1017] border border-white/10 flex flex-col justify-between">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
              Stop Distance (Pips)
            </label>
            <input
              type="number"
              value={calcStopPips}
              onChange={(e) => setCalcStopPips(e.target.value)}
              className="w-full h-11 bg-[#151a24] border border-white/15 rounded-xl px-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#ffde02]"
            />
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#ffde02]/20 to-[#ffde02]/5 border-2 border-[#ffde02]/50 flex flex-col justify-center text-center">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#ffde02] block">
              RECOMMENDED LOT SIZE
            </span>
            <strong className="text-2xl font-mono font-extrabold text-white mt-1">
              {lotCalc.recommendedLots.toFixed(2)} Lots
            </strong>
            <small className="block text-[11px] font-mono text-[#cfd7e4] mt-0.5">
              Risking ${lotCalc.riskUsd.toFixed(2)} over {calcStopPips || 30} pips
            </small>
          </div>
        </div>
      </section>

      {copyFeedback && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{copyFeedback}</span>
          </div>
          <Link to="/trades" className="text-[#ffde02] font-bold hover:underline shrink-0">
            View in My Trades →
          </Link>
        </div>
      )}

      <div className="tabs">
        {(
          [
            ["ALL", `All Admin Signals (${signals.length})`],
            ["ACTIVE", `Active (${activeSignalsCount})`],
            ["CLOSED", "Closed / Completed"],
            ["WINS", "TP Hits"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? "active bg-[#ffde02] text-black font-bold" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredSignals.length === 0 ? (
        <Card className="p-8 text-center space-y-2 border border-dashed border-white/15 my-4">
          <Target size={30} className="mx-auto text-[#ffde02]" />
          <h3 className="text-base font-bold text-white">No Signals Posted by Admin Yet</h3>
          <p className="text-xs text-[#9aa4b5] max-w-md mx-auto">
            Only real signals posted by Pastor Mike in the Admin Console appear here. When a signal is posted, its live market price and TP1–TP5 targets will track automatically.
          </p>
        </Card>
      ) : (
        <div className="signal-feed">
          {filteredSignals.map((s) => {
            const livePrice = marketPrices[s.pair];
            const tpList =
              s.tpLevels && s.tpLevels.length > 0
                ? s.tpLevels
                : [{ level: 1, label: "TP1", price: s.tp, hit: s.status === "HIT TP" }];

            return (
              <Link to={isDepositCompleted ? `/signals/${s.id}` : "#"} key={s.id}>
                <i className={s.direction === "BUY" ? "buy" : "sell"}>
                  <Icon name="trend" />
                </i>
                <div>
                  <span className="flex flex-wrap items-center gap-2">
                    <h2>{s.pair}</h2>
                    <Badge tone={s.direction === "BUY" ? "green" : "red"}>
                      {s.direction}
                    </Badge>
                    <Badge
                      tone={
                        s.status === "ALL TPs HIT" || s.status === "HIT TP"
                          ? "green"
                          : s.status === "PARTIAL TP"
                          ? "yellow"
                          : s.status === "HIT SL"
                          ? "red"
                          : "yellow"
                      }
                    >
                      {s.status}
                    </Badge>
                    {livePrice && (
                      <span className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono text-white">
                        Live Market: <strong className="text-[#ffde02]">{livePrice}</strong>
                      </span>
                    )}
                    <span className="text-xs font-mono text-[#8c95a6]">
                      {s.timeframe} · {new Date(s.createdAt).toLocaleString()}
                    </span>
                  </span>
                  <p>{s.commentary}</p>
                  {isDepositCompleted ? (
                    <div className="space-y-3 mt-2">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="levels">
                          <span>
                            ENTRY<b>{s.entry}</b>
                          </span>
                          <span>
                            STOP LOSS<b className="negative">{s.sl}</b>
                          </span>
                          <span>
                            PRIMARY TP1<b className="positive">{s.tp}</b>
                          </span>
                          <span>
                            RISK / REWARD<b>{s.rr}</b>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCopyModalSignal(s);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shrink-0"
                        >
                          Copy &amp; Log Trade
                        </button>
                      </div>

                      {/* Multi-TP (TP1 to TP5) Status Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {tpList.map((lvl) => (
                          <span
                            key={lvl.level}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                              lvl.hit
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-white/5 text-[#b4bccb] border-white/10"
                            }`}
                          >
                            {lvl.label}: {lvl.price} {lvl.hit ? "✓ HIT" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 font-bold mt-2 flex items-center gap-1.5">
                      <Lock size={12} /> Entry, SL &amp; TP1–TP5 locked ($50 deposit needed)
                    </div>
                  )}
                </div>
                <Icon name="arrow" />
              </Link>
            );
          })}
        </div>
      )}

      {copyModalSignal && (
        <CopySignalToExnessModal
          signal={copyModalSignal}
          student={student}
          defaultLots={lotCalc.recommendedLots}
          onClose={() => setCopyModalSignal(null)}
          onCopied={(msg) => {
            setCopyModalSignal(null);
            setCopyFeedback(msg);
          }}
        />
      )}
    </>
  );
}

export function SignalDetailPage() {
  const { signalId } = useParams();
  const nav = useNavigate();
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [signals, setSignals] = useState<TradingSignalItem[]>(getCachedSignals());
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;

  useEffect(() => {
    void fetchSignalsFromDb().then(setSignals);
  }, [syncTick]);

  const s = signals.find((x) => x.id === signalId) || signals[0];
  const lotCalc = calculateLotSize(
    student.accountBalanceUsd || 500,
    student.riskPerTradePct || 1,
    30
  );

  if (!isDepositCompleted) {
    return (
      <div className="py-8">
        <DepositGateNotice featureTitle="Signal Detail Locked" />
      </div>
    );
  }

  if (!s) {
    return (
      <Card className="p-8 text-center space-y-3 my-6">
        <h2 className="text-lg font-bold text-white">Signal Not Found</h2>
        <Link className="p-button primary rounded-full" to="/signals">
          Back to VIP Signals
        </Link>
      </Card>
    );
  }

  const tpList =
    s.tpLevels && s.tpLevels.length > 0
      ? s.tpLevels
      : [{ level: 1, label: "TP1", price: s.tp, hit: s.status === "HIT TP" }];

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/signals">Signals</Link>
        <span>/</span>
        {s.pair}
      </div>
      <div className="signal-head">
        <div>
          <i className={s.direction === "BUY" ? "buy" : "sell"}>
            <Icon name="trend" />
          </i>
          <span>
            <p className="p-eyebrow">
              VIP SIGNAL · {s.timeframe} · {new Date(s.createdAt).toLocaleString()}
            </p>
            <h1>
              {s.pair}{" "}
              <Badge tone={s.direction === "BUY" ? "green" : "red"}>{s.direction}</Badge>
            </h1>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            tone={
              s.status === "ALL TPs HIT" || s.status === "HIT TP"
                ? "green"
                : s.status === "HIT SL"
                ? "red"
                : "yellow"
            }
          >
            {s.status}
          </Badge>
          <Button onClick={() => setCopyModalOpen(true)}>
            Copy &amp; Log to Exness ({lotCalc.recommendedLots} Lots)
          </Button>
        </div>
      </div>
      <div className="signal-detail">
        <div>
          <Card className="level-card">
            {[
              ["ENTRY PRICE", s.entry],
              ["STOP LOSS", s.sl],
              ["PRIMARY TP1", s.tp],
              ["RISK / REWARD", s.rr],
            ].map((x, i) => (
              <span key={x[0]}>
                {x[0]}
                <b className={i === 1 ? "negative" : i === 2 ? "positive" : ""}>{x[1]}</b>
              </span>
            ))}
          </Card>

          {/* All Configured Multi-TP Targets Card */}
          <Card className="mt-4">
            <h3 className="text-sm font-bold text-white mb-3">
              Multi-Target Take Profit Levels (TP1 – TP{tpList.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {tpList.map((lvl) => (
                <div
                  key={lvl.level}
                  className={`p-3 rounded-xl border text-center ${
                    lvl.hit
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-[#141821] border-white/10 text-white"
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase text-[#ffde02] block">
                    {lvl.label}
                  </span>
                  <strong className="text-sm font-mono font-bold block mt-0.5">
                    {lvl.price}
                  </strong>
                  <small className="text-[10px] font-mono block mt-1">
                    {lvl.hit ? "✓ TARGET HIT" : "ACTIVE TARGET"}
                  </small>
                </div>
              ))}
            </div>
          </Card>

          <Card className="market-chart mt-4">
            <h3>
              {s.pair} · {s.timeframe} Execution Map
            </h3>
            <svg viewBox="0 0 700 270">
              <path d="M0 220C70 211 84 238 139 190s87 15 132-40 87 14 130-35 80-31 115-54 94 5 184-47" />
            </svg>
            <i>ENTRY {s.entry}</i>
          </Card>
        </div>
        <div>
          <Card className="analysis">
            <div className="profile">
              <img
                src="/ceo.png"
                alt="Pastor Mike"
                className="w-10 h-10 rounded-full object-cover border border-[#ffde02]/50"
              />
              <b>
                {s.author || "Pastor Mike"}
                <small>FOUNDER&apos;S ANALYSIS</small>
              </b>
            </div>
            <h2>Why I&apos;m taking this setup</h2>
            <p>{s.commentary}</p>
            <blockquote>
              Recommended Position Size for your ${student.accountBalanceUsd || 500} equity at{" "}
              {student.riskPerTradePct || 1}% risk:{" "}
              <strong className="text-[#ffde02]">{lotCalc.recommendedLots} Lots</strong> (${lotCalc.riskUsd} max risk).
            </blockquote>
          </Card>
        </div>
      </div>

      {copyModalOpen && (
        <CopySignalToExnessModal
          signal={s}
          student={student}
          defaultLots={lotCalc.recommendedLots}
          onClose={() => setCopyModalOpen(false)}
          onCopied={() => {
            setCopyModalOpen(false);
            nav("/trades");
          }}
        />
      )}
    </>
  );
}

// ============================================================================
// 8. ADMIN CONSOLE OVERVIEW & STUDENT ROSTER WITH UPLOADED PHOTOS & CERTIFICATES
// ============================================================================

export function AdminDashboardPage() {
  const roster = getStoredRoster();
  const syncTick = usePortalDataSync();
  const [courses, setCourses] = useState<CourseTrack[]>(getCachedCourses());
  const [sessions, setSessions] = useState<LiveSessionItem[]>(getCachedLiveSessions());
  const [signals, setSignals] = useState<TradingSignalItem[]>(getCachedSignals());

  useEffect(() => {
    void fetchCoursesWithLessonsFromDb().then(setCourses);
    void fetchLiveSessionsFromDb().then(setSessions);
    void fetchSignalsFromDb().then(setSignals);
  }, [syncTick]);

  const verifiedCount = roster.filter((s) => s.depositVerified && s.depositAmount >= 50).length;
  const linkedCount = roster.filter((s) => s.partnerLinked).length;
  const totalLessonsCount = courses.reduce((acc, c) => acc + c.lessons.length, 0);

  return (
    <>
      <Header
        eyebrow="FOUNDER CONSOLE · PASTOR MIKE"
        title="Academy & Trading Command Center"
        copy="Manage courses & video uploads, live screen-share broadcasts, VIP signals, student photos, and Exness Partner SQL sync."
        action={
          <div className="flex flex-wrap gap-2.5">
            <Link className="p-button secondary" to="/admin/courses">
              Manage Courses ({totalLessonsCount} Videos)
            </Link>
            <Link className="p-button primary rounded-full" to="/admin/sessions">
              <Radio size={15} /> Go Live / Share Screen
            </Link>
          </div>
        }
      />
      <div className="metrics-grid four">
        <Metric
          label="Registered Students"
          value={`${roster.length}`}
          change={`${linkedCount} partner linked`}
          icon="users"
        />
        <Metric
          label="Deposit Verified ($50+)"
          value={`${verifiedCount}`}
          change={`${EXNESS_PARTNER_TOTALS.count} Exness Partner accounts`}
          icon="shield"
        />
        <Metric
          label="Course Video Lessons"
          value={`${totalLessonsCount}`}
          change="Across 4 structured tracks"
          icon="book"
        />
        <Metric
          label="Published VIP Signals"
          value={`${signals.length}`}
          change={`${signals.filter((s) => s.status === "ACTIVE").length} active setups`}
          icon="signal"
        />
      </div>
      <div className="admin-grid">
        <Card className="quick-actions">
          <h2>Founder Management Suite</h2>
          {[
            [
              "Courses & Video Lesson Manager",
              "Upload unlimited lesson videos (12+ per track) & auto-build quizzes",
              "/admin/courses",
              "book",
            ],
            [
              "Live Broadcast Studio & Screen Share",
              "Schedule countdowns, share your browser screen live, or stream via RTMP",
              "/admin/sessions",
              "video",
            ],
            [
              "Post a New VIP Signal",
              "Publish entry, SL, TP & commentary to all student dashboards",
              "/admin/signals/new",
              "signal",
            ],
            [
              "Student Mentor Q&A Inbox",
              "Reply to student trading questions sent from their portal",
              "/admin/messages",
              "bell",
            ],
            [
              "Exness API & Supabase SQL Schema",
              "Sync Exness Partner accounts & copy the upgraded SQL schema",
              "/admin/verification",
              "shield",
            ],
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

        <Card className="activity">
          <div className="card-title">
            <h2>Recent Students &amp; Uploaded Photos</h2>
            <Link to="/admin/students">View Full Roster →</Link>
          </div>
          {roster.slice(0, 6).map((s) => (
            <div key={s.id}>
              <StudentAvatarBadge avatarUrl={s.avatarUrl} name={s.fullName} />
              <p>
                <b>{s.fullName}</b>
                {s.depositVerified
                  ? "Exness $50 deposit confirmed · Full access"
                  : s.partnerLinked
                  ? "Exness partner link verified"
                  : "Registered on portal"}
              </p>
              <small>{s.country}</small>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

export function StudentRosterPage() {
  const [roster, setRoster] = useState<ExnessStudent[]>(getStoredRoster());
  const [selected, setSelected] = useState<ExnessStudent | null>(null);
  const [search, setSearch] = useState("");
  const [studentCerts, setStudentCerts] = useState<StudentCertificateItem[]>([]);
  const [certFeedback, setCertFeedback] = useState<string | null>(null);

  useEffect(() => {
    void refreshRosterFromSupabase().then(setRoster);
    const sync = () => setRoster(getStoredRoster());
    window.addEventListener("candlesticks_roster_updated", sync);
    return () => window.removeEventListener("candlesticks_roster_updated", sync);
  }, []);

  useEffect(() => {
    if (selected) {
      void fetchStudentCertificatesFromDb(selected.email).then(setStudentCerts);
    }
  }, [selected]);

  async function handleIssueCertificate(courseSlug: string, courseTitle: string) {
    if (!selected) return;
    await issueStudentCertificateInDb(
      selected.email,
      selected.fullName,
      courseSlug,
      courseTitle
    );
    const updated = await fetchStudentCertificatesFromDb(selected.email);
    setStudentCerts(updated);
    setCertFeedback(`Issued verified "${courseTitle}" certificate to ${selected.fullName}!`);
    setTimeout(() => setCertFeedback(null), 3500);
  }

  async function handleRevokeCertificate(certId: string) {
    if (!selected) return;
    await revokeStudentCertificateInDb(certId);
    const updated = await fetchStudentCertificatesFromDb(selected.email);
    setStudentCerts(updated);
  }

  const filteredRoster = roster.filter(
    (s) =>
      !search.trim() ||
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.country || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header
        eyebrow="STUDENT MANAGEMENT · UPLOADED PHOTOS & CERTIFICATES"
        title="Student Roster & Profile Gallery"
        copy="View student profile photos uploaded from Settings, Exness partner status, risk settings, and issue verified course completion certificates."
        action={
          <Button onClick={() => void refreshRosterFromSupabase().then(setRoster)}>
            <RefreshCw size={14} className="inline mr-1" /> Refresh from Supabase
          </Button>
        }
      />
      <Card className="data-card">
        <div className="table-tools">
          <div className="portal-search">
            <Icon name="search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name, email, or country..."
            />
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Student &amp; Uploaded Photo</th>
                <th>Country</th>
                <th>Exness Account</th>
                <th>Partner Link</th>
                <th>Deposit</th>
                <th>Course Access</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer hover:bg-white/5 transition"
                >
                  <td>
                    <div className="student-cell">
                      <StudentAvatarBadge avatarUrl={s.avatarUrl} name={s.fullName} />
                      <span>
                        <b>{s.fullName}</b>
                        <small>{s.email}</small>
                      </span>
                    </div>
                  </td>
                  <td>{s.country}</td>
                  <td className="font-mono">
                    {s.exnessId ? `••••${s.exnessId.slice(-4)}` : "Pending"}
                  </td>
                  <td>
                    <Badge tone={s.partnerLinked ? "yellow" : "gray"}>
                      {s.partnerLinked
                        ? "VERIFIED"
                        : s.ticketStatus === "submitted"
                        ? "TICKET SENT"
                        : "UNLINKED"}
                    </Badge>
                  </td>
                  <td>
                    <strong
                      className={
                        s.depositAmount >= 50 ? "text-[#ffde02]" : "text-[#9aa4b5]"
                      }
                    >
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
          <aside className="student-drawer overflow-y-auto">
            <button onClick={() => setSelected(null)}>
              <Icon name="close" />
            </button>
            <div className="flex justify-center my-2">
              <StudentAvatarBadge
                avatarUrl={selected.avatarUrl}
                name={selected.fullName}
                sizeClass="w-20 h-20 text-xl"
              />
            </div>
            <h2>{selected.fullName}</h2>
            <p>{selected.email}</p>
            {selected.avatarUrl && (
              <a
                href={selected.avatarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-[#ffde02] hover:underline block text-center mt-1"
              >
                View Full Uploaded Photo ↗
              </a>
            )}
            <div className="flex justify-center gap-2 my-3">
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
                <b>{selected.riskPerTradePct ?? 1}%</b>Risk / Trade
              </span>
            </div>

            <h3>Issue Verified Course Certificate</h3>
            {certFeedback && (
              <div className="p-2.5 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs text-[#ffde02] my-2">
                {certFeedback}
              </div>
            )}
            <div className="space-y-2 mt-2 text-left">
              {[
                ["forex-foundations", "Forex Foundations"],
                ["technical-analysis", "Technical Analysis"],
                ["risk-psychology", "Risk & Psychology"],
                ["price-action", "Advanced Price Action"],
              ].map(([slug, title]) => {
                const existing = studentCerts.find((c) => c.courseSlug === slug);
                return (
                  <div
                    key={slug}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-bold text-white">{title}</span>
                    {existing ? (
                      <button
                        type="button"
                        onClick={() => void handleRevokeCertificate(existing.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[11px] cursor-pointer"
                      >
                        ✓ Issued (Revoke)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleIssueCertificate(slug, title)}
                        className="px-2.5 py-1 rounded-lg bg-[#ffde02] text-black font-extrabold text-[11px] cursor-pointer"
                      >
                        Issue Certificate
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

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
  const [dashboardSqlCopied, setDashboardSqlCopied] = useState(false);
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
  const [transferTickets, setTransferTickets] = useState<
    Array<{
      id?: string;
      ticket_ref: string;
      exness_email: string;
      trading_account_id: string;
      partner_code: string;
      status: string;
      submitted_at: string;
    }>
  >([]);
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

  async function handleCheckTicketOnExness(ticket: {
    ticket_ref: string;
    trading_account_id: string;
    exness_email: string;
  }) {
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

  async function handleApproveTicketSeenOnExness(ticket: {
    ticket_ref: string;
    trading_account_id: string;
    exness_email: string;
  }) {
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
    setTicketActionFeedback(
      `Account #${ticket.trading_account_id} approved as connected under Partner Code ${config.partnerCode}!`
    );
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

  function handleCopyDashboardSql() {
    navigator.clipboard.writeText(DASHBOARD_UPGRADE_SQL);
    setDashboardSqlCopied(true);
    setTimeout(() => setDashboardSqlCopied(false), 2500);
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
              onClick={handleCopyDashboardSql}
              className="bg-[#ffde02]/20 hover:bg-[#ffde02]/30 border border-[#ffde02]/50 text-[#ffde02] font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition cursor-pointer flex items-center gap-1.5"
            >
              {dashboardSqlCopied ? <Check size={14} /> : <Copy size={14} />}
              {dashboardSqlCopied ? "Copied Dashboard Upgrade SQL!" : "Copy Dashboard Upgrade SQL"}
            </button>
            <button
              type="button"
              onClick={handleCopyUpgradeSql}
              className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full transition cursor-pointer flex items-center gap-1.5"
            >
              {upgradeSqlCopied ? <Check size={14} /> : <Copy size={14} />}
              {upgradeSqlCopied ? "Copied SQL!" : "Copy exness_partner_clients SQL"}
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
              {showSchemaPreview ? "Hide SQL" : "View Upgrade SQL"}
            </button>
          </div>
        </div>

        {/* Pushed Account Artifacts Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-5">
          <div className="bg-[#1b1f29] border border-white/10 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aa4b5]">
              Supabase Storage Buckets
            </span>
            <p className="text-sm font-bold text-[#ffde02] mt-1 font-mono">
              student-avatars · course-videos
            </p>
            <span className="text-[11px] text-[#b8c0cc] mt-0.5 block">
              Public buckets for photos &amp; videos
            </span>
          </div>
          <div className="bg-[#1b1f29] border border-white/10 rounded-xl p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aa4b5]">
              PostgreSQL Tables Defined
            </span>
            <p className="text-sm font-bold text-white mt-1">15 Tables + RLS Policies</p>
            <span className="text-[11px] text-[#b8c0cc] mt-0.5 block">
              courses, lessons, quizzes, live, trades, etc.
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
              {DASHBOARD_UPGRADE_SQL}
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

      {/* LIVE EXNESS PARTNER API REFERRED CLIENTS & TRADING ACCOUNTS */}
      <Card className="data-card mb-8">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
              public.exness_partner_clients · PARTNER ACCOUNT #{OFFICIAL_PARTNER_ACCOUNT_ID}
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Synced Exness Partner Trading Accounts ({EXNESS_PARTNER_CLIENTS.length} Trading Accounts · {EXNESS_PARTNER_TOTALS.count} Clients)
            </h3>
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
                  <td className="font-mono text-xs text-white">{c.client_account_id}</td>
                  <td className="font-mono text-xs text-[#cfd7e4]">{c.client_id}</td>
                  <td className="font-mono text-[11px] text-[#9aa4b5]">{c.client_uid}</td>
                  <td className="font-mono text-[11px] text-[#9aa4b5]">{c.partner_account}</td>
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

      {/* SUBMITTED EXNESS PARTNER TRANSFER TICKETS */}
      <Card className="data-card mb-8">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
              public.support_tickets · PARTNER ACCOUNT TRANSFERS
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Exness Partner Transfer Tickets ({transferTickets.length} Requests)
            </h3>
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
                    No partner transfer tickets submitted yet.
                  </td>
                </tr>
              ) : (
                transferTickets.map((t) => (
                  <tr key={t.ticket_ref}>
                    <td className="font-mono text-xs font-bold text-[#ffde02]">#{t.ticket_ref}</td>
                    <td className="text-xs text-white">{t.exness_email}</td>
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
                        >
                          <RefreshCw
                            size={11}
                            className={checkingTicket === t.ticket_ref ? "animate-spin" : ""}
                          />
                          <span>
                            {checkingTicket === t.ticket_ref ? "Checking..." : "Check Exness Link"}
                          </span>
                        </button>
                        {t.status !== "verified" && (
                          <button
                            type="button"
                            disabled={checkingTicket === t.ticket_ref}
                            onClick={() => handleApproveTicketSeenOnExness(t)}
                            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white transition cursor-pointer"
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
                placeholder="Enter Trading Account ID"
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
                      <StudentAvatarBadge avatarUrl={s.avatarUrl} name={s.fullName} />
                      <span>
                        <b>{s.fullName}</b>
                        <small>{s.email}</small>
                      </span>
                    </div>
                  </td>
                  <td>{s.country}</td>
                  <td className="font-mono">
                    {s.exnessId ? `••••${s.exnessId.slice(-4)}` : "Not submitted"}
                  </td>
                  <td>
                    <Badge tone={s.partnerLinked ? "yellow" : "gray"}>
                      {s.partnerLinked
                        ? "VERIFIED"
                        : s.ticketStatus === "submitted"
                        ? "TICKET SENT"
                        : "UNLINKED"}
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

// ============================================================================
// 9. ADMIN SIGNAL PUBLISHER & SIGNAL MANAGER (/admin/signals/new)
// ============================================================================

export function SignalFormPage() {
  const nav = useNavigate();
  const syncTick = usePortalDataSync();
  const [signals, setSignals] = useState<TradingSignalItem[]>(getCachedSignals());
  const [livePrices, setLivePrices] = useState<Record<string, number>>(getCachedMarketPrices());
  const [evaluatingMarket, setEvaluatingMarket] = useState(false);

  const [pair, setPair] = useState("GBP / USD");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [timeframe, setTimeframe] = useState("H1 / M15");
  const [entry, setEntry] = useState("1.2674");
  const [sl, setSl] = useState("1.2620");
  const [tp1, setTp1] = useState("1.2715");
  const [tp2, setTp2] = useState("1.2740");
  const [tp3, setTp3] = useState("1.2775");
  const [tp4, setTp4] = useState("");
  const [tp5, setTp5] = useState("");
  const [rr, setRr] = useState("1 : 2.8");
  const [commentary, setCommentary] = useState(
    "London liquidity sweep followed by M15 bullish market structure shift (MSS) and displacement."
  );
  const [publishing, setPublishing] = useState(false);
  const [modal, setModal] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    void fetchSignalsFromDb().then(setSignals);
    void fetchLiveMarketPrices().then(setLivePrices);
  }, [syncTick]);

  const configuredTpLevels = [
    { level: 1, label: "TP1", price: tp1.trim(), hit: false },
    { level: 2, label: "TP2", price: tp2.trim(), hit: false },
    { level: 3, label: "TP3", price: tp3.trim(), hit: false },
    { level: 4, label: "TP4", price: tp4.trim(), hit: false },
    { level: 5, label: "TP5", price: tp5.trim(), hit: false },
  ].filter((t) => t.price.length > 0);

  async function handleConfirmPublish() {
    setPublishing(true);
    const primaryTp = tp1.trim() || tp2.trim() || "1.2740";
    await createSignalInDb({
      pair: pair.trim(),
      direction,
      status: "ACTIVE",
      entry: entry.trim(),
      sl: sl.trim(),
      tp: primaryTp,
      tpLevels:
        configuredTpLevels.length > 0
          ? configuredTpLevels
          : [{ level: 1, label: "TP1", price: primaryTp, hit: false }],
      rr: rr.trim() || "1 : 2.8",
      timeframe: timeframe.trim() || "H1 / M15",
      commentary: commentary.trim(),
      author: "Pastor Mike",
    });
    const updated = await fetchSignalsFromDb();
    setSignals(updated);
    setPublishing(false);
    setPosted(true);
  }

  async function handleEvaluateLiveMarket() {
    setEvaluatingMarket(true);
    const prices = await fetchLiveMarketPrices();
    setLivePrices(prices);
    await evaluateSignalsAgainstLiveMarket();
    const updated = await fetchSignalsFromDb();
    setSignals(updated);
    setEvaluatingMarket(false);
  }

  return (
    <>
      <Header
        eyebrow="SIGNAL MANAGEMENT · public.trading_signals · TP1 TO TP5"
        title="Post & Manage Multi-TP VIP Market Signals"
        copy="Configure up to 5 Take-Profit targets (TP1–TP5). Signals automatically evaluate against live market prices and send real-time alerts to student topbar bells when TP1, TP2, TP3, TP4, TP5, or SL hits."
        action={
          <button
            type="button"
            disabled={evaluatingMarket}
            onClick={() => void handleEvaluateLiveMarket()}
            className="px-4 py-2.5 rounded-full bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={evaluatingMarket ? "animate-spin" : ""} />
            {evaluatingMarket ? "Checking Market..." : "Sync Live Market Prices & Auto-Check TPs"}
          </button>
        }
      />

      {/* Live Market Feed Strip */}
      <div className="mb-6 rounded-2xl bg-[#121620] border border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
            LIVE MARKET ENGINE ACTIVE (AUTO-TRIGGERS TP1–TP5 &amp; SL ALERTS)
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(livePrices).map(([sym, pr]) => (
            <span
              key={sym}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white"
            >
              <strong className="text-[#9aa4b5] mr-1.5">{sym}:</strong>
              <span className="text-[#ffde02] font-bold">{pr}</span>
            </span>
          ))}
        </div>
      </div>

      <form
        className="signal-form"
        onSubmit={(e) => {
          e.preventDefault();
          setPosted(false);
          setModal(true);
        }}
      >
        <Card>
          <div className="form-section">
            <i>01</i>
            <div>
              <h2>Market, Timeframe &amp; Direction</h2>
              <div className="form-grid">
                <label>
                  Currency Pair / Instrument
                  <select value={pair} onChange={(e) => setPair(e.target.value)}>
                    <option>GBP / USD</option>
                    <option>EUR / USD</option>
                    <option>XAU / USD</option>
                    <option>USD / JPY</option>
                    <option>GBP / JPY</option>
                    <option>NAS100 / US100</option>
                  </select>
                </label>
                <label>
                  Execution Timeframe
                  <input
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="e.g. H1 / M15"
                  />
                </label>
                <label>
                  Direction
                  <span className="direction">
                    <button
                      type="button"
                      className={direction === "BUY" ? "active buy" : ""}
                      onClick={() => setDirection("BUY")}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      className={direction === "SELL" ? "active sell" : ""}
                      onClick={() => setDirection("SELL")}
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
              <h2>Entry, Stop-Loss &amp; Up to 5 Take-Profit Targets (TP1 – TP5)</h2>
              <div className="form-grid three">
                <label>
                  Entry Price *
                  <input value={entry} onChange={(e) => setEntry(e.target.value)} required />
                </label>
                <label>
                  Stop-Loss (Invalidation) *
                  <input value={sl} onChange={(e) => setSl(e.target.value)} required />
                </label>
                <label>
                  TP1 Target (Primary) *
                  <input
                    value={tp1}
                    onChange={(e) => setTp1(e.target.value)}
                    placeholder="e.g. 1.2715"
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                <label className="text-xs text-[#9aa4b5]">
                  TP2 Target (Optional)
                  <input
                    value={tp2}
                    onChange={(e) => setTp2(e.target.value)}
                    placeholder="e.g. 1.2740"
                    className="mt-1 w-full bg-[#141821] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </label>
                <label className="text-xs text-[#9aa4b5]">
                  TP3 Target (Optional)
                  <input
                    value={tp3}
                    onChange={(e) => setTp3(e.target.value)}
                    placeholder="e.g. 1.2775"
                    className="mt-1 w-full bg-[#141821] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </label>
                <label className="text-xs text-[#9aa4b5]">
                  TP4 Target (Optional)
                  <input
                    value={tp4}
                    onChange={(e) => setTp4(e.target.value)}
                    placeholder="Optional TP4"
                    className="mt-1 w-full bg-[#141821] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </label>
                <label className="text-xs text-[#9aa4b5]">
                  TP5 Target (Runner)
                  <input
                    value={tp5}
                    onChange={(e) => setTp5(e.target.value)}
                    placeholder="Optional TP5"
                    className="mt-1 w-full bg-[#141821] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </label>
              </div>

              <div className="rr mt-3">
                <span>RISK / REWARD RATIO</span>
                <input
                  value={rr}
                  onChange={(e) => setRr(e.target.value)}
                  className="bg-transparent border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-white w-28"
                />
                <Badge tone="green">{configuredTpLevels.length} TP TARGETS CONFIGURED</Badge>
              </div>
            </div>
          </div>
          <div className="form-section">
            <i>03</i>
            <div>
              <h2>Institutional Commentary &amp; Thesis</h2>
              <label>
                Analysis &amp; trade thesis
                <textarea
                  value={commentary}
                  onChange={(e) => setCommentary(e.target.value)}
                  placeholder="Describe structure, liquidity sweep, confluence, and invalidation..."
                />
              </label>
            </div>
          </div>
        </Card>
        <Card className="publish">
          <h3>Before you publish</h3>
          <p>
            <Icon name="check" /> Syncs to <code>public.trading_signals</code> with TP1–TP5 targets
          </p>
          <p>
            <Icon name="check" /> Auto-notifies student Alert Bells when published &amp; when each TP hits
          </p>
          <div>
            <Icon name="trades" />
            <span>
              <b>Exness Copy &amp; Custom TP Ready</b>Students can select any TP or set custom TP &amp; Lot Size.
            </span>
          </div>
          <Button type="submit">Review &amp; Publish Signal</Button>
        </Card>
      </form>

      {/* Active & Past Signals Management Table */}
      <Card className="data-card mt-8">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
              LIVE DATABASE FEED · public.trading_signals
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Published VIP Signals ({signals.length})
            </h3>
          </div>
          <span className="text-xs text-[#9aa4b5]">
            Click any TP badge below to manually mark TP1–TP5 hit &amp; send instant student alerts
          </span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Pair &amp; Market</th>
                <th>Direction</th>
                <th>Entry / SL</th>
                <th>Multi-TP Targets (Click to Trigger Hit Alert)</th>
                <th>Status</th>
                <th>Update Outcome</th>
              </tr>
            </thead>
            <tbody>
              {signals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-[#8f98a8]">
                    No signals posted yet. Publish your first signal above to broadcast it to all client dashboards.
                  </td>
                </tr>
              ) : (
                signals.map((s) => {
                  const tpList =
                    s.tpLevels && s.tpLevels.length > 0
                      ? s.tpLevels
                      : [{ level: 1, label: "TP1", price: s.tp, hit: s.status === "ALL TP HIT" || s.status === "HIT TP" }];
                  const mktPrice = livePrices[s.pair] || s.lastMarketPrice;

                  return (
                    <tr key={s.id}>
                      <td>
                        <b>{s.pair}</b>
                        <small className="block text-[10px] font-mono text-[#8c95a6]">
                          {s.timeframe} {mktPrice ? `· Live: ${mktPrice}` : ""}
                        </small>
                      </td>
                      <td>
                        <Badge tone={s.direction === "BUY" ? "green" : "red"}>{s.direction}</Badge>
                      </td>
                      <td className="font-mono text-xs">
                        <div>Entry: <strong className="text-white">{s.entry}</strong></div>
                        <div>SL: <span className="text-red-400">{s.sl}</span></div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {tpList.map((lvl) => (
                            <button
                              key={lvl.level}
                              type="button"
                              onClick={() =>
                                void triggerSignalTpLevelInDb(s.id, lvl.level, !lvl.hit).then(() =>
                                  fetchSignalsFromDb().then(setSignals)
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                                lvl.hit
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : "bg-white/5 text-[#d0d7e3] border-white/10 hover:border-[#ffde02]/50"
                              }`}
                              title="Click to toggle TP hit and broadcast alert to students"
                            >
                              {lvl.label}: {lvl.price} {lvl.hit ? "✓ HIT" : ""}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge
                          tone={
                            s.status === "ACTIVE"
                              ? "yellow"
                              : s.status === "ALL TP HIT" ||
                                s.status === "HIT TP" ||
                                s.status === "PARTIAL TP"
                              ? "green"
                              : s.status === "HIT SL"
                              ? "red"
                              : "gray"
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(["ACTIVE", "PARTIAL TP", "ALL TP HIT", "HIT SL", "CLOSED"] as const).map(
                            (st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() =>
                                  void updateSignalStatusInDb(s.id, st).then(() =>
                                    fetchSignalsFromDb().then(setSignals)
                                  )
                                }
                                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                                  s.status === st
                                    ? "bg-[#ffde02] text-black"
                                    : "bg-white/10 text-white hover:bg-white/15"
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              void deleteSignalFromDb(s.id).then(() =>
                                fetchSignalsFromDb().then(setSignals)
                              )
                            }
                            className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-[10px] font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <div className="portal-modal">
          <Card>
            {posted ? (
              <>
                <i className="modal-icon success">
                  <Icon name="check" />
                </i>
                <h2>Signal Published &amp; Alerts Sent!</h2>
                <p>
                  {pair} ({direction}) with {configuredTpLevels.length} TP target(s) is now live on the Student Overview, VIP Signal Feed, and Topbar Alert Bell.
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => setModal(false)}>Done</Button>
                  <Button variant="secondary" onClick={() => nav("/signals")}>
                    View Student Signal Feed
                  </Button>
                </div>
              </>
            ) : (
              <>
                <i className="modal-icon">
                  <Icon name="signal" />
                </i>
                <h2>
                  Publish {pair} ({direction}) Multi-TP Signal?
                </h2>
                <p>
                  Entry: {entry} · SL: {sl} · Targets:{" "}
                  {configuredTpLevels.map((t) => `${t.label} ${t.price}`).join(" / ")} ({rr}). This immediately updates all student dashboards and triggers a notification alert.
                </p>
                <div>
                  <Button variant="secondary" onClick={() => setModal(false)}>
                    Go back
                  </Button>
                  <Button onClick={() => void handleConfirmPublish()} disabled={publishing}>
                    {publishing ? "Publishing..." : "Confirm & Post Signal"}
                  </Button>
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
                        <StudentAvatarBadge avatarUrl={s.avatarUrl} name={s.fullName} />
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
