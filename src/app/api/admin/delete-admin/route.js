import { NextResponse } from "next/server"
import { requireAdmin, getAdminClient } from "@/lib/supabaseServer"

export async function DELETE(request) {
  if (!(await requireAdmin({ superOnly: true }))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const supabaseAdmin = getAdminClient()
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Safety check: make sure target is not a super_admin
    const { data: { user }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (fetchError) throw fetchError

    const targetRole = user?.user_metadata?.role
    if (targetRole !== "admin" && targetRole !== "super_admin") {
      return NextResponse.json({ error: "Target is not an admin account." }, { status: 400 })
    }
    if (targetRole === "super_admin") {
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
