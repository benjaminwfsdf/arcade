/* service-worker.js */
const CACHE_VER = 'arcade-v19';
const STATIC_CACHE = CACHE_VER + '-static';
const RUNTIME_CACHE = CACHE_VER + '-runtime';

const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './pong-vertical.html',
   './galactic-defender.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png'
  
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
        .map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const acceptsHTML = req.headers.get('accept')?.includes('text/html');

  if (acceptsHTML) {
    // Network-first para documentos HTML
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(req, clone));
        return res;
      }).catch(() =>
        caches.match(req).then(cached => cached || caches.match('./offline.html'))
      )
    );
  } else {
    // Cache-first para estáticos (css/js/img/fuentes)
    event.respondWith(
      caches.match(req).then(cached =>
        cached || fetch(req).then(res => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(req, clone));
          return res;
        }).catch(() => cached)
      )
    );
  }
});
