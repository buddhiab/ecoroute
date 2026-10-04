import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { ethers } from "ethers"
import { getAdminClient } from "@/lib/supabaseServer"

// Admin sign-up, done entirely server-side. The admin role is written to
// app_metadata with the service-role key — the browser can never grant it, and the
// access code is checked here against a secret (ADMIN_ACCESS_CODE, no NEXT_PUBLIC_
// prefix) instead of a value shipped to every visitor.
// Fails closed: with no ADMIN_ACCESS_CODE configured, admin registration is off.
const safeEqual = (a, b) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function POST(request) {
  const expected = process.env.ADMIN_ACCESS_CODE
  if (!expected) {
    return NextResponse.json(
      { error: "Admin registration is disabled: ADMIN_ACCESS_CODE is not configured on the server." },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  if (!safeEqual(String(body.accessCode ?? "").trim(), expected)) {
    await sleep(600) // slow down guessing
    return NextResponse.json({ error: "Invalid access code. Contact your system administrator." }, { status: 403 })
  }
  if (body.verifyOnly) return NextResponse.json({ ok: true })

  const email = typeof body.email === "string" ? body.email.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : ""
  const department = typeof body.department === "string" ? body.department.trim() : ""
  const walletAddress = body.walletAddress

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
  }
  if (!fullName || fullName.length > 100) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 })
  }
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return NextResponse.json({ error: "Please connect your MetaMask wallet first." }, { status: 400 })
  }

  const admin = getAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // the access code is the gate
    user_metadata: { full_name: fullName },
    app_metadata: { role: "admin" },
  })
  if (error) {
    const exists = /already|registered|exists/i.test(error.message)
    return NextResponse.json(
      { error: exists ? "An account with this email already exists. Try logging in instead." : error.message },
      { status: exists ? 409 : 500 }
    )
  }

  // Profile rows (42P01 = table doesn't exist, tolerated like before). On a real
  // failure, remove the auth user again so no half-created admin is left behind.
  const rollback = async (message, status = 500) => {
    await admin.auth.admin.deleteUser(data.user.id)
    return NextResponse.json({ error: message }, { status })
  }
  const { error: pErr } = await admin.from("profiles").insert([
    {
      contact: email,
      contact_type: "email",
      role: "admin",
      full_name: fullName,
      email,
      department: department || null,
      wallet_address: walletAddress,
    },
  ])
  if (pErr && pErr.code !== "42P01") {
    return rollback(pErr.code === "23505" ? "This wallet or email is already registered." : `Profile error: ${pErr.message}`, pErr.code === "23505" ? 409 : 500)
  }
  const { error: aErr } = await admin.from("admin_profiles").insert([
    { wallet_address: walletAddress, full_name: fullName, department: department || null },
  ])
  if (aErr && aErr.code !== "42P01") {
    return rollback(`Admin profile error: ${aErr.message}`)
  }

  return NextResponse.json({ ok: true })
}
