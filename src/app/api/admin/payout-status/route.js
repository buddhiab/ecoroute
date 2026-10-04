import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { requireAdmin, getAdminClient } from "@/lib/supabaseServer"
import { verifyBurnTx } from "@/lib/verifyBurn"

const ALLOWED = ["Processing", "Completed", "Rejected"]

// Admin-only. Moves a payout request through Pending Transfer -> Processing ->
// Completed (or Rejected). Real money follows "Completed", so the burn is re-verified
// on-chain against the stored request before ANY forward status is accepted, and a
// Completed payout can never be changed again (no double payment, no quiet edits).
export async function POST(request) {
  const adminUser = await requireAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { id, status } = body
  if (!Number.isInteger(id) || !ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const db = getAdminClient()
  const { data: row } = await db.from("BankPayouts").select("*").eq("id", id).maybeSingle()
  if (!row) return NextResponse.json({ error: "Payout not found." }, { status: 404 })
  if (row.status === "Completed") {
    return NextResponse.json({ error: "This payout is already completed and can't be changed." }, { status: 409 })
  }
  if (row.status === "Rejected" && status !== "Rejected") {
    return NextResponse.json({ error: "A rejected payout can't be reopened." }, { status: 409 })
  }

  if (status !== "Rejected") {
    if (!row.burn_tx) {
      return NextResponse.json(
        { error: "No burn transaction is recorded for this request, so it can't be paid. Reject it instead." },
        { status: 422 }
      )
    }
    const treasury = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS
    if (!treasury || !ethers.isAddress(treasury)) {
      return NextResponse.json({ error: "Server treasury wallet is not configured." }, { status: 500 })
    }
    const provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
    )
    let result
    try {
      result = await verifyBurnTx(provider, row.burn_tx, { from: row.wallet_address, treasury })
    } catch (err) {
      console.error("[payout-status] verify error", err)
      return NextResponse.json({ error: "Could not reach the blockchain to verify the burn. Try again." }, { status: 502 })
    }
    if (!result.ok) {
      return NextResponse.json({ error: `Burn check failed: ${result.reason}` }, { status: 422 })
    }
    if (Math.abs(result.ecoAmount - Number(row.eco_burned)) > 1e-9) {
      return NextResponse.json(
        { error: `On-chain amount (${result.ecoAmount} ECO) doesn't match the request (${row.eco_burned} ECO).` },
        { status: 422 }
      )
    }
  }

  // Record who/when. If the audit columns haven't been added yet, fall back to status only.
  const stamp = { status, processed_by: adminUser.email, processed_at: new Date().toISOString() }
  let { error } = await db.from("BankPayouts").update(stamp).eq("id", id).neq("status", "Completed")
  if (error && ["42703", "PGRST204"].includes(error.code)) {
    ;({ error } = await db.from("BankPayouts").update({ status }).eq("id", id).neq("status", "Completed"))
  }
  if (error) {
    console.error("[payout-status] update error", error)
    return NextResponse.json({ error: "Could not update the payout." }, { status: 500 })
  }
  return NextResponse.json({ ok: true, status })
}
