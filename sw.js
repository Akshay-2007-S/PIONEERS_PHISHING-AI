/* PhishGuard AI — Service Worker for PWA Offline & Native App Mode */
const CACHE_NAME = 'phishguard-pwa-v1.2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/cyber.css',
  '/app.js',
  '/cyber.js',
  '/bg3d.js',
  '/engine.js',
  '/supabase-config.js',
  '/manifest.json',
  '/dna.js',
  '/pwa.js',
  '/copilot.js',
  '/defenselab.js',
  '/trustnetwork.js',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-192.png',
  '/assets/icon-maskable-512.png',
  '/assets/favicon-32.png',
  '/assets/favicon-64.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('PWA Cache pre-fetch non-fatal error:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip external analytics / supabase auth endpoints from caching
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first strategy with cache fallback for real-time freshness
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('Network error occurred and no cache available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
