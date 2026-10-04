// Role handling.
//
// Privileged roles (admin / super_admin) must come from `app_metadata`, which can
// only be written with the service-role key. `user_metadata` is editable by the
// signed-in user themselves (supabase.auth.updateUser({ data })), so it must NEVER
// be trusted for admin roles — otherwise any citizen can promote themselves.
//
// Low-privilege roles (driver / citizen) may still be self-declared in
// `user_metadata` at sign-up; the real gate for drivers is the admin-approved
// `driver_profiles` row, not this field.
export const ADMIN_ROLES = ["admin", "super_admin"]

export function getRole(user) {
  const trusted = user?.app_metadata?.role
  if (trusted) return trusted
  const declared = user?.user_metadata?.role
  return declared === "driver" || declared === "citizen" ? declared : null
}

export const isAdmin = (user) => ADMIN_ROLES.includes(user?.app_metadata?.role)
export const isSuperAdmin = (user) => user?.app_metadata?.role === "super_admin"
