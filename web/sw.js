const CACHE = 'contactflow-personal-ultimate-v3.6.0';
const ASSETS = ['./','./index.html','./styles.css','./enhancements.css','./v33.css','./v34.css','./v35.css','./v36.css','./location-operator.js','./channel-handoff.js','./import-merge.js','./name-engine.js','./telegram-export.js','./legacy-tools.js','./file-save.js','./app.js','./ultimate.js','./contact-export.js','./runtime-patch.js','./v33.js','./v34.js','./v35.js','./v36.js','./drive-sync.js','./business-connect.js','./config.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
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
