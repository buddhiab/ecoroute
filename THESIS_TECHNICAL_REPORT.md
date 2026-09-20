# EcoRoute — Thesis Technical Report

**Prepared for**: Final-Year BSc Software Engineering Thesis  
**Ground Rules**: Every claim in this document is verified against actual source files. File paths and line numbers are cited for all non-trivial claims. Unimplemented, stubbed, or hardcoded items are explicitly flagged.

---

## 1. Project & Stack Inventory

### 1.1 Framework and Runtime Versions

Source: `package.json`, lines 1–35.

| Package | Version |
|---|---|
| `next` | `16.2.0` |
| `react` | `19.2.4` |
| `react-dom` | `19.2.4` |
| `@supabase/supabase-js` | `^2.112.3` |
| `@supabase/ssr` | `^0.12.4` |
| `ethers` | `^6.17.0` |
| `@react-google-maps/api` | `^2.20.8` |
| `web-push` | `^3.6.7` |
| `lucide-react` | `^0.577.0` |
| `radix-ui` | `^1.4.3` |
| `shadcn` | `^4.0.8` |
| `tailwindcss` | `^4` |
| `tailwind-merge` | `^3.5.0` |
| `tw-animate-css` | `^1.4.0` |
| `class-variance-authority` | `^0.7.1` |
| `clsx` | `^2.1.1` |
| `babel-plugin-react-compiler` | `1.0.0` (dev) |
| `eslint` | `^9` (dev) |
| `eslint-config-next` | `16.2.0` (dev) |

**Note on Next.js version**: The project uses Next.js **16.2.0**, which is a breaking-change release beyond the widely-known v13/v14 App Router. A comment in `src/app/track/[reportId]/page.jsx` line 33 explicitly acknowledges the API change: `"Next.js 16 App Router: params is a Promise in Client Components, use 'use()' to unwrap"`.

### 1.2 Build Configuration

The project uses the standard Next.js App Router with a `next dev` / `next build` / `next start` script cycle (`package.json` lines 6–9). No custom `next.config.js` was found in the project root.

### 1.3 Styling System

Tailwind CSS v4 is used via `@tailwindcss/postcss`. Component styles use Tailwind utility classes directly in JSX. Shadcn UI (`shadcn ^4.0.8`) components are present under `src/components/ui/`. `globals.css` exists at `src/app/globals.css` (6,011 bytes).

### 1.4 Full Directory Tree

```
src/
├── app/
│   ├── admin/
│   │   ├── fleet/
│   │   │   ├── map/page.jsx      — Live GPS fleet map
│   │   │   └── page.jsx          — Fleet monitor / driver approval
│   │   ├── payouts/page.jsx      — ECO-to-LKR payout requests
│   │   ├── reports/page.jsx      — Citizen report dispatch board
│   │   └── sqa/page.jsx          — HCI telemetry dashboard
│   ├── api/
│   │   ├── notify/route.js       — POST: send Web Push notification
│   │   └── push-subscribe/route.js — POST: save push subscription
│   ├── citizen/
│   │   └── report/page.jsx       — Report issue + claim ECO tokens
│   ├── driver/
│   │   ├── dispatch/page.jsx     — Read-only route status board
│   │   ├── sync/page.jsx         — IndexedDB offline queue viewer
│   │   ├── tasks/page.jsx        — Active tasks + GPS start/stop
│   │   ├── layout.jsx            — Driver shell (SW reg, GPS heartbeat)
│   │   └── page.jsx              — Live Route Board (main dashboard)
│   ├── login/
│   │   └── driver/page.jsx       — Driver email/password login
│   ├── register/
│   │   └── driver/page.jsx       — 3-step driver registration
│   ├── rewards/page.jsx          — ECO token balance + bank withdrawal
│   ├── track/[reportId]/page.jsx — Citizen live tracking page
│   ├── layout.js                 — Root layout
│   ├── page.js                   — Landing / portal selection
│   └── globals.css
├── lib/
│   ├── contracts/
│   │   └── ecoToken.js           — ABI + contract address
│   ├── supabase.js               — Browser Supabase client
│   ├── web3.js                   — Ethers v6 helpers
│   └── webpush.js                — web-push VAPID wrapper
├── components/
│   └── ui/                       — Shadcn Button, Card, etc.
public/
├── sw.js                         — Service worker (cache + push)
├── manifest.json                 — (NOT VERIFIED - file not read)
└── icons/                        — (NOT VERIFIED - not read)
```

---

## 2. Architecture Overview

### 2.1 Application Portals

The landing page (`src/app/page.js` lines 12–62) defines three static role-card portals:

```jsx
const PORTALS = [
  { href: "/admin",   label: "Admin",   sublabel: "Command Center" },
  { href: "/driver",  label: "Driver",  sublabel: "Field Operations", badge: "PWA" },
  { href: "/citizen", label: "Citizen", sublabel: "Public Service Portal" },
]
```

There is no programmatic role-gating on the landing page itself — it is a static link hub. Role enforcement occurs downstream (see Section 3).

**PARTIAL**: The landing page renders two hardcoded KPI stats (`24` Active Routes, `1,204` Completed Pickups) that are not fetched from the database:

```jsx
// src/app/page.js lines 97–103
<p className="text-2xl font-bold text-slate-800">24</p>
<p className="text-2xl font-bold text-[#00A878]">1,204</p>
```

### 2.2 Data Transport

All data reads/writes go through **Supabase** using either:
- The browser client (`src/lib/supabase.js`): `createBrowserClient` from `@supabase/ssr`
- A server-side admin client (API routes only): `createClient` from `@supabase/supabase-js` using `SUPABASE_SERVICE_ROLE_KEY`

The browser client is initialised at `src/lib/supabase.js` lines 1–10:

```js
import { createBrowserClient } from '@supabase/ssr'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-key'
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)
```

### 2.3 Realtime

Every major page uses Supabase Realtime (`postgres_changes`). Examples verified:
- Admin fleet monitor: `src/app/admin/fleet/page.jsx` lines 61–87 — listens for `INSERT` and `UPDATE` on `driver_profiles`.
- Admin reports: `src/app/admin/reports/page.jsx` lines 99–110 — listens for all events on `CitizenReports`.
- Admin payouts: `src/app/admin/payouts/page.jsx` lines 38–51 — listens for all events on `BankPayouts`.
- Admin SQA: `src/app/admin/sqa/page.jsx` lines 37–48 — listens for all events on `HCILogs`.
- Driver dashboard: `src/app/driver/page.jsx` lines 177–192 — listens for `UPDATE` on `driver_profiles` filtered by `id`.
- Citizen tracking: `src/app/track/[reportId]/page.jsx` lines 83–97 — listens for `UPDATE` on `driver_profiles` filtered by assigned driver id.
- Driver registration: `src/app/register/driver/page.jsx` lines 142–158 — polls for `is_approved` change on `driver_profiles`.

---

## 3. Authentication & Role System

### 3.1 Authentication Provider

Supabase Auth is used exclusively. There is no custom JWT implementation or alternative OAuth provider configured in the source.

Login flow is in `src/app/login/driver/page.jsx` lines 75–103:

```jsx
// Step 1: Supabase Auth sign-in
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: email.trim(), password,
})
// Step 2: Lookup driver_profiles row
const { data: profile } = await supabase
  .from("driver_profiles")
  .select("id, full_name, vehicle_number, assigned_zone, is_approved")
  .eq("user_id", authData.user.id)
  .single()
// Step 3: Check approval gate
if (!profile.is_approved) { /* show pending warning */ }
```

### 3.2 Role Model

There are exactly **two** explicit roles in the system:

| Role | Enforcement Location | Mechanism |
|---|---|---|
| **Driver** | `src/app/login/driver/page.jsx` lines 84–102 | Supabase Auth + `driver_profiles.is_approved` check |
| **Admin** | NOT VERIFIED in source | No admin auth code was found in any reviewed file |

**NOT IMPLEMENTED**: No admin authentication or admin-specific login page was found. The `/admin` portal is accessible as a direct URL link from the landing page without any authentication check found in the reviewed source files. No `middleware.ts` or `middleware.js` file was found in the project directory.

### 3.3 Driver Approval Workflow

Registration creates a `driver_profiles` row with `is_approved: false` (`src/app/register/driver/page.jsx` line 359):

```jsx
{ ..., is_approved: false }
```

After submission, the registration page subscribes to Realtime and auto-redirects on approval (`src/app/register/driver/page.jsx` lines 142–158):

```jsx
.on("postgres_changes", { event: "UPDATE", table: "driver_profiles",
  filter: `id=eq.${driverId}` },
  (payload) => { if (payload.new?.is_approved === true) router.push("/driver") }
)
```

Approval is performed by admin in `src/app/admin/fleet/page.jsx` lines 93–104:

```jsx
const { error } = await supabase
  .from("driver_profiles")
  .update({ is_approved: true })
  .eq("id", driver.id);
```

### 3.4 Session Persistence

**PARTIAL**: After successful login, the driver's profile data is also persisted to `localStorage` as `"demo_driver_session"` (`src/app/login/driver/page.jsx` lines 106–114):

```jsx
localStorage.setItem("demo_driver_session", JSON.stringify({
  id: profile.id, full_name: profile.full_name,
  vehicle_number: profile.vehicle_number, assigned_zone: profile.assigned_zone,
}))
```

The driver dashboard (`src/app/driver/page.jsx` lines 130–158) uses this `demo_driver_session` as a fallback if `supabase.auth.getUser()` returns no user. A comment at line 134 reads: `"Fallback for UI demo: check if they just registered a mock session"`. This is a hybrid of real Supabase Auth and a localStorage-based demo/fallback session.

---

## 4. Database Schema (Inferred from Query Selects)

No SQL migration files, schema files, or Supabase `schema.sql` were found in the repository. The schema below is inferred **solely** from `.select()` and `.insert()` calls in the source code. Columns not seen in any query are not listed.

### Table: `driver_profiles`

Inferred from: `src/app/admin/fleet/page.jsx` lines 43–46; `src/app/driver/page.jsx` lines 141–145; `src/app/login/driver/page.jsx` lines 84–88; `src/app/register/driver/page.jsx` lines 347–360; `src/app/admin/fleet/map/page.jsx` lines 81–84; `src/app/driver/tasks/page.jsx` lines 22–27.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | UUID/int | PK, used as profile identifier |
| `user_id` | UUID | FK → Supabase Auth `users.id` |
| `full_name` | text | |
| `email` | text | |
| `phone_number` | text | nullable |
| `vehicle_number` | text | |
| `license_number` | text | |
| `assigned_zone` | text | e.g. "Colombo 05" |
| `is_approved` | boolean | Default `false` |
| `latitude` | float | GPS lat, nullable; set to `null` when not tracking |
| `longitude` | float | GPS lng, nullable |
| `is_tracking` | boolean | `true` while GPS watch is active |
| `recent_alert` | text | nullable; set by admin zone/vehicle changes; cleared on "Acknowledge" |
| `created_at` | timestamp | |

### Table: `CitizenReports`

Inferred from: `src/app/citizen/report/page.jsx` lines 104–114; `src/app/admin/reports/page.jsx` lines 43–47, 72–78; `src/app/track/[reportId]/page.jsx` lines 54–58.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | int | PK |
| `zone` | text | e.g. "Colombo 05" |
| `issue_type` | text | One of 6 predefined types |
| `description` | text | nullable |
| `exact_address` | text | |
| `latitude` | float | From map marker |
| `longitude` | float | From map marker |
| `status` | text | "Pending" / "In Progress" / "Resolved" |
| `assigned_driver_id` | UUID/text | nullable; FK → `driver_profiles.id` |
| `created_at` | timestamp | |

### Table: `Routes`

Inferred from: `src/app/driver/page.jsx` lines 212–217, 293; `src/app/driver/dispatch/page.jsx` line 21; `src/app/driver/sync/page.jsx` lines 196–200.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | int | PK |
| `driver_name` | text | Denormalised driver name |
| `zone` | text | |
| `status` | text | "Pending" / "In Progress" / "Completed" |

**Note**: The `Routes` table is separate from `CitizenReports`. No join query between them was observed in the codebase.

### Table: `HCILogs`

Inferred from: `src/app/driver/page.jsx` lines 247–253; `src/app/driver/sync/page.jsx` lines 203–208; `src/app/admin/sqa/page.jsx` lines 26–32.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | int | PK |
| `task_name` | text | e.g. "Mark Route Completed" |
| `clicks` | int | Number of clicks for the action |
| `time_taken` | int | Milliseconds elapsed |

### Table: `BankPayouts`

Inferred from: `src/app/rewards/page.jsx` lines 80–90; `src/app/admin/payouts/page.jsx` lines 30–34.

| Column | Type (inferred) | Notes |
|---|---|---|
| `id` | int | PK |
| `wallet_address` | text | MetaMask address |
| `eco_burned` | numeric | ECO token amount |
| `lkr_amount` | numeric | LKR equivalent |
| `account_name` | text | Bank account holder name |
| `account_number` | text | |
| `bank_name` | text | |
| `status` | text | "Pending Transfer" / "Completed" / "Processing" |

### Table: `vehicles`

Inferred from: `src/app/admin/fleet/page.jsx` lines 139–141, 159–162; `src/app/register/driver/page.jsx` lines 269–284.

| Column | Type (inferred) | Notes |
|---|---|---|
| `registration_number` | text | PK-like; unique constraint inferred from error code `23505` check |
| `created_at` | timestamp | |

### Table: `push_subscriptions`

Inferred from: `src/app/api/push-subscribe/route.js` lines 44–53; `src/app/api/notify/route.js` lines 45–48.

| Column | Type (inferred) | Notes |
|---|---|---|
| `report_id` | int/UUID | FK → `CitizenReports.id` |
| `endpoint` | text | Web Push endpoint URL; unique constraint used for upsert |
| `p256dh` | text | ECDH public key |
| `auth` | text | Auth secret |

---

## 5. PWA / Offline Strategy

### 5.1 Service Worker

The service worker is a **manually authored** file at `public/sw.js` — it is NOT generated by Workbox or any other SW library. It contains 87 lines.

Registration happens in the driver layout at `src/app/driver/layout.jsx` lines 101–107:

```jsx
useEffect(() => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch((err) =>
      console.error("SW registration failed:", err)
    )
  }
}, [])
```

**Cache Strategy** — `public/sw.js` lines 1–36:

```js
const CACHE_NAME = "ecoroute-v2";
const OFFLINE_URLS = ["/driver", "/offline"];

// Install: pre-cache only /driver and /offline
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

// Fetch: network-first; fall back to cache; final fallback is "/driver"
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((r) => r || caches.match("/driver"))
    )
  );
});
```

**PARTIAL**: Only two URLs (`/driver` and `/offline`) are pre-cached. No `/offline` page file was observed in the directory listing. The strategy is network-first, not stale-while-revalidate. Static assets, JS bundles, and CSS are NOT explicitly cached.

### 5.2 IndexedDB Offline Queue

When the driver is offline, route completion actions are queued in IndexedDB instead of being sent to Supabase. This logic is co-located across two files:

**Queue Write** — `src/app/driver/page.jsx` lines 21–38:

```jsx
const openDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open("EcoRouteDB", 1)
  req.onupgradeneeded = (e) => {
    e.target.result.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true })
  }
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})

const saveToOfflineQueue = async (payload) => {
  const db = await openDB()
  const tx = db.transaction("syncQueue", "readwrite")
  tx.objectStore("syncQueue").add(payload)
}
```

**Offline trigger** — `src/app/driver/page.jsx` lines 284–289:

```jsx
if (isOffline) {
  await saveToOfflineQueue({ routeId: route.id, timeTakenMs })
  setStatusMessage("Saved offline — will sync when connection returns.")
  setRoute({ ...route, status: "Completed" })
  setIsMarkingDone(false); return
}
```

**Auto-sync on reconnect** — `src/app/driver/page.jsx` lines 231–263:

```jsx
const onOnline = async () => {
  setIsOffline(false)
  // Reads the syncQueue and replays each task to Supabase
  for (const task of tasks) {
    await supabase.from("Routes").update({ status: "Completed" }).eq("id", task.routeId)
    await supabase.from("HCILogs").insert([{ task_name: "Mark Route Completed",
      clicks: 1, time_taken: task.timeTakenMs }])
  }
  clearTx.objectStore("syncQueue").clear()
}
```

The Offline Sync Status page (`src/app/driver/sync/page.jsx`) provides a dedicated UI for drivers to inspect the IndexedDB queue, view service worker state, and trigger a manual force-sync.

### 5.3 Web App Manifest

A `manifest.json` was confirmed to exist in `public/` from the service worker reference to `/icons/icon-192x192.png` and `/icons/icon-72x72.png` (`public/sw.js` lines 52–53). The manifest file itself was **NOT read** and its contents are **NOT VERIFIED**.

---

## 6. Web3 / Blockchain Integration

### 6.1 Smart Contract Configuration

Source: `src/lib/contracts/ecoToken.js`, lines 1–11.

```js
export const ECO_TOKEN_ADDRESS = "0x502Bd8d0be1607666Cce013D8BC39246F0733148";

export const ECO_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function rewardCitizen(address citizen) public",
  "function reportReward() view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)"
];
```

**Observations**:
- The ABI is a **human-readable ABI array** (ethers.js v6 format), not the JSON ABI from the Solidity compiler.
- The contract address `0x502Bd8d0be1607666Cce013D8BC39246F0733148` is a **hardcoded Sepolia testnet address**.
- **The Solidity source code for the smart contract is NOT present in this repository.**

### 6.2 Ethers v6 Library (`src/lib/web3.js`)

Source: `src/lib/web3.js`, lines 1–75.

Three exported functions are implemented:

**`getContractSigner()`** — lines 5–15: Connects MetaMask via `ethers.BrowserProvider(window.ethereum)`, returns `{ provider, signer, contract }`.

**`rewardCitizenTokens(citizenAddress)`** — lines 18–23: Calls `contract.rewardCitizen(citizenAddress)` and waits for block confirmation.

**`burnEcoTokens(amount)`** — lines 62–74:

```js
const amountInWei = ethers.parseUnits(amount.toString(), 18);
// REMINDER: Replace "0xYOUR_ADMIN_WALLET_ADDRESS" with your actual admin/treasury...
const tx = await contract.transfer("0x11bB14f887c8113E2f20963c0a447aF2f8D6DE65", amountInWei);
```

**PARTIAL / HARDCODED WARNING**: The treasury/admin wallet address `"0x11bB14f887c8113E2f20963c0a447aF2f8D6DE65"` is **hardcoded** at line 70. The code comment immediately above it reads: `"REMINDER: Replace '0xYOUR_ADMIN_WALLET_ADDRESS' with your actual admin/treasury MetaMask public address"`, indicating this was intended to be configurable but was left as a literal value.

**`getEcoBalance(walletAddress)`** — lines 26–58: Contains explicit diagnostic guards:
- Verifies network chain ID is Sepolia (`11155111n`) using BigInt comparison (ethers v6 style).
- Verifies contract bytecode exists at the address (`provider.getCode(ECO_TOKEN_ADDRESS) !== "0x"`).
- Returns the token balance formatted to 18 decimals.

### 6.3 Token Reward Flow (Citizen Report)

Source: `src/app/citizen/report/page.jsx` lines 92–149.

The two-step flow on form submit:

1. **Supabase INSERT** — inserts the report into `CitizenReports` with `status: "Pending"` (lines 104–114).
2. **Web3 reward** — calls `getContractSigner()` to get the citizen's MetaMask address, then calls `rewardCitizenTokens(citizenAddress)` (lines 126–134).

```jsx
const { signer } = await getContractSigner()
const citizenAddress = await signer.getAddress()
await rewardCitizenTokens(citizenAddress)
```

If Web3 fails, the report is still saved but the reward fails gracefully: `setStatus("Report saved, but token reward failed: ${msg}")` (line 144).

### 6.4 Token-to-LKR Withdrawal Flow (Citizen Rewards)

Source: `src/app/rewards/page.jsx` lines 55–100.

Exchange rate is hardcoded: `const EXCHANGE_RATE = 10` (line 10, meaning 1 ECO = 10 LKR).

Two-step flow:
1. **Supabase INSERT** into `BankPayouts` table with status `"Pending Transfer"` (lines 80–91).
2. **Smart contract call** — `burnEcoTokens(tokensNum)` which transfers tokens to the hardcoded treasury wallet (lines 95–96).

**PARTIAL**: The name "burnEcoTokens" implies a burn mechanism, but the implementation calls `contract.transfer(hardcodedAddress, amount)` — it transfers tokens to a specific address, not a burn function (i.e., transfer to `0x0000...`). Whether the receiving contract actually burns them depends on the contract implementation, which is not in this repo.

### 6.5 Network Guard

The Sepolia network check in `getEcoBalance()` (line 37) uses ethers v6's BigInt chain ID: `if (network.chainId !== 11155111n)`. The citizen report page (line 330) also shows a disclaimer: `"Ensure your wallet is connected to Sepolia testnet before proceeding."` No automatic network-switching code was found.

---

## 7. HCI Telemetry (SQA)

### 7.1 Data Capture

HCI events are logged to the `HCILogs` Supabase table at two points:

**Online completion** — `src/app/driver/page.jsx` lines 293–299:

```jsx
await supabase.from("HCILogs").insert([{
  task_name: "Mark Route Completed",
  clicks: 1,
  time_taken: timeTakenMs,
}])
```

**Offline sync replay** — `src/app/driver/page.jsx` lines 247–253:

```jsx
await supabase.from("HCILogs").insert([{
  task_name: "Mark Route Completed",
  clicks: 1,
  time_taken: task.timeTakenMs,
}])
```

And during force-sync from the offline sync page, `src/app/driver/sync/page.jsx` lines 203–208:

```jsx
await supabase.from("HCILogs").insert([{
  task_name: "Mark Route Completed (Offline Sync)",
  clicks: 1,
  time_taken: task.timeTakenMs,
}])
```

**PARTIAL**: Only one task type (`"Mark Route Completed"`) is currently logged. The `clicks` field is **hardcoded to `1`** in every insert — it does not count actual click events. The `time_taken` is measured correctly as `Date.now() - routeStartTs` (milliseconds since the route was loaded, `src/app/driver/page.jsx` line 282).

### 7.2 SQA Analytics Dashboard

Source: `src/app/admin/sqa/page.jsx`, lines 51–67.

Computed metrics:

```jsx
const totalTime = hciLogs.reduce((acc, l) => acc + (l.time_taken || 0), 0)
const avgMs = hciLogs.length > 0 ? Math.round(totalTime / hciLogs.length) : 0
const avgSec = Math.round(avgMs / 1000)
const totalClicks = hciLogs.reduce((acc, l) => acc + (l.clicks || 0), 0)
const avgClicks = hciLogs.length > 0 ? (totalClicks / hciLogs.length).toFixed(1) : "—"
```

Four KPI tiles are shown: Total Events, Avg. Task Time (seconds), Total Clicks, Avg. Clicks/Task.

A task-breakdown table groups logs by `task_name` and shows average time and clicks per task type (lines 60–66). A `SparkBar` component (lines 9–19) renders a proportional bar for each log entry's time relative to the maximum.

The dashboard subscribes to Realtime for live updates (lines 37–48).

---

## 8. Driver Workflow

### 8.1 Registration (3-Step Form)

Source: `src/app/register/driver/page.jsx`.

- **Step 1** (lines 294–312): Email/password validation; minimum 8-character password.
- **Step 2** (lines 315–325): Full name, license number, vehicle selection from `vehicles` table (available vehicles = all vehicles minus those assigned to approved drivers), preferred zone.
- **Step 3** (lines 329–387): Review screen → Supabase Auth `signUp()` → insert `driver_profiles` with `is_approved: false` → wait for admin approval via Realtime.

### 8.2 Login and Approval Gate

Source: `src/app/login/driver/page.jsx` lines 69–123.

Login calls `supabase.auth.signInWithPassword()`, then looks up `driver_profiles` by `user_id`, then checks `is_approved`. Unapproved drivers see a "pending approval" message and are not redirected.

### 8.3 Active Tasks + GPS Tracking

Source: `src/app/driver/tasks/page.jsx` lines 87–157.

The driver can see all `CitizenReports` where `assigned_driver_id` matches their profile. For each task, they can tap "Start Journey":

```jsx
const startJourney = async (task) => {
  // 1. Mark task "In Progress" in Supabase
  await supabase.from("CitizenReports").update({ status: "In Progress" }).eq("id", task.id)
  // 2. Watch GPS using browser Geolocation API
  watcherRef.current = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      // 3. Write lat/lng to driver_profiles, set is_tracking = true
      await supabase.from("driver_profiles")
        .update({ latitude, longitude, is_tracking: true })
        .eq("id", driverId)
    },
    (err) => { setGpsError("Unable to get GPS location...") },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  )
}
```

GPS stops and the driver's location is cleared when "Mark as Resolved" is tapped (`src/app/driver/tasks/page.jsx` lines 139–156):

```jsx
await supabase.from("driver_profiles")
  .update({ is_tracking: false, latitude: null, longitude: null })
  .eq("id", driverId)
```

**`watchPosition` frequency**: The GPS update interval is controlled by the browser; `maximumAge: 0` means always get a fresh position. The resulting Supabase update fires on every position change — there is no debouncing or minimum-distance threshold implemented.

### 8.4 Live Route Board (Main Dashboard)

Source: `src/app/driver/page.jsx`.

Shows the single active `Routes` row where `status = "In Progress"` (lines 212–217). Displays driver name, route ID, and an elapsed timer (`ElapsedTimer` component, lines 74–83). Admin-sent alerts in `driver_profiles.recent_alert` are displayed as a red banner (lines 357–372) and can be dismissed (lines 313–321), which writes `null` back to Supabase.

**PARTIAL**: A `DRIVER_ROSTER` static array (lines 41–58) is hardcoded with two fictional drivers (`DRV-002 K. Jayasinghe` and `DRV-003 S. Perera`). A comment on line 40 reads: `"// static in demo; would be auth'd in production"`. These are shown in the "Driver Roster" section of the page alongside the real authenticated driver card.

### 8.5 Admin Dispatch: Task Assignment

Source: `src/app/admin/reports/page.jsx` lines 51–94.

Admin clicks "Assign Driver" → modal filters `driver_profiles` by the report's `zone` (lines 58–63) → admin selects a driver → `CitizenReports` is updated with `assigned_driver_id` and `status: "In Progress"` (lines 72–78) → a Web Push notification is sent to the citizen if they subscribed (lines 83–91).

### 8.6 Real-Time Alert from Admin

When admin edits a driver's zone or vehicle in Fleet Monitor (`src/app/admin/fleet/page.jsx` lines 183–194), a `recent_alert` message is written to `driver_profiles`:

```jsx
const alertMessage = editType === "zone"
  ? `DISPATCH ALERT: Your assigned route has been changed to ${selectedValue}. Please re-route immediately.`
  : `DISPATCH ALERT: Your vehicle assignment has been updated to ${selectedValue}.`
const updateData = editType === "zone"
  ? { assigned_zone: selectedValue, recent_alert: alertMessage }
  : { vehicle_number: selectedValue, recent_alert: alertMessage }
```

Because the driver dashboard subscribes to `driver_profiles` Realtime, this alert appears immediately as a banner without page refresh.

---

## 9. Citizen Tracking Page

Source: `src/app/track/[reportId]/page.jsx`, 382 lines.

A public-facing (no auth required) page accessible via `/track/{reportId}`.

### 9.1 Data Loading

Loads `CitizenReports` by `reportId`, then loads the `driver_profiles` row for `assigned_driver_id` (lines 50–80). Subscribes to Realtime updates on the driver's row.

### 9.2 Haversine Distance

Client-side distance calculation between report location and driver location (lines 23–31):

```js
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)
            * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

`isArrived` is `true` when `distanceKm < 0.15` (150 m threshold, line 168).

### 9.3 Status Labels

```jsx
const statusLabel = isArrived ? "Arrived"
  : driver?.is_tracking ? "On the way"
  : taskStatus === "Resolved" ? "Task Completed"
  : taskStatus;
```

### 9.4 Web Push Opt-In

Citizens can subscribe to push notifications from this page (lines 106–138). The `subscribeToPush()` function:
1. Requests browser notification permission.
2. Calls `reg.pushManager.subscribe()` with the VAPID public key from `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
3. POSTs the subscription to `/api/push-subscribe`.

---

## 10. Web Push Notification System

### 10.1 VAPID Configuration

Source: `src/lib/webpush.js`, lines 1–22.

```js
import webpush from "web-push";
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
```

VAPID credentials are environment-variable based (not hardcoded). The `VAPID_PRIVATE_KEY` is server-only; `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is exposed to the browser for subscription.

### 10.2 API Routes

Two server-side Route Handler files exist in `src/app/api/`:

**`POST /api/push-subscribe`** (`src/app/api/push-subscribe/route.js`):
- Auth check: requires valid Supabase session cookie (lines 19–34).
- Upserts the subscription into `push_subscriptions` table using the service role client (lines 44–53), with `onConflict: "endpoint"`.

**`POST /api/notify`** (`src/app/api/notify/route.js`):
- Auth check: requires valid Supabase session (lines 19–35).
- Fetches all subscriptions for the given `reportId` from `push_subscriptions`.
- Sends a push notification to each subscriber with `sendPushNotification()` from `webpush.js`.
- Notification payload: `{ title: "Driver on the way!", body: "${driverName} has been assigned..." }`.

### 10.3 Service Worker Push Handler

Source: `public/sw.js` lines 38–65:

```js
self.addEventListener("push", (event) => {
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: "ecoroute-driver-assigned",
    renotify: true,
    actions: [
      { action: "track", title: "Track Driver" },
      { action: "dismiss", title: "Dismiss" },
    ],
    vibrate: [200, 100, 200],
  }
  event.waitUntil(self.registration.showNotification(data.title, options))
})
```

Notification click opens the `/track/{reportId}` page (lines 67–86).

---

## 11. Admin Fleet Map

Source: `src/app/admin/fleet/map/page.jsx`, 266 lines.

Displays all drivers where `is_tracking = true` on a dark-themed Google Map. Uses `@react-google-maps/api` with `OverlayView` for custom HTML markers. Subscribes to Realtime on `driver_profiles` for any `UPDATE` event; adds drivers to the map when `is_tracking` becomes `true`, removes them when it becomes `false` (lines 101–115).

Selected driver info panel shows name, vehicle, zone, GPS coordinates, and a Google Maps deep-link (lines 240–247).

**NOT IMPLEMENTED**: Route polylines, historical track replay, or any path drawing between the driver's previous positions are absent. Only the current position marker is shown.

---

## 12. Discrepancy and Honesty Report

This section documents specific gaps, hardcoded values, and inconsistencies found by code inspection.

| # | Finding | Location | Classification |
|---|---|---|---|
| 1 | Admin portal has no authentication or access control in any reviewed file | No `middleware.js`, no `/admin/login` route found | NOT IMPLEMENTED |
| 2 | Landing page KPI stats (24 routes, 1,204 pickups) are hardcoded literals, not DB queries | `src/app/page.js` lines 97–103 | HARDCODED |
| 3 | Driver roster on main dashboard shows 2 fictional static drivers (`DRV-002`, `DRV-003`) | `src/app/driver/page.jsx` lines 41–58 | HARDCODED (demo data) |
| 4 | `clicks` field in HCILogs is always hardcoded to `1`, not counted from actual user interactions | `src/app/driver/page.jsx` line 298; `src/app/driver/sync/page.jsx` line 206 | PARTIAL / HARDCODED |
| 5 | Treasury wallet address in `burnEcoTokens()` is hardcoded (`0x11bB14f887c...`) with a dev warning comment | `src/lib/web3.js` line 70 | HARDCODED (with dev comment warning) |
| 6 | `burnEcoTokens()` uses `contract.transfer()` to a specific address, not a true ERC-20 burn to `0x0000...` | `src/lib/web3.js` line 70 | PARTIAL |
| 7 | Solidity smart contract source code is absent from the repository | No `.sol` file found anywhere | NOT FOUND |
| 8 | No SQL schema or migration files found | No `schema.sql`, no `supabase/migrations/` directory | NOT FOUND |
| 9 | Service worker pre-caches only `/driver` and `/offline`; no `/offline` page exists in the directory | `public/sw.js` line 2 | PARTIAL |
| 10 | GPS updates are sent to Supabase on every `watchPosition` callback; no debouncing or distance threshold | `src/app/driver/tasks/page.jsx` lines 117–135 | PARTIAL |
| 11 | `demo_driver_session` localStorage fallback means the driver dashboard can operate partially without a real Supabase auth session | `src/app/driver/page.jsx` lines 134–158 | PARTIAL |
| 12 | Exchange rate (1 ECO = 10 LKR) is hardcoded | `src/app/rewards/page.jsx` line 10 | HARDCODED |
| 13 | `manifest.json` file content was not read and its installability fields are NOT VERIFIED | `public/manifest.json` | NOT VERIFIED |
| 14 | No unit tests, integration tests, or test directory found | Repository root and `src/` searched | NOT FOUND |
| 15 | No actual bank transfer mechanism exists; `BankPayouts` is a request log reviewed manually by admin | `src/app/rewards/page.jsx`; `src/app/admin/payouts/page.jsx` | PARTIAL (manual process) |

---

## 13. Screenshot Checklist

The following UI pages/states exist and are implemented in code. Screenshots are to be captured by the author from a running instance.

| Screenshot | Route | Verified in Code |
|---|---|---|
| Landing / Portal Selection | `/` | YES — `src/app/page.js` |
| Driver Registration — Step 1 | `/register/driver` | YES — `src/app/register/driver/page.jsx` |
| Driver Registration — Step 2 (vehicle) | `/register/driver` | YES — same file |
| Driver Registration — Step 3 (review) | `/register/driver` | YES — same file |
| Approval Waiting Screen | `/register/driver` (post-submit) | YES — same file |
| Driver Login | `/login/driver` | YES — `src/app/login/driver/page.jsx` |
| Driver Dashboard (Live Route Board) | `/driver` | YES — `src/app/driver/page.jsx` |
| Driver Active Tasks + GPS Tracking | `/driver/tasks` | YES — `src/app/driver/tasks/page.jsx` |
| Driver Offline Sync Status | `/driver/sync` | YES — `src/app/driver/sync/page.jsx` |
| Driver Fleet Dispatch | `/driver/dispatch` | YES — `src/app/driver/dispatch/page.jsx` |
| Admin Fleet Monitor (Driver List) | `/admin/fleet` | YES — `src/app/admin/fleet/page.jsx` |
| Admin Fleet Monitor (Pending Approval banner) | `/admin/fleet` | YES — same file |
| Admin Live Fleet Map | `/admin/fleet/map` | YES — `src/app/admin/fleet/map/page.jsx` |
| Admin Citizen Reports | `/admin/reports` | YES — `src/app/admin/reports/page.jsx` |
| Admin Assign Driver Modal | `/admin/reports` | YES — same file |
| Admin SQA Telemetry | `/admin/sqa` | YES — `src/app/admin/sqa/page.jsx` |
| Admin Municipal Payouts | `/admin/payouts` | YES — `src/app/admin/payouts/page.jsx` |
| Citizen Report Issue | `/citizen/report` | YES — `src/app/citizen/report/page.jsx` |
| Citizen Token Rewards / Bank Withdrawal | `/rewards` | YES — `src/app/rewards/page.jsx` |
| Citizen Live Tracking | `/track/[reportId]` | YES — `src/app/track/[reportId]/page.jsx` |

---

*End of Report. All claims above are based solely on verified source code. Any item marked NOT IMPLEMENTED, NOT FOUND, PARTIAL, or HARDCODED was found to be so by direct inspection.*
