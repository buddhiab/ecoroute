import { NextResponse } from "next/server"
import { getSessionUser, getAdminClient } from "@/lib/supabaseServer"
import { ZONES, PICKUP_DAYS } from "@/lib/zones"

// Updates the signed-in citizen's own profile. Done server-side (service role)
// because RLS blocks anon-key writes to `profiles`; every field is validated
// here and only whitelisted columns can change (never role, email or wallet).
export async function POST(request) {
  const user = await getSessionUser("citizen")
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : ""
  const houseNumber = typeof body.house_number === "string" ? body.house_number.trim() : ""

  if (fullName.length < 1 || fullName.length > 100) {
    return NextResponse.json({ error: "Full name cannot be empty." }, { status: 400 })
  }
  if (phone && !/^\+?[\d\s\-]{7,15}$/.test(phone)) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 })
  }
  if (!ZONES.includes(body.zone)) {
    return NextResponse.json({ error: "Unsupported zone." }, { status: 400 })
  }
  if (!PICKUP_DAYS.includes(body.preferred_day)) {
    return NextResponse.json({ error: "Invalid pickup day." }, { status: 400 })
  }
  if (houseNumber.length > 30) {
    return NextResponse.json({ error: "House number is too long." }, { status: 400 })
  }

  const { data, error } = await getAdminClient()
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      zone: body.zone,
      preferred_day: body.preferred_day,
      house_number: houseNumber || null,
    })
    .eq("email", user.email)
    .eq("role", "citizen")
    .select("id")

  if (error) {
    console.error("[update-profile]", error)
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 })
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
