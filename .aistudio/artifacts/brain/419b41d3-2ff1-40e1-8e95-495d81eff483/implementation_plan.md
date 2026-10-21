# Username & Master Admin Authentication Plan

## 1. Overview & Goals
Upgrade the Candlesticks Academy authentication and profile system so clients can choose a unique **Username** and **Password** during **Onboarding** and manage it inside **Client Settings**, with real-time database availability feedback ("Available" vs. "Not Available"). Update the **Login Page** to authenticate using **Email or Username + Password**, and configure the **Admin Console** login with the dedicated username `master` and your custom password (`12Reason000@`).

---

## 2. Key Features & Flows

### A. Real-Time Username Availability Checker & Database Persistence
- **Format & Reserved Check:** Normalize usernames (lowercase alphanumeric + underscores/dots, 3–24 characters) and reserve `master` and `admin` exclusively for the Admin account so no client can claim them.
- **Live Availability Feedback:** As a client types a desired username in either **Onboarding** or **Client Settings**, query the Supabase `students` table and local roster in real time:
  - Show a green **Available** badge (`✓ @username is available`) when unclaimed.
  - Show a red **Not Available** badge (`✕ @username is already taken`) when claimed by another client or reserved, blocking submission until a unique username is chosen.
- **Database Sync:** Persist `username` and `password_hash` / `account_password` to the Supabase `public.students` table and local student state, and include the `ALTER TABLE public.students ADD COLUMN IF NOT EXISTS username TEXT UNIQUE` migration in the SQL Upgrade Script.

### B. Client Username & Password Setup (Onboarding + Settings)
- **Onboarding Flow (`/onboarding`):**
  - Add **Username** (with live availability status indicator) and **Password** (with show/hide toggle) fields alongside Full Name and Email in Step 1 of Onboarding so every new client creates their login credentials immediately.
- **Client Settings (`/settings`):**
  - Add a **Username & Login Password** section inside the Personal & Exness Profile card where existing or logged-in clients can claim or update their `@username` (with live availability checking excluding their own current record) and update their login password.

### C. Unified Login Page (`Email or Username` + `Password`)
- **Updated Login Form (`/login`):**
  - Change the primary input label to **Email or Username** (while still supporting Exness Account ID fallback) and require the **Password** field with a visibility toggle.
- **Master Admin Authentication:**
  - Entering username `master` (or admin email `mike.vinci77@gmail.com`) with password `12Reason000@` authenticates as Master Admin and routes directly to `/admin`.
  - If someone enters `master` with an incorrect password, display a clear authentication error and block access.
- **Client Authentication:**
  - Match the entered identifier against `email` or `username` (case-insensitive) in the Supabase `students` table, verify the client's password, load their profile session, and route to `/dashboard`.
  - Protect `/admin/*` routes with an Admin session guard so only authenticated `master` sessions can view or modify the Admin Console.
