import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { BrandLogo } from "./app/BrandLogo";

type IconName =
  | "arrow"
  | "arrowUpRight"
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
  | "trend"
  | "users";

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  arrowUpRight: <><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></>,
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
  trend: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
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
  return <BrandLogo href="#top" size="md" />;
}

interface Candle {
  id: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 26 zoomed-out 1-minute historical candles for EUR/USD
const initialCandlesData: Candle[] = [
  { id: 1, time: "11:35", open: 1.08310, high: 1.08375, low: 1.08290, close: 1.08360, volume: 84 },
  { id: 2, time: "11:36", open: 1.08360, high: 1.08410, low: 1.08330, close: 1.08390, volume: 92 },
  { id: 3, time: "11:37", open: 1.08390, high: 1.08430, low: 1.08350, close: 1.08370, volume: 76 },
  { id: 4, time: "11:38", open: 1.08370, high: 1.08460, low: 1.08360, close: 1.08440, volume: 110 },
  { id: 5, time: "11:39", open: 1.08440, high: 1.08500, low: 1.08410, close: 1.08480, volume: 125 },
  { id: 6, time: "11:40", open: 1.08480, high: 1.08510, low: 1.08430, close: 1.08450, volume: 88 },
  { id: 7, time: "11:41", open: 1.08450, high: 1.08490, low: 1.08400, close: 1.08420, volume: 95 },
  { id: 8, time: "11:42", open: 1.08420, high: 1.08510, low: 1.08410, close: 1.08490, volume: 118 },
  { id: 9, time: "11:43", open: 1.08490, high: 1.08560, low: 1.08470, close: 1.08540, volume: 140 },
  { id: 10, time: "11:44", open: 1.08540, high: 1.08580, low: 1.08490, close: 1.08510, volume: 102 },
  { id: 11, time: "11:45", open: 1.08510, high: 1.08550, low: 1.08460, close: 1.08480, volume: 89 },
  { id: 12, time: "11:46", open: 1.08480, high: 1.08570, low: 1.08450, close: 1.08550, volume: 132 },
  { id: 13, time: "11:47", open: 1.08550, high: 1.08610, low: 1.08530, close: 1.08590, volume: 148 },
  { id: 14, time: "11:48", open: 1.08590, high: 1.08640, low: 1.08540, close: 1.08570, volume: 115 },
  { id: 15, time: "11:49", open: 1.08570, high: 1.08600, low: 1.08510, close: 1.08530, volume: 96 },
  { id: 16, time: "11:50", open: 1.08530, high: 1.08580, low: 1.08500, close: 1.08550, volume: 108 },
  { id: 17, time: "11:51", open: 1.08550, high: 1.08630, low: 1.08530, close: 1.08610, volume: 135 },
  { id: 18, time: "11:52", open: 1.08610, high: 1.08670, low: 1.08580, close: 1.08650, volume: 162 },
  { id: 19, time: "11:53", open: 1.08650, high: 1.08690, low: 1.08600, close: 1.08620, volume: 118 },
  { id: 20, time: "11:54", open: 1.08620, high: 1.08650, low: 1.08560, close: 1.08580, volume: 94 },
  { id: 21, time: "11:55", open: 1.08580, high: 1.08640, low: 1.08550, close: 1.08620, volume: 124 },
  { id: 22, time: "11:56", open: 1.08620, high: 1.08680, low: 1.08600, close: 1.08660, volume: 146 },
  { id: 23, time: "11:57", open: 1.08660, high: 1.08720, low: 1.08630, close: 1.08690, volume: 175 },
  { id: 24, time: "11:58", open: 1.08690, high: 1.08740, low: 1.08650, close: 1.08670, volume: 130 },
  { id: 25, time: "11:59", open: 1.08670, high: 1.08710, low: 1.08620, close: 1.08640, volume: 98 },
  { id: 26, time: "12:00", open: 1.08640, high: 1.08700, low: 1.08630, close: 1.08680, volume: 85 },
];

function MarketCard() {
  const [candlesList, setCandlesList] = useState<Candle[]>(initialCandlesData);
  const [currentPrice, setCurrentPrice] = useState<number>(1.08682);
  const [tickDirection, setTickDirection] = useState<"up" | "down" | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(38);
  const [timeframe, setTimeframe] = useState<string>("1m");
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);
  const nextCandleId = useRef<number>(100);

  // Live 1-minute real-time EUR/USD tick generator
  useEffect(() => {
    let tickTimeout: ReturnType<typeof setTimeout>;

    const tickInterval = setInterval(() => {
      // Sub-pip realistic EUR/USD ticks (e.g. ±0.00004 to ±0.00010)
      const pipShift = (Math.random() - 0.47) * 0.00008;

      setCurrentPrice((prev) => {
        const nextPrice = Number((prev + pipShift).toFixed(5));
        const dir = nextPrice >= prev ? "up" : "down";
        setTickDirection(dir);
        return nextPrice;
      });

      // Dynamically update the current active 1-minute candle
      setCandlesList((prevList) => {
        if (prevList.length === 0) return prevList;
        const lastIdx = prevList.length - 1;
        const active = prevList[lastIdx];
        const nextPrice = Number((active.close + pipShift).toFixed(5));
        const updatedActive: Candle = {
          ...active,
          close: nextPrice,
          high: Math.max(active.high, nextPrice),
          low: Math.min(active.low, nextPrice),
          volume: active.volume + Math.floor(Math.random() * 4 + 1),
        };
        return [...prevList.slice(0, lastIdx), updatedActive];
      });

      // Clear tick flash after 350ms
      tickTimeout = setTimeout(() => setTickDirection(null), 350);
    }, 950);

    return () => {
      clearInterval(tickInterval);
      clearTimeout(tickTimeout);
    };
  }, []);

  // 1-minute candle countdown clock
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  // When countdown resets to 60, append a new 1-minute candle cleanly
  useEffect(() => {
    if (secondsLeft === 60) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      nextCandleId.current += 1;
      const newId = nextCandleId.current;

      setCandlesList((prevList) => {
        const last = prevList[prevList.length - 1];
        const basePrice = last ? last.close : 1.0868;
        const newCandle: Candle = {
          id: newId,
          time: timeStr,
          open: basePrice,
          high: basePrice,
          low: basePrice,
          close: basePrice,
          volume: Math.floor(Math.random() * 35 + 20),
        };
        // Guarantee no duplicates exist
        const cleanList = prevList.filter((item) => item.id !== newId);
        const updated = [...cleanList, newCandle];
        return updated.length > 26 ? updated.slice(updated.length - 26) : updated;
      });
    }
  }, [secondsLeft]);

  // SVG Chart bounds: expanded dimensions for full presence
  const svgWidth = 640;
  const svgHeight = 290;
  const padLeft = 58;
  const padRight = 72;
  const padTop = 22;
  const padBottom = 38;
  const volHeight = 44; // Volume sub-chart height
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom - volHeight;

  const minVal = Math.min(...candlesList.map((c) => c.low)) - 0.00035;
  const maxVal = Math.max(...candlesList.map((c) => c.high)) + 0.00035;
  const range = maxVal - minVal || 0.001;

  const getY = (price: number) => {
    return padTop + chartH - ((price - minVal) / range) * chartH;
  };

  const candleCount = candlesList.length;
  const stepX = chartW / candleCount;
  const bodyWidth = Math.max(7, stepX * 0.65);

  // Volume scale
  const maxVol = Math.max(...candlesList.map((c) => c.volume), 180);
  const volBaseY = padTop + chartH + volHeight;
  const getVolH = (vol: number) => Math.max(3, (vol / maxVol) * (volHeight - 10));

  // Price guidelines across the zoomed out window
  const gridLevels = [
    maxVal - range * 0.1,
    maxVal - range * 0.35,
    maxVal - range * 0.65,
    maxVal - range * 0.92,
  ];

  // Moving Average (9-period Exponential / Simple Moving Average curve)
  const maPoints = candlesList.map((_, i) => {
    const windowSlice = candlesList.slice(Math.max(0, i - 8), i + 1);
    const avgClose = windowSlice.reduce((sum, c) => sum + c.close, 0) / windowSlice.length;
    const cx = padLeft + i * stepX + stepX / 2;
    const cy = getY(avgClose);
    return { cx, cy };
  });

  const maPathD = maPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.cx} ${pt.cy}` : `${acc} L ${pt.cx} ${pt.cy}`),
    ""
  );

  // Trendline & area path coordinates
  const trendPoints = candlesList.map((c, i) => {
    const cx = padLeft + i * stepX + stepX / 2;
    const cy = getY(c.close);
    return { cx, cy };
  });

  const trendPathD = trendPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.cx} ${pt.cy}` : `${acc} L ${pt.cx} ${pt.cy}`),
    ""
  );

  const firstPt = trendPoints[0] || { cx: padLeft, cy: padTop + chartH };
  const lastPt = trendPoints[trendPoints.length - 1] || { cx: padLeft + chartW, cy: padTop + chartH };
  const areaPathD = `${trendPathD} L ${lastPt.cx} ${padTop + chartH} L ${firstPt.cx} ${padTop + chartH} Z`;

  const liveY = getY(currentPrice);

  return (
    <div className="market-wrap">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="market-card expanded-euro">
        <div className="market-head">
          <div className="pair-meta">
            <span className="pair-icon">€</span>
            <div>
              <div className="pair-title-row">
                <b>EUR / USD</b>
                <span className="timeframe-badge">{timeframe.toUpperCase()} ZOOMED</span>
                <span className="live-feed-pill"><i /> REAL-TIME</span>
              </div>
              <small>Euro / U.S. Dollar · 1-Minute Live Candlesticks</small>
            </div>
          </div>
          
          <div className="market-head-controls">
            <div className="market-timeframe-selector">
              {(["1m", "5m", "15m", "1h"] as const).map((tf) => (
                <button
                  key={tf}
                  className={timeframe === tf ? "tf-btn active" : "tf-btn"}
                  onClick={() => setTimeframe(tf)}
                  type="button"
                >
                  {tf}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`indicator-toggle-btn ${showIndicators ? "active" : ""}`}
              onClick={() => setShowIndicators(!showIndicators)}
              title="Toggle Indicators"
            >
              EMA(9)
            </button>
          </div>

          <div className={`price ${tickDirection ? `tick-${tickDirection}` : ""}`}>
            <b>{currentPrice.toFixed(5)}</b>
            <div className="price-delta-row">
              <span className="price-delta">+0.68%</span>
              <span className="pip-delta">+74.2 pips</span>
            </div>
          </div>
        </div>

        <div className="chart-zoom-bar">
          <div className="zoom-left">
            <span className="zoom-hint">
              <Icon name="signal" size={14} /> 1-Min Zoomed-Out Chart · Candle closes in <b>{secondsLeft}s</b>
            </span>
            <div className="candle-countdown-bar">
              <div className="countdown-fill" style={{ width: `${(secondsLeft / 60) * 100}%` }} />
            </div>
          </div>
          <div className="zoom-right">
            <span className="spread-badge">Spread: <b>0.2 pips</b></span>
            <span className="sentiment-badge">Buyers: <b>67%</b></span>
          </div>
        </div>

        <div className="chart expanded-chart">
          {/* Price Axis Labels on left */}
          <div className="chart-labels">
            {gridLevels.map((lvl, i) => (
              <span key={`grid-label-${i}`}>{lvl.toFixed(4)}</span>
            ))}
            <span className="vol-axis-label">VOL</span>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" aria-label="Live 1-minute zoomed out EUR USD candlestick chart">
            <defs>
              <linearGradient id="liveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffb600" stopOpacity="0.22" />
                <stop offset="60%" stopColor="#ffb600" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#ffb600" stopOpacity="0" />
              </linearGradient>
              <filter id="liveLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Grid Guideline lines */}
            {gridLevels.map((lvl, i) => {
              const gy = getY(lvl);
              return (
                <line
                  key={`grid-line-${i}`}
                  x1={padLeft}
                  y1={gy}
                  x2={padLeft + chartW}
                  y2={gy}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Volume Separator line */}
            <line
              x1={padLeft}
              y1={padTop + chartH + 6}
              x2={padLeft + chartW}
              y2={padTop + chartH + 6}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="2 2"
              strokeWidth="0.8"
            />

            {/* Glowing Trend Area & Path */}
            <path className="trend-area" d={areaPathD} fill="url(#liveAreaGrad)" />
            <path className="trend-line" d={trendPathD} filter="url(#liveLineGlow)" stroke="#ffb600" strokeWidth="1.8" fill="none" opacity="0.8" />

            {/* Moving Average 9 EMA Curve */}
            {showIndicators && (
              <path className="ema-line" d={maPathD} stroke="#38bdf8" strokeWidth="1.6" fill="none" opacity="0.85" />
            )}

            {/* Volume Histogram Bars */}
            {candlesList.map((c, index) => {
              const isBull = c.close >= c.open;
              const cx = padLeft + index * stepX + stepX / 2;
              const vh = getVolH(c.volume);
              const vy = volBaseY - vh;
              return (
                <rect
                  key={`vol-${c.id}-${index}`}
                  x={cx - bodyWidth / 2}
                  y={vy}
                  width={bodyWidth}
                  height={vh}
                  rx="1"
                  fill={isBull ? "#0ecb81" : "#f6465d"}
                  opacity="0.32"
                />
              );
            })}

            {/* Candlestick Bars */}
            {candlesList.map((c, index) => {
              const isLast = index === candlesList.length - 1;
              const isBull = c.close >= c.open;
              const cx = padLeft + index * stepX + stepX / 2;
              const topWickY = getY(c.high);
              const botWickY = getY(c.low);
              const bodyTop = Math.min(getY(c.open), getY(c.close));
              const bodyH = Math.max(3.5, Math.abs(getY(c.close) - getY(c.open)));

              return (
                <g
                  key={`candle-${c.id}-${index}`}
                  className={`live-candle-item ${isLast ? "candle-active" : ""}`}
                  onMouseEnter={() => setHoveredCandle(c)}
                  onMouseLeave={() => setHoveredCandle(null)}
                >
                  {/* Upper and Lower Wick */}
                  <line
                    x1={cx}
                    y1={topWickY}
                    x2={cx}
                    y2={botWickY}
                    stroke={isBull ? "#0ecb81" : "#f6465d"}
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    opacity={isLast ? 1 : 0.85}
                  />
                  {/* Candle Body */}
                  <rect
                    x={cx - bodyWidth / 2}
                    y={bodyTop}
                    width={bodyWidth}
                    height={bodyH}
                    rx="2"
                    fill={isBull ? "#0ecb81" : "#f6465d"}
                    stroke={isBull ? "#26e297" : "#ff6b7e"}
                    strokeWidth="0.8"
                    className={isBull ? "bull" : "bear"}
                  />
                  {/* Active Candle Pulsing Highlight */}
                  {isLast && (
                    <circle
                      cx={cx}
                      cy={getY(c.close)}
                      r="4"
                      fill="#ffb600"
                      className="live-candle-pulse"
                    />
                  )}
                </g>
              );
            })}

            {/* Live Price Horizontal Dashed Guideline */}
            <line
              x1={padLeft}
              y1={liveY}
              x2={padLeft + chartW + 8}
              y2={liveY}
              stroke={tickDirection === "down" ? "#f6465d" : "#0ecb81"}
              strokeDasharray="3 3"
              strokeWidth="1.3"
              opacity="0.9"
            />

            {/* Time Axis Labels along bottom of chart */}
            {candlesList
              .filter((_, i) => i % 5 === 0 || i === candlesList.length - 1)
              .map((c, i, arr) => {
                const origIndex = candlesList.findIndex((item) => item.id === c.id);
                const cx = padLeft + (origIndex >= 0 ? origIndex : i) * stepX + stepX / 2;
                const isLast = i === arr.length - 1;
                return (
                  <text
                    key={`time-${c.id}-${origIndex}-${i}`}
                    x={cx}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    fill={isLast ? "#ffb600" : "#717985"}
                    fontSize="8.5"
                    fontFamily="'DM Mono', monospace"
                    fontWeight={isLast ? "600" : "400"}
                  >
                    {isLast ? "NOW (1m)" : c.time}
                  </text>
                );
              })}
          </svg>

          {/* Right Axis Live Price Badge tracking live Y */}
          <div
            className={`live-price-axis-tag ${tickDirection ? `tick-${tickDirection}` : ""}`}
            style={{ top: `${Math.max(12, Math.min(235, (liveY / svgHeight) * 100))}%` }}
          >
            <span className="axis-live-dot" />
            {currentPrice.toFixed(5)}
          </div>

          {/* Candlestick Hover Tooltip HUD */}
          {hoveredCandle && (
            <div className="candle-tooltip">
              <span>Time: <b>{hoveredCandle.time} (1m)</b></span>
              <span>O: <b>{hoveredCandle.open.toFixed(5)}</b></span>
              <span>H: <b>{hoveredCandle.high.toFixed(5)}</b></span>
              <span>L: <b>{hoveredCandle.low.toFixed(5)}</b></span>
              <span>C: <b>{hoveredCandle.close.toFixed(5)}</b></span>
              <span>Vol: <b>{hoveredCandle.volume}K</b></span>
            </div>
          )}
        </div>

        <div className="market-stats">
          <div>
            <span>24h High</span>
            <b>1.08740</b>
          </div>
          <div>
            <span>24h Low</span>
            <b>1.07635</b>
          </div>
          <div>
            <span>24h Volume</span>
            <b>142.8K Lots</b>
          </div>
          <div>
            <span>Volatility</span>
            <b className="text-bull">Low · 0.58%</b>
          </div>
        </div>
      </div>

      <div className="floating-win">
        <span><Icon name="signal" size={18} /></span>
        <div>
          <small>WEEKLY ACCURACY</small>
          <b>84.6% · +8.4%</b>
        </div>
      </div>

      <div className="floating-live">
        <i /> EUR/USD LIVE <b>184 watching</b>
      </div>

      <div className="floating-orderflow">
        <span className="dot-pulse" />
        <div>
          <small>INSTANT EXECUTION</small>
          <b>0.2 Pip Spread · 12ms</b>
        </div>
      </div>
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
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openRegister = () => {
    setMenuOpen(false);
    navigate("/onboarding");
  };

  return (
    <div id="top" className="app-shell">
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="container nav">
          <Logo />
          <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation">
            <a href="#learn" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#benefits" onClick={() => setMenuOpen(false)}>What you get</a>
            <a href="#mentor" onClick={() => setMenuOpen(false)}>Mentor</a>
            <a href="#results" onClick={() => setMenuOpen(false)}>Results</a>
            <button className="button primary mobile-cta rounded-pill" onClick={openRegister}>Start for free</button>
          </nav>
          <div className="nav-actions">
            <button className="text-button" onClick={() => navigate("/login")}>Log in</button>
            <button className="button primary desktop-cta rounded-pill" onClick={openRegister}>Start for free <Icon name="arrow" size={18} /></button>
            <button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle menu">
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="status-pill"><i /> ENROLLMENT OPEN <span>FREE THIS MONTH</span></div>
              <h1>Trade with skill.<br />Live with <em>freedom.</em></h1>
              <p className="hero-sub">Learn forex from the ground up with structured lessons, live daily analysis, and personal mentorship. No signals-only nonsense.</p>
              <div className="hero-actions">
                <button className="button primary large rounded-pill" onClick={openRegister}>Start free this month <Icon name="arrow" /></button>
                <a className="watch-link" href="#learn"><span><Icon name="play" size={16} /></span> See how it works</a>
              </div>
              <div className="trust-row">
                <div className="avatars" aria-hidden="true">
                  <span>KM</span><span>AA</span><span>EO</span><span>+</span>
                </div>
                <div><b>Join 1,200+ students</b><span><i>★★★★★</i> 4.9 student rating across West Africa</span></div>
              </div>
            </div>
            <MarketCard />
          </div>

          <div className="ticker" aria-label="Market prices">
            <div className="ticker-track">
              {[["EUR/USD", "1.0842", "+0.62%"], ["GBP/USD", "1.2674", "+0.38%"], ["USD/JPY", "149.82", "-0.21%"], ["XAU/USD", "2,326.40", "+1.14%"], ["BTC/USD", "68,421", "+2.08%"], ["EUR/USD", "1.0842", "+0.62%"], ["GBP/USD", "1.2674", "+0.38%"]].map((item, i) => (
                <span key={`ticker-${item[0]}-${i}`}><b>{item[0]}</b> {item[1]} <em className={item[2][0] === "+" ? "up" : "down"}>{item[2]}</em></span>
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
              <img src="/ceo.png" alt="Forex trading mentor in a dark suit and glasses" />
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
            <button className="button dark large rounded-pill" onClick={openRegister}>Create your free account <Icon name="arrow" /></button>
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
          <span>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms#exness-disclosure">Exness partner disclosure</Link>
          </span>
        </div>
        <p className="risk-note container"><b>Risk warning:</b> Forex trading involves significant risk and may not be suitable for all investors. Educational content is not financial advice.</p>
      </footer>
    </div>
  );
}
