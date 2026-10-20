import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router";

type IconName =
  | "arrow"
  | "book"
  | "calendar"
  | "check"
  | "chevron"
  | "close"
  | "menu"
  | "message"
  | "play"
  | "shield"
  | "signal"
  | "users";

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  check: <path d="M5 12.5l4 4L19 7" />,
  chevron: <path d="M9 18l6-6-6-6" />,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  message: <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />,
  play: <path d="M8 5v14l11-7z" />,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>,
  signal: <><path d="M4 20v-4M10 20V10M16 20V4M22 20H2" /></>,
  users: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
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
    <a className="logo" href="#top" aria-label="Candlesticks Academy home">
      <span className="logo-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        CANDLESTICKS
        <small>ACADEMY</small>
      </span>
    </a>
  );
}

const candles = [
  { x: 28, y: 126, h: 28, up: true, wick: [115, 162] },
  { x: 62, y: 106, h: 34, up: true, wick: [96, 148] },
  { x: 96, y: 113, h: 20, up: false, wick: [102, 145] },
  { x: 130, y: 80, h: 42, up: true, wick: [68, 132] },
  { x: 164, y: 58, h: 30, up: true, wick: [48, 98] },
  { x: 198, y: 64, h: 25, up: false, wick: [54, 100] },
  { x: 232, y: 42, h: 35, up: true, wick: [28, 86] },
  { x: 266, y: 52, h: 18, up: false, wick: [41, 79] },
  { x: 300, y: 29, h: 34, up: true, wick: [16, 73] },
  { x: 334, y: 20, h: 23, up: true, wick: [8, 54] },
];

function MarketCard() {
  return (
    <div className="market-wrap">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="market-card">
        <div className="market-head">
          <div>
            <span className="pair-icon">€</span>
            <span><b>EUR / USD</b><small>Euro / U.S. Dollar</small></span>
          </div>
          <div className="price"><b>1.0842</b><span>+0.62%</span></div>
        </div>
        <div className="chart">
          <div className="chart-labels"><span>1.0870</span><span>1.0830</span><span>1.0790</span><span>1.0750</span></div>
          <svg viewBox="0 0 370 185" preserveAspectRatio="none" aria-label="Rising EUR USD candlestick chart">
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffde02" stopOpacity=".13" />
                <stop offset="1" stopColor="#ffde02" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="trend-area" d="M5 161C50 141 78 151 112 121S173 75 202 91s55-39 89-34 40-31 74-41V180H5z" />
            <path className="trend-line" d="M5 161C50 141 78 151 112 121S173 75 202 91s55-39 89-34 40-31 74-41" />
            {candles.map((c, index) => (
              <g key={c.x} className={`candle c${index}`}>
                <line x1={c.x + 7} y1={c.wick[0]} x2={c.x + 7} y2={c.wick[1]} className={c.up ? "bull" : "bear"} />
                <rect x={c.x} y={c.y} width="14" height={c.h} rx="2" className={c.up ? "bull" : "bear"} />
              </g>
            ))}
          </svg>
          <span className="live-price">1.0842</span>
        </div>
        <div className="market-stats">
          <span>24h high <b>1.0871</b></span>
          <span>24h low <b>1.0764</b></span>
          <span>Volume <b>84.2K</b></span>
        </div>
      </div>
      <div className="floating-win"><span><Icon name="signal" size={16} /></span><div><small>THIS WEEK</small><b>+8.4%</b></div></div>
      <div className="floating-live"><i /> LIVE SESSION <b>124 watching</b></div>
    </div>
  );
}

function RegisterModal({ close }: { close: () => void }) {
  const [complete, setComplete] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setComplete(true);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon-button modal-close" onClick={close} aria-label="Close registration"><Icon name="close" /></button>
        {complete ? (
          <div className="success-state">
            <span className="success-check"><Icon name="check" size={34} /></span>
            <p className="eyebrow">YOU&apos;RE ON THE LIST</p>
            <h2 id="modal-title">Welcome to the Academy.</h2>
            <p>Check your inbox for the next step. Your free month starts when your account is ready.</p>
            <button className="button primary wide" onClick={close}>Done <Icon name="arrow" /></button>
          </div>
        ) : (
          <>
            <p className="eyebrow">START YOUR FREE MONTH</p>
            <h2 id="modal-title">Create your account</h2>
            <p className="modal-copy">No card required. Learn the foundations and join the student community today.</p>
            <form onSubmit={submit}>
              <label>Full name<input required name="name" placeholder="Kwame Mensah" autoFocus /></label>
              <label>Email address<input required name="email" type="email" placeholder="you@example.com" /></label>
              <label>Phone number<input required name="phone" type="tel" placeholder="+233 00 000 0000" /></label>
              <button className="button primary wide" type="submit">Create free account <Icon name="arrow" /></button>
            </form>
            <small className="form-note">By continuing, you agree to our Terms and Privacy Policy.</small>
          </>
        )}
      </div>
    </div>
  );
}

const benefits = [
  { icon: "book" as IconName, n: "01", title: "Structured courses", text: "Build real trading skill from first principles with step-by-step lessons designed for clarity." },
  { icon: "calendar" as IconName, n: "02", title: "Live market sessions", text: "Watch the analysis unfold in real time, ask questions, and learn how decisions are made." },
  { icon: "signal" as IconName, n: "03", title: "Actionable signals", text: "Receive clear trade setups with entry, stop-loss, take-profit, and the reasoning behind each call." },
  { icon: "message" as IconName, n: "04", title: "Direct mentorship", text: "Get guidance from an active trader who is invested in your progress, discipline, and consistency." },
];

const steps = [
  { n: "01", title: "Register free", text: "Create your Academy account. No card and no commitment." },
  { n: "02", title: "Link Exness", text: "Connect your Exness trading account securely in minutes." },
  { n: "03", title: "Unlock everything", text: "Fund with $50+ to access live sessions, signals, and mentorship." },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const openRegister = () => {
    setMenuOpen(false);
    navigate("/register");
  };

  return (
    <div id="top" className="app-shell">
      <header>
        <div className="container nav">
          <Logo />
          <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation">
            <a href="#learn" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#benefits" onClick={() => setMenuOpen(false)}>What you get</a>
            <a href="#mentor" onClick={() => setMenuOpen(false)}>Mentor</a>
            <a href="#results" onClick={() => setMenuOpen(false)}>Results</a>
            <button className="button primary mobile-cta" onClick={openRegister}>Start for free</button>
          </nav>
          <div className="nav-actions">
            <button className="text-button" onClick={() => navigate("/login")}>Log in</button>
            <button className="button primary desktop-cta" onClick={openRegister}>Start for free <Icon name="arrow" size={18} /></button>
            <button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle menu">
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-grid container">
            <div className="hero-copy">
              <div className="status-pill"><i /> ENROLLMENT OPEN <span>FREE THIS MONTH</span></div>
              <h1>Trade with skill.<br />Live with <em>freedom.</em></h1>
              <p className="hero-sub">Learn Forex from the ground up with real-time sessions, practical strategies, and mentorship built for your success.</p>
              <div className="hero-actions">
                <button className="button primary large" onClick={openRegister}>Start free this month <Icon name="arrow" /></button>
                <a className="watch-link" href="#learn"><span><Icon name="play" size={16} /></span> See how it works</a>
              </div>
              <div className="trust-row">
                <div className="avatars" aria-hidden="true">
                  <span>KM</span><span>AA</span><span>EO</span><span>+</span>
                </div>
                <div><b>Join 1,200+ students</b><span><i>★★★★★</i> 4.9 student rating</span></div>
              </div>
            </div>
            <MarketCard />
          </div>
          <div className="ticker" aria-label="Market prices">
            <div className="ticker-track">
              {[["EUR/USD", "1.0842", "+0.62%"], ["GBP/USD", "1.2674", "+0.38%"], ["USD/JPY", "149.82", "-0.21%"], ["XAU/USD", "2,326.40", "+1.14%"], ["BTC/USD", "68,421", "+2.08%"], ["EUR/USD", "1.0842", "+0.62%"], ["GBP/USD", "1.2674", "+0.38%"]].map((item, i) => (
                <span key={i}><b>{item[0]}</b> {item[1]} <em className={item[2][0] === "+" ? "up" : "down"}>{item[2]}</em></span>
              ))}
            </div>
          </div>
        </section>

        <section id="learn" className="section how-section">
          <div className="container">
            <div className="section-heading centered">
              <p className="eyebrow">YOUR PATH TO THE MARKETS</p>
              <h2>Three steps. One smarter start.</h2>
              <p>We removed the noise so you can focus on what matters: learning, practising, and growing.</p>
            </div>
            <div className="steps">
              {steps.map((step, i) => (
                <div className="step" key={step.n}>
                  <div className="step-number">{step.n}</div>
                  <div className="step-icon"><Icon name={i === 0 ? "users" : i === 1 ? "shield" : "signal"} size={25} /></div>
                  <h3>{step.title}</h3><p>{step.text}</p>
                  {i < 2 && <span className="step-line"><Icon name="chevron" size={16} /></span>}
                </div>
              ))}
            </div>
            <p className="secure-note"><Icon name="shield" size={16} /> Your credentials stay private. We never access or manage your funds.</p>
          </div>
        </section>

        <section id="benefits" className="section benefits-section">
          <div className="container benefit-layout">
            <div className="sticky-heading">
              <p className="eyebrow">THE ACADEMY ADVANTAGE</p>
              <h2>Everything you need to stop guessing.</h2>
              <p>Not another library of theory. A complete learning environment designed to help you read the market with confidence.</p>
              <button className="button secondary" onClick={openRegister}>Explore the academy <Icon name="arrow" /></button>
            </div>
            <div className="benefit-grid">
              {benefits.map((item) => (
                <article className="benefit-card" key={item.n}>
                  <div className="card-top"><span><Icon name={item.icon} size={24} /></span><small>{item.n}</small></div>
                  <h3>{item.title}</h3><p>{item.text}</p>
                  <button className="card-link" onClick={openRegister} aria-label={`Learn more about ${item.title}`}>LEARN MORE <Icon name="arrow" size={16} /></button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="mentor" className="section mentor-section">
          <div className="container mentor-grid">
            <div className="mentor-image">
              <img src="public/ceo.png" alt="Forex trading mentor in a dark suit and glasses" />
              <div className="image-accent" />
              <div className="experience-badge"><b>8+</b><span>YEARS IN<br />THE MARKET</span></div>
            </div>
            <div className="mentor-copy">
              <p className="eyebrow">MEET YOUR MENTOR</p>
              <h2>Built by a trader,<br />not a textbook.</h2>
              <blockquote>“I built Candlesticks Academy to give you the guidance I wish I had when I started.”</blockquote>
              <p>No shortcuts. No unrealistic promises. Just the skills, habits, and market experience you need to become a disciplined trader.</p>
              <ul>
                <li><Icon name="check" size={16} /> Active market practitioner</li>
                <li><Icon name="check" size={16} /> Ghana-based, globally minded</li>
                <li><Icon name="check" size={16} /> Focused on responsible trading</li>
              </ul>
              <span className="signature">Michael Kweku Essilfie <small>FOUNDER, CANDLESTICKS ACADEMY</small></span>
            </div>
          </div>
        </section>

        <section id="results" className="section results-section">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">STUDENT STORIES</p>
              <h2>Progress you can feel.</h2>
            </div>
            <div className="testimonials">
              {[
                ["The live sessions changed everything. I finally understand why a setup works instead of blindly copying trades.", "AKOSUA D.", "ACCRA", "+"],
                ["The structure gave me discipline. I stopped overtrading and started making decisions I could actually explain.", "NANA K.", "KUMASI", "✓"],
                ["Clear, practical, and honest. This is the first trading community where I never felt lost or pressured.", "YAW M.", "TAKORADI", "↑"],
              ].map((t) => (
                <article className="quote-card" key={t[1]}>
                  <span className="quote-mark">“</span><p>{t[0]}</p>
                  <div><span className="student-avatar">{t[3]}</span><b>{t[1]}<small>{t[2]} · VERIFIED STUDENT</small></b></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container cta-inner">
            <p className="eyebrow">YOUR NEXT MOVE</p>
            <h2>The market won&apos;t wait.<br />Neither should you.</h2>
            <p>Start learning today. Your first month is completely free.</p>
            <button className="button dark large" onClick={openRegister}>Create your free account <Icon name="arrow" /></button>
            <span><Icon name="check" size={15} /> No card required <Icon name="check" size={15} /> Cancel anytime</span>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-top">
          <Logo />
          <p>Practical Forex education for traders who are ready to learn with purpose.</p>
          <div className="footer-links"><a href="#learn">How it works</a><a href="#benefits">Academy</a><a href="#mentor">Mentor</a><a href="mailto:hello@candlesticks.academy">Contact</a></div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 Candlesticks Academy. All rights reserved.</span>
          <span><a href="#top">Terms</a><a href="#top">Privacy</a><a href="#top">Exness partner disclosure</a></span>
        </div>
        <p className="risk-note container"><b>Risk warning:</b> Forex trading involves significant risk and may not be suitable for all investors. Educational content is not financial advice.</p>
      </footer>
    </div>
  );
}
