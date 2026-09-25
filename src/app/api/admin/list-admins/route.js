import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Uses service role key so we can read all users (admin-only operation)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // List all users from Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error

    // Filter to only admin and super_admin roles
    const admins = data.users
      .filter((u) => {
        const role = u.user_metadata?.role
        return role === "admin" || role === "super_admin"
      })
      .map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name ?? null,
        role: u.user_metadata?.role,
        created_at: u.created_at,
      }))

    return NextResponse.json({ admins })
  } catch (err) {
    console.error("[list-admins]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
