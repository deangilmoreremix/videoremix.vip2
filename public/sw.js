// Service Worker for caching static assets
const CACHE_NAME = 'videoremix-v4';
const STATIC_CACHE_NAME = 'videoremix-static-v4';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/favicon.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
  );
  // Force activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - network first strategy for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip non-HTTP/HTTPS requests (chrome-extension, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Skip external domains - only cache same-origin requests
  if (url.origin !== self.location.origin) return;



  // Cache first strategy for static assets
  if (STATIC_ASSETS.some(asset => url.pathname === asset) || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
  }
});