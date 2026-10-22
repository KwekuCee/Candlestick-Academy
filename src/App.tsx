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

type HeroPairId = "EUR/USD" | "GBP/USD" | "XAU/USD";
type HeroTimeframe = "1m" | "5m" | "15m";

interface Candle {
  id: number;
  timestamp: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9: number;
}

interface PairConfig {
  id: HeroPairId;
  shortLabel: string;
  buttonLabel: string;
  fullName: string;
  icon: string;
  decimals: number;
  gridDecimals: number;
  pipMultiplier: number;
  krakenPair: string;
  wsPair: string;
}

const HERO_PAIRS: Record<HeroPairId, PairConfig> = {
  "EUR/USD": {
    id: "EUR/USD",
    shortLabel: "EUR / USD",
    buttonLabel: "EUR / USD",
    fullName: "Euro / U.S. Dollar",
    icon: "€",
    decimals: 5,
    gridDecimals: 4,
    pipMultiplier: 10000,
    krakenPair: "EURUSD",
    wsPair: "EUR/USD",
  },
  "GBP/USD": {
    id: "GBP/USD",
    shortLabel: "GBP / USD",
    buttonLabel: "GBP / USD",
    fullName: "British Pound / U.S. Dollar",
    icon: "£",
    decimals: 5,
    gridDecimals: 4,
    pipMultiplier: 10000,
    krakenPair: "GBPUSD",
    wsPair: "GBP/USD",
  },
  "XAU/USD": {
    id: "XAU/USD",
    shortLabel: "XAU / USD",
    buttonLabel: "Gold (XAU / USD)",
    fullName: "Gold Spot / U.S. Dollar",
    icon: "Au",
    decimals: 2,
    gridDecimals: 2,
    pipMultiplier: 10,
    krakenPair: "PAXGUSD",
    wsPair: "PAXG/USD",
  },
};

const TIMEFRAME_META: Record<HeroTimeframe, { label: string; seconds: number; krakenInterval: number }> = {
  "1m": { label: "1-Minute", seconds: 60, krakenInterval: 1 },
  "5m": { label: "5-Minute", seconds: 300, krakenInterval: 5 },
  "15m": { label: "15-Minute", seconds: 900, krakenInterval: 15 },
};

function computeRealEma9Series(closes: number[]): number[] {
  if (closes.length === 0) return [];
  const k = 2 / (9 + 1);
  const out: number[] = [];
  let prev = closes[0];
  for (let i = 0; i < closes.length; i++) {
    prev = i === 0 ? closes[0] : closes[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function formatUnixTime(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatCountdown(secondsLeft: number, tf: HeroTimeframe): string {
  if (tf === "1m") return `${secondsLeft}s`;
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function getSecondsToNextCandle(tf: HeroTimeframe): number {
  const intervalSec = TIMEFRAME_META[tf].seconds;
  const nowSec = Math.floor(Date.now() / 1000);
  const rem = intervalSec - (nowSec % intervalSec);
  return rem > 0 ? rem : intervalSec;
}

async function fetchDirectKrakenMarketData(
  pairCfg: PairConfig,
  tf: HeroTimeframe
): Promise<{
  candles: Candle[];
  currentPrice: number;
  spreadPips: number;
  high24h: number;
  low24h: number;
  open24h: number;
  changePct: number;
  changePips: number;
  volume24h: number;
} | null> {
  try {
    const tfInfo = TIMEFRAME_META[tf];
    const [ohlcResp, tickerResp] = await Promise.all([
      fetch(`https://api.kraken.com/0/public/OHLC?pair=${pairCfg.krakenPair}&interval=${tfInfo.krakenInterval}`),
      fetch(`https://api.kraken.com/0/public/Ticker?pair=${pairCfg.krakenPair}`),
    ]);
    if (!ohlcResp.ok) return null;
    const ohlcJson = await ohlcResp.json();
    const tickerJson = tickerResp.ok ? await tickerResp.json() : null;

    const resultObj = ohlcJson?.result || {};
    const pairKey = Object.keys(resultObj).find((k) => k !== "last");
    const rows: any[] = pairKey ? resultObj[pairKey] : [];
    if (!Array.isArray(rows) || rows.length < 5) return null;

    const parsed = rows
      .map((r: any[]) => ({
        timestamp: Number(r[0]),
        open: Number(r[1]),
        high: Number(r[2]),
        low: Number(r[3]),
        close: Number(r[4]),
        volume: Math.max(1, Number(r[6]) || Number(r[7]) || 10),
      }))
      .filter((c) => Number.isFinite(c.close) && c.close > 0);

    const ema9All = computeRealEma9Series(parsed.map((c) => c.close));
    const visibleCount = 28;
    const startIdx = Math.max(0, parsed.length - visibleCount);
    const candles: Candle[] = parsed.slice(startIdx).map((c, idx) => ({
      id: c.timestamp,
      timestamp: c.timestamp,
      time: formatUnixTime(c.timestamp),
      open: Number(c.open.toFixed(pairCfg.decimals)),
      high: Number(c.high.toFixed(pairCfg.decimals)),
      low: Number(c.low.toFixed(pairCfg.decimals)),
      close: Number(c.close.toFixed(pairCfg.decimals)),
      volume: Math.round(c.volume * 100) / 100,
      ema9: Number((ema9All[startIdx + idx] ?? c.close).toFixed(pairCfg.decimals)),
    }));

    let currentPrice = candles[candles.length - 1]?.close || 0;
    let spreadPips = pairCfg.id === "XAU/USD" ? 1.2 : 0.2;
    let high24h = Math.max(...parsed.slice(-96).map((c) => c.high));
    let low24h = Math.min(...parsed.slice(-96).map((c) => c.low));
    let open24h = parsed[Math.max(0, parsed.length - 96)]?.open || currentPrice;
    let volume24h = parsed.slice(-96).reduce((acc, c) => acc + c.volume, 0);

    if (tickerJson?.result) {
      const tKey = Object.keys(tickerJson.result)[0];
      const tInfo = tKey ? tickerJson.result[tKey] : null;
      if (tInfo) {
        const bid = Number(tInfo.b?.[0] || 0);
        const ask = Number(tInfo.a?.[0] || 0);
        const last = Number(tInfo.c?.[0] || 0);
        if (bid > 0 && ask > 0) {
          currentPrice = Number(((bid + ask) / 2).toFixed(pairCfg.decimals));
          spreadPips = Number(Math.max(0.1, (ask - bid) * pairCfg.pipMultiplier).toFixed(1));
        } else if (last > 0) {
          currentPrice = Number(last.toFixed(pairCfg.decimals));
        }
        if (tInfo.h?.[1]) high24h = Number(Number(tInfo.h[1]).toFixed(pairCfg.decimals));
        if (tInfo.l?.[1]) low24h = Number(Number(tInfo.l[1]).toFixed(pairCfg.decimals));
        if (tInfo.o) open24h = Number(Number(tInfo.o).toFixed(pairCfg.decimals));
        if (tInfo.v?.[1]) volume24h = Math.round(Number(tInfo.v[1]));
      }
    }

    const diff = currentPrice - open24h;
    const changePct = open24h > 0 ? Number(((diff / open24h) * 100).toFixed(2)) : 0;
    const changePips = Number((diff * pairCfg.pipMultiplier).toFixed(1));

    return {
      candles,
      currentPrice,
      spreadPips,
      high24h: Number(Math.max(high24h, currentPrice).toFixed(pairCfg.decimals)),
      low24h: Number(Math.min(low24h, currentPrice).toFixed(pairCfg.decimals)),
      open24h,
      changePct,
      changePips,
      volume24h,
    };
  } catch {
    return null;
  }
}

function MarketCard() {
  const [selectedPair, setSelectedPair] = useState<HeroPairId>("EUR/USD");
  const [timeframe, setTimeframe] = useState<HeroTimeframe>("1m");
  const [candlesList, setCandlesList] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(1.12348);
  const [tickDirection, setTickDirection] = useState<"up" | "down" | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => getSecondsToNextCandle("1m"));
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);
  const [loadingChart, setLoadingChart] = useState<boolean>(true);
  const [marketStats, setMarketStats] = useState<{
    spreadPips: number;
    high24h: number;
    low24h: number;
    open24h: number;
    changePct: number;
    changePips: number;
    volume24h: number;
  }>({
    spreadPips: 0.2,
    high24h: 1.12449,
    low24h: 1.12148,
    open24h: 1.12353,
    changePct: 0.08,
    changePips: 9.2,
    volume24h: 30810,
  });

  const pairConfig = HERO_PAIRS[selectedPair];
  const tfMeta = TIMEFRAME_META[timeframe];
  const prevPriceRef = useRef<number>(currentPrice);

  // Helper to apply incoming live price tick to active candle and EMA(9)
  const applyLiveTick = (liveVal: number, addVol = 0) => {
    const rounded = Number(liveVal.toFixed(pairConfig.decimals));
    if (!Number.isFinite(rounded) || rounded <= 0) return;

    const prev = prevPriceRef.current;
    if (prev > 0 && rounded !== prev) {
      setTickDirection(rounded > prev ? "up" : "down");
    }
    prevPriceRef.current = rounded;
    setCurrentPrice(rounded);

    setCandlesList((prevList) => {
      if (prevList.length === 0) return prevList;
      const intervalSec = tfMeta.seconds;
      const nowBucket = Math.floor(Date.now() / 1000 / intervalSec) * intervalSec;
      const lastIdx = prevList.length - 1;
      const last = prevList[lastIdx];
      const prevEma = prevList.length > 1 ? prevList[lastIdx - 1].ema9 : last.ema9;
      const k = 2 / (9 + 1);
      const nextEma9 = Number((rounded * k + prevEma * (1 - k)).toFixed(pairConfig.decimals));

      if (nowBucket > last.timestamp) {
        const newCandle: Candle = {
          id: nowBucket,
          timestamp: nowBucket,
          time: formatUnixTime(nowBucket),
          open: last.close,
          high: Math.max(last.close, rounded),
          low: Math.min(last.close, rounded),
          close: rounded,
          volume: Math.max(1, Math.round(addVol * 100) / 100),
          ema9: nextEma9,
        };
        const nextList = [...prevList, newCandle];
        return nextList.length > 28 ? nextList.slice(nextList.length - 28) : nextList;
      }

      const updatedActive: Candle = {
        ...last,
        close: rounded,
        high: Number(Math.max(last.high, rounded).toFixed(pairConfig.decimals)),
        low: Number(Math.min(last.low, rounded).toFixed(pairConfig.decimals)),
        volume: Math.round((last.volume + addVol) * 100) / 100,
        ema9: nextEma9,
      };
      return [...prevList.slice(0, lastIdx), updatedActive];
    });

    setMarketStats((prevStats) => {
      const open24h = prevStats.open24h || rounded;
      const diff = rounded - open24h;
      return {
        ...prevStats,
        high24h: Number(Math.max(prevStats.high24h, rounded).toFixed(pairConfig.decimals)),
        low24h: Number(Math.min(prevStats.low24h || rounded, rounded).toFixed(pairConfig.decimals)),
        changePct: open24h > 0 ? Number(((diff / open24h) * 100).toFixed(2)) : 0,
        changePips: Number((diff * pairConfig.pipMultiplier).toFixed(1)),
      };
    });
  };

  // Clear tick flash cleanly
  useEffect(() => {
    if (!tickDirection) return;
    const t = setTimeout(() => setTickDirection(null), 400);
    return () => clearTimeout(t);
  }, [tickDirection]);

  // Fetch real OHLCV candles + live market stats on pair or timeframe change and poll every 4.5s
  useEffect(() => {
    let cancelled = false;
    setLoadingChart(true);
    setHoveredCandle(null);
    setSecondsLeft(getSecondsToNextCandle(timeframe));

    async function loadRealMarketCandles(isInitial = false) {
      try {
        const res = await fetch(
          `/api/market/candles?symbol=${encodeURIComponent(selectedPair)}&interval=${timeframe}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data?.candles) && data.candles.length > 0) {
            setCandlesList(data.candles);
            const nextPrice = Number(data.currentPrice);
            if (!isInitial && prevPriceRef.current > 0 && nextPrice !== prevPriceRef.current) {
              setTickDirection(nextPrice > prevPriceRef.current ? "up" : "down");
            }
            prevPriceRef.current = nextPrice;
            setCurrentPrice(nextPrice);
            setMarketStats({
              spreadPips: Number(data.spreadPips || (selectedPair === "XAU/USD" ? 1.2 : 0.2)),
              high24h: Number(data.high24h || nextPrice),
              low24h: Number(data.low24h || nextPrice),
              open24h: Number(data.open24h || nextPrice),
              changePct: Number(data.changePct || 0),
              changePips: Number(data.changePips || 0),
              volume24h: Number(data.volume24h || 1000),
            });
            setLoadingChart(false);
            return;
          }
        }
      } catch {
        // Fallback to direct Kraken CORS API below
      }

      const fallback = await fetchDirectKrakenMarketData(HERO_PAIRS[selectedPair], timeframe);
      if (!cancelled && fallback && fallback.candles.length > 0) {
        setCandlesList(fallback.candles);
        const nextPrice = fallback.currentPrice;
        if (!isInitial && prevPriceRef.current > 0 && nextPrice !== prevPriceRef.current) {
          setTickDirection(nextPrice > prevPriceRef.current ? "up" : "down");
        }
        prevPriceRef.current = nextPrice;
        setCurrentPrice(nextPrice);
        setMarketStats({
          spreadPips: fallback.spreadPips,
          high24h: fallback.high24h,
          low24h: fallback.low24h,
          open24h: fallback.open24h,
          changePct: fallback.changePct,
          changePips: fallback.changePips,
          volume24h: fallback.volume24h,
        });
        setLoadingChart(false);
      }
    }

    void loadRealMarketCandles(true);
    const pollInterval = setInterval(() => {
      void loadRealMarketCandles(false);
    }, 4500);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [selectedPair, timeframe]);

  // Real-time WebSocket stream from Kraken for instantaneous market ticks and spread updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket("wss://ws.kraken.com");
      const wsPairName = HERO_PAIRS[selectedPair].wsPair;
      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            event: "subscribe",
            pair: [wsPairName],
            subscription: { name: "spread" },
          })
        );
        ws?.send(
          JSON.stringify({
            event: "subscribe",
            pair: [wsPairName],
            subscription: { name: "trade" },
          })
        );
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (!Array.isArray(msg)) return;
          const channelName = msg[2];
          const payload = msg[1];
          if (channelName === "spread" && Array.isArray(payload)) {
            const bid = Number(payload[0]);
            const ask = Number(payload[1]);
            if (bid > 0 && ask > 0) {
              const mid = (bid + ask) / 2;
              applyLiveTick(mid, 0);
              const cfg = HERO_PAIRS[selectedPair];
              const sp = Number(Math.max(0.1, (ask - bid) * cfg.pipMultiplier).toFixed(1));
              setMarketStats((prev) => ({ ...prev, spreadPips: sp }));
            }
          } else if (channelName === "trade" && Array.isArray(payload) && payload.length > 0) {
            const lastTrade = payload[payload.length - 1];
            const tradePrice = Number(lastTrade?.[0]);
            const tradeVol = Number(lastTrade?.[1] || 0);
            if (tradePrice > 0) {
              applyLiveTick(tradePrice, tradeVol);
            }
          }
        } catch {
          // ignore parse errors
        }
      };
    } catch {
      // WebSocket optional enhancement
    }

    return () => {
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [selectedPair, timeframe]);

  // Real UTC timeframe countdown clock (1m = 60s, 5m = 300s, 15m = 900s)
  useEffect(() => {
    setSecondsLeft(getSecondsToNextCandle(timeframe));
    const countdownInterval = setInterval(() => {
      setSecondsLeft(getSecondsToNextCandle(timeframe));
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [timeframe]);

  // SVG Chart bounds: expanded dimensions for full presence
  const svgWidth = 640;
  const svgHeight = 290;
  const padLeft = 62;
  const padRight = 76;
  const padTop = 22;
  const padBottom = 38;
  const volHeight = 44; // Volume sub-chart height
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom - volHeight;

  const activeCandles: Candle[] =
    candlesList.length > 0
      ? candlesList
      : [
          {
            id: 1,
            timestamp: Math.floor(Date.now() / 1000),
            time: formatUnixTime(Math.floor(Date.now() / 1000)),
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice,
            volume: 10,
            ema9: currentPrice,
          },
        ];

  const rawMin = Math.min(...activeCandles.map((c) => Math.min(c.low, c.ema9)));
  const rawMax = Math.max(...activeCandles.map((c) => Math.max(c.high, c.ema9)));
  const rawSpan = Math.max(
    rawMax - rawMin,
    selectedPair === "XAU/USD" ? 1.2 : 0.00025
  );
  const padBuffer = rawSpan * 0.14;
  const minVal = rawMin - padBuffer;
  const maxVal = rawMax + padBuffer;
  const range = maxVal - minVal || 0.001;

  const getY = (price: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, price));
    return padTop + chartH - ((clamped - minVal) / range) * chartH;
  };

  const candleCount = activeCandles.length;
  const stepX = chartW / candleCount;
  const bodyWidth = Math.max(7, stepX * 0.65);

  // Volume scale
  const maxVol = Math.max(...activeCandles.map((c) => c.volume), 1);
  const volBaseY = padTop + chartH + volHeight;
  const getVolH = (vol: number) => Math.max(3, (vol / maxVol) * (volHeight - 10));

  // Price guidelines across the window
  const gridLevels = [
    maxVal - range * 0.1,
    maxVal - range * 0.35,
    maxVal - range * 0.65,
    maxVal - range * 0.92,
  ];

  // Real 9-period Exponential Moving Average (EMA 9) curve from candle.ema9
  const maPoints = activeCandles.map((c, i) => {
    const cx = padLeft + i * stepX + stepX / 2;
    const cy = getY(c.ema9);
    return { cx, cy };
  });

  const maPathD = maPoints.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.cx} ${pt.cy}` : `${acc} L ${pt.cx} ${pt.cy}`),
    ""
  );

  // Trendline & area path coordinates
  const trendPoints = activeCandles.map((c, i) => {
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
  const isPositiveDay = marketStats.changePct >= 0;
  const bullCandlesCount = activeCandles.filter((c) => c.close >= c.open).length;
  const buyersPct = Math.round((bullCandlesCount / Math.max(1, activeCandles.length)) * 100);
  const volatilityPct =
    marketStats.low24h > 0
      ? (((marketStats.high24h - marketStats.low24h) / marketStats.low24h) * 100).toFixed(2)
      : "0.45";

  return (
    <div className="market-wrap">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="market-card expanded-euro">
        {/* Instrument Switcher Bar: EUR/USD, GBP/USD, Gold (XAU/USD) */}
        <div className="market-pair-switcher" role="tablist" aria-label="Select live market instrument">
          <div className="pair-switch-tabs">
            {(["EUR/USD", "GBP/USD", "XAU/USD"] as const).map((pairId) => {
              const cfg = HERO_PAIRS[pairId];
              const isSelected = selectedPair === pairId;
              return (
                <button
                  key={pairId}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={isSelected ? "pair-tab-btn active" : "pair-tab-btn"}
                  onClick={() => setSelectedPair(pairId)}
                >
                  <span className="pair-tab-sym">{cfg.icon}</span>
                  <span>{cfg.buttonLabel}</span>
                </button>
              );
            })}
          </div>
          <span className="live-source-tag">
            <i className="dot-pulse" />
            {loadingChart ? "Syncing live feed..." : <>LIVE SPOT OHLCV · <b>{pairConfig.shortLabel}</b></>}
          </span>
        </div>

        <div className="market-head">
          <div className="pair-meta">
            <span className="pair-icon">{pairConfig.icon}</span>
            <div>
              <div className="pair-title-row">
                <b>{pairConfig.shortLabel}</b>
                <span className="timeframe-badge">{timeframe.toUpperCase()} LIVE</span>
                <span className="live-feed-pill"><i /> REAL-TIME</span>
              </div>
              <small>
                {pairConfig.fullName} · {tfMeta.label} Real Market Candlesticks
              </small>
            </div>
          </div>

          <div className="market-head-controls">
            <div className="market-timeframe-selector" role="group" aria-label="Select chart timeframe">
              {(["1m", "5m", "15m"] as const).map((tf) => (
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
              title="Toggle 9-Period Exponential Moving Average"
            >
              EMA(9)
            </button>
          </div>

          <div className={`price ${tickDirection ? `tick-${tickDirection}` : ""}`}>
            <b>{currentPrice.toFixed(pairConfig.decimals)}</b>
            <div className="price-delta-row">
              <span className={`price-delta ${isPositiveDay ? "" : "neg"}`}>
                {isPositiveDay ? "+" : ""}
                {marketStats.changePct.toFixed(2)}%
              </span>
              <span className={`pip-delta ${isPositiveDay ? "" : "neg"}`}>
                {marketStats.changePips >= 0 ? "+" : ""}
                {marketStats.changePips.toFixed(1)} pips
              </span>
            </div>
          </div>
        </div>

        <div className="chart-zoom-bar">
          <div className="zoom-left">
            <span className="zoom-hint">
              <Icon name="signal" size={14} /> {tfMeta.label} Live Chart · Candle closes in{" "}
              <b>{formatCountdown(secondsLeft, timeframe)}</b>
            </span>
            <div className="candle-countdown-bar">
              <div
                className="countdown-fill"
                style={{ width: `${(secondsLeft / tfMeta.seconds) * 100}%` }}
              />
            </div>
          </div>
          <div className="zoom-right">
            <span className="spread-badge">
              Spread: <b>{marketStats.spreadPips.toFixed(1)} pips</b>
            </span>
            <span className="sentiment-badge">
              Buyers: <b>{buyersPct}%</b>
            </span>
          </div>
        </div>

        <div className="chart expanded-chart">
          {/* Price Axis Labels on left */}
          <div className="chart-labels">
            {gridLevels.map((lvl, i) => (
              <span key={`grid-label-${i}`}>{lvl.toFixed(pairConfig.gridDecimals)}</span>
            ))}
            <span className="vol-axis-label">VOL</span>
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            aria-label={`Live ${timeframe} real market ${pairConfig.shortLabel} candlestick chart`}
          >
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
            <path
              className="trend-line"
              d={trendPathD}
              filter="url(#liveLineGlow)"
              stroke="#ffb600"
              strokeWidth="1.8"
              fill="none"
              opacity="0.8"
            />

            {/* Moving Average 9 EMA Curve */}
            {showIndicators && (
              <path
                className="ema-line"
                d={maPathD}
                stroke="#38bdf8"
                strokeWidth="1.8"
                fill="none"
                opacity="0.92"
              />
            )}

            {/* Volume Histogram Bars */}
            {activeCandles.map((c, index) => {
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
            {activeCandles.map((c, index) => {
              const isLast = index === activeCandles.length - 1;
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
            {activeCandles
              .filter((_, i) => i % 5 === 0 || i === activeCandles.length - 1)
              .map((c, i, arr) => {
                const origIndex = activeCandles.findIndex((item) => item.id === c.id);
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
                    {isLast ? `NOW (${timeframe})` : c.time}
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
            {currentPrice.toFixed(pairConfig.decimals)}
          </div>

          {/* Candlestick Hover Tooltip HUD */}
          {hoveredCandle && (
            <div className="candle-tooltip">
              <span>
                Time: <b>{hoveredCandle.time} ({timeframe})</b>
              </span>
              <span>O: <b>{hoveredCandle.open.toFixed(pairConfig.decimals)}</b></span>
              <span>H: <b>{hoveredCandle.high.toFixed(pairConfig.decimals)}</b></span>
              <span>L: <b>{hoveredCandle.low.toFixed(pairConfig.decimals)}</b></span>
              <span>C: <b>{hoveredCandle.close.toFixed(pairConfig.decimals)}</b></span>
              {showIndicators && (
                <span>EMA(9): <b style={{ color: "#38bdf8" }}>{hoveredCandle.ema9.toFixed(pairConfig.decimals)}</b></span>
              )}
            </div>
          )}
        </div>

        <div className="market-stats">
          <div>
            <span>24h High</span>
            <b>{marketStats.high24h.toFixed(pairConfig.decimals)}</b>
          </div>
          <div>
            <span>24h Low</span>
            <b>{marketStats.low24h.toFixed(pairConfig.decimals)}</b>
          </div>
          <div>
            <span>24h Volume</span>
            <b>
              {selectedPair === "XAU/USD"
                ? `${marketStats.volume24h.toLocaleString()} oz`
                : `${(marketStats.volume24h / 1000).toFixed(1)}K Lots`}
            </b>
          </div>
          <div>
            <span>24h Range</span>
            <b className="text-bull">Live · {volatilityPct}%</b>
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
        <i /> {selectedPair} LIVE <b>184 watching</b>
      </div>

      <div className="floating-orderflow">
        <span className="dot-pulse" />
        <div>
          <small>INSTANT EXECUTION</small>
          <b>{marketStats.spreadPips.toFixed(1)} Pip Spread · 12ms</b>
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
              <div className="status-pill"><i /> #1 FOREX ACADEMY IN AFRICA <span>ACCRA, GHANA · 1-MONTH FREE</span></div>
              <h1>Trade with skill.<br />Live with <em>freedom.</em></h1>
              <p className="hero-sub">The premier institutional Forex academy and trading company in Ghana and across Africa, led by Pastor Mike. Master price action, join live London &amp; NY trading rooms, and execute high-probability institutional setups.</p>
              <div className="hero-actions">
                <button className="button primary large rounded-pill" onClick={openRegister}>Start free this month <Icon name="arrow" /></button>
                <a className="watch-link" href="#learn"><span><Icon name="play" size={16} /></span> See how it works</a>
              </div>
              <div className="trust-row">
                <div className="avatars" aria-hidden="true">
                  <span>KM</span><span>AA</span><span>EO</span><span>+</span>
                </div>
                <div><b>Join 1,200+ traders across Ghana &amp; Africa</b><span><i>★★★★★</i> 4.9 Rating · #1 Rated Trading Company in Ghana</span></div>
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
              <p className="eyebrow">HEAD OF TRADING · ACCRA, GHANA</p>
              <h2>Built by a trader,<br />not a textbook.</h2>
              <blockquote>“I built Candlesticks Academy to bring institutional trading education to Ghana and all of Africa — with honest mentorship, live execution, and capital preservation.”</blockquote>
              <p>No shortcuts. No unrealistic promises. Just the skills, habits, and market experience you need to become a disciplined trader in Ghana, Nigeria, and worldwide.</p>
              <ul>
                <li><Icon name="check" size={16} /> Lead Mentor at Ghana&apos;s Premier Trading Company &amp; Academy</li>
                <li><Icon name="check" size={16} /> Official Exness Broker Partner across Africa (Code: 9s8109d94y)</li>
                <li><Icon name="check" size={16} /> Daily live London &amp; New York session trading execution</li>
              </ul>
              <span className="signature">Pastor Mike (Michael Kweku Essilfie) <small>FOUNDER &amp; HEAD TRADER, CANDLESTICKS ACADEMY GHANA</small></span>
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

        {/* SEO FAQ Section targeting Ghana and Africa Trading Searches */}
        <section id="faq" className="section faq-section">
          <div className="container">
            <div className="section-heading centered">
              <p className="eyebrow">FREQUENTLY ASKED QUESTIONS</p>
              <h2>The Premier Forex Academy &amp; Trading Company in Ghana</h2>
              <p>Everything you need to know about institutional Forex and Gold trading with Pastor Mike across Africa.</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4 pt-4">
              {[
                {
                  q: "What makes Candlesticks Academy the #1 Forex academy in Africa and Ghana?",
                  a: "Candlesticks Academy combines institutional price action education, daily live trading rooms during the London and New York sessions, certified progression exams, and verified multi-target signals. Unlike signal channels, Pastor Mike teaches you order flow, liquidity dynamics, and capital preservation.",
                },
                {
                  q: "Which trading companies in Ghana offer institutional mentorship and Exness benefits?",
                  a: "Candlesticks Academy is Ghana's leading Forex education and trading company, providing direct 1-on-1 mentorship, automated Exness broker copy trading, and an exclusive 1-month free trial for funded partner accounts (Partner Code: 9s8109d94y).",
                },
                {
                  q: "Can I join from outside Ghana (Nigeria, South Africa, Kenya, UK)?",
                  a: "Yes. Our academy has over 1,200 active students spanning Ghana (Accra, Kumasi, Takoradi), Nigeria (Lagos, Abuja), Kenya, South Africa, and international trading hubs. All sessions are streamed live online with full HD replays.",
                },
                {
                  q: "How do I claim the 1-Month Free Trial?",
                  a: "Create your free student account on candlesticksacademy.online, register with Exness using our official partner link, and deposit a minimum of $50 into your own trading account. Full access to courses, live sessions, and VIP signals is automatically unlocked.",
                },
              ].map((faq, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-[#131722] border border-white/10 hover:border-[#ffb600]/40 transition text-left">
                  <h3 className="text-sm sm:text-base font-bold text-white mb-2 flex items-start gap-2.5">
                    <span className="text-[#ffb600] font-mono text-xs sm:text-sm shrink-0 mt-0.5">0{idx + 1}.</span>
                    <span>{faq.q}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9aa4b5] leading-relaxed pl-6 sm:pl-7">
                    {faq.a}
                  </p>
                </div>
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
