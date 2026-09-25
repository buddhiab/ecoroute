// Loads .env.local and returns a service-role Supabase admin client (never hardcode keys here).
import { createClient } from "@supabase/supabase-js"

try {
  process.loadEnvFile(".env.local")
} catch {
  // fall through — variables may already be set in the shell
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

export const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})
