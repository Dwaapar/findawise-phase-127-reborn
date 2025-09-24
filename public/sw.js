/**
 * Findawise Empire Service Worker
 * Enterprise-grade PWA service worker with AI-driven caching and offline support
 */

const CACHE_NAME = 'findawise-empire-v1.0.0';
const CACHE_VERSION = '1.0.0';
const DATA_CACHE_NAME = 'findawise-data-v1.0.0';

// URLs to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache for offline data access
const API_CACHE_PATTERNS = [
  '/api/config/pages',
  '/api/analytics/overview',
  '/api/health/archetypes',
  '/api/finance/calculators',
  '/api/ai-tools/categories',
  '/api/travel/destinations'
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  '/api/analytics/events',
  '/api/neuron/status',
  '/api/semantic/search',
  '/api/offer-engine/sync'
];

// Cache-first patterns (serve from cache if available)
const CACHE_FIRST_PATTERNS = [
  '/icons/',
  '/screenshots/',
  '/assets/',
  '.css',
  '.js',
  '.woff',
  '.woff2'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Static cache populated successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Cache cleanup completed');
        return self.clients.claim();
      })
      .then(() => {
        // Notify clients that service worker is ready
        return self.clients.matchAll();
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'OFFLINE_READY',
            version: CACHE_VERSION
          });
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Network-first strategy for real-time data
    if (NETWORK_FIRST_PATTERNS.some(pattern => pathname.includes(pattern))) {
      return await handleNetworkFirst(request, DATA_CACHE_NAME);
    }
    
    // Cache-first strategy for configuration data
    if (API_CACHE_PATTERNS.some(pattern => pathname.includes(pattern))) {
      return await handleCacheFirst(request, DATA_CACHE_NAME);
    }
    
    // Default: network-only for other API requests
    return await fetch(request);
    
  } catch (error) {
    console.error('[SW] API request failed:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for critical endpoints
    if (pathname.includes('/api/config/') || pathname.includes('/api/health/')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Offline - Data will sync when connection is restored',
        offline: true,
        timestamp: Date.now()
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    throw error;
  }
}

async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Navigation offline, serving cached page or offline fallback');
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Serve offline page for unknown routes
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback response if offline page is not cached
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Offline - Findawise Empire</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .offline { color: #666; }
        </style>
      </head>
      <body>
        <h1>You're Offline</h1>
        <p class="offline">Please check your internet connection and try again.</p>
        <button onclick="window.location.reload()">Retry</button>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

async function handleStaticRequest(request) {
  const url = new URL(request.url);
  
  // Cache-first for static assets
  if (CACHE_FIRST_PATTERNS.some(pattern => url.pathname.includes(pattern))) {
    return await handleCacheFirst(request, CACHE_NAME);
  }
  
  // Network-first for other requests
  return await handleNetworkFirst(request, CACHE_NAME);
}

async function handleCacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function handleNetworkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'federation-sync') {
    event.waitUntil(syncFederationData());
  }
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData());
  }
});

async function syncFederationData() {
  try {
    console.log('[SW] Syncing federation data...');
    
    // Get any pending federation data from IndexedDB
    const pendingData = await getPendingFederationData();
    
    if (pendingData.length > 0) {
      const response = await fetch('/api/neuron/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingData })
      });
      
      if (response.ok) {
        await clearPendingFederationData();
        console.log('[SW] Federation data synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Federation sync failed:', error);
  }
}

async function syncAnalyticsData() {
  try {
    console.log('[SW] Syncing analytics data...');
    
    // Get any pending analytics from IndexedDB
    const pendingAnalytics = await getPendingAnalyticsData();
    
    if (pendingAnalytics.length > 0) {
      const response = await fetch('/api/analytics/events/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingAnalytics })
      });
      
      if (response.ok) {
        await clearPendingAnalyticsData();
        console.log('[SW] Analytics data synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Analytics sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'Findawise Empire',
    body: 'You have a new update!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'default',
    data: {}
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }
  
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.urgent || false,
    actions: notificationData.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(getCacheStatus().then(status => {
        event.source.postMessage({ type: 'CACHE_STATUS', data: status });
      }));
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {
      caches: cacheNames.length,
      version: CACHE_VERSION,
      timestamp: Date.now()
    };
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = keys.length;
    }
    
    return status;
  } catch (error) {
    console.error('[SW] Failed to get cache status:', error);
    return { error: error.message };
  }
}

// Helper functions for IndexedDB operations (simplified)
async function getPendingFederationData() {
  // In a real implementation, this would use IndexedDB
  return [];
}

async function clearPendingFederationData() {
  // In a real implementation, this would clear IndexedDB data
}

async function getPendingAnalyticsData() {
  // In a real implementation, this would use IndexedDB
  return [];
}

async function clearPendingAnalyticsData() {
  // In a real implementation, this would clear IndexedDB data
}

console.log('[SW] Findawise Empire Service Worker initialized, version:', CACHE_VERSION);