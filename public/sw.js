const CACHE_NAME = "ecoroute-v3";
const PRECACHE_URLS = ["/offline", "/icons/icon-192x192.png"];

// Install - precache the offline fallback page (one bad URL must not break install)
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => {})))
        )
    );
    self.skipWaiting();
});

// Activate - clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch - network first; remember good same-origin responses; fall back to cache, then /offline
self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;
    // Never touch API calls, Next.js data/RSC requests, dev HMR or range requests
    if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/_next/webpack-hmr") ||
        url.searchParams.has("_rsc") ||
        req.headers.has("RSC") ||
        req.headers.has("range")
    ) {
        return;
    }

    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res.ok && res.type === "basic" && !res.redirected) {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
                }
                return res;
            })
            .catch(async () => {
                const cached = await caches.match(req);
                if (cached) return cached;
                if (req.mode === "navigate") {
                    const offline = await caches.match("/offline");
                    if (offline) return offline;
                }
                return Response.error();
            })
    );
});

// Push event - Show notification to citizen when driver is assigned
self.addEventListener("push", (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: "EcoRoute", body: event.data.text(), url: "/" };
    }

    const title = data.title || "EcoRoute";
    const options = {
        body: data.body || "You have a new update.",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: "ecoroute-driver-assigned",
        renotify: true,
        data: { url: data.url || "/" },
        actions: [
            { action: "track", title: "Track Driver 🗺" },
            { action: "dismiss", title: "Dismiss" },
        ],
        vibrate: [200, 100, 200],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click - open tracking page
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || "/";

    if (event.action === "dismiss") return;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});