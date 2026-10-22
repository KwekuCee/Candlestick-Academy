# Implementation Plan: Clean Subdomain Routing & Comprehensive Search Engine Optimization (SEO)

## Overview
This plan addresses two core requirements:
1. **Clean Subdomain Switching Without Query Strings**:
   - Homepage: `https://candlesticksacademy.online` (or `www.candlesticksacademy.online`). When navigating back to the homepage from master or student, it displays clean `candlesticksacademy.online`.
   - Master Admin: `https://master.candlesticksacademy.online/admin`. Remove the long SSO base64 string (`?ca_sso=...`) that was showing in the URL bar, and replace it with clean, seamless root-domain cookie and broadcast authentication.
   - Student Dashboard: `https://student.candlesticksacademy.online/dashboard`.
2. **Comprehensive SEO, Google Search Insights, AI Search Engine Optimization, and Analytics**:
   - Structured JSON-LD metadata (`EducationalOrganization`, `Course`, `FinancialService`, `WebSite`, `FAQPage`, `BreadcrumbList`) for Google rich snippets.
   - OpenGraph & Twitter Cards with high-resolution brand share previews.
   - Dynamic canonical links and meta tags per page.
   - Complete `sitemap.xml`, `robots.txt` (with allow rules for Googlebot, Bingbot, and AI search crawlers like GPTBot, ClaudeBot, PerplexityBot, Google-Extended), and `llms.txt` for AI search engines.
   - Google Analytics 4 (`gtag.js`) and Google Search Console verification meta tag integration with interactive Admin Settings so the user can easily update or add their official Measurement ID (`G-XXXXXXXXXX`) and Google Search verification code directly from the Admin Console.

---

## Proposed Changes

### 1. Clean Cross-Subdomain Session Sync & Routing (`/src/app/exnessStore.ts`, `/src/app/routes.tsx`)
- **Fix the Long Query String (`?ca_sso=...`)**:
  - Replace the visible URL query parameter with clean root-domain cookies (`Domain=.candlesticksacademy.online; Path=/; SameSite=Lax; Secure`).
  - Use `localStorage` + shared `.candlesticksacademy.online` cookies for persistent session authorization across `master.candlesticksacademy.online`, `student.candlesticksacademy.online`, and `candlesticksacademy.online`.
  - For any cross-origin fallback, use `window.history.replaceState` immediately before any rendering or URL flash, or use an invisible hash fragment that is stripped instantly, keeping the browser address bar 100% clean (`https://master.candlesticksacademy.online/admin` and `https://student.candlesticksacademy.online/dashboard`).
- **Domain Mappings**:
  - Main/Homepage: `candlesticksacademy.online` & `www.candlesticksacademy.online`
  - Master Admin: `master.candlesticksacademy.online`
  - Student: `student.candlesticksacademy.online`
- **Return to Homepage**:
  - All "Home", "Logo", and "Log out" navigation links on master and student domains navigate cleanly back to `https://candlesticksacademy.online` without any subdomain prefix.

### 2. SEO, Meta Tags & AI Search Optimization
- **`index.html` & `.figma/make/site.json`**:
  - Set canonical URL to `https://candlesticksacademy.online`.
  - Rich OpenGraph tags: `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, `og:locale`.
  - Twitter summary card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
  - Google Search Console verification meta tag (`google-site-verification`).
  - Mobile meta tags and Apple Touch Icon references.
- **Schema.org Structured Data (`/src/app/seoStructuredData.ts` & injected in `index.html`)**:
  - `@type: EducationalOrganization` / `FinancialService` for "Candlesticks Academy".
  - `@type: WebSite` with search potential action.
  - `@type: Course` schema for Academy course levels (Beginner, Intermediate, Essential, Advanced).
  - `@type: FAQPage` schema answering top questions for search snippets and AI answer engines.
- **Search Engine & AI Discovery Files**:
  - `/public/robots.txt`: Optimized indexing directives allowing Googlebot, Bingbot, Applebot, GPTBot, ClaudeBot, PerplexityBot, and Google-Extended, pointing to `https://candlesticksacademy.online/sitemap.xml`.
  - `/public/sitemap.xml`: Complete XML sitemap containing all indexable landing and informational routes (`/`, `/courses`, `/lessons`, `/terms`, `/privacy`, `/login`, `/register`).
  - `/public/llms.txt` & `/public/llms-full.txt`: Concise Markdown knowledge specification describing Candlesticks Academy, Pastor Mike, institutional forex & gold trading tracks, Exness partnership, and live mentorship for AI agents and search engines (ChatGPT Search, Perplexity, Gemini, Claude).

### 3. Google Analytics & Search Console Admin Settings (`/src/app/portalDataStore.ts`, `/src/app/AdminStudioPages.tsx`)
- Add an **SEO & Search Engine Analytics** card in the Admin Console:
  - Input field for **Google Analytics 4 Measurement ID** (e.g. `G-XXXXXXXXXX`).
  - Input field for **Google Search Console Verification Token** (e.g. `google-site-verification=...`).
  - Input field for **Custom Search Title & Meta Description**.
  - One-click "Save & Apply Live Tracking" button that immediately initializes Google Analytics `gtag.js` and updates the head tags.
- In `index.html` / `src/main.tsx`, load Google Analytics dynamically based on the configured ID with no console errors when unconfigured.

---

## Verification Plan

### Automated Tests & Compilation
- Run `compile_applet` to verify TypeScript and Vite build succeed with zero errors.
- Run `node` test script to verify `robots.txt`, `sitemap.xml`, and `llms.txt` exist and are valid.
- Test domain resolution and URL formatting logic for `candlesticksacademy.online`, `student.candlesticksacademy.online`, and `master.candlesticksacademy.online`.

### Manual & Behavioral Verifications
- Test student login redirect -> verifies clean domain `student.candlesticksacademy.online/dashboard` without URL query string clutter.
- Test admin login redirect -> verifies clean domain `master.candlesticksacademy.online/admin` without URL query string clutter.
- Test returning to homepage from master/student -> verifies destination is `https://candlesticksacademy.online`.
- Inspect head markup for Schema.org JSON-LD, OpenGraph tags, Google Search Console tag, and Google Analytics initialization.
