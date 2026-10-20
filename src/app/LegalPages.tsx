import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

type LegalTab = "terms" | "privacy";

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  switch (name) {
    case "arrow":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      );
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "lock":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
      );
    case "check":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );
    case "alert":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "book":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15z" />
          <path d="M8 6h8M8 10h6" />
        </svg>
      );
    case "print":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      );
    case "search":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "mail":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
    case "external":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    default:
      return null;
  }
}

function LegalLogo() {
  return (
    <Link to="/" className="logo" aria-label="Candlesticks Academy home">
      <span className="logo-mark">
        <i />
        <i />
        <i />
      </span>
      <span>
        CANDLESTICKS
        <small>ACADEMY</small>
      </span>
    </Link>
  );
}

interface LegalSection {
  id: string;
  number: string;
  title: string;
  summary?: string;
  content: ReactNode;
}

export function LegalLayout({
  activeTab,
  children,
  sections,
}: {
  activeTab: LegalTab;
  children?: ReactNode;
  sections: LegalSection[];
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id || "");

  useEffect(() => {
    // Handle initial hash scroll if present
    if (location.hash) {
      const target = document.getElementById(location.hash.replace("#", ""));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        setActiveSectionId(location.hash.replace("#", ""));
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  // Track scroll position to update active TOC
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 180;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSectionId(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.number.toLowerCase().includes(q) ||
        (s.summary && s.summary.toLowerCase().includes(q))
    );
  }, [sections, searchQuery]);

  return (
    <div className="legal-page-root">
      {/* Top sticky navigation bar */}
      <header className="legal-header">
        <div className="legal-header-inner">
          <div className="legal-header-left">
            <LegalLogo />
            <span className="legal-header-tag">LEGAL & REGULATORY</span>
          </div>

          {/* Central tab switcher between Terms & Privacy */}
          <div className="legal-tab-switch">
            <button
              type="button"
              className={`legal-tab-btn ${activeTab === "terms" ? "active" : ""}`}
              onClick={() => navigate("/terms")}
            >
              <Icon name="book" size={14} />
              Terms of Service
            </button>
            <button
              type="button"
              className={`legal-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
              onClick={() => navigate("/privacy")}
            >
              <Icon name="shield" size={14} />
              Privacy Policy
            </button>
          </div>

          <div className="legal-header-right">
            <button
              type="button"
              className="legal-action-btn"
              onClick={() => window.print()}
              title="Print or save as PDF"
            >
              <Icon name="print" size={15} />
              <span>Print / PDF</span>
            </button>
            <Link to="/" className="legal-action-btn home-btn">
              ← Return to Academy
            </Link>
            <Link to="/register" className="p-button primary legal-cta-btn">
              Free Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="legal-main">
        {/* Hero Section */}
        <div className="legal-hero-section">
          <div className="legal-hero-container">
            <div className="legal-eyebrow-row">
              <span className="p-badge yellow">OFFICIAL GOVERNANCE</span>
              <span className="legal-meta-item">Version 2.4</span>
              <span className="legal-meta-item">Effective: October 2026</span>
              <span className="legal-meta-item">Jurisdiction: Republic of Ghana & Global</span>
            </div>

            <h1 className="legal-hero-title">
              {activeTab === "terms" ? "Terms of Service & Trader Agreement" : "Privacy Policy & Data Protection"}
            </h1>

            <p className="legal-hero-lead">
              {activeTab === "terms"
                ? "Please review these Terms carefully. Candlesticks Academy provides practical foreign exchange education, chart study frameworks, and community mentorship. By using our services, courses, or linked broker features, you agree to these terms."
                : "Your privacy, financial confidentiality, and data protection are fundamental to our teaching ethics. We outline exactly what data is collected, how it is secured, and your complete rights under global data protection regulations."}
            </p>

            {/* Plain-English Summary Highlights */}
            <div className="legal-highlights-grid">
              {activeTab === "terms" ? (
                <>
                  <div className="legal-highlight-card">
                    <div className="highlight-icon green">
                      <Icon name="book" size={20} />
                    </div>
                    <div>
                      <h4>Strictly Educational</h4>
                      <p>All lessons, trade breakdowns, and signals are educational market studies, never personal financial advice.</p>
                    </div>
                  </div>

                  <div className="legal-highlight-card">
                    <div className="highlight-icon yellow">
                      <Icon name="alert" size={20} />
                    </div>
                    <div>
                      <h4>High Capital Risk</h4>
                      <p>Forex and CFD trading carry substantial risk of loss. Never trade with capital you cannot afford to lose.</p>
                    </div>
                  </div>

                  <div className="legal-highlight-card">
                    <div className="highlight-icon silver">
                      <Icon name="shield" size={20} />
                    </div>
                    <div>
                      <h4>Exness Partner Role</h4>
                      <p>We are an independent educational affiliate. We never hold, receive, custody, or execute withdrawals of your trading funds.</p>
                    </div>
                  </div>

                  <div className="legal-highlight-card">
                    <div className="highlight-icon purple">
                      <Icon name="lock" size={20} />
                    </div>
                    <div>
                      <h4>First Month Free</h4>
                      <p>Begin learning at zero cost with no credit card required. Cancel or disconnect your account anytime.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="legal-highlight-card">
                    <div className="highlight-icon green">
                      <Icon name="lock" size={20} />
                    </div>
                    <div>
                      <h4>No Trading Credentials</h4>
                      <p>We never see, collect, or store your Exness trading passwords, investor keys, or withdrawal PINs.</p>
                    </div>
                  </div>

                  <div className="legal-highlight-card">
                    <div className="highlight-icon yellow">
                      <Icon name="shield" size={20} />
                    </div>
                    <div>
                      <h4>Zero Data Selling</h4>
                      <p>We will never sell, rent, or trade your contact info or trading metrics to brokers, lead brokers, or ad networks.</p>
                    </div>
                  </div>

                  <div className="legal-highlight-card">
                    <div className="highlight-icon silver">
                      <Icon name="check" size={20} />
                    </div>
                    <div>
                      <h4>Read-Only Journaling</h4>
                      <p>Broker account synchronization is strictly read-only to calculate educational win rates, pips, and milestones.</p>
                    </div>
                  </div>

                  <div className="legal-highlight-card">
                    <div className="highlight-icon purple">
                      <Icon name="mail" size={20} />
                    </div>
                    <div>
                      <h4>Your Complete Rights</h4>
                      <p>Request full data export, revoke broker linkage, or permanently erase your profile whenever you choose.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Body with Sticky Sidebar TOC */}
        <div className="legal-body-container">
          {/* Left Column: Sidebar Table of Contents */}
          <aside className="legal-sidebar">
            <div className="legal-sidebar-sticky">
              {/* In-page search input */}
              <div className="legal-search-box">
                <Icon name="search" size={14} />
                <input
                  type="text"
                  placeholder="Search legal sections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="clear-search">
                    ×
                  </button>
                )}
              </div>

              <div className="legal-toc-title">
                <span>TABLE OF CONTENTS</span>
                <small>{filteredSections.length} sections</small>
              </div>

              <nav className="legal-toc-list">
                {filteredSections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(sec.id);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                        setActiveSectionId(sec.id);
                        window.history.replaceState(null, "", `#${sec.id}`);
                      }
                    }}
                    className={`legal-toc-item ${activeSectionId === sec.id ? "active" : ""}`}
                  >
                    <span className="toc-number">{sec.number}</span>
                    <span className="toc-text">{sec.title}</span>
                  </a>
                ))}
              </nav>

              {/* Direct Support Card */}
              <div className="legal-support-card">
                <div className="support-icon">
                  <Icon name="mail" size={16} />
                </div>
                <div>
                  <h5>Legal & Compliance Inquiries</h5>
                  <p>Questions regarding these terms or your privacy rights?</p>
                  <a href="mailto:hello@candlesticks.academy" className="support-link">
                    hello@candlesticks.academy
                  </a>
                </div>
              </div>

              {/* Founder Signature Note */}
              <div className="legal-founder-note">
                <p>
                  “Our priority is building disciplined market students through transparency, honest risk disclosure, and genuine education.”
                </p>
                <span>Michael Kweku Essilfie · Founder</span>
              </div>
            </div>
          </aside>

          {/* Right Column: Detailed Clauses */}
          <div className="legal-clauses-wrapper">
            {filteredSections.map((sec) => (
              <section key={sec.id} id={sec.id} className="legal-clause-section">
                <div className="clause-header">
                  <span className="clause-number">{sec.number}</span>
                  <div>
                    <h2 className="clause-title">{sec.title}</h2>
                    {sec.summary && <p className="clause-summary">{sec.summary}</p>}
                  </div>
                </div>
                <div className="clause-content">{sec.content}</div>
              </section>
            ))}

            {/* Bottom Cross-Navigation Card */}
            <div className="legal-cross-card">
              <div>
                <h3>
                  {activeTab === "terms" ? "Need to review our Privacy Policy?" : "Need to review our Terms of Service?"}
                </h3>
                <p>
                  {activeTab === "terms"
                    ? "Read how your personal data, linked account identifiers, and learning analytics are securely processed."
                    : "Learn about student agreements, risk disclaimers, course intellectual property, and billing."}
                </p>
              </div>
              <Link
                to={activeTab === "terms" ? "/privacy" : "/terms"}
                className="p-button primary"
              >
                {activeTab === "terms" ? "Read Privacy Policy" : "Read Terms of Service"} <Icon name="arrow" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Legal Footer */}
      <footer className="legal-footer">
        <div className="container footer-top">
          <LegalLogo />
          <p>
            Candlesticks Academy provides rigorous, practical Forex education for traders committed to discipline, risk management, and market understanding.
          </p>
          <div className="footer-links">
            <Link to="/#learn">How it works</Link>
            <Link to="/#benefits">Academy</Link>
            <Link to="/#mentor">Mentor</Link>
            <a href="mailto:hello@candlesticks.academy">Contact</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 Candlesticks Academy. All rights reserved. Registered in Accra, Ghana.</span>
          <span>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <a href="#exness-disclosure">Exness Partner Disclosure</a>
          </span>
        </div>
        <div className="risk-note container">
          <p>
            <b>Regulatory & High Risk Warning:</b> Foreign exchange (Forex) and Contracts for Difference (CFDs) trading involves significant financial risk and may not be suitable for all investors. The high degree of leverage associated with these instruments can work against you as well as for you, potentially resulting in the loss of some or all of your deposited capital. All content, signals, videos, chart breakdowns, live rooms, and student materials provided by Candlesticks Academy and Michael Kweku Essilfie are for strictly educational and informational purposes only and must not be construed as investment, tax, legal, or financial advice. Candlesticks Academy is not an authorised investment broker, asset manager, or financial adviser. Please read our full terms and risk disclosure before participating in leveraged financial markets.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   TERMS OF SERVICE PAGE
   ============================================================================ */

export function TermsPage() {
  const termsSections: LegalSection[] = [
    {
      id: "acceptance-of-terms",
      number: "01",
      title: "Acceptance of Terms & Contracting Entity",
      summary: "Your agreement with Candlesticks Academy and our founding team.",
      content: (
        <>
          <p>
            These Terms of Service (these <strong>“Terms”</strong>) constitute a binding legal agreement between you
            (the <strong>“Student”</strong>, <strong>“User”</strong>, or <strong>“You”</strong>) and{" "}
            <strong>Candlesticks Academy</strong> (collectively referred to as <strong>“Candlesticks Academy”</strong>,{" "}
            <strong>“we”</strong>, <strong>“us”</strong>, or <strong>“our”</strong>), founded and led by{" "}
            <strong>Michael Kweku Essilfie</strong> (also known as Pastor Mike), with operations based in Accra, Ghana.
          </p>
          <p>
            By accessing or using the Candlesticks Academy website (
            <code className="legal-code">candlesticks.academy</code>), logging into the student portal, accessing
            lessons, participating in live breakdown sessions, subscribing to signal feeds, or linking an external
            broker account (including Exness), you signify that you have read, understood, and agree to be legally bound
            by these Terms and our companion Privacy Policy.
          </p>
          <div className="legal-alert-box note">
            <strong>Important Notice:</strong> If you do not agree to each and every term set forth herein, you must
            immediately discontinue accessing our platform, unsubscribe from our feeds, and delete your student account.
          </div>
        </>
      ),
    },
    {
      id: "educational-disclaimer",
      number: "02",
      title: "Strictly Educational Purpose — No Financial Advice",
      summary: "Clear legal boundaries on what Candlesticks Academy does and does not provide.",
      content: (
        <>
          <p>
            Candlesticks Academy is strictly an <strong>educational institution and technical trading academy</strong>.
            We are dedicated to teaching market structure, price action dynamics, liquidity sweeps, risk-to-reward
            framing, and execution psychology.
          </p>
          <ul className="legal-bullet-list">
            <li>
              <strong>No Financial or Investment Advice:</strong> Nothing published on our website, shared during live
              webinars, discussed in community chat, or broadcast through signal alerts constitutes financial,
              investment, legal, tax, or accounting advice.
            </li>
            <li>
              <strong>No Fiduciary Relationship:</strong> No advisory or fiduciary client relationship is created between
              you and Candlesticks Academy or Michael Kweku Essilfie by virtue of your enrollment, attendance, or
              participation.
            </li>
            <li>
              <strong>No Profit Guarantees:</strong> Past performance, simulated trades, backtested statistics, and
              historical win-rates (such as the 68% win-rate showcase or sample live breakdowns) do not guarantee,
              predict, or indicate future trading performance in live, volatile market conditions.
            </li>
            <li>
              <strong>Independent Decision-Making:</strong> You are solely and exclusively responsible for every trade,
              lot size, order execution, leverage selection, and stop-loss level placed on your personal brokerage
              accounts.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "forex-risk-disclosure",
      number: "03",
      title: "Comprehensive Forex & Leveraged CFD Risk Disclosure",
      summary: "Full disclosure of the substantial risks inherent in leveraged margin trading.",
      content: (
        <>
          <div className="legal-alert-box warning">
            <div className="alert-header">
              <Icon name="alert" size={18} />
              <h4>High-Risk Capital Warning</h4>
            </div>
            <p>
              Foreign exchange (Forex) and CFD trading on margin carry a high level of risk and may not be suitable for
              all investors. Leverage creates magnified gains when price moves in your favor, but equally creates
              magnified losses when price moves against you.
            </p>
          </div>
          <p>
            Before deciding to trade foreign exchange or any financial market, you should carefully consider your
            investment objectives, level of experience, risk tolerance, and personal financial situation. It is entirely
            possible to sustain a loss of some or all of your deposited capital.
          </p>
          <div className="legal-card-inset">
            <h5>Core Risk Principles Required of Every Candlesticks Academy Student:</h5>
            <ol className="legal-number-list">
              <li>
                <strong>Risk Capital Only:</strong> Do not speculate with capital that you cannot comfortably afford to
                lose in its entirety without altering your lifestyle, housing, or essential obligations.
              </li>
              <li>
                <strong>Slippage & Market Gaps:</strong> During major economic releases (CPI, NFP, Interest Rate
                announcements, geopolitical crises), market spreads widen significantly, and execution slippage may cause
                stop-losses to fill at prices worse than requested.
              </li>
              <li>
                <strong>Emotional & Psychological Discipline:</strong> Lack of risk control, revenge trading, and
                over-leveraging are the primary drivers of retail account liquidation. Our curriculum emphasizes
                limiting risk per trade to 1%–2% of total account equity.
              </li>
            </ol>
          </div>
        </>
      ),
    },
    {
      id: "exness-disclosure",
      number: "04",
      title: "Exness Broker Partnership & Affiliate Disclosure",
      summary: "Our independent relationship with Exness, fund safety, and partner terms.",
      content: (
        <>
          <p>
            Candlesticks Academy maintains an independent educational partnership and introducing business relationship
            with <strong>Exness (SC) Ltd</strong> and its affiliated licensed operating entities (collectively,{" "}
            <strong>“Exness”</strong>).
          </p>
          <div className="legal-alert-box note">
            <div className="alert-header">
              <Icon name="shield" size={18} />
              <h4>Fund Custody & Broker Disassociation Clarification</h4>
            </div>
            <ul className="legal-bullet-list compact">
              <li>
                <strong>We Are NOT a Broker:</strong> Candlesticks Academy is not a broker, custodian, clearinghouse,
                or banking institution.
              </li>
              <li>
                <strong>We NEVER Hold or Touch Client Funds:</strong> We never accept, hold, manage, hold in escrow, or
                disburse your trading deposits or withdrawals. All capital deposits and profit withdrawals are executed
                directly between you and Exness under Exness’s regulated terms and security protocols.
              </li>
              <li>
                <strong>Partner Compensation:</strong> When you register an Exness trading account through our referral
                link or partner code, Candlesticks Academy may receive introducing partner remuneration or spread
                rebates from Exness at zero additional cost to you. This partnership enables us to offer our
                comprehensive first-month free academy access and subsidized tuition.
              </li>
              <li>
                <strong>$50 Verification Milestone:</strong> Certain advanced Academy resources—specifically access to
                unrestricted live breakdown rooms and automated trade copying—require you to maintain a verified
                Exness account linked to the Academy with a confirmed initial deposit of at least $50.00 USD. This
                deposit remains 100% your own property in your personal Exness trading account.
              </li>
            </ul>
          </div>
          <p>
            Candlesticks Academy makes no representations or warranties regarding the execution speeds, slippage,
            system availability, regulatory status in your specific territory, or solvency of Exness. You are encouraged
            to review Exness’s client agreements and risk disclosures prior to funding an account.
          </p>
        </>
      ),
    },
    {
      id: "signals-and-copy-trading",
      number: "05",
      title: "Market Signals, Analysis & Automated Copy-Trading",
      summary: "Terms governing trade setups, entry/SL/TP levels, and automated execution features.",
      content: (
        <>
          <p>
            Through the student portal, Candlesticks Academy provides real-time market ideas, structure shift alerts,
            and setup commentary (covering pairs such as EUR/USD, GBP/USD, USD/JPY, and Gold / XAU/USD).
          </p>
          <ul className="legal-bullet-list">
            <li>
              <strong>Educational Study Models:</strong> Each posted trade signal displays an Entry Price, Stop-Loss
              (SL), Take-Profit (TP), and estimated Risk-to-Reward ratio (e.g. 1:2.4). These represent the instructor’s
              personal market breakdown and educational study framework.
            </li>
            <li>
              <strong>Automated Copy-Trading Toggle:</strong> If you choose to enable the <em>“Automatic signal copying”</em>{" "}
              feature in your settings, you are granting automated instruction for the platform to route corresponding
              trade parameters to your linked Exness trading account via authorized API connection.
            </li>
            <li>
              <strong>User Responsibility for Position Sizing:</strong> You maintain sole authority over lot sizing,
              maximum allowable drawdown, and trade management. You may disable the automatic copying feature at any
              moment from your Settings dashboard.
            </li>
            <li>
              <strong>No Liability for Execution Discrepancies:</strong> Technical issues such as network latency, broker
              price requotes, spread divergence, maintenance windows, or cloud downtime may cause execution delays or
              failure to fill. Candlesticks Academy accepts no financial liability for any discrepancies, losses, or
              missed profits resulting from manual or automated execution.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "account-registration",
      number: "06",
      title: "Student Accounts, Eligibility & Security",
      summary: "Registration rules, minimum age requirements, and credentials safety.",
      content: (
        <>
          <p>
            To enroll in Candlesticks Academy, you must register for an individual student account. By registering, you
            warrant that:
          </p>
          <ol className="legal-number-list">
            <li>You are at least 18 years of age (or the legal age of majority in your jurisdiction).</li>
            <li>
              All information provided during onboarding (legal name, phone number, email address, country) is truthful,
              accurate, and up to date.
            </li>
            <li>
              You will maintain the security of your password and notify us immediately at{" "}
              <code className="legal-code">hello@candlesticks.academy</code> if you detect unauthorized access.
            </li>
            <li>
              You will not share your student credentials, course access, or portal dashboard with third parties.
              Simultaneous logins from conflicting geographical locations may trigger automated security account locks.
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "fees-subscriptions-refunds",
      number: "07",
      title: "Free Access, Subscriptions, Mentorship & Refunds",
      summary: "Transparent terms regarding our free trial month, private mentorship, and billing.",
      content: (
        <>
          <div className="legal-pricing-table">
            <div className="table-header">
              <span>TIER / ACCESS</span>
              <span>PRICING</span>
              <span>TERMS & CANCELLATION</span>
            </div>
            <div className="table-row">
              <div>
                <strong>First Month Free Tier</strong>
                <small>Full access to foundational courses and recorded webinars</small>
              </div>
              <span className="price-tag">$0.00</span>
              <span>No credit card required. Cancel or upgrade at any time.</span>
            </div>
            <div className="table-row">
              <div>
                <strong>Exness Verified Tier</strong>
                <small>Unlocks live trading breakdown rooms and signal feed</small>
              </div>
              <span className="price-tag">Free with $50 Deposit</span>
              <span>Requires verified linked Exness account with minimum $50 deposit. Capital remains 100% yours.</span>
            </div>
            <div className="table-row">
              <div>
                <strong>Private Mentorship Tier</strong>
                <small>One-on-one reviews, weekly trade journal audits, priority access</small>
              </div>
              <span className="price-tag">$150.00 / month</span>
              <span>Billed monthly in advance. Cancel renewal anytime in Portal Settings.</span>
            </div>
          </div>
          <h5 style={{ marginTop: "24px", color: "var(--p-text)", fontSize: "14px" }}>Refund Policy</h5>
          <p>
            Because Candlesticks Academy provides immediate digital access to proprietary curriculum, streaming video
            lessons, downloadable checklists, and proprietary market strategies, all recurring mentorship fees are
            generally non-refundable once the billing period has commenced.
          </p>
          <p>
            If you believe you have been billed in error or experienced verified technical failure preventing access for
            more than 72 consecutive hours, you may submit a formal review request to{" "}
            <code className="legal-code">hello@candlesticks.academy</code> within seven (7) calendar days of the charge.
          </p>
        </>
      ),
    },
    {
      id: "intellectual-property",
      number: "08",
      title: "Intellectual Property & Anti-Piracy Protections",
      summary: "All video content, diagrams, models, and academy trademarks are protected assets.",
      content: (
        <>
          <p>
            All content published within Candlesticks Academy—including but not limited to the <em>Forex Foundations</em>,{" "}
            <em>Technical Analysis</em>, <em>Risk & Psychology</em>, and <em>Advanced Price Action</em> curriculum,
            video lessons, live session replays, custom interactive chart engines, quizzes, slide decks, logos, and
            graphic identity—is the exclusive proprietary intellectual property of <strong>Michael Kweku Essilfie</strong>{" "}
            and Candlesticks Academy, protected under international copyright and intellectual property treaties.
          </p>
          <div className="legal-alert-box warning">
            <strong>Strict Prohibition Against Redistribution:</strong> You are granted a limited, personal,
            non-exclusive, non-transferable, revocable license to access the materials solely for your own individual
            education. You may not record, rip, re-upload, distribute in Telegram or WhatsApp groups, resell, or
            incorporate any Academy materials into your own commercial educational offerings. Violation results in
            immediate permanent ban without refund and legal enforcement under Ghanaian and international copyright law.
          </div>
        </>
      ),
    },
    {
      id: "community-code-of-conduct",
      number: "09",
      title: "Community Guidelines & Live Room Conduct",
      summary: "Standards of professional respect and integrity in Academy live streams and chat.",
      content: (
        <>
          <p>
            Candlesticks Academy is a community built on mutual respect, professional focus, and serious market
            discipline. When interacting in our live session chats, student rosters, or support channels, you agree to:
          </p>
          <ul className="legal-bullet-list">
            <li>
              Maintain respectful, constructive dialogue with fellow students, instructors, and guest traders.
            </li>
            <li>
              Never post unsolicited promotional links, broker referral links, MLM schemes, third-party signal services,
              or cryptocurrency pump-and-dump solicitations.
            </li>
            <li>
              Never engage in hate speech, harassment, defamation, or profanity directed at any student or mentor.
            </li>
            <li>
              Refrain from posting fraudulent or unverified trading screenshots to mislead beginners.
            </li>
          </ul>
          <p>
            Academy moderators reserve the right to mute, kick, or permanently terminate the account of any user
            violating these conduct standards.
          </p>
        </>
      ),
    },
    {
      id: "limitation-of-liability",
      number: "10",
      title: "Limitation of Liability & Indemnification",
      summary: "Our liability limits regarding market outcomes, execution delays, and third-party tools.",
      content: (
        <>
          <p>
            To the maximum extent permitted by applicable law, in no event shall Candlesticks Academy, its founder
            Michael Kweku Essilfie, instructors, directors, affiliates, or technology partners be liable for any
            indirect, punitive, incidental, special, consequential, or exemplary damages—including but not limited to
            loss of profits, capital loss, trading drawdowns, margin calls, broker liquidation, loss of goodwill, or
            data corruption—arising out of or in connection with:
          </p>
          <ol className="legal-number-list">
            <li>Your use of, or inability to use, our courses, platform, or signal alerts.</li>
            <li>Any market decision, order execution, leverage ratio, or position placed on any broker.</li>
            <li>
              Actions, omissions, insolvency, platform freeze, spread blowout, or policy changes by third-party brokers
              including Exness.
            </li>
            <li>
              Any bugs, viruses, latency delays, or streaming interruptions during live trading breakdown sessions.
            </li>
          </ol>
          <p>
            You agree to defend, indemnify, and hold harmless Candlesticks Academy and its officers from and against any
            and all claims, damages, liabilities, costs, and expenses (including legal fees) arising from your violation
            of these Terms or your live trading activities.
          </p>
        </>
      ),
    },
    {
      id: "governing-law-and-disputes",
      number: "11",
      title: "Governing Law, Jurisdiction & Dispute Resolution",
      summary: "Legal venue, good-faith mediation, and arbitration framework.",
      content: (
        <>
          <p>
            These Terms, and any dispute, controversy, or claim arising out of or relating to them, shall be governed
            by, construed, and enforced in accordance with the substantive laws of the{" "}
            <strong>Republic of Ghana</strong>, without regard to its conflict of law principles.
          </p>
          <p>
            <strong>Informal Resolution First:</strong> In the event of any disagreement or dispute, you agree to first
            contact us directly at <code className="legal-code">hello@candlesticks.academy</code> with a detailed
            description of the matter. Both parties shall use good-faith efforts to resolve the dispute amicably within
            thirty (30) business days.
          </p>
          <p>
            <strong>Arbitration:</strong> If informal resolution is unsuccessful, the dispute shall be finally resolved
            by binding arbitration administered under the Alternative Dispute Resolution Act, 2010 (Act 798) of Ghana,
            held in Accra, Ghana, in the English language.
          </p>
        </>
      ),
    },
    {
      id: "modifications-and-contact",
      number: "12",
      title: "Amendments to Terms & Contact Information",
      summary: "How updates are communicated and how to reach our compliance desk.",
      content: (
        <>
          <p>
            We reserve the right, at our sole discretion, to modify, update, or replace these Terms at any time. When
            material changes are made, we will notify active students via email or by updating the “Effective Date” and
            version header on this page. Your continued use of the platform following the posting of any revisions
            signifies your binding acceptance of the updated Terms.
          </p>
          <div className="legal-contact-card">
            <h4>Official Legal Inquiries</h4>
            <p><strong>Candlesticks Academy</strong></p>
            <p>Attention: Michael Kweku Essilfie (Founder & Compliance Lead)</p>
            <p>Accra, Greater Accra Region, Ghana</p>
            <p>Email: <a href="mailto:hello@candlesticks.academy">hello@candlesticks.academy</a></p>
            <p>Website: <a href="https://candlesticks.academy">https://candlesticks.academy</a></p>
          </div>
        </>
      ),
    },
  ];

  return <LegalLayout activeTab="terms" sections={termsSections} />;
}

/* ============================================================================
   PRIVACY POLICY PAGE
   ============================================================================ */

export function PrivacyPage() {
  const privacySections: LegalSection[] = [
    {
      id: "privacy-overview",
      number: "01",
      title: "Privacy Commitment & Global Regulatory Standards",
      summary: "Our philosophy on student confidentiality, financial privacy, and ethics.",
      content: (
        <>
          <p>
            At <strong>Candlesticks Academy</strong>, we recognize that financial education, personal trading goals, and
            account milestones are deeply personal. We are committed to maintaining the highest standards of data
            privacy, transparency, and information security.
          </p>
          <p>
            This Privacy Policy explains how Candlesticks Academy (<strong>“we”</strong>, <strong>“us”</strong>, or{" "}
            <strong>“our”</strong>), led by Michael Kweku Essilfie in Accra, Ghana, collects, processes, stores, and
            safeguards personal data when you visit our website, register for the student portal, or utilize our linked
            broker features.
          </p>
          <p>
            We process personal data in strict compliance with applicable global data privacy frameworks, including the{" "}
            <strong>Data Protection Act, 2012 (Act 843) of Ghana</strong>, and adhere to the fundamental principles of
            the <strong>General Data Protection Regulation (GDPR)</strong> regarding lawful processing, purpose
            limitation, and data minimization.
          </p>
        </>
      ),
    },
    {
      id: "information-we-collect",
      number: "02",
      title: "Categories of Information We Collect",
      summary: "A transparent breakdown of user data, connected broker info, and learning telemetry.",
      content: (
        <>
          <div className="legal-data-table">
            <div className="table-header">
              <span>DATA CATEGORY</span>
              <span>EXACT DATA POINTS</span>
              <span>PURPOSE & JUSTIFICATION</span>
            </div>
            <div className="table-row">
              <div>
                <strong>Account Identity</strong>
              </div>
              <span>Full Name, Email Address, WhatsApp/Phone Number, Country of Residence</span>
              <span>Creating your student login, delivering password resets, and sending critical lesson notices.</span>
            </div>
            <div className="table-row">
              <div>
                <strong>Linked Broker Info (Exness)</strong>
              </div>
              <span>
                Exness Trading Account Number / ID, deposit verification status (e.g. $50 milestone achieved), read-only
                trade statistics
              </span>
              <span>
                Verifying eligibility for free live breakdown rooms and generating student journal win-rate metrics.
              </span>
            </div>
            <div className="table-row">
              <div>
                <strong>Educational Progress</strong>
              </div>
              <span>
                Course completion percentages, quiz scores, lesson completion timestamps, live session attendance
              </span>
              <span>Tracking curriculum progression, awarding certificates, and personalizing dashboard suggestions.</span>
            </div>
            <div className="table-row">
              <div>
                <strong>Device & Session Data</strong>
              </div>
              <span>
                IP Address, browser type, device operating system, login timestamps, session authentication tokens
              </span>
              <span>Preventing unauthorized credential sharing, securing the portal, and optimizing page load speeds.</span>
            </div>
          </div>

          <div className="legal-alert-box note" style={{ marginTop: "24px" }}>
            <div className="alert-header">
              <Icon name="lock" size={18} />
              <h4>What We NEVER Collect or Store:</h4>
            </div>
            <ul className="legal-bullet-list compact">
              <li>
                <strong>No Trading Passwords:</strong> We never request, process, or store your Exness Master Password,
                Investor Password, or personal account credentials.
              </li>
              <li>
                <strong>No Withdrawal Access:</strong> We have zero ability or technical interface to withdraw funds,
                transfer balance, or alter financial beneficiaries on your broker account.
              </li>
              <li>
                <strong>No Payment Card Numbers:</strong> All subscription billing transactions are processed through
                PCI-DSS Level 1 compliant secure payment processors. We never store credit or debit card numbers on our
                servers.
              </li>
            </ul>
          </div>
        </>
      ),
    },
    {
      id: "how-we-use-information",
      number: "03",
      title: "How We Use Your Personal Information",
      summary: "Specific, legitimate purposes for processing student data.",
      content: (
        <>
          <p>We process your personal information strictly for the following operational purposes:</p>
          <ul className="legal-bullet-list">
            <li>
              <strong>Educational Delivery:</strong> Provisioning your access to video courses, technical quizzes,
              downloadable worksheets, and student rosters.
            </li>
            <li>
              <strong>Live Session Operations:</strong> Providing access control to private live Zoom/WebRTC rooms,
              displaying student display names in live chats, and recording replays.
            </li>
            <li>
              <strong>Signal Feed & Notifications:</strong> Dispatching real-time technical trade notifications, setup
              invalidation updates, and live room reminder pings based on your notification toggles.
            </li>
            <li>
              <strong>Exness Verification:</strong> Matching your Exness account identifier against partner API endpoints
              to verify whether your account qualifies for free student tier upgrades via active trading or deposit
              thresholds.
            </li>
            <li>
              <strong>Platform Integrity & Abuse Prevention:</strong> Detecting fraudulent chargebacks, multi-accounting,
              piracy attempts, or community guideline violations.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "legal-bases-for-processing",
      number: "04",
      title: "Lawful Bases for Processing (GDPR & Global Compliance)",
      summary: "The formal legal grounds upon which we collect and process data.",
      content: (
        <>
          <p>Under international data protection legislation, we rely on the following lawful bases:</p>
          <ol className="legal-number-list">
            <li>
              <strong>Contractual Necessity:</strong> Processing necessary to fulfill our service commitments to you,
              such as delivering courses, granting portal logins, and maintaining student records.
            </li>
            <li>
              <strong>Legitimate Interests:</strong> Processing necessary for our legitimate operational interests, such
              as defending our intellectual property against piracy, improving curriculum quality, and ensuring system
              uptime.
            </li>
            <li>
              <strong>Explicit Consent:</strong> Where you opt in to optional features, such as automatic signal copying,
              marketing emails, or public student testimonial quotes. You may withdraw consent at any time.
            </li>
            <li>
              <strong>Legal Compliance:</strong> Processing necessary to comply with applicable statutory tax, accounting,
              and anti-fraud regulations.
            </li>
          </ol>
        </>
      ),
    },
    {
      id: "third-party-sharing",
      number: "05",
      title: "Third-Party Sharing & Broker Disclosures",
      summary: "Strict limits on external sharing — no selling or renting of student data.",
      content: (
        <>
          <div className="legal-alert-box warning">
            <strong>Absolute Zero Data Selling Pledge:</strong> Candlesticks Academy has never sold, rented, or leased
            student personal data to third parties, advertising exchanges, or external lead brokers, and we never will.
          </div>
          <p style={{ marginTop: "16px" }}>
            We only disclose student information to external service providers under strict data processing agreements:
          </p>
          <ul className="legal-bullet-list">
            <li>
              <strong>Exness Broker API:</strong> When you connect an Exness account number, that number is verified
              against Exness’s partner infrastructure to confirm association and deposit milestones.
            </li>
            <li>
              <strong>Cloud & Database Infrastructure:</strong> Trusted cloud hosting providers (such as Google Cloud
              Platform) that adhere to ISO/IEC 27001, SOC 2, and GDPR standards.
            </li>
            <li>
              <strong>Transactional Communication:</strong> Transactional email and SMS gateways used exclusively to
              deliver account verification codes, receipts, and live session links.
            </li>
            <li>
              <strong>Legal Authorities:</strong> Only when strictly mandated by valid subpoena, court order, or
              applicable statutory law enforcement demand.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "data-retention-and-security",
      number: "06",
      title: "Data Security Measures & Retention Policies",
      summary: "How your data is encrypted, stored, and how long we retain it.",
      content: (
        <>
          <p>
            We deploy multi-layered technical, physical, and administrative safeguards designed to protect personal data
            against accidental loss, destruction, alteration, or unauthorized access:
          </p>
          <div className="legal-card-inset">
            <ul className="legal-bullet-list compact">
              <li>
                <strong>256-Bit TLS Encryption:</strong> All data transmitted between your browser and our servers is
                encrypted in transit using modern TLS 1.3 cryptographic protocols.
              </li>
              <li>
                <strong>Cryptographic Password Hashing:</strong> Passwords are never stored in plaintext; they are hashed
                using salted bcrypt algorithms before being committed to persistent storage.
              </li>
              <li>
                <strong>Least Privilege Access:</strong> Access to backend student databases is restricted exclusively to
                authorized technical personnel requiring access for system maintenance.
              </li>
            </ul>
          </div>
          <h5 style={{ marginTop: "20px", color: "var(--p-text)", fontSize: "14px" }}>Retention Schedule</h5>
          <p>
            We retain your personal data for as long as your student account remains active. If your account remains
            dormant for twenty-four (24) consecutive months without login, or upon your explicit account deletion
            request, we securely anonymize or permanently purge your identifiable personal records, preserving only
            aggregated anonymous statistics and statutory financial records required by law.
          </p>
        </>
      ),
    },
    {
      id: "your-privacy-rights",
      number: "07",
      title: "Your Data Protection Rights & Account Controls",
      summary: "Complete authority over your personal information and how to exercise it.",
      content: (
        <>
          <p>
            Regardless of your country of residence, Candlesticks Academy extends comprehensive data rights to all
            students:
          </p>
          <ul className="legal-bullet-list">
            <li>
              <strong>Right of Access:</strong> You may request a complete copy of all personal records, progress logs,
              and trade statistics we hold concerning you.
            </li>
            <li>
              <strong>Right to Rectification:</strong> You may update or correct your profile details, phone number, or
              email directly within the Settings tab of your student portal.
            </li>
            <li>
              <strong>Right to Disconnect Broker:</strong> You may sever the linkage between your Exness trading
              account and Candlesticks Academy at any time from your settings with immediate effect.
            </li>
            <li>
              <strong>Right to Erasure (“Right to Be Forgotten”):</strong> You may request permanent deletion of your
              student account and associated records by emailing{" "}
              <code className="legal-code">hello@candlesticks.academy</code>.
            </li>
            <li>
              <strong>Right to Opt Out:</strong> You have continuous control over email alerts, signal push
              notifications, and automated trade copying via one-click toggle switches in your dashboard.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "cookies-and-tracking",
      number: "08",
      title: "Cookies & Local Storage Policy",
      summary: "What cookies we use and how they support your learning experience.",
      content: (
        <>
          <p>
            Our website uses minimal, purpose-driven cookies and local storage tokens. We do not deploy third-party
            cross-site tracking cookies or behavioral advertising trackers.
          </p>
          <div className="legal-data-table">
            <div className="table-header">
              <span>COOKIE TYPE</span>
              <span>LIFESPAN</span>
              <span>FUNCTION</span>
            </div>
            <div className="table-row">
              <div>
                <strong>Essential Auth Cookies</strong>
              </div>
              <span>Session / 30 Days</span>
              <span>Maintains your logged-in session, verifies authentication tokens, and secures forms.</span>
            </div>
            <div className="table-row">
              <div>
                <strong>Preferences</strong>
              </div>
              <span>1 Year</span>
              <span>Remembers your UI settings, chart timeframe preferences (e.g. 1M, 15M), and audio state.</span>
            </div>
            <div className="table-row">
              <div>
                <strong>Analytics & Health</strong>
              </div>
              <span>Session</span>
              <span>Aggregated, privacy-preserving performance telemetry to detect broken video streams or errors.</span>
            </div>
          </div>
          <p style={{ marginTop: "16px" }}>
            You can configure your browser to block or alert you about cookies; however, blocking essential cookies will
            prevent you from logging into the student portal and accessing lessons.
          </p>
        </>
      ),
    },
    {
      id: "childrens-privacy",
      number: "09",
      title: "Protection of Minors",
      summary: "Strict prohibition of accounts for individuals under 18 years of age.",
      content: (
        <>
          <p>
            Candlesticks Academy is dedicated exclusively to adult individuals of legal age. Our services, courses, and
            community channels are not directed to children under the age of 18.
          </p>
          <p>
            We do not knowingly solicit or collect personal information from minors. If we discover that an individual
            under 18 has created an account or submitted personal data, we will promptly terminate the account and purge
            the associated records from our systems.
          </p>
        </>
      ),
    },
    {
      id: "updates-and-contact",
      number: "10",
      title: "Privacy Updates & Data Protection Contact",
      summary: "How policy revisions are published and how to contact our privacy desk.",
      content: (
        <>
          <p>
            We may periodically review and update this Privacy Policy to reflect advancements in technology, platform
            features, or regulatory changes. Any modifications will be posted to this page with an updated revision date.
            For material changes affecting your rights, we will notify you through your registered email address or via
            a dashboard notice.
          </p>
          <div className="legal-contact-card">
            <h4>Data Protection Officer & Privacy Desk</h4>
            <p><strong>Candlesticks Academy</strong></p>
            <p>Attention: Privacy & Compliance Officer</p>
            <p>Accra, Ghana</p>
            <p>Email: <a href="mailto:hello@candlesticks.academy">hello@candlesticks.academy</a></p>
            <p>Response SLA: All privacy and data export requests are answered within 5 business days.</p>
          </div>
        </>
      ),
    },
  ];

  return <LegalLayout activeTab="privacy" sections={privacySections} />;
}
