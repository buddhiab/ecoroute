import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(request) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Safety check: make sure target is not a super_admin
    const { data: { user }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (fetchError) throw fetchError

    if (user?.user_metadata?.role === "super_admin") {
      return NextResponse.json(
        { error: "Cannot delete a Super Admin account." },
        { status: 403 }
      )
    }

    // Delete the user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error

    // Also clean up profiles table if it exists
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("contact", user?.email)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[delete-admin]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
