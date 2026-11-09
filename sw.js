const CACHE_NAME = "question-island-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key.startsWith("question-island-") && key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put("./index.html", copy))
              .catch(error => console.error("Failed to update offline app cache:", error))
          );
        }
        return response;
      }).catch(async () => (await caches.match(request)) || (await caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
