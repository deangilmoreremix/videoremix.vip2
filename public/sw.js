// Service Worker for VideoRemix.vip
// Handles caching, offline functionality, and resource management

const CACHE_NAME = 'videoremix-v1.0.0';
const STATIC_CACHE = 'videoremix-static-v1.0.0';
const DYNAMIC_CACHE = 'videoremix-dynamic-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/robots.txt',
];

// API routes that should be cached (with appropriate strategies)
const API_ROUTES = [
  '/rest/v1/profiles',
  '/rest/v1/user_roles',
  '/rest/v1/user_app_access',
  '/rest/v1/videos',
  '/rest/v1/user_dashboard_preferences',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );

  // Force activation
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all clients
  self.clients.claim();
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase auth requests (handled by Supabase client)
  if (url.hostname.includes('supabase.co') && (
    request.url.includes('/auth/') ||
    request.url.includes('/rest/v1/auth/')
  )) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/rest/v1/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Default: network-first for everything else
  event.respondWith(networkFirstStrategy(request));
});

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);

    // Return offline fallback for certain assets
    if (request.destination === 'image') {
      return new Response('', { status: 404 });
    }

    throw error;
  }
}

// Network-first strategy (for dynamic content)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', error);

    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache');
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/') || new Response('Offline', { status: 503 });
    }

    throw error;
  }
}

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'GET_CACHE_INFO':
      Promise.all([
        caches.open(STATIC_CACHE).then(cache => cache.keys()),
        caches.open(DYNAMIC_CACHE).then(cache => cache.keys())
      ]).then(([staticKeys, dynamicKeys]) => {
        event.ports[0].postMessage({
          staticCache: staticKeys.length,
          dynamicCache: dynamicKeys.length,
          totalCached: staticKeys.length + dynamicKeys.length
        });
      });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();

    // Remove old entries (keep last 50)
    if (keys.length > 50) {
      const keysToDelete = keys.slice(0, keys.length - 50);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
      console.log(`[SW] Cleaned up ${keysToDelete.length} old cache entries`);
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}, 1000 * 60 * 30); // Every 30 minutes

console.log('[SW] Service worker loaded successfully');