# Candlesticks Academy — Broadcast PiP, Moolre Payments, VIP Tiers & Merch Giveaway Plan

## 1. Admin Live Broadcast Studio & Layout Updates
- **Screen Share Selection + Bottom-Left Webcam PiP (`AdminStudioPages.tsx`)**:
  - Enhance the **Share Screen & Go Live** flow so clicking **Share Screen** requests screen selection (`navigator.mediaDevices.getDisplayMedia`) while simultaneously capturing the instructor's webcam (`navigator.mediaDevices.getUserMedia`).
  - Render the shared screen boldly across the primary broadcast canvas and composite/overlay the webcam feed as a clean, square Picture-in-Picture (PiP) frame anchored in the **bottom-left corner** of the broadcast stage.
  - Provide an interactive in-app Screen & Window Source Selector fallback when running inside a restricted preview iframe so screen sharing + bottom-left webcam PiP works seamlessly in both preview and deployed environments.
  - Preserve the existing **RTMP Server / Stream Key (OBS Studio)** configuration intact.
- **Live Session Chat & Moderation Card Alignment**:
  - Update the two-column grid in the Admin Live Broadcast Studio (`items-stretch` with flex-grow message viewport) so the **Live Session Chat & Moderation** card on the right stretches down to align flush with the bottom edge of the **Edit Scheduled Live** card on the left.

## 2. Moolre Payment Gateway & 3-Tier Access Architecture
- **Moolre API Integration (`portalDataStore.ts`, `AdminStudioPages.tsx`, `PlatformPages.tsx`)**:
  - Add a **Moolre Gateway Configuration** panel in Admin Settings where you can configure your Moolre `X-API-USER`, `X-API-PUBKEY`, Moolre Account Number, Currency (`GHS` / `USD`), and exchange rate, alongside environment variable support.
  - Connect checkout flows to Moolre's Payment Link API (`POST https://api.moolre.com/embed/link`) and Mobile Money Collection API (`POST https://api.moolre.com/open/transact/payment` for MTN, Telecel, AT, and Card/Hosted link) with instant status verification.
- **1-Month Free Trial & Post-Expiry Restrictions**:
  - Every newly registered student automatically receives a **30-Day Free Trial** (`trialEndsAt` timestamp) granting full `$20/month` access.
  - Once the 30-day free trial expires (or if a student is on the unpaid expired state):
    - **Unlocked**: **Trading Signals** and **Courses (Beginner & Intermediate levels only)**.
    - **Locked behind Moolre Upgrade**: **Essential** and **Advanced** course levels, **Live Stream**, and **Market Insights**.
- **Tier 1 — $20/Month Full Access Plan (Updated from $30 to $20)**:
  - Unlocks all 4 course levels (**Beginner, Intermediate, Essential, Advanced**), **Live Stream**, **Market Insights**, and **Trading Signals**.
- **Tier 2 — $100 Permanent Access (One-Time VIP Tier)**:
  - Unlocks permanent lifetime access to all platform features plus:
    - **Copy Trading** execution on Admin-posted signals.
    - Two dedicated VIP sidebar tabs in the Student Portal: **1-on-1 Mentorship** and **Account Management**.

## 3. Separate VIP Sidebar Tabs for $100 Permanent Access Members
- **Tab 1: 1-on-1 Mentorship (`PlatformPages.tsx` & `AdminStudioPages.tsx`)**:
  - **Admin Scheduling**: In the Admin Dashboard, you can select any `$100 Permanent Access` student and schedule private 1-on-1 mentorship & live trading sessions (date, time, topic, join room/stream link).
  - **Student 1-on-1 Mentorship Hub**: Displays upcoming scheduled 1-on-1 sessions with the Master Trader, interactive live trading room access, and session notes.
- **Tab 2: Account Management & Fixed Contract Signing (`PlatformPages.tsx` & `AdminStudioPages.tsx`)**:
  - **Admin Contract Document Upload**: In the Admin Dashboard, upload a Contract Document (`.txt`, `.pdf`, `.docx`, or pasted text). The system extracts and stores the contract text as a **fixed, non-negotiable agreement**.
  - **$500 Exness Deposit Verification**: Checks that the student has a confirmed **$500+ deposit** in their Exness account (verified via Exness Partner API sync or Admin confirmation toggle).
  - **Digital Contract Review & Signature**: Once the $500 deposit is confirmed, the fixed contract unlocks for the student to read the full terms and conditions and append their **digital signature** (typed legal name + drawn/confirmed signature + timestamp).
  - **Admin Backend Handshake**: Once signed, the Admin Dashboard displays the signed contract record alongside the student's **Exness Trading ID** and a one-click action to request their trading password for account management and profit splitting.

## 4. First 20 Registrants Merch Giveaway (Post-Registration Popup Modal)
- **Post-Registration / Onboarding Merch Claim Modal (`OnboardingFlow.tsx` & `PlatformPages.tsx`)**:
  - Immediately upon completing registration/onboarding (while fewer than 20 claims have been submitted), display a celebratory **First 20 Registrants — Candlesticks & Exness Branded Merch** popup modal featuring T-shirts, Tote bags, and Caps.
  - Includes the **Merch Delivery Claim Form** capturing:
    - **Full Name**
    - **Contact / Phone Number**
    - **Delivery Location / Address**
    - **Preferred Time of Delivery**
  - Tracks remaining spots out of 20 in real time and lists all student merch claims inside the **Admin Dashboard** for delivery fulfillment.
