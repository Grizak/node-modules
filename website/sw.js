const CACHE_NAME = "nodeloggerg_cache_v1";
const urlsToCache = ["/", "favicon.ico", "manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((response) => response)
    )
  );
});
