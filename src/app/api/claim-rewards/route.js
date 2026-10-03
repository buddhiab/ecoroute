import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI } from "@/lib/contracts/ecoToken"
import { getSessionUser, getAdminClient } from "@/lib/supabaseServer"

// Claims ECO rewards for the signed-in citizen's unrewarded reports. Runs
// server-side with the contract owner key — the citizen never signs anything;
// they only need a wallet address saved on their profile.
//
// Why it's built this way (reward_tx column states per report):
//   NULL                      not claimed
//   pending@<ms>              claimed, tx not yet broadcast
//   pending@<ms>#<txhash>     tx signed + hash saved BEFORE broadcast, now in flight
//   0x<txhash>                confirmed on-chain, reward paid
// Saving the hash before broadcasting means the chain is always the source of
// truth: a crash, timeout or double-click can never leave a report permanently
// stuck, and a report is only ever released for retry when we can show its
// transaction was never broadcast, reverted, or has vanished.
export const maxDuration = 60

// The owner wallet is an EIP-7702 "delegated" account: the network allows only ONE
// unconfirmed tx from it at a time (verified live: "in-flight transaction limit
// reached for delegated accounts"). So rewards are sent strictly one after another,
// each confirmed before the next, inside a time budget. Whatever doesn't fit stays
// unclaimed and the citizen just clicks again.
const BATCH_LIMIT = 5
const TOTAL_BUDGET_MS = 42_000
const MIN_TIME_PER_TX_MS = 15_000 // roughly one Sepolia block + overhead
const INFLIGHT_RETRY_MS = 4_000
const STALE_UNSENT_MS = 2 * 60_000 // claimed but never broadcast (server died mid-request)
const STALE_UNKNOWN_TX_MS = 10 * 60_000 // broadcast, but the network no longer knows the tx
const DEFINITIVE_REJECTION_RE = /nonce too low|replacement transaction underpriced|transaction underpriced|insufficient funds|intrinsic gas too low|exceeds block gas limit|max fee per gas less than/i
const INFLIGHT_RE = /in-flight transaction limit/i
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PENDING_RE = /^pending(?:@(\d+))?(?:#(0x[0-9a-fA-F]{64}))?$/ // bare "pending" = legacy format

async function recoverStalePending(admin, provider, userId) {
  const { data } = await admin
    .from("CitizenReports")
    .select("id, reward_tx")
    .eq("user_id", userId)
    .like("reward_tx", "pending*")

  for (const row of data ?? []) {
    const m = PENDING_RE.exec(row.reward_tx)
    if (!m) continue
    const age = Date.now() - (m[1] ? Number(m[1]) : 0)
    const hash = m[2]
    let next // undefined = leave it alone

    if (hash) {
      const receipt = await provider.getTransactionReceipt(hash).catch(() => null)
      if (receipt) {
        next = receipt.status === 1 ? hash : null
      } else if (age > STALE_UNKNOWN_TX_MS) {
        const known = await provider.getTransaction(hash).catch(() => ({})) // RPC error => assume known
        if (!known) next = null
      }
    } else if (age > STALE_UNSENT_MS) {
      next = null // nothing was ever broadcast without a saved hash, so this is safe
    }

    if (next === undefined) continue
    await admin.from("CitizenReports").update({ reward_tx: next }).eq("id", row.id).eq("reward_tx", row.reward_tx)
  }
}

export async function POST() {
  const admin = getAdminClient()

  const user = await getSessionUser("citizen")
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const { data: profileRows } = await admin
    .from("profiles")
    .select("wallet_address")
    .eq("email", user.email)
    .eq("role", "citizen")
    .limit(1)

  const citizenAddress = profileRows?.[0]?.wallet_address
  if (!citizenAddress || !ethers.isAddress(citizenAddress)) {
    return NextResponse.json(
      { error: "No wallet connected. Connect your wallet from your Profile page first." },
      { status: 400 }
    )
  }

  const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY
  if (!privateKey) {
    return NextResponse.json({ error: "Server is not configured for token rewards." }, { status: 500 })
  }

  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
  )
  const ownerWallet = new ethers.Wallet(privateKey, provider)
  const contract = new ethers.Contract(ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI, ownerWallet)

  try {
    await recoverStalePending(admin, provider, user.id)
  } catch (err) {
    console.error("[claim-rewards] recovery pass failed", err) // non-fatal
  }

  const { data: unclaimed, error: listErr } = await admin
    .from("CitizenReports")
    .select("id")
    .eq("user_id", user.id)
    .is("reward_tx", null)
    .order("id", { ascending: true })
  if (listErr) {
    console.error("[claim-rewards] list error", listErr)
    return NextResponse.json({ error: "Could not load your reports." }, { status: 500 })
  }

  const countInFlight = async () => {
    const { count } = await admin
      .from("CitizenReports")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .like("reward_tx", "pending*")
    return count ?? 0
  }

  const batch = (unclaimed ?? []).slice(0, BATCH_LIMIT)

  if (batch.length === 0) {
    const inFlight = await countInFlight()
    return NextResponse.json({
      claimed: 0, failed: 0, remaining: 0, inFlight,
      message: inFlight ? undefined : "No pending rewards.",
    })
  }

  let rewardEco = 10
  try {
    rewardEco = Number(ethers.formatUnits(await contract.reportReward(), 18))
  } catch {
    // fall back to the documented 10 ECO
  }

  // ── Send rewards one at a time: claim → sign → SAVE HASH → broadcast → confirm ──
  const deadline = Date.now() + TOTAL_BUDGET_MS
  let claimed = 0
  let failed = 0
  let newlyInFlight = 0
  let lastError = null
  const errText = (err) => err?.error?.message || err?.shortMessage || err?.message || "Transaction failed"

  for (const report of batch) {
    if (Date.now() > deadline - MIN_TIME_PER_TX_MS) break // not enough time left to confirm another

    const marker = `pending@${Date.now()}`
    const { data: claimedRows } = await admin
      .from("CitizenReports")
      .update({ reward_tx: marker })
      .eq("id", report.id)
      .eq("user_id", user.id)
      .is("reward_tx", null)
      .select("id")
    if (!claimedRows || claimedRows.length === 0) continue // another request got it first

    let current = marker // the value currently stored for this report
    const setValue = (value) =>
      admin.from("CitizenReports").update({ reward_tx: value }).eq("id", report.id).eq("reward_tx", current)
    const release = async () => { await setValue(null) }

    let response = null
    let hash = null
    let signed = null
    let stop = false

    // Attempt loop: re-prepare (fresh nonce, new hash) after an "in-flight limit" rejection.
    for (let attempt = 0; attempt < 6 && !response && !stop; attempt++) {
      try {
        const nonce = await provider.getTransactionCount(ownerWallet.address, "pending")
        const unsigned = await contract.rewardCitizen.populateTransaction(citizenAddress)
        const request = await ownerWallet.populateTransaction({ ...unsigned, nonce })
        signed = await ownerWallet.signTransaction(request)
        hash = ethers.Transaction.from(signed).hash
        const withHash = `${marker}#${hash}`
        const { error: saveErr } = await setValue(withHash)
        if (saveErr) throw new Error("Could not record the transaction before sending.")
        current = withHash
      } catch (err) {
        // Nothing broadcast yet for this attempt, so releasing is always safe.
        console.error("[claim-rewards] prepare failed for report", report.id, err)
        lastError = errText(err)
        await release()
        failed++
        stop = true
        break
      }

      try {
        response = await provider.broadcastTransaction(signed)
      } catch (err) {
        const msg = errText(err)
        console.error("[claim-rewards] broadcast rejected for report", report.id, msg)
        lastError = msg
        if (INFLIGHT_RE.test(msg) && Date.now() + INFLIGHT_RETRY_MS < deadline - MIN_TIME_PER_TX_MS) {
          await sleep(INFLIGHT_RETRY_MS) // someone else's reward is confirming; try again shortly
          continue
        }
        if (INFLIGHT_RE.test(msg) || DEFINITIVE_REJECTION_RE.test(msg)) {
          await release() // the network refused it, so it can never be mined
          stop = true
          break
        }
        // Unknown failure: the node may still have accepted it. Leave the saved hash and
        // let the recovery pass decide from chain state — releasing could double-pay.
        newlyInFlight++
        stop = true
        break
      }
    }
    if (!response) {
      // Out of retries (the network kept refusing us): nothing was broadcast, so free the
      // report for next time. Further reports would hit the same limit, so stop here.
      if (!stop) await release()
      break
    }

    // Wait for confirmation, but never past the time budget.
    let outcome
    const timer = { id: null }
    try {
      outcome = await Promise.race([
        response.wait(),
        new Promise((resolve) => { timer.id = setTimeout(() => resolve("timeout"), Math.max(1000, deadline - Date.now())) }),
      ])
    } catch (err) {
      lastError = errText(err)
      await release() // reverted on-chain: nothing was paid
      failed++
      continue
    } finally {
      clearTimeout(timer.id)
    }

    if (outcome === "timeout" || !outcome) {
      newlyInFlight++ // still confirming: stays "pending…", finalised on the next click
      break
    }
    if (outcome.status === 1) {
      await setValue(hash)
      claimed++
    } else {
      await release()
      failed++
    }
  }

  const inFlight = await countInFlight()
  return NextResponse.json({
    claimed,
    failed,
    remaining: Math.max(0, (unclaimed ?? []).length - claimed - newlyInFlight),
    inFlight,
    totalEco: claimed * rewardEco,
    lastError,
  })
}
