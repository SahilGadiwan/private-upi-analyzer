const CACHE = "upi-analyzer-v1";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.json", "./xlsx.full.min.js"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.filter(Boolean).filter(a=>a!=="./xlsx.full.min.js"))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request)));
});
