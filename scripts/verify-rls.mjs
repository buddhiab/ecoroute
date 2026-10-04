/**
 * Verifies the database write rules (sql/rls-hardening.sql) against the LIVE project,
 * using throwaway accounts and rows that are removed afterwards:
 *
 *   node scripts/verify-rls.mjs
 *
 * Every check says what SHOULD happen. Before the SQL is applied the "blocked" checks
 * fail (that's today's hole); after it, everything should pass.
 */
import { createClient } from "@supabase/supabase-js"
import { admin } from "./_env.mjs"

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const stamp = Date.now()
const made = { users: [], drivers: [], reports: [], routes: [], vehicles: [], other: [] }
let passed = 0
let failed = 0

const check = (ok, text) => {
  ok ? passed++ : failed++
  console.log(`${ok ? "PASS" : "FAIL"}  ${text}`)
}
// A write "went through" if there was no error and (for updates/deletes) a row came back.
const went = (res) => !res.error && (!Array.isArray(res.data) || res.data.length > 0)

async function makeUser(label, meta) {
  const email = `rls-${label}-${stamp}@example.com`
  const password = `Rls-Test-${stamp}`
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, ...meta })
  if (error) throw error
  made.users.push(data.user.id)
  const sb = createClient(URL_, ANON)
  const { error: e2 } = await sb.auth.signInWithPassword({ email, password })
  if (e2) throw e2
  return { id: data.user.id, email, sb }
}

async function makeDriverRow(user, extra = {}) {
  const { data, error } = await admin
    .from("driver_profiles")
    .insert([{ user_id: user?.id ?? null, full_name: `RLS Driver ${extra.tag ?? ""}${stamp}`, email: user?.email ?? `rls-d-${stamp}@example.com`, vehicle_number: "RLS-V", license_number: "RLS", assigned_zone: "Colombo 03", is_approved: false, ...extra.fields }])
    .select("id, full_name")
    .single()
  if (error) throw error
  made.drivers.push(data.id)
  return data
}

const makeReport = async (fields = {}) => {
  const { data, error } = await admin
    .from("CitizenReports")
    .insert([{ zone: "Colombo 03", issue_type: "RLS-TEST", description: "rls", exact_address: "rls", latitude: 6.9, longitude: 79.8, status: "Pending", ...fields }])
    .select("id")
    .single()
  if (error) throw error
  made.reports.push(data.id)
  return data.id
}

try {
  const anon = createClient(URL_, ANON)
  const citizen = await makeUser("citizen", { user_metadata: { role: "citizen" } })
  const drv1User = await makeUser("driver1", { user_metadata: { role: "driver" } })
  const drv2User = await makeUser("driver2", { user_metadata: { role: "driver" } })
  const adminUser = await makeUser("admin", { app_metadata: { role: "admin" } })
  const forged = await makeUser("forged", { user_metadata: { role: "super_admin" } })

  const d1 = await makeDriverRow(drv1User, { tag: "One-", fields: { is_approved: true } })
  const d2 = await makeDriverRow(drv2User, { tag: "Two-" }) // self-registered, awaiting approval
  const r1 = await makeReport({ assigned_driver_id: d1.id, status: "In Progress" })
  const r2 = await makeReport()
  const { data: rt } = await admin.from("Routes").insert([{ zone: "RLS-TEST", driver_name: d1.full_name, status: "In Progress" }]).select("id").single()
  made.routes.push(rt.id)

  console.log("\n— driver approval & profile control")
  check(!went(await citizen.sb.from("driver_profiles").update({ is_approved: true }).eq("id", d2.id).select("id")), "a citizen can't approve a driver")
  check(!went(await drv2User.sb.from("driver_profiles").update({ is_approved: true }).eq("id", d2.id).select("id")), "a driver can't approve THEMSELVES")
  check(!went(await drv1User.sb.from("driver_profiles").update({ is_approved: true }).eq("id", d2.id).select("id")), "a driver can't approve ANOTHER driver")
  check(!went(await forged.sb.from("driver_profiles").update({ is_approved: true }).eq("id", d2.id).select("id")), "a forged 'admin' (user_metadata only) can't approve")
  check(went(await drv1User.sb.from("driver_profiles").update({ latitude: 6.9, longitude: 79.8, is_tracking: true, recent_alert: null }).eq("id", d1.id).select("id")), "a driver CAN update their own GPS / tracking / alert")
  check(!went(await drv1User.sb.from("driver_profiles").update({ assigned_zone: "Colombo 07" }).eq("id", d1.id).select("id")), "a driver can't change their own zone")
  check(!went(await drv1User.sb.from("driver_profiles").update({ vehicle_number: "HACK-1" }).eq("id", d1.id).select("id")), "a driver can't change their own vehicle")
  check(!went(await drv1User.sb.from("driver_profiles").update({ latitude: 1 }).eq("id", d2.id).select("id")), "a driver can't edit another driver's row")
  check(went(await adminUser.sb.from("driver_profiles").update({ is_approved: true }).eq("id", d2.id).select("id")), "a real admin CAN approve a driver")
  check(went(await adminUser.sb.from("driver_profiles").update({ assigned_zone: "Colombo 05", recent_alert: "DISPATCH ALERT: test" }).eq("id", d2.id).select("id")), "a real admin CAN change zone + send an alert")
  const d3 = await makeDriverRow(null, { tag: "Del-" })
  check(!went(await citizen.sb.from("driver_profiles").delete().eq("id", d3.id).select("id")), "a citizen can't delete a driver profile")
  check(went(await adminUser.sb.from("driver_profiles").delete().eq("id", d3.id).select("id")), "a real admin CAN delete a driver profile")
  const reg = await anon.from("driver_profiles").insert([{ full_name: `RLS Reg ${stamp}`, email: `rls-reg-${stamp}@example.com`, vehicle_number: "RLS-R", license_number: "RLS", assigned_zone: "Colombo 03", is_approved: false }]).select("id")
  if (reg.data?.[0]) made.drivers.push(reg.data[0].id)
  check(went(reg), "driver self-registration (unapproved) still works")
  const sneaky = await anon.from("driver_profiles").insert([{ full_name: `RLS Sneaky ${stamp}`, email: `rls-sneaky-${stamp}@example.com`, vehicle_number: "RLS-S", license_number: "RLS", assigned_zone: "Colombo 03", is_approved: true }]).select("id")
  if (sneaky.data?.[0]) made.drivers.push(sneaky.data[0].id)
  check(!went(sneaky), "registering as already-approved is refused")

  console.log("\n— reports")
  const own = await citizen.sb.from("CitizenReports").insert([{ user_id: citizen.id, zone: "Colombo 03", issue_type: "RLS-TEST", description: "rls", exact_address: "rls", latitude: 6.9, longitude: 79.8, status: "Pending" }]).select("id")
  if (own.data?.[0]) made.reports.push(own.data[0].id)
  check(went(own), "a citizen CAN file their own Pending report")
  const base = { zone: "Colombo 03", issue_type: "RLS-TEST", description: "rls", exact_address: "rls", latitude: 6.9, longitude: 79.8 }
  const bad1 = await citizen.sb.from("CitizenReports").insert([{ ...base, user_id: citizen.id, status: "Resolved" }]).select("id")
  if (bad1.data?.[0]) made.reports.push(bad1.data[0].id)
  check(!went(bad1), "a citizen can't file a report that's already Resolved")
  const bad2 = await citizen.sb.from("CitizenReports").insert([{ ...base, user_id: citizen.id, status: "Pending", assigned_driver_id: d1.id }]).select("id")
  if (bad2.data?.[0]) made.reports.push(bad2.data[0].id)
  check(!went(bad2), "a citizen can't file a report pre-assigned to a driver")
  const bad3 = await citizen.sb.from("CitizenReports").insert([{ ...base, user_id: drv1User.id, status: "Pending" }]).select("id")
  if (bad3.data?.[0]) made.reports.push(bad3.data[0].id)
  check(!went(bad3), "a citizen can't file a report as someone else")
  check(!went(await citizen.sb.from("CitizenReports").update({ status: "Resolved" }).eq("id", r2).select("id")), "a citizen can't resolve a report")
  check(went(await drv1User.sb.from("CitizenReports").update({ status: "Resolved" }).eq("id", r1).select("id")), "a driver CAN resolve a report assigned to them")
  check(!went(await drv1User.sb.from("CitizenReports").update({ description: "tampered" }).eq("id", r1).select("id")), "a driver can't edit anything but the status")
  check(!went(await drv1User.sb.from("CitizenReports").update({ status: "Resolved" }).eq("id", r2).select("id")), "a driver can't touch a report that isn't assigned to them")
  check(!went(await drv1User.sb.from("CitizenReports").update({ status: "Pending" }).eq("id", r1).select("id")), "a driver can't set a report back to Pending")
  check(!went(await forged.sb.from("CitizenReports").update({ assigned_driver_id: d1.id, status: "In Progress" }).eq("id", r2).select("id")), "a forged 'admin' can't assign a driver")
  check(went(await adminUser.sb.from("CitizenReports").update({ assigned_driver_id: d1.id, status: "In Progress" }).eq("id", r2).select("id")), "a real admin CAN assign a driver")
  check(went(await admin.from("CitizenReports").update({ reward_tx: "0x" + "ab".repeat(32) }).eq("id", r2).select("id")), "server routes (service role) can still set reward_tx")
  const r3 = await makeReport()
  check(!went(await citizen.sb.from("CitizenReports").delete().eq("id", r3).select("id")), "a citizen can't delete reports")
  check(went(await adminUser.sb.from("CitizenReports").delete().eq("id", r3).select("id")), "a real admin CAN delete a report")

  console.log("\n— routes, vehicles, telemetry")
  check(!went(await anon.from("Routes").insert([{ zone: "RLS-TEST2", driver_name: "x", status: "Completed" }]).select("id")), "the public key can't create routes")
  check(!went(await citizen.sb.from("Routes").insert([{ zone: "RLS-TEST2", driver_name: "x", status: "In Progress" }]).select("id")), "a citizen can't create routes")
  const route = await adminUser.sb.from("Routes").insert([{ zone: "RLS-TEST2", driver_name: "x", status: "In Progress" }]).select("id")
  if (route.data?.[0]) made.routes.push(route.data[0].id)
  check(went(route), "a real admin CAN dispatch a route")
  check(!went(await drv2User.sb.from("Routes").update({ status: "Completed" }).eq("id", rt.id).select("id")), "a driver can't complete someone else's route")
  check(went(await drv1User.sb.from("Routes").update({ status: "Completed" }).eq("id", rt.id).select("id")), "a driver CAN complete their own route")
  const plate = `RLS-${String(stamp).slice(-6)}`
  check(!went(await citizen.sb.from("vehicles").insert([{ registration_number: plate }]).select("registration_number")), "a citizen can't add vehicles")
  const veh = await adminUser.sb.from("vehicles").insert([{ registration_number: plate }]).select("registration_number")
  if (veh.data?.[0]) made.vehicles.push(plate)
  check(went(veh), "a real admin CAN add a vehicle")
  check(went(await adminUser.sb.from("vehicles").delete().eq("registration_number", plate).select("registration_number")), "a real admin CAN remove a vehicle")
  check(!!(await anon.from("HCILogs").insert([{ task_name: "RLS-TEST", clicks: 0, time_taken: 0 }])).error, "the public key can't write telemetry")
  check(!(await drv1User.sb.from("HCILogs").insert([{ task_name: "RLS-TEST", clicks: 1, time_taken: 5 }])).error, "a logged-in driver CAN log telemetry")
  const citizenSees = await citizen.sb.from("HCILogs").select("id").limit(5)
  check(!went(citizenSees), "a citizen can't read telemetry")
  const adminSees = await adminUser.sb.from("HCILogs").select("id").limit(5)
  check(went(adminSees), "a real admin CAN read telemetry")

  console.log("\n— server-only tables stay private")
  const sub = await admin.from("push_subscriptions").insert([{ report_id: r2, endpoint: `https://rls-test/${stamp}`, p256dh: "x", auth: "x" }]).select("endpoint")
  if (sub.data?.[0]) made.other.push(["push_subscriptions", "endpoint", `https://rls-test/${stamp}`])
  check(!went(await anon.from("push_subscriptions").select("endpoint").eq("endpoint", `https://rls-test/${stamp}`)), "push subscriptions aren't readable with the public key")
  check(!went(await citizen.sb.from("push_subscriptions").select("endpoint").eq("endpoint", `https://rls-test/${stamp}`)), "push subscriptions aren't readable by a citizen")
  const ap = await admin.from("admin_profiles").insert([{ wallet_address: `0xrls${stamp}`, full_name: "RLS Admin Probe" }]).select("wallet_address")
  if (ap.data?.[0]) made.other.push(["admin_profiles", "wallet_address", `0xrls${stamp}`])
  check(!went(await anon.from("admin_profiles").select("wallet_address").eq("wallet_address", `0xrls${stamp}`)), "admin profiles aren't readable with the public key")

  console.log("\n— reads the app depends on still work (public tracking page, landing stats, pickers)")
  for (const t of ["CitizenReports", "driver_profiles", "Routes", "vehicles"]) {
    check(went(await anon.from(t).select("*").limit(1)), `the public key can still read ${t}`)
  }
} catch (e) {
  failed++
  console.log("TEST ERROR:", e.message || e)
} finally {
  for (const [table, col, val] of made.other) await admin.from(table).delete().eq(col, val)
  await admin.from("HCILogs").delete().eq("task_name", "RLS-TEST")
  for (const id of made.routes) await admin.from("Routes").delete().eq("id", id)
  await admin.from("Routes").delete().in("zone", ["RLS-TEST", "RLS-TEST2"])
  for (const id of made.reports) await admin.from("CitizenReports").delete().eq("id", id)
  await admin.from("CitizenReports").delete().eq("issue_type", "RLS-TEST")
  for (const id of made.drivers) await admin.from("driver_profiles").delete().eq("id", id)
  await admin.from("driver_profiles").delete().like("email", `rls-%-${stamp}@example.com`)
  await admin.from("vehicles").delete().eq("registration_number", `RLS-${String(stamp).slice(-6)}`)
  for (const id of made.users) await admin.auth.admin.deleteUser(id)
  console.log(`\nclean-up done.   RESULT: ${passed} passed, ${failed} failed`)
  if (failed) process.exitCode = 1
}
