import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI } from "@/lib/contracts/ecoToken"
import { getSessionUser, getAdminClient } from "@/lib/supabaseServer"

// Runs SERVER-SIDE with the contract owner key. Callers must be a signed-in citizen
// claiming the reward for their OWN report, and each report can be rewarded once.
export async function POST(request) {
  const supabaseAdmin = getAdminClient()
  let claimedReportId = null

  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 })
    }

    const { citizenAddress, reportId } = await request.json()

    if (!citizenAddress || !ethers.isAddress(citizenAddress)) {
      return NextResponse.json({ error: "Invalid citizen address." }, { status: 400 })
    }
    if (!reportId) {
      return NextResponse.json({ error: "reportId is required." }, { status: 400 })
    }

    const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: "Server is not configured for token rewards." },
        { status: 500 }
      )
    }

    // Atomically claim the reward: only succeeds if this report belongs to the caller
    // and has not been rewarded (or claimed) yet.
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("CitizenReports")
      .update({ reward_tx: "pending" })
      .eq("id", reportId)
      .eq("user_id", user.id)
      .is("reward_tx", null)
      .select("id")

    if (claimErr) {
      console.error("[reward-citizen] claim error", claimErr)
      return NextResponse.json({ error: "Could not verify report." }, { status: 500 })
    }
    if (!claimed || claimed.length === 0) {
      return NextResponse.json(
        { error: "Report not found, not yours, or already rewarded." },
        { status: 403 }
      )
    }
    claimedReportId = reportId

    const provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
    )
    const ownerWallet = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI, ownerWallet)

    const tx = await contract.rewardCitizen(citizenAddress)
    const receipt = await tx.wait()

    await supabaseAdmin
      .from("CitizenReports")
      .update({ reward_tx: receipt.hash })
      .eq("id", claimedReportId)

    return NextResponse.json({ success: true, txHash: receipt.hash })
  } catch (err) {
    console.error("[reward-citizen]", err)
    // Release the claim so the citizen can retry after a failed transaction
    if (claimedReportId !== null) {
      await supabaseAdmin
        .from("CitizenReports")
        .update({ reward_tx: null })
        .eq("id", claimedReportId)
    }
    const msg = err?.shortMessage || err?.message || "Transaction failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
