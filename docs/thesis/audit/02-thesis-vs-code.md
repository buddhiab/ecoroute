# Thesis Claims vs. Current Codebase

This document audits the claims made in the thesis (`docs/thesis/thesis.md`) against the actual implementation in the current `HEAD` of the codebase.

## Audit Table

| Section | Thesis says | Current code does | Status | Evidence (file path) |
| --- | --- | --- | --- | --- |
| 1.7 Scope table | Administrator authentication is Out of Scope. | Administrator authentication is implemented and protected server-side via middleware. | OUTDATED | `src/proxy.js`, `src/app/login/admin/page.jsx` |
| 1.7 Scope table | Citizen account authentication is Out of Scope. | Citizen authentication is implemented via Supabase Auth and login pages. | OUTDATED | `src/app/login/citizen/page.jsx` |
| 1.7 Scope table | Offline persistence was removed from scope. | Service worker and IndexedDB fallback are added for driver routes to support intermittent connectivity. | NEW | `public/sw.js`, `src/app/driver/page.jsx` |
| 1.8 Overview | Submitting a report prompts a MetaMask transaction in the citizen's browser. | Reward is triggered via a server route that signs the transaction using the contract owner's private key. | OUTDATED | `src/app/api/reward-citizen/route.js`, `src/app/citizen/report/page.jsx` |
| 4.4.4 Functional requirements | FR-26 (interaction counting) is not satisfied; clicks value is fixed at 1. | Clicks value is still hardcoded to 1 on route completion. | STILL TRUE | `src/app/driver/page.jsx` |
| 4.4.5 Non-functional requirements | NFR-10 (version-controlled schema) is not satisfied; no migration files exist. | Still no database migration files exist in the repository. | STILL TRUE | `/` (Project Root) |
| 4.5.1 System architecture | Describes architecture without offline capabilities or service workers. | PWA manifests and Service Worker caching implemented to support offline modes. | NEW | `public/sw.js`, `public/manifest-driver.json` |
| 4.5.2 Class and data model | `CitizenReports` columns do not include reward transaction hashes or image upload URLs. | `CitizenReports` has new columns: `user_id`, `image_url`, and `reward_tx`. Photos are uploaded to Supabase Storage. | OUTDATED | `src/app/citizen/report/page.jsx` |
| 5.4.3 Known defects | Depth of administrator route protection is unverified. | Server-side protection securely implemented via Next.js middleware routing. | FIXED | `src/proxy.js` |
| 5.4.3 Known defects | Local-storage session fallback permits partial operation without verified session. | Local-storage auth bypass removed; proper server session validation is active. | FIXED | `src/proxy.js` |
| 5.4.3 Known defects | Position updates are undebounced, causing excess network load. | Driver position is still watched continuously and updated to Supabase without debouncing logic. | STILL TRUE | `src/app/driver/tasks/page.jsx` |
| 6.4 Limitations | Database schema is not reproducible from repository artefacts. | Still no SQL migration or schema files present. | STILL TRUE | `/` (Project Root) |
| 6.6 Future work | Commit the smart contract source code. | Smart contract source (`.sol`) is still missing; only ABI remains. | STILL TRUE | `src/lib/contracts/ecoToken.js` |

## Summary Counts

- **STILL TRUE**: 5
- **OUTDATED**: 4
- **FIXED**: 2
- **NEW**: 2
- **UNVERIFIED**: 0
