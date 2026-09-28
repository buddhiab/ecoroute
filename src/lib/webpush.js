import webpush from "web-push";

// Read per send (not at import) so the build doesn't need VAPID env vars.
function vapidDetails() {
  return {
    subject: process.env.VAPID_EMAIL,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
  };
}

/**
 * Sends a Web Push notification to a single subscription object.
 * @param {object} subscription - { endpoint, keys: { p256dh, auth } }
 * @param {object} payload - { title, body, url }
 */
export async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      vapidDetails: vapidDetails(),
    });
    return { success: true };
  } catch (err) {
    console.error("Push notification error:", err.statusCode, err.body);
    return { success: false, error: err.message };
  }
}
