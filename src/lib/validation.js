// Shared input validation.
//
// The SAME functions run in the browser (instant feedback) and in the server routes
// (enforcement — the browser can always be bypassed). Each returns
//   { ok: true,  value }   value = the cleaned input to actually use/store
//   { ok: false, message } message = safe to show the user
// and the database CHECK constraints (sql/validation-constraints.sql) are a final backstop
// for the writes the browser makes directly.

const ok = (value) => ({ ok: true, value })
const fail = (message) => ({ ok: false, message })

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u
const PHONE_RE = /^\+?\d{9,15}$/
const LICENSE_RE = /^[A-Z0-9][A-Z0-9 -]{4,19}$/
const PLATE_RE = /^[A-Z0-9][A-Z0-9 -]{2,14}$/
const ACCOUNT_RE = /^\d{6,20}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const LIMITS = {
  name: 100,
  email: 254,
  houseNumber: 30,
  department: 100,
  address: { min: 5, max: 200 },
  description: 1000,
  photoBytes: 5 * 1024 * 1024,
  // Sri Lanka bounding box — a report pin outside it is a mistake (or abuse)
  lat: { min: 5.5, max: 10.0 },
  lng: { min: 79.3, max: 82.1 },
}

export const isUuid = (v) => typeof v === "string" && UUID_RE.test(v)

export function validateEmail(raw) {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : ""
  if (!value) return fail("Email address is required.")
  if (value.length > LIMITS.email || !EMAIL_RE.test(value)) return fail("Please enter a valid email address.")
  return ok(value)
}

// 8–72 bytes (the bcrypt limit Supabase uses), with at least one letter and one digit.
export function validatePassword(raw) {
  if (typeof raw !== "string" || !raw) return fail("Password is required.")
  if (raw.length < 8) return fail("Password must be at least 8 characters.")
  if (new TextEncoder().encode(raw).length > 72) return fail("Password is too long (72 characters maximum).")
  if (!/\p{L}/u.test(raw) || !/\d/.test(raw)) return fail("Password must include at least one letter and one number.")
  return ok(raw)
}

export function validatePersonName(raw, label = "Name") {
  const value = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : ""
  if (!value) return fail(`${label} is required.`)
  if (value.length < 2 || value.length > LIMITS.name || !NAME_RE.test(value)) {
    return fail(`${label} must be 2–${LIMITS.name} characters: letters, spaces, . ' and - only.`)
  }
  return ok(value)
}

// Accepts +94 77 123 4567, 077-123-4567, (011) 234 5678 … — 9 to 15 digits, optional leading +.
export function validatePhone(raw, { required = false } = {}) {
  const value = typeof raw === "string" ? raw.trim() : ""
  if (!value) return required ? fail("Phone number is required.") : ok("")
  if (!PHONE_RE.test(value.replace(/[\s\-()]/g, ""))) {
    return fail("Enter a valid phone number, e.g. +94 77 123 4567 or 077 123 4567.")
  }
  return ok(value)
}

export function validateLicenseNumber(raw) {
  const value = typeof raw === "string" ? raw.trim().toUpperCase().replace(/\s+/g, " ") : ""
  if (!value) return fail("Driving licence number is required.")
  if (!LICENSE_RE.test(value)) return fail("Licence number must be 5–20 characters: letters, numbers, spaces or hyphens (e.g. B1234567).")
  return ok(value)
}

export function validateVehiclePlate(raw) {
  const value = typeof raw === "string" ? raw.trim().toUpperCase().replace(/\s+/g, " ") : ""
  if (!value) return fail("Vehicle registration number is required.")
  if (!PLATE_RE.test(value)) return fail("Registration number must be 3–15 characters: letters, numbers, spaces or hyphens (e.g. CAB-1234).")
  return ok(value)
}

export function validateBankAccountNumber(raw) {
  const value = typeof raw === "string" ? raw.replace(/[\s-]/g, "") : ""
  if (!ACCOUNT_RE.test(value)) return fail("Account number must be 6–20 digits.")
  return ok(value)
}

// Free text: trimmed, length-bounded, no control characters.
export function validateText(raw, { label = "This field", min = 0, max, multiline = false } = {}) {
  const value = typeof raw === "string" ? raw.trim() : ""
  if (CONTROL_CHARS.test(multiline ? value.replace(/[\n\r\t]/g, " ") : value)) return fail(`${label} contains invalid characters.`)
  if (value.length < min) return fail(min === 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
  if (max && value.length > max) return fail(`${label} must be ${max} characters or fewer.`)
  return ok(value)
}

export function validateCoordinates(lat, lng) {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return fail("Please pin the location on the map.")
  if (la < LIMITS.lat.min || la > LIMITS.lat.max || ln < LIMITS.lng.min || ln > LIMITS.lng.max) {
    return fail("The pinned location must be inside Sri Lanka.")
  }
  return ok({ lat: la, lng: ln })
}

// `file` only needs { type, size } so this runs anywhere (File in the browser).
export function validateImageFile(file) {
  if (!file) return ok(null)
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return fail("Photo must be a JPEG, PNG or WebP image.")
  if (file.size > LIMITS.photoBytes) return fail("Photo must be 5 MB or smaller.")
  if (file.size === 0) return fail("That photo file is empty.")
  return ok(file)
}

// ECO amount to cash out: ≥ 1, at most 2 decimals, not more than the balance.
export function validateEcoAmount(raw, { balance } = {}) {
  const text = String(raw ?? "").trim()
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return fail("Enter a whole or 2-decimal amount of ECO, e.g. 25 or 12.5.")
  const value = Number(text)
  if (value < 1) return fail("The minimum payout is 1 ECO.")
  if (balance !== undefined && value > Number(balance)) return fail(`You only have ${balance} ECO available.`)
  return ok(value)
}

// First failure among several results, or null — handy for forms: `const err = firstError(a, b)`.
export const firstError = (...results) => results.find((r) => !r.ok)?.message ?? null
