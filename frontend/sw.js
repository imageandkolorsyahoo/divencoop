// ============================================================
// sw.js — Divine Grace Cooperative Service Worker
// Provides offline shell + cache-first for static assets
// ============================================================

const CACHE_NAME = "dgcoop-v2.0.0";
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/styles.css",
  "./assets/js/api.js",
  "./assets/js/app.js",
  "./assets/js/modals.js",
  "./assets/js/db.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Never cache API calls (Apps Script)
  if (url.hostname.includes("script.google.com") || url.hostname.includes("googleusercontent")) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ success:false, message:"Offline" }), {
        headers: { "Content-Type": "application/json" }
      })
    ));
    return;
  }

  // Cache-first for same-origin static assets
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok && e.request.method === "GET") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => caches.match("./index.html"));
      })
    );
  }
});

// Listen for sync messages from main thread
self.addEventListener("message", e => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
