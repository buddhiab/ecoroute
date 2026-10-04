import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/supabaseServer";

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
    const user = await getSessionUser("citizen");
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const body = await request.json().catch(() => ({}));
    const { reportId, subscription } = body;

    const id = Number(reportId);
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "A valid reportId is required" }, { status: 400 });
    }
    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;
    if (
      typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 2048 ||
      typeof p256dh !== "string" || !p256dh || p256dh.length > 256 ||
      typeof auth !== "string" || !auth || auth.length > 128
    ) {
      return Response.json({ error: "A valid push subscription is required" }, { status: 400 });
    }

    // Write subscription using admin client (bypasses RLS for this trusted operation)
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          report_id: id,
          endpoint,
          p256dh,
          auth,
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
