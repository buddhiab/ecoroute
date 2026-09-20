# EcoRoute Thesis — Evidence Checklist

Everything the draft needs from you, in priority order. Placeholders in the thesis are marked `[FIGURE x.y: ...]`, `[TO BE COMPLETED]`, `[DATA REQUIRED]` and `[ACTION REQUIRED]` — search the document for these.

---

## PRIORITY 1 — Do these first (they block Chapter 6)

### A. Telemetry dataset — Section 6.7
Run **at least 15 route-completion trials**: roughly 10 online, 5 offline-then-reconnect.
Then export in the Supabase SQL editor:

```sql
SELECT id, task_name, clicks, time_taken,
       created_at
FROM "HCILogs"
ORDER BY id ASC;
```

Download as CSV. This fills the descriptive statistics table and Figures 6.6 and 6.7.

### B. Offline synchronisation trials — Section 6.6
**5 trials minimum.** For each: disable network → complete route → screenshot the IndexedDB entry → re-enable → screenshot the backend record. **Include one trial where you close and reopen the browser while the queue is pending** — this is the evidence for NFR-02.

### C. Blockchain verification — Section 6.5
From Sepolia Etherscan, copy: transaction hash, block number, gas used, recipient balance before and after, and a redemption transaction hash.

### D. Smart contract source — Appendix D
Retrieve the `.sol` file from Remix or from the verified source on Etherscan. **The blockchain contribution cannot be examined without this.**

### E. Functional test execution — Section 6.3
Execute T01–T10 and fill the Actual Result and Status columns. One screenshot per test.

---

## PRIORITY 2 — Diagrams you need to draw

Use draw.io, Lucidchart or PlantUML. All are referenced by number in the text.

| Figure | Type | Content |
|---|---|---|
| 1.1 | Rich picture | Admin / Driver / Citizen, Supabase, IndexedDB, Sepolia, push service and the flows between them |
| 2.1 | Conceptual map | The five literature domains from the Section 2.2 table and their relationships |
| 3.1 | Gantt chart | The Section 3.8 timeline |
| 4.1 | Use case diagram | 3 actors + Sepolia as external actor; use cases listed in 4.4.1 |
| 4.2 | Class / ER diagram | The 7 tables in 4.4.3 with relationships |
| 4.3 | Activity diagram | Offline route completion and sync (decision node on connectivity state) |
| 4.4 | Activity diagram | Citizen report + token reward (with the failure branch) |
| 4.5 | Sequence diagram | Offline completion → IndexedDB → reconnect → replay |
| 4.6 | Sequence diagram | Citizen → Supabase → wallet → contract → confirmation |
| 4.7 | Sequence diagram | Driver registration → admin approval → realtime redirect |
| 4.8 | Deployment diagram | Browser clients, Next.js, Supabase, Sepolia, push service |
| 4.9 | Architecture diagram | The five layers described in 4.5 |

---

## PRIORITY 3 — Screenshots

| Figure | Route | What to show |
|---|---|---|
| 4.10 | `/` | Landing page with three role portals |
| 4.11 | `/register/driver` | Registration form (any step) |
| 4.12 | `/admin/fleet` | Fleet monitor with a pending-approval banner visible |
| 4.13 | `/citizen/report` | Report submission form |
| 5.1 | `/driver` | **Offline confirmation message showing** — turn network off first |
| 5.2 | `/driver/sync` | Pending queue + service worker state |
| 5.3 | `/citizen/report` | Submission with MetaMask confirmation dialog visible |
| 5.4 | `/rewards` | Token balance and payout request form |
| 5.5 | `/admin/fleet/map` | Live map with at least one active driver marker |
| 5.6 | `/track/{id}` | Citizen tracking with distance and status label |
| 5.7 | `/admin/sqa` | SQA dashboard with **multiple** telemetry records |
| 5.8 | IDE | Project source structure |
| 5.9 | DevTools → Application | Service worker registered + cache storage contents |
| 5.10 | DevTools → Application → IndexedDB | `EcoRouteDB` → `syncQueue` with a pending record |
| 5.11 | Sepolia Etherscan | Confirmed transaction |
| 6.1 | Supabase | `driver_profiles` showing approval state |
| 6.2 | Supabase | `CitizenReports` with submitted and assigned rows |
| 6.3 | Supabase | `HCILogs` with accumulated records |
| 6.4 | Supabase | `BankPayouts` with a request |
| 6.5 | Etherscan | Transaction detail |

**Before capturing:** the landing page KPIs (24 / 1,204) and the two fictional roster drivers are hardcoded. Either remove them or make sure they're outside the frame — otherwise fake numbers appear in your thesis as evidence.

---

## PRIORITY 4 — Code fixes worth doing if time allows

1. **Admin authentication** — the draft declares this as unsatisfied (FR-32, NFR-08). Fixing it lets you flip those rows to Implemented.
2. **Click counter** — a `useRef` incremented in the handler. Fixes FR-26 and restores a telemetry dimension.
3. **Create `/offline` page** — the service worker pre-caches it but it doesn't exist.
4. **Remove `demo_driver_session` fallback.**

---

## PRIORITY 5 — Document finishing

- Apply your faculty template (font, spacing, margins, page numbers).
- Insert the TOC, List of Figures and List of Tables via Word's References tab — headings already use built-in styles.
- Add captions under each figure so the List of Figures populates.
- Add 3–5 recent references for IndexedDB patterns, ERC-20 incentive design, and BaaS architectures. **Find these yourself — do not invent citations.**
- Update the abstract's `[DATA REQUIRED]` line once you have the telemetry numbers.
