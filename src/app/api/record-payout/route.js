import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { getSessionUser, getAdminClient } from "@/lib/supabaseServer"
import { verifyBurnTx } from "@/lib/verifyBurn"
import { EXCHANGE_RATE } from "@/lib/rewardsConfig"
import { validatePersonName, validateBankAccountNumber, firstError } from "@/lib/validation"

const BANKS = [
  "Commercial Bank",
  "Hatton National Bank (HNB)",
  "Sampath Bank",
  "Bank of Ceylon (BOC)",
  "People's Bank",
  "DFCC Bank",
]

// Records a bank-payout request ONLY for a burn that is proven on-chain.
// The client sends just the burn tx hash + bank details; the ECO amount and the
// LKR value are derived here from the chain, so a payout row can't be forged
// with a made-up hash, someone else's burn, or an inflated amount.
export async function POST(request) {
  const user = await getSessionUser("citizen")
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const burnTx = typeof body.burnTx === "string" ? body.burnTx.trim().toLowerCase() : ""
  const nameCheck = validatePersonName(body.accountName, "Account holder name")
  const numberCheck = validateBankAccountNumber(body.accountNumber)
  const bankName = typeof body.bankName === "string" ? body.bankName : ""

  if (!/^0x[0-9a-f]{64}$/.test(burnTx)) {
    return NextResponse.json({ error: "Invalid transaction hash." }, { status: 400 })
  }
  const problem = firstError(nameCheck, numberCheck)
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 })
  }
  const accountName = nameCheck.value
  const accountNumber = numberCheck.value
  if (!BANKS.includes(bankName)) {
    return NextResponse.json({ error: "Unsupported bank." }, { status: 400 })
  }

  const treasury = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS
  if (!treasury || !ethers.isAddress(treasury)) {
    return NextResponse.json({ error: "Server treasury wallet is not configured." }, { status: 500 })
  }

  const admin = getAdminClient()

  // The burn must come from the wallet saved on THIS citizen's profile, so one
  // citizen can't claim a payout for another citizen's (public) burn transaction.
  const { data: profileRows } = await admin
    .from("profiles")
    .select("wallet_address")
    .eq("email", user.email)
    .eq("role", "citizen")
    .limit(1)
  const wallet = profileRows?.[0]?.wallet_address
  if (!wallet || !ethers.isAddress(wallet)) {
    return NextResponse.json(
      { error: "No wallet saved on your profile. Connect the wallet you burned from first, then retry." },
      { status: 400 }
    )
  }

  const { data: existing } = await admin.from("BankPayouts").select("id").eq("burn_tx", burnTx).limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "This burn transaction has already been used for a payout." }, { status: 409 })
  }

  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
  )
  let result
  try {
    result = await verifyBurnTx(provider, burnTx, { from: wallet, treasury })
  } catch (err) {
    console.error("[record-payout] verify error", err)
    return NextResponse.json({ error: "Could not reach the blockchain to verify the burn. Please retry." }, { status: 502 })
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 422 })
  }
  if (result.ecoAmount < 1) {
    return NextResponse.json({ error: "Minimum payout is 1 ECO." }, { status: 422 })
  }

  const lkrAmount = result.ecoAmount * EXCHANGE_RATE
  const { error } = await admin.from("BankPayouts").insert([
    {
      wallet_address: wallet,
      eco_burned: result.ecoAmount,
      lkr_amount: lkrAmount,
      account_name: accountName,
      account_number: accountNumber,
      bank_name: bankName,
      status: "Pending Transfer",
      burn_tx: burnTx,
    },
  ])
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This burn transaction has already been used for a payout." }, { status: 409 })
    }
    console.error("[record-payout] insert error", error)
    return NextResponse.json({ error: "Could not save the payout request." }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ecoBurned: result.ecoAmount, lkrAmount })
}
