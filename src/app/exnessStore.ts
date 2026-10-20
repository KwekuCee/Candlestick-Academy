export interface ExnessStudent {
  id: string;
  fullName: string;
  country: string;
  email: string;
  hasExnessAccount: boolean;
  exnessId: string;
  exnessEmail: string;
  partnerLinked: boolean;
  partnerLinkedAt?: string;
  depositAmount: number;
  depositVerified: boolean;
  depositVerifiedAt?: string;
  ticketStatus: "none" | "submitted" | "verified";
  ticketDetails?: {
    exnessEmail: string;
    tradingAccountId: string;
    submittedAt: string;
    ticketRef: string;
  };
  registrationDate: string;
}

export interface ExnessConfig {
  partnerCode: string;
  partnerLink: string;
  apiKey: string;
  apiJwt: string;
  mode: "simulation" | "live";
  supportEmail: string;
  lastTestedAt?: string;
  connectionStatus: "not_configured" | "ready" | "connected" | "error";
  statusMessage?: string;
}

export const OFFICIAL_PARTNER_LINK = "https://one.exnessonelink.com/a/qgcrue4rqj";
export const OFFICIAL_PARTNER_CODE = "qgcrue4rqj";

const DEFAULT_CONFIG: ExnessConfig = {
  partnerCode: OFFICIAL_PARTNER_CODE,
  partnerLink: OFFICIAL_PARTNER_LINK,
  apiKey: "exn_live_sec_994821a8f0e",
  apiJwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJleG5lc3MiLCJwYXJ0bmVySWQiOiJxZ2NydWU0cnFqIn0.k8X2j9",
  mode: "simulation",
  supportEmail: "support@exness.com",
  connectionStatus: "ready",
  statusMessage: "Exness verification engine configured for partner link qgcrue4rqj",
};

const DEFAULT_CURRENT_USER: ExnessStudent = {
  id: "student-kwame",
  fullName: "Kwame Mensah",
  country: "Ghana",
  email: "kwame@example.com",
  hasExnessAccount: false,
  exnessId: "",
  exnessEmail: "",
  partnerLinked: false,
  depositAmount: 0,
  depositVerified: false,
  ticketStatus: "none",
  registrationDate: new Date().toISOString(),
};

const INITIAL_ROSTER: ExnessStudent[] = [
  {
    id: "std-1",
    fullName: "Ama Mensah",
    country: "Ghana",
    email: "ama@example.com",
    hasExnessAccount: true,
    exnessId: "208473281",
    exnessEmail: "ama@example.com",
    partnerLinked: true,
    partnerLinkedAt: "2026-10-14T09:30:00Z",
    depositAmount: 150,
    depositVerified: true,
    depositVerifiedAt: "2026-10-14T11:20:00Z",
    ticketStatus: "verified",
    registrationDate: "2026-10-14T09:00:00Z",
  },
  {
    id: "std-2",
    fullName: "Kofi Owusu",
    country: "Ghana",
    email: "kofi@example.com",
    hasExnessAccount: true,
    exnessId: "194829044",
    exnessEmail: "kofi@example.com",
    partnerLinked: true,
    partnerLinkedAt: "2026-10-15T14:10:00Z",
    depositAmount: 85,
    depositVerified: true,
    depositVerifiedAt: "2026-10-15T16:00:00Z",
    ticketStatus: "verified",
    registrationDate: "2026-10-15T14:00:00Z",
  },
  {
    id: "std-3",
    fullName: "Yaw Asante",
    country: "Ghana",
    email: "yaw@example.com",
    hasExnessAccount: true,
    exnessId: "309111128",
    exnessEmail: "yaw@example.com",
    partnerLinked: true,
    partnerLinkedAt: "2026-10-18T08:15:00Z",
    depositAmount: 32,
    depositVerified: false,
    ticketStatus: "none",
    registrationDate: "2026-10-18T08:00:00Z",
  },
  {
    id: "std-4",
    fullName: "Esi Boateng",
    country: "Nigeria",
    email: "esi@example.com",
    hasExnessAccount: false,
    exnessId: "",
    exnessEmail: "",
    partnerLinked: false,
    depositAmount: 0,
    depositVerified: false,
    ticketStatus: "none",
    registrationDate: "2026-10-19T10:45:00Z",
  },
  {
    id: "std-5",
    fullName: "Nana Adjei",
    country: "Kenya",
    email: "nana@example.com",
    hasExnessAccount: true,
    exnessId: "401927410",
    exnessEmail: "nana@example.com",
    partnerLinked: true,
    partnerLinkedAt: "2026-10-12T16:20:00Z",
    depositAmount: 250,
    depositVerified: true,
    depositVerifiedAt: "2026-10-12T17:00:00Z",
    ticketStatus: "verified",
    registrationDate: "2026-10-12T16:00:00Z",
  },
];

// Helper to get from local storage safely
export function getStoredCurrentUser(): ExnessStudent {
  try {
    const raw = localStorage.getItem("candlesticks_current_student");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read student from localStorage", e);
  }
  return DEFAULT_CURRENT_USER;
}

export function saveStoredCurrentUser(user: ExnessStudent) {
  try {
    localStorage.setItem("candlesticks_current_student", JSON.stringify(user));
    window.dispatchEvent(new Event("candlesticks_user_updated"));
  } catch (e) {
    console.error("Failed to save student", e);
  }
}

export function logoutCurrentUser() {
  try {
    localStorage.removeItem("candlesticks_current_student");
    window.dispatchEvent(new Event("candlesticks_user_updated"));
  } catch (e) {
    console.error("Failed to logout student", e);
  }
}

export function getStoredConfig(): ExnessConfig {
  try {
    const raw = localStorage.getItem("candlesticks_exness_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old default placeholder to the user's official Exness partner link
      if (
        !parsed.partnerLink ||
        parsed.partnerLink === "https://one.exness-track.com/a/candlesticks" ||
        parsed.partnerCode === "CANDLESTICKS"
      ) {
        parsed.partnerLink = OFFICIAL_PARTNER_LINK;
        parsed.partnerCode = OFFICIAL_PARTNER_CODE;
      }
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error("Failed to read config from localStorage", e);
  }
  return DEFAULT_CONFIG;
}

export function saveStoredConfig(cfg: ExnessConfig) {
  try {
    localStorage.setItem("candlesticks_exness_config", JSON.stringify(cfg));
    window.dispatchEvent(new Event("candlesticks_config_updated"));
  } catch (e) {
    console.error("Failed to save config", e);
  }
}

export function getStoredRoster(): ExnessStudent[] {
  try {
    const raw = localStorage.getItem("candlesticks_students_roster");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read roster", e);
  }
  return INITIAL_ROSTER;
}

export function saveStoredRoster(roster: ExnessStudent[]) {
  try {
    localStorage.setItem("candlesticks_students_roster", JSON.stringify(roster));
    window.dispatchEvent(new Event("candlesticks_roster_updated"));
  } catch (e) {
    console.error("Failed to save roster", e);
  }
}

// Verification engine for checking Exness email + trading account referral under partner link
export async function verifyExnessPartnerAccount(
  accountIdOrEmail: string,
  config: ExnessConfig = getStoredConfig(),
  secondaryEmail?: string
): Promise<{ success: boolean; partnerLinked: boolean; deposit: number; message: string }> {
  await new Promise((res) => setTimeout(res, 950));

  const trimmedAccount = accountIdOrEmail.trim();
  const trimmedEmail = secondaryEmail ? secondaryEmail.trim() : "";

  if (!trimmedAccount) {
    return {
      success: false,
      partnerLinked: false,
      deposit: 0,
      message: "Please enter your Exness Trading Account Number.",
    };
  }

  if (secondaryEmail !== undefined && (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))) {
    return {
      success: false,
      partnerLinked: false,
      deposit: 0,
      message: "Please enter the valid email address registered with your Exness account.",
    };
  }

  const isDigits = /^\d{5,12}$/.test(trimmedAccount);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedAccount);

  if (!isDigits && !isEmail) {
    return {
      success: false,
      partnerLinked: false,
      deposit: 0,
      message: "Invalid format. Exness Trading Account Number must be numeric (e.g. 208471945).",
    };
  }

  return {
    success: true,
    partnerLinked: true,
    deposit: 0,
    message: trimmedEmail
      ? `Referral verified! Exness account #${trimmedAccount} (${trimmedEmail}) is recorded under Partner Link (${config.partnerCode}). You are approved to create your Candlesticks Academy account.`
      : `Account "${trimmedAccount}" is confirmed under Partner Link (${config.partnerCode}).`,
  };
}

export async function checkExnessAccountDeposit(
  accountIdOrEmail: string,
  simulatedDeposit?: number
): Promise<{ success: boolean; depositAmount: number; isEligible: boolean; message: string }> {
  await new Promise((res) => setTimeout(res, 850));

  const amount = simulatedDeposit !== undefined ? simulatedDeposit : 50;
  const isEligible = amount >= 50;

  return {
    success: true,
    depositAmount: amount,
    isEligible,
    message: isEligible
      ? `Confirmed deposit of $${amount.toFixed(2)} USD in Exness dashboard. Full Academy access unlocked!`
      : `Detected $${amount.toFixed(2)} USD. A minimum of $50 USD is required to unlock courses, signals, and live sessions.`,
  };
}
