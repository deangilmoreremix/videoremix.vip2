// Service Worker for VideoRemix.vip
// Minimal service worker to handle basic caching without CSP violations

const CACHE_NAME = 'videoremix-v1.0.1';

// Install event - minimal setup
self.addEventListener('install', (event) => {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - minimal caching for same-origin requests only
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests to avoid CSP violations
  if (event.request.url.startsWith(self.location.origin)) {
    // For navigation requests, try network first, then cache
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback to cache if network fails
            return caches.match(event.request);
          })
      );
    }
    // For other same-origin requests, try cache first, then network
    else {
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            return fetch(event.request).then(networkResponse => {
              // Cache successful GET requests
              if (networkResponse.status === 200 && event.request.method === 'GET') {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            });
          })
      );
    }
  }
  // For external requests, just fetch normally (don't cache to avoid CSP issues)
});