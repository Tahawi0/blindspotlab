// Blind Spot Lab: works offline. HTML comes from the network first, static files from the cache.
const CACHE = "bsl-c69b6151";
const PRE = ["./", "offline.html", "daily/", "atlas/", "philosophy/", "quiz/", "search/", "search.json", "manifest.webmanifest", "assets/style.css?v=c69b6151", "assets/app.js?v=c69b6151", "assets/motion.js?v=c69b6151", "assets/daily.js?v=c69b6151", "assets/quiz.js?v=c69b6151", "assets/search.js?v=c69b6151"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("bsl-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.hostname.endsWith("workers.dev") || url.hostname.includes("cloudflareinsights")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("offline.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || url.hostname.includes("gstatic") || url.hostname.includes("googleapis"))) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
    return r;
  })));
});
