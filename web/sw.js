const CACHE = 'contactflow-personal-ultimate-v3.4.0';
const ASSETS = ['./','./index.html','./styles.css','./enhancements.css','./v33.css','./v34.css','./import-merge.js','./app.js','./ultimate.js','./contact-export.js','./telegram-web.bundle.js','./runtime-patch.js','./v33.js','./v34.js','./drive-sync.js','./business-connect.js','./config.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
