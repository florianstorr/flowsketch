// Service Worker: hält die App offline verfügbar.
// Strategie "stale-while-revalidate": sofort aus dem Cache starten, im Hintergrund die neue Version holen.
// Ein Update auf GitHub ist also beim übernächsten Öffnen der App aktiv.
const CACHE = 'flowsketch-v1';
const DATEIEN = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((k) => Promise.all(k.filter((n) => n.startsWith('flowsketch-') && n !== CACHE).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const schluessel = e.request.mode === 'navigate' ? './' : e.request;
    const alt = await c.match(schluessel, { ignoreSearch: e.request.mode === 'navigate' });
    const neu = fetch(e.request, { cache: 'no-cache' }).then((r) => {
      if (r && r.ok) c.put(schluessel, r.clone());
      return r;
    }).catch(() => alt);
    if (alt) { e.waitUntil(neu); return alt; }
    return neu;
  }));
});
