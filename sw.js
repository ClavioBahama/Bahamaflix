/**
 * Bahama Flix — service worker (PWA offline e instalação).
 * Cache-first para arquivos estáticos, com atualização em segundo plano.
 */
const CACHE = 'bahamaflix-v5';
const ROOT = self.registration.scope;
const asset = (path) => new URL(path, ROOT).href;

const PRECACHE = [
  '', 'index.html', '404.html',
  'manifest.webmanifest',
  'assets/css/style.css',
  'assets/js/catalog.js',
  'assets/js/search.js',
  'assets/js/app.js',
  'assets/js/pwa.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/icon.svg',
  'data/catalog.json',
  'data/public-domain.json',
  'data/enrichment.json',
  'data/series.json',
  'data/episodes.json',
  'data/available-episodes.json',
  'data/platforms.json',
  'data/pages.json'
].map(asset);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE);
          cache.put(asset('index.html'), response.clone());
        }
        return response;
      } catch (_) {
        const cache = await caches.open(CACHE);
        return (await cache.match(asset('index.html')))
          || (await cache.match(asset('')))
          || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });

    const network = fetch(request)
      .then((response) => {
        if (response && response.ok && response.type === 'basic') {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => cached || Response.error());

    return cached || network;
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
