// TrackDeni Service Worker
// Version 1.0.0

const CACHE_NAME = 'trackdeni-v1.0.0';
const RUNTIME_CACHE = 'trackdeni-runtime-v1.0.0';

// App Shell - Critical files that should be cached
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.jsx',
  '/src/App.jsx',
  // Add other critical assets here when building
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/firestore\.googleapis\.com/,
  /^https:\/\/identitytoolkit\.googleapis\.com/,
];

// Install event - Cache app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        // Force the new service worker to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests (Firestore, Auth)
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      caches.open(RUNTIME_CACHE)
        .then((cache) => {
          return fetch(request)
            .then((response) => {
              // Cache successful API responses
              if (response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Return cached response if network fails
              return cache.match(request);
            });
        })
    );
    return;
  }

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Fallback to cached index.html for offline navigation
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache successful responses
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'customer-sync') {
    event.waitUntil(syncCustomers());
  }
  
  if (event.tag === 'debt-sync') {
    event.waitUntil(syncDebts());
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from TrackDeni',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore', 
        title: 'Open TrackDeni',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close', 
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('TrackDeni', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync functions (will integrate with your Zustand store)
async function syncCustomers() {
  try {
    console.log('Syncing customers...');
    // This will integrate with your existing sync logic
    // For now, just log that sync was attempted
    return Promise.resolve();
  } catch (error) {
    console.error('Customer sync failed:', error);
    throw error;
  }
}

async function syncDebts() {
  try {
    console.log('Syncing debts...');
    // This will integrate with your existing sync logic
    // For now, just log that sync was attempted  
    return Promise.resolve();
  } catch (error) {
    console.error('Debt sync failed:', error);
    throw error;
  }
}

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CACHE_UPDATE':
        // Handle cache updates
        event.ports[0].postMessage({ success: true });
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('TrackDeni Service Worker loaded successfully'); 