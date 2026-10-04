/**
 * Unit tests for src/lib/validation.js — no database or network needed:
 *   node scripts/test-validation.mjs
 */
import * as v from "../src/lib/validation.js"

let passed = 0
let failed = 0
const t = (name, res, expectOk, expectValue) => {
  const good = res.ok === expectOk && (expectValue === undefined || res.value === expectValue)
  good ? passed++ : failed++
  console.log(`${good ? "PASS" : "FAIL"}  ${name}${good ? "" : `   -> got ${JSON.stringify(res)}`}`)
}

console.log("— email")
t("normal email accepted + lowercased", v.validateEmail("  Nimal@Example.COM "), true, "nimal@example.com")
t("missing @ rejected", v.validateEmail("nimal.example.com"), false)
t("no domain dot rejected", v.validateEmail("a@b"), false)
t("spaces inside rejected", v.validateEmail("a b@c.com"), false)
t("1-letter TLD rejected", v.validateEmail("a@b.c"), false)
t("empty rejected", v.validateEmail(""), false)
t("non-string rejected", v.validateEmail(undefined), false)
t("255-char email rejected", v.validateEmail("a".repeat(250) + "@b.com"), false)

console.log("— password")
t("good password accepted", v.validatePassword("Eco2026pass"), true)
t("7 chars rejected", v.validatePassword("Abc1234"), false)
t("letters only rejected", v.validatePassword("abcdefghij"), false)
t("digits only rejected", v.validatePassword("1234567890"), false)
t("73-byte password rejected", v.validatePassword("a1" + "x".repeat(71)), false)
t("empty rejected", v.validatePassword(""), false)

console.log("— person name")
t("simple name accepted", v.validatePersonName("Nimal Perera"), true, "Nimal Perera")
t("initials + dots accepted", v.validatePersonName("A.B. Perera"), true)
t("apostrophe/hyphen accepted", v.validatePersonName("D'Silva-Fernando"), true)
t("Sinhala name accepted", v.validatePersonName("නිමල් පෙරේරා"), true)
t("Tamil name accepted", v.validatePersonName("கார்த்திக் குமார்"), true)
t("extra spaces collapsed", v.validatePersonName("  Nimal    Perera "), true, "Nimal Perera")
t("digits rejected", v.validatePersonName("Nimal 99"), false)
t("script tag rejected", v.validatePersonName("<script>alert(1)</script>"), false)
t("1 char rejected", v.validatePersonName("A"), false)
t("101 chars rejected", v.validatePersonName("a".repeat(101)), false)
t("empty rejected", v.validatePersonName("   "), false)

console.log("— phone")
t("+94 format accepted", v.validatePhone("+94 77 123 4567"), true)
t("local 077 format accepted", v.validatePhone("077-123-4567"), true)
t("landline with brackets accepted", v.validatePhone("(011) 234 5678"), true)
t("empty OK when optional", v.validatePhone(""), true, "")
t("empty rejected when required", v.validatePhone("", { required: true }), false)
t("too short rejected", v.validatePhone("12345"), false)
t("letters rejected", v.validatePhone("077abc4567"), false)
t("16 digits rejected", v.validatePhone("1234567890123456"), false)

console.log("— licence / plate / account")
t("licence B1234567 accepted + uppercased", v.validateLicenseNumber("b1234567"), true, "B1234567")
t("licence too short rejected", v.validateLicenseNumber("B12"), false)
t("licence symbols rejected", v.validateLicenseNumber("B123;DROP"), false)
t("plate CAB-1234 accepted", v.validateVehiclePlate("cab-1234"), true, "CAB-1234")
t("plate CMC-TRK-001 accepted", v.validateVehiclePlate("CMC-TRK-001"), true)
t("plate 2 chars rejected", v.validateVehiclePlate("AB"), false)
t("plate with symbols rejected", v.validateVehiclePlate("CAB_1234!"), false)
t("account 10 digits accepted", v.validateBankAccountNumber("8012 3456 78"), true, "8012345678")
t("account letters rejected", v.validateBankAccountNumber("80123abc78"), false)
t("account 5 digits rejected", v.validateBankAccountNumber("12345"), false)

console.log("— free text")
t("address 5-200 accepted", v.validateText("In front of 124 Galle Road", { min: 5, max: 200 }), true)
t("address too short rejected", v.validateText("abc", { min: 5, max: 200 }), false)
t("description 1001 chars rejected", v.validateText("x".repeat(1001), { max: 1000 }), false)
t("description 1000 chars accepted", v.validateText("x".repeat(1000), { max: 1000 }), true)
t("control character rejected", v.validateText("bad\u0000text", { max: 50 }), false)
t("newline OK in multiline", v.validateText("line1\nline2", { max: 50, multiline: true }), true)

console.log("— coordinates / photo / amount / uuid")
t("Colombo pin accepted", v.validateCoordinates(6.9271, 79.8612), true)
t("London pin rejected", v.validateCoordinates(51.5, -0.12), false)
t("NaN pin rejected", v.validateCoordinates("abc", 79.8), false)
t("null pin rejected", v.validateCoordinates(null, null), false)
t("no photo is fine", v.validateImageFile(null), true)
t("JPEG 1MB accepted", v.validateImageFile({ type: "image/jpeg", size: 1_000_000 }), true)
t("PDF rejected", v.validateImageFile({ type: "application/pdf", size: 1000 }), false)
t("SVG rejected", v.validateImageFile({ type: "image/svg+xml", size: 1000 }), false)
t("6MB photo rejected", v.validateImageFile({ type: "image/png", size: 6 * 1024 * 1024 }), false)
t("empty photo rejected", v.validateImageFile({ type: "image/png", size: 0 }), false)
t("amount 25 accepted", v.validateEcoAmount("25", { balance: 100 }), true, 25)
t("amount 12.5 accepted", v.validateEcoAmount("12.5", { balance: 100 }), true, 12.5)
t("amount 0.5 rejected (min 1)", v.validateEcoAmount("0.5", { balance: 100 }), false)
t("amount over balance rejected", v.validateEcoAmount("101", { balance: 100 }), false)
t("amount 3 decimals rejected", v.validateEcoAmount("1.234", { balance: 100 }), false)
t("negative amount rejected", v.validateEcoAmount("-5", { balance: 100 }), false)
t("exponent notation rejected", v.validateEcoAmount("1e3", { balance: 5000 }), false)
t("empty amount rejected", v.validateEcoAmount(""), false)
t("valid uuid accepted", { ok: v.isUuid("19a715d5-ac8a-4af4-aa03-757d2d27640f") }, true)
t("garbage uuid rejected", { ok: v.isUuid("1; drop table users") }, false)
t("firstError picks the first failure", { ok: v.firstError(v.validateEmail("a@b.com"), v.validatePhone("1"), v.validateEmail("x")) === "Enter a valid phone number, e.g. +94 77 123 4567 or 077 123 4567." }, true)

console.log(`\nRESULT: ${passed} passed, ${failed} failed`)
if (failed) process.exitCode = 1
