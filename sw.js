const CACHE = "upi-analyzer-v2";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.json", "./xlsx.full.min.js"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request)));
});
