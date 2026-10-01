# Verification Audit

## 1. Reward Citizen API
**Question:** In `src/app/api/reward-citizen/route.js`: which contract function is called (a custom rewardCitizen/mint function, or ERC-20 transfer)? Which private key or env variable signs it? Is it the contract owner or a treasury wallet?

**Answer:** 
- The API calls a custom `rewardCitizen` function: `const tx = await contract.rewardCitizen(citizenAddress)` (`src/app/api/reward-citizen/route.js:63`).
- It is signed by the private key in the environment variable `CONTRACT_OWNER_PRIVATE_KEY` (`src/app/api/reward-citizen/route.js:27`).
- It is the contract owner (`src/app/api/reward-citizen/route.js:60`).

## 2. Citizen's Wallet Address
**Question:** Where does the citizen's wallet address come from: request body, MetaMask in the browser, or profiles.wallet_address in the database?

**Answer:**
The wallet address is extracted from the request body: `const { citizenAddress, reportId } = await request.json()` (`src/app/api/reward-citizen/route.js:18`).

## 3. Sepolia Network Check
**Question:** Is there still a Sepolia network check (chain ID 11155111)? Where, browser or server?

**Answer:**
Yes, there is a Sepolia network check. It happens in the **browser** inside `src/lib/web3.js` during the `getEcoBalance` call:
```javascript
// src/lib/web3.js:30-33
const network = await provider.getNetwork()
if (network.chainId !== 11155111n) {
    throw new Error("Wrong network. Please switch MetaMask to Sepolia.")
}
```

## 4. Reward Failure Handling
**Question:** What happens on failure: is reward_tx reset, is the report kept, what message does the citizen see?

**Answer:**
- **`reward_tx` is reset:** The API resets `reward_tx` to `null` so the claim can be retried (`src/app/api/reward-citizen/route.js:78`).
- **The report is kept:** The report is not deleted.
- **Message:** The citizen sees a short error message extracted from the error or a fallback: `const msg = err?.shortMessage || err?.message || "Transaction failed"` (`src/app/api/reward-citizen/route.js:81-82`).

## 5. MetaMask Requirement
**Question:** Is MetaMask still required anywhere for citizens (for example balance display or burnEcoTokens redemption)?

**Answer:**
Yes. Functions `getEcoBalance` and `burnEcoTokens` in `src/lib/web3.js` both call `getContractSigner()`, which uses `window.ethereum` (MetaMask) and will throw an error if it is not installed (`src/lib/web3.js:6-8`). Thus, MetaMask is required in the browser for balance display and redemption.

## 6. Driver IndexedDB syncQueue and sw.js Offline Flow
**Question:** Does the driver IndexedDB syncQueue and sw.js offline flow actually work end to end? Show the code path from going offline to replay after reconnect. Was this code present before commit 245a268?

**Answer:**
Yes, it works end-to-end.
**Code Path:**
1. **Service Worker Fallback:** `public/sw.js` intercepts fetch requests and falls back to cached responses or `/offline` for navigations when a network request fails (`public/sw.js:51-59`).
2. **Going Offline:** In `src/app/driver/page.jsx`, the `window.addEventListener("offline", ...)` fires, setting `isOffline` to `true` (`src/app/driver/page.jsx:258-264`).
3. **Queueing Task Offline:** When the driver marks a job as done, `handleJobDone` checks `isOffline` and saves the action to the IndexedDB `syncQueue`:
   ```javascript
   // src/app/driver/page.jsx:318-324
   if (isOffline) {
     await saveToOfflineQueue({ routeId: route.id, timeTakenMs })
     setStatusMessage("⚡ Saved offline — will sync when connection returns.")
     setRoute({ ...route, status: "Completed" })
     setIsMarkingDone(false)
     return
   }
   ```
4. **Replay on Reconnect:** When the connection returns, `window.addEventListener("online", onOnline)` fires. The `onOnline` function iterates over the queued tasks, updates Supabase, logs metrics, and then clears the `syncQueue` (`src/app/driver/page.jsx:265-297`).

**Was it present before 245a268?**
No. Commit `245a268` ("feat: complete project before laptop migration...") is the commit that introduced this offline flow and the `syncQueue` functionality.

## 7. Protected Admin Routes
**Question:** Which admin routes does `src/proxy.js` protect, and what happens when an unauthenticated user opens `/admin`?

**Answer:**
- `src/proxy.js` protects all routes starting with `/admin`, `/driver`, and `/citizen`.
- When an unauthenticated user opens `/admin`, they are immediately redirected to the admin login page:
  ```javascript
  // src/proxy.js:67-69
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login/admin", request.url));
    }
  ```
