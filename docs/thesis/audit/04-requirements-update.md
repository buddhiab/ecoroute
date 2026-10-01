# Requirements Update & Audit

This document provides an updated view of the Functional and Non-functional Requirements, Traceability Matrix, and Data Model, reflecting the current state of the EcoRoute codebase as compared to the original thesis specifications.

## 1. Functional Requirements (FR)

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| FR-01 | The system shall allow a driver to register by providing account credentials, personal details, licence number, vehicle selection and preferred zone | High | Implemented |
| FR-02 | The system shall create driver accounts in an unapproved state and prevent operational access until approved | High | Implemented |
| FR-03 | The system shall allow an administrator to approve or reject pending driver registrations | High | Implemented |
| FR-04 | The system shall transition an approved driver's registration screen automatically upon approval without requiring refresh | High | Implemented |
| FR-05 | The system shall authenticate drivers using email and password credentials | High | Implemented |
| FR-06 | The system shall prevent a vehicle already assigned to an approved driver from being selected during registration | Medium | Implemented |
| FR-07 | The system shall allow a citizen to view collection schedules by zone | High | Implemented |
| FR-08 | The system shall allow a citizen to submit an issue report with type, description and geographic location | High | Implemented |
| FR-09 | The system shall persist citizen reports with an initial status of Pending | High | Implemented |
| FR-10 | The system shall issue an ERC-20 token reward to the citizen's connected wallet upon report submission | High | Implemented |
| FR-11 | The system shall preserve the submitted report if the token reward transaction fails, and inform the citizen of the failure reason | High | Implemented |
| FR-12 | The system shall verify that the connected wallet is on the Sepolia network before executing blockchain operations | Medium | Implemented |
| FR-13 | The system shall allow an administrator to view all citizen reports and assign a report to an approved driver within the report's zone | High | Implemented |
| FR-14 | The system shall allow a driver to view reports assigned to them | High | Implemented |
| FR-15 | The system shall capture the driver's geographic position continuously while a journey is active and store it against the driver profile | High | Implemented |
| FR-16 | The system shall clear the driver's stored position and tracking flag when the task is resolved | High | Implemented |
| FR-17 | The system shall display all actively tracking drivers on a map to the administrator, updating in real time | High | Implemented |
| FR-18 | The system shall allow a citizen to view the assigned driver's live position and the distance from the reported location | High | Implemented |
| FR-19 | The system shall indicate arrival when the driver is within 150 metres of the reported location | Medium | Implemented |
| FR-20 | The system shall allow a citizen to subscribe to push notifications for a report and shall notify the citizen when a driver is assigned | Medium | Implemented |
| FR-21 | The system shall allow a driver to mark a route complete, updating the route status and recording a telemetry entry | High | Implemented |
| FR-25 | The system shall record the elapsed duration of each route completion task | High | Implemented |
| FR-26 | The system shall record the number of interaction events for each route completion task | Medium | Not satisfied |
| FR-27 | The system shall present aggregate telemetry statistics to the administrator, updating in real time | High | Implemented |
| FR-28 | The system shall allow an administrator to change a driver's assigned zone or vehicle and shall deliver an alert to that driver without refresh | Medium | Implemented |
| FR-29 | The system shall allow a citizen to request conversion of held tokens to Sri Lankan Rupees by submitting bank details | Medium | Implemented |
| FR-30 | The system shall execute an on-chain token transfer when a payout is requested and record the request for administrator review | Medium | Implemented |
| FR-31 | The system shall allow an administrator to review and process pending payout requests | Medium | Implemented |
| FR-32 | The system shall restrict administrative functions to authenticated administrators | High | Implemented |
| FR-33 | The system shall provide offline persistence and background syncing for driver route completion | High | Implemented |
| FR-34 | The system shall allow citizens to attach photographic evidence to issue reports | Medium | Implemented |
| FR-35 | The system shall provide distinct authenticated portal sessions for different user roles | High | Implemented |
| FR-36 | The system shall allow a Super Administrator to manage other administrator accounts | Low | Implemented |

**Verification File Paths:**
- **FR-26**: `src/app/driver/page.jsx` (Clicks value is still hardcoded to 1 rather than counted).
- **FR-32**: `src/proxy.js`, `src/app/login/admin/page.jsx` (Server-side protection securely implemented via Next.js middleware routing).
- **FR-33**: `public/sw.js`, `src/app/driver/page.jsx` (Service worker and IndexedDB fallback for offline mode).
- **FR-34**: `src/app/citizen/report/page.jsx` (Photos uploaded to Supabase Storage).
- **FR-35**: `src/lib/portal.js` (Role-specific session handling).
- **FR-36**: `src/app/admin/admins/page.jsx` (Super Admin interface for admin management).

---

## 2. Non-functional Requirements (NFR)

| ID | Category | Requirement | Status |
| --- | --- | --- | --- |
| NFR-01 | Responsiveness | State changes shall propagate to every subscribed interface within a few seconds without manual refresh | Satisfied |
| NFR-02 | Responsiveness | Position updates shall be transmitted efficiently without unnecessary network traffic | Partially satisfied — no debouncing applied |
| NFR-03 | Usability | The driver interface shall present the primary completion action without requiring navigation beyond the initial screen | Satisfied |
| NFR-04 | Usability | The system shall provide explicit confirmation for every state-changing action | Satisfied |
| NFR-05 | Security | Driver accounts shall be authenticated and unapproved accounts shall not gain operational access | Satisfied |
| NFR-06 | Security | Administrative functions shall be protected from unauthenticated access | Satisfied |
| NFR-07 | Security | Privileged backend credentials shall not be exposed to the browser | Satisfied |
| NFR-08 | Integrity | Blockchain operations shall be prevented on networks other than the intended test network | Satisfied |
| NFR-09 | Integrity | Failure of the incentive mechanism shall not cause loss of the citizen's report | Satisfied |
| NFR-10 | Maintainability | The database schema shall be version-controlled and reproducible | Not satisfied — no migration files exist |
| NFR-11 | Portability | The system shall operate on standard mobile and desktop browsers without native installation | Satisfied |
| NFR-12 | Testability | Task performance shall be measurable from data generated by the system in normal operation | Satisfied |

**Verification File Paths:**
- **NFR-02**: `src/app/driver/tasks/page.jsx` (Position update frequency is undebounced).
- **NFR-10**: `/` (Project Root) (Still no SQL migration or schema files present).

---

## 3. Requirement Traceability Matrix

| Requirement | Implementing module | Verification | Status |
| --- | --- | --- | --- |
| FR-01, FR-02 | Driver registration flow (`/register/driver`) | T01 | Verified |
| FR-03, FR-04 | Admin fleet monitor + realtime profile subscription | T02 | Verified |
| FR-05 | Supabase Auth sign-in with approval gate | T03 | Verified |
| FR-06 | Vehicle availability computation at registration | T04 | Verified |
| FR-08, FR-09 | Citizen report submission (`/citizen/report`) | T05 | Verified |
| FR-10, FR-11, FR-12 | web3.js reward call, network guard, failure isolation | T05, T06 | Verified |
| FR-13 | Admin reports view with zone-filtered driver selection | T07 | Verified |
| FR-15, FR-16, FR-17 | Geolocation watch + realtime map subscription | T08 | Verified |
| FR-18, FR-19 | Citizen tracking view with Haversine distance | T08 | Verified |
| FR-20 | Web Push subscription + `/api/notify` handler | T07 | Verified |
| FR-21, FR-25 | Route completion path with telemetry insert | T09 | Verified |
| FR-26 | Interaction counter | — | Not implemented |
| FR-27 | SQA telemetry dashboard (`/admin/sqa`) | T09 | Verified |
| FR-29, FR-30, FR-31 | Payout gateway (`/citizen/rewards`) + BankPayouts queue | Manual | Verified |
| FR-32 | Admin authentication (`/login/admin`, `src/proxy.js`) | Middleware checked | Verified |
| FR-33 | Offline caching and indexedDB sync (`public/sw.js`, `src/app/driver/page.jsx`) | Manual Offline Test | Verified |
| FR-34 | Image upload for reports (`src/app/citizen/report/page.jsx`) | T05 (Extended) | Verified |
| FR-35 | Role-based distinct sessions (`src/lib/portal.js`) | Auth Test | Verified |
| FR-36 | Super Admin management (`/admin/admins`) | Manual | Verified |

---

## 4. Current Data Model

The persistent data model actively used by the application, verified against live insertion and query operations in the codebase:

1. **`driver_profiles`**
   - Columns: `id` (PK), `user_id` (FK to auth.users), `full_name`, `email`, `phone_number`, `vehicle_number`, `license_number`, `assigned_zone`, `is_approved` (boolean, default false), `latitude`, `longitude`, `is_tracking` (boolean), `recent_alert`, `created_at`.
2. **`CitizenReports`**
   - Columns: `id` (PK), `user_id` (FK to auth.users / profiles), `zone`, `issue_type`, `description`, `exact_address`, `latitude`, `longitude`, `status`, `assigned_driver_id` (FK to driver_profiles), `image_url`, `reward_tx`, `created_at`.
3. **`Routes`**
   - Columns: `id` (PK), `driver_name`, `zone`, `status`.
4. **`HCILogs`**
   - Columns: `id` (PK), `task_name`, `clicks`, `time_taken` (milliseconds).
5. **`BankPayouts`**
   - Columns: `id` (PK), `wallet_address`, `eco_burned`, `lkr_amount`, `account_name`, `account_number`, `bank_name`, `status`.
6. **`vehicles`**
   - Columns: `registration_number` (PK / Unique), `created_at`.
7. **`push_subscriptions`**
   - Columns: `report_id` (FK to CitizenReports), `endpoint` (Unique), `p256dh`, `auth`.
8. **`profiles`**
   - Columns: `contact` (PK / Unique), `contact_type`, `role`, `full_name`, `email`, `wallet_address`, `phone`, `zone`, `house_number`, `preferred_day`, `how_heard`, `department`.
9. **`citizen_profiles`**
   - Columns: `user_id` (FK to auth.users).
10. **`admin_profiles`**
    - Columns: `wallet_address` (PK / Unique), `full_name`, `department`.

### Differences from Section 4.5.2 of the Thesis

- **`CitizenReports` Updates**: Three new columns were added that were not present in the original thesis schema: `user_id` (tracking the authenticated citizen submitting the report), `image_url` (for photo evidence uploaded to Supabase Storage), and `reward_tx` (to store the blockchain transaction hash of the ERC-20 token reward).
- **New Tables Introduced**: The application now introduces generalized and specialized profile tables to handle independent user roles securely:
  - `profiles`: A centralized table for overarching contact info and roles.
  - `citizen_profiles`: Tracks citizen-specific relationships.
  - `admin_profiles`: Tracks administrative-specific metadata (`department`, `wallet_address`).
- **No Schema Migrations**: As noted in the thesis, there are still no SQL migration files present in the repository, meaning the exact constraint specifications depend solely on the Supabase console setup.
