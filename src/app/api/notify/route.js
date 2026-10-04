import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/webpush";
import { requireAdmin } from "@/lib/supabaseServer";
import { validateText, LIMITS } from "@/lib/validation";

// Admin client — uses service role key (server-only, never exposed to browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/notify
 * Body: { reportId, driverName }
 * Fetches push subscriptions for this report and sends a Web Push notification.
 */
export async function POST(request) {
  try {

    const admin = await requireAdmin();
    if (!admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const reportId = Number(body.reportId);
    if (!Number.isInteger(reportId) || reportId <= 0) {
      return Response.json({ error: "A valid reportId is required" }, { status: 400 });
    }
    const nameCheck = validateText(body.driverName ?? "", { label: "Driver name", max: LIMITS.name });
    if (!nameCheck.ok) {
      return Response.json({ error: nameCheck.message }, { status: 400 });
    }
    const driverName = nameCheck.value;

    // Fetch all push subscriptions for this report using admin client
    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("report_id", reportId);

    if (error) {
      console.warn("push_subscriptions fetch error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return Response.json({ sent: 0, message: "No subscriptions for this report" });
    }

    const trackingUrl = `/track/${reportId}`;

    const results = await Promise.all(
      subs.map((sub) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          {
            title: "🚛 Driver on the way!",
            body: `${driverName || "Your driver"} has been assigned and is heading to you.`,
            url: trackingUrl,
          }
        )
      )
    );

    const sent = results.filter((r) => r.success).length;
    return Response.json({ sent, total: subs.length });
  } catch (err) {
    console.warn("Notify API error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
