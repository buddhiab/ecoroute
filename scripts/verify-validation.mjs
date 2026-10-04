/**
 * End-to-end input-validation check against a running server + the live database:
 *
 *   npm run build && npx next start -p 3100      # in one terminal
 *   node scripts/verify-validation.mjs            # in another (BASE_URL to override)
 *
 * Part 1 sends bad input to every server route and expects a clear 4xx (never a 500).
 * Part 2 tries to write invalid rows straight to the database and expects the CHECK
 * constraints (sql/validation-constraints.sql) to refuse them. Throwaway data only.
 */
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { admin } from "./_env.mjs"

const BASE = process.env.BASE_URL || "http://localhost:3100"
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const CODE = process.env.ADMIN_ACCESS_CODE
const stamp = Date.now()
const madeUsers = []
let passed = 0
let failed = 0
const check = (ok, text) => {
  ok ? passed++ : failed++
  console.log(`${ok ? "PASS" : "FAIL"}  ${text}`)
}

async function cookieFor(label, portal, meta) {
  const email = `val-${label}-${stamp}@example.com`
  const password = `Val-Test-${stamp}`
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, ...meta })
  if (error) throw error
  madeUsers.push(data.user.id)
  let jar = []
  const sb = createServerClient(URL_, ANON, { cookieOptions: { name: `sb-ecoroute-${portal}-auth-token` }, cookies: { getAll: () => [], setAll: (c) => { jar = c } } })
  const { error: e2 } = await sb.auth.signInWithPassword({ email, password })
  if (e2) throw e2
  return { email, cookie: jar.map((c) => `${c.name}=${c.value}`).join("; ") }
}
const send = async (method, path, body, cookie = "") => {
  const r = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) })
  return r.status
}

try {
  const reachable = await fetch(BASE + "/login/citizen").then((r) => r.ok).catch(() => false)
  if (!reachable) {
    console.log(`(server at ${BASE} not reachable — skipping Part 1)\n`)
  } else {
    const cit = await cookieFor("cit", "citizen", { user_metadata: { role: "citizen" } })
    const sup = await cookieFor("sup", "admin", { app_metadata: { role: "super_admin" } })
    await admin.from("profiles").insert([{ contact: cit.email, contact_type: "email", role: "citizen", full_name: "Val Citizen", email: cit.email, zone: "Colombo 03" }])

    console.log("— Part 1a: citizen profile (/api/update-profile)")
    const good = { full_name: "Nimal Perera", phone: "077 123 4567", zone: "Colombo 04", preferred_day: "Monday", house_number: "12A" }
    check((await send("POST", "/api/update-profile", { ...good, full_name: "Nimal 99" }, cit.cookie)) === 400, "name with digits -> 400")
    check((await send("POST", "/api/update-profile", { ...good, full_name: "<script>alert(1)</script>" }, cit.cookie)) === 400, "name with a script tag -> 400")
    check((await send("POST", "/api/update-profile", { ...good, phone: "123" }, cit.cookie)) === 400, "too-short phone -> 400")
    check((await send("POST", "/api/update-profile", { ...good, zone: "Colombo 10" }, cit.cookie)) === 400, "unsupported zone -> 400")
    check((await send("POST", "/api/update-profile", { ...good, house_number: "x".repeat(31) }, cit.cookie)) === 400, "31-char house number -> 400")
    check((await send("POST", "/api/update-profile", { ...good, preferred_day: "Sunday" }, cit.cookie)) === 400, "invalid pickup day -> 400")
    check((await send("POST", "/api/update-profile", good, cit.cookie)) === 200, "valid profile accepted -> 200")
    check((await send("POST", "/api/update-profile", good, "")) === 401, "no session -> 401")

    console.log("\n— Part 1b: wallet, push, payouts (citizen)")
    check((await send("POST", "/api/save-wallet", { address: "0x123" }, cit.cookie)) === 400, "malformed wallet address -> 400")
    check((await send("POST", "/api/push-subscribe", { reportId: "abc", subscription: { endpoint: "https://x.test/p", keys: { p256dh: "a", auth: "b" } } }, cit.cookie)) === 400, "push: non-numeric reportId -> 400")
    check((await send("POST", "/api/push-subscribe", { reportId: 1, subscription: { endpoint: "http://insecure.test/p", keys: { p256dh: "a", auth: "b" } } }, cit.cookie)) === 400, "push: non-https endpoint -> 400")
    check((await send("POST", "/api/push-subscribe", { reportId: 1, subscription: { endpoint: "https://x.test/p" } }, cit.cookie)) === 400, "push: missing keys -> 400 (used to crash with a 500)")
    const bank = { burnTx: "0x" + "ab".repeat(32), accountName: "A.B. Perera", accountNumber: "8012345678", bankName: "Sampath Bank" }
    check((await send("POST", "/api/record-payout", { ...bank, burnTx: "0x12" }, cit.cookie)) === 400, "payout: malformed tx hash -> 400")
    check((await send("POST", "/api/record-payout", { ...bank, accountNumber: "abc" }, cit.cookie)) === 400, "payout: non-numeric account -> 400")
    check((await send("POST", "/api/record-payout", { ...bank, accountName: "X9" }, cit.cookie)) === 400, "payout: bad account holder name -> 400")
    check((await send("POST", "/api/record-payout", { ...bank, bankName: "Fake Bank" }, cit.cookie)) === 400, "payout: unknown bank -> 400")

    console.log("\n— Part 1c: admin routes")
    check((await send("POST", "/api/notify", { reportId: "abc", driverName: "Kamal" }, sup.cookie)) === 400, "notify: non-numeric reportId -> 400")
    check((await send("POST", "/api/notify", { reportId: 1, driverName: "k".repeat(101) }, sup.cookie)) === 400, "notify: 101-char driver name -> 400")
    check((await send("DELETE", "/api/admin/delete-admin", { userId: "not-a-uuid" }, sup.cookie)) === 400, "delete-admin: malformed id -> 400")
    check((await send("POST", "/api/admin/payout-status", { id: "x", status: "Completed" }, sup.cookie)) === 400, "payout-status: non-integer id -> 400")

    console.log("\n— Part 1d: admin sign-up (/api/register-admin)")
    if (!CODE) {
      console.log("(ADMIN_ACCESS_CODE isn't set in .env.local — skipping)")
    } else {
      const reg = { accessCode: CODE, email: `val-reg-${stamp}@example.com`, password: "Valid-Pass-1", fullName: "Admin Person", walletAddress: "0x" + "1".repeat(40) }
      check((await send("POST", "/api/register-admin", { ...reg, accessCode: "wrong" })) === 403, "wrong access code -> 403")
      check((await send("POST", "/api/register-admin", { ...reg, email: "not-an-email" })) === 400, "malformed email -> 400")
      check((await send("POST", "/api/register-admin", { ...reg, password: "abcdefgh" })) === 400, "weak password (no digit) -> 400")
      check((await send("POST", "/api/register-admin", { ...reg, password: "Ab1" })) === 400, "short password -> 400")
      check((await send("POST", "/api/register-admin", { ...reg, fullName: "Admin 9" })) === 400, "name with a digit -> 400")
      check((await send("POST", "/api/register-admin", { ...reg, walletAddress: "0xabc" })) === 400, "malformed wallet -> 400")
    }
  }

  console.log("\n— Part 2: the database refuses invalid rows on its own (needs sql/validation-constraints.sql)")
  const rep = { zone: "Colombo 03", issue_type: "VAL-TEST", description: "ok", exact_address: "124 Galle Road", latitude: 6.9, longitude: 79.8, status: "Pending" }
  const refused = async (table, row, label) => {
    const r = await admin.from(table).insert([row]).select("*")
    check(!!r.error, `refused: ${label}${r.error ? "" : "   (it was ACCEPTED)"}`)
  }
  const accepted = async (table, row, label) => {
    const r = await admin.from(table).insert([row]).select("*")
    check(!r.error, `accepted: ${label}${r.error ? "   -> " + r.error.message : ""}`)
  }
  await accepted("CitizenReports", rep, "a normal report")
  await refused("CitizenReports", { ...rep, description: "x".repeat(1001) }, "report description over 1000 chars")
  await refused("CitizenReports", { ...rep, latitude: 51.5, longitude: -0.12 }, "report pinned outside Sri Lanka")
  await refused("CitizenReports", { ...rep, zone: "Colombo 99" }, "report in an unsupported zone")
  await refused("CitizenReports", { ...rep, exact_address: "ab" }, "report address under 3 characters")
  const drv = { full_name: "Val Driver", email: `val-d-${stamp}@example.com`, vehicle_number: "VAL-1", license_number: "B1234567", assigned_zone: "Colombo 03", is_approved: false }
  await accepted("driver_profiles", drv, "a normal driver profile")
  await refused("driver_profiles", { ...drv, email: `val-d2-${stamp}@example.com`, full_name: "" }, "driver with an empty name")
  await refused("driver_profiles", { ...drv, email: `val-d3-${stamp}@example.com`, assigned_zone: "Colombo 99" }, "driver in an unsupported zone")
  await refused("driver_profiles", { ...drv, email: `val-d4-${stamp}@example.com`, license_number: "L".repeat(31) }, "driver licence over 30 chars")
  const prof = { contact: `val-p-${stamp}@example.com`, contact_type: "email", role: "citizen", full_name: "Val Profile", email: `val-p-${stamp}@example.com`, zone: "Colombo 03" }
  await refused("profiles", { ...prof, contact: `val-p2-${stamp}@example.com`, email: `val-p2-${stamp}@example.com`, phone: "1".repeat(25) }, "profile phone over 20 chars")
  await refused("profiles", { ...prof, contact: `val-p3-${stamp}@example.com`, email: `val-p3-${stamp}@example.com`, zone: "Colombo 99" }, "profile in an unsupported zone")
  await refused("vehicles", { registration_number: "bad_plate!" }, "vehicle plate with symbols")
  await refused("vehicles", { registration_number: "abc-123" }, "lowercase vehicle plate")
  const pay = { wallet_address: "0xval", eco_burned: 10, lkr_amount: 100, account_name: "Val Test", account_number: "1234567890", bank_name: "Sampath Bank", status: "Pending Transfer" }
  await accepted("BankPayouts", pay, "a normal payout request")
  await refused("BankPayouts", { ...pay, account_number: "abc" }, "payout with a non-numeric account")
  await refused("BankPayouts", { ...pay, eco_burned: 0 }, "payout of 0 ECO")
  await refused("BankPayouts", { ...pay, lkr_amount: -5 }, "payout with a negative rupee amount")
  await refused("BankPayouts", { ...pay, bank_name: "Fake Bank" }, "payout to an unknown bank")
} catch (e) {
  failed++
  console.log("TEST ERROR:", e.message || e)
} finally {
  await admin.from("CitizenReports").delete().eq("issue_type", "VAL-TEST")
  await admin.from("driver_profiles").delete().like("email", `val-d%-${stamp}@example.com`)
  await admin.from("driver_profiles").delete().eq("email", `val-d-${stamp}@example.com`)
  await admin.from("profiles").delete().like("email", `val-%-${stamp}@example.com`)
  await admin.from("vehicles").delete().in("registration_number", ["bad_plate!", "abc-123"])
  await admin.from("BankPayouts").delete().eq("wallet_address", "0xval")
  await admin.auth.admin.listUsers({ perPage: 1000 }).then(async ({ data }) => {
    for (const u of data?.users ?? []) if (u.email?.startsWith("val-") && u.email.includes(String(stamp))) await admin.auth.admin.deleteUser(u.id)
  })
  for (const id of madeUsers) await admin.auth.admin.deleteUser(id).catch(() => {})
  console.log(`\nclean-up done.   RESULT: ${passed} passed, ${failed} failed`)
  if (failed) process.exitCode = 1
}
