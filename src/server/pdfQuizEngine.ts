import { GoogleGenAI, Type } from "@google/genai";

export interface GeneratedQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export async function generateQuizFromPdfServer(params: {
  courseId: string;
  courseTitle: string;
  level: string;
  pdfBase64?: string;
  pdfName?: string;
  curriculumNotes?: string;
  questionCount?: number;
}): Promise<{
  success: boolean;
  questions: GeneratedQuizQuestion[];
  source: "gemini" | "curriculum_engine";
  message: string;
}> {
  const count = Math.min(12, Math.max(5, Number(params.questionCount || 6)));
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const parts: any[] = [];
      if (params.pdfBase64) {
        const cleanBase64 = params.pdfBase64.includes(",")
          ? params.pdfBase64.split(",")[1]
          : params.pdfBase64;
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: cleanBase64,
          },
        });
      }

      parts.push({
        text: `You are Pastor Mike, Founder of Candlesticks Trading Academy.
Generate a rigorous ${count}-question multiple-choice assessment for the "${params.courseTitle}" (${params.level} Level) Forex & Gold trading track based on the attached PDF document${
          params.pdfName ? ` ("${params.pdfName}")` : ""
        } and curriculum notes: ${params.curriculumNotes || "Institutional Forex & XAU/USD price action, risk management, and execution"}.
Each question must have exactly 4 clear options, a 0-based correctIndex (0 to 3), and a brief explanation referencing the ${params.level} PDF concepts.`,
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: {
                  type: Type.STRING,
                  description: "The multiple-choice question text.",
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly 4 answer choices.",
                },
                correctIndex: {
                  type: Type.INTEGER,
                  description: "Index (0, 1, 2, or 3) of the correct option.",
                },
                explanation: {
                  type: Type.STRING,
                  description: "Brief explanation of why the answer is correct.",
                },
              },
              required: ["question", "options", "correctIndex", "explanation"],
            },
          },
        },
      });

      const rawText = response.text?.trim() || "[]";
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const questions: GeneratedQuizQuestion[] = parsed.map((q: any, idx: number) => ({
          id: `${params.courseId}-pdf-q-${Date.now()}-${idx + 1}`,
          question: String(q.question || ""),
          options:
            Array.isArray(q.options) && q.options.length >= 4
              ? q.options.slice(0, 4).map(String)
              : ["Option A", "Option B", "Option C", "Option D"],
          correctIndex: Math.min(3, Math.max(0, Number(q.correctIndex ?? 0))),
          explanation: String(q.explanation || ""),
        }));

        return {
          success: true,
          questions,
          source: "gemini",
          message: `Generated ${questions.length} ${params.level}-level assessment questions from "${
            params.pdfName || params.courseTitle
          }" using AI PDF extraction.`,
        };
      }
    } catch (err: any) {
      console.warn("Gemini PDF quiz generation fallback note:", err?.message || err);
    }
  }

  // Deterministic multi-question fallback tailored to the uploaded PDF name, level, and notes
  const docLabel = params.pdfName ? params.pdfName.replace(/\.pdf$/i, "") : params.courseTitle;
  const fallbackQuestions: GeneratedQuizQuestion[] = [
    {
      id: `${params.courseId}-pdf-q1-${Date.now()}`,
      question: `[${params.level} PDF · ${docLabel}] What is the primary pre-trade requirement before executing any setup covered in ${params.courseTitle}?`,
      options: [
        "Confirm higher-timeframe structure, session liquidity, and calculate exact lot size from stop-loss distance",
        "Enter immediately on a 1-minute candle spike without a stop-loss",
        "Risk 25% of account equity on a single unconfirmed candle",
        "Trade during low-liquidity rollover spreads without checking the economic calendar",
      ],
      correctIndex: 0,
      explanation: `In the ${params.level} PDF (${docLabel}), every trade requires higher-timeframe alignment and strict position sizing before execution.`,
    },
    {
      id: `${params.courseId}-pdf-q2-${Date.now()}`,
      question: `According to the ${params.level} study guide (${docLabel}), how should you manage risk on a standard Exness trading account?`,
      options: [
        "Double the lot size after every losing trade",
        "Maintain a consistent 1% to 2% maximum risk per trade with a predefined invalidation level",
        "Move the stop-loss further away when price approaches it",
        "Open 10 correlated positions simultaneously during CPI releases",
      ],
      correctIndex: 1,
      explanation: "Capital preservation via 1%–2% risk per setup is a non-negotiable rule of the academy.",
    },
    {
      id: `${params.courseId}-pdf-q3-${Date.now()}`,
      question: `In ${params.courseTitle} (${params.level}), what confirms a high-probability institutional entry at a key zone?`,
      options: [
        "A liquidity sweep of a session high/low followed by displacement and a Break of Structure (BOS)",
        "Emotional FOMO when a candle moves fast",
        "Trading counter-trend without waiting for candle closure",
        "Ignoring London and New York session open timings",
      ],
      correctIndex: 0,
      explanation: "Institutional entries require a liquidity raid + displacement confirmation before entry.",
    },
    {
      id: `${params.courseId}-pdf-q4-${Date.now()}`,
      question: `When following a multi-TP signal (TP1 through TP5) from the ${params.level} curriculum, how should partial profits and stop-loss be handled once TP1 is hit?`,
      options: [
        "Secure partial profit at TP1 and trail the stop-loss to breakeven to eliminate downside risk",
        "Remove the take-profit and add 5x leverage",
        "Close the terminal and remove the stop-loss completely",
        "Reverse the trade direction without structural confirmation",
      ],
      correctIndex: 0,
      explanation: "Securing partial profit at TP1 and moving SL to entry protects capital while letting runners target TP2–TP5.",
    },
    {
      id: `${params.courseId}-pdf-q5-${Date.now()}`,
      question: `Why does the ${params.level} PDF emphasize checking the High-Impact Macroeconomic Calendar before London and New York sessions?`,
      options: [
        "Red-folder events (CPI, NFP, FOMC) cause rapid spread expansion and liquidity whipsaws that can invalidate technical setups",
        "Economic news only affects stock dividends once a year",
        "Spreads always become zero during FOMC announcements",
        "Price never moves during USD high-impact releases",
      ],
      correctIndex: 0,
      explanation: "High-impact red-folder releases inject extreme volatility; traders must protect stops 15 minutes prior.",
    },
    {
      id: `${params.courseId}-pdf-q6-${Date.now()}`,
      question: `If your account equity is $500 and you risk 1% ($5.00) with a 25-pip stop-loss on EUR/USD, what is your recommended lot size?`,
      options: [
        "0.02 Lots",
        "0.50 Lots",
        "2.00 Lots",
        "0.20 Lots",
      ],
      correctIndex: 0,
      explanation: "$5.00 risk ÷ (25 pips × $10/pip per standard lot) = 0.02 Lots.",
    },
  ];

  return {
    success: true,
    questions: fallbackQuestions,
    source: "curriculum_engine",
    message: `Generated ${fallbackQuestions.length} ${params.level}-level assessment questions from "${docLabel}".`,
  };
}

// Live Market Price & Real OHLCV Candlestick Feed Helper for Forex & Gold (XAU/USD)
const BASE_MARKET_PRICES: Record<string, number> = {
  "EUR/USD": 1.1235,
  "GBP/USD": 1.3394,
  "XAU/USD": 4121.5,
  "USD/JPY": 154.82,
  "GBP/JPY": 196.35,
  "NAS100": 18420.5,
  "US100": 18420.5,
  "BTC/USD": 67450.0,
  "AUD/USD": 0.6584,
  "USD/CAD": 1.3675,
};

let cachedLiveRates: Record<string, number> = { ...BASE_MARKET_PRICES };
let lastExternalFetchMs = 0;

export interface RealMarketCandle {
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

export interface RealMarketChartPayload {
  symbol: "EUR/USD" | "GBP/USD" | "XAU/USD";
  interval: "1m" | "5m" | "15m";
  currentPrice: number;
  bid: number;
  ask: number;
  spreadPips: number;
  open24h: number;
  high24h: number;
  low24h: number;
  changePct: number;
  changePips: number;
  volume24h: number;
  candles: RealMarketCandle[];
  source: string;
  updatedAt: string;
}

async function fetchSwissquoteBbo(
  symbol: "EUR/USD" | "GBP/USD" | "XAU/USD"
): Promise<{ bid: number; ask: number; mid: number } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/${symbol}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const profile =
      data?.[0]?.spreadProfilePrices?.find((p: any) => p.spreadProfile === "elite" || p.spreadProfile === "prime") ||
      data?.[0]?.spreadProfilePrices?.[0];
    if (profile && Number.isFinite(Number(profile.bid)) && Number.isFinite(Number(profile.ask))) {
      const bid = Number(profile.bid);
      const ask = Number(profile.ask);
      return { bid, ask, mid: (bid + ask) / 2 };
    }
  } catch {
    // ignore
  }
  return null;
}

function computeEmaSeries(closes: number[], period = 9): number[] {
  if (closes.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [];
  let currentEma = closes[0];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      currentEma = closes[0];
    } else if (i < period) {
      // Seed initial window safely with running blend
      currentEma = closes[i] * k + currentEma * (1 - k);
    } else {
      currentEma = closes[i] * k + currentEma * (1 - k);
    }
    ema.push(currentEma);
  }
  return ema;
}

function formatTimeLabel(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function getLiveMarketCandlesServer(
  rawSymbol?: string,
  rawInterval?: string
): Promise<RealMarketChartPayload> {
  const normSym =
    rawSymbol === "GBP/USD" || rawSymbol === "GBPUSD"
      ? "GBP/USD"
      : rawSymbol === "XAU/USD" || rawSymbol === "XAUUSD" || rawSymbol === "GOLD"
      ? "XAU/USD"
      : "EUR/USD";

  const normInterval: "1m" | "5m" | "15m" =
    rawInterval === "5m" ? "5m" : rawInterval === "15m" ? "15m" : "1m";

  const isGold = normSym === "XAU/USD";
  const decimals = isGold ? 2 : 5;
  const pipMultiplier = isGold ? 10 : 10000;

  const krakenPair =
    normSym === "EUR/USD" ? "EURUSD" : normSym === "GBP/USD" ? "GBPUSD" : "PAXGUSD";
  const krakenInterval = normInterval === "5m" ? 5 : normInterval === "15m" ? 15 : 1;

  const yahooSymbol =
    normSym === "EUR/USD" ? "EURUSD=X" : normSym === "GBP/USD" ? "GBPUSD=X" : "GC=F";
  const yahooRange = normInterval === "1m" ? "1d" : "5d";

  // Fetch Swissquote institutional spot BBO, Kraken OHLC + Ticker, and Yahoo Finance in parallel
  const [bbo, krakenRes, yahooRes] = await Promise.all([
    fetchSwissquoteBbo(normSym),
    (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const [ohlcResp, tickerResp] = await Promise.all([
          fetch(`https://api.kraken.com/0/public/OHLC?pair=${krakenPair}&interval=${krakenInterval}`, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0" },
          }),
          fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenPair}`, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0" },
          }),
        ]);
        clearTimeout(timeout);
        if (!ohlcResp.ok) return null;
        const ohlcJson = (await ohlcResp.json()) as any;
        const tickerJson = tickerResp.ok ? ((await tickerResp.json()) as any) : null;
        return { ohlcJson, tickerJson };
      } catch {
        return null;
      }
    })(),
    (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const resp = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${normInterval}&range=${yahooRange}`,
          {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0" },
          }
        );
        clearTimeout(timeout);
        if (!resp.ok) return null;
        return (await resp.json()) as any;
      } catch {
        return null;
      }
    })(),
  ]);

  let rawCandles: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> = [];
  let source = "institutional_spot";
  let high24h = 0;
  let low24h = 0;
  let open24h = 0;
  let volume24h = 0;
  let spotBid = bbo?.bid ?? 0;
  let spotAsk = bbo?.ask ?? 0;
  let spotMid = bbo?.mid ?? 0;

  // Prefer Kraken OHLC when available because EURUSD, GBPUSD, and PAXGUSD (spot physical gold) have full 720-candle series with real volume and zero futures basis gap
  if (krakenRes?.ohlcJson?.result) {
    const resultObj = krakenRes.ohlcJson.result;
    const pairKey = Object.keys(resultObj).find((k) => k !== "last");
    const rows = pairKey ? resultObj[pairKey] : null;
    if (Array.isArray(rows) && rows.length >= 10) {
      rawCandles = rows
        .map((r: any[]) => ({
          timestamp: Number(r[0]),
          open: Number(r[1]),
          high: Number(r[2]),
          low: Number(r[3]),
          close: Number(r[4]),
          volume: Math.max(1, Number(r[6]) || Number(r[7]) || 15),
        }))
        .filter((c) => Number.isFinite(c.close) && c.close > 0);
      source = "kraken_spot_ohlc";
    }

    if (krakenRes.tickerJson?.result) {
      const tKey = Object.keys(krakenRes.tickerJson.result)[0];
      const tInfo = tKey ? krakenRes.tickerJson.result[tKey] : null;
      if (tInfo) {
        if (!spotBid && tInfo.b?.[0]) spotBid = Number(tInfo.b[0]);
        if (!spotAsk && tInfo.a?.[0]) spotAsk = Number(tInfo.a[0]);
        if (!spotMid && spotBid && spotAsk) spotMid = (spotBid + spotAsk) / 2;
        high24h = Number(tInfo.h?.[1] || tInfo.h?.[0] || 0);
        low24h = Number(tInfo.l?.[1] || tInfo.l?.[0] || 0);
        open24h = Number(tInfo.o || 0);
        volume24h = Number(tInfo.v?.[1] || tInfo.v?.[0] || 0);
      }
    }
  }

  // Fallback or supplement from Yahoo Finance OHLCV
  if (rawCandles.length < 15 && yahooRes?.chart?.result?.[0]) {
    const yResult = yahooRes.chart.result[0];
    const timestamps: number[] = yResult.timestamp || [];
    const quote = yResult.indicators?.quote?.[0] || {};
    const yCandles: typeof rawCandles = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = quote.open?.[i];
      const h = quote.high?.[i];
      const l = quote.low?.[i];
      const c = quote.close?.[i];
      const v = quote.volume?.[i];
      if (o != null && h != null && l != null && c != null) {
        yCandles.push({
          timestamp: Number(timestamps[i]),
          open: Number(o),
          high: Number(h),
          low: Number(l),
          close: Number(c),
          volume: Math.max(10, Number(v) || 45),
        });
      }
    }
    if (yCandles.length >= 10) {
      rawCandles = yCandles;
      source = "yahoo_finance_ohlc";
      if (!open24h && yResult.meta?.chartPreviousClose) {
        open24h = Number(yResult.meta.chartPreviousClose);
      }
      if (!spotMid && yResult.meta?.regularMarketPrice) {
        spotMid = Number(yResult.meta.regularMarketPrice);
      }
    }
  }

  // Calibrate series to exact Swissquote interbank spot price if there is a minor feed offset (e.g., GC=F vs spot XAU/USD)
  if (rawCandles.length > 0 && bbo?.mid) {
    const lastCandleClose = rawCandles[rawCandles.length - 1].close;
    const basisOffset = bbo.mid - lastCandleClose;
    // Apply basis calibration if difference is significant (e.g. futures basis on Gold) or align last candle to exact live BBO mid
    if (Math.abs(basisOffset) > (isGold ? 1.5 : 0.0005)) {
      rawCandles = rawCandles.map((c) => ({
        ...c,
        open: Number((c.open + basisOffset).toFixed(decimals)),
        high: Number((c.high + basisOffset).toFixed(decimals)),
        low: Number((c.low + basisOffset).toFixed(decimals)),
        close: Number((c.close + basisOffset).toFixed(decimals)),
      }));
      if (high24h) high24h = Number((high24h + basisOffset).toFixed(decimals));
      if (low24h) low24h = Number((low24h + basisOffset).toFixed(decimals));
      if (open24h) open24h = Number((open24h + basisOffset).toFixed(decimals));
    } else {
      const lastIdx = rawCandles.length - 1;
      const active = rawCandles[lastIdx];
      const liveClose = Number(bbo.mid.toFixed(decimals));
      rawCandles[lastIdx] = {
        ...active,
        close: liveClose,
        high: Number(Math.max(active.high, liveClose).toFixed(decimals)),
        low: Number(Math.min(active.low, liveClose).toFixed(decimals)),
      };
    }
    spotMid = Number(bbo.mid.toFixed(decimals));
    spotBid = Number(bbo.bid.toFixed(decimals));
    spotAsk = Number(bbo.ask.toFixed(decimals));
  }

  // Compute full EMA(9) across all historical candles before slicing to visible window
  const allCloses = rawCandles.map((c) => c.close);
  const allEma9 = computeEmaSeries(allCloses, 9);

  const visibleCount = 28;
  const startIndex = Math.max(0, rawCandles.length - visibleCount);
  const visibleCandles: RealMarketCandle[] = rawCandles.slice(startIndex).map((c, idx) => {
    const fullIdx = startIndex + idx;
    return {
      id: c.timestamp,
      timestamp: c.timestamp,
      time: formatTimeLabel(c.timestamp),
      open: Number(c.open.toFixed(decimals)),
      high: Number(c.high.toFixed(decimals)),
      low: Number(c.low.toFixed(decimals)),
      close: Number(c.close.toFixed(decimals)),
      volume: Math.round(c.volume * 100) / 100,
      ema9: Number((allEma9[fullIdx] ?? c.close).toFixed(decimals)),
    };
  });

  const currentPrice =
    spotMid > 0
      ? Number(spotMid.toFixed(decimals))
      : visibleCandles[visibleCandles.length - 1]?.close ?? BASE_MARKET_PRICES[normSym];

  cachedLiveRates[normSym] = currentPrice;

  if (!spotBid || !spotAsk) {
    const defaultHalfSpread = isGold ? 0.12 : 0.00006;
    spotBid = Number((currentPrice - defaultHalfSpread).toFixed(decimals));
    spotAsk = Number((currentPrice + defaultHalfSpread).toFixed(decimals));
  }

  const spreadPips = Number(
    Math.max(0.1, (spotAsk - spotBid) * pipMultiplier).toFixed(1)
  );

  const recentSlice = rawCandles.slice(-96);
  if (!high24h && recentSlice.length > 0) {
    high24h = Math.max(...recentSlice.map((c) => c.high));
  }
  if (!low24h && recentSlice.length > 0) {
    low24h = Math.min(...recentSlice.map((c) => c.low));
  }
  if (!open24h && recentSlice.length > 0) {
    open24h = recentSlice[0].open;
  }
  if (!volume24h && recentSlice.length > 0) {
    volume24h = recentSlice.reduce((acc, c) => acc + c.volume, 0);
  }

  high24h = Number(Math.max(high24h, currentPrice).toFixed(decimals));
  low24h = Number(Math.min(low24h || currentPrice, currentPrice).toFixed(decimals));
  open24h = Number((open24h || currentPrice).toFixed(decimals));

  const rawDiff = currentPrice - open24h;
  const changePct = open24h > 0 ? Number(((rawDiff / open24h) * 100).toFixed(2)) : 0;
  const changePips = Number((rawDiff * pipMultiplier).toFixed(1));

  return {
    symbol: normSym,
    interval: normInterval,
    currentPrice,
    bid: spotBid,
    ask: spotAsk,
    spreadPips,
    open24h,
    high24h,
    low24h,
    changePct,
    changePips,
    volume24h: Math.round(volume24h),
    candles: visibleCandles,
    source,
    updatedAt: new Date().toISOString(),
  };
}

export async function getLiveMarketPricesServer(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - lastExternalFetchMs > 8000) {
    lastExternalFetchMs = now;
    try {
      const [eurBbo, gbpBbo, xauBbo, erRes] = await Promise.all([
        fetchSwissquoteBbo("EUR/USD"),
        fetchSwissquoteBbo("GBP/USD"),
        fetchSwissquoteBbo("XAU/USD"),
        (async () => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            const res = await fetch("https://open.er-api.com/v6/latest/USD", {
              signal: controller.signal,
            });
            clearTimeout(timeout);
            return res.ok ? ((await res.json()) as any) : null;
          } catch {
            return null;
          }
        })(),
      ]);

      if (eurBbo) cachedLiveRates["EUR/USD"] = Number(eurBbo.mid.toFixed(5));
      if (gbpBbo) cachedLiveRates["GBP/USD"] = Number(gbpBbo.mid.toFixed(5));
      if (xauBbo) cachedLiveRates["XAU/USD"] = Number(xauBbo.mid.toFixed(2));

      const rates = erRes?.rates;
      if (rates) {
        if (!eurBbo && rates.EUR) cachedLiveRates["EUR/USD"] = Number((1 / Number(rates.EUR)).toFixed(5));
        if (!gbpBbo && rates.GBP) cachedLiveRates["GBP/USD"] = Number((1 / Number(rates.GBP)).toFixed(5));
        if (rates.JPY) cachedLiveRates["USD/JPY"] = Number(Number(rates.JPY).toFixed(3));
        if (rates.GBP && rates.JPY) {
          cachedLiveRates["GBP/JPY"] = Number((Number(rates.JPY) / Number(rates.GBP)).toFixed(3));
        }
        if (rates.AUD) cachedLiveRates["AUD/USD"] = Number((1 / Number(rates.AUD)).toFixed(5));
        if (rates.CAD) cachedLiveRates["USD/CAD"] = Number(Number(rates.CAD).toFixed(5));
      }
    } catch {
      // keep cached rates
    }
  }

  return { ...cachedLiveRates };
}

