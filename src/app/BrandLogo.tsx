import React from "react";
import { Link } from "react-router";

// Official Candlesticks Academy Logo Assets
export const BRAND_YELLOW = "#ffb600";

export const LOGO_ASSETS = {
  // Full horizontal logos (Mark + "CANDLESTICKS ACADEMY" wordmark) — for Web & Tablet views
  fullDark: "/assets/aistudio/CA-02_8e3c67eb.png", // Yellow (#ffb600) mark + White text (for dark backgrounds)
  fullLight: "/assets/aistudio/CA-01_b99a2319.png", // Black & Yellow (#ffb600) mark + Black text (for light backgrounds)
  fullBlack: "/assets/aistudio/CA-03_5c9c26ee.png", // All Black full logo
  fullWhite: "/assets/aistudio/CA-07_995497ea.png", // All White full logo

  // Logo Mark Alone — for Mobile views, App Icons, and 3-Second Spinning Opener
  markYellow: "/assets/aistudio/CA-06_35a9dd0c.png", // All Yellow (#ffb600) mark (for dark backgrounds & opener)
  markLight: "/assets/aistudio/CA-05_66f713f0.png", // Black + Yellow (#ffb600) mark (for light backgrounds)
  markBlack: "/assets/aistudio/CA-04_8bff494a.png", // All Black mark
  markWhite: "/assets/aistudio/CA-08_31a1dd53.png", // All White mark
} as const;

export const ACTIVE_ROUTE_STORAGE_KEY = "candlesticks_active_route";

export function saveActiveRoute(routePath: string) {
  try {
    sessionStorage.setItem(ACTIVE_ROUTE_STORAGE_KEY, routePath);
    localStorage.setItem(ACTIVE_ROUTE_STORAGE_KEY, routePath);
  } catch {
    // ignore storage errors
  }
}

export function getSavedActiveRoute(): string | null {
  try {
    return (
      sessionStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY) ||
      localStorage.getItem(ACTIVE_ROUTE_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

interface BrandLogoProps {
  /** Destination route when clicked. Defaults to "/" */
  to?: string;
  /** Optional anchor href (e.g., "#top" when already on homepage) */
  href?: string;
  /** Force "mark-only", "full", or default "responsive" (mark on mobile, full logo on web & tablet) */
  variant?: "responsive" | "mark-only" | "full";
  /** Size preset to scale cleanly across navbar, sidebar, auth, and footer */
  size?: "sm" | "md" | "lg";
  /** Optional className */
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  to = "/",
  href,
  variant = "responsive",
  size = "md",
  className = "",
}) => {
  const fullHeightClass =
    size === "sm"
      ? "h-7 sm:h-7.5"
      : size === "lg"
      ? "h-9 sm:h-10 md:h-11"
      : "h-7.5 sm:h-8.5 md:h-9";

  const markHeightClass =
    size === "sm"
      ? "h-7"
      : size === "lg"
      ? "h-9"
      : "h-8";

  const handleHomeClick = () => {
    if (to === "/" || href === "#top") {
      saveActiveRoute("/");
    }
  };

  const content = (
    <span className={`brand-logo-wrap inline-flex items-center shrink-0 select-none ${className}`}>
      {variant === "mark-only" ? (
        <>
          <img
            src={LOGO_ASSETS.markYellow}
            alt="Candlesticks Academy"
            className={`brand-logo-dark-img ${markHeightClass} w-auto object-contain block`}
            draggable={false}
          />
          <img
            src={LOGO_ASSETS.markLight}
            alt="Candlesticks Academy"
            className={`brand-logo-light-img ${markHeightClass} w-auto object-contain hidden`}
            draggable={false}
          />
        </>
      ) : variant === "full" ? (
        <>
          <img
            src={LOGO_ASSETS.fullDark}
            alt="Candlesticks Academy"
            className={`brand-logo-dark-img ${fullHeightClass} w-auto object-contain block`}
            draggable={false}
          />
          <img
            src={LOGO_ASSETS.fullLight}
            alt="Candlesticks Academy"
            className={`brand-logo-light-img ${fullHeightClass} w-auto object-contain hidden`}
            draggable={false}
          />
        </>
      ) : (
        <>
          {/* Mobile View (< 640px): Logo Mark Alone */}
          <span className="inline-flex sm:hidden items-center">
            <img
              src={LOGO_ASSETS.markYellow}
              alt="Candlesticks Academy"
              className={`brand-logo-dark-img ${markHeightClass} w-auto object-contain block`}
              draggable={false}
            />
            <img
              src={LOGO_ASSETS.markLight}
              alt="Candlesticks Academy"
              className={`brand-logo-light-img ${markHeightClass} w-auto object-contain hidden`}
              draggable={false}
            />
          </span>

          {/* Web & Tablet View (>= 640px): Full Logo (Mark + Wordmark) */}
          <span className="hidden sm:inline-flex items-center">
            <img
              src={LOGO_ASSETS.fullDark}
              alt="Candlesticks Academy"
              className={`brand-logo-dark-img ${fullHeightClass} w-auto object-contain block`}
              draggable={false}
            />
            <img
              src={LOGO_ASSETS.fullLight}
              alt="Candlesticks Academy"
              className={`brand-logo-light-img ${fullHeightClass} w-auto object-contain hidden`}
              draggable={false}
            />
          </span>
        </>
      )}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={handleHomeClick}
        aria-label="Candlesticks Academy home"
        className="inline-flex items-center shrink-0"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={to}
      onClick={handleHomeClick}
      aria-label="Candlesticks Academy home"
      className="inline-flex items-center shrink-0"
    >
      {content}
    </Link>
  );
};
