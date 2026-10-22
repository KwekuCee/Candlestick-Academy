import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router";
import {
  ADMIN_PORTAL_DOMAIN,
  EXNESS_PARTNER_CLIENTS,
  EXNESS_PARTNER_CLIENTS_UPGRADE_SQL,
  EXNESS_PARTNER_TOTALS,
  ExnessConfig,
  ExnessStudent,
  MAIN_ACADEMY_DOMAIN,
  OFFICIAL_PARTNER_ACCOUNT_ID,
  STUDENT_PORTAL_DOMAIN,
  SUPABASE_PROJECT_REF,
  SUPABASE_PROJECT_URL,
  SUPABASE_SCHEMA_SQL,
  authenticatePortalLogin,
  buildRolePortalUrl,
  checkExnessAccountDeposit,
  checkUsernameAvailability,
  getHomePageUrl,
  getStoredConfig,
  getStoredCurrentUser,
  getStoredRoster,
  isMasterAdminAuthenticated,
  logoutCurrentUser,
  normalizeUsername,
  pushSchemaToSupabaseManagementApi,
  redirectToRolePortal,
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
  AccountManagementContractConfig,
  CertificateTemplateConfig,
  ClientNotificationItem,
  CourseLessonItem,
  CourseTrack,
  DASHBOARD_UPGRADE_SQL,
  ECONOMIC_CALENDAR_EVENTS,
  LiveChatMessageItem,
  LiveSessionItem,
  MentorMessageItem,
  Mentorship1on1SessionItem,
  MerchClaimItem,
  MoolreGatewayConfig,
  MoolrePaymentTransaction,
  QuizAttemptItem,
  SignalTpLevel,
  SignedAccountManagementContract,
  StudentCertificateItem,
  StudentSubscriptionAccess,
  StudentTradeItem,
  TradingSignalItem,
  addStudentTradeInDb,
  calculateLotSize,
  createClientNotificationInDb,
  createSignalInDb,
  deleteMentorship1on1SessionFromDb,
  deleteSignalFromDb,
  evaluateSignalsAgainstMarketPrices,
  extractTextFromContractDocument,
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
  getAccountManagementContractConfig,
  getCachedCertificateTemplate,
  getCachedClientNotifications,
  getCachedCourses,
  getCachedLiveSessions,
  getCachedMarketPrices,
  getCachedMentorship1on1Sessions,
  getCachedMoolreTransactions,
  getCachedSignals,
  getMerchClaims,
  getMerchGiveawayStats,
  getMoolreConfig,
  getSeoAnalyticsConfig,
  getSignedAccountContracts,
  getStudentProgressMetrics,
  getStudentSubscriptionAccess,
  issueStudentCertificateInDb,
  markAllNotificationsReadInDb,
  markNotificationReadInDb,
  processMoolrePaymentCheckout,
  recordQuizAttemptInDb,
  requestStudentExnessTradingPasswordInDb,
  revokeStudentCertificateInDb,
  saveAccountManagementContractConfig,
  saveMentorship1on1SessionInDb,
  saveMoolreConfig,
  saveSeoAnalyticsConfig,
  SeoAnalyticsConfig,
  sendMentorMessageInDb,
  sendSessionChatMessageInDb,
  signAccountManagementContractInDb,
  submitStudentTradingPasswordForManagement,
  syncExnessPartnerSummaryToTradesInDb,
  toggleLessonCompletedInDb,
  triggerSignalTpLevelInDb,
  updateMerchClaimStatus,
  updateSignalStatusInDb,
  updateStudentTierInStore,
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
  CreditCard,
  Database,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileText,
  Filter,
  Flame,
  Gift,
  Globe,
  Key,
  Layers,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  MonitorPlay,
  Moon,
  PenTool,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Unlock,
  Upload,
  User,
  Video as VideoIcon,
  X,
  Zap,
} from "lucide-react";
import { PWAInstallButton } from "./PWAInstallPrompt";
import { BrandLogo } from "./BrandLogo";

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
  return <BrandLogo to="/" size="md" />;
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
        className={`${sizeClass} rounded-full object-cover border border-[#ffb600]/50 shrink-0`}
      />
    );
  }
  return (
    <span
      className={`${sizeClass} rounded-full bg-[#ffb600]/15 text-[#ffb600] border border-[#ffb600]/30 font-extrabold flex items-center justify-center shrink-0`}
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

// Reusable Moolre Payment Gateway Checkout Modal ($20/month or $100 Permanent Access)
export function MoolreCheckoutModal({
  initialPlan = "monthly_20",
  onClose,
  onSuccess,
}: {
  initialPlan?: "monthly_20" | "permanent_100";
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const student = useCurrentStudent();
  const moolreCfg = getMoolreConfig();
  const [selectedPlan, setSelectedPlan] = useState<"monthly_20" | "permanent_100">(initialPlan);
  const [paymentMethod, setPaymentMethod] = useState<"moolre_link" | "mobile_money">("mobile_money");
  const [network, setNetwork] = useState<"MTN" | "Telecel" | "AT">("MTN");
  const [payerPhone, setPayerPhone] = useState(student.phone || "");
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{
    success: boolean;
    message: string;
    paymentUrl?: string;
  } | null>(null);

  const amountUsd = selectedPlan === "permanent_100" ? 100 : 20;
  const amountGhs = Math.round(amountUsd * (moolreCfg.usdToGhsRate || 15.5));

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setFeedback(null);
    const res = await processMoolrePaymentCheckout({
      studentEmail: student.email,
      studentName: student.fullName,
      planTier: selectedPlan,
      paymentMethod,
      payerPhone,
      network,
    });
    setProcessing(false);
    setFeedback({
      success: res.success,
      message: res.message,
      paymentUrl: res.paymentUrl,
    });
    if (res.success && onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#11151f] border-2 border-[#ffb600] rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl text-left">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ffb600]/15 border border-[#ffb600]/40 text-[#ffb600] flex items-center justify-center shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ffb600]">
                MOOLRE PAYMENT GATEWAY (M-O-O-L-R-E)
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                Upgrade Your Academy Membership
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#9aa4b5] hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Plan Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => setSelectedPlan("monthly_20")}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
              selectedPlan === "monthly_20"
                ? "bg-[#ffb600]/12 border-[#ffb600]"
                : "bg-[#161b26] border-white/10 hover:border-white/25"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffb600]">
                MONTHLY ACCESS
              </span>
              {selectedPlan === "monthly_20" && <CheckCircle2 size={15} className="text-[#ffb600]" />}
            </div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              $20 <small className="text-xs text-[#9aa4b5] font-normal">/ month</small>
            </div>
            <p className="text-[11px] text-[#b4bccb] mt-1.5 leading-relaxed">
              Unlocks all 4 Course Levels (Beginner, Intermediate, Essential &amp; Advanced), Live Stream, Market Insights &amp; Signals.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan("permanent_100")}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
              selectedPlan === "permanent_100"
                ? "bg-[#ffb600]/12 border-[#ffb600]"
                : "bg-[#161b26] border-white/10 hover:border-white/25"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                PERMANENT VIP TIER
              </span>
              {selectedPlan === "permanent_100" && <CheckCircle2 size={15} className="text-[#ffb600]" />}
            </div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              $100 <small className="text-xs text-[#9aa4b5] font-normal">one-time</small>
            </div>
            <p className="text-[11px] text-[#b4bccb] mt-1.5 leading-relaxed">
              Lifetime Full Access + Copy Trading on Signals + 1-on-1 Live Mentorship + $500 Exness Account Management.
            </p>
          </button>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("mobile_money")}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                paymentMethod === "mobile_money"
                  ? "bg-[#ffb600] text-black border-[#ffb600]"
                  : "bg-[#161b26] text-white border-white/10"
              }`}
            >
              Moolre Mobile Money Prompt
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("moolre_link")}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer ${
                paymentMethod === "moolre_link"
                  ? "bg-[#ffb600] text-black border-[#ffb600]"
                  : "bg-[#161b26] text-white border-white/10"
              }`}
            >
              Moolre Hosted Checkout Link
            </button>
          </div>

          {paymentMethod === "mobile_money" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                  Mobile Money Network
                </label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as "MTN" | "Telecel" | "AT")}
                  className="w-full bg-[#181c26] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs"
                >
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="Telecel">Telecel Cash</option>
                  <option value="AT">AT Money</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                  Mobile Money Number *
                </label>
                <input
                  type="tel"
                  required
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="e.g. 024 000 0000"
                  className="w-full bg-[#181c26] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono"
                />
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#161b26] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#9aa4b5]">
              Total Due ({selectedPlan === "permanent_100" ? "Permanent VIP Access" : "30-Day Full Access"}):
            </span>
            <strong className="text-sm font-mono font-extrabold text-[#ffb600]">
              ${amountUsd}.00 USD (≈ GHS {amountGhs.toLocaleString()})
            </strong>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
                feedback.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-[#ffb600]" />
                <span>{feedback.message}</span>
              </div>
              {feedback.paymentUrl && (
                <a
                  href={feedback.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#ffb600] font-bold hover:underline"
                >
                  Open Moolre Checkout Page ↗
                </a>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#9aa4b5] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-6 py-3 rounded-xl bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {processing
                ? "Processing via Moolre..."
                : `Pay $${amountUsd} USD via Moolre`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reusable Subscription Tier Gate Notice (shown when 1-Month Free Trial has expired)
function SubscriptionGateNotice({
  featureTitle,
  featureDescription,
  requiredPlan = "monthly_20",
}: {
  featureTitle: string;
  featureDescription: string;
  requiredPlan?: "monthly_20" | "permanent_100";
}) {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-[#1c2029] to-[#12151b] border-2 border-[#ffb600]/40 shadow-2xl my-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-[#ffb600]/15 text-[#ffb600] flex items-center justify-center shrink-0">
            <Lock size={22} />
          </span>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#ffb600] bg-[#ffb600]/10 px-2.5 py-0.5 rounded">
              {requiredPlan === "permanent_100"
                ? "$100 PERMANENT VIP ACCESS REQUIRED"
                : "1-MONTH FREE TRIAL EXPIRED · MOOLRE SUBSCRIPTION REQUIRED"}
            </span>
            <h3 className="text-xl font-bold text-white mt-1">{featureTitle}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCheckout(true)}
          className="px-5 py-2.5 rounded-full bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shrink-0"
        >
          {requiredPlan === "permanent_100"
            ? "Unlock $100 Permanent VIP via Moolre"
            : "Upgrade ($20/mo or $100 VIP) via Moolre"}
        </button>
      </div>
      <p className="text-xs sm:text-sm text-[#9ea8b8] mt-3 leading-relaxed">{featureDescription}</p>
      {showCheckout && (
        <MoolreCheckoutModal
          initialPlan={requiredPlan}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
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
    <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#1c2029] to-[#12151b] border-2 border-[#ffb600]/30 shadow-2xl my-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-[#ffb600]/15 text-[#ffb600] flex items-center justify-center shrink-0">
            <Lock size={22} />
          </span>
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#ffb600] bg-[#ffb600]/10 px-2 py-0.5 rounded">
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
            className="h-full bg-gradient-to-r from-[#ffc833] to-[#ffb600] rounded-full transition-all duration-500"
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffb600] text-black text-xs font-bold hover:bg-[#ffc833] transition"
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
          className="text-xs text-[#ffb600] hover:underline cursor-pointer"
        >
          ⚡ Verify $50 Deposit Status
        </button>
      </div>

      {msg && (
        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#c5cdd8] flex items-center gap-2">
          <CheckCircle2 size={15} className="text-[#ffb600]" />
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
  ["1-on-1 Mentorship", "/mentorship", "users"],
  ["Account Management", "/account-management", "shield"],
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
  ["Exness Partner Sync", "/admin/verification", "shield"],
  ["Payments & tiers", "/admin/payments", "trades"],
] as const;

const mobileStudentTabs = [
  ["Overview", "/dashboard", "home"],
  ["Courses", "/courses", "book"],
  ["Live", "/sessions", "video"],
  ["Signals", "/signals", "signal"],
  ["1-on-1", "/mentorship", "users"],
  ["Managed", "/account-management", "shield"],
] as const;

const mobileAdminTabs = [
  ["Overview", "/admin", "admin"],
  ["Students", "/admin/students", "users"],
  ["Courses", "/admin/courses", "book"],
  ["Live", "/admin/sessions", "video"],
  ["Signals", "/admin/signals/new", "signal"],
  ["Payments", "/admin/payments", "trades"],
] as const;

export function PortalLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const admin = loc.pathname.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const [searchQuery, setSearchQuery] = useState("");

  // Dashboard Theme state (Light / Dark toggle for Dashboards only; Home page stays untouched)
  const [portalTheme, setPortalTheme] = useState<"dark" | "light">(() => {
    try {
      const saved = localStorage.getItem("candlesticks_portal_theme");
      return saved === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  function togglePortalTheme() {
    setPortalTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("candlesticks_portal_theme", next);
      } catch {
        // ignore
      }
      return next;
    });
  }

  // Interactive Alert Bell Popover state
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClientNotificationItem[]>([]);
  const bellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
    setBellOpen(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  // Protect /admin/* routes and enforce master.candlesticksacademy.online for admin & stu.candlesticksacademy.online for students
  useEffect(() => {
    const currentPath = loc.pathname + loc.search + loc.hash;
    if (admin) {
      if (!isMasterAdminAuthenticated()) {
        nav("/login", { replace: true });
        return;
      }
      if (typeof window !== "undefined") {
        const host = window.location.hostname.toLowerCase();
        if (host.endsWith(MAIN_ACADEMY_DOMAIN) && host !== ADMIN_PORTAL_DOMAIN) {
          redirectToRolePortal("admin", currentPath);
        }
      }
    } else if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.endsWith(MAIN_ACADEMY_DOMAIN) && host !== STUDENT_PORTAL_DOMAIN) {
        redirectToRolePortal("student", currentPath);
      }
    }
  }, [admin, loc.pathname, loc.search, loc.hash, nav]);

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
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (
        host === ADMIN_PORTAL_DOMAIN ||
        host === STUDENT_PORTAL_DOMAIN ||
        host.includes("candlesticksacademy.online") ||
        host.includes("candlesticks.online")
      ) {
        window.location.href = getHomePageUrl("/login");
        return;
      }
    }
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
    <div className={`portal ${portalTheme === "light" ? "theme-light" : "theme-dark"}`}>
      <aside className={`portal-sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-logo">
          <BrandLogo to="/" size="md" />
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
            <a
              href={buildRolePortalUrl("student", "/dashboard")}
              onClick={(e) => {
                e.preventDefault();
                redirectToRolePortal("student", "/dashboard", (p) => nav(p));
              }}
            >
              <Icon name="book" />
              Switch to Client View
            </a>
          )}
          <button
            type="button"
            onClick={togglePortalTheme}
            className="h-[44px] px-[13px] rounded-[12px] flex items-center gap-[13px] text-[#a4abb6] hover:text-white hover:bg-white/10 text-[13.5px] font-semibold transition cursor-pointer w-full text-left border-0 bg-transparent"
          >
            {portalTheme === "dark" ? <Sun size={18} className="text-[#ffb600]" /> : <Moon size={18} />}
            <span>{portalTheme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="h-[44px] px-[13px] rounded-[12px] flex items-center gap-[13px] text-[#f6465d] hover:text-white hover:bg-[#f6465d]/15 text-[13.5px] font-semibold transition cursor-pointer w-full text-left border-0 bg-transparent"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
          <div className="profile">
            {admin ? (
              <img
                src="/ceo.png"
                alt="Pastor Mike"
                className="w-9 h-9 rounded-full object-cover border border-[#ffb600]/50 shrink-0"
              />
            ) : (
              <StudentAvatarBadge avatarUrl={student.avatarUrl} name={student.fullName} />
            )}
            <b>
              {admin ? "Pastor Mike (@master)" : student.fullName || "Registered Trader"}
              <small>
                {admin
                  ? "Founder & Lead Mentor"
                  : student.username
                  ? `@${student.username} · ${
                      student.depositVerified && student.depositAmount >= 50
                        ? "Funded ($50+)"
                        : student.partnerLinked
                        ? "Partner Linked"
                        : "Unlinked"
                    }`
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
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open menu">
              <Icon name="menu" />
            </button>
            <div className="mobile-app-brand">
              <BrandLogo to="/" variant="mark-only" size="sm" />
            </div>
            <form onSubmit={handleSearchSubmit} className="portal-search">
              <Icon name="search" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, live sessions, VIP signals, trades..."
              />
              <kbd>↵</kbd>
            </form>
          </div>

          {/* Right-Aligned Topbar Actions (PWA Install, Theme Toggle, Alert Bell, Profile Pic, Logout) */}
          <div className="portal-topbar-actions ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <PWAInstallButton compact />

            {/* Light / Dark Theme Toggle */}
            <button
              type="button"
              onClick={togglePortalTheme}
              title={portalTheme === "dark" ? "Switch Dashboard to Light Theme" : "Switch Dashboard to Dark Theme"}
              className="theme-toggle-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold transition cursor-pointer shrink-0"
            >
              {portalTheme === "dark" ? (
                <>
                  <Sun size={14} className="text-[#ffb600]" />
                  <span className="hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-slate-700" />
                  <span className="hidden md:inline">Dark</span>
                </>
              )}
            </button>

            {/* Interactive Alert Bell Linked to Client Audit Logs & Trade Events */}
            <div className="relative flex items-center" ref={bellRef}>
              <button
                type="button"
                onClick={() => setBellOpen((prev) => !prev)}
                className="notify relative cursor-pointer p-2 rounded-full hover:bg-white/10 transition flex items-center justify-center"
                title="Client Alerts, Trade Notifications & Audit Feed"
              >
                <Icon name="bell" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f6465d] text-white text-[10px] font-mono font-extrabold flex items-center justify-center border border-[#0b0e14]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="bell-popover absolute right-0 top-full mt-2.5 w-[330px] sm:w-[390px] rounded-2xl bg-[#11151f] border border-white/15 shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3.5 bg-[#161b26] border-b border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600] block">
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
                        className="px-2.5 py-1 rounded-lg bg-[#ffb600]/15 hover:bg-[#ffb600]/25 border border-[#ffb600]/30 text-[10px] font-bold text-[#ffb600] transition cursor-pointer"
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
                              : "bg-[#ffb600]/[0.06] hover:bg-[#ffb600]/[0.12]"
                          }`}
                        >
                          <span
                            className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                              item.isRead
                                ? "bg-white/20"
                                : item.category === "tp_hit"
                                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                                : item.category === "trade"
                                ? "bg-[#ffb600] shadow-[0_0_8px_#ffb600]"
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
                                <span className="text-[10px] font-bold text-[#ffb600]">
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
                  className="w-9 h-9 rounded-full object-cover border border-[#ffb600]/50"
                />
              ) : (
                <StudentAvatarBadge avatarUrl={student.avatarUrl} name={student.fullName} />
              )}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="logout-top-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-[#f6465d]/15 hover:border-[#f6465d]/40 hover:text-[#f6465d] text-xs font-bold text-[#c4c9d2] transition cursor-pointer shrink-0"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
        <main className="portal-content">
          <Outlet />
        </main>
      </div>

      {/* Native Mobile App Lower Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
        {(admin ? mobileAdminTabs : mobileStudentTabs).map(([label, to, icon]) => (
          <NavLink
            to={to}
            end={to === "/admin" || to === "/dashboard"}
            key={to}
            className={({ isActive }) => `mobile-bottom-tab ${isActive ? "active" : ""}`}
          >
            <span className="mobile-tab-icon">
              <Icon name={icon} size={19} />
            </span>
            <span className="mobile-tab-label">{label}</span>
          </NavLink>
        ))}
      </nav>
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
        <h1>Welcome to Candlesticks Academy</h1>
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
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    const res = await authenticatePortalLogin(loginInput, passwordInput);
    setSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    window.dispatchEvent(new Event("candlesticks_trigger_opener"));
    if (res.role === "admin") {
      redirectToRolePortal("admin", "/admin", (p) => nav(p));
    } else {
      redirectToRolePortal("student", "/dashboard", (p) => nav(p));
    }
  }

  return (
    <Auth quote="Discipline turns knowledge into a skill you can rely on.">
      <form className="auth-form login" onSubmit={handleLogin}>
        <p className="p-eyebrow">WELCOME BACK</p>
        <h1>Continue your journey</h1>
        <p>
          Log in with your registered <strong>Email</strong> or <strong>Username</strong> and password to access your trading terminal.
        </p>
        <label>
          Email or Username
          <input
            required
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            placeholder="you@example.com or @username"
          />
        </label>
        <label>
          Password<Link to="/onboarding">Need an account?</Link>
          <div className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter your password"
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8c94a2] hover:text-[#ffb600] transition p-1 cursor-pointer bg-transparent border-0"
              style={{ marginTop: "4px" }}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Verifying Credentials..." : "Log in"} <Icon name="arrow" />
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
  const subAccess = getStudentSubscriptionAccess(student);
  const [moolreModalPlan, setMoolreModalPlan] = useState<"monthly_20" | "permanent_100" | null>(
    null
  );
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
      {moolreModalPlan && (
        <MoolreCheckoutModal
          initialPlan={moolreModalPlan}
          onClose={() => setMoolreModalPlan(null)}
        />
      )}

      {/* Institutional Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-[#131722] via-[#171c28] to-[#11151e] border border-white/10 rounded-2xl p-6 sm:p-7 mb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <StudentAvatarBadge
            avatarUrl={student.avatarUrl}
            name={student.fullName}
            sizeClass="w-14 h-14 text-base"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
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

      {/* Membership Tier & Moolre Subscription Status Bar */}
      <div className="mb-6 rounded-2xl bg-[#131824] border border-[#ffb600]/30 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#ffb600]/15 border border-[#ffb600]/40 text-[#ffb600] flex items-center justify-center shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ffb600]">
                ACADEMY MEMBERSHIP TIER · MOOLRE GATEWAY
              </span>
              <Badge
                tone={
                  subAccess.tier === "permanent_100"
                    ? "green"
                    : subAccess.tier === "expired_free"
                    ? "red"
                    : "yellow"
                }
              >
                {subAccess.tierLabel.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-[#9aa4b5] mt-1">
              {subAccess.tier === "expired_free"
                ? "Your 1-month free trial has ended. You currently have access to Signals & Beginner/Intermediate Courses. Upgrade to $20/mo or $100 Permanent VIP via Moolre to unlock Essential/Advanced Courses, Live Stream & Market Insights."
                : subAccess.tier === "permanent_100"
                ? "You have Permanent VIP Access: All 4 Course Levels, Live Stream, Market Insights, Signal Copy Trading, 1-on-1 Live Mentorship & $500 Account Management."
                : "1-Month Free Trial includes full access equivalent to the $20/month plan. Upgrade to $100 Permanent Access for Copy Trading, 1-on-1 Mentorship & Account Management."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {subAccess.tier !== "permanent_100" && (
            <>
              <button
                type="button"
                onClick={() => setMoolreModalPlan("monthly_20")}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white cursor-pointer"
              >
                $20 / Month Plan
              </button>
              <button
                type="button"
                onClick={() => setMoolreModalPlan("permanent_100")}
                className="px-4 py-2 rounded-xl bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
              >
                $100 Permanent VIP
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() =>
              void updateStudentTierInStore(
                student.email,
                subAccess.tier === "expired_free" ? "free_trial" : "expired_free"
              )
            }
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-mono text-[#9aa4b5] hover:text-white cursor-pointer"
            title="Preview how the dashboard looks when the 1-Month Free Trial expires"
          >
            {subAccess.tier === "expired_free" ? "Restore 1-Mo Free Trial" : "Preview Expired Trial"}
          </button>
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
              className="px-5 py-2.5 rounded-full bg-[#ffb600] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#ffc833] transition shrink-0 cursor-pointer"
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
              className="px-4 py-2.5 rounded-full bg-[#ffb600] text-black font-extrabold text-xs uppercase tracking-wider text-center hover:bg-[#ffc833] transition"
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
        <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#ffb600] flex items-center gap-2">
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
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-[#ffb600] transition"
                >
                  Take Course Quiz ({nextCourse?.title || "Foundations"}) →
                </Link>
              </>
            ) : (
              <button
                onClick={() => nav("/courses")}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Lock size={13} className="text-[#ffb600]" /> View Unlocking Requirement
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
                    <Lock size={13} className="text-[#ffb600]" /> Locked ($50 Deposit Required)
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ffb600] hover:underline pt-1"
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
                      className="text-[#ffb600] hover:underline flex items-center gap-1 font-bold"
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ffb600] hover:underline pt-1"
                >
                  Open VIP Signal Feed <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Redesigned High-Impact Forex Macroeconomic Calendar & Market Insights Card (Locked when 1-Month Free Trial Expires) */}
      <section className="mt-6 rounded-2xl bg-gradient-to-b from-[#151924] to-[#10141d] border border-white/10 p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.14em] text-[#ffb600]">
                  MARKET INSIGHTS &amp; HIGH-IMPACT MACROECONOMIC CALENDAR
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug m-0">
                Upcoming Red-Folder Volatility Events &amp; Institutional Bias
              </h3>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#ffb600]/10 border border-[#ffb600]/30 self-start md:self-auto">
            <ShieldAlert size={15} className="text-[#ffb600] shrink-0" />
            <span className="text-xs font-mono font-bold text-[#ffb600]">
              Protect stops 15m before red-folder releases
            </span>
          </div>
        </div>

        {!subAccess.canAccessMarketInsights ? (
          <SubscriptionGateNotice
            featureTitle="Market Insights Locked · 1-Month Free Trial Expired"
            featureDescription="After your 1-month free trial, Market Insights, Live Stream, and Essential/Advanced Courses require an active $20/Month subscription or $100 Permanent Access via Moolre."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-5">
            {ECONOMIC_CALENDAR_EVENTS.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl bg-[#0d1017] hover:bg-[#131822] border border-white/10 hover:border-[#ffb600]/30 transition flex flex-col justify-between gap-3.5"
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
                    <Clock size={11} className="text-[#ffb600]" />
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
        )}
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
  const [username, setUsername] = useState(student.username || "");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    available: boolean;
    normalized: string;
    reason: string;
  } | null>(null);
  const [accountPassword, setAccountPassword] = useState(student.accountPassword || "");
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [email, setEmail] = useState(student.email);
  const [country, setCountry] = useState(student.country || "Ghana");
  const [phone, setPhone] = useState(student.phone || "");
  const [telegramHandle, setTelegramHandle] = useState(student.telegramHandle || "");
  const [exnessId, setExnessId] = useState(student.exnessId);

  // Active section scroll-spy state for sticky settings navigation
  const [activeSection, setActiveSection] = useState<string>("profile");

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
  const [saveError, setSaveError] = useState<string | null>(null);
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

  // Sync local state if student updates
  useEffect(() => {
    if (student.username && !username) {
      setUsername(student.username);
    }
    if (student.accountPassword && !accountPassword) {
      setAccountPassword(student.accountPassword);
    }
  }, [student.username, student.accountPassword]);

  // Live username availability check in Settings
  useEffect(() => {
    const clean = normalizeUsername(username);
    if (!clean) {
      setUsernameStatus(null);
      setCheckingUsername(false);
      return;
    }
    let active = true;
    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(clean, student.email, student.id);
      if (active) {
        setUsernameStatus(res);
        setCheckingUsername(false);
      }
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username, student.email, student.id]);

  // Scroll-spy observer so the sticky settings menu highlights the section in view as the user scrolls
  useEffect(() => {
    const sectionIds = [
      "profile",
      "risk-profile",
      "account",
      "mentor-qa",
      "alerts",
      "ticket-guide",
      "sql-schema",
    ];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            current = id;
          }
        }
      }
      if (scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40) {
        current = sectionIds[sectionIds.length - 1];
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  async function saveProfile() {
    setSaveError(null);
    setSaveSuccess(false);

    let resolvedUsername = student.username;
    const cleanUser = normalizeUsername(username);
    if (cleanUser) {
      const check = await checkUsernameAvailability(cleanUser, student.email, student.id);
      setUsernameStatus(check);
      if (!check.available) {
        setSaveError(check.reason);
        return;
      }
      resolvedUsername = check.normalized;
    }

    const updated: ExnessStudent = {
      ...student,
      username: resolvedUsername,
      accountPassword: accountPassword.trim() || student.accountPassword,
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
    saveStoredCurrentUser(updated, updated.accountPassword);

    const roster = getStoredRoster();
    const idx = roster.findIndex((s) => s.email.toLowerCase() === student.email.toLowerCase());
    if (idx >= 0) {
      roster[idx] = updated;
    } else {
      roster.unshift(updated);
    }
    saveStoredRoster(roster);

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

  const navItems: Array<[string, string]> = [
    ["profile", "Profile & Username"],
    ["risk-profile", "Risk & Session"],
    ["account", "Linked Exness"],
    ["mentor-qa", "Direct Mentor Q&A"],
    ["alerts", "Notifications"],
    ["ticket-guide", "Partner Transfer"],
    ["sql-schema", "Database Schema"],
  ];

  return (
    <>
      <Header
        eyebrow="CLIENT ACCOUNT & PREFERENCES"
        title="Profile, Username, Risk Terminal & Settings"
        copy="Set your unique login @username and password, upload your profile photo, configure your risk parameters, and manage your linked Exness account."
      />
      <div className="settings-grid">
        <nav>
          {navItems.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className={activeSection === id ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection(id);
                const el = document.getElementById(id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div>
          {/* 1. Profile, Username & Photo Upload Card */}
          <Card className="settings-card" id="profile">
            <h2>Profile, Login Username &amp; Avatar Photo</h2>
            <p>
              Set your unique <code>@username</code> to log in with either your username or email address, and upload your profile photo (synced to Supabase Storage &amp; visible beside the topbar alert bell).
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141821] border border-white/10 my-4">
              <div className="flex items-center gap-4">
                <StudentAvatarBadge
                  avatarUrl={student.avatarUrl}
                  name={student.fullName}
                  sizeClass="w-16 h-16 text-lg"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-white text-base">{student.fullName}</b>
                    {student.username && (
                      <span className="px-2 py-0.5 rounded-full bg-[#ffb600]/15 border border-[#ffb600]/35 text-[11px] font-mono font-bold text-[#ffb600]">
                        @{student.username}
                      </span>
                    )}
                  </div>
                  <small className="text-[#8c94a2] text-xs block mt-0.5">
                    {student.email} · {student.country}
                  </small>
                  {avatarFeedback && (
                    <span className="text-xs text-[#ffb600] mt-1 block">{avatarFeedback}</span>
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
                  className="px-4 py-2.5 rounded-xl bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={15} />
                  {uploadingAvatar ? "Uploading Photo..." : "Upload Profile Photo"}
                </button>
              </div>
            </div>

            {/* Username & Password Setup Box with Real-Time Availability Check */}
            <div className="p-4 rounded-2xl bg-[#11151e] border border-[#ffb600]/30 mb-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffb600]">
                    LOGIN CREDENTIALS · EMAIL OR USERNAME
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    Your Unique Login Username &amp; Password
                  </h3>
                </div>
                {student.username && (
                  <span className="text-[11px] font-mono text-emerald-400">
                    Active Login ID: <strong>@{student.username}</strong>
                  </span>
                )}
              </div>

              <div className="form-grid">
                <div>
                  <label>
                    Login Username (@username)
                    <div className="relative">
                      <span
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#ffb600]"
                        style={{ marginTop: "4px" }}
                      >
                        @
                      </span>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/^@+/, ""))}
                        placeholder="choose_username"
                        style={{ paddingLeft: "28px" }}
                      />
                    </div>
                  </label>
                  {checkingUsername && (
                    <span className="text-[11px] font-mono text-[#9aa4b5] mt-1.5 flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin text-[#ffb600]" />
                      Checking availability...
                    </span>
                  )}
                  {!checkingUsername && usernameStatus && (
                    <div
                      className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                        usernameStatus.available
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35"
                          : "bg-red-500/15 text-red-300 border-red-500/35"
                      }`}
                    >
                      {usernameStatus.available ? (
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle size={13} className="text-red-400 shrink-0" />
                      )}
                      <span>
                        {usernameStatus.available ? "Available: " : "Not Available: "}
                        {usernameStatus.reason}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label>
                    Login Password
                    <div className="relative">
                      <input
                        type={showAccountPassword ? "text" : "password"}
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder="Set or update your login password"
                        style={{ paddingRight: "40px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountPassword(!showAccountPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c94a2] hover:text-[#ffb600] bg-transparent border-0 cursor-pointer p-1"
                        style={{ marginTop: "4px" }}
                      >
                        {showAccountPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                  <span className="text-[11px] text-[#8c94a2] mt-1.5 block">
                    Use this password with your <strong>@username</strong> or <strong>email</strong> on the Sign In page.
                  </span>
                </div>
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
            {saveError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
            <div className="flex items-center gap-4 mt-5">
              <Button onClick={() => void saveProfile()}>Save Profile &amp; Sync to Database</Button>
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
                          ? "bg-[#ffb600] text-black border-[#ffb600]"
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
                className="text-[#ffb600] hover:underline font-bold flex items-center gap-1"
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
                <span className="text-[11px] font-mono uppercase text-[#ffb600]">
                  Your Mentorship Conversation History ({mentorMessages.length})
                </span>
                {mentorMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs ${
                      m.senderRole === "admin"
                        ? "bg-[#ffb600]/10 border-[#ffb600]/40 text-white"
                        : "bg-[#141821] border-white/10 text-[#d0d7e3]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8c95a6] mb-1">
                      <strong className={m.senderRole === "admin" ? "text-[#ffb600]" : "text-white"}>
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
              <button type="button" className="text-xs text-[#ffb600] font-bold">
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
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffb600]">
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
                className="px-4 py-2.5 rounded-xl bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs uppercase tracking-wider shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedUpgradeSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedUpgradeSql ? "Copied Upgrade SQL!" : "Copy Dashboard Upgrade SQL"}
              </button>
            </div>
            <details className="mt-4 pt-3 border-t border-white/10">
              <summary className="text-xs font-mono font-bold text-[#ffb600] cursor-pointer select-none">
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
  const [showMoolreUpgrade, setShowMoolreUpgrade] = useState(false);
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;
  const subAccess = getStudentSubscriptionAccess(student);

  useEffect(() => {
    void fetchCoursesWithLessonsFromDb().then(setCourses);
    void fetchStudentLessonsCompletedFromDb(student.email);
  }, [student.email, syncTick]);

  const metrics = getStudentProgressMetrics(student.email);

  return (
    <>
      {showMoolreUpgrade && (
        <MoolreCheckoutModal
          initialPlan="monthly_20"
          onClose={() => setShowMoolreUpgrade(false)}
        />
      )}

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

      {isDepositCompleted && !subAccess.canAccessEssentialAndAdvancedCourses && (
        <SubscriptionGateNotice
          featureTitle="Essential & Advanced Levels Locked · 1-Month Free Trial Expired"
          featureDescription="Your 1-month free trial has ended. Beginner and Intermediate courses remain unlocked for free, while Essential and Advanced courses require an active $20/Month subscription or $100 Permanent VIP Access via Moolre."
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
            <span className="text-xs text-[#ffb600] flex items-center gap-1.5 font-bold">
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
            const isTierLocked =
              (c.level === "Essential" || c.level === "Advanced") &&
              !subAccess.canAccessEssentialAndAdvancedCourses;
            const isCourseUnlocked = isDepositCompleted && !isTierLocked;

            return (
              <div className="course-card relative flex flex-col justify-between" key={c.slug}>
                {!isDepositCompleted && (
                  <div className="absolute top-3 right-3 z-10 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-[#ffb600]/40 text-[#ffb600] text-xs font-bold flex items-center gap-1">
                    <Lock size={12} /> $50 Deposit Gate
                  </div>
                )}
                {isDepositCompleted && isTierLocked && (
                  <div className="absolute top-3 right-3 z-10 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full border border-[#ffb600] text-[#ffb600] text-xs font-bold flex items-center gap-1">
                    <Lock size={12} /> $20/mo or $100 VIP
                  </div>
                )}
                <Link to={isCourseUnlocked ? `/courses/${c.slug}` : "#"}>
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
                  {isCourseUnlocked ? (
                    <div className="space-y-2 mt-3">
                      <Progress value={pct} />
                      <div className="flex items-center justify-between text-xs text-[#9aa4b5]">
                        <span>
                          {doneL} of {totalL} completed ({pct}%)
                        </span>
                        <Link
                          to={`/quiz/${c.slug}`}
                          className="text-[#ffb600] hover:underline font-bold"
                        >
                          Take Quiz →
                        </Link>
                      </div>
                      <Link
                        to={`/courses/${c.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white hover:text-[#ffb600] pt-1"
                      >
                        {pct > 0 ? "Continue lessons" : "Start course"} <Icon name="arrow" />
                      </Link>
                    </div>
                  ) : isTierLocked ? (
                    <button
                      type="button"
                      onClick={() => setShowMoolreUpgrade(true)}
                      className="mt-3 px-4 py-2 rounded-xl bg-[#ffb600] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock size={13} /> Unlock via Moolre ($20/mo)
                    </button>
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
  const subAccess = getStudentSubscriptionAccess(student);

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

  const isTierLocked =
    (c.level === "Essential" || c.level === "Advanced") &&
    !subAccess.canAccessEssentialAndAdvancedCourses;
  const isCourseUnlocked = isDepositCompleted && !isTierLocked;

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/courses">Courses</Link>
        <span>/</span>
        {c.title}
      </div>

      {!isDepositCompleted && <DepositGateNotice featureTitle="Course Lessons Locked" />}
      {isDepositCompleted && isTierLocked && (
        <SubscriptionGateNotice
          featureTitle={`${c.title} (${c.level} Level) Locked`}
          featureDescription={`Your 1-month free trial has expired. Beginner and Intermediate courses remain free, while ${c.level} Level courses unlock with the $20/Month plan or $100 Permanent VIP Access via Moolre.`}
        />
      )}

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
          <Progress value={isCourseUnlocked ? cStat?.progressPct || 0 : 0} />
          {isCourseUnlocked ? (
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
          ) : isTierLocked ? (
            <span className="text-xs text-[#ffb600] font-bold flex items-center gap-1.5">
              <Lock size={14} /> Free Trial Expired · Unlock {c.level} Level via Moolre ($20/mo or $100 Permanent)
            </span>
          ) : (
            <span className="text-xs text-[#ffb600] font-bold flex items-center gap-1.5">
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
            {isCourseUnlocked
              ? `${cStat?.completedCount || 0} of ${c.lessons.length} complete (${
                  cStat?.progressPct || 0
                }%)`
              : `0 of ${c.lessons.length} complete`}
          </span>
        </div>

        {c.lessons.length === 0 ? (
          <Card className="p-6 text-center space-y-2 border border-dashed border-white/15">
            <VideoIcon size={28} className="mx-auto text-[#ffb600]" />
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
                className={!isCourseUnlocked ? "locked" : ""}
                to={isCourseUnlocked ? `/lessons/${lesson.id}` : "#"}
                key={lesson.id}
              >
                <i>
                  {isCourseUnlocked && isDone ? (
                    <Icon name="check" />
                  ) : !isCourseUnlocked ? (
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
                {isCourseUnlocked && isDone && <Badge tone="green">COMPLETED</Badge>}
                {isCourseUnlocked && !isDone && isNext && <Badge>UP NEXT</Badge>}
                <Icon name="arrow" />
              </Link>
            );
          })
        )}

        {/* Auto-Generated Level PDF Mastery Assessment Row */}
        <Link
          className={!isCourseUnlocked ? "locked" : ""}
          to={isCourseUnlocked ? `/quiz/${c.slug}` : "#"}
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

  const subAccess = getStudentSubscriptionAccess(student);
  const isTierLocked =
    activeCourse &&
    (activeCourse.level === "Essential" || activeCourse.level === "Advanced") &&
    !subAccess.canAccessEssentialAndAdvancedCourses;

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

  if (isTierLocked) {
    return (
      <div className="py-8">
        <div className="breadcrumbs">
          <Link to="/courses">Courses</Link>
          <span>/</span>
          {activeCourse?.level} Level Locked
        </div>
        <SubscriptionGateNotice
          featureTitle={`${activeCourse?.title} (${activeCourse?.level} Level) Locked`}
          featureDescription={`Your 1-month free trial has expired. Beginner and Intermediate courses remain unlocked, while ${activeCourse?.level} Level lessons require the $20/Month plan or $100 Permanent Access via Moolre.`}
        />
      </div>
    );
  }

  if (!activeLesson || !activeCourse) {
    return (
      <Card className="p-8 text-center space-y-3 my-6">
        <VideoIcon size={32} className="mx-auto text-[#ffb600]" />
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
            className="mt-2 border border-[#ffb600]/40 bg-[#ffb600]/10 rounded-xl"
          >
            <i>
              <Icon name="chart" />
            </i>
            <span>
              <strong className="text-[#ffb600]">Take {activeCourse.level} PDF Quiz</strong>
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
                <strong className="text-[#ffb600] font-mono uppercase text-[10px] block mb-0.5">
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
        ctx.strokeStyle = "#ffb600";
        ctx.lineWidth = 6;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
        ctx.strokeStyle = "rgba(255, 182, 0, 0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(58, 58, canvas.width - 116, canvas.height - 116);

        ctx.fillStyle = "#ffb600";
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
      ctx.fillStyle = certTemplate.fontColor || "#ffb600";
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
        ctx.fillStyle = "#ffb600";
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
                  className="block text-[10px] font-mono text-[#ffb600] hover:underline mt-1"
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
              <Link to="/quiz/forex-foundations" className="text-[#ffb600] underline">
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
            <Award size={32} className="mx-auto text-[#ffb600]" />
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
                className="p-5 rounded-2xl bg-gradient-to-br from-[#181d29] to-[#11151d] border border-[#ffb600]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
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
          <div className="bg-[#0e1118] border-2 border-[#ffb600] rounded-3xl p-5 sm:p-7 max-w-3xl w-full text-center space-y-5 shadow-2xl relative">
            {/* Live Rendered Certificate Using Admin's Uploaded Template + Student Name Overlay */}
            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-[#ffb600]/40 bg-[#0b0e14] shadow-2xl select-none">
              {certTemplate.templateImageUrl ? (
                <img
                  src={certTemplate.templateImageUrl}
                  alt="Official Certificate Template"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#141926] via-[#0e121b] to-[#191f2e] flex flex-col items-center justify-between p-8 border-[6px] border-double border-[#ffb600]/40">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#ffb600]">
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
                      <span className="text-[#ffb600]">{previewCert.certificateCode}</span>
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
                    color: certTemplate.fontColor || "#ffb600",
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
  const subAccess = getStudentSubscriptionAccess(student);
  const isLiveUnlocked = isDepositCompleted && subAccess.canAccessLiveStream;

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

      {isDepositCompleted && !subAccess.canAccessLiveStream && (
        <SubscriptionGateNotice
          featureTitle="Live Stream & Trading Rooms Locked · Free Trial Expired"
          featureDescription="Your 1-month free full-access period has expired. Signals and Beginner/Intermediate courses remain free, while Live Streams, Market Insights, and Essential/Advanced courses unlock with the $20/Month plan or $100 Permanent VIP Access via Moolre."
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
            {isLiveUnlocked ? (
              <Link
                className="p-button primary rounded-full"
                to={`/sessions/live/${featured.id}`}
              >
                <Icon name="video" />{" "}
                {isLiveNow ? "Watch Live Screen Share Now" : "Enter Waiting Room & Live Chat"}
              </Link>
            ) : !subAccess.canAccessLiveStream ? (
              <span className="text-xs text-[#ffb600] font-bold flex items-center gap-1.5">
                <Lock size={14} /> Free Trial Expired · Upgrade via Moolre ($20/mo) to Watch Live Stream
              </span>
            ) : (
              <span className="text-xs text-[#ffb600] font-bold flex items-center gap-1.5">
                <Lock size={14} /> Deposit $50 to Enter Live Room
              </span>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center space-y-3 my-4 border border-dashed border-white/15">
          <Radio size={32} className="mx-auto text-[#ffb600]" />
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
                {isLiveUnlocked ? (
                  <Link className="p-button secondary" to={`/sessions/live/${s.id}`}>
                    {s.status === "live" ? "Join Live Stream Now" : "Enter Live Room"}
                  </Link>
                ) : (
                  <Button variant="secondary" disabled>
                    {!subAccess.canAccessLiveStream ? "Locked ($20/mo Moolre)" : "Locked ($50 Deposit)"}
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
  const subAccess = getStudentSubscriptionAccess(student);

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

  if (!subAccess.canAccessLiveStream) {
    return (
      <div className="py-8">
        <SubscriptionGateNotice
          featureTitle="Live Broadcast Room Locked · Free Trial Expired"
          featureDescription="Your 1-month free trial has ended. Upgrade to the $20/Month plan or $100 Permanent VIP Access via Moolre to watch live screen-share broadcasts and trade live with Pastor Mike."
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
                  <span className="text-xs font-mono text-[#ffb600]">
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
                <Link to={res.url || "/signals"} className="text-xs font-bold text-[#ffb600]">
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
              <div className="mb-3 p-2.5 rounded-xl bg-[#ffb600]/10 border border-[#ffb600]/30 text-xs">
                <span className="text-[10px] font-mono uppercase text-[#ffb600] block">
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
                    <b className={m.isHost ? "text-[#ffb600]" : ""}>
                      {m.senderName}{" "}
                      {m.isHost && (
                        <span className="text-[9px] font-mono bg-[#ffb600]/20 text-[#ffb600] px-1.5 py-0.5 rounded ml-1">
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
        <div className="mb-5 p-3.5 rounded-xl bg-[#ffb600]/10 border border-[#ffb600]/30 text-xs text-[#ffb600] flex items-center gap-2">
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
                          <span className="block text-[10px] text-[#ffb600]/90 mt-0.5">
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
                    ? "bg-[#ffb600] text-black"
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
      <div className="bg-[#11151f] border-2 border-[#ffb600]/50 rounded-3xl p-6 sm:p-7 max-w-xl w-full text-left space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#ffb600]">
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
              <span className="text-[11px] font-mono text-[#ffb600]">
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
              className="w-full h-11 bg-[#161b26] border border-white/15 rounded-xl px-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#ffb600]"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[0.01, 0.05, 0.1, 0.25, 0.5, 1.0].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCustomLots(String(preset))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition cursor-pointer ${
                    Number(customLots) === preset
                      ? "bg-[#ffb600] text-black border-[#ffb600]"
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
              className="accent-[#ffb600] w-4 h-4"
            />
            <span>
              Also open <strong>Exness WebTerminal</strong> in a new tab to place this live order on account{" "}
              <code className="text-[#ffb600]">
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
  const [showPermanentUpgradeModal, setShowPermanentUpgradeModal] = useState(false);

  // Interactive Lot Size Calculator state
  const [calcBalance, setCalcBalance] = useState(String(student.accountBalanceUsd ?? 500));
  const [calcRiskPct, setCalcRiskPct] = useState(String(student.riskPerTradePct ?? 1.0));
  const [calcStopPips, setCalcStopPips] = useState("30");

  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;
  const subAccess = getStudentSubscriptionAccess(student);

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
        copy="Trading signals remain unlocked for all verified students (even after your 1-month free trial). One-click Exness Copy Trading is unlocked on the $100 Permanent VIP tier."
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

      {showPermanentUpgradeModal && (
        <MoolreCheckoutModal
          student={student}
          initialPlan="permanent_100"
          onClose={() => setShowPermanentUpgradeModal(false)}
        />
      )}

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
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600] font-bold">
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
          <h3>
            Automatic Signal Copying ($100 Permanent VIP Feature) is{" "}
            {subAccess.canCopyTradeSignals && copy ? "ON" : "LOCKED / OFF"}
          </h3>
          <p>
            {subAccess.canCopyTradeSignals
              ? `New signals posted by Pastor Mike ${
                  copy ? "are" : "are not"
                } queued for your linked Exness account (${
                  student.exnessId ? `••••${student.exnessId.slice(-4)}` : "Unlinked"
                }).`
              : "Upgrade to the $100 Permanent VIP Access tier via Moolre to unlock automatic Exness signal copying, 1-on-1 Live Mentorship, and $500 Account Management."}
          </p>
        </span>
        {subAccess.canCopyTradeSignals ? (
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
        ) : (
          <button
            type="button"
            onClick={() => setShowPermanentUpgradeModal(true)}
            className="px-4 py-2 rounded-xl bg-[#ffb600] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Crown size={14} /> Unlock Copy Trading ($100)
          </button>
        )}
        <Link to="/settings">Manage risk settings</Link>
      </Card>

      {/* Redesigned Interactive Position Size & Risk Calculator Card */}
      <section className="mb-6 rounded-2xl bg-gradient-to-b from-[#161b26] to-[#10141d] border border-white/10 p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-white/10">
          <div className="flex items-start sm:items-center gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-[#ffb600]/15 border border-[#ffb600]/30 text-[#ffb600] flex items-center justify-center shrink-0">
              <Calculator size={20} />
            </span>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-[0.14em] text-[#ffb600] block">
                INTERACTIVE POSITION SIZE &amp; RISK CALCULATOR
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug m-0">
                Calculate Exact Standard Lots Before Entering Any Signal
              </h3>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#cfd7e4] self-start md:self-auto">
            <span>Max Risk:</span>
            <strong className="text-[#ffb600]">${lotCalc.riskUsd.toFixed(2)} USD</strong>
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
              className="w-full h-11 bg-[#151a24] border border-white/15 rounded-xl px-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#ffb600]"
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
              className="w-full h-11 bg-[#151a24] border border-white/15 rounded-xl px-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#ffb600]"
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
              className="w-full h-11 bg-[#151a24] border border-white/15 rounded-xl px-3.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#ffb600]"
            />
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#ffb600]/20 to-[#ffb600]/5 border-2 border-[#ffb600]/50 flex flex-col justify-center text-center">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#ffb600] block">
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
          <Link to="/trades" className="text-[#ffb600] font-bold hover:underline shrink-0">
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
            className={tab === key ? "active bg-[#ffb600] text-black font-bold" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredSignals.length === 0 ? (
        <Card className="p-8 text-center space-y-2 border border-dashed border-white/15 my-4">
          <Target size={30} className="mx-auto text-[#ffb600]" />
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
                        Live Market: <strong className="text-[#ffb600]">{livePrice}</strong>
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
                            if (subAccess.canCopyTradeSignals) {
                              setCopyModalSignal(s);
                            } else {
                              setShowPermanentUpgradeModal(true);
                            }
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          {subAccess.canCopyTradeSignals ? (
                            "Copy & Log Trade"
                          ) : (
                            <>
                              <Lock size={12} /> Copy Trade ($100 VIP)
                            </>
                          )}
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
  const [showPermanentUpgradeModal, setShowPermanentUpgradeModal] = useState(false);
  const isDepositCompleted = student.depositVerified && student.depositAmount >= 50;
  const subAccess = getStudentSubscriptionAccess(student);

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
      {showPermanentUpgradeModal && (
        <MoolreCheckoutModal
          student={student}
          initialPlan="permanent_100"
          onClose={() => setShowPermanentUpgradeModal(false)}
        />
      )}
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
          <Button
            onClick={() => {
              if (subAccess.canCopyTradeSignals) {
                setCopyModalOpen(true);
              } else {
                setShowPermanentUpgradeModal(true);
              }
            }}
          >
            {subAccess.canCopyTradeSignals
              ? `Copy & Log to Exness (${lotCalc.recommendedLots} Lots)`
              : "Unlock Exness Copy Trading ($100 VIP)"}
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
                  <span className="text-[10px] font-mono uppercase text-[#ffb600] block">
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
                className="w-10 h-10 rounded-full object-cover border border-[#ffb600]/50"
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
              <strong className="text-[#ffb600]">{lotCalc.recommendedLots} Lots</strong> (${lotCalc.riskUsd} max risk).
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
// 7B. STUDENT 1-ON-1 LIVE MENTORSHIP PAGE (/mentorship)
//     - Dedicated Sidebar Tab for $100 Permanent VIP Access Members
// ============================================================================

export function Mentorship1on1Page() {
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const subAccess = getStudentSubscriptionAccess(student);
  const [sessions, setSessions] = useState<MentorshipSession1on1Item[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    void fetch1on1SessionsFromDb(student.email).then(setSessions);
  }, [student.email, syncTick]);

  return (
    <>
      <Header
        eyebrow="PRIVATE COACHING · $100 PERMANENT VIP ACCESS"
        title="1-on-1 Live Mentorship & Trading Sessions"
        copy="Private 1-on-1 live trading sessions scheduled by Pastor Mike exclusively for $100 Permanent Access members."
        action={
          <Badge tone={subAccess.canAccess1on1Mentorship ? "green" : "yellow"}>
            {subAccess.canAccess1on1Mentorship ? "● VIP 1-ON-1 UNLOCKED" : "REQUIRES $100 VIP"}
          </Badge>
        }
      />

      {showUpgradeModal && (
        <MoolreCheckoutModal
          student={student}
          initialPlan="permanent_100"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {!subAccess.canAccess1on1Mentorship ? (
        <SubscriptionGateNotice
          featureTitle="1-on-1 Live Mentorship Locked · $100 Permanent VIP Access Required"
          featureDescription="Upgrade to the $100 One-Time Permanent VIP Access plan via Moolre to unlock private 1-on-1 live trading & chart review sessions with Pastor Mike, automatic signal copy trading, and $500 Account Management."
          defaultPlan="permanent_100"
        />
      ) : (
        <div className="space-y-6">
          <Card className="p-6 border border-emerald-500/30 bg-gradient-to-r from-[#131926] to-[#0f131d]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                  PERMANENT VIP MENTORSHIP ROSTER · {student.email}
                </span>
                <h2 className="text-lg font-extrabold text-white">
                  Welcome to 1-on-1 VIP Mentorship, {student.fullName.split(" ")[0] || "Trader"}
                </h2>
                <p className="text-xs text-[#9aa4b5] max-w-2xl">
                  Pastor Mike schedules your private 1-on-1 live trading and strategy sessions from the Admin Console. As soon as a session is scheduled for you, it appears below with your direct meeting room link and trading focus.
                </p>
              </div>
              <Badge tone="green">{sessions.length} SCHEDULED SESSIONS</Badge>
            </div>
          </Card>

          {sessions.length === 0 ? (
            <Card className="p-8 text-center space-y-3 border border-dashed border-white/15">
              <Calendar size={32} className="mx-auto text-[#ffb600]" />
              <h3 className="text-base font-bold text-white">
                No 1-on-1 Mentorship Sessions Scheduled Yet
              </h3>
              <p className="text-xs text-[#9aa4b5] max-w-md mx-auto">
                Your $100 Permanent VIP status is active! Pastor Mike will schedule your upcoming 1-on-1 live trading session from the Admin Console, and you will receive an instant notification bell alert when your slot is posted.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((s) => (
                <Card key={s.id} className="p-5 space-y-3 border border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      tone={
                        s.status === "live"
                          ? "green"
                          : s.status === "completed"
                          ? "gray"
                          : "yellow"
                      }
                    >
                      {s.status === "live"
                        ? "● LIVE 1-ON-1 NOW"
                        : s.status === "completed"
                        ? "COMPLETED"
                        : "SCHEDULED 1-ON-1"}
                    </Badge>
                    <span className="text-xs font-mono text-[#ffb600] font-bold">
                      {s.focusPair} · {s.durationMinutes} mins
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">{s.topic}</h3>
                  <p className="text-xs text-[#9aa4b5]">{s.notes}</p>
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="font-mono text-[#cfd7e4]">
                      <Icon name="calendar" />{" "}
                      {new Date(s.scheduledAt).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Link
                      to={s.meetingUrl || "/sessions"}
                      className="px-4 py-2 rounded-xl bg-[#ffb600] text-black font-extrabold text-xs uppercase tracking-wider"
                    >
                      Join 1-on-1 Room →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ============================================================================
// 7C. STUDENT ACCOUNT MANAGEMENT & DIGITAL CONTRACT SIGNATURE PAGE (/account-management)
//     - Requires $100 Permanent VIP Access + Confirmed $500 Exness Deposit
//     - Fixed Non-Negotiable Contract Uploaded by Admin + Student Digital Signature
// ============================================================================

export function AccountManagementPage() {
  const student = useCurrentStudent();
  const syncTick = usePortalDataSync();
  const subAccess = getStudentSubscriptionAccess(student);

  const [contractTemplate, setContractTemplate] = useState<AccountManagementContractTemplate>(
    getCachedContractTemplate()
  );
  const [existingSig, setExistingSig] = useState<SignedAccountManagementContract | null>(null);
  const [exnessTradingId, setExnessTradingId] = useState(student.exnessId || "");
  const [typedSignature, setTypedSignature] = useState(student.fullName || "");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [tradingPasswordInput, setTradingPasswordInput] = useState("");
  const [submittingSig, setSubmittingSig] = useState(false);
  const [submittingPass, setSubmittingPass] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [syncingDeposit, setSyncingDeposit] = useState(false);

  useEffect(() => {
    void fetchContractTemplateFromDb().then(setContractTemplate);
    void fetchSignedContractsFromDb().then((list) => {
      const found = list.find(
        (c) => c.studentEmail.toLowerCase() === student.email.toLowerCase()
      );
      setExistingSig(found || null);
      if (found?.exnessTradingAccountId) {
        setExnessTradingId(found.exnessTradingAccountId);
      }
    });
  }, [student.email, syncTick]);

  const is500DepositConfirmed = subAccess.isAccountManagementDepositConfirmed;

  async function handleCheckExness500Deposit() {
    setSyncingDeposit(true);
    setFeedback(null);
    await syncExnessLiveWithSupabase();
    setSyncingDeposit(false);
    if (
      student.accountManagementDepositVerified ||
      student.depositAmount >= 500 ||
      (student.accountBalanceUsd ?? 0) >= 500
    ) {
      setFeedback("Your $500+ USD Exness deposit is confirmed! You can now sign the Account Management Contract below.");
    } else {
      setFeedback(
        `Current verified Exness deposit/equity is $${Math.max(
          student.depositAmount || 0,
          student.accountBalanceUsd || 0
        )} USD. Fund your Exness account to at least $500 USD or ask Admin to confirm your $500 deposit.`
      );
    }
  }

  async function handleSignContract(e: FormEvent) {
    e.preventDefault();
    if (!agreedTerms || !typedSignature.trim() || !exnessTradingId.trim()) return;
    setSubmittingSig(true);
    const signed = await signAccountManagementContractInDb({
      studentEmail: student.email,
      studentName: student.fullName,
      exnessTradingAccountId: exnessTradingId.trim(),
      depositAmountUsd: Math.max(500, student.depositAmount || 500, student.accountBalanceUsd || 500),
      digitalSignature: typedSignature.trim(),
      contractVersionTitle: contractTemplate.title,
      contractSnapshotText: contractTemplate.extractedText,
    });
    setExistingSig(signed);
    setSubmittingSig(false);
    setFeedback(
      "Contract digitally signed & saved! Admin has been notified with your Exness Trading Account ID."
    );
  }

  async function handleSendTradingPassword(e: FormEvent) {
    e.preventDefault();
    if (!existingSig || !tradingPasswordInput.trim()) return;
    setSubmittingPass(true);
    await submitTradingPasswordForContractInDb(existingSig.id, tradingPasswordInput.trim());
    const list = await fetchSignedContractsFromDb();
    const updated = list.find((c) => c.id === existingSig.id) || null;
    setExistingSig(updated);
    setSubmittingPass(false);
    setTradingPasswordInput("");
    setFeedback("Trading password securely transmitted to Pastor Mike for Account Management.");
  }

  return (
    <>
      <Header
        eyebrow="EXNESS PAMM & ACCOUNT MANAGEMENT · $100 PERMANENT VIP"
        title="$500+ Exness Account Management & Profit-Split Contract"
        copy="Permanent VIP members with a confirmed $500+ USD Exness deposit can review the fixed Account Management Contract and append their Digital Signature."
        action={
          <Badge tone={existingSig ? "green" : is500DepositConfirmed ? "yellow" : "gray"}>
            {existingSig
              ? "✓ CONTRACT SIGNED"
              : is500DepositConfirmed
              ? "$500 DEPOSIT CONFIRMED"
              : "AWAITING $500 DEPOSIT"}
          </Badge>
        }
      />

      {!subAccess.canAccessAccountManagement ? (
        <SubscriptionGateNotice
          featureTitle="Account Management Locked · $100 Permanent VIP Access Required"
          featureDescription="Account Management by Pastor Mike is exclusively available to $100 One-Time Permanent VIP members who deposit at least $500 USD into their linked Exness trading account."
          defaultPlan="permanent_100"
        />
      ) : (
        <div className="space-y-6">
          {/* Step 1: $500 Exness Deposit Verification Banner */}
          <Card className="p-6 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600] font-bold">
                    STEP 1 OF 2 · MINIMUM $500 USD EXNESS TRADING CAPITAL
                  </span>
                  <Badge tone={is500DepositConfirmed ? "green" : "red"}>
                    {is500DepositConfirmed ? "✓ $500+ VERIFIED" : "MINIMUM $500 REQUIRED"}
                  </Badge>
                </div>
                <h2 className="text-lg font-extrabold text-white">
                  {is500DepositConfirmed
                    ? "Your $500+ Exness Capital Requirement is Confirmed"
                    : "Fund Your Exness Account with $500+ USD to Unlock the Digital Contract"}
                </h2>
                <p className="text-xs text-[#9aa4b5] max-w-2xl">
                  To qualify for hands-free Account Management and Profit Split ({contractTemplate.profitSplitLabel}), your linked Exness account must hold at least <strong>$500 USD</strong> (verified via Exness Partner API sync or Admin confirmation).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={syncingDeposit}
                  onClick={() => void handleCheckExness500Deposit()}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} className={syncingDeposit ? "animate-spin" : ""} />
                  {syncingDeposit ? "Checking Exness..." : "Verify $500 Exness Deposit"}
                </button>
              </div>
            </div>
          </Card>

          {feedback && (
            <div className="p-4 rounded-2xl bg-[#ffb600]/15 border border-[#ffb600]/40 text-xs text-[#ffb600] flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Step 2: Fixed Non-Negotiable Account Management Contract & Digital Signature */}
          <Card className="p-6 space-y-5 border border-[#ffb600]/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600] font-bold block">
                  STEP 2 OF 2 · FIXED NON-NEGOTIABLE AGREEMENT ({contractTemplate.uploadedFileName})
                </span>
                <h2 className="text-lg font-extrabold text-white mt-0.5">
                  {contractTemplate.title}
                </h2>
              </div>
              <Badge tone="yellow">{contractTemplate.profitSplitLabel}</Badge>
            </div>

            {/* Extracted Fixed Contract Document Viewer */}
            <div className="p-5 rounded-2xl bg-[#090c12] border border-white/15 max-h-[340px] overflow-y-auto font-mono text-xs text-[#d6deeb] whitespace-pre-wrap leading-relaxed select-text">
              {contractTemplate.extractedText}
            </div>

            {existingSig ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                      ✓ DIGITALLY SIGNED &amp; LOCKED IN DATABASE
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      Signed by {existingSig.digitalSignature} on{" "}
                      {new Date(existingSig.signedAt).toLocaleString()}
                    </h3>
                  </div>
                  <Badge tone="green">
                    EXNESS ID: {existingSig.exnessTradingAccountId}
                  </Badge>
                </div>

                <p className="text-xs text-[#cfd7e4]">
                  Your signed Account Management Contract and Exness Trading Account ID (
                  <strong className="text-[#ffb600] font-mono">
                    {existingSig.exnessTradingAccountId}
                  </strong>
                  ) are now visible to Pastor Mike in the Admin Console.
                </p>

                {/* If Admin requested Trading Password or Student wants to provide it */}
                {(existingSig.passwordRequestedByAdmin || !existingSig.tradingPasswordSubmitted) && (
                  <form
                    onSubmit={handleSendTradingPassword}
                    className="p-4 rounded-xl bg-[#0d111a] border border-[#ffb600]/40 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#ffb600] uppercase">
                        {existingSig.passwordRequestedByAdmin
                          ? "🔔 ADMIN REQUESTED YOUR EXNESS TRADING PASSWORD TO START MANAGEMENT"
                          : "SUBMIT EXNESS MT4/MT5 TRADING PASSWORD FOR MANAGEMENT"}
                      </span>
                      <Badge tone={existingSig.tradingPasswordSubmitted ? "green" : "yellow"}>
                        {existingSig.tradingPasswordSubmitted ? "SUBMITTED" : "AWAITING PASSWORD"}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="password"
                        required
                        value={tradingPasswordInput}
                        onChange={(e) => setTradingPasswordInput(e.target.value)}
                        placeholder={`Enter Trading Password for Exness Account #${existingSig.exnessTradingAccountId}...`}
                        className="flex-1 h-11 bg-[#151a26] border border-white/15 rounded-xl px-3.5 text-xs font-mono text-white"
                      />
                      <Button type="submit" disabled={submittingPass}>
                        {submittingPass ? "Sending..." : "Submit Trading Password to Admin"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : !is500DepositConfirmed ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-3">
                <Lock size={18} className="text-[#ffb600] shrink-0" />
                <span>
                  Digital Signature is locked until your <strong>$500 USD Exness deposit</strong> is confirmed. Once your $500 deposit is verified by Exness Partner Sync or Admin, the signature box below unlocks immediately.
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSignContract}
                className="p-5 rounded-2xl bg-[#121722] border border-white/10 space-y-4"
              >
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <FileSignature size={17} className="text-[#ffb600]" />
                  Append Your Digital Signature (Fixed Non-Negotiable Terms)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      Your Exness Trading Account ID ($500+ Funded) *
                    </label>
                    <input
                      type="text"
                      required
                      value={exnessTradingId}
                      onChange={(e) => setExnessTradingId(e.target.value)}
                      placeholder="e.g. 104859321"
                      className="w-full h-11 bg-[#0b0e15] border border-white/15 rounded-xl px-3.5 text-sm font-mono font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      Type Full Legal Name as Digital Signature *
                    </label>
                    <input
                      type="text"
                      required
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="Type your full legal name..."
                      className="w-full h-11 bg-[#0b0e15] border border-[#ffb600]/50 rounded-xl px-3.5 text-sm font-serif italic font-bold text-[#ffb600]"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-[#cfd7e4] cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="accent-[#ffb600] mt-0.5 w-4 h-4"
                  />
                  <span>
                    I have read and agree to the fixed, non-negotiable{" "}
                    <strong>{contractTemplate.title}</strong> ({contractTemplate.profitSplitLabel}), confirm that my Exness account holds at least $500 USD, and authorize Pastor Mike to request my trading password to manage the account and split profits.
                  </span>
                </label>

                <div className="flex justify-end">
                  <Button type="submit" disabled={submittingSig || !agreedTerms}>
                    <FileSignature size={15} />{" "}
                    {submittingSig
                      ? "Recording Digital Signature..."
                      : "Sign Contract & Send Exness ID to Admin"}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
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
              "Exness Partner Sync & Tickets",
              "Sync external Exness Partner accounts, transfer tickets & student verification",
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
                        <b>
                          {s.fullName}{" "}
                          {s.username && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[#ffb600]/15 text-[#ffb600] font-mono text-[10px]">
                              @{s.username}
                            </span>
                          )}
                        </b>
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
                        s.depositAmount >= 50 ? "text-[#ffb600]" : "text-[#9aa4b5]"
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
                className="text-[11px] font-mono text-[#ffb600] hover:underline block text-center mt-1"
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
              <div className="p-2.5 rounded-xl bg-[#ffb600]/10 border border-[#ffb600]/30 text-xs text-[#ffb600] my-2">
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
                        className="px-2.5 py-1 rounded-lg bg-[#ffb600] text-black font-extrabold text-[11px] cursor-pointer"
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
  const [config] = useState<ExnessConfig>(getStoredConfig());
  const [roster, setRoster] = useState<ExnessStudent[]>(getStoredRoster());

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

  // Live Auto-Sync from Exness Partner Link
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
        eyebrow="EXNESS PARTNER SYNC & TICKETS"
        title="Exness Partner Accounts & Transfer Tickets"
        copy="Sync external Exness Partner accounts, review submitted partner transfer tickets, and manage student deposit eligibility."
        action={
          <button
            type="button"
            disabled={refreshingLiveExness}
            onClick={handleRefreshLiveFromExness}
            className="bg-[#ffb600] text-black font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-full hover:bg-[#ffc833] transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshingLiveExness ? "animate-spin" : ""} />
            {refreshingLiveExness ? "Syncing External Accounts..." : "Sync External Exness Partner Accounts"}
          </button>
        }
      />

      {/* LIVE EXNESS PARTNER API REFERRED CLIENTS & TRADING ACCOUNTS */}
      <Card className="data-card mb-8">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffb600]">
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
              className="px-3.5 py-1.5 rounded-lg bg-[#ffb600]/15 border border-[#ffb600]/40 text-[#ffb600] font-sans font-bold hover:bg-[#ffb600]/25 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCw size={13} className={refreshingLiveExness ? "animate-spin" : ""} />
              {refreshingLiveExness ? "Refreshing..." : "Sync from Partner Link"}
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#b8c0cc]">
              Volume: <b className="text-white">{EXNESS_PARTNER_TOTALS.volume_lots} lots</b>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[#ffb600]/10 border border-[#ffb600]/30 text-[#ffb600]">
              Rewards: <b>${EXNESS_PARTNER_TOTALS.reward_usd} USD</b>
            </span>
          </div>
        </div>
        {liveExnessFeedback && (
          <div className="mx-5 mb-3 p-3 rounded-xl bg-[#ffb600]/10 border border-[#ffb600]/30 text-xs text-[#ffb600] flex items-center gap-2">
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
                  <td className="font-mono text-xs font-bold text-[#ffb600]">
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
                    <strong className="text-[#ffb600]">${c.reward_usd}</strong>
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
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffb600]">
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
          <div className="mx-5 my-3 p-3 rounded-xl bg-[#ffb600]/10 border border-[#ffb600]/30 text-xs text-[#ffb600] flex items-center gap-2">
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
                    <td className="font-mono text-xs font-bold text-[#ffb600]">#{t.ticket_ref}</td>
                    <td className="text-xs text-white">{t.exness_email}</td>
                    <td className="font-mono text-xs text-[#ffb600] font-bold">
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
                          className="px-2.5 py-1 rounded bg-[#ffb600]/15 hover:bg-[#ffb600]/25 text-[11px] font-bold text-[#ffb600] border border-[#ffb600]/40 transition cursor-pointer flex items-center gap-1 disabled:opacity-60"
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
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#ffb600] bg-[#ffb600]/10 px-2 py-0.5 rounded">
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
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffb600]"
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
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffb600]"
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
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffb600]"
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
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffb600]"
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
                className="w-full bg-[#1b1f29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffb600]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={addingAccount}
              className="bg-[#ffb600] text-black font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-[#ffc833] transition cursor-pointer"
            >
              {addingAccount ? "Saving to Supabase..." : "+ Approve & Save Account to Supabase"}
            </button>

            {addAccountFeedback && (
              <span className="text-xs text-[#ffb600] font-semibold flex items-center gap-1.5">
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
                    <strong className={s.depositAmount >= 50 ? "text-[#ffb600]" : "text-[#9aa4b5]"}>
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
                            : "bg-[#ffb600] text-black hover:bg-[#ffc833]"
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
            className="px-4 py-2.5 rounded-full bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
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
              <span className="text-[#ffb600] font-bold">{pr}</span>
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
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffb600]">
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
                                  : "bg-white/5 text-[#d0d7e3] border-white/10 hover:border-[#ffb600]/50"
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
                                    ? "bg-[#ffb600] text-black"
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
  const syncTick = usePortalDataSync();
  const [roster, setRoster] = useState<ExnessStudent[]>(getStoredRoster());
  const [moolreConfig, setMoolreConfig] = useState<MoolrePaymentConfig>(getMoolreConfig());
  const [payments, setPayments] = useState<MoolrePaymentRecord[]>(getCachedMoolrePayments());
  const [sessions1on1, setSessions1on1] = useState<MentorshipSession1on1Item[]>([]);
  const [contractTemplate, setContractTemplate] = useState<AccountManagementContractTemplate>(
    getCachedContractTemplate()
  );
  const [signedContracts, setSignedContracts] = useState<SignedAccountManagementContract[]>([]);
  const [merchClaims, setMerchClaims] = useState<MerchClaimItem[]>([]);
  const [activeTab, setActiveTab] = useState<
    "TIERS" | "MOOLRE" | "MENTORSHIP_1ON1" | "CONTRACTS" | "MERCH_20" | "SEO_ANALYTICS"
  >("TIERS");
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [seoConfig, setSeoConfig] = useState<SeoAnalyticsConfig>(getSeoAnalyticsConfig());
  const [seoSavedMsg, setSeoSavedMsg] = useState<string | null>(null);

  // 1-on-1 Session Scheduler Form State
  const [selectedVipEmail, setSelectedVipEmail] = useState("");
  const [topic1on1, setTopic1on1] = useState("Private 1-on-1 London/NY Institutional Execution");
  const [pair1on1, setPair1on1] = useState("XAU / USD · EUR / USD");
  const [date1on1, setDate1on1] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [duration1on1, setDuration1on1] = useState("60");
  const [notes1on1, setNotes1on1] = useState(
    "Bring your trade journal and linked Exness account for live chart breakdown."
  );

  useEffect(() => {
    setRoster(getStoredRoster());
    setSeoConfig(getSeoAnalyticsConfig());
    void fetchMoolrePaymentsFromDb().then(setPayments);
    void fetch1on1SessionsFromDb().then(setSessions1on1);
    void fetchContractTemplateFromDb().then(setContractTemplate);
    void fetchSignedContractsFromDb().then(setSignedContracts);
    void fetchMerchClaimsFromDb().then(setMerchClaims);
  }, [syncTick]);

  const vip100Students = roster.filter((s) => s.subscriptionTier === "permanent_100");
  const monthly20Students = roster.filter((s) => s.subscriptionTier === "monthly_20");
  const totalRevenueUsd = payments.reduce((sum, p) => sum + (p.amountUsd || 0), 0);

  function showNotice(msg: string) {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 5000);
  }

  function handleSaveMoolreSettings(e: FormEvent) {
    e.preventDefault();
    saveMoolreConfig(moolreConfig);
    showNotice("Moolre Payment Gateway credentials & pricing saved!");
  }

  async function handleSchedule1on1(e: FormEvent) {
    e.preventDefault();
    const targetStudent =
      roster.find((s) => s.email === selectedVipEmail) || vip100Students[0] || roster[0];
    if (!targetStudent) return;
    await schedule1on1SessionInDb({
      studentEmail: targetStudent.email,
      studentName: targetStudent.fullName,
      topic: topic1on1.trim(),
      focusPair: pair1on1.trim(),
      scheduledAt: new Date(date1on1).toISOString(),
      durationMinutes: Number(duration1on1) || 60,
      meetingUrl: "/sessions",
      status: "scheduled",
      notes: notes1on1.trim(),
    });
    const updated = await fetch1on1SessionsFromDb();
    setSessions1on1(updated);
    showNotice(`Scheduled 1-on-1 Live Mentorship session for ${targetStudent.fullName}!`);
  }

  async function handleUploadContractFile(file: File | null) {
    if (!file) return;
    const text = await extractTextFromUploadedContractFile(file);
    const nextTemplate: AccountManagementContractTemplate = {
      ...contractTemplate,
      uploadedFileName: file.name,
      extractedText: text,
      updatedAt: new Date().toISOString(),
    };
    const saved = await saveContractTemplateInDb(nextTemplate);
    setContractTemplate(saved);
    showNotice(
      `Uploaded "${file.name}" and extracted fixed contract terms (${text.length} chars) for student digital signature!`
    );
  }

  async function handleSaveContractEdits(e: FormEvent) {
    e.preventDefault();
    const saved = await saveContractTemplateInDb(contractTemplate);
    setContractTemplate(saved);
    showNotice("Fixed Account Management Contract updated and published to student portals!");
  }

  return (
    <>
      <Header
        eyebrow="MOOLRE PAYMENT GATEWAY · VIP MENTORSHIP · ACCOUNT MANAGEMENT · MERCH"
        title="Monetization, Moolre API, Contracts & Merch Claims"
        copy="Configure Moolre Mobile Money & Card checkout ($20/month & $100 Permanent VIP), schedule 1-on-1 sessions, upload the Account Management contract, and manage First 20 Registrants merch claims."
      />

      {statusBanner && (
        <div className="mb-5 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      <div className="metrics-grid four">
        <Metric
          label="Moolre Revenue"
          value={`$${totalRevenueUsd.toLocaleString()}`}
          change={`${payments.length} completed checkouts`}
          icon="wallet"
        />
        <Metric
          label="$20/Month Subscribers"
          value={`${monthly20Students.length}`}
          change="Full courses + Live + Insights"
          icon="users"
        />
        <Metric
          label="$100 Permanent VIPs"
          value={`${vip100Students.length}`}
          change={`${signedContracts.length} signed contracts`}
          icon="shield"
        />
        <Metric
          label="First 20 Merch Claims"
          value={`${merchClaims.length} / 20`}
          change={`${Math.max(0, 20 - merchClaims.length)} spots left`}
          icon="check"
        />
      </div>

      {/* Admin Sub-Navigation Tabs */}
      <div className="tabs mb-6">
        {(
          [
            ["TIERS", `Student Tiers & $500 Deposit (${roster.length})`],
            ["MOOLRE", "Moolre API Gateway Setup"],
            ["MENTORSHIP_1ON1", `1-on-1 VIP Scheduler (${sessions1on1.length})`],
            ["CONTRACTS", `Account Management Contracts (${signedContracts.length})`],
            ["MERCH_20", `First 20 Merch Giveaway (${merchClaims.length}/20)`],
            ["SEO_ANALYTICS", "SEO, Google Analytics & Search Console"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={activeTab === key ? "active bg-[#ffb600] text-black font-bold" : ""}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: STUDENT TIERS & $500 ACCOUNT MANAGEMENT DEPOSIT VERIFICATION */}
      {activeTab === "TIERS" && (
        <div className="space-y-6">
          <Card className="data-card">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
                  3-TIER ACCESS CONTROL · 1-MONTH FREE TRIAL → $20/MO OR $100 PERMANENT VIP
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Student Subscription Tiers &amp; $500 Account Management Verification
                </h3>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Current Tier</th>
                    <th>Exness Account &amp; Equity</th>
                    <th>$500 Mgmt Deposit</th>
                    <th>Change Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((s) => {
                    const access = getStudentSubscriptionAccess(s);
                    const has500 = access.isAccountManagementDepositConfirmed;
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
                          <Badge
                            tone={
                              access.effectiveTier === "permanent_100" ||
                              access.effectiveTier === "monthly_20"
                                ? "green"
                                : access.effectiveTier === "free_trial"
                                ? "yellow"
                                : "red"
                            }
                          >
                            {access.tierLabel}
                          </Badge>
                        </td>
                        <td className="font-mono text-xs">
                          <div>ID: {s.exnessId || "Unlinked"}</div>
                          <small className="text-[#9aa4b5]">
                            Deposit: ${s.depositAmount || 0} · Equity: ${s.accountBalanceUsd || 0}
                          </small>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              updateStudentTierInStore(s.email, {
                                accountManagementDepositVerified: !has500,
                                depositAmount: !has500
                                  ? Math.max(500, s.depositAmount || 500)
                                  : 50,
                              });
                              setRoster(getStoredRoster());
                              showNotice(
                                `${!has500 ? "Confirmed" : "Revoked"} $500 Exness Account Management deposit for ${s.fullName}`
                              );
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                              has500
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-white/5 text-[#9aa4b5] border-white/10 hover:text-white"
                            }`}
                          >
                            {has500 ? "✓ $500 Confirmed" : "Confirm $500 Deposit"}
                          </button>
                        </td>
                        <td>
                          <select
                            value={s.subscriptionTier || "free_trial"}
                            onChange={(e) => {
                              const nextTier = e.target.value as SubscriptionTier;
                              const now = new Date();
                              updateStudentTierInStore(s.email, {
                                subscriptionTier: nextTier,
                                trialEndsAt:
                                  nextTier === "free_trial"
                                    ? new Date(now.getTime() + 30 * 86400000).toISOString()
                                    : nextTier === "expired_free"
                                    ? new Date(now.getTime() - 86400000).toISOString()
                                    : s.trialEndsAt,
                                subscriptionEndsAt:
                                  nextTier === "monthly_20"
                                    ? new Date(now.getTime() + 30 * 86400000).toISOString()
                                    : nextTier === "permanent_100"
                                    ? "2099-12-31T23:59:59.000Z"
                                    : s.subscriptionEndsAt,
                              });
                              setRoster(getStoredRoster());
                              showNotice(`Updated ${s.fullName} to ${nextTier}`);
                            }}
                            className="bg-[#141821] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                          >
                            <option value="free_trial">1-Month Free Trial</option>
                            <option value="expired_free">Expired Free (Signals + Beg/Int Only)</option>
                            <option value="monthly_20">$20 / Month Plan</option>
                            <option value="permanent_100">$100 Permanent VIP</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Moolre Payment Ledger */}
          <Card className="data-card">
            <div className="p-5 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
                MOOLRE TRANSACTIONS · public.moolre_payments
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Recent Moolre Checkouts ({payments.length})
              </h3>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Student</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Phone / Network</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-[#8c95a6]">
                        No Moolre payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono text-xs text-[#ffb600]">{p.externalRef}</td>
                        <td>
                          <b>{p.studentName}</b>
                          <small className="block text-[10px] text-[#8c95a6]">
                            {p.studentEmail}
                          </small>
                        </td>
                        <td>
                          <Badge tone={p.plan === "permanent_100" ? "green" : "yellow"}>
                            {p.plan === "permanent_100" ? "$100 PERMANENT VIP" : "$20 / MONTH"}
                          </Badge>
                        </td>
                        <td className="font-mono font-bold text-white">
                          ${p.amountUsd} ({p.currency} {p.amountLocal})
                        </td>
                        <td className="font-mono text-xs">
                          {p.network} · {p.phone}
                        </td>
                        <td>
                          <Badge tone="green">{p.status.toUpperCase()}</Badge>
                        </td>
                        <td className="text-xs text-[#9aa4b5]">
                          {new Date(p.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: MOOLRE API CREDENTIALS & PRICING */}
      {activeTab === "MOOLRE" && (
        <Card className="p-6 max-w-3xl space-y-5">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600] font-bold">
              MOOLRE PAYMENT GATEWAY (M-O-O-L-R-E) · API CONFIGURATION
            </span>
            <h2 className="text-lg font-extrabold text-white mt-1">
              Moolre Merchant Credentials &amp; Plan Pricing
            </h2>
            <p className="text-xs text-[#9aa4b5] mt-1">
              Connect your Moolre API User (`X-API-USER`), Public Key (`X-API-PUBKEY`), and Merchant Account Number to process live Mobile Money (MTN, Telecel, AirtelTigo) and Card payments.
            </p>
          </div>

          <form onSubmit={handleSaveMoolreSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Moolre API Username (X-API-USER)
                </label>
                <input
                  type="text"
                  value={moolreConfig.apiUser}
                  onChange={(e) =>
                    setMoolreConfig({ ...moolreConfig, apiUser: e.target.value })
                  }
                  placeholder="Enter your Moolre X-API-USER..."
                  className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Moolre Merchant Account Number
                </label>
                <input
                  type="text"
                  value={moolreConfig.accountNumber}
                  onChange={(e) =>
                    setMoolreConfig({ ...moolreConfig, accountNumber: e.target.value })
                  }
                  placeholder="Enter your Moolre Account Number..."
                  className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Moolre Public API Key (X-API-PUBKEY)
              </label>
              <input
                type="password"
                value={moolreConfig.apiPubKey}
                onChange={(e) =>
                  setMoolreConfig({ ...moolreConfig, apiPubKey: e.target.value })
                }
                placeholder="Paste your Moolre X-API-PUBKEY..."
                className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3.5 text-xs font-mono text-white"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1">Currency</label>
                <select
                  value={moolreConfig.currency}
                  onChange={(e) =>
                    setMoolreConfig({
                      ...moolreConfig,
                      currency: e.target.value as "GHS" | "USD",
                    })
                  }
                  className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs font-mono text-white"
                >
                  <option value="GHS">GHS (₵)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  USD to GHS Rate
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={moolreConfig.usdToGhsRate}
                  onChange={(e) =>
                    setMoolreConfig({
                      ...moolreConfig,
                      usdToGhsRate: Number(e.target.value) || 15.5,
                    })
                  }
                  className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Monthly Plan ($ USD)
                </label>
                <input
                  type="number"
                  value={moolreConfig.monthlyPlanUsd}
                  onChange={(e) =>
                    setMoolreConfig({
                      ...moolreConfig,
                      monthlyPlanUsd: Number(e.target.value) || 20,
                    })
                  }
                  className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Permanent VIP ($ USD)
                </label>
                <input
                  type="number"
                  value={moolreConfig.permanentPlanUsd}
                  onChange={(e) =>
                    setMoolreConfig({
                      ...moolreConfig,
                      permanentPlanUsd: Number(e.target.value) || 100,
                    })
                  }
                  className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit">Save Moolre Gateway Configuration</Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: 1-ON-1 VIP LIVE MENTORSHIP SCHEDULER */}
      {activeTab === "MENTORSHIP_1ON1" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 p-6 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600] font-bold">
                SCHEDULE 1-ON-1 SESSION · $100 PERMANENT VIPs
              </span>
              <h3 className="text-base font-extrabold text-white mt-1">
                Book Private 1-on-1 Live Trading Session
              </h3>
            </div>
            <form onSubmit={handleSchedule1on1} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Select Student ($100 Permanent VIPs shown first)
                </label>
                <select
                  value={selectedVipEmail}
                  onChange={(e) => setSelectedVipEmail(e.target.value)}
                  className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs text-white"
                >
                  {roster.map((s) => (
                    <option key={s.email} value={s.email}>
                      {s.fullName} ({s.email}) —{" "}
                      {s.subscriptionTier === "permanent_100" ? "$100 VIP" : s.subscriptionTier || "Free Trial"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  1-on-1 Session Topic
                </label>
                <input
                  value={topic1on1}
                  onChange={(e) => setTopic1on1(e.target.value)}
                  required
                  className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Focus Pair</label>
                  <input
                    value={pair1on1}
                    onChange={(e) => setPair1on1(e.target.value)}
                    className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Duration (Min)
                  </label>
                  <input
                    type="number"
                    value={duration1on1}
                    onChange={(e) => setDuration1on1(e.target.value)}
                    className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs font-mono text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={date1on1}
                  onChange={(e) => setDate1on1(e.target.value)}
                  required
                  className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Preparation Notes for Student
                </label>
                <textarea
                  rows={3}
                  value={notes1on1}
                  onChange={(e) => setNotes1on1(e.target.value)}
                  className="w-full bg-[#141821] border border-white/15 rounded-xl p-3 text-xs text-white"
                />
              </div>
              <Button type="submit">Schedule 1-on-1 Session &amp; Notify Student</Button>
            </form>
          </Card>

          <Card className="lg:col-span-7 data-card">
            <div className="p-5 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
                SCHEDULED 1-ON-1 MENTORSHIP SESSIONS ({sessions1on1.length})
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Private VIP Coaching Calendar
              </h3>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Topic &amp; Pair</th>
                    <th>Date &amp; Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions1on1.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-xs text-[#8c95a6]">
                        No 1-on-1 sessions scheduled yet.
                      </td>
                    </tr>
                  ) : (
                    sessions1on1.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <b>{item.studentName}</b>
                          <small className="block text-[10px] text-[#8c95a6]">
                            {item.studentEmail}
                          </small>
                        </td>
                        <td>
                          <b>{item.topic}</b>
                          <small className="block text-[10px] font-mono text-[#ffb600]">
                            {item.focusPair} ({item.durationMinutes}m)
                          </small>
                        </td>
                        <td className="font-mono text-xs">
                          {new Date(item.scheduledAt).toLocaleString()}
                        </td>
                        <td>
                          <Badge tone={item.status === "live" ? "green" : "yellow"}>
                            {item.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                void update1on1SessionStatusInDb(
                                  item.id,
                                  item.status === "live" ? "completed" : "live"
                                ).then(() => fetch1on1SessionsFromDb().then(setSessions1on1))
                              }
                              className="px-2.5 py-1 rounded bg-[#ffb600] text-black text-[10px] font-bold cursor-pointer"
                            >
                              {item.status === "live" ? "Complete" : "Set Live"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void delete1on1SessionFromDb(item.id).then(() =>
                                  fetch1on1SessionsFromDb().then(setSessions1on1)
                                )
                              }
                              className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 text-[10px] font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: ACCOUNT MANAGEMENT CONTRACT UPLOAD & SIGNED CONTRACTS TABLE */}
      {activeTab === "CONTRACTS" && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600] font-bold">
                  UPLOAD CONTRACT DOCUMENT · AUTO-EXTRACTS FIXED NON-NEGOTIABLE TEXT
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Account Management Contract Template ({contractTemplate.uploadedFileName})
                </h3>
              </div>
              <label className="px-4 py-2.5 rounded-xl bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0">
                <Upload size={14} /> Upload Contract Document (.TXT / .PDF / .DOC)
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => void handleUploadContractFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <form onSubmit={handleSaveContractEdits} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Contract Title
                  </label>
                  <input
                    value={contractTemplate.title}
                    onChange={(e) =>
                      setContractTemplate({ ...contractTemplate, title: e.target.value })
                    }
                    className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Profit Split &amp; Minimum Capital Label
                  </label>
                  <input
                    value={contractTemplate.profitSplitLabel}
                    onChange={(e) =>
                      setContractTemplate({
                        ...contractTemplate,
                        profitSplitLabel: e.target.value,
                      })
                    }
                    className="w-full h-11 bg-[#141821] border border-white/15 rounded-xl px-3 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Extracted Fixed Contract Text (Read-Only for Students · Digital Signature Only)
                </label>
                <textarea
                  rows={10}
                  value={contractTemplate.extractedText}
                  onChange={(e) =>
                    setContractTemplate({
                      ...contractTemplate,
                      extractedText: e.target.value,
                    })
                  }
                  className="w-full bg-[#090c12] border border-white/15 rounded-xl p-4 font-mono text-xs text-[#d6deeb]"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Publish Fixed Contract to Student Portals</Button>
              </div>
            </form>
          </Card>

          {/* Digitally Signed Contracts & Exness Trading Account IDs */}
          <Card className="data-card">
            <div className="p-5 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
                SIGNED ACCOUNT MANAGEMENT CONTRACTS · EXNESS ACCOUNT ID &amp; PASSWORD REQUEST
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Students Who Digitally Signed ({signedContracts.length})
              </h3>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Digital Signature</th>
                    <th>Exness Trading Account ID</th>
                    <th>Verified Deposit</th>
                    <th>Trading Password Status</th>
                    <th>Admin Action</th>
                  </tr>
                </thead>
                <tbody>
                  {signedContracts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-xs text-[#8c95a6]">
                        No signed Account Management contracts yet. Once a $100 VIP student with a confirmed $500 deposit signs the contract, their Exness Trading Account ID appears here.
                      </td>
                    </tr>
                  ) : (
                    signedContracts.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <b>{c.studentName}</b>
                          <small className="block text-[10px] text-[#8c95a6]">
                            {c.studentEmail}
                          </small>
                        </td>
                        <td>
                          <span className="font-serif italic text-[#ffb600] font-bold">
                            {c.digitalSignature}
                          </span>
                          <small className="block text-[10px] text-[#8c95a6]">
                            {new Date(c.signedAt).toLocaleString()}
                          </small>
                        </td>
                        <td>
                          <span className="px-2.5 py-1 rounded-lg bg-[#ffb600]/15 border border-[#ffb600]/40 font-mono text-xs font-bold text-[#ffb600]">
                            #{c.exnessTradingAccountId}
                          </span>
                        </td>
                        <td className="font-mono font-bold text-emerald-400">
                          ${c.depositAmountUsd.toLocaleString()} USD
                        </td>
                        <td>
                          {c.tradingPasswordSubmitted ? (
                            <span className="font-mono text-xs text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                              PW: {c.tradingPasswordValue}
                            </span>
                          ) : c.passwordRequestedByAdmin ? (
                            <Badge tone="yellow">REQUEST SENT TO STUDENT</Badge>
                          ) : (
                            <Badge tone="gray">NOT REQUESTED YET</Badge>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              void requestTradingPasswordFromStudentInDb(c).then(async () => {
                                const list = await fetchSignedContractsFromDb();
                                setSignedContracts(list);
                                showNotice(
                                  `Sent Trading Password request alert to ${c.studentName} for Exness Account #${c.exnessTradingAccountId}!`
                                );
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs cursor-pointer"
                          >
                            Request Trading Password
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: FIRST 20 REGISTRANTS MERCH GIVEAWAY CLAIMS */}
      {activeTab === "MERCH_20" && (
        <Card className="data-card">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
                FIRST 20 REGISTRANTS · CANDLESTICKS &amp; EXNESS MERCH GIVEAWAY (T-SHIRT, TOTE BAG, CAP)
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Merch Delivery Claims ({merchClaims.length} / 20 Claimed)
              </h3>
            </div>
            <Badge tone="yellow">{Math.max(0, 20 - merchClaims.length)} SPOTS REMAINING</Badge>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Spot #</th>
                  <th>Full Name &amp; Email</th>
                  <th>Contact Number</th>
                  <th>Delivery Location</th>
                  <th>Preferred Delivery Time</th>
                  <th>Merch Pack</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {merchClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-xs text-[#8c95a6]">
                      No merch giveaway claims submitted yet. The Post-Registration Popup Modal automatically appears for the first 20 registrants right after onboarding.
                    </td>
                  </tr>
                ) : (
                  merchClaims.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <Badge tone="yellow">#{m.spotNumber} OF 20</Badge>
                      </td>
                      <td>
                        <b>{m.fullName}</b>
                        <small className="block text-[10px] text-[#8c95a6]">
                          {m.studentEmail}
                        </small>
                      </td>
                      <td className="font-mono text-xs text-white">{m.phone}</td>
                      <td className="text-xs text-[#cfd7e4]">{m.deliveryLocation}</td>
                      <td className="text-xs text-[#ffb600] font-mono">
                        {m.preferredDeliveryTime}
                      </td>
                      <td className="text-xs text-[#9aa4b5]">{m.merchItems}</td>
                      <td>
                        <select
                          value={m.status}
                          onChange={(e) =>
                            void updateMerchClaimStatusInDb(
                              m.id,
                              e.target.value as "pending" | "dispatched" | "delivered"
                            ).then(() => fetchMerchClaimsFromDb().then(setMerchClaims))
                          }
                          className="bg-[#141821] border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 6: SEARCH ENGINE OPTIMIZATION (SEO), GOOGLE ANALYTICS & GOOGLE SEARCH CONSOLE */}
      {activeTab === "SEO_ANALYTICS" && (
        <div className="space-y-6">
          {seoSavedMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{seoSavedMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSeoSavedMsg(null)}
                className="text-white/60 hover:text-white text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Quick Metrics & Indexing Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#141822] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8c95a6] text-xs font-mono">
                <span>PRIMARY INDEX DOMAIN</span>
                <Globe size={15} className="text-[#ffb600]" />
              </div>
              <div className="mt-2">
                <span className="text-white font-mono font-bold text-sm block truncate">
                  candlesticksacademy.online
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Canonical HTTPS Enforced
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141822] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8c95a6] text-xs font-mono">
                <span>GOOGLE ANALYTICS 4</span>
                <TrendingUp size={15} className="text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-white font-mono font-bold text-sm block">
                  {seoConfig.gaMeasurementId || "Not Configured"}
                </span>
                <span className="text-[10px] text-[#ffb600] font-mono flex items-center gap-1 mt-0.5">
                  <Check size={12} /> Live Event Telemetry Active
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141822] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8c95a6] text-xs font-mono">
                <span>SEARCH CONSOLE TAG</span>
                <ShieldCheck size={15} className="text-[#ffb600]" />
              </div>
              <div className="mt-2">
                <span className="text-white font-mono font-bold text-sm block truncate">
                  {seoConfig.gscVerificationTag || "GSC Verified"}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                  <Check size={12} /> HTML &amp; DNS Verification
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#141822] border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8c95a6] text-xs font-mono">
                <span>AI SEARCH ENGINE BOT INDEX</span>
                <Sparkles size={15} className="text-[#ffb600]" />
              </div>
              <div className="mt-2">
                <span className="text-white font-mono font-bold text-sm block">
                  GPTBot · Claude · Perplexity
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                  <Check size={12} /> llms.txt &amp; Schema.org Rich
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Form Card */}
          <Card className="data-card">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
                  SEARCH ENGINE OPTIMIZATION &amp; TRAFFIC ANALYTICS
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Google Analytics 4 &amp; Google Search Console Configuration
                </h3>
              </div>
              <Badge tone="yellow">LIVE ON CANDLESTICKSACADEMY.ONLINE</Badge>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveSeoAnalyticsConfig(seoConfig);
                setSeoSavedMsg(
                  "SEO & Google Analytics settings saved! Live tracking code and verification meta tags are updated across all pages."
                );
                setTimeout(() => setSeoSavedMsg(null), 6000);
              }}
              className="p-5 space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#a4abb6] mb-1.5">
                    Google Analytics 4 (GA4) Measurement ID
                  </label>
                  <input
                    type="text"
                    value={seoConfig.gaMeasurementId}
                    onChange={(e) =>
                      setSeoConfig({ ...seoConfig, gaMeasurementId: e.target.value.trim() })
                    }
                    placeholder="G-7R5Y1KZBEP"
                    className="w-full bg-[#11141d] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#ffb600] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#7f8a9d] mt-1">
                    Found in Google Analytics Admin &rarr; Data Streams &rarr; Measurement ID (Format: <code className="text-[#ffb600]">G-XXXXXXXXXX</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#a4abb6] mb-1.5">
                    Google Search Console (GSC) Verification Token
                  </label>
                  <input
                    type="text"
                    value={seoConfig.gscVerificationTag}
                    onChange={(e) =>
                      setSeoConfig({ ...seoConfig, gscVerificationTag: e.target.value.trim() })
                    }
                    placeholder="google-site-verification token or full tag"
                    className="w-full bg-[#11141d] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#ffb600] focus:outline-none"
                  />
                  <p className="text-[11px] text-[#7f8a9d] mt-1">
                    Enter your Google Search Console verification code (or paste the entire <code className="text-[#ffb600]">&lt;meta&gt;</code> tag).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#a4abb6] mb-1.5">
                  Search Engine Site Title (SERP)
                </label>
                <input
                  type="text"
                  value={seoConfig.siteTitle}
                  onChange={(e) => setSeoConfig({ ...seoConfig, siteTitle: e.target.value })}
                  placeholder="Candlesticks Academy | Institutional Forex Mentorship & Real-Time Trading Signals"
                  className="w-full bg-[#11141d] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#ffb600] focus:outline-none"
                />
                <p className="text-[11px] text-[#7f8a9d] mt-1">
                  The primary title shown in Google, Bing, DuckDuckGo, and social previews ({seoConfig.siteTitle.length} characters).
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#a4abb6] mb-1.5">
                  Search Meta Description
                </label>
                <textarea
                  rows={2}
                  value={seoConfig.metaDescription}
                  onChange={(e) => setSeoConfig({ ...seoConfig, metaDescription: e.target.value })}
                  placeholder="Official institutional Forex academy led by Pastor Mike. Master order flow, liquidity, London & NY sessions, and receive real-time institutional signals with Exness broker integration."
                  className="w-full bg-[#11141d] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-[#ffb600] focus:outline-none"
                />
                <p className="text-[11px] text-[#7f8a9d] mt-1">
                  Recommended length: 150-160 characters (Current: {seoConfig.metaDescription.length} chars).
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#a4abb6] mb-1.5">
                  High-Impact Financial Keywords
                </label>
                <input
                  type="text"
                  value={seoConfig.keywords}
                  onChange={(e) => setSeoConfig({ ...seoConfig, keywords: e.target.value })}
                  className="w-full bg-[#11141d] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#ffb600] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-6 border-t border-white/10">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#cfd7e4]">
                  <input
                    type="checkbox"
                    checked={seoConfig.enableGa}
                    onChange={(e) => setSeoConfig({ ...seoConfig, enableGa: e.target.checked })}
                    className="accent-[#ffb600] w-4 h-4 rounded"
                  />
                  <span>Enable Google Analytics 4 live telemetry</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#cfd7e4]">
                  <input
                    type="checkbox"
                    checked={seoConfig.enableAiSearchCrawlers}
                    onChange={(e) =>
                      setSeoConfig({ ...seoConfig, enableAiSearchCrawlers: e.target.checked })
                    }
                    className="accent-[#ffb600] w-4 h-4 rounded"
                  />
                  <span>Allow AI Search Engines (GPTBot, PerplexityBot, ClaudeBot, Google-Extended)</span>
                </label>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
                <div className="text-[11px] text-[#8c95a6]">
                  Last synced: <span className="text-white font-mono">{new Date(seoConfig.updatedAt || seoConfig.lastUpdated || Date.now()).toLocaleString()}</span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs cursor-pointer transition shadow-lg shadow-[#ffb600]/20 flex items-center gap-2"
                >
                  <Check size={14} /> Save &amp; Apply Live Tracking
                </button>
              </div>
            </form>
          </Card>

          {/* Search Engine Files & Rich Results Verification */}
          <Card className="data-card">
            <div className="p-5 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
                CRAWLER ASSETS &amp; STRUCTURED DATA VERIFICATION
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Essential Files &amp; Live Search Tools
              </h3>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#11141d] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">/sitemap.xml</span>
                  <Badge tone="green">XML ACTIVE</Badge>
                </div>
                <p className="text-[11px] text-[#8c95a6]">
                  Full index of all public academy routes with priorities (1.0 for home, 0.9 for courses/signals, 0.8 for mentorship).
                </p>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#ffb600] font-bold hover:underline pt-1"
                >
                  View sitemap.xml <ExternalLink size={12} />
                </a>
              </div>

              <div className="p-4 rounded-xl bg-[#11141d] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">/robots.txt</span>
                  <Badge tone="green">PERMISSIONS OK</Badge>
                </div>
                <p className="text-[11px] text-[#8c95a6]">
                  Explicit directives granting access to Googlebot, Bingbot, PerplexityBot, GPTBot, and ClaudeBot while protecting private auth routes.
                </p>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#ffb600] font-bold hover:underline pt-1"
                >
                  View robots.txt <ExternalLink size={12} />
                </a>
              </div>

              <div className="p-4 rounded-xl bg-[#11141d] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">/llms.txt</span>
                  <Badge tone="yellow">AI DISCOVERY</Badge>
                </div>
                <p className="text-[11px] text-[#8c95a6]">
                  Standard machine-readable knowledge base for LLM search assistants (ChatGPT, Perplexity, Claude, Gemini) to cite Candlesticks Academy.
                </p>
                <a
                  href="/llms.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#ffb600] font-bold hover:underline pt-1"
                >
                  View llms.txt <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 bg-[#0d1017] rounded-b-2xl">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-2">
                External Google Webmaster &amp; Rich Results Verifiers
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://search.google.com/test/rich-results?url=https%3A%2F%2Fcandlesticksacademy.online%2F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition"
                >
                  Google Rich Results Validator <ExternalLink size={12} />
                </a>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition"
                >
                  Google Search Console Console <ExternalLink size={12} />
                </a>
                <a
                  href="https://analytics.google.com/analytics/web/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition"
                >
                  Google Analytics 4 Live Dashboard <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </Card>

          {/* Google Search Snippet Fix & Instant Re-Index Assistant */}
          <Card className="data-card border-[#ffb600]/40">
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#ffb600]/[0.04]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
                  GOOGLE SEARCH SNIPPET &amp; CRAWL DIAGNOSTIC
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Fix &ldquo;We would like to show you a description here but the site won&apos;t allow us&rdquo;
                </h3>
              </div>
              <Badge tone="yellow">ACTION REQUIRED IN SEARCH CONSOLE</Badge>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <p className="font-bold flex items-center gap-2 text-white">
                  <AlertCircle size={15} className="text-[#ffb600]" />
                  Why Google Shows This Message Right Now:
                </p>
                <p className="text-[#cfd7e4] leading-relaxed">
                  Google displays this message when it indexed your domain (<code>www.candlesticksacademy.online</code>) from external web links, but Googlebot previously encountered a restrictive <code>robots.txt</code> or cached an early deployment state where the crawler wasn&apos;t permitted to read the page title and meta description.
                </p>
                <p className="text-[#cfd7e4] leading-relaxed">
                  <strong>The Good News:</strong> We have now completely opened and optimized <code>robots.txt</code>, added explicit HTML <code>&lt;title&gt;</code>, meta descriptions, Ghana/Africa geo-tags, and Schema.org rich data. You just need to trigger Googlebot to recrawl your site now!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Follow These 3 Steps to Recrawl and Rank #1:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#11141d] border border-white/10 space-y-1.5">
                    <span className="text-[#ffb600] font-mono font-bold">STEP 1</span>
                    <b className="block text-white">Open Search Console</b>
                    <p className="text-[#8c95a6] text-[11px]">
                      Sign in to Google Search Console with your Google account (<code>mike.vinci77@gmail.com</code>).
                    </p>
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#ffb600] font-bold text-[11px] hover:underline pt-1"
                    >
                      Open Google Search Console <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#11141d] border border-white/10 space-y-1.5">
                    <span className="text-[#ffb600] font-mono font-bold">STEP 2</span>
                    <b className="block text-white">Inspect Both URLs</b>
                    <p className="text-[#8c95a6] text-[11px]">
                      Paste <code className="text-[#ffb600]">https://candlesticksacademy.online/</code> into the top URL Inspection bar, then test <code className="text-[#ffb600]">https://www.candlesticksacademy.online/</code>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#11141d] border border-white/10 space-y-1.5">
                    <span className="text-[#ffb600] font-mono font-bold">STEP 3</span>
                    <b className="block text-white">Click &ldquo;Request Indexing&rdquo;</b>
                    <p className="text-[#8c95a6] text-[11px]">
                      Click <strong>&ldquo;Test Live URL&rdquo;</strong> &rarr; <strong>&ldquo;Request Indexing&rdquo;</strong>. Googlebot will immediately crawl the updated title, description, and rich snippet!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Subdomain Routing & Architecture Card */}
          <Card className="data-card">
            <div className="p-5 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600]">
                SUBDOMAIN ROUTING &amp; MULTI-TENANT ARCHITECTURE
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Domain Routing Architecture
              </h3>
            </div>
            <div className="p-5 space-y-3 text-xs text-[#a4abb6]">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#11141d] border border-white/10">
                <div>
                  <b className="text-white block font-mono">candlesticksacademy.online / www.candlesticksacademy.online</b>
                  <span className="text-[11px] text-[#7f8a9d]">Public Homepage, Curriculum, Pricing, Free Trial, and Student Signup</span>
                </div>
                <Badge tone="green">PUBLIC / SEO</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#11141d] border border-white/10">
                <div>
                  <b className="text-white block font-mono">student.candlesticksacademy.online</b>
                  <span className="text-[11px] text-[#7f8a9d]">Student Trading Terminal, Course Player, Signals, 1-on-1 Mentorship</span>
                </div>
                <Badge tone="yellow">CLIENT PORTAL</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#11141d] border border-white/10">
                <div>
                  <b className="text-white block font-mono">master.candlesticksacademy.online (or master.candlesticks.online)</b>
                  <span className="text-[11px] text-[#7f8a9d]">Founder Admin Console, Roster Management, Signal Broadcasting, Moolre &amp; SEO Controls</span>
                </div>
                <Badge tone="yellow">ADMIN PORTAL</Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 mt-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>
                  <strong>Clean URL Guarantee:</strong> The long character string (<code>?ca_sso=...</code>) has been permanently removed from the URL bar. Authentication uses secure domain-wide cookies across <code>.candlesticksacademy.online</code>.
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
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
