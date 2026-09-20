import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Admin client — uses service role key (server-only, NEVER exposed to browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * DELETE /api/citizen/delete-account
 *
 * Permanently deletes the authenticated citizen's data:
 *   1. profiles row
 *   2. citizen_profiles row
 *   3. Supabase Auth user (via service-role admin API)
 *
 * Requires a valid Supabase session cookie (citizen must be logged in).
 * Returns 200 on success, 401 if not authenticated, 500 on any error.
 */
export async function DELETE(request) {
  try {
    // ── 1. Verify the caller has a valid session ───────────────────────────────
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},  // read-only in Route Handlers
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()

    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId  = user.id
    const email   = user.email

    // ── 2. Delete from profiles table ─────────────────────────────────────────
    const { error: profilesErr } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("email", email)
      .eq("role", "citizen")

    if (profilesErr) {
      console.error("Delete profiles error:", profilesErr)
      // Non-fatal: profile row may not exist, continue
    }

    // ── 3. Delete from citizen_profiles table ──────────────────────────────────
    const { error: citizenProfilesErr } = await supabaseAdmin
      .from("citizen_profiles")
      .delete()
      .eq("user_id", userId)

    if (citizenProfilesErr) {
      console.error("Delete citizen_profiles error:", citizenProfilesErr)
      // Non-fatal: continue to delete auth user
    }

    // ── 4. Delete from CitizenReports (optional — orphan cleanup) ─────────────
    // We only delete reports if they have a citizen_email field matching
    // Skip silently if the column doesn't exist (handled by Supabase returning no error)
    await supabaseAdmin
      .from("CitizenReports")
      .delete()
      .eq("citizen_email", email)

    // ── 5. Delete the Supabase Auth user (irreversible) ───────────────────────
    const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteErr) {
      console.error("Delete auth user error:", authDeleteErr)
      return Response.json(
        { error: `Failed to delete auth account: ${authDeleteErr.message}` },
        { status: 500 }
      )
    }

    return Response.json({ success: true }, { status: 200 })

  } catch (err) {
    console.error("Unexpected delete-account error:", err)
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
