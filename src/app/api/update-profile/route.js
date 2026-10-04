import { NextResponse } from "next/server"
import { getSessionUser, getAdminClient } from "@/lib/supabaseServer"
import { ZONES, PICKUP_DAYS } from "@/lib/zones"
import { validatePersonName, validatePhone, validateText, firstError, LIMITS } from "@/lib/validation"

// Updates the signed-in citizen's own profile. Done server-side (service role)
// because RLS blocks anon-key writes to `profiles`; every field is validated
// here and only whitelisted columns can change (never role, email or wallet).
export async function POST(request) {
  const user = await getSessionUser("citizen")
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const name = validatePersonName(body.full_name, "Full name")
  const phone = validatePhone(body.phone)
  const house = validateText(body.house_number, { label: "House number", max: LIMITS.houseNumber })

  const problem = firstError(name, phone, house)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })
  if (!ZONES.includes(body.zone)) {
    return NextResponse.json({ error: "Unsupported zone." }, { status: 400 })
  }
  if (!PICKUP_DAYS.includes(body.preferred_day)) {
    return NextResponse.json({ error: "Invalid pickup day." }, { status: 400 })
  }

  const { data, error } = await getAdminClient()
    .from("profiles")
    .update({
      full_name: name.value,
      phone: phone.value || null,
      zone: body.zone,
      preferred_day: body.preferred_day,
      house_number: house.value || null,
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
