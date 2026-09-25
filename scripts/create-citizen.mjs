/**
 * Run from the project root:
 *   node scripts/create-citizen.mjs <email> <password> "<full name>" "<zone>"
 * Creates (or updates) a citizen user in Supabase with proper role metadata.
 */

import { admin } from "./_env.mjs"

const [CITIZEN_EMAIL, CITIZEN_PASSWORD, CITIZEN_NAME, CITIZEN_ZONE = "Colombo 03"] =
  process.argv.slice(2)

if (!CITIZEN_EMAIL || !CITIZEN_PASSWORD || !CITIZEN_NAME) {
  console.error('Usage: node scripts/create-citizen.mjs <email> <password> "<full name>" ["<zone>"]')
  process.exit(1)
}

async function main() {
  console.log(`Creating citizen: ${CITIZEN_EMAIL}`)

  const { data, error } = await admin.auth.admin.createUser({
    email: CITIZEN_EMAIL,
    password: CITIZEN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: "citizen", full_name: CITIZEN_NAME },
  })

  if (error) {
    if (error.message?.includes("already been registered") || error.status === 422) {
      console.log("User already exists — updating metadata...")
      const { data: list } = await admin.auth.admin.listUsers()
      const existing = list.users.find((u) => u.email === CITIZEN_EMAIL)
      if (existing) {
        const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
          password: CITIZEN_PASSWORD,
          email_confirm: true,
          user_metadata: { role: "citizen", full_name: CITIZEN_NAME },
        })
        if (updErr) {
          console.error("Update failed:", updErr.message)
          process.exit(1)
        }
        console.log(`✅ Updated existing user: ${existing.id}`)
        return
      }
    }
    console.error("❌ Failed:", error.message)
    process.exit(1)
  }

  console.log(`✅ Auth user created: ${data.user.id}`)

  const { error: pErr } = await admin.from("profiles").insert([
    {
      contact: CITIZEN_EMAIL,
      contact_type: "email",
      role: "citizen",
      full_name: CITIZEN_NAME,
      email: CITIZEN_EMAIL,
      zone: CITIZEN_ZONE,
    },
  ])

  if (pErr && pErr.code !== "23505") {
    console.warn("Profile insert warning:", pErr.message)
  } else {
    console.log("✅ Profile record created")
  }

  console.log("\n🎉 Done! Log in at: http://localhost:3000/login/citizen")
}

main()
