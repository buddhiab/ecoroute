import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Admin client — uses service role key (server-only, never exposed to browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/push-subscribe
 * Body: { reportId, subscription: { endpoint, keys: { p256dh, auth } } }
 * Saves or upserts a Web Push subscription for a given report.
 */
export async function POST(request) {
  try {
    // ── Auth check: require a valid Supabase session ──────────────────────────
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {}, // read-only in Route Handlers
        },
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { reportId, subscription } = await request.json();

    if (!reportId || !subscription?.endpoint) {
      return Response.json({ error: "reportId and subscription are required" }, { status: 400 });
    }

    // Write subscription using admin client (bypasses RLS for this trusted operation)
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          report_id: reportId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.warn("push_subscriptions upsert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.warn("Push subscribe API error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
