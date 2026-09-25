/**
 * Run from the project root:
 *   node scripts/update-admin.mjs <admin-email> <new-password>
 * Forcefully sets the password of an existing admin user.
 */

import { admin } from "./_env.mjs"

const [ADMIN_EMAIL, ADMIN_PASSWORD] = process.argv.slice(2)

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Usage: node scripts/update-admin.mjs <admin-email> <new-password>")
  process.exit(1)
}

async function main() {
  console.log(`Looking for admin: ${ADMIN_EMAIL}`)

  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list.users.find((u) => u.email === ADMIN_EMAIL)

  if (!existing) {
    console.error("❌ User not found!")
    process.exit(1)
  }

  console.log(`Found user: ${existing.id}`)

  const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
    password: ADMIN_PASSWORD,
  })

  if (updErr) {
    console.error("❌ Update failed:", updErr.message)
    process.exit(1)
  }

  console.log("✅ Password updated.")
  console.log("You can now log in at http://localhost:3000/login/admin")
}

main()
