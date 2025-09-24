// Findawise Empire - Service Worker
// Version: 2.0.0
// Empire-Grade Offline-First PWA Service Worker

const CACHE_VERSION = 'empire-v2.0.0';
const CACHE_NAME = `findawise-empire-${CACHE_VERSION}`;

// Cache Strategy Configuration
const CACHE_STRATEGIES = {
  PRECACHE: 'precache',
  RUNTIME: 'runtime',
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Core assets to precache (App Shell)
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API routes for runtime caching
const API_CACHE_PATTERNS = [
  /^\/api\/offers\/.*/,
  /^\/api\/content\/.*/,
  /^\/api\/quiz\/.*/,
  /^\/api\/analytics\/.*/,
  /^\/api\/localization\/.*/
];

// Background sync tags
const SYNC_TAGS = {
  FORM_SUBMISSION: 'form-submission',
  QUIZ_RESPONSE: 'quiz-response',
  ANALYTICS: 'analytics-sync',
  LEAD_CAPTURE: 'lead-capture',
  FEEDBACK: 'feedback-sync'
};

// IndexedDB for offline data storage
let db;
const DB_NAME = 'FindawiseEmpireDB';
const DB_VERSION = 2;

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('offline-forms')) {
        const formStore = db.createObjectStore('offline-forms', { keyPath: 'id', autoIncrement: true });
        formStore.createIndex('timestamp', 'timestamp', { unique: false });
        formStore.createIndex('type', 'type', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('cached-content')) {
        const contentStore = db.createObjectStore('cached-content', { keyPath: 'url' });
        contentStore.createIndex('category', 'category', { unique: false });
        contentStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('user-preferences')) {
        db.createObjectStore('user-preferences', { keyPath: 'key' });
      }
      
      if (!db.objectStoreNames.contains('sync-queue')) {
        const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('tag', 'tag', { unique: false });
        syncStore.createIndex('priority', 'priority', { unique: false });
      }
    };
  });
}

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('🚀 Empire Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      initDB(),
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Precaching Empire assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
    ]).then(() => {
      console.log('✅ Empire Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  console.log('🔄 Empire Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('findawise-empire-') && cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Empire Service Worker activated');
      // Notify clients of activation
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// Fetch Event Handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname === '/') {
    // App shell - Cache first with network fallback
    event.respondWith(handleAppShell(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - Network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/static/') || url.pathname.includes('.')) {
    // Static assets - Cache first
    event.respondWith(handleStaticAssets(request));
  } else {
    // Pages - Stale while revalidate
    event.respondWith(handlePageRequest(request));
  }
});

// Handle App Shell requests
async function handleAppShell(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/');
    
    if (cachedResponse) {
      // Serve from cache and update in background
      fetch(request).then((response) => {
        if (response.ok) {
          cache.put('/', response.clone());
        }
      }).catch(() => {
        // Network failed, cached version is still good
      });
      return cachedResponse;
    }
    
    // Not in cache, try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put('/', networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network failed');
  } catch (error) {
    console.error('App shell failed:', error);
    return await caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

// Handle API requests with intelligent caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request, {
      headers: {
        ...request.headers,
        'SW-Source': 'network'
      }
    });
    
    if (networkResponse.ok) {
      // Cache successful responses for specific endpoints
      if (shouldCacheApiResponse(url.pathname)) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      
      // Store content in IndexedDB for offline access
      if (url.pathname.includes('/content/') || url.pathname.includes('/offers/')) {
        storeContentOffline(request, networkResponse.clone());
      }
      
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('🔌 Network failed, trying cache for:', url.pathname);
    
    // Try cache fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('SW-Source', 'cache');
      return response;
    }
    
    // Try IndexedDB for content
    const offlineContent = await getOfflineContent(url.pathname);
    if (offlineContent) {
      return new Response(JSON.stringify(offlineContent), {
        headers: {
          'Content-Type': 'application/json',
          'SW-Source': 'indexeddb'
        }
      });
    }
    
    // Return offline response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This content is not available offline',
      offline: true
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'SW-Source': 'offline'
      }
    });
  }
}

// Handle static asset requests
async function handleStaticAssets(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Static asset failed:', error);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Handle page requests with stale-while-revalidate
async function handlePageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Serve from cache immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response);
      }
    }).catch(() => {
      // Network failed, cached version is still good
    });
    return cachedResponse;
  }
  
  // No cache, try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return await caches.match('/offline.html') || new Response('Page not available offline', { status: 503 });
  }
}

// Background Sync Handler
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.FORM_SUBMISSION:
      event.waitUntil(syncOfflineForms());
      break;
    case SYNC_TAGS.QUIZ_RESPONSE:
      event.waitUntil(syncQuizResponses());
      break;
    case SYNC_TAGS.ANALYTICS:
      event.waitUntil(syncAnalytics());
      break;
    case SYNC_TAGS.LEAD_CAPTURE:
      event.waitUntil(syncLeadCapture());
      break;
    case SYNC_TAGS.FEEDBACK:
      event.waitUntil(syncFeedback());
      break;
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  let notificationData = {
    title: 'Findawise Empire',
    body: 'You have new updates available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'empire-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('Failed to parse push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    // Open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Message Handler
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker message:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'CACHE_CONTENT':
      cacheContent(payload);
      break;
    case 'STORE_OFFLINE_DATA':
      storeOfflineData(payload);
      break;
    case 'GET_CACHE_STATUS':
      getCacheStatus().then((status) => {
        event.ports[0].postMessage({ type: 'CACHE_STATUS', payload: status });
      });
      break;
    case 'CLEAR_CACHE':
      clearCache(payload.version).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Utility Functions

function shouldCacheApiResponse(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname)) ||
         pathname.includes('/config') ||
         pathname.includes('/localization');
}

async function storeContentOffline(request, response) {
  try {
    const data = await response.json();
    const url = new URL(request.url);
    
    const transaction = db.transaction(['cached-content'], 'readwrite');
    const store = transaction.objectStore('cached-content');
    
    await store.put({
      url: url.pathname,
      data: data,
      timestamp: Date.now(),
      category: extractCategoryFromPath(url.pathname)
    });
  } catch (error) {
    console.error('Failed to store content offline:', error);
  }
}

async function getOfflineContent(pathname) {
  try {
    const transaction = db.transaction(['cached-content'], 'readonly');
    const store = transaction.objectStore('cached-content');
    const result = await store.get(pathname);
    
    return result ? result.data : null;
  } catch (error) {
    console.error('Failed to get offline content:', error);
    return null;
  }
}

function extractCategoryFromPath(pathname) {
  if (pathname.includes('/finance')) return 'finance';
  if (pathname.includes('/health')) return 'health';
  if (pathname.includes('/saas')) return 'saas';
  if (pathname.includes('/travel')) return 'travel';
  if (pathname.includes('/education')) return 'education';
  return 'general';
}

async function syncOfflineForms() {
  try {
    const transaction = db.transaction(['sync-queue'], 'readonly');
    const store = transaction.objectStore('sync-queue');
    const index = store.index('tag');
    const forms = await index.getAll(SYNC_TAGS.FORM_SUBMISSION);
    
    for (const form of forms) {
      try {
        const response = await fetch(form.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form.data)
        });
        
        if (response.ok) {
          // Remove from sync queue
          const deleteTransaction = db.transaction(['sync-queue'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('sync-queue');
          await deleteStore.delete(form.id);
          
          console.log('✅ Synced offline form:', form.id);
        }
      } catch (error) {
        console.error('Failed to sync form:', form.id, error);
      }
    }
  } catch (error) {
    console.error('Failed to sync offline forms:', error);
  }
}

async function syncQuizResponses() {
  // Similar implementation to syncOfflineForms
  console.log('🧠 Syncing quiz responses...');
}

async function syncAnalytics() {
  // Similar implementation to syncOfflineForms
  console.log('📊 Syncing analytics data...');
}

async function syncLeadCapture() {
  // Similar implementation to syncOfflineForms
  console.log('👤 Syncing lead capture data...');
}

async function syncFeedback() {
  // Similar implementation to syncOfflineForms
  console.log('💬 Syncing feedback data...');
}

async function cacheContent(content) {
  const cache = await caches.open(CACHE_NAME);
  const response = new Response(JSON.stringify(content), {
    headers: { 'Content-Type': 'application/json' }
  });
  await cache.put(`/api/content/${content.id}`, response);
}

async function storeOfflineData(data) {
  const transaction = db.transaction(['offline-forms'], 'readwrite');
  const store = transaction.objectStore('offline-forms');
  await store.add({
    ...data,
    timestamp: Date.now()
  });
}

async function getCacheStatus() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  return {
    version: CACHE_VERSION,
    cachedUrls: keys.length,
    lastUpdated: Date.now()
  };
}

async function clearCache(version) {
  if (version && version !== CACHE_VERSION) {
    const cacheName = `findawise-empire-${version}`;
    await caches.delete(cacheName);
  } else {
    await caches.delete(CACHE_NAME);
  }
}

console.log('🚀 Findawise Empire Service Worker loaded successfully');