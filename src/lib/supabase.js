import { createBrowserClient } from '@supabase/ssr'
import { portalFromPath, sessionCookieName } from './portal'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
// Use the standard Supabase anon key. Avoid fallback chains with non-standard
// key names — they can trigger extra auth resolution round-trips.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// One client per portal, each with its own session cookie (see lib/portal.js).
const clients = {}

function clientFor(portal) {
  if (!clients[portal]) {
    clients[portal] = createBrowserClient(supabaseUrl, supabaseKey, {
      isSingleton: false,
      cookieOptions: { name: sessionCookieName(portal) },
    })
  }
  return clients[portal]
}

// Same `supabase` import as before; it resolves to the client of the portal
// the user is currently in (admin / driver / citizen).
export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      const portal = typeof window === 'undefined' ? 'citizen' : portalFromPath(window.location.pathname)
      const client = clientFor(portal)
      const value = client[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
  }
)
