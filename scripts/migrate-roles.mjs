/**
 * Moves admin privileges from user_metadata (which the signed-in user can edit
 * themselves) into app_metadata (writable only with the service-role key).
 *
 *   node scripts/migrate-roles.mjs                 # dry run: lists candidates
 *   node scripts/migrate-roles.mjs --apply a@x.com b@y.com   # promote ONLY these emails
 *
 * Nothing is changed unless --apply is given with explicit emails, so a forged
 * account can never be promoted by accident.
 */
import { admin } from "./_env.mjs"

const args = process.argv.slice(2)
const apply = args[0] === "--apply"
const emails = (apply ? args.slice(1) : []).map((e) => e.toLowerCase())

const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
if (error) { console.error(error.message); process.exit(1) }

const candidates = data.users.filter((u) => ["admin", "super_admin"].includes(u.user_metadata?.role))
console.log(`${data.users.length} accounts, ${candidates.length} claim an admin role in user_metadata:\n`)
for (const u of candidates) {
  console.log(` • ${u.email}  user_metadata.role=${u.user_metadata.role}  app_metadata.role=${u.app_metadata?.role ?? "(none)"}  created ${u.created_at?.slice(0, 10)}  last sign-in ${u.last_sign_in_at?.slice(0, 10) ?? "never"}`)
}

if (!apply) {
  console.log("\nDry run only. Re-run with:  --apply <email> [<email> ...]  for the accounts you recognise.")
} else {
  for (const email of emails) {
    const u = candidates.find((c) => c.email.toLowerCase() === email)
    if (!u) { console.log(`skip ${email}: not an admin candidate`); continue }
    const { error: e } = await admin.auth.admin.updateUserById(u.id, { app_metadata: { role: u.user_metadata.role } })
    console.log(e ? `FAILED ${email}: ${e.message}` : `promoted ${email} -> app_metadata.role=${u.user_metadata.role}`)
  }
}
