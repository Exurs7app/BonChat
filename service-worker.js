const CACHE_NAME = "bonchat-shell-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.webmanifest",
  "./bonchat-icon-192.png",
  "./bonchat-icon-512.png",
  "./bonchat-icon-192-maskable.png",
  "./bonchat-icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("bonchat-shell-") && key !== CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  const appScope = new URL(self.registration.scope);

  if (
    request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    !requestUrl.pathname.startsWith(appScope.pathname)
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        if (request.mode === "navigate") {
          const appShellUrl = new URL("./index.html", appScope).href;
          const appShellResponse = await caches.match(appShellUrl);
          if (appShellResponse) return appShellResponse;
        }

        return new Response("غير متصل بالإنترنت.", {
          status: 503,
          statusText: "Offline",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })(),
  );
});
