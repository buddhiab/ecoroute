import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { getSessionUser, getAdminClient } from "@/lib/supabaseServer"

// Saves a wallet address to the signed-in citizen's profile row.
// Uses the service-role client to bypass RLS (the profiles UPDATE policy
// doesn't allow anon-key client writes, but the service-role client can).
// The address is validated server-side before persisting.
export async function POST(request) {
  const user = await getSessionUser("citizen")
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { address } = body

  if (!address || !ethers.isAddress(address)) {
    return NextResponse.json({ error: "Invalid Ethereum address." }, { status: 400 })
  }

  const supabaseAdmin = getAdminClient()
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ wallet_address: address })
    .eq("email", user.email)
    .eq("role", "citizen")

  if (error) {
    console.error("[save-wallet] supabase error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
