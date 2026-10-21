import React, { useEffect, useState } from "react";
import { CheckCircle2, Download, Share, Smartphone, PlusSquare, MoreVertical, X } from "lucide-react";
import { LOGO_ASSETS } from "./BrandLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const ios =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const android = /android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    install,
  };
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios">(isIOS ? "ios" : "android");

  useEffect(() => {
    if (isIOS) setActiveTab("ios");
    else if (isAndroid) setActiveTab("android");
  }, [isIOS, isAndroid]);

  if (isInstalled) {
    return null;
  }

  async function handleTriggerInstall() {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleTriggerInstall()}
        title="Install Candlesticks Academy App (Android & iOS)"
        className={
          compact
            ? "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#ffb600]/15 hover:bg-[#ffb600]/25 border border-[#ffb600]/40 text-[#ffb600] text-[11px] font-extrabold transition cursor-pointer shrink-0"
            : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffb600]/15 hover:bg-[#ffb600]/25 border border-[#ffb600]/40 text-[#ffb600] text-xs font-extrabold transition cursor-pointer shrink-0"
        }
      >
        <Download size={13} />
        <span className={compact ? "hidden sm:inline" : ""}>
          {isIOS ? "Save to Home" : "Install App"}
        </span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#131722] border border-[#ffb600]/30 p-6 shadow-2xl text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#9aa4b5] hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-13 h-13 rounded-2xl bg-[#191e2b] border border-[#ffb600]/40 flex items-center justify-center p-2.5 shadow-lg shrink-0">
                <img
                  src={LOGO_ASSETS.markYellow}
                  alt="Candlesticks Academy"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb600] block">
                  PROGRESSIVE WEB APP (PWA)
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  Install Candlesticks Academy
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#9ea8b8] leading-relaxed mb-4">
              Install the official Candlesticks Academy trading terminal on your phone for instant one-tap launch, full-screen mobile app view, and real-time TP alerts.
            </p>

            {/* Platform Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#0b0e14] border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setActiveTab("android")}
                className={`py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "android"
                    ? "bg-[#ffb600] text-black shadow"
                    : "text-[#8c95a6] hover:text-white"
                }`}
              >
                <Smartphone size={14} />
                Android App
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ios")}
                className={`py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "ios"
                    ? "bg-[#ffb600] text-black shadow"
                    : "text-[#8c95a6] hover:text-white"
                }`}
              >
                <Share size={14} />
                iPhone / iPad (iOS)
              </button>
            </div>

            {activeTab === "android" ? (
              <div className="space-y-3 text-xs">
                {isInstallable && (
                  <button
                    type="button"
                    onClick={() => void install()}
                    className="w-full py-3 px-4 rounded-xl bg-[#ffb600] hover:bg-[#ffc833] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer mb-3"
                  >
                    <Download size={15} /> Install App Now
                  </button>
                )}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffb600]/15 text-[#ffb600] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <b className="text-white block">Open Chrome Browser Menu</b>
                    <span className="text-[#9ea8b8] text-[11px]">
                      Tap the <MoreVertical size={12} className="inline text-[#ffb600]" /> three-dots menu icon in the top-right corner of Chrome on your Android phone.
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffb600]/15 text-[#ffb600] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <b className="text-white block">Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</b>
                    <span className="text-[#9ea8b8] text-[11px]">
                      Confirm by tapping <strong className="text-[#ffb600]">Install</strong>. The Candlesticks Academy app icon will appear directly in your Android app drawer.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffb600]/15 text-[#ffb600] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <b className="text-white block">Tap the Share Button in Safari</b>
                    <span className="text-[#9ea8b8] text-[11px]">
                      Open this site in <strong>Safari</strong> on your iPhone or iPad and tap the <Share size={12} className="inline text-[#ffb600]" /> <strong>Share</strong> icon at the bottom toolbar.
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffb600]/15 text-[#ffb600] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <b className="text-white block">Select &ldquo;Add to Home Screen&rdquo;</b>
                    <span className="text-[#9ea8b8] text-[11px]">
                      Scroll down the share sheet and tap <PlusSquare size={12} className="inline text-[#ffb600]" /> <strong>Add to Home Screen</strong>.
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffb600]/15 text-[#ffb600] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <b className="text-white block">Tap &ldquo;Add&rdquo; in Top Right</b>
                    <span className="text-[#9ea8b8] text-[11px]">
                      Launch <strong>Candlesticks</strong> directly from your iOS Home Screen as a full-screen native app!
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} /> Works on Android &amp; iOS
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * 3-Second Opener Splash Screen featuring the Spinning Official Candlesticks Logo Mark
 */
export const MobileCandlestickSplash: React.FC<{
  theme?: "dark" | "light";
  onFinish: () => void;
}> = ({ theme = "dark", onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 3000;

    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
    }, 35);

    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 2750);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const isLight = theme === "light";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 select-none transition-opacity duration-300 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      } ${isLight ? "bg-[#f3f6fb] text-[#0f172a]" : "bg-[#0b0d12] text-white"}`}
    >
      {/* Subtle Grid & Ambient Radial Brand Gold Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: isLight
            ? "linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px)"
            : "linear-gradient(rgba(255, 182, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 182, 0, 0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="w-80 h-80 rounded-full bg-[#ffb600]/15 blur-[95px] absolute pointer-events-none" />

      {/* Spinning Official Candlesticks Logo Mark Emblem */}
      <div className="relative w-44 h-44 flex items-center justify-center mb-7">
        {/* Outer Counter-Rotating Precision Orbital Ring */}
        <svg
          className="absolute inset-0 w-full h-full candlestick-orbit-reverse"
          viewBox="0 0 180 180"
          fill="none"
        >
          <circle
            cx="90"
            cy="90"
            r="84"
            stroke="#ffb600"
            strokeOpacity={isLight ? "0.3" : "0.22"}
            strokeWidth="1.5"
            strokeDasharray="6 8"
          />
          <circle cx="90" cy="6" r="3.5" fill="#ffb600" />
          <circle cx="90" cy="174" r="3.5" fill="#ffb600" fillOpacity="0.5" />
        </svg>

        {/* Inner High-Speed Glowing Gold Arc Ring */}
        <svg
          className="absolute inset-2.5 w-[calc(100%-20px)] h-[calc(100%-20px)] candlestick-orbit-forward"
          viewBox="0 0 160 160"
          fill="none"
        >
          <defs>
            <linearGradient id="openerRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffb600" stopOpacity="1" />
              <stop offset="55%" stopColor="#ffb600" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffb600" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="80"
            cy="80"
            r="72"
            stroke="url(#openerRingGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* Center Medallion with Spinning Candlesticks Logo Mark */}
        <div
          className={`relative w-28 h-28 rounded-3xl flex items-center justify-center p-5 border shadow-2xl ${
            isLight
              ? "bg-white border-[#ffb600]/45 shadow-[0_16px_40px_rgba(255,182,0,0.2)]"
              : "bg-[#12161f]/95 border-[#ffb600]/45 shadow-[0_0_45px_rgba(255,182,0,0.25)]"
          }`}
        >
          <img
            src={isLight ? LOGO_ASSETS.markLight : LOGO_ASSETS.markYellow}
            alt="Candlesticks Academy Logo Mark"
            className="w-full h-full object-contain candlestick-logo-mark-spin select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Brand Wordmark & Status */}
      <div className="text-center space-y-2 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffb600]/15 border border-[#ffb600]/35">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb600] animate-ping" />
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#ffb600] font-extrabold">
            CANDLESTICKS ACADEMY
          </span>
        </div>
        <h2
          className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
            isLight ? "text-slate-900" : "text-white"
          }`}
        >
          Initializing Trading Terminal
        </h2>
        <p className={`text-xs ${isLight ? "text-slate-500" : "text-[#949ca8]"}`}>
          Syncing live market feeds &amp; institutional workspace...
        </p>
      </div>

      {/* 3-Second Progress Bar + Percentage Readout */}
      <div className="w-60 mt-6 relative z-10">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
          <span className={isLight ? "text-slate-500" : "text-[#8e96a2]"}>TERMINAL READY</span>
          <strong className="text-[#ffb600]">{progress}%</strong>
        </div>
        <div
          className={`w-full h-1.5 rounded-full overflow-hidden border ${
            isLight ? "bg-slate-200 border-slate-300" : "bg-white/10 border-white/10"
          }`}
        >
          <div className="h-full bg-gradient-to-r from-[#ffb600] via-[#ffc933] to-[#ffb600] rounded-full candlestick-splash-progress shadow-[0_0_12px_#ffb600]" />
        </div>
      </div>
    </div>
  );
};
