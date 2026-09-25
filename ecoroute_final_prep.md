# EcoRoute — Final Preparation Report
> **Full project audit before submission/demo/viva.**
> Generated: September 23, 2026 · Based on complete code review of all portals, APIs, and infrastructure.

---

## 🗺️ Project Overview (What You Have)

EcoRoute is a full-stack Next.js 16 + Supabase + Blockchain (Sepolia) smart waste management platform with **3 portals**:

| Portal | Path | Auth | Tech |
|--------|------|------|------|
| Admin Command Center | `/admin` | Supabase Auth (role: admin/super_admin) | Realtime, SQA HCI logs |
| Driver Field App | `/driver` | Supabase Auth (role: driver) | PWA + IndexedDB offline sync |
| Citizen Public Portal | `/citizen` | Supabase Auth (role: citizen) | Web3/MetaMask, Web Push |

**Key integrated tech stack:** Next.js 16.2, Supabase (Postgres + Realtime + Auth), Ethers.js v6, ERC-20 smart contract on Sepolia, Web Push (VAPID), Google Maps API, Tailwind CSS v4, shadcn/ui, PWA service worker.

---

## 🔴 CRITICAL — Must Fix Before Demo

### 1. `src/proxy.js` — Citizen Auth Guard is DISABLED

**File:** [`proxy.js`](file:///E:/Project/ecoroute/src/proxy.js#L91-L96)

```diff
 // ── /citizen routes ──────────────────────────────────────────────────────────
 if (pathname.startsWith("/citizen")) {
-  // Citizen portal stays open for now — no Supabase auth required yet
-  // (citizens register with wallet only, not Supabase Auth)
-  return supabaseResponse;
+  if (!user) return NextResponse.redirect(new URL("/login/citizen", request.url));
+  const role = user.user_metadata?.role;
+  if (role !== "citizen") return NextResponse.redirect(new URL("/", request.url));
+  return supabaseResponse;
 }
```

> [!CAUTION]
> Right now, **anyone can access `/citizen/**` without logging in**. The citizen layout does have its own `useEffect` auth guard, but middleware-level protection is missing. A demo examiner could bypass it by disabling JavaScript.

---

### 2. Landing Page Stats Are Hardcoded / Fake

**File:** [`src/app/page.js`](file:///E:/Project/ecoroute/src/app/page.js#L97-L103)

```jsx
// ❌ CURRENT — static/fake numbers
<p className="text-2xl font-bold text-slate-800">24</p>  {/* Active Routes Today */}
<p className="text-2xl font-bold text-[#00A878]">1,204</p>  {/* Completed Pickups */}
```

**Fix:** Fetch real counts from Supabase on the server:
```jsx
// At top of page.js — make it async server component
async function getStats() {
  const { count: routeCount } = await supabase
    .from("Routes").select("*", { count: "exact", head: true }).eq("status", "In Progress")
  const { count: pickupCount } = await supabase
    .from("CitizenReports").select("*", { count: "exact", head: true }).eq("status", "Resolved")
  return { routeCount: routeCount ?? 0, pickupCount: pickupCount ?? 0 }
}
```

---

### 3. `web3.js` — Debug `console.log` + `alert()` in Production Code

**File:** [`src/lib/web3.js`](file:///E:/Project/ecoroute/src/lib/web3.js#L29-L47)

```diff
-  console.log("1. Checking balance for wallet:", walletAddress);
-  console.log("2. Using Token Contract Address:", ECO_TOKEN_ADDRESS);
-  console.log("3. Connected to Network Chain ID:", network.chainId);
-  console.error("Wrong network detected. Expected Sepolia (11155111).");
-  alert("Wrong network detected in browser! Please switch MetaMask to Sepolia.");
-  alert("No contract found at this address...");
```

Replace all `alert()` calls with proper UI state/toast notifications. Leave `console.error` for real errors only.

---

### 4. `burnEcoTokens` — Treasury Address is Hardcoded in Source

**File:** [`src/lib/web3.js`](file:///E:/Project/ecoroute/src/lib/web3.js#L70)

```diff
-  const tx = await contract.transfer("0x11bB14f887c8113E2f20963c0a447aF2f8D6DE65", amountInWei);
+  const TREASURY = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS;
+  const tx = await contract.transfer(TREASURY, amountInWei);
```

Add `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS=0x11bB14...` to `.env.local`.

---

### 5. PWA Manifest — External Hotlinked Icon (Shutterstock!)

**File:** [`public/manifest.json`](file:///E:/Project/ecoroute/public/manifest.json#L11)

```diff
- "src": "https://www.shutterstock.com/image-vector/recycle-icon-vector-logo-template-260nw-1729094776.jpg"
+ "src": "/icons/icon-192x192.png"
```

> [!CAUTION]
> This will **break the PWA install** if Shutterstock blocks the request (CORS/hotlink protection). You **must** create local icon files:
> - `public/icons/icon-72x72.png`
> - `public/icons/icon-192x192.png`
> - `public/icons/icon-512x512.png`
>
> The `sw.js` already references `/icons/icon-192x192.png` and `/icons/icon-72x72.png` — so the icons are missing from `public/icons/`.

---

### 6. `CONTRACT_OWNER_PRIVATE_KEY` Exposed in `.env.local` — Git Risk

**File:** [`.env.local`](file:///E:/Project/ecoroute/.env.local#L22)

> [!CAUTION]
> Your MetaMask **private key** and **Supabase service role key** are in `.env.local`. Before any public repo push or deployment:
> - Confirm `.env.local` is in `.gitignore` ✅ (verify it is!)
> - Never commit `.env.local` to GitHub
> - For deployment (Vercel): use Vercel Environment Variables panel

---

## 🟠 HIGH PRIORITY — Should Fix

### 7. `citizen/track/page.jsx` — Fetches ALL Reports (Not Just This User's)

**File:** [`src/app/citizen/track/page.jsx`](file:///E:/Project/ecoroute/src/app/citizen/track/page.jsx#L33-L37)

```diff
  const { data } = await supabase
    .from("CitizenReports")
    .select("id, issue_type, zone, status, assigned_driver_id, description, created_at")
+   .eq("user_id", user.id)   // ← filter by current user
    .order("id", { ascending: false })
    .limit(20);
```

Currently **all citizen reports are visible to all citizens** — a data privacy issue.

---

### 8. Driver Dashboard — Static Hardcoded `DRIVER_ROSTER` Array

**File:** [`src/app/driver/page.jsx`](file:///E:/Project/ecoroute/src/app/driver/page.jsx#L41-L58)

```js
// ❌ Static mock data — driver dashboard shows hard-coded drivers
const DRIVER_ROSTER = [
  { id: "DRV-002", name: "K. Jayasinghe", zone: "Colombo 03", ... },
  { id: "DRV-003", name: "S. Perera", zone: "Colombo 04", ... },
]
```

The lower part of the page does use real Supabase data (CitizenReports), but this static roster at the top can confuse the demo. Replace with data from `driver_profiles` table.

---

### 9. Citizen Dashboard — ZONE_SCHEDULES is Hardcoded (Not from DB)

**File:** [`src/app/citizen/page.jsx`](file:///E:/Project/ecoroute/src/app/citizen/page.jsx#L23-L28)

```js
const ZONE_SCHEDULES = {
  "Colombo 03": { nextPickup: "Tomorrow, 07:00 AM", type: "Organic", driver: "K. Jayasinghe" },
  // ...static data
}
```

The schedule works as a demo but "Driver: K. Jayasinghe" is always static regardless of actual assignment. This is acceptable for demo if explained, but should be noted.

---

### 10. `citizen/zones/page.jsx` — All Data is Hardcoded (Including Report Counts)

**File:** [`src/app/citizen/zones/page.jsx`](file:///E:/Project/ecoroute/src/app/citizen/zones/page.jsx#L15-L90)

Zones page shows `totalReports: 12`, `resolvedReports: 9` etc. as static. For a strong demo, fetch from Supabase:
```js
const { data } = await supabase
  .from("CitizenReports")
  .select("zone, status")
// Group by zone client-side or use Supabase RPC
```

---

### 11. Admin Layout — Missing `logout` Button for Admin Users

**File:** [`src/app/admin/layout.jsx`](file:///E:/Project/ecoroute/src/app/admin/layout.jsx)

The admin sidebar has no Sign Out button. An examiner may notice this compared to the citizen portal which has proper sign-out. Add:
```jsx
<button onClick={() => { supabase.auth.signOut(); router.push("/") }}>
  <LogOut /> Sign Out
</button>
```

---

### 12. `src/app/track/[reportId]` — Page May Be Empty

**File:** [`src/app/track/`](file:///E:/Project/ecoroute/src/app/track/) — only has a `[reportId]` subdirectory.

Verify this page exists and renders the Google Map with driver GPS. The citizen dashboard links to `/track/${report.id}`. If this page is incomplete, clicking "Track Live" will 404.

> [!IMPORTANT]
> Check that `src/app/track/[reportId]/page.jsx` exists and works. This is a **core feature** of the demo flow.

---

### 13. Admin Fleet Map — Verify `/admin/fleet/map` Works

**File:** [`src/app/admin/fleet/map/`](file:///E:/Project/ecoroute/src/app/admin/fleet/) has a `map` subdirectory.

Ensure the map subpage is complete and linked properly from the fleet page.

---

## 🟡 MEDIUM PRIORITY — Polish Before Demo

### 14. `schedule/page.jsx` — `NEXT_PICKUPS` Has Wrong Day Names

**File:** [`src/app/citizen/schedule/page.jsx`](file:///E:/Project/ecoroute/src/app/citizen/schedule/page.jsx#L34-L39)

```js
"Colombo 03": { label: "Tomorrow — Monday", ... },
"Colombo 04": { label: "Today — Tuesday", ... },
```

These are hardcoded with specific day names that will be **wrong on any day other than Monday/Tuesday**. Use `new Date()` to dynamically compute the next pickup day from the schedule data.

---


### 16. `next.config.mjs` — No Image Domain Configured for External Images

**File:** [`next.config.mjs`](file:///E:/Project/ecoroute/next.config.mjs)

If any `<Image>` component is used with external URLs (e.g., Supabase Storage), you need `remotePatterns`. Check if the fleet/profile pages use `<Image>`.

---### 15. Rewards Page — No Layout (No Sidebar)

**File:** [`src/app/rewards/page.jsx`](file:///E:/Project/ecoroute/src/app/rewards/page.jsx)

The `/rewards` route has no layout wrapper — it renders without the citizen sidebar. Either:
- Wrap it inside `/citizen/rewards/` so it inherits the citizen layout, **or**
- Add a standalone minimal header/footer

---


### 17. Missing `middleware.ts` / `middleware.js` — `proxy.js` Not Auto-Applied

> [!WARNING]
> Next.js middleware must be in a file called `middleware.ts` or `middleware.js` at the **root of `src/`**. Your file is named `proxy.js` and exports `proxy` — not `default`.

**Check if a `middleware.js` exists that imports from `proxy.js`:**
```bash
# Verify this file exists:
src/middleware.js  # or src/app/middleware.js
```

If it doesn't exist, **none of your auth guards are running**. Create:

```js
// src/middleware.js
export { proxy as default, config } from "./proxy.js"
```

---

### 18. `src/app/api/notify/route.js` — `createServerClient` Unused Import

**File:** [`src/app/api/notify/route.js`](file:///E:/Project/ecoroute/src/app/api/notify/route.js#L2)

```diff
 import { createClient } from "@supabase/supabase-js";
-import { createServerClient } from "@supabase/ssr";  // ← imported but unused
 import { cookies } from "next/headers";
```

Minor but will cause ESLint warnings during `npm run build`.

---

### 19. Driver Sync Page — Verify `offline` Page Exists for SW Cache

**File:** [`public/sw.js`](file:///E:/Project/ecoroute/public/sw.js#L2)

```js
const OFFLINE_URLS = ["/driver", "/offline"];
```

The service worker tries to cache `/offline` — does this page exist? If not, the PWA install will fail silently.

**Add:** `src/app/offline/page.jsx` — a simple "You are offline" page.

---

### 20. `citizen/profile/page.jsx` — `PICKUP_DAYS` Array Not Wired to Anything

**File:** [`src/app/citizen/profile/page.jsx`](file:///E:/Project/ecoroute/src/app/citizen/profile/page.jsx#L37)

```js
const PICKUP_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
```

Verify this is used in the profile form and saved to the `profiles` Supabase table properly. If the field isn't in the DB schema, it silently fails.

---

## 🟢 LOW PRIORITY — Nice to Have

### 21. Landing Page — Stats Section Could Show "Loading" State

The landing page imports `metadata` but renders as a static page with fake stats. Even adding a simple shimmer placeholder makes it look more polished.

### 22. `RewardCard.jsx` — Only Component in `/components/`

**File:** [`src/components/RewardCard.jsx`](file:///E:/Project/ecoroute/src/components/RewardCard.jsx)

Check if this component is actually used anywhere in the app. If not, it's dead code.

### 23. Admin SQA Page — Purple Color is Inconsistent

**File:** [`src/app/admin/sqa/page.jsx`](file:///E:/Project/ecoroute/src/app/admin/sqa/page.jsx#L14)

```js
className="bg-purple-400"  // ← only purple usage in entire app
```

Consider using `bg-blue-400` to stay consistent with the admin's blue palette.

### 24. `next.config.mjs` — Verify Content

Read this file to ensure `reactCompiler` and any experimental features are properly configured for the Next.js 16 + React 19 stack.

---

## ✅ What's Working Well (Do Not Break)

| Feature | Status | Notes |
|---------|--------|-------|
| Admin Auth (login/register) | ✅ | Role-based guard in middleware + login page |
| Supabase Realtime | ✅ | All 3 portals subscribe to postgres_changes |
| Admin Fleet Monitor | ✅ | Driver approval, zone assignment, vehicle CRUD |
| Admin Reports + Driver Assignment | ✅ | Assigns driver → updates status → triggers push |
| Web Push Notifications | ✅ | VAPID, push_subscriptions table, sw.js handler |
| Blockchain Reward System | ✅ | Server-side reward API (`/api/reward-citizen`), ECO balance |
| Driver GPS + IndexedDB Offline | ✅ | GPS tracking, offline queue, sync on reconnect |
| Citizen Report Form + Google Maps | ✅ | Map picker, 6 issue types, zones |
| Citizen Profile (edit + delete) | ✅ | Full CRUD profile management |
| Super Admin — Admin Management | ✅ | Create/delete admin accounts |
| PWA Manifest + Service Worker | ⚠️ | Works but icons missing (see issue #5) |
| HCI/SQA Telemetry Dashboard | ✅ | Logs clicks, time_taken, task name |
| ECO Token Payout (Bank Withdrawal) | ✅ | Burns tokens on Sepolia, logs to BankPayouts |

---

## 📋 Pre-Demo Checklist

```
Security & Auth
[ ] Confirm .env.local is in .gitignore
[ ] Enable citizen middleware guard (Issue #1)
[ ] Verify middleware.js exists and imports proxy.js (Issue #17)

Demo Integrity
[ ] Test full flow: Citizen login → Submit report → Admin assigns driver → Push notification → Citizen sees "Track Live"
[ ] Test: Driver logs in → sees assigned tasks → starts tracking → GPS updates on citizen side
[ ] Test: Admin marks report Resolved → Citizen receives ECO tokens (via /api/reward-citizen)
[ ] Test: Citizen burns ECO tokens → Bank payout created → Admin sees in Payouts

PWA / Offline
[ ] Create public/icons/ folder with icon-72x72.png, icon-192x192.png, icon-512x512.png
[ ] Fix manifest.json icon src (Issue #5)
[ ] Create src/app/offline/page.jsx (Issue #19)
[ ] Test PWA install on mobile Chrome

Code Cleanup
[ ] Remove debug console.log + alert() from web3.js (Issue #3)
[ ] Fix unused import in /api/notify/route.js (Issue #18)
[ ] Move treasury address to env variable (Issue #4)

Data Accuracy
[ ] Replace landing page fake stats with real Supabase count (Issue #2)
[ ] Filter citizen track page by user_id (Issue #7)

UI Polish
[ ] Add Sign Out button to Admin layout sidebar (Issue #11)
[ ] Verify /track/[reportId] page exists and works (Issue #12)
[ ] Verify /admin/fleet/map works (Issue #13)
[ ] Fix hardcoded "Today/Tomorrow" day labels in schedule page (Issue #14)
[ ] Wrap /rewards page in citizen layout OR give it its own header (Issue #15)
```

---

## 🗂️ File Tree Summary

```
src/
├── app/
│   ├── page.js                          ← Landing (stats are fake — fix)
│   ├── layout.js                        ← Root layout (good)
│   ├── globals.css                      ← Tailwind v4 + shadcn tokens
│   ├── admin/
│   │   ├── layout.jsx                   ← Sidebar (missing logout)
│   │   ├── page.jsx                     ← Dashboard KPIs (good)
│   │   ├── fleet/page.jsx               ← Fleet monitor (good)
│   │   ├── fleet/map/                   ← Verify map exists
│   │   ├── reports/page.jsx             ← Reports + driver assign (good)
│   │   ├── sqa/page.jsx                 ← HCI telemetry (good)
│   │   ├── payouts/page.jsx             ← Bank payouts (good)
│   │   └── admins/page.jsx              ← Super admin management (good)
│   ├── citizen/
│   │   ├── layout.jsx                   ← Auth guard + wallet (good)
│   │   ├── page.jsx                     ← Dashboard (hardcoded schedules — ok for demo)
│   │   ├── report/page.jsx              ← Report form + Google Maps (good)
│   │   ├── track/page.jsx               ← Shows ALL reports (fix user filter)
│   │   ├── schedule/page.jsx            ← Hardcoded day names (fix)
│   │   ├── zones/page.jsx               ← Static data (acceptable for demo)
│   │   ├── guide/page.jsx               ← Waste guide (good, static content)
│   │   └── profile/page.jsx             ← Full profile CRUD (good)
│   ├── driver/
│   │   ├── layout.jsx                   ← Driver profile + offline status (good)
│   │   ├── page.jsx                     ← Static roster + live tasks (fix roster)
│   │   ├── tasks/page.jsx               ← Assigned tasks + GPS (good)
│   │   ├── sync/page.jsx                ← Offline queue sync (good)
│   │   └── dispatch/page.jsx            ← Fleet routes board (good)
│   ├── rewards/page.jsx                 ← No layout wrapper (fix)
│   ├── track/[reportId]/                ← Verify this exists!
│   ├── register/                        ← citizen/admin/driver register
│   ├── login/                           ← citizen/admin/driver login
│   └── api/
│       ├── reward-citizen/route.js      ← Server-side blockchain reward (good)
│       ├── notify/route.js              ← Web Push notification (good, minor cleanup)
│       ├── push-subscribe/              ← Push subscription save
│       ├── admin/                       ← Admin CRUD APIs
│       └── citizen/delete-account/      ← Account deletion
├── components/
│   ├── RewardCard.jsx                   ← Check if used
│   └── ui/ (button, card, table)        ← shadcn components
├── lib/
│   ├── supabase.js                      ← Browser client (good)
│   ├── web3.js                          ← Ethers v6 (cleanup alerts/logs)
│   ├── webpush.js                       ← VAPID web-push sender
│   └── contracts/ecoToken.js            ← Contract address + ABI
├── proxy.js                             ← Middleware logic (citizen guard disabled!)
└── middleware.js ?                      ← VERIFY THIS EXISTS
public/
├── manifest.json                        ← Fix icon path (Shutterstock hotlink)
├── sw.js                                ← Service worker (good)
└── icons/                               ← MISSING — create this folder
```

---

## 🔑 Environment Variables Quick Reference

| Variable | Used In | Status |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Supabase | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Server APIs | ✅ Set |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Citizen report map | ✅ Set |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push subscribe | ✅ Set |
| `VAPID_PRIVATE_KEY` | Server push send | ✅ Set |
| `VAPID_EMAIL` | VAPID identity | ✅ Set |
| `CONTRACT_OWNER_PRIVATE_KEY` | `/api/reward-citizen` | ✅ Set |
| `SEPOLIA_RPC_URL` | Blockchain provider | ✅ Set |
| `NEXT_PUBLIC_ADMIN_ACCESS_CODE` | Admin register | ✅ Set |
| `NEXT_PUBLIC_SUPER_ADMIN_ACCESS_CODE` | Super admin register | ✅ Set |
| `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS` | `burnEcoTokens()` | ❌ **Missing** — add to `.env.local` |

---

*Report generated by full code review of EcoRoute workspace — E:\Project\ecoroute*
