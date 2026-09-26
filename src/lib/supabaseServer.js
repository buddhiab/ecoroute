import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { sessionCookieName } from "./portal";

// Returns the signed-in user (validated server-side) for the given portal
// ("admin" | "driver" | "citizen") from the request cookies, or null.
export async function getSessionUser(portal) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: { name: sessionCookieName(portal) },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

// Returns the user only if they are an admin/super_admin (or exactly super_admin).
export async function requireAdmin({ superOnly = false } = {}) {
  const user = await getSessionUser("admin");
  const role = user?.user_metadata?.role;
  const ok = superOnly ? role === "super_admin" : role === "admin" || role === "super_admin";
  return ok ? user : null;
}

// Service-role client — server only, bypasses RLS.
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
