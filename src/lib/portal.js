// Each portal keeps its own Supabase session cookie, so admin, driver and citizen
// can be signed in at the same time in one browser.
export function portalFromPath(pathname = "") {
  if (/^\/(admin|login\/admin|register\/admin|api\/admin|api\/notify)(\/|$)/.test(pathname)) return "admin"
  if (/^\/(driver|login\/driver|register\/driver)(\/|$)/.test(pathname)) return "driver"
  return "citizen"
}

export const sessionCookieName = (portal) => `sb-ecoroute-${portal}-auth-token`
