import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { registerSW } from "virtual:pwa-register";
import { MobileCandlestickSplash } from "./PWAInstallPrompt";

if (typeof window !== "undefined") {
  registerSW({ immediate: true });
}

export default function App() {
  const [showOpener, setShowOpener] = useState<boolean>(true);
  const [openerTheme, setOpenerTheme] = useState<"dark" | "light">(() => {
    try {
      const path = window.location.pathname;
      const isPortal =
        path.startsWith("/dashboard") ||
        path.startsWith("/admin") ||
        path.startsWith("/courses") ||
        path.startsWith("/lessons") ||
        path.startsWith("/quiz") ||
        path.startsWith("/progress") ||
        path.startsWith("/sessions") ||
        path.startsWith("/trades") ||
        path.startsWith("/signals") ||
        path.startsWith("/settings");
      if (isPortal && localStorage.getItem("candlesticks_portal_theme") === "light") {
        return "light";
      }
    } catch {
      // ignore
    }
    return "dark";
  });

  useEffect(() => {
    const handleTriggerOpener = () => {
      try {
        setOpenerTheme(
          localStorage.getItem("candlesticks_portal_theme") === "light" ? "light" : "dark"
        );
      } catch {
        setOpenerTheme("dark");
      }
      setShowOpener(true);
    };
    window.addEventListener("candlesticks_trigger_opener", handleTriggerOpener);
    return () => window.removeEventListener("candlesticks_trigger_opener", handleTriggerOpener);
  }, []);

  return (
    <>
      {showOpener && (
        <MobileCandlestickSplash
          theme={openerTheme}
          onFinish={() => setShowOpener(false)}
        />
      )}
      <RouterProvider router={router} />
    </>
  );
}
