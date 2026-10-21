import React, { useEffect, useState } from "react";
import { CheckCircle2, Download, Share, Smartphone, PlusSquare, MoreVertical, X } from "lucide-react";

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
        title="Install Candlestick Academy App (Android & iOS)"
        className={
          compact
            ? "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#ffde02]/15 hover:bg-[#ffde02]/25 border border-[#ffde02]/40 text-[#ffde02] text-[11px] font-extrabold transition cursor-pointer shrink-0"
            : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffde02]/15 hover:bg-[#ffde02]/25 border border-[#ffde02]/40 text-[#ffde02] text-xs font-extrabold transition cursor-pointer shrink-0"
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
            className="w-full max-w-md rounded-2xl bg-[#131722] border border-[#ffde02]/30 p-6 shadow-2xl text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-[#9aa4b5] hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#191e2b] border border-[#ffde02]/40 flex items-center justify-center gap-1 shadow-lg shrink-0">
                <span className="w-1.5 h-4 rounded-sm bg-[#0ecb81] block" />
                <span className="w-1.5 h-6 rounded-sm bg-[#ffde02] block" />
                <span className="w-1.5 h-5 rounded-sm bg-[#ffde02] block" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffde02] block">
                  PROGRESSIVE WEB APP (PWA)
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  Install Candlestick Academy
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#9ea8b8] leading-relaxed mb-4">
              Install the official Candlestick Academy trading terminal on your phone for instant one-tap launch, full-screen mobile app view, and real-time TP alerts.
            </p>

            {/* Platform Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#0b0e14] border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setActiveTab("android")}
                className={`py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "android"
                    ? "bg-[#ffde02] text-black shadow"
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
                    ? "bg-[#ffde02] text-black shadow"
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
                    className="w-full py-3 px-4 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer mb-3"
                  >
                    <Download size={15} /> Install App Now
                  </button>
                )}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffde02]/15 text-[#ffde02] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <b className="text-white block">Open Chrome Browser Menu</b>
                    <span className="text-[#9ea8b8] text-[11px]">
                      Tap the <MoreVertical size={12} className="inline text-[#ffde02]" /> three-dots menu icon in the top-right corner of Chrome on your Android phone.
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffde02]/15 text-[#ffde02] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <b className="text-white block">Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</b>
                    <span className="text-[#9ea8b8] text-[11px]">
                      Confirm by tapping <strong className="text-[#ffde02]">Install</strong>. The Candlestick Academy app icon will appear directly in your Android app drawer.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffde02]/15 text-[#ffde02] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <b className="text-white block">Tap the Share Button in Safari</b>
                    <span className="text-[#9ea8b8] text-[11px]">
                      Open this site in <strong>Safari</strong> on your iPhone or iPad and tap the <Share size={12} className="inline text-[#ffde02]" /> <strong>Share</strong> icon at the bottom toolbar.
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffde02]/15 text-[#ffde02] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <b className="text-white block">Select &ldquo;Add to Home Screen&rdquo;</b>
                    <span className="text-[#9ea8b8] text-[11px]">
                      Scroll down the share sheet and tap <PlusSquare size={12} className="inline text-[#ffde02]" /> <strong>Add to Home Screen</strong>.
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ffde02]/15 text-[#ffde02] font-mono font-bold text-xs flex items-center justify-center shrink-0">
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
 * 3-Second Alternating 3-Candlesticks Mobile App Splash / Loading Screen
 */
export const MobileCandlestickSplash: React.FC<{
  theme?: "dark" | "light";
  onFinish: () => void;
}> = ({ theme = "dark", onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const isLight = theme === "light";

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center px-6 select-none transition-opacity duration-300 ${
        isLight ? "bg-[#f4f6fa] text-[#0f172a]" : "bg-[#0b0d12] text-white"
      }`}
    >
      {/* Subtle Ambient Glow */}
      <div className="w-64 h-64 rounded-full bg-[#ffde02]/10 blur-3xl absolute pointer-events-none" />

      {/* Three Alternating Candlesticks Animation Container */}
      <div
        className={`relative w-32 h-32 rounded-3xl flex items-center justify-center gap-4 border shadow-2xl mb-6 ${
          isLight
            ? "bg-white border-slate-200 shadow-slate-300/60"
            : "bg-[#131722]/90 border-[#ffde02]/30 shadow-black/70"
        }`}
      >
        {/* Candlestick 1: Bullish Emerald Green */}
        <div className="candlestick-loader-item candle-1 flex flex-col items-center">
          <span className="w-[2.5px] h-4 bg-[#0ecb81] rounded-full" />
          <span className="w-4 h-11 rounded-[4px] bg-gradient-to-b from-[#2ee89e] to-[#0ecb81] shadow-[0_0_12px_rgba(14,203,129,0.45)]" />
          <span className="w-[2.5px] h-4 bg-[#0ecb81] rounded-full" />
        </div>

        {/* Candlestick 2: Signature Tall Gold */}
        <div className="candlestick-loader-item candle-2 flex flex-col items-center">
          <span className="w-[2.5px] h-5 bg-[#ffde02] rounded-full" />
          <span className="w-4.5 h-14 rounded-[4px] bg-gradient-to-b from-[#fff078] via-[#ffde02] to-[#d4b200] shadow-[0_0_15px_rgba(255,222,2,0.55)]" />
          <span className="w-[2.5px] h-5 bg-[#ffde02] rounded-full" />
        </div>

        {/* Candlestick 3: Bearish / Crimson & Gold Alternating */}
        <div className="candlestick-loader-item candle-3 flex flex-col items-center">
          <span className="w-[2.5px] h-4 bg-[#f6465d] rounded-full" />
          <span className="w-4 h-10 rounded-[4px] bg-gradient-to-b from-[#ff6b81] to-[#f6465d] shadow-[0_0_12px_rgba(246,70,93,0.45)]" />
          <span className="w-[2.5px] h-4 bg-[#f6465d] rounded-full" />
        </div>
      </div>

      {/* App Title & Subtitle */}
      <div className="text-center space-y-1.5 relative">
        <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-[#d4b200] font-bold block">
          TRADING TERMINAL
        </span>
        <h2
          className={`text-xl font-extrabold tracking-tight ${
            isLight ? "text-slate-900" : "text-white"
          }`}
        >
          CANDLESTICKS ACADEMY
        </h2>
        <p className={`text-xs ${isLight ? "text-slate-500" : "text-[#8e96a2]"}`}>
          Syncing live market feeds &amp; terminal workspace...
        </p>
      </div>

      {/* 3-Second Progress Bar */}
      <div
        className={`w-48 h-1.5 rounded-full overflow-hidden mt-6 border ${
          isLight ? "bg-slate-200 border-slate-300" : "bg-white/10 border-white/10"
        }`}
      >
        <div className="h-full bg-gradient-to-r from-[#0ecb81] via-[#ffde02] to-[#ffde02] rounded-full candlestick-splash-progress" />
      </div>
    </div>
  );
};
