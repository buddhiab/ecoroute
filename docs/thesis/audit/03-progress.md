# EcoRoute Progress Report

This document outlines the current progress of the EcoRoute project and thesis, evaluating the implementation status, chapter readiness, evaluation blockers, and a prioritized to-do list for final submission.

## 1. Implementation Status of Specific Objectives (Section 2.2)

| Objective | Status | Evidence |
| :--- | :--- | :--- |
| **2.2.1** Identify operational requirements and usability considerations | **Done** | Comprehensive analysis in `system_requirements_specification.md` and `THESIS_TECHNICAL_REPORT.md`. |
| **2.2.2** Analyse technological and research gaps | **Done** | Extensive literature review and gap analysis present in Chapter 3 of `thesis.md` and `THESIS_TECHNICAL_REPORT.md`. |
| **2.2.3** Design and develop the EcoRoute platform | **Partial** | The Next.js platform is fully functional (auth, routing, citizen reporting, admin dispatch, PWA/offline). **Missing/Incomplete:** Interaction counting (FR-26) is hardcoded to 1, and the smart contract `.sol` source code is missing from the repository. |
| **2.2.4** Evaluate the implemented system | **Not Started** | `EcoRoute_Evidence_Checklist.md` outlines required trials. Placeholders (`[TO BE COMPLETED]`) remain throughout Chapter 5 for test results, telemetry data, and blockchain verification. |

---

## 2. Thesis Status: Chapter by Chapter

* **Chapter 1 (Introduction):** **Needs Rewriting.** Section 1.7 (Scope) needs updating because administrator authentication, citizen authentication, and offline persistence (PWA) are now implemented in the codebase. Section 1.8 needs updating because rewards are signed server-side, not via MetaMask directly.
* **Chapter 2 (Objectives) & Chapter 3 (Literature Review):** **Up to Date.**
* **Chapter 4 (Methodology):** **Needs Rewriting.** Functional Requirements and architecture descriptions need updates to reflect the new PWA offline capabilities and the server-side `/api/reward-citizen` architecture.
  * *Unfinished:* Section 4.6.4.1 contains `[ACTION REQUIRED — the Solidity source for the deployed contract is not currently present...]`.
* **Chapter 5 (Results):** **Unfinished.** 
  * *Unfinished:* Section 5.2 contains `[TO WRITE: Describe the final setting...]`.
  * *Unfinished:* Section 5.4.1 contains `[TO BE COMPLETED]` for test cases and `[ACTION REQUIRED: Execute each test case...]`.
  * *Unfinished:* Section 5.5.1 contains `[TO BE COMPLETED — copy from block explorer]` and `[INSERT FIGURE HERE]`.
  * *Unfinished:* Section 5.5.2 contains `[TO BE COMPLETED]` for all realtime trials.
  * *Unfinished:* Section 5.5.3 contains `[DATA REQUIRED — this section cannot be completed until the telemetry trials...]` and `[INSERT FIGURE HERE]`.
  * *Unfinished:* Section 5.7 contains `[TO WRITE after completing the results...]`.
* **Chapter 6 (Discussion and Conclusions):** **Unfinished.**
  * *Unfinished:* Section 6.1 / 2.2.4 Evaluation contains `[TO WRITE after completing the tests...]`.
  * *Unfinished:* Section 6.2 contains `[TO WRITE: Compare your main findings...]`.
  * *Unfinished:* Section 6.3 contains `[TO WRITE: One short paragraph stating the contribution...]`.
* **Appendices:** **Unfinished.**
  * *Unfinished:* Appendix B contains `[ACTION REQUIRED: Insert the Solidity source code...]`.

---

## 3. Evaluation Status

All evaluation activities can technically be executed now, as the codebase is functional. Here is what blocks each item:

* **Test Cases T01–T10:** 
  * **Status:** Can be done now. 
  * **Blocker:** Requires manual execution of the test scenarios and capturing screenshots for evidence.
* **Realtime Trials P1–P6:** 
  * **Status:** Can be done now. 
  * **Blocker:** Requires paired-client execution (e.g., opening admin and driver windows side-by-side) to observe and record synchronization latency.
* **Blockchain Verification (Table 5.3):** 
  * **Status:** Can be done now. 
  * **Blocker:** Requires submitting a real test report to trigger the Sepolia testnet transaction, then copying the transaction hash and details from Etherscan.
* **Telemetry Trials (Table 5.5) & Offline Trials:** 
  * **Status:** Can be done now. 
  * **Blocker:** Requires manually performing at least 15 route-completion trials (including 5 offline-then-reconnect trials), exporting the `HCILogs` Supabase table to CSV, and generating the descriptive charts.

---

## 4. Figures and Diagrams Status

### Outdated Diagrams (Chapter 4)
* **Figure 4.1 (Use Case) & 4.3 (ER Diagram):** `CitizenReports` now contains `user_id`, `image_url`, and `reward_tx`.
* **Figure 4.4 & 4.6 (Activity/Sequence for Citizen Report):** The citizen report submission no longer prompts MetaMask to sign the reward transaction; it calls the server API `/api/reward-citizen`.
* **Figure 4.7 (Deployment View):** Must be updated to include the Service Worker (`sw.js`), IndexedDB for offline persistence, and the secure server-side wallet for signing token rewards.

### Outdated Screenshots (Chapter 5)
* **Figure 5.1 (Landing Page):** Hardcoded KPI statistics (24 routes, 1204 pickups) were removed and replaced with dynamic data. A demo warning banner was also added.
* **Figure 5.6, 5.11, 5.13 (Admin Dashboards):** The admin layout was modified, and a Super Admin management page was added.
* **Figure 5.7 (Citizen Report Interface):** A photo upload field was added, and the reward disclaimer text was likely updated to reflect the server-side signing.

---

## 5. Prioritised To-Do List to Final Submission

1. **Retrieve Smart Contract Source** *(Priority: High | Effort: Low)*
   * Fetch the `.sol` file from Remix or Etherscan and add it to Appendix B.
2. **Execute Telemetry & Offline Trials** *(Priority: High | Effort: Medium)*
   * Run 15 route completions (5 offline). Export `HCILogs` CSV and generate task duration charts for Section 5.5.3.
3. **Execute Blockchain & Realtime Trials** *(Priority: High | Effort: Low)*
   * Trigger a report reward, verify on Etherscan, and log realtime propagation sync delays.
4. **Execute Functional Tests & Retake Screenshots** *(Priority: High | Effort: Medium)*
   * Complete T01-T10. Replace outdated Figures (5.1, 5.7, Admin panels) with fresh screenshots of the current UI.
5. **Update Architectural Diagrams & Scope** *(Priority: Medium | Effort: Medium)*
   * Revise diagrams in Chapter 4 for server-side `/api/reward-citizen`, Service Workers, and new ER columns. Update Section 1.7 to reflect that Auth and PWA are now in-scope.
6. **Write Discussion & Conclusions** *(Priority: High | Effort: High)*
   * Use the generated metrics to write the final interpretations in Chapter 6 (`[TO WRITE]` placeholders).
