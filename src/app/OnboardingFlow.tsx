import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  DEFAULT_EXNESS_SUPPORT_EMAIL,
  DEFAULT_PARTNER_EMAIL,
  ExnessStudent,
  OFFICIAL_PARTNER_ACCOUNT_ID,
  OFFICIAL_PARTNER_CODE,
  OFFICIAL_PARTNER_LINK,
  PartnerTransferTicketResult,
  checkExnessAccountDeposit,
  connectExistingExnessClient,
  getStoredConfig,
  getStoredCurrentUser,
  getStoredRoster,
  refreshRosterFromSupabase,
  saveStoredCurrentUser,
  saveStoredRoster,
  syncExnessLiveWithSupabase,
  verifyExnessPartnerAccount,
} from "./exnessStore";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  Wallet,
} from "lucide-react";

// Signature Trading Candlestick Icon
function CandlestickGlyph({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Candle 1 (Ash/Gray wick & body) */}
      <line x1="5" y1="3" x2="5" y2="21" />
      <rect x="3.5" y1="6" width="3" height="10" rx="0.5" fill="currentColor" fillOpacity="0.2" />
      {/* Candle 2 (Yellow impulse) */}
      <line x1="12" y1="2" x2="12" y2="22" stroke="#ffde02" />
      <rect x="10.5" y1="5" width="3" height="12" rx="0.5" fill="#ffde02" stroke="#ffde02" />
      {/* Candle 3 (Doji / rejection) */}
      <line x1="19" y1="4" x2="19" y2="20" />
      <rect x="17.5" y1="8" width="3" height="5" rx="0.5" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

const COUNTRIES = [
  "Ghana",
  "Nigeria",
  "Kenya",
  "South Africa",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Cameroon",
  "Côte d'Ivoire",
  "United Kingdom",
  "United States",
  "Canada",
  "United Arab Emirates",
  "Other country",
];

export function OnboardingFlow() {
  const navigate = useNavigate();
  const config = getStoredConfig();
  const partnerLink = config.partnerLink || OFFICIAL_PARTNER_LINK;
  const partnerCode = config.partnerCode || OFFICIAL_PARTNER_CODE;

  // Onboarding steps:
  // Step 1 = Exness Partner Link & Referral Verification
  // Step 2 = Approved to Create Candlesticks Academy Account
  // Step 3 = $50 USD Deposit Check & Dashboard Activation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Navbar Partner ID copy state
  const [partnerIdCopied, setPartnerIdCopied] = useState(false);

  // Step 1 State: Exness Partner Link & Referral Check
  const [selectedHasAccount, setSelectedHasAccount] = useState<boolean>(false);
  const [clickedPartnerLink, setClickedPartnerLink] = useState<boolean>(false);
  const [exnessEmailInput, setExnessEmailInput] = useState("");
  const [exnessIdInput, setExnessIdInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showTicketHelper, setShowTicketHelper] = useState(false);
  const [ticketCopied, setTicketCopied] = useState(false);
  const [ticketEmailCopied, setTicketEmailCopied] = useState(false);

  // Exness Partner Transfer Email destinations (customizable)
  const [destinationEmail, setDestinationEmail] = useState(DEFAULT_EXNESS_SUPPORT_EMAIL);
  const [partnerEmail, setPartnerEmail] = useState(DEFAULT_PARTNER_EMAIL);
  const [transferResult, setTransferResult] = useState<PartnerTransferTicketResult | null>(null);

  // Live Partner Link Refresh & Connect Existing Account state
  const [refreshingPartnerData, setRefreshingPartnerData] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<string | null>(null);
  const [connectingExisting, setConnectingExisting] = useState(false);
  const [connectFeedback, setConnectFeedback] = useState<{
    success: boolean;
    message: string;
    ticketRef?: string;
  } | null>(null);

  // Matched database record state
  const [matchedDbStudent, setMatchedDbStudent] = useState<ExnessStudent | null>(null);
  const [verifiedClientId, setVerifiedClientId] = useState<string | undefined>(undefined);
  const [verifiedClientUid, setVerifiedClientUid] = useState<string | undefined>(undefined);

  // Step 2 State: Create Candlesticks Academy Account
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Ghana");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");

  // Step 3 State: Deposit Check
  const [depositChecking, setDepositChecking] = useState(false);
  const [currentDeposit, setCurrentDeposit] = useState(0);
  const [depositFeedback, setDepositFeedback] = useState<string | null>(null);

  useEffect(() => {
    void refreshRosterFromSupabase();
    const existing = getStoredCurrentUser();
    if (existing && existing.fullName && existing.fullName !== "Kwame Mensah") {
      setFullName(existing.fullName);
      setCountry(existing.country || "Ghana");
      setEmail(existing.email);
      if (existing.exnessEmail) {
        setExnessEmailInput(existing.exnessEmail);
      }
      if (existing.depositAmount) {
        setCurrentDeposit(existing.depositAmount);
      }
    }
  }, []);

  function handleCopyPartnerId() {
    navigator.clipboard.writeText(partnerCode);
    setPartnerIdCopied(true);
    setTimeout(() => setPartnerIdCopied(false), 2000);
  }

  // Live manual refresh from Exness Partner Link into Supabase SQL
  async function handleRefreshPartnerData() {
    setRefreshingPartnerData(true);
    setRefreshFeedback(null);
    const res = await syncExnessLiveWithSupabase({
      account: exnessIdInput.trim() || undefined,
      email: exnessEmailInput.trim() || undefined,
    });
    setRefreshingPartnerData(false);
    setRefreshFeedback(res.message);
    setTimeout(() => setRefreshFeedback(null), 4000);
  }

  // Submit Partner Transfer Ticket for existing accounts opened without partner link
  // Strictly logs ticket and prepares formal email. Does NOT pre-approve in database;
  // Account gets verified once Exness confirms the link and it appears on the Partner Dashboard!
  async function handleConnectExistingAccount(e: FormEvent) {
    e.preventDefault();
    const cleanAccount = exnessIdInput.trim();
    const cleanEmail = exnessEmailInput.trim();

    if (!cleanAccount || !cleanEmail) {
      setConnectFeedback({
        success: false,
        message: "Please enter both your Exness Registered Email and Trading Account Number.",
      });
      return;
    }

    setConnectingExisting(true);
    setConnectFeedback(null);
    const res = await connectExistingExnessClient({
      tradingAccountId: cleanAccount,
      email: cleanEmail,
      fullName: fullName.trim() || undefined,
      country,
      destinationEmail: destinationEmail.trim() || DEFAULT_EXNESS_SUPPORT_EMAIL,
      partnerEmail: partnerEmail.trim() || DEFAULT_PARTNER_EMAIL,
    });
    setConnectingExisting(false);
    setConnectFeedback(res);

    if (res.success) {
      setTransferResult(res);
      // Select the account card so user sees verification section
      setSelectedHasAccount(true);
    }
  }

  // Step 1: Verify Exness Trading Account ID against Candlesticks Supabase Database
  async function handleVerifyReferral(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = exnessEmailInput.trim();
    const trimmedAccount = exnessIdInput.trim();

    if (!trimmedAccount) {
      setVerificationFeedback({
        success: false,
        message: "Please enter your Exness Trading Account ID (Trading Account Number).",
      });
      return;
    }

    if (trimmedEmail && !trimmedEmail.includes("@")) {
      setVerificationFeedback({
        success: false,
        message: "Please enter a valid email address or leave email blank until Step 2.",
      });
      return;
    }

    setVerifying(true);
    setVerificationFeedback(null);

    const result = await verifyExnessPartnerAccount(
      trimmedAccount,
      config,
      trimmedEmail ? trimmedEmail : undefined
    );
    setVerifying(false);

    if (result.success) {
      if (trimmedEmail) {
        setEmail(trimmedEmail);
      } else if (result.matchedStudent?.email && !result.matchedStudent.email.endsWith("@partner.exness.com")) {
        setEmail(result.matchedStudent.email);
      }
      setCurrentDeposit(0);
      setVerifiedClientId(result.clientId);
      setVerifiedClientUid(result.clientUid);
      if (result.matchedStudent) {
        setMatchedDbStudent(result.matchedStudent);
        if (
          !fullName &&
          result.matchedStudent.fullName &&
          !result.matchedStudent.fullName.startsWith("Exness Trader #")
        ) {
          setFullName(result.matchedStudent.fullName);
        }
        if (result.matchedStudent.country) {
          setCountry(result.matchedStudent.country);
        }
      }

      setVerificationFeedback({
        success: true,
        message: result.message,
      });

      setTimeout(() => {
        setStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 900);
    } else {
      setVerificationFeedback({
        success: false,
        message: result.message,
      });
    }
  }

  // Step 2: Create Candlesticks Academy Account after Referral Approval
  function handleCreateAcademyAccount(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match. Please verify your password.");
      return;
    }

    const user = getStoredCurrentUser();
    const isFunded = currentDeposit >= 50;
    const updatedUser: ExnessStudent = {
      ...user,
      id: matchedDbStudent?.id || `std-${Date.now()}`,
      fullName: fullName.trim(),
      country,
      email: email.trim(),
      hasExnessAccount: true,
      exnessId: exnessIdInput.trim(),
      exnessEmail: exnessEmailInput.trim() || email.trim(),
      exnessClientId: verifiedClientId || matchedDbStudent?.exnessClientId,
      exnessClientUid: verifiedClientUid || matchedDbStudent?.exnessClientUid,
      partnerLinked: true,
      partnerLinkedAt: matchedDbStudent?.partnerLinkedAt || new Date().toISOString(),
      depositAmount: currentDeposit,
      depositVerified: isFunded,
      depositVerifiedAt: isFunded ? new Date().toISOString() : undefined,
      ticketStatus: showTicketHelper ? "submitted" : "verified",
      registrationDate: matchedDbStudent?.registrationDate || new Date().toISOString(),
    };

    saveStoredCurrentUser(updatedUser, password);

    // Sync to Admin Student Roster
    const roster = getStoredRoster();
    const existingIdx = roster.findIndex(
      (s) =>
        s.email.toLowerCase() === updatedUser.email.toLowerCase() ||
        (s.exnessId && s.exnessId.toLowerCase() === updatedUser.exnessId.toLowerCase())
    );
    if (existingIdx >= 0) {
      roster[existingIdx] = updatedUser;
    } else {
      roster.unshift(updatedUser);
    }
    saveStoredRoster(roster);

    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Step 3: Deposit Check
  async function triggerDepositCheck(simulateAmount?: number) {
    setDepositChecking(true);
    setDepositFeedback(null);

    const user = getStoredCurrentUser();
    const result = await checkExnessAccountDeposit(user.exnessId || user.email, simulateAmount);
    setDepositChecking(false);

    setCurrentDeposit(result.depositAmount);
    setDepositFeedback(result.message);

    if (result.isEligible) {
      const updatedUser: ExnessStudent = {
        ...user,
        depositAmount: result.depositAmount,
        depositVerified: true,
        depositVerifiedAt: new Date().toISOString(),
      };
      saveStoredCurrentUser(updatedUser);

      const roster = getStoredRoster();
      const idx = roster.findIndex((s) => s.email === updatedUser.email);
      if (idx >= 0) {
        roster[idx] = updatedUser;
        saveStoredRoster(roster);
      }
    }
  }

  return (
    <div
      className="min-h-screen text-[#f4f5f8] flex flex-col justify-between selection:bg-[#ffde02] selection:text-black"
      style={{
        backgroundColor: "var(--bg, #121417)",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* Background glow and subtle market grid */}
      <div
        className="fixed inset-0 pointer-events-none -z-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="fixed top-0 right-1/4 w-[600px] h-[400px] pointer-events-none -z-0 rounded-full blur-[140px] opacity-15"
        style={{ background: "radial-gradient(circle, #ffde02, transparent 65%)" }}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 backdrop-blur-xl border-b border-white/10 bg-[#14171d]/90 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 text-white font-extrabold tracking-wider text-sm sm:text-base group"
          >
            <span className="w-7 h-7 flex gap-0.5 items-center justify-center border border-[#ffde02]/60 rotate-45 group-hover:border-[#ffde02] transition shadow-[0_0_12px_rgba(255,222,2,0.15)]">
              <i className="w-0.5 h-2.5 bg-[#ffde02] block" />
              <i className="w-0.5 h-4.5 bg-[#ffde02] block" />
              <i className="w-0.5 h-3 bg-[#ffde02] block" />
            </span>
            <span>
              CANDLESTICKS{" "}
              <small className="text-[#8e96a4] text-[9.5px] tracking-[0.25em] block font-mono">
                ACADEMY
              </small>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            {/* Click-to-copy Partner ID */}
            <button
              type="button"
              onClick={handleCopyPartnerId}
              title="Click to copy Partner ID"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#9aa4b5] hover:text-white font-mono text-xs transition cursor-pointer"
            >
              <span>Partner ID:</span>
              <strong className="text-[#ffde02]">{partnerCode}</strong>
              {partnerIdCopied ? (
                <span className="inline-flex items-center gap-1 text-[#ffde02] font-sans font-bold text-[11px]">
                  <Check size={13} /> Copied!
                </span>
              ) : (
                <Copy size={13} className="text-[#8e96a4]" />
              )}
            </button>

            {/* Sign In with yellow stroke rounded rectangle */}
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-xl border border-[#ffde02] text-[#ffde02] hover:bg-[#ffde02] hover:text-[#0b0d0f] font-bold text-xs sm:text-sm transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex-1 relative z-10">
        {/* Progress Stepper with Ash/Gray & Yellow Only */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-lg mx-auto relative">
            <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 h-0.5 bg-white/10 -z-0" />
            {[
              { num: 1, label: "1. Exness Referral", icon: ShieldCheck },
              { num: 2, label: "2. Academy Account", icon: CandlestickGlyph },
              { num: 3, label: "3. Capital & Access", icon: Wallet },
            ].map((s) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              const StepIcon = s.icon;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                      isPassed
                        ? "bg-[#262b33] border-[#ffde02] text-[#ffde02]"
                        : isCurrent
                        ? "bg-[#ffde02] border-[#ffde02] text-[#0b0d0f] shadow-[0_0_20px_rgba(255,222,2,0.45)]"
                        : "bg-[#181c24] border-white/15 text-[#7f8897]"
                    }`}
                  >
                    {isPassed ? <Check size={17} strokeWidth={3} /> : <StepIcon size={16} />}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs mt-2.5 tracking-wide font-medium whitespace-nowrap ${
                      isCurrent
                        ? "text-[#ffde02] font-bold"
                        : isPassed
                        ? "text-[#c4c9d2]"
                        : "text-[#778090]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1: Exness Partner Link & Referral Verification */}
        {step === 1 && (
          <div
            className="rounded-2xl p-6 sm:p-10 shadow-2xl animate-fadeIn"
            style={{
              background: "linear-gradient(145deg, rgba(38,43,50,0.88) 0%, rgba(20,23,28,0.92) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 25px 60px rgba(0,0,0,0.45)",
            }}
          >
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#ffde02] mb-3"
              style={{
                background: "rgba(255,222,2,0.1)",
                border: "1px solid rgba(255,222,2,0.22)",
              }}
            >
              <TrendingUp size={13} /> STEP 1 OF 3 · EXNESS PARTNER VERIFICATION
            </span>

            <h1
              className="text-2xl sm:text-4xl text-white mt-1"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.12,
              }}
            >
              Connect your <em className="not-italic text-[#ffde02]">Exness trading account.</em>
            </h1>
            <p
              className="text-sm sm:text-base mt-2"
              style={{ color: "#b8c0cc", fontWeight: 500, lineHeight: 1.6 }}
            >
              Create your Exness account with our official partner link first. Once created—or if you already have one—select{" "}
              <strong className="text-white">&ldquo;I already have an Exness account&rdquo;</strong> to verify your referral and unlock Candlesticks Academy registration.
            </p>

            {/* Two Option Cards (Ash/Gray and Yellow Only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-7">
              {/* Card A: Create New Exness Account via Partner Link */}
              <div
                className={`p-6 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  !selectedHasAccount
                    ? "bg-[#171b24] border-[#ffde02] shadow-[0_0_25px_rgba(255,222,2,0.12)]"
                    : "bg-[#13161d] border-white/10 opacity-85 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#ffde02]/15 text-[#ffde02] flex items-center justify-center">
                      <CandlestickGlyph size={24} />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#ffde02]/10 text-[#ffde02] border border-[#ffde02]/25">
                      New to Exness
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    1. Create an Exness Account
                  </h3>
                  <p className="text-xs text-[#949fb1] mt-2 leading-relaxed">
                    Click our official partner button below to register your Exness trading account. When you finish, return here and select option 2.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                  <a
                    href={partnerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setClickedPartnerLink(true)}
                    className="w-full py-3.5 px-4 rounded-full font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 transition"
                    style={{
                      background: "linear-gradient(145deg, #fff06c 0%, #ffde02 48%, #e7c900 100%)",
                      color: "#0b0d0f",
                    }}
                  >
                    <span style={{ color: "#0b0d0f" }}>Create Account on Exness</span>
                    <ExternalLink size={14} color="#0b0d0f" />
                  </a>

                  {clickedPartnerLink && (
                    <button
                      type="button"
                      onClick={() => setSelectedHasAccount(true)}
                      className="w-full py-2 px-3 rounded-xl bg-white/5 border border-[#ffde02]/40 text-[#ffde02] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#ffde02]/10 transition"
                    >
                      <CheckCircle2 size={14} /> Done? Click here to verify your account →
                    </button>
                  )}
                </div>
              </div>

              {/* Card B: I Already Have an Exness Account */}
              <button
                type="button"
                onClick={() => setSelectedHasAccount(true)}
                className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
                  selectedHasAccount
                    ? "bg-[#171b24] border-[#ffde02] shadow-[0_0_25px_rgba(255,222,2,0.15)]"
                    : "bg-[#13161d] border-white/10 hover:border-[#ffde02]/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 text-[#ffde02] flex items-center justify-center">
                      <UserCheck size={22} />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        selectedHasAccount
                          ? "bg-[#ffde02]/15 text-[#ffde02] border-[#ffde02]/40"
                          : "bg-white/5 text-[#8c94a2] border-white/10"
                      }`}
                    >
                      {selectedHasAccount ? "Selected" : "Select When Ready"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    2. I already have an Exness account
                  </h3>
                  <p className="text-xs text-[#949fb1] mt-2 leading-relaxed">
                    Select this once you have created your Exness account with our Partner Link (<strong className="text-white font-mono">{partnerCode}</strong>) to enter your <strong className="text-white">Trading Account ID</strong> and verify your referral.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#ffde02]">
                  <span>{selectedHasAccount ? "Enter Trading Account ID Below ↓" : "Select to Verify Account"}</span>
                  <ArrowRight size={16} />
                </div>
              </button>
            </div>

            {/* When "I already have an Exness account" is selected -> Show Trading Account ID Verification Form */}
            {selectedHasAccount && (
              <div className="mt-7 p-6 rounded-2xl bg-[#11141a] border-2 border-[#ffde02]/35 space-y-5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ffde02] flex items-center gap-1.5">
                      <ShieldCheck size={15} /> VERIFY PARTNER REFERRAL (#{partnerCode})
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                      Enter Your Exness Trading Account ID (Trading Account Number)
                    </h3>
                    <p className="text-xs text-[#9aa4b5] mt-1">
                      We verify your <strong className="text-white font-mono">trading_account_id</strong> / <strong className="text-white font-mono">client_account_id</strong> against your Exness Partner referrals in Supabase. Once verified, you will create your account and be led to make the <strong className="text-[#ffde02]">$50 USD deposit</strong> to activate all platform features.
                    </p>
                  </div>

                  {/* Refresh from Live Exness Partner Link button */}
                  <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={refreshingPartnerData}
                      onClick={handleRefreshPartnerData}
                      className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      title="Syncs latest registrations directly from Exness Partner API into Supabase SQL"
                    >
                      <RefreshCw size={13} className={refreshingPartnerData ? "animate-spin text-[#ffde02]" : "text-[#ffde02]"} />
                      <span>{refreshingPartnerData ? "Syncing from Exness..." : "Refresh Exness Data"}</span>
                    </button>
                    {refreshFeedback && (
                      <span className="text-[10px] text-[#ffde02] font-mono flex items-center gap-1">
                        <Check size={11} strokeWidth={3} /> {refreshFeedback}
                      </span>
                    )}
                  </div>
                </div>

                <form onSubmit={handleVerifyReferral} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                        Exness Trading Account ID (Trading Account #) <span className="text-[#ffde02]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={exnessIdInput}
                        onChange={(e) => setExnessIdInput(e.target.value)}
                        placeholder="Enter your Exness Trading Account ID"
                        className="w-full bg-[#181c24] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-[#5a6475] focus:outline-none focus:border-[#ffde02] text-sm font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                        Exness Registered Email <span className="text-[#7d8799] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={exnessEmailInput}
                        onChange={(e) => setExnessEmailInput(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-[#181c24] border border-white/15 rounded-xl px-4 py-3 text-white placeholder-[#5a6475] focus:outline-none focus:border-[#ffde02] text-sm"
                      />
                    </div>
                  </div>

                  {verificationFeedback && (
                    <div
                      className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                        verificationFeedback.success
                          ? "bg-[#ffde02]/10 border border-[#ffde02]/30 text-[#ffde02]"
                          : "bg-white/5 border border-white/20 text-[#c4c9d2]"
                      }`}
                    >
                      {verificationFeedback.success ? (
                        <CheckCircle2 size={16} className="shrink-0 text-[#ffde02] mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="shrink-0 text-[#ffde02] mt-0.5" />
                      )}
                      <span>{verificationFeedback.message}</span>
                    </div>
                  )}

                  {/* Black on Yellow Button */}
                  <button
                    type="submit"
                    disabled={verifying}
                    className="w-full font-extrabold text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-full shadow-[0_10px_25px_rgba(255,222,2,0.22)] hover:-translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    style={{
                      background: "linear-gradient(145deg, #fff06c 0%, #ffde02 48%, #e7c900 100%)",
                      color: "#0b0d0f",
                    }}
                  >
                    {verifying ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span style={{ color: "#0b0d0f" }}>
                          Checking Live Exness Link &amp; Auto-Syncing Database...
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "#0b0d0f" }}>
                          Verify Referral &amp; Unlock Academy Registration
                        </span>
                        <ArrowRight size={16} color="#0b0d0f" />
                      </>
                    )}
                  </button>
                </form>

                {/* Support Ticket Helper for existing accounts opened without partner link */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-xs text-[#9aa4b5] flex items-center gap-1.5">
                      <SlidersHorizontal size={13} className="text-[#ffde02] shrink-0" />
                      <span>Opened your Exness account previously without our partner link?</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowTicketHelper(!showTicketHelper)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ffde02] hover:underline cursor-pointer"
                    >
                      <span>
                        {showTicketHelper ? "Hide Partner Transfer Form" : "Submit a Partner Transfer Ticket →"}
                      </span>
                    </button>
                  </div>

                  {showTicketHelper && (
                    <div className="mt-4 p-5 rounded-xl bg-[#0c0e13] border border-white/10 space-y-4 text-xs animate-fadeIn">
                      <div className="border-b border-white/10 pb-3">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ffde02] flex items-center gap-1.5">
                          <Mail size={14} /> EXNESS PARTNER AFFILIATION TRANSFER REQUEST
                        </span>
                        <p className="text-[11.5px] text-[#9aa4b5] mt-1 leading-relaxed">
                          If you already had an Exness account created without our partner link (<strong className="text-white font-mono">{partnerCode}</strong>), submit your details below to generate and send a formal transfer ticket to Exness. Once Exness confirms the link and your account appears on our Exness Partner Dashboard, you will be verified immediately upon entering your Trading Account ID above.
                        </p>
                      </div>

                      {/* Partner Details Summary Box */}
                      <div className="p-3.5 rounded-xl bg-[#141822] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <span className="text-[#7d8799] uppercase font-bold text-[10px] block">Partner Email:</span>
                          <span className="text-white font-mono font-bold">{partnerEmail}</span>
                        </div>
                        <div>
                          <span className="text-[#7d8799] uppercase font-bold text-[10px] block">Partner Link:</span>
                          <span className="text-[#ffde02] font-mono font-bold truncate block">{partnerLink}</span>
                        </div>
                        <div>
                          <span className="text-[#7d8799] uppercase font-bold text-[10px] block">Partner ID / Code:</span>
                          <span className="text-white font-mono font-bold">{partnerCode}</span>
                        </div>
                      </div>

                      {/* Partner Transfer Request Form */}
                      <form onSubmit={handleConnectExistingAccount} className="p-4 rounded-xl bg-[#141822] border border-[#ffde02]/30 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-[#ffde02]" /> Generate Partner Transfer Ticket
                          </span>
                          <span className="text-[10px] font-mono text-[#ffde02] bg-[#ffde02]/10 px-2 py-0.5 rounded self-start sm:self-auto">
                            Strict Verification (No Pre-Approval)
                          </span>
                        </div>

                        {/* Recipient Exness Support Email (Editable) */}
                        <div>
                          <label className="block text-[10.5px] uppercase font-bold text-[#8e97a6] mb-1">
                            Send Request To (Exness Partner Support Email) <span className="text-[#ffde02]">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={destinationEmail}
                            onChange={(e) => setDestinationEmail(e.target.value)}
                            placeholder="partner.support@exness.com"
                            className="w-full bg-[#0a0c10] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
                          />
                          <p className="text-[10px] text-[#7d8799] mt-1">
                            Default: <code className="text-[#cfd7e4]">partner.support@exness.com</code>. You may edit this if you have a direct Exness partner desk email.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10.5px] uppercase font-bold text-[#8e97a6] mb-1">
                              Your Exness Registered Email <span className="text-[#ffde02]">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={exnessEmailInput}
                              onChange={(e) => setExnessEmailInput(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full bg-[#0a0c10] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ffde02]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10.5px] uppercase font-bold text-[#8e97a6] mb-1">
                              Your Exness Trading Account ID (Account #) <span className="text-[#ffde02]">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={exnessIdInput}
                              onChange={(e) => setExnessIdInput(e.target.value)}
                              placeholder="Enter your Exness Trading Account ID"
                              className="w-full bg-[#0a0c10] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
                            />
                          </div>
                        </div>

                        <div className="pt-1">
                          <button
                            type="submit"
                            disabled={connectingExisting}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(255,222,2,0.15)] disabled:opacity-60"
                            style={{
                              background: "linear-gradient(145deg, #fff06c 0%, #ffde02 48%, #e7c900 100%)",
                              color: "#0b0d0f",
                            }}
                          >
                            {connectingExisting ? (
                              <>
                                <RefreshCw size={12} className="animate-spin text-black" />
                                <span style={{ color: "#0b0d0f" }}>Preparing Transfer Ticket &amp; Email...</span>
                              </>
                            ) : (
                              <>
                                <Mail size={13} color="#0b0d0f" />
                                <span style={{ color: "#0b0d0f" }}>Generate &amp; Submit Partner Transfer Ticket</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>

                      {/* Generated Email Draft & Instructions (shown when submitted or available) */}
                      {transferResult?.emailDetails && (
                        <div className="p-4 rounded-xl bg-[#141822] border-2 border-[#ffde02]/40 space-y-3.5 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                            <span className="text-xs font-bold text-[#ffde02] flex items-center gap-1.5 font-mono">
                              <CheckCircle2 size={15} /> TICKET #{transferResult.ticketRef} PREPARED
                            </span>
                            <span className="text-[10px] font-mono text-[#9aa4b5] bg-white/5 px-2 py-0.5 rounded">
                              Send from your registered Exness email
                            </span>
                          </div>

                          <div className="text-[11px] space-y-1">
                            <p className="text-white font-semibold">
                              To: <span className="font-mono text-[#ffde02]">{transferResult.emailDetails.destinationEmail}</span>
                            </p>
                            <p className="text-white font-semibold">
                              Subject: <span className="font-mono text-[#cfd7e4]">{transferResult.emailDetails.subject}</span>
                            </p>
                          </div>

                          <div className="p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-[10.5px] text-[#cfd7e4] whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                            {transferResult.emailDetails.body}
                          </div>

                          <div className="flex flex-wrap gap-2.5 pt-1">
                            <a
                              href={`mailto:${encodeURIComponent(transferResult.emailDetails.destinationEmail)}?subject=${encodeURIComponent(
                                transferResult.emailDetails.subject
                              )}&body=${encodeURIComponent(transferResult.emailDetails.body)}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-extrabold text-[11px] uppercase tracking-wider cursor-pointer"
                              style={{
                                background: "linear-gradient(145deg, #fff06c 0%, #ffde02 48%, #e7c900 100%)",
                                color: "#0b0d0f",
                              }}
                            >
                              <Mail size={13} color="#0b0d0f" />
                              <span style={{ color: "#0b0d0f" }}>Open in Email App</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `To: ${transferResult.emailDetails?.destinationEmail}\nSubject: ${transferResult.emailDetails?.subject}\n\n${transferResult.emailDetails?.body}`
                                );
                                setTicketEmailCopied(true);
                                setTimeout(() => setTicketEmailCopied(false), 2500);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] cursor-pointer border border-white/10"
                            >
                              {ticketEmailCopied ? <Check size={13} className="text-[#ffde02]" /> : <Copy size={13} />}
                              <span>{ticketEmailCopied ? "Email Copied!" : "Copy Full Email Draft"}</span>
                            </button>
                          </div>

                          {/* Next Steps Notification */}
                          <div className="p-3 rounded-lg bg-[#0e1117] border border-white/10 text-[11px] text-[#9aa4b5] space-y-1.5">
                            <p className="text-white font-bold flex items-center gap-1">
                              <ShieldCheck size={13} className="text-[#ffde02]" /> What happens next?
                            </p>
                            <p className="leading-relaxed">
                              1. Send the email above to Exness Support from your registered email address (<code className="text-white">{transferResult.emailDetails.clientEmail}</code>).
                            </p>
                            <p className="leading-relaxed">
                              2. Exness typically completes partner account affiliation within <strong>24 to 48 hours</strong>.
                            </p>
                            <p className="leading-relaxed">
                              3. The moment your account is connected, it will automatically show on our <strong>Partner Dashboard</strong>.
                            </p>
                            <p className="leading-relaxed text-[#ffde02]">
                              4. Once connected, return here and enter your Trading Account ID above to verify your account! (Accounts are verified once officially affiliated by Exness, not pre-approved beforehand).
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Create Candlesticks Academy Account (Unlocked after Exness Partner Referral Verified) */}
        {step === 2 && (
          <div
            className="rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden animate-fadeIn"
            style={{
              background: "linear-gradient(145deg, rgba(38,43,50,0.88) 0%, rgba(20,23,28,0.92) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 25px 60px rgba(0,0,0,0.45)",
            }}
          >
            {/* Approved Referral Banner (Yellow/Ash instead of Green) */}
            <div className="mb-6 p-3.5 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-[#ffde02] font-semibold">
                <CheckCircle2 size={17} className="shrink-0" />
                <span>
                  Exness Referral Verified! Trading Account ID{" "}
                  <strong className="font-mono">#{exnessIdInput}</strong>
                  {verifiedClientId && (
                    <>
                      {" "}
                      · Client ID <strong className="font-mono">{verifiedClientId}</strong>
                    </>
                  )}{" "}
                  confirmed under Partner Code <strong className="font-mono">{partnerCode}</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] text-[#9aa4b5] hover:text-white underline shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>

            <div className="mb-7">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-[0.16em] uppercase text-[#ffde02] mb-3"
                style={{
                  background: "rgba(255,222,2,0.1)",
                  border: "1px solid rgba(255,222,2,0.22)",
                }}
              >
                <CandlestickGlyph size={13} /> STEP 2 OF 3 · ACADEMY ACCOUNT CREATION
              </span>

              <h1
                className="text-2xl sm:text-4xl text-white mt-1"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.12,
                }}
              >
                Trade with skill. <em className="not-italic text-[#ffde02]">Create your Academy account.</em>
              </h1>
              <p
                className="text-sm sm:text-base mt-2"
                style={{ color: "#b8c0cc", fontWeight: 500, lineHeight: 1.6 }}
              >
                Your Exness partner referral is confirmed. Complete your student profile below to access the Candlesticks Academy portal.
              </p>
            </div>

            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-[#ffde02]/40 text-[#ffde02] text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-[#ffde02]" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAcademyAccount} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                    Full Name <span className="text-[#ffde02]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full bg-[#12151b] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-[#5d6778] focus:outline-none focus:border-[#ffde02] focus:ring-1 focus:ring-[#ffde02] text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                    Country <span className="text-[#ffde02]">*</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#12151b] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ffde02] focus:ring-1 focus:ring-[#ffde02] text-sm transition cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} className="bg-[#181c24] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                  Email Address <span className="text-[#ffde02]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#12151b] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-[#5d6778] focus:outline-none focus:border-[#ffde02] focus:ring-1 focus:ring-[#ffde02] text-sm transition"
                />
              </div>

              {/* Password with Peek Icon */}
              <div>
                <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                  Password <span className="text-[#ffde02]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password (min. 6 characters)"
                    className="w-full bg-[#12151b] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white placeholder-[#5d6778] focus:outline-none focus:border-[#ffde02] focus:ring-1 focus:ring-[#ffde02] text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7d8799] hover:text-[#ffde02] transition p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Verify Password with Peek Icon */}
              <div>
                <label className="block text-[11.5px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-2">
                  Verify Password <span className="text-[#ffde02]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full bg-[#12151b] border rounded-xl px-4 py-3.5 pr-12 text-white placeholder-[#5d6778] focus:outline-none text-sm transition ${
                      confirmPassword && password !== confirmPassword
                        ? "border-[#ffde02] focus:border-[#ffde02]"
                        : "border-white/10 focus:border-[#ffde02] focus:ring-1 focus:ring-[#ffde02]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7d8799] hover:text-[#ffde02] transition p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-[#ffde02] mt-1.5 flex items-center gap-1 font-medium">
                    <CheckCircle2 size={13} /> Passwords match
                  </p>
                )}
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-[#9aa4b5] mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle size={13} className="text-[#ffde02]" /> Passwords do not match
                  </p>
                )}
              </div>

              {/* Legal Note */}
              <div className="pt-2 text-xs text-[#828c9b] leading-relaxed">
                By creating your account, you agree to our{" "}
                <Link to="/terms" target="_blank" className="text-[#ffde02] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank" className="text-[#ffde02] hover:underline">
                  Privacy Policy
                </Link>
                .
              </div>

              <button
                type="submit"
                className="w-full font-extrabold text-sm uppercase tracking-wider py-4 px-8 rounded-full shadow-[0_10px_25px_rgba(255,222,2,0.22)] hover:shadow-[0_12px_30px_rgba(255,222,2,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                style={{
                  background: "linear-gradient(145deg, #fff06c 0%, #ffde02 48%, #e7c900 100%)",
                  border: "1px solid rgba(255,255,255,0.45)",
                  color: "#0b0d0f",
                }}
              >
                <span style={{ color: "#0b0d0f" }}>Create Candlesticks Academy Account</span>
                <ArrowRight size={17} color="#0b0d0f" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: $50 Deposit Gating Rule & Dashboard Entry */}
        {step === 3 && (
          <div
            className="rounded-2xl p-6 sm:p-10 shadow-2xl animate-fadeIn"
            style={{
              background: "linear-gradient(145deg, rgba(38,43,50,0.88) 0%, rgba(20,23,28,0.92) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 25px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-12 h-12 rounded-2xl bg-[#ffde02]/15 text-[#ffde02] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,222,2,0.2)]">
                <ShieldCheck size={26} />
              </span>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-[0.16em] uppercase bg-[#ffde02]/10 text-[#ffde02] border border-[#ffde02]/25">
                  <Check size={11} strokeWidth={3} /> ACADEMY ACCOUNT READY
                </span>
                <h1
                  className="text-2xl sm:text-3xl text-white mt-1"
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                  }}
                >
                  Welcome to the Academy, <em className="not-italic text-[#ffde02]">{fullName.split(" ")[0] || "Trader"}</em>
                </h1>
              </div>
            </div>

            <p
              className="text-sm mt-2"
              style={{ color: "#b8c0cc", fontWeight: 500, lineHeight: 1.6 }}
            >
              Your Exness account <strong className="text-white font-mono">#{exnessIdInput}</strong> is linked under Partner Code{" "}
              <strong className="text-[#ffde02] font-mono">{partnerCode}</strong>.
            </p>

            {/* $50 Deposit Rule Card */}
            <div className="my-6 p-6 rounded-2xl bg-[#12151b] border border-white/10 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#ffde02] flex items-center gap-1.5">
                    <CircleDollarSign size={14} /> EXNESS CAPITAL REQUIREMENT
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    $50 USD Minimum Account Deposit
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xl font-mono font-bold text-white">
                    ${currentDeposit.toFixed(2)} <small className="text-xs text-[#8f98a8]">/ $50.00 USD</small>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      currentDeposit >= 50 ? "text-[#ffde02]" : "text-[#8e96a4]"
                    }`}
                  >
                    {currentDeposit >= 50 ? "Capital Confirmed · All Content Unlocked" : "Awaiting Deposit Detection"}
                  </span>
                </div>
              </div>

              {/* Progress Bar (Yellow / Ash only) */}
              <div className="mt-4">
                <div className="w-full bg-[#0a0c0f] h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#ffe540] to-[#ffde02] shadow-[0_0_12px_rgba(255,222,2,0.3)]"
                    style={{ width: `${Math.min(100, (currentDeposit / 50) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Trading Access Rules */}
              <div className="mt-5 text-xs text-[#9aa4b6] leading-relaxed bg-[#171a22] p-4 rounded-xl border border-white/5 space-y-2">
                <p className="font-semibold text-white flex items-center gap-2">
                  <Lock size={14} className="text-[#ffde02]" /> Gated Academy Privileges:
                </p>
                <ul className="space-y-1.5 pl-5 list-disc text-[#8d96a7]">
                  <li>
                    <strong className="text-white">Student Dashboard &amp; Trade Analytics:</strong> Unlocked immediately.
                  </li>
                  <li>
                    <strong className="text-white">Courses, Live Trading Rooms &amp; VIP Signals:</strong> Kept locked until a minimum deposit of <strong>$50 USD</strong> is detected in your Exness account.
                  </li>
                </ul>
              </div>

              {/* Deposit Buttons */}
              <div className="mt-6 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href="https://my.exness.com/pa/deposit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider transition shadow-md hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(145deg, #fff06c 0%, #ffde02 48%, #e7c900 100%)",
                      color: "#0b0d0f",
                    }}
                  >
                    <span style={{ color: "#0b0d0f" }}>Deposit on Exness</span>
                    <ExternalLink size={13} color="#0b0d0f" />
                  </a>

                  <button
                    type="button"
                    disabled={depositChecking}
                    onClick={() => triggerDepositCheck()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition cursor-pointer disabled:opacity-60"
                  >
                    {depositChecking ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={13} /> Check Exness Deposit
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => triggerDepositCheck(50)}
                  className="text-xs text-[#ffde02] hover:underline font-mono cursor-pointer"
                >
                  ⚡ Simulate $50 Deposit (Unlock Instantly)
                </button>
              </div>

              {depositFeedback && (
                <div className="mt-4 p-3 rounded-xl text-xs flex items-start gap-2 bg-[#ffde02]/10 border border-[#ffde02]/30 text-[#ffde02]">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  <span>{depositFeedback}</span>
                </div>
              )}
            </div>

            {/* Dashboard Redirect Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#808b9c]">
                You can verify your deposit anytime inside your student dashboard.
              </span>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full sm:w-auto font-extrabold text-sm uppercase tracking-wider px-8 py-3.5 rounded-full shadow-[0_10px_25px_rgba(255,222,2,0.22)] hover:shadow-[0_12px_30px_rgba(255,222,2,0.35)] hover:-translate-y-0.5 transition flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: "linear-gradient(145deg, #fff06c 0%, #ffde02 48%, #e7c900 100%)",
                  color: "#0b0d0f",
                }}
              >
                <span style={{ color: "#0b0d0f" }}>Enter Student Dashboard</span>
                <ArrowRight size={17} color="#0b0d0f" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-[#717986] bg-[#0c0e12]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            © 2026 Candlesticks Academy · Official Exness Partner Link ({partnerCode})
          </span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link to="/terms#exness-disclosure" className="hover:text-white transition">
              Partner Disclosure
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
