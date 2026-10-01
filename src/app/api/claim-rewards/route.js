import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI } from "@/lib/contracts/ecoToken"
import { getSessionUser, getAdminClient } from "@/lib/supabaseServer"

// Claims ECO rewards for every one of the signed-in citizen's reports that
// hasn't been rewarded yet (reward_tx IS NULL). Runs server-side with the
// contract owner key, same as /api/reward-citizen — the citizen never signs
// anything here. They only need a wallet address saved on their profile
// (Profile -> Connect Wallet), so reporting an issue never requires MetaMask.
export async function POST() {
  const supabaseAdmin = getAdminClient()

  const user = await getSessionUser("citizen")
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const { data: profileRows } = await supabaseAdmin
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

  const { data: pending, error: pendingErr } = await supabaseAdmin
    .from("CitizenReports")
    .select("id")
    .eq("user_id", user.id)
    .is("reward_tx", null)

  if (pendingErr) {
    console.error("[claim-rewards] list error", pendingErr)
    return NextResponse.json({ error: "Could not load your reports." }, { status: 500 })
  }
  if (!pending || pending.length === 0) {
    return NextResponse.json({ claimed: 0, failed: 0, message: "No pending rewards." })
  }

  const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY
  if (!privateKey) {
    return NextResponse.json(
      { error: "Server is not configured for token rewards." },
      { status: 500 }
    )
  }

  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
  )
  const ownerWallet = new ethers.Wallet(privateKey, provider)
  const contract = new ethers.Contract(ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI, ownerWallet)

  let claimed = 0
  let failed = 0
  let lastError = null

  for (const report of pending) {
    // Atomically claim this one report — only succeeds if it's still unrewarded,
    // so two tabs claiming at once (or a retry) can't double-pay the same report.
    const { data: claimedRows } = await supabaseAdmin
      .from("CitizenReports")
      .update({ reward_tx: "pending" })
      .eq("id", report.id)
      .eq("user_id", user.id)
      .is("reward_tx", null)
      .select("id")

    if (!claimedRows || claimedRows.length === 0) continue

    try {
      const tx = await contract.rewardCitizen(citizenAddress)
      const receipt = await tx.wait()
      await supabaseAdmin
        .from("CitizenReports")
        .update({ reward_tx: receipt.hash })
        .eq("id", report.id)
      claimed++
    } catch (err) {
      console.error("[claim-rewards] report", report.id, err)
      lastError = err?.shortMessage || err?.message || "Transaction failed"
      // Release the claim so it can be retried next time.
      await supabaseAdmin
        .from("CitizenReports")
        .update({ reward_tx: null })
        .eq("id", report.id)
      failed++
    }
  }

  return NextResponse.json({ claimed, failed, totalEco: claimed * 10, lastError })
}
