// খবরাখবর service worker: offline reading + push notifications.
// Plain JS on purpose (served as-is from /sw.js, never bundled).
//
// Caching rules, kept simple so a deploy can never leave users on an old site:
//  - Pages: always from the network first; the saved copy is used only when offline.
//  - /_next/static files: named by content hash, so a saved copy is always correct.
//  - Everything else (API calls, server actions, admin, other sites): not touched.

const VERSION = "v1";
const PAGES = `kk-pages-${VERSION}`;
const ASSETS = `kk-assets-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const MAX_PAGES = 40;
const MAX_ASSETS = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES).then((c) => c.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("kk-") && k !== PAGES && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  // The offline page is the first entry of PAGES; never drop it
  const start = cacheName === PAGES ? 1 : 0;
  for (let i = start; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function pageFromNetworkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh.ok && !fresh.redirected) {
      const cache = await caches.open(PAGES);
      await cache.put(request, fresh.clone());
      trim(PAGES, MAX_PAGES);
    }
    return fresh;
  } catch {
    const saved = await caches.match(request, { ignoreSearch: false });
    return saved || (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

async function assetFromCacheFirst(request) {
  const saved = await caches.match(request);
  if (saved) return saved;
  const fresh = await fetch(request);
  if (fresh.ok) {
    const cache = await caches.open(ASSETS);
    await cache.put(request, fresh.clone());
    trim(ASSETS, MAX_ASSETS);
  }
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(assetFromCacheFirst(request));
    return;
  }
  if (request.mode === "navigate") {
    // Admin and login pages are never saved on the device
    if (/^\/(admin|api|login|signup)(\/|$)/.test(url.pathname)) return;
    event.respondWith(pageFromNetworkFirst(request));
  }
});

// On logout the page asks for saved pages to be removed (they may hold personal notes)
self.addEventListener("message", (event) => {
  if (event.data === "kk-clear-pages") {
    event.waitUntil(
      caches.open(PAGES).then(async (cache) => {
        for (const key of await cache.keys()) {
          if (!key.url.endsWith(OFFLINE_URL)) await cache.delete(key);
        }
      })
    );
  }
});

// ---- Push notifications ----
// Payload (JSON): { title, body, url?, tag? }
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "খবরাখবর";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon.png",
      badge: "/badge.png",
      lang: "bn",
      // Same tag = the new notification replaces the old one instead of piling up
      tag: data.tag || "kk-daily",
      renotify: true,
      data: { url: typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
