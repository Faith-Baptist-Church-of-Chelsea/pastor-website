// Service worker for the devotion journal.
//
// Scope is /journal, so the rest of the site is untouched by it. Three
// jobs: keep the journal openable with no network, cache scripture books
// as they're read, and receive the optional daily reminder push.
//
// Bump CACHE when the shell changes — old caches are dropped on activate.
const CACHE = "journal-v1";
const SHELL = ["/journal", "/kjv/index.json", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Never let one missing file abort the whole install.
      Promise.allSettled(SHELL.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Scripture and build assets never change once published — serve from
  // cache first so a cold morning launch on a bad signal still works.
  const immutable =
    url.pathname.startsWith("/kjv/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/");

  if (immutable) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Journal pages: fresh when possible, cached when not.
  if (request.mode === "navigate" && url.pathname.startsWith("/journal")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/journal", copy));
          return res;
        })
        .catch(() => caches.match("/journal").then((hit) => hit || caches.match(request)))
    );
  }
});

// --- Daily reminder -------------------------------------------------------

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = payload.title || "Time in the Word";
  const body = payload.body || "Today's page is waiting whenever you are.";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "daily-devotion",
      renotify: false,
      data: { url: "/journal" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/journal";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/journal") && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
