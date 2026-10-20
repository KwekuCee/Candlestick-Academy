# Implementation Plan: Exness Onboarding, Verification & Access Gating System

Upgrade the onboarding journey, button design, broker linking, verification API handling, and content gating for **Candlesticks Academy**.

---

## User Review Required

> [!IMPORTANT]
> **Key Architectural Decisions & User Configuration:**
> 1. **"Start for free" Button Styling**: Rounded full pill (`rounded-full` / `border-radius: 9999px`) on the navigation bar, hero section, and mobile CTA while maintaining consistent brand typography and micro-interactions.
> 2. **Multi-Step Onboarding Architecture**:
>    - **Step 1 - Account Information**: Full Name, Country (with common country selector), Email, Password, and Verify Password (each password input equipped with interactive peek/hide eye toggles and matching validation).
>    - **Step 2 - Exness Status Selection**: "I already have an Exness account" vs "I need to create a new Exness account".
>    - **Step 3A (Existing Exness User)**: Interactive Step-by-Step Guide with copyable partner ID/link, pre-filled Exness Support Ticket email template, and an input to submit their Exness Trading ID or registered email.
>    - **Step 3B (New Exness User)**: Direct partner link integration with clear instructions to register, followed by the Exness Trading ID submission field.
> 3. **Content Access & Gating Hierarchy**:
>    - **Unlinked / Pending Registration**: Student dashboard displays prominent broker-linking checklist. All courses, live rooms, signals, and copy trading remain strictly locked.
>    - **Linked but Unfunded (< $50 USD)**: Shows "Partner Linked" checkmark, but displays dynamic deposit tracker (`$X / $50.00`). All courses, signals, and live rooms remain locked with an explicit unlock banner.
>    - **Funded ($50+ USD)**: Complete platform unlocked immediately.
> 4. **Exness API & Admin Panel Management**:
>    - Admin Settings panel (`/admin/settings` or integrated into `/admin/verification`) with fields for **Exness API Key**, **Exness JWT Token**, **Partner Affiliate ID/Link**, and a **Simulation Mode / Live Mode** switch.
>    - Ability for admin to test credentials, simulate deposit events for testing, and view live verification statuses.

---

## Proposed Changes

### 1. Landing Page Button Updates (`src/App.tsx`, `src/index.css`)
- Update "Start for free" buttons in navbar (`desktop-cta`, `mobile-cta`) and hero section (`Start free this month`) to have a fully rounded pill style (`border-radius: 9999px;`).
- Link both "Start for free" and "Start free this month" buttons to initiate the complete onboarding experience.

### 2. State & Storage Architecture (`src/app/exnessStore.ts`)
Create a centralized reactive state store and service layer handling:
- **Current User Profile**: Full name, email, country, Exness account number, Exness registered email, account origin (`existing` vs `new`), partner link status (`unlinked` | `pending_verification` | `verified`), and verified deposit amount (USD).
- **Exness API Configuration**: API Key, JWT Token, Partner Link URL (e.g., `https://one.exness-track.com/a/...`), Partner Code, and Simulation Mode toggle.
- **Verification Service**: Mock / Live check logic that tests whether a trading ID exists under the partner code and queries account balance / deposit history ($50 threshold).
- **Persistent Local Storage**: Sync state seamlessly across page reloads and between student view and admin console.

### 3. Comprehensive Onboarding Page (`src/app/OnboardingPage.tsx` / `PlatformPages.tsx`)
Redesign `/onboarding` (and `/register`) into a 4-stage guided flow:
- **Stage 1: Credentials & Details**
  - Full Name
  - Country selector (Ghana, Nigeria, Kenya, South Africa, UK, etc.)
  - Email address
  - Password & Verify Password with peek (eye icon) toggle buttons, match validation, and strength indicator.
- **Stage 2: Exness Account Status**
  - Choice cards: "I am new to Exness" vs "I already trade on Exness".
- **Stage 3: Linking Flow**
  - *If Existing User*: Detailed Support Ticket modal/guide explaining how to request partner re-attribution from Exness support. Include one-click copyable email template, partner code, and a submission form for Exness Trading ID / email.
  - *If New User*: Prominent "Open Exness Account" button launching the partner link in a new tab, followed by "Enter your new Exness Account ID / Email".
- **Stage 4: Verification & Deposit Prompt**
  - Immediate verification status check.
  - Instructions on making the $50 minimum deposit to activate full curriculum and signals.

### 4. Student Dashboard & Gating System (`src/app/PlatformPages.tsx`, `src/app/portal.css`)
- **Gating Guards**:
  - In `CoursesPage` & `CourseDetailPage`: Show locked status cards with padlock badge and a CTA explaining "Fund your Exness account with $50 to unlock all Academy courses".
  - In `LiveRoomPage` & `SessionSchedulePage`: Lock live session stream and waiting room with "Deposit $50 to access live trading sessions".
  - In `SignalFeedPage` & `SignalDetailPage`: Blur or overlay lock shield with "Fund your Exness account with $50 to view real-time signals & copy trading".
- **Dynamic Deposit Banner**:
  - Live status banner showing progress towards $50 (`$0.00 / $50.00` or partial deposit).
  - Button to re-verify status with Exness API.
  - Ticket status badge for existing users awaiting partner reassignment.

### 5. Admin Settings & Exness Verification Panel (`src/app/PlatformPages.tsx`)
- Add an **Exness API & Partner Settings** tab to the founder console (`/admin/verification` or `/admin/settings`):
  - Exness API Key (with peek/hide toggle)
  - Exness JWT Token (with peek/hide toggle)
  - Partner Referral Link & Partner Code
  - Live Mode vs Simulation Mode toggle
  - "Test Exness API Connection" action with live response preview.
- Enhance the Verification Queue to allow Pastor Mike to:
  - View submitted Exness account IDs and support ticket submissions.
  - Click "Check Exness API" for an instant query.
  - Manually override verification status or simulate funding for testing and customer support.

---

## Verification Plan

### Automated & Build Verification
1. Run `compile_applet` to ensure TypeScript compilation, JSX tags, and dependencies pass without errors.
2. Run `lint_applet` to check for syntax and lint cleanliness.

### User Flow & Interactive Verification
1. **Landing Page CTA**:
   - Check that "Start for free" in the navigation bar is fully rounded (`rounded-full`).
   - Check that clicking "Start for free" or "Start free this month" seamlessly navigates into the new onboarding flow.
2. **Onboarding Experience**:
   - Fill in Full Name, Country, Email, Password, and Verify Password.
   - Click peek icon on both password inputs to ensure text toggles between masked and visible.
   - Test "I already have an Exness account" -> view step-by-step Exness support ticket instructions and pre-filled email template with copy button.
   - Test "I don't have an Exness account" -> view instructions and partner link.
   - Enter trading ID (e.g. `208471945`) and proceed.
3. **Locked State Check**:
   - Check that Courses, Live Sessions, and Signals are locked until the $50 deposit is confirmed.
   - Check that the deposit progress bar reflects current deposit status.
4. **Admin Console Check**:
   - Switch to Admin console (`/admin/verification`).
   - Open API Settings, inspect API Key & JWT token inputs, toggle simulation mode.
   - Simulate a $50 deposit for the student and verify that Courses, Live Sessions, and Signals immediately unlock in the student view.
