# EcoRoute Codebase Changes Since Thesis Draft

**Date of Comparison:** September 8, 2026 (Commit `245a2684866349b238ef955b3c0dad151cbaa353`) to `HEAD` (Present).
**Draft Submitted:** September 10, 2026.

This document outlines all changes made to the EcoRoute project since the thesis draft was submitted. All claims are verified against the repository's git history.

---

## 1. Summary of Commits by Feature Area

### Authentication
- Implemented independent sessions for admin, driver, and citizen portals using custom session cookies (`src/lib/portal.js`, `src/lib/supabaseServer.js`).
- Locked down the `/citizen` portal behind the Supabase Auth middleware guard (`src/proxy.js`).
- Created citizen login and registration pages using Supabase Auth (`src/app/login/citizen/page.jsx`, `src/app/register/citizen/page.jsx`).

### Driver Workflow
- Created an installable Driver PWA with a separate manifest (`public/manifest-driver.json`) and specific icons (`public/icons/driver-*`).
- Added a "Sunlight (Light) Theme" toggle and increased text size for better outdoor visibility in the driver dashboard (`src/app/driver/DriverShell.jsx`, `src/app/driver/layout.jsx`).
- Created a dedicated offline fallback page for the service worker (`src/app/offline/page.jsx`).

### Citizen Reporting
- Created an installable Citizen PWA with a separate manifest (`public/manifest-citizen.json`) and specific icons (`public/icons/citizen-*`).
- Updated citizen dashboard, schedule, and zones to use live database data rather than static placeholder data (`src/app/citizen/page.jsx`, `src/app/citizen/schedule/page.jsx`, `src/app/citizen/zones/page.jsx`).
- Moved the Rewards page into the citizen-protected layout structure (`src/app/citizen/rewards/page.jsx`, previously `src/app/rewards/page.jsx`).

### Admin
- Added a Super Admin management page to list, create, and delete admin users (`src/app/admin/admins/page.jsx`).
- Moved admin scripts to use environment-based credentials instead of hardcoded keys (`scripts/update-admin.mjs`).
- Replaced the hardcoded driver counts on the landing page with dynamic data (`src/app/page.js`).

### Blockchain
- Removed intrusive `alert()` and debug `console.log()` statements from the Web3 integration (`src/lib/web3.js`).
- Moved the hardcoded Treasury Wallet Address to the `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS` environment variable for `burnEcoTokens()` (`src/lib/web3.js`).

### Notifications & Telemetry
- Secured the `/api/notify` and `/api/reward-citizen` server API endpoints to enforce authentication checks before executing (`src/app/api/notify/route.js`, `src/app/api/reward-citizen/route.js`).

### UI & Other
- Added a new `InstallAppButton` component to prompt users to install the PWA (`src/components/InstallAppButton.jsx`).
- Replaced the generic favicon with a dedicated `EcoRouteLogo` component on login pages and headers (`src/components/EcoRouteLogo.jsx`).

---

## 2. New Features Added
- **Super Admin Management:** Functionality to view and delete admins via API (`src/app/api/admin/list-admins/route.js`, `src/app/api/admin/delete-admin/route.js`).
- **Citizen Authentication:** Citizens now explicitly register and login via Supabase rather than relying solely on Web3 wallets (`src/app/login/citizen/page.jsx`).
- **Server-Side Authentication Utilities:** Added `src/lib/supabaseServer.js` to handle secure server-client initialization and session validation (`getSessionUser`, `requireAdmin`).
- **Independent Portal Sessions:** Drivers, admins, and citizens can now be logged in simultaneously on the same browser using distinct cookie keys (`src/lib/portal.js`).
- **PWA Enhancements:** Separate Web App Manifests for drivers and citizens (`public/manifest-driver.json`, `public/manifest-citizen.json`), plus an offline fallback page (`src/app/offline/page.jsx`).

---

## 3. Features Changed or Reworked
- **Citizen Portal Data:** The citizen schedule, zones, and dashboard pages were refactored to fetch real data from Supabase instead of displaying hardcoded mock data (`src/app/citizen/page.jsx`, `src/app/citizen/schedule/page.jsx`, `src/app/citizen/zones/page.jsx`).
- **Middleware Guard:** `src/proxy.js` was modified to actively enforce `role === "citizen"` for all `/citizen` routes and allow `super_admin` role for `/admin` routes.
- **Smart Contract Interfacing:** The `web3.js` library now throws standard JavaScript errors instead of triggering browser `alert()` popups upon failure, and dynamically reads the treasury wallet from environment variables (`src/lib/web3.js`).
- **Rewards Page Layout:** The rewards page was relocated from `src/app/rewards/page.jsx` to `src/app/citizen/rewards/page.jsx` so it inherits the standard citizen sidebar and layout constraints.

---

## 4. Features Removed
- **Demo Driver Session:** The local-storage based `demo_driver_session` mock-login fallback was entirely removed from `src/app/login/driver/page.jsx` and `src/app/driver/page.jsx`.
- **Hardcoded Landing Page Stats:** The static numbers (e.g., "24" Active Routes, "1,204" Pickups) were removed and replaced with dynamic database fetching (`src/app/page.js`).
- **Single Global Manifest:** `public/manifest.json` was deleted in favor of role-specific manifests (`public/manifest-driver.json`, etc.).
- **Unused Components:** `src/components/RewardCard.jsx` was deleted as it was identified as dead code.

---

## 5. Database Changes
No explicit SQL schema migration files exist in the repository. However, the inferred changes to the database based on the application code include:
- **Auth Metadata Roles:** The `auth.users` table (via Supabase Auth) now heavily relies on the `raw_user_meta_data->>'role'` field containing explicit values: `"citizen"`, `"driver"`, `"admin"`, or `"super_admin"`.
- **Admin Management API Usage:** `requireAdmin({ superOnly: true })` checks are now in place, verifying the existence of the `super_admin` string in user metadata (`src/lib/supabaseServer.js`).

---

## 6. Dependency Changes
- Added `uuid` (`^14.0.2`) to `package.json` under `dependencies`.
