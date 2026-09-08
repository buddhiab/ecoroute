const CACHE_NAME = "ecoroute-v2";
const OFFLINE_URLS = ["/driver", "/offline"];

// Install event - Cache the core files
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(OFFLINE_URLS);
        })
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

// Fetch event - Serve from cache if offline
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request).then((response) => {
                if (response) return response;
                return caches.match("/driver");
            });
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