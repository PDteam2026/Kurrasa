/* Service worker: offline support + hardened cache. Bump CACHE on every release. */
const CACHE = "kurrasa-v4";
const SHELL = [
  "./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./favicon-32.png", "./pdiqs-logo.png",
  "./pdf.min.mjs", "./pdf.worker.min.mjs"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== CACHE && k.startsWith("kurrasa-"))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Network-first for same-origin, with offline fallback. Strict origin checks. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (_) {
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";

  // Block everything else (no third-party scripts, APIs, etc.)
  if (!sameOrigin && !isFont) return;

  const fromCache = () =>
    caches.match(req).then((hit) => {
      if (hit) return hit;
      if (req.mode === "navigate") return caches.match("./index.html");
      return Response.error();
    });

  if (isFont) {
    e.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => Response.error());
      })
    );
    return;
  }

  e.respondWith(
    new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          fromCache().then((r) => {
            if (!settled) {
              settled = true;
              resolve(r);
            }
          });
        }
      }, 3500);

      fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(res);
          }
        })
        .catch(() => {
          clearTimeout(timer);
          fromCache().then((r) => {
            if (!settled) {
              settled = true;
              resolve(r);
            }
          });
        });
    })
  );
});
